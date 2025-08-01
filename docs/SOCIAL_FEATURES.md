# Social Features

This document provides comprehensive coverage of the social networking features implemented in the cafe finder application, including the following system, activity feed logic, user discovery, and social interactions.

## Overview

The social features transform the application from a simple cafe directory into a community-driven platform where users can:

- Follow other cafe enthusiasts and merchants
- See real-time activity feeds from followed users
- Discover new users and build social connections
- Share cafe experiences through bookmarks, reviews, and votes
- View public profiles and social statistics

## Following System Architecture

### Core Components

#### `followerService.ts` - Relationship Management

The follower service manages all social relationships between users:

```typescript
interface FollowerRelationship {
  id: string;
  follower_id: string;  // User doing the following
  following_id: string; // User being followed
  created_at: string;
}
```

**Key Methods:**
- `followUser(followingId)` - Create follow relationship
- `unfollowUser(followingId)` - Remove follow relationship
- `toggleFollow(followingId)` - Toggle follow status
- `isFollowing(followingId)` - Check follow status
- `getFollowerStats(userId)` - Get follower/following counts

#### Database Schema

The social system relies on the `followers` table:

```sql
CREATE TABLE followers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  following_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(follower_id, following_id)
);
```

### Social Relationship Types

#### Bidirectional Relationships

The system tracks multiple relationship states:

```typescript
interface UserWithFollowerInfo extends User {
  followers_count?: number;
  following_count?: number;
  is_following?: boolean;    // Current user follows this user
  is_followed_by?: boolean;  // This user follows current user
}
```

**Relationship Matrix:**
- **Mutual Following**: Both users follow each other
- **One-way Following**: Only one user follows the other
- **No Relationship**: Neither user follows the other

#### Privacy and Security

**RLS (Row Level Security) Integration:**
- Follow relationships respect user privacy settings
- Graceful handling of policy violations (returns false instead of errors)
- No exposure of private user data in public follower lists

## Activity Feed System

### Feed Architecture

#### `feedService.ts` - Activity Aggregation

The feed service aggregates activities from followed users:

