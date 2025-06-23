import { supabase } from '../supabase-client';
import type { Session, User as SupabaseUser } from '@supabase/supabase-js';

// Interface for user registration data
interface RegisterData {
  username: string;
  email: string;
  password: string;
  is_merchant?: boolean;
}

// Interface for login data
interface LoginData {
  identifier: string; // Email
  password: string;
}

// Interface for our application's user data
type User = {
  id: string;
  email: string;
  username: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
  is_merchant: boolean;
  bookmarkedCafes?: any[];
  [key: string]: any; // For other properties that might be returned
};

// Interface for auth state change callback
// events: 'SIGNED_IN', 'SIGNED_OUT', 'USER_UPDATED', 'TOKEN_REFRESHED', 'USER_DELETED' (from Supabase)
// session: The current session object (data) or null
type AuthChangeCallback = (event: string, session: Session | null) => void;

// export the events and sessions so they can be used in other files
export type { User, AuthChangeCallback };

// Convert Supabase user to our User type
const formatUser = async (supabaseUser: SupabaseUser | null): Promise<User | null> => {
  if (!supabaseUser || !supabaseUser.email) return null;
  
  try {
    // Get profile data from profiles table with timeout protection
    const profilePromise = supabase
      .from('profiles')
      .select('*')
      .eq('id', supabaseUser.id)
      .single();
    
    // Add a timeout to prevent hanging
    const timeoutPromise = new Promise<{data: null}>((_, reject) => {
      setTimeout(() => {
        console.warn('Profile fetch timed out, using fallback data');
        reject(new Error('Profile fetch timeout'));
      }, 5000);
    });
    
    // Race the query against the timeout
    const { data: profile } = await Promise.race([
      profilePromise,
      timeoutPromise
    ]).catch(() => ({ data: null })); // Fallback to null if either promise rejects
    
    return {
      id: supabaseUser.id,
      email: supabaseUser.email,
      username: profile?.username || supabaseUser.user_metadata?.username || supabaseUser.email.split('@')[0], // for future social logins
      created_at: supabaseUser.created_at || new Date().toISOString(),
      updated_at: profile?.updated_at || supabaseUser.updated_at || new Date().toISOString(),
      avatar_url: profile?.avatar_url || supabaseUser.user_metadata?.avatar_url || '',
      is_merchant: profile?.is_merchant || false,
    };
  } catch (error) {
    console.error('Error formatting user:', error);
    // Return basic user info without profile data
    return {
      id: supabaseUser.id,
      email: supabaseUser.email,
      username: supabaseUser.user_metadata?.username || supabaseUser.email.split('@')[0],
      created_at: supabaseUser.created_at || new Date().toISOString(),
      updated_at: supabaseUser.updated_at || new Date().toISOString(),
      avatar_url: supabaseUser.user_metadata?.avatar_url || '',
      is_merchant: false,
    };
  }
};

// Authentication service methods
const authService = {
  // Register a new user
  register: async (data: RegisterData) => {
    try {
      const { data: authData, error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            username: data.username,
            //email: data.email commented for future additions
          }
        }
      });

      if (error) throw error;
      
      // The user object is available immediately, but might need email confirmation
      const formattedUser = await formatUser(authData.user);
      
      return {
        user: formattedUser,
        session: authData.session,
        message: !authData.session ? 'Please check your email to confirm your registration.' : undefined // to add in the future - need pay Supabase to send emails
      };
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  },

  // Login user
  login: async (data: LoginData) => {
    const { data: authData, error } = await supabase.auth.signInWithPassword({
      email: data.identifier,
      password: data.password
    });
    
    if (error) throw error;
    
    if (!authData.session || !authData.user) {
      throw new Error('No session or user data returned');
    }
      
      return {
        user: await formatUser(authData.user),
        session: authData.session
      };
  },

  // Logout user
  logout: async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  },
  
  // Get current session
  getSession: async () => {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) {
      console.error('Error getting session:', error);
      return null;
    }
    return session;
  },
  
  // Get current user
  getCurrentUser: async (): Promise<User | null> => {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error || !user) return null;
      
      return formatUser(user);
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  },
  
  // Check if user is logged in
  isLoggedIn: async (): Promise<boolean> => {
    const { data: { session } } = await supabase.auth.getSession();
    return !!session;
  },

  // Get user's profile picture
  getUserAvatar: (user: User | null): string => {
    // If user has an avatar, return the URL, otherwise return default avatar
    return user?.avatar_url || 'icons/default-avatar.svg';
  },
  
  // Subscribe to auth state changes
  onAuthStateChange: (callback: AuthChangeCallback) => {
    return supabase.auth.onAuthStateChange(callback);
  },
  
  // Update user profile
  updateProfile: async (updates: Partial<User>): Promise<User | null> => { // this is what strapi cant do in 300 lines done in just 40 lines
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        throw new Error('User not authenticated');
      }

      // Update the profile in the profiles table
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          username: updates.username,
          avatar_url: updates.avatar_url,
          is_merchant: updates.is_merchant,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (updateError) throw updateError;

      // Get the updated user data
      return formatUser(user);
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  },

  // Initialize user profile after registration (called after authentication is complete)
  initializeProfile: async (username: string, is_merchant: boolean = false): Promise<void> => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        throw new Error('User not authenticated');
      }

      console.log('Initializing profile for authenticated user with merchant flag:', is_merchant);
      
      // First, check if profile already exists
      const { data: existingProfile, error: fetchError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
        
      console.log('Existing profile before update:');
      console.log('Full profile object:', JSON.stringify(existingProfile, null, 2));
      console.log('Profile keys:', Object.keys(existingProfile || {}));

      if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error('Error checking existing profile:', fetchError);
        throw fetchError;
      }

      let profileError;
      
      if (existingProfile) {
        // Profile exists, update it
        console.log('Profile exists, updating with merchant flag:', is_merchant);
        const updateData = {
          username: username,
          is_merchant: is_merchant,
          updated_at: new Date().toISOString()
        };
        console.log('Update data being sent:', updateData);
        
        const { data: updatedProfile, error } = await supabase
          .from('profiles')
          .update(updateData)
          .eq('id', user.id)
          .select();
          
        console.log('Updated profile result:', updatedProfile);
        if (error) {
          console.error('Update error:', error);
        }
        if (!updatedProfile || updatedProfile.length === 0) {
          console.warn('Update returned no rows - this might indicate the column does not exist or RLS is blocking the update');
        }
        profileError = error;
      } else {
        // Profile doesn't exist, try to insert
        console.log('Profile does not exist, creating new profile with merchant flag:', is_merchant);
        const { error } = await supabase
          .from('profiles')
          .insert({
            id: user.id,
            username: username,
            is_merchant: is_merchant,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
        profileError = error;
      }

      if (profileError) {
        console.error('Profile initialization error:', profileError);
        throw profileError;
      }
      
      console.log('Profile initialized successfully with merchant flag:', is_merchant);
    } catch (error) {
      console.error('Error initializing profile:', error);
      throw error;
    }
  }
};

export default authService;
