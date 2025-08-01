# API Patterns

This document provides comprehensive coverage of Supabase query patterns, data fetching strategies, real-time subscriptions, and API design patterns used throughout the cafe finder application.

## Overview

The application uses Supabase as the backend-as-a-service, providing a complete API layer through PostgreSQL with Row Level Security (RLS), real-time subscriptions, and storage capabilities. The API patterns focus on performance, security, and maintainability while providing rich data access patterns.

## Supabase Client Configuration

### Client Setup
```typescript
// supabase-client.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
});
```

**Configuration Features:**
- **Session persistence**: Maintains login across browser sessions
- **Auto token refresh**: Handles token expiration automatically
- **URL session detection**: Supports email confirmation flows
- **Rate limiting**: Prevents real-time subscription overload

## Query Patterns

### Basic CRUD Operations

#### Create Operations
```typescript
// Insert single record
const createCafe = async (cafeData: CafeInput) => {
  const { data, error } = await supabase
    .from('cafes')
    .insert(cafeData)
    .select('*')  // Return the created record
    .single();    // Expect single result
  
  if (error) throw error;
  return data;
};

// Insert multiple records
const createMultipleCafes = async (cafesData: CafeInput[]) => {
  const { data, error } = await supabase
    .from('cafes')
    .insert(cafesData)
    .select('*');
  
  if (error) throw error;
  return data;
};
```

#### Read Operations
```typescript
// Fetch single record by ID
const getCafeById = async (id: number) => {
  const { data, error } = await supabase
    .from('cafes')
    .select('*')
    .eq('id', id)
    .single();
  
  if (error) throw error;
  return data;
};

// Fetch with specific columns
const getCafeBasicInfo = async (id: number) => {
  const { data, error } = await supabase
    .from('cafes')
    .select('id, name, location, upvotes, downvotes')
    .eq('id', id)
    .single();
  
  if (error) throw error;
  return data;
};

// Fetch with pagination
const getCafesWithPagination = async (page: number, limit: number) => {
  const from = page * limit;
  const to = from + limit - 1;
  
  const { data, error, count } = await supabase
    .from('cafes')
    .select('*, count() OVER()', { count: 'exact' })
    .range(from, to)
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return { data, count };
};
```

#### Update Operations
```typescript
// Update single record
const updateCafe = async (id: number, updates: Partial<Cafe>) => {
  const { data, error } = await supabase
    .from('cafes')
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select('*')
    .single();
  
  if (error) throw error;
  return data;
};

// Upsert operation
const upsertBookmark = async (userId: string, cafeId: number) => {
  const { data, error } = await supabase
    .from('bookmarks')
    .upsert({
      user_id: userId,
      cafe_id: cafeId,
      created_at: new Date().toISOString()
    }, {
      onConflict: 'user_id,cafe_id'
    })
    .select('*')
    .single();
  
  if (error) throw error;
  return data;
};
```

#### Delete Operations
```typescript
// Soft delete with status update
const softDeleteCafe = async (id: number) => {
  const { error } = await supabase
    .from('cafes')
    .update({
      status: 'deleted',
      deleted_at: new Date().toISOString()
    })
    .eq('id', id);
  
  if (error) throw error;
};

// Hard delete
const deleteBookmark = async (userId: string, cafeId: number) => {
  const { error } = await supabase
    .from('bookmarks')
    .delete()
    .eq('user_id', userId)
    .eq('cafe_id', cafeId);
  
  if (error) throw error;
};
```

### Complex Query Patterns

#### Multi-table Joins
```typescript
// Join with related data
const getCafesWithReviews = async () => {
  const { data, error } = await supabase
    .from('cafes')
    .select(`
      *,
      reviews (
        id,
        rating,
        comment,
        created_at,
        profiles (
          username,
          avatar_url
        )
      )
    `)
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data;
};

// Complex join with filtering
const getUserActivityFeed = async (followingIds: string[]) => {
  const { data, error } = await supabase
    .from('bookmarks')
    .select(`
      id,
      created_at,
      user_id,
      cafe_id,
      profiles!inner (
        username,
        avatar_url
      ),
      cafes!inner (
        id,
        name,
        location
      )
    `)
    .in('user_id', followingIds)
    .order('created_at', { ascending: false })
    .limit(20);
  
  if (error) throw error;
  return data;
};
```