```typescript
type ActivityType = 'bookmark' | 'review' | 'upvote' | 'downvote';

interface FeedActivity {
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

### Activity Types

#### 1. Bookmark Activities
```typescript
// Tracks when users bookmark cafes
getBookmarkActivities(userIds: string[], limit: number): Promise<FeedActivity[]>
```

**Data Source**: `bookmarks` table
**Display**: "John bookmarked Blue Bottle Coffee"

#### 2. Review Activities
```typescript
// Tracks cafe reviews with ratings and comments
getReviewActivities(userIds: string[], limit: number): Promise<FeedActivity[]>
```

**Data Source**: `reviews` table
**Display**: "Sarah recommended Stumptown Coffee" + review text
**Features**: Shows positive/negative rating and comment text

#### 3. Upvote Activities
```typescript
// Tracks positive cafe votes
getUpvoteActivities(userIds: string[], limit: number): Promise<FeedActivity[]>
```

**Data Source**: `user_upvotes` table
**Display**: "Mike upvoted Local Coffee Co."

#### 4. Downvote Activities
```typescript
// Tracks negative cafe votes
getDownvoteActivities(userIds: string[], limit: number): Promise<FeedActivity[]>
```

**Data Source**: `user_downvotes` table
**Display**: "Emma downvoted Chain Coffee Shop"

### Feed Generation Algorithm

#### Multi-Source Aggregation

```typescript
const getFriendsFeed = async (limit: number = 20, offset: number = 0) => {
  // 1. Get followed users
  const following = await followerService.getFollowing(currentUser.id);
  const followingIds = following.map(user => user.id);
  
  // 2. Collect activities from all sources
  const activities = [];
  activities.push(...await getBookmarkActivities(followingIds, limit / 4));
  activities.push(...await getReviewActivities(followingIds, limit / 4));
  activities.push(...await getUpvoteActivities(followingIds, limit / 4));
  activities.push(...await getDownvoteActivities(followingIds, limit / 4));
  
  // 3. Sort by timestamp and paginate
  return activities
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(offset, offset + limit);
};
```

#### Performance Optimizations

**Batch Processing:**
- Fetches activities in parallel from all sources
- Combines user profiles and cafe data efficiently
- Uses cafe image transformation for consistent URLs

**Caching Strategy:**
- Service-level caching for user profiles
- Cafe data transformation with image URL caching
- Efficient database queries with proper indexing

## User Discovery System

### Find Friends Feature

#### `FindFriendsPage.tsx` - User Discovery Interface

**Core Functionality:**
- Paginated user listing with batch loading
- Real-time follow/unfollow interactions
- User statistics and profile previews
- Filter by account type (users vs merchants)

```typescript
const getAllUsers = async (limit: number = 3, offset: number = 0) => {
  // Get users excluding current user
  const users = await supabase
    .from('profiles')
    .select('*')
    .neq('id', currentUser.id)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);
    
  // Enrich with social data
  return users.map(async user => ({
    ...user,
    followers_count: await getFollowerStats(user.id).followers_count,
    following_count: await getFollowerStats(user.id).following_count,
    is_following: await isFollowing(user.id),
    is_followed_by: await isFollowedBy(user.id)
  }));
};
```

#### User Discovery Algorithm

**Ranking Factors:**
1. **Recency**: Newer users appear first
2. **Activity Level**: Users with more social interactions rank higher
3. **Mutual Connections**: Users with mutual followers get priority
4. **Account Type**: Merchants and verified users may rank higher

### Mutual Followers Feature

```typescript
const getMutualFollowers = async (userId: string, limit: number = 10) => {
  // Find users who follow both current user and target user
  return supabase
    .from('followers')
    .select('follower_id, profiles(*)')
    .eq('following_id', userId)
    .in('follower_id', 
      supabase.from('followers')
        .select('follower_id')
        .eq('following_id', currentUser.id)
    )
    .limit(limit);
};
```

## Social UI Components

### Core Social Components

#### `UserCard.tsx` - User Profile Cards

**Features:**
- Avatar display with fallback handling
- Username and account type indicators
- Follower/following statistics
- Follow/unfollow button integration
- Merchant verification badges

```typescript
interface UserCardProps {
  user: UserWithFollowerInfo;
  showFollowButton?: boolean;
  showStats?: boolean;
  onFollowChange?: (userId: string, isFollowing: boolean) => void;
}
```

#### `FollowButton.tsx` - Follow Action Component  

**States:**
- **Loading**: During follow/unfollow API calls
- **Following**: User is currently followed
- **Follow**: User is not followed
- **Disabled**: Cannot follow (self, errors, etc.)

```typescript
interface FollowButtonProps {
  targetUserId: string;
  initialIsFollowing?: boolean;
  onFollowChange?: (isFollowing: boolean) => void;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  variant?: 'filled' | 'outline' | 'light';
}
```

#### `ActivityFeedItem.tsx` - Feed Activity Display

**Components:**
- User avatar and username (clickable to profile)
- Activity type badge with icon and color coding
- Timestamp with relative formatting ("2h ago")
- Cafe information with image and navigation
- Activity-specific content (review text, etc.)
- Action buttons (View Cafe, etc.)

```typescript
const getActivityIcon = (type: ActivityType) => {
  switch (type) {
    case 'bookmark': return <FiBookmark color="#f59e0b" />;
    case 'review': return <FiMessageCircle color="#3b82f6" />;
    case 'upvote': return <FiThumbsUp color="#10b981" />;
    case 'downvote': return <FiThumbsDown color="#ef4444" />;
  }
};
```

### Social Navigation

#### `Navbar.tsx` Integration

**Social Features in Navigation:**
- Friends Feed button with activity indicator
- User dropdown with profile and social links
- Find Friends quick access
- Follower/Following counts in user menu

## Page Implementations

### Friends Feed Page

#### `FriendsFeedPage.tsx` - Social Activity Stream

**Features:**
- Real-time activity feed from followed users
- Pull-to-refresh functionality
- Infinite scroll with "Load More" pagination
- Empty states for no followers/activity
- Activity statistics display
- Direct navigation to Find Friends

**State Management:**
```typescript
const [activities, setActivities] = useState<FeedActivity[]>([]);
const [loading, setLoading] = useState(true);
const [refreshing, setRefreshing] = useState(false);
const [hasMore, setHasMore] = useState(true);
const [followingCount, setFollowingCount] = useState(0);
```

**Empty State Handling:**
- **No Following**: Prompts user to find friends
- **No Activity**: Encourages friends to be active
- **Loading States**: Skeleton screens and spinners

### Profile Pages

#### Public Profile Viewing

**Features:**
- View other users' public profiles
- See public activity (respecting privacy)
- Follow/unfollow from profile page
- Mutual followers display
- Social statistics

#### Privacy Controls

**Public Data:**
- Username, avatar, bio
- Public cafe activities
- Follower/following counts
- Merchant verification status

**Private Data:**
- Email addresses
- Private bookmarks/reviews
- Personal contact information
- Activity from private accounts

### Followers Management

#### `FollowersPage.tsx` - Social Connections

**Features:**
- Separate tabs for Followers vs Following
- Search and filter connections
- Bulk follow/unfollow actions
- Mutual followers highlighting
- User activity summaries

## Social Interactions Logic

### Real-time Updates

#### Optimistic UI Updates

```typescript
const handleFollowChange = (userId: string, isFollowing: boolean) => {
  // Immediately update UI
  setUsers(prev => prev.map(user => 
    user.id === userId 
      ? { 
          ...user, 
          is_following: isFollowing,
          followers_count: isFollowing 
            ? (user.followers_count || 0) + 1 
            : Math.max(0, (user.followers_count || 0) - 1)
        }
      : user
  ));
  
  // Then sync with backend
  followerService.toggleFollow(userId);
};
```

#### Activity Broadcasting

When users perform actions:
1. **Immediate Feedback**: UI updates instantly
2. **Database Update**: Action persisted to database  
3. **Feed Propagation**: Activity appears in followers' feeds
4. **Notification Triggers**: Optional push notifications

### Social Algorithms

#### Activity Ranking

**Factors:**
- **Recency**: Newer activities rank higher
- **Relevance**: Activities from closer connections prioritized
- **Engagement**: Activities with more interactions boosted
- **Diversity**: Mix of activity types maintained

#### User Recommendations

**Friend Suggestions Based On:**
- Mutual followers
- Similar cafe preferences
- Geographic proximity
- Activity patterns
- Account type compatibility

## Error Handling and Edge Cases

### Graceful Degradation

#### Network Issues
- **Offline Mode**: Cached data display
- **Slow Connections**: Progressive loading
- **API Failures**: Fallback to cached content

#### Privacy Policy Violations
```typescript
// Handle RLS policy blocks gracefully
if (error.message?.includes('policy') || error.code === '42501') {
  console.warn('Database policy blocking access. Using fallback.');
  return fallbackData;
}
```

#### Edge Cases
- **Self-following**: Prevented at UI and API level
- **Deleted Users**: Graceful handling of broken relationships
- **Private Accounts**: Respect privacy settings
- **Blocked Users**: Handle blocking relationships

### Performance Considerations

#### Pagination Strategy
- **Batch Size**: Optimized for mobile and desktop
- **Infinite Scroll**: Smooth loading experience
- **Memory Management**: Old activities garbage collected

#### Database Optimization
- **Indexes**: Proper indexing on follower relationships
- **Query Optimization**: Efficient joins and filters
- **Connection Pooling**: Database connection management

## Integration with Core Features

### Cafe Discovery Enhancement

**Social Context:**
- Show which friends bookmarked/reviewed cafes
- Display friend activity on cafe pages
- Social proof in search results
- Friend recommendations for cafes

### Bookmark System Integration

**Social Bookmarking:**
- See friends' bookmark collections
- Bookmark activity in social feed
- Shared bookmark collections
- Social discovery through bookmarks

### Review System Enhancement

**Social Reviews:**
- Friend review highlighting
- Review activity broadcasting
- Social validation of reviews
- Community moderation

## Future Social Features

### Planned Enhancements

#### Group Features
- Create cafe discovery groups
- Group activity feeds
- Shared bookmark collections
- Group cafe visits

#### Advanced Notifications
- Push notifications for friend activity
- Email digest of social activity
- Custom notification preferences
- Activity summary reports

#### Social Gamification
- Achievement badges for social activity
- Leaderboards for cafe discovery
- Social challenges and competitions
- Community recognition programs

This comprehensive social system transforms the cafe finder into a thriving community platform where users can connect, share experiences, and discover cafes through their social networks.