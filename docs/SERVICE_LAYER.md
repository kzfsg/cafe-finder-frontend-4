# Cafe Finder - Service Layer Documentation

## Overview

The service layer provides a complete abstraction between the frontend components and the Supabase backend. All services follow consistent patterns for error handling, data transformation, timeout protection, and type safety. This layer is platform-agnostic and can be used identically in both web and mobile implementations.

## Core Design Principles

### 1. Error Isolation & Graceful Degradation
- Services never throw errors to the UI layer
- Always return safe fallback data (empty arrays, null objects)
- Comprehensive logging for debugging without exposing sensitive data
- Timeout protection prevents hanging requests

### 2. Data Transformation
- Raw Supabase data is transformed to application-specific formats
- Legacy compatibility maintained for existing components
- Consistent image URL resolution across all services
- Type-safe transformations with full TypeScript support

### 3. Performance Optimization
- Built-in timeout mechanisms (10 seconds for queries, 5 seconds for transforms)
- Parallel processing where possible (Promise.all)
- Efficient database queries with proper indexing
- Caching integration with React Query

## Service API Reference

## 1. Authentication Service (`authService.ts`)

Handles user authentication, registration, and profile management.

### Types
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
  followers_count?: number;
  following_count?: number;
}

type AuthChangeCallback = (event: string, session: Session | null) => void;
```

### Methods

#### `register(data: RegisterData): Promise<{ user: User | null, session: Session | null }>`
Registers a new user and creates their profile.
```typescript
const { user, session } = await authService.register({
  username: 'coffeelover',
  email: 'user@example.com',
  password: 'securepass123',
  is_merchant: false
});
```

#### `login(credentials: LoginData): Promise<{ user: User | null, session: Session | null }>`
Authenticates user with email/password.
```typescript
const { user, session } = await authService.login({
  identifier: 'user@example.com',
  password: 'securepass123'
});
```

#### `logout(): Promise<void>`
Signs out the current user and clears session.
```typescript
await authService.logout();
```

#### `getCurrentUser(): Promise<User | null>`
Gets the current authenticated user with profile data.
```typescript
const user = await authService.getCurrentUser();
```

#### `getSession(): Promise<Session | null>`
Gets the current session information.
```typescript
const session = await authService.getSession();
```

#### `onAuthStateChange(callback: AuthChangeCallback): void`
Subscribes to authentication state changes.
```typescript
authService.onAuthStateChange((event, session) => {
  console.log('Auth event:', event, session);
});
```

#### `updateProfile(data: Partial<User>): Promise<User>`
Updates user profile information.

## 2. Cafe Service (`cafeService.ts`)

Manages cafe data, images, and transformations.

### Types
```typescript
interface SupabaseCafe {
  id: number;
  name: string;
  description?: string;
  location: CafeLocation | null;
  wifi?: boolean;
  power_outlets?: boolean;
  upvotes?: number;
  downvotes?: number;
  created_at?: string;
  // ... other fields
}
```

### Methods

#### `getAllCafes(): Promise<Cafe[]>`
Fetches all cafes with full data transformation and image resolution.
```typescript
const cafes = await cafeService.getAllCafes();
// Returns array of fully transformed Cafe objects with imageUrls
```

**Implementation Details:**
- 10-second timeout protection
- Individual cafe transformation with 10-second timeout per cafe
- Parallel image URL resolution
- Fallback data for failed transformations

#### `getCafeById(id: number): Promise<Cafe | null>`
Fetches a specific cafe by ID.
```typescript
const cafe = await cafeService.getCafeById(123);
```

**Implementation Details:**
- 10-second query timeout
- 5-second transformation timeout
- Fallback cafe object if transformation fails

#### `getMerchantCafes(merchantId: string): Promise<Cafe[]>`
Gets cafes owned by a specific merchant (placeholder - requires owner_id field).
```typescript
const merchantCafes = await cafeService.getMerchantCafes('user-id');
// Currently returns empty array - requires database schema update
```

#### `transformCafeData(supaCafe: SupabaseCafe): Promise<Cafe>`
Transforms raw Supabase data to application format.
```typescript
const transformedCafe = await cafeService.transformCafeData(rawData);
```

**Transformation Process:**
1. Validates required fields (id, name)
2. Parses JSON location data
3. Resolves image URLs from storage
4. Maps fields to application schema
5. Adds legacy compatibility fields
6. Handles errors with fallback data

#### `getCafeImageUrls(cafeId: number): Promise<string[]>`
Fetches all image URLs for a cafe from Supabase Storage.
```typescript
const imageUrls = await getCafeImageUrls(123);
// Returns: ['https://storage-url/cafe-123/image1.jpg', ...]
```

**Storage Resolution Process:**
1. Checks if `cafe-images` bucket exists
2. Lists files in `cafe-{id}/` folder
3. Filters for valid image formats (.jpg, .jpeg, .png, .gif, .webp, .svg)
4. Generates public URLs for all images
5. Returns fallback array if no images found: `['/images/no-image.svg']`

## 3. Bookmark Service (`bookmarkService.ts`)

Handles user bookmarking functionality.

### Types
```typescript
interface BookmarkResponse {
  bookmarked: boolean;
  message: string;
}
```

### Methods

#### `getBookmarkedCafes(userId?: string, limit?: number): Promise<Cafe[]>`
Gets bookmarked cafes for a user (current user if no userId provided).
```typescript
const bookmarkedCafes = await bookmarkService.getBookmarkedCafes();
const userBookmarks = await bookmarkService.getBookmarkedCafes('user-id', 10);
```

**Implementation Details:**
- Joins bookmarks with cafes table
- Full cafe data transformation
- Parallel processing of multiple bookmarks
- Error handling for missing cafe data

#### `isBookmarked(cafeId: number): Promise<boolean>`
Checks if a cafe is bookmarked by the current user.
```typescript
const isBookmarked = await bookmarkService.isBookmarked(123);
```

#### `toggleBookmark(cafeId: number): Promise<BookmarkResponse>`
Toggles bookmark status for a cafe.
```typescript
const result = await bookmarkService.toggleBookmark(123);
// Returns: { bookmarked: true, message: 'Bookmark added' }
```

**Implementation Details:**
- Validates user authentication and profile existence
- Checks existing bookmark status
- Atomic add/remove operations
- Comprehensive error messages
- Returns current state on errors to maintain UI consistency

## 4. Search Service (`searchService.ts`)

Handles cafe search and filtering operations.

### Types
```typescript
interface FilterOptions {
  wifi?: boolean;
  powerOutlets?: boolean;
  seatingCapacity?: string;
  noiseLevel?: string;
  priceRange?: string;
  nearMe?: boolean;
  userLocation?: { latitude: number; longitude: number };
}
```

### Methods

#### `searchCafes(query: string, filters?: FilterOptions): Promise<Cafe[]>`
Searches cafes with text query and optional filters.
```typescript
const results = await searchService.searchCafes('coffee shop', {
  wifi: true,
  powerOutlets: true,
  nearMe: true,
  userLocation: { latitude: 40.7128, longitude: -74.0060 }
});
```

**Search Features:**
- Text search across name, description, and location
- Multiple filter combinations
- Location-based search with distance calculation
- Results sorted by relevance or distance

## 5. Review Service (`reviewService.ts`)

Manages user reviews with boolean rating system.

### Types
```typescript
interface Review {
  id: string;
  user_id: string;
  cafe_id: number;
  rating: boolean; // true for positive, false for negative
  comment: string;
  created_at: string;
  updated_at: string;
  user?: {
    username: string;
    avatar_url?: string;
  };
}
```

### Methods

#### `getReviewsForCafe(cafeId: number): Promise<Review[]>`
Gets all reviews for a specific cafe.

#### `addReview(cafeId: number, rating: boolean, comment: string): Promise<Review>`
Adds a new review for a cafe.

#### `updateReview(reviewId: string, rating: boolean, comment: string): Promise<Review>`
Updates an existing review.

#### `deleteReview(reviewId: string): Promise<boolean>`
Deletes a user's review.

## 6. Social Services

### Follower Service (`followerService.ts`)

#### Methods
- `getFollowers(userId: string): Promise<User[]>` - Get user's followers
- `getFollowing(userId: string): Promise<User[]>` - Get users that a user follows
- `followUser(userId: string): Promise<boolean>` - Follow a user
- `unfollowUser(userId: string): Promise<boolean>` - Unfollow a user
- `isFollowing(userId: string): Promise<boolean>` - Check if following a user

### Feed Service (`feedService.ts`)

#### Types
```typescript
export type ActivityType = 'bookmark' | 'review' | 'upvote' | 'downvote';