#### Aggregation Queries
```typescript
// Count with grouping
const getCafeStatsByCity = async () => {
  const { data, error } = await supabase
    .from('cafes')
    .select('location->>city as city, count(*)')
    .group('location->>city')
    .order('count', { ascending: false });
  
  if (error) throw error;
  return data;
};

// Statistical aggregations
const getUserStats = async (userId: string) => {
  const { data, error } = await supabase
    .rpc('get_user_statistics', {
      user_id: userId
    });
  
  if (error) throw error;
  return data;
};
```

#### Full-Text Search
```typescript
// PostgreSQL full-text search
const searchCafesFullText = async (query: string) => {
  const { data, error } = await supabase
    .from('cafes')
    .select('*')
    .textSearch('fts', query, {
      type: 'websearch',
      config: 'english'
    })
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data;
};

// Case-insensitive pattern matching
const searchCafesPattern = async (query: string) => {
  const searchPattern = `%${query}%`;
  
  const { data, error } = await supabase
    .from('cafes')
    .select('*')
    .or(`name.ilike.${searchPattern},description.ilike.${searchPattern}`)
    .order('upvotes', { ascending: false });
  
  if (error) throw error;
  return data;
};
```

### JSON Column Operations

#### JSON Field Queries
```typescript
// Query JSON fields
const getCafesByCity = async (city: string) => {
  const { data, error } = await supabase
    .from('cafes')
    .select('*')
    .eq('location->>city', city);  // Extract JSON field
  
  if (error) throw error;
  return data;
};

// Complex JSON filtering
const getCafesNearLocation = async (lat: number, lng: number, radius: number) => {
  const { data, error } = await supabase
    .from('cafes')
    .select('*')
    .not('location->>latitude', 'is', null)
    .not('location->>longitude', 'is', null)
    .filter('location->>latitude', 'gte', (lat - radius).toString())
    .filter('location->>latitude', 'lte', (lat + radius).toString())
    .filter('location->>longitude', 'gte', (lng - radius).toString())
    .filter('location->>longitude', 'lte', (lng + radius).toString());
  
  if (error) throw error;
  return data;
};
```

#### JSON Field Updates
```typescript
// Update JSON field partially
const updateCafeLocation = async (id: number, locationUpdate: Partial<CafeLocation>) => {
  // First fetch current location
  const { data: currentCafe } = await supabase
    .from('cafes')
    .select('location')
    .eq('id', id)
    .single();
  
  const updatedLocation = {
    ...currentCafe.location,
    ...locationUpdate
  };
  
  const { data, error } = await supabase
    .from('cafes')
    .update({ location: updatedLocation })
    .eq('id', id)
    .select('*')
    .single();
  
  if (error) throw error;
  return data;
};
```

## Data Fetching Strategies

### React Query Integration

#### Query Configuration
```typescript
// React Query with Supabase
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// Basic query hook
const useCafes = () => {
  return useQuery({
    queryKey: ['cafes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cafes')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
  });
};

// Parameterized query
const useCafeById = (id: number) => {
  return useQuery({
    queryKey: ['cafe', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cafes')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!id, // Only run if id exists
  });
};
```

#### Mutation Patterns
```typescript
// Optimistic updates
const useBookmarkCafe = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ userId, cafeId }: { userId: string; cafeId: number }) => {
      const { data, error } = await supabase
        .from('bookmarks')
        .insert({
          user_id: userId,
          cafe_id: cafeId,
          created_at: new Date().toISOString()
        })
        .select('*')
        .single();
      
      if (error) throw error;
      return data;
    },
    onMutate: async ({ cafeId }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['bookmarks'] });
      
      // Snapshot previous value
      const previousBookmarks = queryClient.getQueryData(['bookmarks']);
      
      // Optimistically update
      queryClient.setQueryData(['bookmarks'], (old: any[]) => [
        ...old,
        { cafe_id: cafeId, created_at: new Date().toISOString() }
      ]);
      
      return { previousBookmarks };
    },
    onError: (err, variables, context) => {
      // Rollback on error
      queryClient.setQueryData(['bookmarks'], context?.previousBookmarks);
    },
    onSettled: () => {
      // Refetch after error or success
      queryClient.invalidateQueries({ queryKey: ['bookmarks'] });
    },
  });
};
```

