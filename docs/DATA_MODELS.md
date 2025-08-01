# Data Models

This document details all TypeScript interfaces, types, enums, and validation patterns used throughout the cafe finder application. The data models are organized by domain and include comprehensive type definitions for all entities.

## Core Cafe Models

### `Cafe` Interface

The main cafe entity with comprehensive legacy compatibility:

```typescript
interface Cafe {
  // Primary Supabase fields
  id: number;
  created_at: string;
  name: string;
  description: string;
  location: CafeLocation;
  wifi: boolean;
  powerOutletAvailable: boolean;
  seatingCapacity?: string;
  noiseLevel?: string;
  priceRange?: string;
  upvotes: number;
  downvotes: number;
  distance?: number; // Distance from user in kilometers
  
  // Legacy fields for backward compatibility
  imageUrls: string[]; // Array of image URLs for the cafe
  documentId?: string;
  Name?: string;  // For compatibility with existing code
  title?: string;  // For compatibility with existing code
  image?: string;  // For compatibility with existing code
  Description?: any[];  // For compatibility with existing code
  hasWifi?: boolean;  // For compatibility with existing code
  hasPower?: boolean;  // For compatibility with existing code
  createdAt?: string;  // For compatibility with existing code
  updatedAt?: string;  // For compatibility with existing code
  publishedAt?: string | null;
  Location?: {  // For compatibility with existing code
    latitude?: number;
    longitude?: number;
    address?: string;
    city?: string;
    country?: string;
  };
  location_legacy?: {  // For compatibility with existing code
    address?: string;
    googleMapsUrl?: string;
  };
  amenities?: {
    openingHours?: string;
    seatingCapacity?: string;
    noiseLevel?: string; // "Quiet", "Moderate", "Lively"
  };
  gallery?: string[];
  reviews?: Review[];
}
```

### `CafeLocation` Interface

Structured location data matching Supabase JSON field:

```typescript
interface CafeLocation {
  city: string;
  address: string;
  country: string;
  latitude?: number;
  longitude?: number;
}
```

### `SupabaseCafe` Interface

Direct mapping to Supabase database structure:

```typescript
interface SupabaseCafe {
  id: number;
  created_at: string;
  name: string;
  description: string;
  location: CafeLocation | string; // JSON field, sometimes returned as string
  wifi: boolean;
  powerOutletAvailable: boolean;
  seatingCapacity?: string;
  noiseLevel?: string;
  priceRange?: string;
  upvotes: number;
  downvotes: number;
}
```

## Review System Models

### `Review` Interface

User reviews with boolean rating system:

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

### `ReviewSubmission` Interface

Data structure for submitting new reviews:

```typescript
interface ReviewSubmission {
  cafe_id: number;
  rating: boolean;
  comment: string;
}
```

## User Management Models

### `User` Type

Core user entity with authentication and profile data:

```typescript
type User = {
  id: string;
  email: string;
  username: string;
  full_name?: string;
  avatar_url?: string;
  bio?: string;
  location?: string;
  website?: string;
  instagram_handle?: string;
  twitter_handle?: string;
  linkedin_handle?: string;
  is_merchant: boolean;
  merchant_verified: boolean;
  merchant_business_name?: string;
  merchant_business_type?: string;
  created_at: string;
  updated_at: string;
}
```

### Authentication Interfaces

```typescript
interface RegisterData {
  username: string;
  email: string;
  password: string;
  full_name?: string;
  is_merchant?: boolean;
}

interface LoginData {
  identifier: string; // email or username
  password: string;
}

type AuthChangeCallback = (event: string, session: Session | null) => void;
```

### `AuthContextType` Interface

React context interface for authentication state:

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

## Social Features Models

### `FollowerRelationship` Interface

Represents following connections between users:

```typescript
interface FollowerRelationship {
  id: string;
  follower_id: string;
  following_id: string;
  created_at: string;
}
```

### `FollowerStats` Interface

Aggregated follower statistics:

```typescript
interface FollowerStats {
  followers_count: number;
  following_count: number;
}
```

### `UserWithFollowerInfo` Interface

Extended user data with social information:

```typescript
interface UserWithFollowerInfo extends User {
  followers_count?: number;
  following_count?: number;
  is_following?: boolean;
}
```

### Activity Feed Models

```typescript
type ActivityType = 'bookmark' | 'review' | 'upvote' | 'downvote';

interface FeedActivity {
  id: string;
  type: ActivityType;
  user_id: string;
  cafe_id: number;
  created_at: string;
  user?: {
    username: string;
    avatar_url?: string;
  };
  cafe?: {
    id: number;
    name: string;
    imageUrls: string[];
  };
  comment?: string; // For review activities
}
```

## Submission System Models

### `CafeSubmission` Interface

User-submitted cafe data awaiting admin review:

```typescript
interface CafeSubmission {
  id: string;
  // Submitter information
  submitted_by: string; // user_id
  submitted_by_username?: string;
  submitted_at: string;
  
  // Cafe details
  name: string;
  description: string;
  location: CafeLocation;
  wifi: boolean;
  powerOutletAvailable: boolean;
  seatingCapacity?: string;
  noiseLevel?: string;
  priceRange?: string;
  
  // Images (stored as URLs or base64)
  image_urls: string[];
  
  // Submission status and review
  status: SubmissionStatus;
  reviewed_by?: string; // admin user_id
  reviewed_at?: string;
  admin_notes?: string;
  rejection_reason?: string;
  
  // Additional metadata
  created_at: string;
  updated_at: string;
}
```

