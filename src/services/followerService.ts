import { supabase } from '../supabase-client';
import type { User } from './authService';

// Types for follower relationships
export interface FollowerRelationship {
  id: string;
  follower_id: string;
  following_id: string;
  created_at: string;
}

export interface FollowerStats {
  followers_count: number;
  following_count: number;
}

export interface UserWithFollowerInfo extends User {
  followers_count?: number;
  following_count?: number;
  is_following?: boolean;
  is_followed_by?: boolean;
}

// Follower service for managing follow relationships
const followerService = {
  // Follow a user
  followUser: async (followingId: string): Promise<{ success: boolean; message: string; relationship?: FollowerRelationship }> => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        throw new Error('User not authenticated');
      }

      if (user.id === followingId) {
        return { success: false, message: 'Cannot follow yourself' };
      }

      // Check if already following
      const { data: existing, error: checkError } = await supabase
        .from('followers')
        .select('*')
        .eq('follower_id', user.id)
        .eq('following_id', followingId)
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        throw checkError;
      }

      if (existing) {
        return { success: false, message: 'Already following this user' };
      }

      // Create follow relationship
      const { data: relationship, error: followError } = await supabase
        .from('followers')
        .insert({
          follower_id: user.id,
          following_id: followingId
        })
        .select()
        .single();

      if (followError) throw followError;

      return { 
        success: true, 
        message: 'Successfully followed user',
        relationship: relationship as FollowerRelationship
      };
    } catch (error) {
      console.error('Error following user:', error);
      throw error;
    }
  },

  // Unfollow a user
  unfollowUser: async (followingId: string): Promise<{ success: boolean; message: string }> => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        throw new Error('User not authenticated');
      }

      // Remove follow relationship
      const { error: unfollowError } = await supabase
        .from('followers')
        .delete()
        .eq('follower_id', user.id)
        .eq('following_id', followingId);

      if (unfollowError) throw unfollowError;

      return { success: true, message: 'Successfully unfollowed user' };
    } catch (error) {
      console.error('Error unfollowing user:', error);
      throw error;
    }
  },

  // Toggle follow status
  toggleFollow: async (followingId: string): Promise<{ success: boolean; message: string; is_following: boolean }> => {
    try {
      const isFollowing = await followerService.isFollowing(followingId);
      
      if (isFollowing) {
        const result = await followerService.unfollowUser(followingId);
        return { ...result, is_following: false };
      } else {
        const result = await followerService.followUser(followingId);
        return { ...result, is_following: true };
      }
    } catch (error) {
      console.error('Error toggling follow:', error);
      throw error;
    }
  },

  // Check if current user is following a specific user
  isFollowing: async (followingId: string): Promise<boolean> => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        return false;
      }

      const { data, error } = await supabase
        .from('followers')
        .select('id')
        .eq('follower_id', user.id)
        .eq('following_id', followingId)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      return !!data;
    } catch (error) {
      console.error('Error checking follow status:', error);
      return false;
    }
  },

  // Get follower stats for a user
  getFollowerStats: async (userId: string): Promise<FollowerStats> => {
    try {
      const [followersResult, followingResult] = await Promise.all([
        supabase
          .from('followers')
          .select('id', { count: 'exact' })
          .eq('following_id', userId),
        supabase
          .from('followers')
          .select('id', { count: 'exact' })
          .eq('follower_id', userId)
      ]);

      const followers_count = followersResult.count || 0;
      const following_count = followingResult.count || 0;

      return { followers_count, following_count };
    } catch (error) {
      console.error('Error getting follower stats:', error);
      return { followers_count: 0, following_count: 0 };
    }
  },

  // Get users who follow a specific user
  getFollowers: async (userId: string, limit: number = 20, offset: number = 0): Promise<UserWithFollowerInfo[]> => {
    try {
      const { data, error } = await supabase
        .from('followers')
        .select(`
          id,
          created_at,
          follower_id,
          profiles!followers_follower_id_fkey (
            id,
            username,
            avatar_url,
            is_merchant,
            created_at,
            updated_at
          )
        `)
        .eq('following_id', userId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;

      // Get current user for follow status checking
      const { data: { user: currentUser } } = await supabase.auth.getUser();

      const followers = await Promise.all(
        (data || []).map(async (relationship) => {
          const profile = relationship.profiles;
          if (!profile) return null;

          const followerStats = await followerService.getFollowerStats(profile.id);
          const is_following = currentUser ? await followerService.isFollowing(profile.id) : false;

          return {
            id: profile.id,
            username: profile.username,
            email: '', // Not exposed in public follower lists
            avatar_url: profile.avatar_url,
            is_merchant: profile.is_merchant,
            created_at: profile.created_at,
            updated_at: profile.updated_at,
            followers_count: followerStats.followers_count,
            following_count: followerStats.following_count,
            is_following,
            is_followed_by: true // They follow the user we're viewing
          };
        })
      );

      return followers.filter(Boolean) as UserWithFollowerInfo[];
    } catch (error) {
      console.error('Error getting followers:', error);
      return [];
    }
  },

  // Get users that a specific user follows
  getFollowing: async (userId: string, limit: number = 20, offset: number = 0): Promise<UserWithFollowerInfo[]> => {
    try {
      const { data, error } = await supabase
        .from('followers')
        .select(`
          id,
          created_at,
          following_id,
          profiles!followers_following_id_fkey (
            id,
            username,
            avatar_url,
            is_merchant,
            created_at,
            updated_at
          )
        `)
        .eq('follower_id', userId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;

      // Get current user for follow status checking
      const { data: { user: currentUser } } = await supabase.auth.getUser();

      const following = await Promise.all(
        (data || []).map(async (relationship) => {
          const profile = relationship.profiles;
          if (!profile) return null;

          const followerStats = await followerService.getFollowerStats(profile.id);
          const is_following = currentUser ? await followerService.isFollowing(profile.id) : false;
          const is_followed_by = currentUser ? await followerService.isFollowedBy(profile.id) : false;

          return {
            id: profile.id,
            username: profile.username,
            email: '', // Not exposed in public following lists
            avatar_url: profile.avatar_url,
            is_merchant: profile.is_merchant,
            created_at: profile.created_at,
            updated_at: profile.updated_at,
            followers_count: followerStats.followers_count,
            following_count: followerStats.following_count,
            is_following: true, // The user we're viewing follows them
            is_followed_by
          };
        })
      );

      return following.filter(Boolean) as UserWithFollowerInfo[];
    } catch (error) {
      console.error('Error getting following:', error);
      return [];
    }
  },

  // Check if a user is followed by current user
  isFollowedBy: async (userId: string): Promise<boolean> => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        return false;
      }

      const { data, error } = await supabase
        .from('followers')
        .select('id')
        .eq('follower_id', userId)
        .eq('following_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      return !!data;
    } catch (error) {
      console.error('Error checking if followed by user:', error);
      return false;
    }
  },

  // Get mutual followers (users who follow both current user and target user)
  getMutualFollowers: async (userId: string, limit: number = 10): Promise<UserWithFollowerInfo[]> => {
    try {
      const { data: { user: currentUser }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !currentUser) {
        return [];
      }

      // Get followers of both users and find intersection
      const { data, error } = await supabase
        .from('followers')
        .select(`
          follower_id,
          profiles!followers_follower_id_fkey (
            id,
            username,
            avatar_url,
            is_merchant,
            created_at,
            updated_at
          )
        `)
        .eq('following_id', userId)
        .in('follower_id', 
          supabase
            .from('followers')
            .select('follower_id')
            .eq('following_id', currentUser.id)
        )
        .limit(limit);

      if (error) throw error;

      const mutualFollowers = await Promise.all(
        (data || []).map(async (relationship) => {
          const profile = relationship.profiles;
          if (!profile) return null;

          const followerStats = await followerService.getFollowerStats(profile.id);

          return {
            id: profile.id,
            username: profile.username,
            email: '',
            avatar_url: profile.avatar_url,
            is_merchant: profile.is_merchant,
            created_at: profile.created_at,
            updated_at: profile.updated_at,
            followers_count: followerStats.followers_count,
            following_count: followerStats.following_count,
            is_following: true,
            is_followed_by: true
          };
        })
      );

      return mutualFollowers.filter(Boolean) as UserWithFollowerInfo[];
    } catch (error) {
      console.error('Error getting mutual followers:', error);
      return [];
    }
  }
};

export default followerService;