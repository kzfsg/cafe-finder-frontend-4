# Cafe Finder - System Architecture

## Overview

The Cafe Finder application follows a layered architecture pattern with clear separation of concerns between the presentation layer, business logic layer, and data access layer. The architecture is designed to be scalable, maintainable, and platform-agnostic to support both web and mobile implementations.

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Presentation Layer                       │
│  ┌─────────────────┐  ┌─────────────────┐                  │
│  │   Web (React)   │  │ Mobile (React   │                  │
│  │   + Mantine     │  │ Native + Native │                  │
│  │                 │  │ Base)           │                  │
│  └─────────────────┘  └─────────────────┘                  │
└─────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────┐
│                  Business Logic Layer                       │
│                                                             │
│  ┌─────────────────┐  ┌─────────────────┐                  │
│  │ Context         │  │ Custom Hooks    │                  │
│  │ Providers       │  │ & Utils         │                  │
│  └─────────────────┘  └─────────────────┘                  │
└─────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────┐
│                   Service Layer                             │
│                                                             │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐      │
│  │   Auth   │ │   Cafe   │ │  Social  │ │  Search  │      │
│  │ Service  │ │ Service  │ │ Services │ │ Service  │      │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘      │
└─────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────┐
│                  Data Access Layer                          │
│                                                             │
│  ┌─────────────────┐  ┌─────────────────┐                  │
│  │ Supabase Client │  │ React Query     │                  │
│  │                 │  │ Cache Manager   │                  │
│  └─────────────────┘  └─────────────────┘                  │
└─────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────┐
│                    Backend (Supabase)                      │
│                                                             │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐      │
│  │PostgreSQL│ │  Auth    │ │ Storage  │ │Real-time │      │
│  │Database  │ │ System   │ │ Buckets  │ │Subscrip- │      │
│  │          │ │          │ │          │ │tions     │      │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘      │
└─────────────────────────────────────────────────────────────┘
```

## Service Layer Architecture

### Design Principles

The service layer is the backbone of the application, providing a clean abstraction between the UI and backend operations. Key principles:

1. **Single Responsibility**: Each service handles one domain area
2. **Error Isolation**: Services handle errors gracefully without propagating to UI
3. **Timeout Protection**: All operations include timeout mechanisms
4. **Retry Logic**: Automatic retry for transient failures
5. **Type Safety**: Full TypeScript integration with proper typing

### Service Structure

```typescript
interface ServicePattern {
  // Core operations
  getAll(): Promise<T[]>
  getById(id: string): Promise<T | null>
  create(data: CreateT): Promise<T>
  update(id: string, data: UpdateT): Promise<T>
  delete(id: string): Promise<boolean>
  
  // Error handling
  handleError(error: Error, context: string): void
  
  // Data transformation
  transformData(rawData: any): T
}
```

### Core Services

#### 1. Authentication Service (`authService.ts`)
```typescript
// Handles user authentication, registration, and profile management
const authService = {
  register(data: RegisterData): Promise<User>
  login(credentials: LoginData): Promise<User>
  logout(): Promise<void>
  getCurrentUser(): Promise<User | null>
  updateProfile(data: ProfileUpdate): Promise<User>
  onAuthStateChange(callback: AuthChangeCallback): void
}
```

#### 2. Cafe Service (`cafeService.ts`)
```typescript
// Manages cafe data, images, and transformations
const cafeService = {
  getAllCafes(): Promise<Cafe[]>
  getCafeById(id: number): Promise<Cafe | null>
  getMerchantCafes(merchantId: string): Promise<Cafe[]>
  transformCafeData(rawData: SupabaseCafe): Promise<Cafe>
  getCafeImageUrls(cafeId: number): Promise<string[]>
}
```

#### 3. Social Services
- **Follower Service**: Managing user relationships
- **Feed Service**: Aggregating social activities
- **Bookmark Service**: User's saved cafes
- **Review Service**: User reviews and ratings
- **Upvote/Downvote Services**: Community voting system

#### 4. Search Service (`searchService.ts`)
```typescript
// Handles all search and filtering operations
const searchService = {
  searchCafes(query: string, filters: SearchFilters): Promise<Cafe[]>
  searchByLocation(coordinates: Coordinates, radius: number): Promise<Cafe[]>
  getFilterOptions(): Promise<FilterOptions>
}
```

### Error Handling Philosophy

#### Graceful Degradation Strategy
```typescript
// Example from cafeService.ts
const getAllCafes = async (): Promise<Cafe[]> => {
  try {
    // Create timeout promise to prevent hanging
    const timeoutPromise = new Promise<{data: null, error: Error}>((resolve) => {
      setTimeout(() => {
        console.warn('Cafe query timed out after 10 seconds');
        resolve({
          data: null,
          error: new Error('Query timeout exceeded')
        });
      }, 10000);
    });
    
    // Race query against timeout
    const { data, error } = await Promise.race([
      supabase.from('cafes').select('*').order('name'),
      timeoutPromise
    ]);
    
    if (error) {
      return handleSupabaseError(error, 'getAllCafes');
    }
    
    return data ? await Promise.all(data.map(transformCafeData)) : [];
  } catch (error) {
    console.error('Error fetching cafes:', error);
    return []; // Return empty array instead of throwing
  }
};
```

#### Error Handling Patterns

1. **Timeout Protection**: All database operations include timeout mechanisms
2. **Fallback Data**: Services return safe defaults instead of throwing errors
3. **Logging Strategy**: Comprehensive logging for debugging without exposing sensitive data
4. **RLS Policy Handling**: Graceful handling of Row Level Security violations
5. **Network Resilience**: Handling offline scenarios and network failures

## Data Flow Architecture

### Request Flow
```
User Action → Component → Service → Supabase → Database
                ↓           ↑
            React Query  Cache/Error
             Cache       Handling
                ↓           ↑
            Component ←  Transformed
             Update      Data