### Submission Support Types

```typescript
type SubmissionStatus = 'pending' | 'approved' | 'rejected';

interface SubmissionFormData {
  name: string;
  description: string;
  address: string;
  city: string;
  country: string;
  latitude?: number;
  longitude: number;
  wifi: boolean;
  powerOutletAvailable: boolean;
  seatingCapacity?: string;
  noiseLevel?: string;
  priceRange?: string;
  images: File[];
}

interface AdminReviewData {
  status: 'approved' | 'rejected';
  admin_notes?: string;
  rejection_reason?: string;
}

interface SubmissionStats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  recent_submissions: number; // last 7 days
}
```

## Search and Filter Models

### `FilterOptions` Interface

Comprehensive search and filter criteria:

```typescript
interface FilterOptions {
  location?: string;
  wifi?: boolean;
  powerOutlet?: boolean;
  seatingCapacity?: number | null;
  noiseLevel?: string | null;
  priceRange?: string | null;
  upvotes?: number | null;
  downvotes?: number | null;
  // Location-based search parameters
  nearMe?: {
    latitude: number;
    longitude: number;
    radiusKm: number; // Search radius in kilometers
  } | null;
}
```

### Geolocation Models

```typescript
interface Coordinates {
  latitude: number;
  longitude: number;
}
```

## Database Integration Models

### Storage Models

```typescript
interface StorageBucket {
  id: string;
  name: string;
  created_at: string;
}

interface StorageFile {
  name: string;
  id: string;
  updated_at: string;
  created_at: string;
  last_accessed_at: string;
  metadata: any;
}
```

### Database-Specific Types

```typescript
// Extended location interface to match Supabase structure
interface DBCafeLocation {
  city: string;
  address: string;
  country: string;
  latitude?: number;
  longitude?: number;
}

// Define interface for database cafe record
interface DBCafe {
  id: number;
  created_at: string;
  name: string;
  description: string;
  location: DBCafeLocation;
  wifi: boolean;
  powerOutletAvailable: boolean;
  seatingCapacity?: string;
  noiseLevel?: string;
  priceRange?: string;
  upvotes: number;
  downvotes: number;
}

interface CafeCache {
  cafes: Cafe[];
  lastUpdated: number;
}
```

## Component Prop Interfaces

### Core Component Props

```typescript
interface CafeCardProps {
  cafe: Cafe;
}

interface CafeDetailsProps {
  cafeId: number;
  opened: boolean;
  onClose: () => void;
}

interface ReviewSectionProps {
  cafe: Cafe;
  onReviewAdded: () => void;
}
```

### UI Component Props

```typescript
interface MasonryGridProps {
  children: ReactNode;
  columns?: number;
  gap?: string;
}

interface ProfileAvatarProps {
  src?: string;
  username?: string;
  size?: number;
}

interface SplitTextProps {
  text: string;
  delay?: number;
  animationDirection?: 'up' | 'down' | 'left' | 'right';
  className?: string;
}
```

### Navigation and Search Props

```typescript
interface NavbarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onFilterChange: (filters: FilterOptions) => void;
}

interface FilterDropdownProps {
  onFilterChange: (filters: FilterOptions) => void;
}

interface EnhancedSearchBarProps {
  onSearch: (query: string, filters?: FilterOptions) => void;
  placeholder?: string;
}

type SearchStep = "search" | "location" | "filters" | "upvotes" | "ready";
```

### Social Component Props

```typescript
interface UserCardProps {
  user: UserWithFollowerInfo;
  showFollowButton?: boolean;
  showStats?: boolean;
}

interface FollowersListProps {
  userId: string;
  type: 'followers' | 'following';
}

interface FollowButtonProps {
  targetUserId: string;
  initialIsFollowing?: boolean;
  onFollowChange?: (isFollowing: boolean) => void;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  variant?: 'filled' | 'outline' | 'light';
}

interface ActivityFeedItemProps {
  activity: FeedActivity;
}
```

## Data Transformation Patterns

### Transformation Functions

The application uses several transformation functions to convert between different data formats:

```typescript
// Transform Supabase cafe data to frontend Cafe interface
export const transformCafeData = async (supaCafe: SupabaseCafe | null): Promise<Cafe>

// Convert location JSON string to structured object
const parseLocation = (location: string | CafeLocation): CafeLocation

// Generate image URLs for cafe from storage bucket
const getCafeImageUrls = async (cafeId: number): Promise<string[]>
```

### Validation Patterns

The application implements validation at multiple levels:

1. **Form Validation**: Using Mantine forms with built-in validation
2. **Type Guards**: Runtime type checking for API responses
3. **Schema Validation**: Ensuring data matches expected interfaces
4. **Legacy Compatibility**: Handling both old and new data formats

### Error Handling Models

```typescript
interface ApiError {
  message: string;
  status?: number;
  code?: string;
}

interface ServiceResponse<T> {
  data?: T;
  error?: ApiError;
  success: boolean;
}
```

## Migration and Compatibility

### Legacy Support Strategy

The data models maintain backward compatibility through:

1. **Optional Legacy Fields**: Old field names marked as optional
2. **Dual Field Support**: Both new and old field names populated
3. **Transformation Layer**: Automatic conversion between formats
4. **Gradual Migration**: Phased removal of legacy fields

### Version Management

```typescript
interface DataVersion {
  version: string;
  deprecated_fields: string[];
  migration_notes: string;
}
```

This comprehensive data model structure ensures type safety, backward compatibility, and clear data flow throughout the application while supporting both current and legacy implementations.