### Caching Strategies

#### Query Key Management
```typescript
// Structured query keys
const queryKeys = {
  cafes: ['cafes'] as const,
  cafe: (id: number) => ['cafes', id] as const,
  cafesByCity: (city: string) => ['cafes', 'city', city] as const,
  cafesByUser: (userId: string) => ['cafes', 'user', userId] as const,
  
  bookmarks: ['bookmarks'] as const,
  bookmarksByUser: (userId: string) => ['bookmarks', 'user', userId] as const,
  
  users: ['users'] as const,
  user: (id: string) => ['users', id] as const,
  
  feed: (userId: string) => ['feed', userId] as const,
};

// Usage
const useCafesByCity = (city: string) => {
  return useQuery({
    queryKey: queryKeys.cafesByCity(city),
    queryFn: () => fetchCafesByCity(city),
  });
};
```

#### Cache Invalidation
```typescript
// Strategic invalidation
const useUpdateCafe = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: updateCafe,
    onSuccess: (data, variables) => {
      // Invalidate specific cafe
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.cafe(variables.id) 
      });
      
      // Update cafe in lists
      queryClient.setQueryData(queryKeys.cafes, (old: Cafe[]) =>
        old?.map(cafe => cafe.id === data.id ? data : cafe)
      );
      
      // Invalidate city-specific queries if location changed
      if (variables.location) {
        queryClient.invalidateQueries({
          queryKey: ['cafes', 'city']
        });
      }
    },
  });
};
```

### Error Handling Patterns

#### Service-Level Error Handling
```typescript
// Centralized error handling
const handleSupabaseError = (error: any, context: string) => {
  console.error(`Supabase error (${context}):`, error.message);
  
  // Log additional error details
  if (error.details) console.error('Details:', error.details);
  if (error.hint) console.error('Hint:', error.hint);
  
  // Handle specific error types
  switch (error.code) {
    case 'PGRST116': // Row not found
      throw new Error('Resource not found');
    case '42501': // Insufficient privilege (RLS)
      throw new Error('Access denied');
    case '23505': // Unique violation
      throw new Error('Resource already exists');
    default:
      throw error;
  }
};

// Timeout protection
const withTimeout = async <T>(
  promise: Promise<T>, 
  timeoutMs: number = 10000,
  context: string = 'query'
): Promise<T> => {
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => {
      reject(new Error(`${context} timeout after ${timeoutMs}ms`));
    }, timeoutMs);
  });
  
  return Promise.race([promise, timeoutPromise]);
};
```

#### React Query Error Boundaries
```typescript
// Global error handling
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error: any) => {
        // Don't retry on authentication errors
        if (error.status === 401) return false;
        
        // Don't retry on client errors
        if (error.status >= 400 && error.status < 500) return false;
        
        // Retry up to 3 times for server errors
        return failureCount < 3;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
    mutations: {
      retry: false, // Don't retry mutations by default
    },
  },
});
```

## Real-Time Subscriptions

### Subscription Patterns

#### Basic Subscriptions
```typescript
// Listen to table changes
const subscribeToNewCafes = (callback: (cafe: Cafe) => void) => {
  const channel = supabase
    .channel('new-cafes')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'cafes'
      },
      (payload) => {
        callback(payload.new as Cafe);
      }
    )
    .subscribe();
  
  return () => supabase.removeChannel(channel);
};

// Multiple event types
const subscribeToCafeChanges = (cafeId: number, callbacks: {
  onUpdate: (cafe: Cafe) => void;
  onDelete: (cafeId: number) => void;
}) => {
  const channel = supabase
    .channel(`cafe-${cafeId}`)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'cafes',
        filter: `id=eq.${cafeId}`
      },
      (payload) => {
        callbacks.onUpdate(payload.new as Cafe);
      }
    )
    .on(
      'postgres_changes',
      {
        event: 'DELETE',
        schema: 'public',
        table: 'cafes',
        filter: `id=eq.${cafeId}`
      },
      (payload) => {
        callbacks.onDelete(payload.old.id);
      }
    )
    .subscribe();
  
  return () => supabase.removeChannel(channel);
};
```

