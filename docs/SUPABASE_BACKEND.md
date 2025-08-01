# Cafe Finder - Supabase Backend Documentation

## Overview

The Cafe Finder application uses Supabase as a Backend-as-a-Service (BaaS) solution, providing PostgreSQL database, authentication, file storage, and real-time subscriptions. This document outlines the complete backend architecture, database schema, security policies, and configuration requirements.

## Environment Configuration

### Required Environment Variables

#### Web Application (.env)
```bash
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anonymous-key-here
```

#### React Native Application (.env)
```bash
# Supabase Configuration (same as web)
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anonymous-key-here
```

### Supabase Client Configuration

```typescript
// Shared configuration for both web and mobile
const supabaseConfig = {
  auth: {
    persistSession: true,        // Persist auth session
    autoRefreshToken: true,      // Automatically refresh tokens
    detectSessionInUrl: true,    // Handle OAuth callbacks
    storageKey: 'supabase.auth.token'
  }
}

// Web implementation
import { createClient } from '@supabase/supabase-js'
export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
  supabaseConfig
)

// React Native implementation
import 'react-native-url-polyfill/auto'
import { createClient } from '@supabase/supabase-js'
import AsyncStorage from '@react-native-async-storage/async-storage'

export const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
  {
    ...supabaseConfig,
    auth: {
      ...supabaseConfig.auth,
      storage: AsyncStorage // Use AsyncStorage for React Native
    }
  }
)
```

## Database Schema

### Core Tables

#### 1. `profiles` Table
User profile information linked to Supabase Auth users.

```sql
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  avatar_url TEXT,
  is_merchant BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  followers_count INTEGER DEFAULT 0,
  following_count INTEGER DEFAULT 0
);

-- Indexes
CREATE INDEX idx_profiles_username ON profiles(username);
CREATE INDEX idx_profiles_is_merchant ON profiles(is_merchant);
```

#### 2. `cafes` Table
Main cafe information with JSON location data.

```sql
CREATE TABLE cafes (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  location JSONB NOT NULL, -- {city, address, country, latitude?, longitude?}
  wifi BOOLEAN DEFAULT FALSE,
  powerOutletAvailable BOOLEAN DEFAULT FALSE,
  seatingCapacity TEXT,
  noiseLevel TEXT,
  priceRange TEXT,
  upvotes INTEGER DEFAULT 0,
  downvotes INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_cafes_name ON cafes(name);
CREATE INDEX idx_cafes_location_city ON cafes USING GIN ((location->>'city'));
CREATE INDEX idx_cafes_location_country ON cafes USING GIN ((location->>'country'));
CREATE INDEX idx_cafes_wifi ON cafes(wifi);
CREATE INDEX idx_cafes_power ON cafes(powerOutletAvailable);
CREATE INDEX idx_cafes_upvotes ON cafes(upvotes DESC);
```

#### 3. `bookmarks` Table
User's saved cafes.

```sql
CREATE TABLE bookmarks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  cafe_id INTEGER REFERENCES cafes(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, cafe_id)
);

-- Indexes
CREATE INDEX idx_bookmarks_user_id ON bookmarks(user_id);
CREATE INDEX idx_bookmarks_cafe_id ON bookmarks(cafe_id);
CREATE INDEX idx_bookmarks_created_at ON bookmarks(created_at DESC);
```

#### 4. `reviews` Table
User reviews with boolean rating system.

```sql
CREATE TABLE reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  cafe_id INTEGER REFERENCES cafes(id) ON DELETE CASCADE NOT NULL,
  rating BOOLEAN NOT NULL, -- true for positive, false for negative
  comment TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, cafe_id) -- One review per user per cafe
);

-- Indexes
CREATE INDEX idx_reviews_user_id ON reviews(user_id);
CREATE INDEX idx_reviews_cafe_id ON reviews(cafe_id);
CREATE INDEX idx_reviews_rating ON reviews(rating);
CREATE INDEX idx_reviews_created_at ON reviews(created_at DESC);
```

#### 5. `followers` Table
Social following relationships.

```sql
CREATE TABLE followers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  follower_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  following_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(follower_id, following_id),
  CHECK(follower_id != following_id) -- Users cannot follow themselves
);

-- Indexes
CREATE INDEX idx_followers_follower_id ON followers(follower_id);
CREATE INDEX idx_followers_following_id ON followers(following_id);
CREATE INDEX idx_followers_created_at ON followers(created_at DESC);
```

#### 6. `user_upvotes` Table
User upvotes for cafes.