export interface FeedActivity {
  id: string;
  type: ActivityType;
  user_id: string;
  username: string;
  avatar_url?: string;
  cafe_id: number;
  cafe_name: string;
  cafe_image?: string;
  created_at: string;
  // Activity-specific data
  review_text?: string;
  rating?: boolean;
  comment?: string;
}
```

#### Methods

#### `getFriendsFeed(limit: number = 20, offset: number = 0): Promise<FeedActivity[]>`
Gets aggregated activity feed from followed users.
```typescript
const activities = await feedService.getFriendsFeed(20, 0);
```

**Aggregation Process:**
1. Gets list of followed users
2. Fetches activities from each table (bookmarks, reviews, upvotes, downvotes)
3. Enriches with user profiles and cafe data
4. Sorts by timestamp and applies pagination
5. Returns unified activity feed

#### `getActivityStats(userId: string): Promise<ActivityStats>`
Gets activity statistics for a user.
```typescript
const stats = await feedService.getActivityStats('user-id');
// Returns: { total_bookmarks: 5, total_reviews: 3, total_upvotes: 12, total_downvotes: 1 }
```

## 7. Voting Services

### Upvote Service (`upvoteService.ts`)
#### `addUpvote(cafeId: number): Promise<boolean>`
#### `removeUpvote(cafeId: number): Promise<boolean>`
#### `hasUserUpvoted(cafeId: number): Promise<boolean>`

### Downvote Service (`downvoteService.ts`)
#### `addDownvote(cafeId: number): Promise<boolean>`
#### `removeDownvote(cafeId: number): Promise<boolean>`
#### `hasUserDownvoted(cafeId: number): Promise<boolean>`

## 8. Submission Service (`submissionService.ts`)

Handles user cafe submissions and admin approval workflow.

### Types
```typescript
export type SubmissionStatus = 'pending' | 'approved' | 'rejected';