```

### State Management Strategy

#### 1. Authentication State (Context)
```typescript
// Global authentication state using React Context
const AuthContext = createContext<{
  user: User | null;
  loading: boolean;
  login: (credentials: LoginData) => Promise<void>;
  logout: () => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
}>()
```

#### 2. Server State (React Query)
```typescript
// Data fetching and caching with React Query
const useCafes = () => {
  return useQuery({
    queryKey: ['cafes'],
    queryFn: cafeService.getAllCafes,
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
    retry: 3,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000)
  })
}
```

#### 3. Local State (Component State)
```typescript
// UI state managed at component level
const [searchQuery, setSearchQuery] = useState('')
const [filters, setFilters] = useState<SearchFilters>({})
const [isLoading, setIsLoading] = useState(false)
```

## Component Architecture

### Component Hierarchy
```
App
├── AuthProvider
├── Router
│   ├── PublicRoutes
│   │   ├── HomePage
│   │   ├── LoginPage
│   │   └── SignUpPage
│   └── ProtectedRoutes
│       ├── ProfilePage
│       ├── BookmarkPage
│       ├── FriendsFeedPage
│       └── AdminPage (role-based)
├── Navbar
└── GlobalModals
```

### Component Design Patterns

#### 1. Container/Presentation Pattern
```typescript
// Container Component (logic)
const CafeListContainer = () => {
  const { data: cafes, loading } = useCafes()
  const [filters, setFilters] = useState({})
  
  const filteredCafes = useMemo(() => 
    applyCafeFilters(cafes, filters), [cafes, filters]
  )
  
  return (
    <CafeListPresentation 
      cafes={filteredCafes}
      loading={loading}
      onFilterChange={setFilters}
    />
  )
}

