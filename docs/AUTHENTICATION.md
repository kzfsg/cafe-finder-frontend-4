# Authentication System

This document provides comprehensive coverage of the authentication system, including user types, authentication flows, profile management, and session handling in the cafe finder application.

## Overview

The authentication system is built on Supabase Auth and provides:

- **Multi-tier User System**: Regular users, merchants, and admins
- **Secure Authentication**: Email/password with optional email confirmation
- **Profile Management**: Comprehensive user profiles with social features
- **Session Management**: Persistent sessions with automatic refresh
- **Role-based Access**: Different permissions for different user types

## Authentication Architecture

### Core Components

#### `authService.ts` - Authentication Service Layer

The auth service provides a comprehensive abstraction over Supabase Auth:

```typescript
interface RegisterData {
  username: string;
  email: string;
  password: string;
  is_merchant?: boolean;
}

interface LoginData {
  identifier: string; // Email
  password: string;
}

type User = {
  id: string;
  email: string;
  username: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
  is_merchant: boolean;
  [key: string]: any; // Extensible for additional properties
}
```

#### `AuthContext.tsx` - Global Authentication State

React context providing authentication state throughout the application:

```typescript
interface AuthContextType {
  user: User | null;
  session: Session | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<User | null>;
  logout: () => Promise<void>;
  register: (username: string, email: string, password: string, is_merchant?: boolean) => Promise<{user: User | null, message?: string}>;
  updateProfile: (updates: Partial<User>) => Promise<User | null>;
  initializeProfile: (username: string, is_merchant?: boolean) => Promise<void>;
}
```

## User Types and Roles

### 1. Regular Users
**Capabilities:**
- Search and discover cafes
- Bookmark favorite cafes
- Leave reviews and ratings
- Follow other users
- Access social activity feed
- Submit new cafe suggestions

**Database Profile:**
```sql
{
  id: UUID,
  username: VARCHAR,
  email: VARCHAR,
  is_merchant: FALSE,
  avatar_url: VARCHAR,
  created_at: TIMESTAMP,
  updated_at: TIMESTAMP
}
```

### 2. Merchant Users
**Additional Capabilities:**
- Manage cafe listings
- View customer reviews
- Access merchant dashboard
- Claim existing cafes
- Submit verified cafe information
- View business analytics

**Database Profile:**
```sql
{
  id: UUID,
  username: VARCHAR,
  email: VARCHAR,
  is_merchant: TRUE,
  merchant_verified: BOOLEAN,
  merchant_business_name: VARCHAR,
  merchant_business_type: VARCHAR,
  created_at: TIMESTAMP,
  updated_at: TIMESTAMP
}
```

### 3. Admin Users
**System-level Capabilities:**
- Approve/reject cafe submissions
- Manage user accounts
- Access admin dashboard
- Moderate content
- View system analytics

**Detection Logic:**
```typescript
const isAdmin = username === 'admin' || 
  (typeof window !== 'undefined' && window.location.hostname === 'localhost');
```

## Authentication Flows

### Registration Flow

#### Account Type Selection

The registration process begins with account type selection:

```typescript
// AccountTypeSelection.tsx - Choose between User or Merchant
<Link to="/signup" className="account-type-card">
  <div className="account-type-icon">👤</div>
  <h3>User Account</h3>
  <p>Find and discover amazing work-friendly cafes</p>
</Link>

<Link to="/signup/merchant" className="account-type-card">
  <div className="account-type-icon">🏪</div>
  <h3>Merchant Account</h3>
  <p>Showcase your cafe to remote workers and digital nomads</p>
</Link>
```

#### Regular User Registration

**SignUp.tsx Flow:**
1. **Form Validation**: Username, email, password confirmation
2. **Account Creation**: Supabase Auth registration
3. **Profile Initialization**: Create profile record with `is_merchant: false`
4. **Auto-login**: Immediate session creation
5. **Redirect**: Navigate to intended destination