export interface CafeSubmission {
  id: string;
  submitted_by: string;
  submitted_by_username?: string;
  submitted_at: string;
  name: string;
  description: string;
  location: CafeLocation;
  wifi: boolean;
  powerOutletAvailable: boolean;
  image_urls: string[];
  status: SubmissionStatus;
  reviewed_by?: string;
  reviewed_at?: string;
  admin_notes?: string;
  rejection_reason?: string;
}

export interface SubmissionFormData {
  name: string;
  description: string;
  address: string;
  city: string;
  country: string;
  latitude?: number;
  longitude: number;
  wifi: boolean;
  powerOutletAvailable: boolean;
  images: File[]; // Web: File[], Mobile: image picker result
}

export interface AdminReviewData {
  status: 'approved' | 'rejected';
  admin_notes?: string;
  rejection_reason?: string;
}
```

### Methods

#### `submitCafe(formData: SubmissionFormData, user: User): Promise<CafeSubmission | null>`
Submits a new cafe for admin review.
```typescript
const submission = await submissionService.submitCafe(formData, currentUser);
```

**Submission Process:**
1. Uploads images to `submissions` bucket under `{user_id}/` folder
2. Creates submission record with pending status
3. Returns submission object or null on failure

#### `getPendingSubmissions(): Promise<CafeSubmission[]>`
Gets all pending submissions (admin only).

#### `getSubmissionById(id: string): Promise<CafeSubmission | null>`
Gets a specific submission by ID.

#### `reviewSubmission(id: string, reviewData: AdminReviewData): Promise<boolean>`
Admin approval/rejection of submissions.

#### `getSubmissionStats(): Promise<SubmissionStats>`
Gets submission statistics for admin dashboard.

## 9. Batched Cafe Service (`batchedCafeService.ts`)

Optimized service for batch operations and performance-critical scenarios.

### Methods

#### `getBatchedCafes(limit: number = 50): Promise<Cafe[]>`
Gets cafes in optimized batches with reduced transformation overhead.

## Error Handling Patterns

### Timeout Protection
```typescript
// Standard timeout pattern used across all services
const timeoutPromise = new Promise<{data: null, error: Error}>((resolve) => {
  setTimeout(() => {
    console.warn('Query timed out after 10 seconds');
    resolve({
      data: null,
      error: new Error('Query timeout exceeded')
    });
  }, 10000);
});