#### React Integration
```typescript
// Real-time React hook
const useRealtimeCafes = () => {
  const queryClient = useQueryClient();
  
  useEffect(() => {
    const channel = supabase
      .channel('cafes-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'cafes'
        },
        (payload) => {
          switch (payload.eventType) {
            case 'INSERT':
              queryClient.setQueryData(
                queryKeys.cafes,
                (old: Cafe[]) => [payload.new as Cafe, ...(old || [])]
              );
              break;
            
            case 'UPDATE':
              queryClient.setQueryData(
                queryKeys.cafes,
                (old: Cafe[]) =>
                  old?.map(cafe =>
                    cafe.id === payload.new.id ? payload.new as Cafe : cafe
                  )
              );
              break;
            
            case 'DELETE':
              queryClient.setQueryData(
                queryKeys.cafes,
                (old: Cafe[]) =>
                  old?.filter(cafe => cafe.id !== payload.old.id)
              );
              break;
          }
        }
      )
      .subscribe();
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);
};
```

### Presence System
```typescript
// Track user presence
const useUserPresence = (roomId: string) => {
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const { user } = useAuth();
  
  useEffect(() => {
    if (!user) return;
    
    const channel = supabase.channel(roomId, {
      config: {
        presence: {
          key: user.id,
        },
      },
    });
    
    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const users = Object.keys(state);
        setOnlineUsers(users);
      })
      .on('presence', { event: 'join' }, ({ key }) => {
        setOnlineUsers(prev => [...prev, key]);
      })
      .on('presence', { event: 'leave' }, ({ key }) => {
        setOnlineUsers(prev => prev.filter(id => id !== key));
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({
            userId: user.id,
            username: user.username,
            joinedAt: new Date().toISOString(),
          });
        }
      });
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomId, user]);
  
  return onlineUsers;
};
```

## Storage Patterns

### File Upload Strategies

#### Single File Upload
```typescript
const uploadCafeImage = async (file: File, cafeId: number): Promise<string> => {
  const fileExt = file.name.split('.').pop();
  const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
  const filePath = `cafe-${cafeId}/${fileName}`;
  
  const { data, error } = await supabase.storage
    .from('cafe-images')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false
    });
  
  if (error) throw error;
  
  const { data: { publicUrl } } = supabase.storage
    .from('cafe-images')
    .getPublicUrl(filePath);
  
  return publicUrl;
};
```

#### Batch Upload with Progress
```typescript
const uploadMultipleImages = async (
  files: File[],
  cafeId: number,
  onProgress: (progress: number) => void
): Promise<string[]> => {
  const urls: string[] = [];
  const total = files.length;
  
  for (let i = 0; i < files.length; i++) {
    try {
      const url = await uploadCafeImage(files[i], cafeId);
      urls.push(url);
      onProgress((i + 1) / total);
    } catch (error) {
      console.error(`Failed to upload file ${i}:`, error);
      // Continue with other files
    }
  }
  
  return urls;
};
```

### File Management
```typescript
// List files in bucket
const getCafeImages = async (cafeId: number): Promise<string[]> => {
  const { data, error } = await supabase.storage
    .from('cafe-images')
    .list(`cafe-${cafeId}`, {
      limit: 100,
      offset: 0,
      sortBy: { column: 'created_at', order: 'desc' }
    });
  
  if (error) throw error;
  
  return data.map(file => {
    const { data: { publicUrl } } = supabase.storage
      .from('cafe-images')
      .getPublicUrl(`cafe-${cafeId}/${file.name}`);
    
    return publicUrl;
  });
};

// Delete file
const deleteCafeImage = async (filePath: string): Promise<void> => {
  const { error } = await supabase.storage
    .from('cafe-images')
    .remove([filePath]);
  
  if (error) throw error;
};
```

## Performance Optimization

### Query Optimization