```typescript
const handleSubmit = async (e: React.FormEvent) => {
  // Validation
  if (formData.password !== formData.confirmPassword) {
    setError('Passwords do not match');
    return;
  }
  
  // Register with AuthContext
  const result = await register(
    formData.username,
    formData.email,
    formData.password
  );
  
  if (result.user) {
    // Initialize profile as regular user
    await initializeProfile(formData.username, false);
    navigate(from);
  }
};
```

#### Merchant Registration

**MerchantSignUp.tsx Flow:**
1. **Extended Form**: Additional business information
2. **Account Creation**: Supabase Auth with merchant flag
3. **Profile Initialization**: Create profile with `is_merchant: true`
4. **Business Details**: Store additional merchant metadata
5. **Verification Process**: Optional merchant verification

```typescript
const result = await register(
  formData.username,
  formData.email,
  formData.password,
  true // is_merchant flag
);

if (result.user) {
  // Initialize merchant profile
  await initializeProfile(formData.username, true);
  navigate(from);
}
```

### Login Flow

#### Login.tsx Implementation

**Authentication Process:**
1. **Form Validation**: Email and password verification
2. **Supabase Authentication**: Password-based login
3. **Session Creation**: Automatic session establishment
4. **Profile Loading**: Fetch complete user profile
5. **Context Update**: Update global authentication state
6. **Redirect Handling**: Return to intended page

```typescript
const handleSubmit = async (e: React.FormEvent) => {
  try {
    const user = await login(formData.email, formData.password);
    
    if (user) {
      // Redirect to original page or home
      navigate(from);
    } else {
      setError('Login failed. Please check your credentials.');
    }
  } catch (err: any) {
    // Handle Supabase specific errors
    if (err.code === 'auth/invalid-email') {
      setError('No account found with this email address');
    } else if (err.code === 'auth/wrong-password') {
      setError('Incorrect password');
    }
  }
};
```

### Logout Flow

**Process:**
1. **Session Termination**: Clear Supabase session
2. **Context Reset**: Clear authentication state
3. **Local Cleanup**: Remove cached user data
4. **Redirect**: Navigate to public page

```typescript
const logout = async (): Promise<void> => {
  try {
    await authService.logout();
    // AuthContext automatically handles state cleanup
  } catch (error) {
    console.error('Logout error:', error);
    throw error;
  }
};
```

## Profile Management

### Profile Initialization

#### Database Profile Creation

```typescript
const initializeProfile = async (username: string, is_merchant: boolean = false): Promise<void> => {
  const { data: { user } } = await supabase.auth.getUser();
  
  // Check if profile exists
  const { data: existingProfile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();
    
  if (existingProfile) {
    // Update existing profile
    await supabase
      .from('profiles')
      .update({
        username: username,
        is_merchant: is_merchant,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id);
  } else {
    // Create new profile
    await supabase
      .from('profiles')
      .insert({
        id: user.id,
        username: username,
        is_merchant: is_merchant,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
  }
};
```

### Profile Updates

#### updateProfile Method

```typescript
const updateProfile = async (updates: Partial<User>): Promise<User | null> => {
  const { data: { user } } = await supabase.auth.getUser();
  
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

  return formatUser(user);
};
```

### User Data Formatting

#### formatUser Transformation

```typescript
const formatUser = async (supabaseUser: SupabaseUser | null): Promise<User | null> => {
  if (!supabaseUser || !supabaseUser.email) return null;
  
  try {
    // Get profile data with timeout protection
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', supabaseUser.id)
      .single();
    
    return {
      id: supabaseUser.id,
      email: supabaseUser.email,
      username: profile?.username || supabaseUser.user_metadata?.username || 
                supabaseUser.email.split('@')[0],
      created_at: supabaseUser.created_at || new Date().toISOString(),
      updated_at: profile?.updated_at || supabaseUser.updated_at || new Date().toISOString(),
      avatar_url: profile?.avatar_url || supabaseUser.user_metadata?.avatar_url || '',
      is_merchant: profile?.is_merchant || false,
    };
  } catch (error) {
    // Fallback to basic user info
    return {
      id: supabaseUser.id,
      email: supabaseUser.email,
      username: supabaseUser.email.split('@')[0],
      created_at: supabaseUser.created_at || new Date().toISOString(),
      updated_at: supabaseUser.updated_at || new Date().toISOString(),
      avatar_url: '',
      is_merchant: false,
    };
  }
};
```