const { data, error } = await Promise.race([
  supabase.from('table').select('*'),
  timeoutPromise
]);
```

### Graceful Error Handling
```typescript
// Standard error handling pattern
const handleSupabaseError = (error: any, context: string) => {
  console.error(`Supabase error (${context}):`, error.message);
  if (error.details) console.error('Details:', error.details);
  if (error.hint) console.error('Hint:', error.hint);
  return Promise.reject(error);
};

// Service method with error handling
const getAllCafes = async (): Promise<Cafe[]> => {
  try {
    // ... implementation
  } catch (error) {
    console.error('Error fetching cafes:', error);
    return []; // Return safe fallback instead of throwing
  }
};
```

### RLS Policy Handling
```typescript
// Services handle RLS policy violations gracefully
const { data, error } = await supabase.from('table').select('*');

if (error) {
  // Log error but don't expose to user
  console.error('Database access error:', error);
  return []; // Return empty data instead of throwing
}
```

## Platform-Specific Considerations

### File Upload Handling

#### Web Implementation
```typescript
// File upload from HTML input
const uploadImage = async (file: File, path: string) => {
  const { error } = await supabase.storage
    .from('bucket')
    .upload(path, file);
  
  return !error;
};
```

#### Mobile Implementation
```typescript
// File upload from React Native image picker
import * as ImagePicker from 'expo-image-picker';

const uploadImage = async (imageUri: string, path: string) => {
  const response = await fetch(imageUri);
  const blob = await response.blob();
  
  const { error } = await supabase.storage
    .from('bucket')
    .upload(path, blob);
  
  return !error;
};
```

### Session Storage

#### Web Implementation
```typescript
// Uses localStorage automatically
const supabase = createClient(url, key, {
  auth: { persistSession: true }
});
```

#### Mobile Implementation
```typescript
// Uses AsyncStorage
import AsyncStorage from '@react-native-async-storage/async-storage';

const supabase = createClient(url, key, {
  auth: { 
    persistSession: true,
    storage: AsyncStorage 
  }
});
```

## Best Practices

### 1. Service Usage
- Always use services instead of direct Supabase calls in components
- Handle loading states in components, not services
- Use React Query for caching and state management
- Services should be stateless and pure

### 2. Error Handling
- Services return safe fallback data, never throw to UI
- Log errors comprehensively for debugging
- Provide user-friendly error messages in components
- Implement retry logic in components using React Query

### 3. Performance
- Use timeout protection for all database operations
- Implement parallel processing where possible
- Cache frequently accessed data with React Query
- Optimize database queries with proper indexing

### 4. Type Safety
- Define comprehensive TypeScript interfaces
- Use strict type checking in transformations
- Export types for use in components
- Maintain type safety across platform boundaries

This service layer documentation provides a complete reference for implementing and maintaining the Cafe Finder application across web and mobile platforms.