```sql
CREATE TABLE user_upvotes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  cafe_id INTEGER REFERENCES cafes(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, cafe_id)
);

-- Indexes
CREATE INDEX idx_user_upvotes_user_id ON user_upvotes(user_id);
CREATE INDEX idx_user_upvotes_cafe_id ON user_upvotes(cafe_id);
CREATE INDEX idx_user_upvotes_created_at ON user_upvotes(created_at DESC);
```

#### 7. `user_downvotes` Table
User downvotes for cafes.

```sql
CREATE TABLE user_downvotes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  cafe_id INTEGER REFERENCES cafes(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, cafe_id)
);

-- Indexes
CREATE INDEX idx_user_downvotes_user_id ON user_downvotes(user_id);
CREATE INDEX idx_user_downvotes_cafe_id ON user_downvotes(cafe_id);
CREATE INDEX idx_user_downvotes_created_at ON user_downvotes(created_at DESC);
```

#### 8. `cafe_submissions` Table
User-submitted cafes pending admin approval.

```sql
CREATE TABLE cafe_submissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  submitted_by UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  location JSONB NOT NULL, -- Same structure as cafes table
  wifi BOOLEAN DEFAULT FALSE,
  powerOutletAvailable BOOLEAN DEFAULT FALSE,
  seatingCapacity TEXT,
  noiseLevel TEXT,
  priceRange TEXT,
  image_urls TEXT[] DEFAULT '{}', -- Array of image URLs
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by UUID REFERENCES profiles(id),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  admin_notes TEXT,
  rejection_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_cafe_submissions_submitted_by ON cafe_submissions(submitted_by);
CREATE INDEX idx_cafe_submissions_status ON cafe_submissions(status);
CREATE INDEX idx_cafe_submissions_created_at ON cafe_submissions(created_at DESC);
```

## Database Functions and Triggers

### Auto-update Profile Counters

```sql
-- Function to update follower counts
CREATE OR REPLACE FUNCTION update_follower_counts()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Increment following count for follower
    UPDATE profiles 
    SET following_count = following_count + 1 
    WHERE id = NEW.follower_id;
    
    -- Increment followers count for followed user
    UPDATE profiles 
    SET followers_count = followers_count + 1 
    WHERE id = NEW.following_id;
    
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    -- Decrement counts
    UPDATE profiles 
    SET following_count = following_count - 1 
    WHERE id = OLD.follower_id;
    
    UPDATE profiles 
    SET followers_count = followers_count - 1 
    WHERE id = OLD.following_id;
    
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger for follower count updates
CREATE TRIGGER trigger_update_follower_counts
  AFTER INSERT OR DELETE ON followers
  FOR EACH ROW EXECUTE FUNCTION update_follower_counts();
```

### Auto-update Cafe Vote Counts

```sql
-- Function to update cafe vote counts
CREATE OR REPLACE FUNCTION update_cafe_vote_counts()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF TG_TABLE_NAME = 'user_upvotes' THEN
      UPDATE cafes SET upvotes = upvotes + 1 WHERE id = NEW.cafe_id;
    ELSIF TG_TABLE_NAME = 'user_downvotes' THEN
      UPDATE cafes SET downvotes = downvotes + 1 WHERE id = NEW.cafe_id;
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    IF TG_TABLE_NAME = 'user_upvotes' THEN
      UPDATE cafes SET upvotes = upvotes - 1 WHERE id = OLD.cafe_id;
    ELSIF TG_TABLE_NAME = 'user_downvotes' THEN
      UPDATE cafes SET downvotes = downvotes - 1 WHERE id = OLD.cafe_id;
    END IF;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Triggers for vote count updates
CREATE TRIGGER trigger_update_upvote_counts
  AFTER INSERT OR DELETE ON user_upvotes
  FOR EACH ROW EXECUTE FUNCTION update_cafe_vote_counts();

CREATE TRIGGER trigger_update_downvote_counts
  AFTER INSERT OR DELETE ON user_downvotes
  FOR EACH ROW EXECUTE FUNCTION update_cafe_vote_counts();
```

## Row Level Security (RLS) Policies

### Enable RLS on All Tables

```sql
-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE cafes ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE followers ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_upvotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_downvotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE cafe_submissions ENABLE ROW LEVEL SECURITY;
```

### Profiles Table Policies

```sql
-- Users can view all profiles (for social features)
CREATE POLICY "Public profiles are viewable by everyone" 
ON profiles FOR SELECT 
USING (true);

-- Users can only insert their own profile
CREATE POLICY "Users can insert their own profile" 
ON profiles FOR INSERT 
WITH CHECK (auth.uid() = id);

-- Users can only update their own profile
CREATE POLICY "Users can update their own profile" 
ON profiles FOR UPDATE 
USING (auth.uid() = id);
```

### Cafes Table Policies