// Presentation Component (UI)
const CafeListPresentation = ({ cafes, loading, onFilterChange }) => {
  return (
    <div>
      <FilterDropdown onChange={onFilterChange} />
      {loading ? <Skeleton /> : <MasonryGrid cafes={cafes} />}
    </div>
  )
}
```

#### 2. Compound Component Pattern
```typescript
// CafeCard compound component
const CafeCard = ({ cafe, onClick }) => (
  <Card onClick={onClick}>
    <CafeCard.Image src={cafe.imageUrls[0]} />
    <CafeCard.Content>
      <CafeCard.Title>{cafe.name}</CafeCard.Title>
      <CafeCard.Description>{cafe.description}</CafeCard.Description>
      <CafeCard.Features wifi={cafe.wifi} power={cafe.powerOutletAvailable} />
      <CafeCard.Actions>
        <BookmarkButton cafeId={cafe.id} />
        <UpvoteButton cafeId={cafe.id} count={cafe.upvotes} />
        <DownvoteButton cafeId={cafe.id} count={cafe.downvotes} />
      </CafeCard.Actions>
    </CafeCard.Content>
  </Card>
)
```

#### 3. Custom Hooks Pattern
```typescript
// Reusable business logic in custom hooks
const useCafeActions = (cafeId: number) => {
  const queryClient = useQueryClient()
  
  const bookmark = useMutation({
    mutationFn: () => bookmarkService.addBookmark(cafeId),
    onSuccess: () => {
      queryClient.invalidateQueries(['bookmarks'])
      queryClient.invalidateQueries(['cafes'])
    }
  })
  
  const upvote = useMutation({
    mutationFn: () => upvoteService.addUpvote(cafeId),
    onSuccess: () => {
      queryClient.invalidateQueries(['cafes', cafeId])
    }
  })
  
  return { bookmark, upvote }
}
```

## Data Transformation Architecture

### Transformation Pipeline
```typescript
// Raw Supabase data → Application data structure
const transformationPipeline = {
  // 1. Raw data from Supabase
  rawData: SupabaseCafe,
  
  // 2. Data validation and sanitization
  validate: (data) => validateCafeSchema(data),
  
  // 3. Image URL resolution
  resolveImages: async (data) => {
    const imageUrls = await getCafeImageUrls(data.id)
    return { ...data, imageUrls }
  },
  
  // 4. Legacy compatibility
  addLegacyFields: (data) => ({
    ...data,
    Name: data.name, // Legacy field mapping
    hasWifi: data.wifi,
    hasPower: data.powerOutletAvailable
  }),
  
  // 5. Final application format
  result: Cafe
}
```

### Image Storage Architecture

#### Supabase Storage Structure
```
cafe-images/
├── cafe-1/
│   ├── image1.jpg
│   ├── image2.png
│   └── thumbnail.webp
├── cafe-2/
│   ├── photo1.jpg
│   └── photo2.jpg
└── cafe-3/
    └── main-image.png
```

#### Image Resolution Strategy
```typescript
const getCafeImageUrls = async (cafeId: number): Promise<string[]> => {
  // 1. Check if storage bucket exists
  // 2. List files in cafe-specific folder
  // 3. Filter for valid image formats
  // 4. Generate public URLs
  // 5. Return array with fallback for empty results
  
  return imageUrls.length > 0 
    ? imageUrls 
    : ['/images/no-image.svg'] // Fallback
}
```

## Security Architecture

### Row Level Security (RLS) Policies
```sql
-- Example RLS policy for bookmarks table
CREATE POLICY "Users can only see their own bookmarks" 
ON bookmarks FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can only create their own bookmarks" 
ON bookmarks FOR INSERT 
WITH CHECK (auth.uid() = user_id);
```

### Authentication Flow
```
1. User Registration → Supabase Auth → Profile Creation
2. User Login → JWT Token → Session Storage
3. Protected Route → Token Validation → Component Access
4. API Call → RLS Policy Check → Data Access
```

## Performance Architecture

### Caching Strategy
```typescript
const cacheConfig = {
  // React Query cache times
  staleTime: {
    cafes: 5 * 60 * 1000,      // 5 minutes
    userProfile: 15 * 60 * 1000, // 15 minutes
    staticData: 60 * 60 * 1000   // 1 hour
  },
  
  // Image caching
  imageCache: {
    browser: 'Cache-Control: max-age=31536000', // 1 year
    cdn: 'CloudFront edge caching enabled'
  }
}
```

### Optimization Techniques
1. **Lazy Loading**: Components and images loaded on demand
2. **Code Splitting**: Route-based chunks for faster initial load
3. **Image Optimization**: WebP format with fallbacks
4. **Database Indexing**: Optimized queries with proper indexes
5. **Batch Operations**: Multiple operations combined when possible

## Cross-Platform Considerations

### Shared Architecture Components
- **Service Layer**: Identical across platforms
- **Data Models**: Same TypeScript interfaces
- **Business Logic**: Shared validation and transformation functions
- **State Management**: Same patterns (Context + React Query)

### Platform-Specific Adaptations
- **Navigation**: React Router vs React Navigation
- **UI Components**: Mantine vs NativeBase/React Native Elements
- **Animations**: Framer Motion vs React Native Reanimated
- **Platform APIs**: Web APIs vs Native APIs (camera, location, etc.)

This architecture supports scalable development across platforms while maintaining consistency and code reusability where possible.