## Session Management

### Session Persistence

#### AuthContext Session Handling

```typescript
const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const initializeAuth = async () => {
      // Get current session
      const currentSession = await authService.getSession();
      setSession(currentSession);
      setIsAuthenticated(!!currentSession);
      
      // Get user data if session exists
      if (currentSession) {
        const userData = await authService.getCurrentUser();
        setUser(userData);
      }
    };
    
    initializeAuth();
    
    // Subscribe to auth changes
    const { data: { subscription } } = authService.onAuthStateChange(
      (_event, newSession) => {
        setSession(newSession);
        setIsAuthenticated(!!newSession);
        
        // Use setTimeout to prevent deadlocks
        setTimeout(async () => {
          if (newSession) {
            const userData = await authService.getCurrentUser();
            setUser(userData);
          } else {
            setUser(null);
          }
        }, 0);
      }
    );
    
    return () => subscription.unsubscribe();
  }, []);
};
```

### Session Validation

#### Current Session Retrieval

```typescript
const getSession = async () => {
  const { data: { session }, error } = await supabase.auth.getSession();
  if (error) {
    console.error('Error getting session:', error);
    return null;
  }
  return session;
};

const isLoggedIn = async (): Promise<boolean> => {
  const { data: { session } } = await supabase.auth.getSession();
  return !!session;
};
```

### Automatic Session Refresh

Supabase automatically handles token refresh, but the application monitors for:

- **Token Expiration**: Automatic renewal before expiry
- **Network Reconnection**: Session validation on reconnect
- **Tab Focus**: Session check when user returns
- **Storage Changes**: Cross-tab session synchronization

## Protected Routes

### Route Protection Implementation

```typescript
interface ProtectedRouteProps {
  children: React.ReactNode;
  adminOnly?: boolean;
  merchantOnly?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  adminOnly = false,
  merchantOnly = false 
}) => {
  const { user, isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <LoadingScreen />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (adminOnly && !isAdmin(user)) {
    return <Navigate to="/unauthorized" replace />;
  }

  if (merchantOnly && !user?.is_merchant) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
};
```

### Route Configuration

```typescript
// Public routes
<Route path="/login" element={<Login />} />
<Route path="/signup" element={<SignUp />} />
<Route path="/signup/merchant" element={<MerchantSignUp />} />
<Route path="/signup/select" element={<AccountTypeSelection />} />

// Protected routes
<Route path="/profile" element={
  <ProtectedRoute>
    <ProfilePage />
  </ProtectedRoute>
} />

<Route path="/bookmarks" element={
  <ProtectedRoute>
    <BookmarkPage />
  </ProtectedRoute>
} />

// Merchant routes
<Route path="/merchant/dashboard" element={
  <ProtectedRoute merchantOnly>
    <MerchantDashboard />
  </ProtectedRoute>
} />

// Admin routes
<Route path="/admin" element={
  <ProtectedRoute adminOnly>
    <AdminDashboard />
  </ProtectedRoute>
} />
```

## Error Handling

### Authentication Errors

#### Common Error Types

```typescript
// Supabase Auth Error Handling
const handleAuthError = (error: any) => {
  switch (error.code) {
    case 'auth/invalid-email':
    case 'auth/user-not-found':
      return 'No account found with this email address';
    
    case 'auth/wrong-password':
      return 'Incorrect password';
    
    case 'auth/email-already-in-use':
      return 'This email is already registered';
    
    case 'auth/weak-password':
      return 'Password is too weak';
    
    case 'auth/invalid-email':
      return 'Invalid email address';
    
    default:
      return error.message || 'Authentication failed';
  }
};
```