```sql
-- Everyone can view cafes
CREATE POLICY "Cafes are viewable by everyone" 
ON cafes FOR SELECT 
USING (true);

-- Only authenticated users can insert cafes (for admin-approved submissions)
CREATE POLICY "Authenticated users can insert cafes" 
ON cafes FOR INSERT 
TO authenticated 
WITH CHECK (true);

-- Only authenticated users can update cafes (for admin management)
CREATE POLICY "Authenticated users can update cafes" 
ON cafes FOR UPDATE 
TO authenticated 
USING (true);
```

### Bookmarks Table Policies

```sql
-- Users can only see their own bookmarks
CREATE POLICY "Users can view their own bookmarks" 
ON bookmarks FOR SELECT 
USING (auth.uid() = user_id);

-- Users can only create their own bookmarks
CREATE POLICY "Users can create their own bookmarks" 
ON bookmarks FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Users can only delete their own bookmarks
CREATE POLICY "Users can delete their own bookmarks" 
ON bookmarks FOR DELETE 
USING (auth.uid() = user_id);
```

### Reviews Table Policies

```sql
-- Everyone can view reviews
CREATE POLICY "Reviews are viewable by everyone" 
ON reviews FOR SELECT 
USING (true);

-- Users can only create their own reviews
CREATE POLICY "Users can create their own reviews" 
ON reviews FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Users can only update their own reviews
CREATE POLICY "Users can update their own reviews" 
ON reviews FOR UPDATE 
USING (auth.uid() = user_id);

-- Users can only delete their own reviews
CREATE POLICY "Users can delete their own reviews" 
ON reviews FOR DELETE 
USING (auth.uid() = user_id);
```

### Followers Table Policies

```sql
-- Users can view follower relationships (for social features)
CREATE POLICY "Follower relationships are viewable by everyone" 
ON followers FOR SELECT 
USING (true);

-- Users can only create their own follow relationships
CREATE POLICY "Users can create their own follows" 
ON followers FOR INSERT 
WITH CHECK (auth.uid() = follower_id);

-- Users can only delete their own follow relationships
CREATE POLICY "Users can delete their own follows" 
ON followers FOR DELETE 
USING (auth.uid() = follower_id);
```

### Voting Tables Policies

```sql
-- Upvotes policies
CREATE POLICY "Users can view all upvotes" 
ON user_upvotes FOR SELECT 
USING (true);

CREATE POLICY "Users can create their own upvotes" 
ON user_upvotes FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own upvotes" 
ON user_upvotes FOR DELETE 
USING (auth.uid() = user_id);

-- Downvotes policies (identical structure)
CREATE POLICY "Users can view all downvotes" 
ON user_downvotes FOR SELECT 
USING (true);

CREATE POLICY "Users can create their own downvotes" 
ON user_downvotes FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own downvotes" 
ON user_downvotes FOR DELETE 
USING (auth.uid() = user_id);
```

### Submissions Table Policies

```sql
-- Users can view their own submissions, admins can view all
CREATE POLICY "Users can view own submissions, admins view all" 
ON cafe_submissions FOR SELECT 
USING (
  auth.uid() = submitted_by OR 
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.is_merchant = true -- Assuming is_merchant also includes admin privileges
  )
);

-- Users can create their own submissions
CREATE POLICY "Users can create their own submissions" 
ON cafe_submissions FOR INSERT 
WITH CHECK (auth.uid() = submitted_by);

-- Only admins can update submissions (for approval/rejection)
CREATE POLICY "Admins can update all submissions" 
ON cafe_submissions FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.is_merchant = true
  )
);
```

## Storage Configuration

### Storage Buckets

#### 1. `cafe-images` Bucket
Stores approved cafe images with organized folder structure.

```typescript
// Bucket configuration
const cafeImagesBucket = {
  name: 'cafe-images',
  public: true,
  allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  fileSizeLimit: 50 * 1024 * 1024, // 50MB
  transformations: {
    enabled: true,
    quality: 80,
    format: 'webp' // Auto-convert to WebP for optimization
  }
}

// Folder structure: cafe-{id}/image1.jpg, cafe-{id}/image2.png, etc.
```

**Storage Policies:**
```sql
-- Everyone can view cafe images
CREATE POLICY "Anyone can view cafe images" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'cafe-images');

-- Authenticated users can upload cafe images
CREATE POLICY "Authenticated users can upload cafe images" 
ON storage.objects FOR INSERT 
WITH CHECK (
  bucket_id = 'cafe-images' AND 
  auth.role() = 'authenticated'
);
```

#### 2. `submissions` Bucket
Stores images for pending cafe submissions.

```typescript
// Bucket configuration
const submissionsBucket = {
  name: 'submissions',
  public: true,
  allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
  fileSizeLimit: 10 * 1024 * 1024, // 10MB
}

// Folder structure: {user_id}/timestamp-random.jpg
```