#### Selective Field Fetching
```typescript
// Only fetch needed fields
const getCafeListItems = async () => {
  const { data, error } = await supabase
    .from('cafes')
    .select('id, name, location, upvotes, image_urls')
    .limit(20);
  
  if (error) throw error;
  return data;
};

// Conditional field selection
const getCafeData = async (id: number, includeReviews: boolean = false) => {
  let selectClause = 'id, name, description, location, wifi, powerOutletAvailable, upvotes, downvotes';
  
  if (includeReviews) {
    selectClause += ', reviews(id, rating, comment, created_at, profiles(username))';
  }
  
  const { data, error } = await supabase
    .from('cafes')
    .select(selectClause)
    .eq('id', id)
    .single();
  
  if (error) throw error;
  return data;
};
```

#### Connection Pooling
```typescript
// Reuse connections efficiently
const connectionPool = {
  activeConnections: 0,
  maxConnections: 10,
  
  async executeQuery<T>(queryFn: () => Promise<T>): Promise<T> {
    if (this.activeConnections >= this.maxConnections) {
      throw new Error('Connection pool exhausted');
    }
    
    this.activeConnections++;
    try {
      return await queryFn();
    } finally {
      this.activeConnections--;
    }
  }
};
```

### Batch Operations

#### Bulk Insert
```typescript
const createMultipleBookmarks = async (bookmarks: BookmarkInput[]) => {
  // Batch size to prevent timeout
  const BATCH_SIZE = 100;
  const results = [];
  
  for (let i = 0; i < bookmarks.length; i += BATCH_SIZE) {
    const batch = bookmarks.slice(i, i + BATCH_SIZE);
    
    const { data, error } = await supabase
      .from('bookmarks')
      .insert(batch)
      .select('*');
    
    if (error) throw error;
    results.push(...data);
  }
  
  return results;
};
```

#### Batch Updates with RPC
```sql
-- Database function for batch updates
CREATE OR REPLACE FUNCTION update_cafe_votes(cafe_updates jsonb[])
RETURNS SETOF cafes AS $$
BEGIN
  RETURN QUERY
  UPDATE cafes
  SET 
    upvotes = (updates->>'upvotes')::integer,
    downvotes = (updates->>'downvotes')::integer,
    updated_at = now()
  FROM unnest(cafe_updates) AS updates
  WHERE cafes.id = (updates->>'id')::integer
  RETURNING cafes.*;
END;
$$ LANGUAGE plpgsql;
```

```typescript
// Use RPC for batch operations
const batchUpdateVotes = async (updates: { id: number; upvotes: number; downvotes: number }[]) => {
  const { data, error } = await supabase
    .rpc('update_cafe_votes', {
      cafe_updates: updates
    });
  
  if (error) throw error;
  return data;
};
```

## Security Patterns

### Row Level Security (RLS)

#### Policy Examples
```sql
-- Users can only see their own bookmarks
ALTER TABLE bookmarks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own bookmarks"
ON bookmarks FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own bookmarks"
ON bookmarks FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Cafe submissions are visible to admins and owners
CREATE POLICY "Admins can view all submissions"
ON cafe_submissions FOR SELECT
USING (
  auth.jwt() ->> 'username' = 'admin' OR
  auth.uid() = submitted_by
);
```

#### Service-Level RLS Handling
```typescript
// Graceful RLS handling
const getUserBookmarks = async (userId: string): Promise<Cafe[]> => {
  try {
    const { data, error } = await supabase
      .from('bookmarks')
      .select(`
        cafe_id,
        cafes (*)
      `)
      .eq('user_id', userId);
    
    // Handle RLS policy violations gracefully
    if (error && error.code === '42501') {
      console.warn('Access denied to bookmarks, returning empty array');
      return [];
    }
    
    if (error) throw error;
    
    return data?.map(bookmark => bookmark.cafes) || [];
  } catch (error) {
    console.error('Error fetching user bookmarks:', error);
    return [];
  }
};
```

### Authentication Integration
```typescript
// Authenticated queries
const getAuthenticatedUserData = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    throw new Error('User not authenticated');
  }
  
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', session.user.id)
    .single();
  
  if (error) throw error;
  return data;
};
```

This comprehensive API patterns documentation provides the foundation for efficient, secure, and maintainable data access patterns throughout the cafe finder application.