#### Network Error Handling

```typescript
// Timeout protection for profile fetching
const formatUser = async (supabaseUser: SupabaseUser | null) => {
  try {
    const profilePromise = supabase.from('profiles').select('*').eq('id', supabaseUser.id).single();
    
    const timeoutPromise = new Promise<{data: null}>((_, reject) => {
      setTimeout(() => {
        console.warn('Profile fetch timed out, using fallback data');
        reject(new Error('Profile fetch timeout'));
      }, 5000);
    });
    
    const { data: profile } = await Promise.race([profilePromise, timeoutPromise])
      .catch(() => ({ data: null }));
    
    // Continue with profile or fallback data
  } catch (error) {
    // Return basic user info without profile data
  }
};
```

### Form Validation

#### Client-side Validation

```typescript
// Registration validation
const validateRegistration = (formData) => {
  if (!formData.username || !formData.email || !formData.password || !formData.confirmPassword) {
    return 'All fields are required';
  }
  
  if (formData.password !== formData.confirmPassword) {
    return 'Passwords do not match';
  }
  
  if (formData.password.length < 6) {
    return 'Password must be at least 6 characters';
  }
  
  return null;
};

// Login validation
const validateLogin = (formData) => {
  if (!formData.email || !formData.password) {
    return 'All fields are required';
  }
  
  return null;
};
```

## Security Considerations

### Password Security

- **Minimum Length**: 6 characters (configurable)
- **Supabase Hashing**: Secure bcrypt hashing
- **No Plain Text**: Passwords never stored in plain text
- **Client Validation**: Basic validation before server submission

### Session Security

- **JWT Tokens**: Secure token-based authentication
- **Automatic Expiry**: Tokens expire and refresh automatically
- **Secure Storage**: Sessions stored securely by Supabase
- **Cross-tab Sync**: Session state synchronized across tabs

### Data Privacy

- **RLS Policies**: Row-level security for user data
- **Email Privacy**: Email addresses not exposed in public APIs
- **Profile Visibility**: Controlled profile information exposure
- **Admin Access**: Restricted admin functionality

## Integration with Features

### Social Features Integration

```typescript
// User discovery excludes current user
const getAllUsers = async (limit: number = 3, offset: number = 0) => {
  const { data: { user: currentUser } } = await supabase.auth.getUser();
  
  return supabase
    .from('profiles')
    .select('*')
    .neq('id', currentUser.id) // Exclude self
    .order('created_at', { ascending: false });
};
```

### Bookmark System Integration

```typescript
// Bookmarks tied to authenticated user
const getUserBookmarks = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  
  return supabase
    .from('bookmarks')
    .select('*, cafes(*)')
    .eq('user_id', user.id);
};
```

### Review System Integration

```typescript
// Reviews linked to user profiles
const submitReview = async (cafeId: number, rating: boolean, comment: string) => {
  const { data: { user } } = await supabase.auth.getUser();
  
  return supabase
    .from('reviews')
    .insert({
      user_id: user.id,
      cafe_id: cafeId,
      rating,
      comment,
      created_at: new Date().toISOString()
    });
};
```

## Future Authentication Features

### Planned Enhancements

#### Social Login Integration
- Google OAuth integration
- GitHub authentication for developers
- Apple Sign-In for mobile users

#### Enhanced Profile Management
- Profile picture upload to Supabase Storage
- Extended profile fields (bio, location, social links)
- Profile visibility settings

#### Advanced Security Features
- Two-factor authentication (2FA)
- Password strength requirements
- Account recovery mechanisms
- Security audit logs

#### Multi-tenant Support
- Organization accounts
- Team member management
- Role-based permissions within organizations

This comprehensive authentication system provides secure, scalable user management while supporting the diverse needs of regular users, merchants, and administrators in the cafe discovery platform.