**Storage Policies:**
```sql
-- Users can view submission images
CREATE POLICY "Users can view submission images" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'submissions');

-- Users can upload their own submission images
CREATE POLICY "Users can upload submission images" 
ON storage.objects FOR INSERT 
WITH CHECK (
  bucket_id = 'submissions' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);
```

#### 3. `avatars` Bucket (Optional)
User profile pictures.

```sql
CREATE POLICY "Users can view all avatars" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload their own avatar" 
ON storage.objects FOR INSERT 
WITH CHECK (
  bucket_id = 'avatars' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their own avatar" 
ON storage.objects FOR UPDATE 
USING (
  bucket_id = 'avatars' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);
```

## Authentication Configuration

### Auth Settings

```javascript
// Supabase Dashboard Auth Settings
const authConfig = {
  // Site URL (for redirects)
  siteUrl: 'https://yourdomain.com', // Web: your domain, Mobile: app scheme
  
  // Additional redirect URLs
  additionalRedirectUrls: [
    'http://localhost:3000',           // Local web development
    'http://localhost:19006',          // Expo web
    'exp://127.0.0.1:19000',          // Expo mobile development
    'yourappscheme://auth'            // React Native deep link
  ],
  
  // Email templates
  confirmEmailSubject: 'Confirm your Cafe Finder account',
  inviteEmailSubject: 'You have been invited to Cafe Finder',
  
  // JWT settings
  jwtExpiry: 3600, // 1 hour
  refreshTokenExpiry: 2592000, // 30 days
  
  // Password requirements
  passwordMinLength: 6,
  
  // Enable providers
  enabledProviders: {
    email: true,
    google: false, // Can be enabled later
    apple: false   // Can be enabled later
  }
}
```

### User Registration Flow

```typescript
// Registration with automatic profile creation
const registerUser = async (userData: RegisterData) => {
  // 1. Create auth user
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: userData.email,
    password: userData.password,
    options: {
      data: {
        username: userData.username,
        is_merchant: userData.is_merchant || false
      }
    }
  });
  
  if (authError) throw authError;
  
  // 2. Profile is automatically created via database trigger or can be created manually
  if (authData.user) {
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: authData.user.id,
        username: userData.username,
        is_merchant: userData.is_merchant || false
      });
    
    if (profileError) console.error('Profile creation error:', profileError);
  }
  
  return authData;
};
```

## Real-time Subscriptions

### Activity Feed Subscriptions

```typescript
// Subscribe to new activities for followed users
const subscribeToFeed = (followingIds: string[]) => {
  const channel = supabase.channel('activity-feed')
    
  // Listen to bookmark changes
  .on(
    'postgres_changes',
    {
      event: 'INSERT',
      schema: 'public',
      table: 'bookmarks',
      filter: `user_id=in.(${followingIds.join(',')})`
    },
    (payload) => {
      // Handle new bookmark
      handleNewActivity('bookmark', payload.new);
    }
  )
  
  // Listen to review changes
  .on(
    'postgres_changes',
    {
      event: 'INSERT',
      schema: 'public',
      table: 'reviews',
      filter: `user_id=in.(${followingIds.join(',')})`
    },
    (payload) => {
      // Handle new review
      handleNewActivity('review', payload.new);
    }
  )
  
  .subscribe();
  
  return channel;
};
```

## Performance Optimization

### Database Optimization

```sql
-- Composite indexes for common queries
CREATE INDEX idx_bookmarks_user_created ON bookmarks(user_id, created_at DESC);
CREATE INDEX idx_reviews_cafe_rating ON reviews(cafe_id, rating);
CREATE INDEX idx_cafes_location_wifi ON cafes USING GIN ((location->>'city'), wifi);

-- Partial indexes for active data
CREATE INDEX idx_submissions_pending ON cafe_submissions(created_at DESC) 
WHERE status = 'pending';

-- Full-text search indexes
CREATE INDEX idx_cafes_name_search ON cafes USING GIN (to_tsvector('english', name));
CREATE INDEX idx_cafes_description_search ON cafes USING GIN (to_tsvector('english', description));
```

### Connection Pooling

```typescript
// Supabase automatically handles connection pooling
// Additional configuration for high-traffic applications
const supabaseOptions = {
  db: {
    schema: 'public',
  },
  auth: {
    autoRefreshToken: true,
    persistSession: true,
  },
  global: {
    headers: { 'x-my-custom-header': 'my-app-name' },
  },
}
```

This comprehensive backend documentation covers all aspects of the Supabase configuration and can be used as a reference for both web and mobile implementations of the Cafe Finder application.