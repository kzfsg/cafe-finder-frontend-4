import { supabase } from '../supabase-client';
import followerService from './followerService';
import type { Cafe } from '../data/cafes';

// Activity types
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

const feedService = {
  // Get activity feed from followed users
  getFriendsFeed: async (limit: number = 20, offset: number = 0): Promise<FeedActivity[]> => {
    try {
      const { data: { user: currentUser }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !currentUser) {
        return [];
      }

      // Get users that current user follows
      const following = await followerService.getFollowing(currentUser.id, 100, 0);
      
      if (following.length === 0) {
        return [];
      }

      const followingIds = following.map(user => user.id);
      
      // Get all activities from followed users
      const activities: FeedActivity[] = [];
      
      // Get bookmarks
      const bookmarks = await feedService.getBookmarkActivities(followingIds, limit / 4);
      activities.push(...bookmarks);
      
      // Get reviews
      const reviews = await feedService.getReviewActivities(followingIds, limit / 4);
      activities.push(...reviews);
      
      // Get upvotes
      const upvotes = await feedService.getUpvoteActivities(followingIds, limit / 4);
      activities.push(...upvotes);
      
      // Get downvotes
      const downvotes = await feedService.getDownvoteActivities(followingIds, limit / 4);
      activities.push(...downvotes);
      
      // Sort by created_at and limit
      const sortedActivities = activities
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(offset, offset + limit);
      
      return sortedActivities;
    } catch (error) {
      console.error('Error fetching friends feed:', error);
      return [];
    }
  },

  // Get bookmark activities
  getBookmarkActivities: async (userIds: string[], limit: number = 5): Promise<FeedActivity[]> => {
    try {
      // First get bookmarks for these users
      const { data: bookmarks, error: bookmarkError } = await supabase
        .from('bookmarks')
        .select('id, created_at, user_id, cafe_id')
        .in('user_id', userIds)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (bookmarkError) {
        console.warn('Could not fetch bookmarks:', bookmarkError);
        return [];
      }

      if (!bookmarks || bookmarks.length === 0) {
        return [];
      }

      // Get user profiles
      const userIds_unique = [...new Set(bookmarks.map(b => b.user_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, username, avatar_url')
        .in('id', userIds_unique);

      // Get cafe details
      const cafeIds = [...new Set(bookmarks.map(b => b.cafe_id))];
      const { data: cafes } = await supabase
        .from('cafes')
        .select('id, name, imageUrls')
        .in('id', cafeIds);

      // Combine data
      return bookmarks.map(bookmark => {
        const profile = profiles?.find(p => p.id === bookmark.user_id);
        const cafe = cafes?.find(c => c.id === bookmark.cafe_id);
        
        return {
          id: `bookmark_${bookmark.id}`,
          type: 'bookmark' as ActivityType,
          user_id: bookmark.user_id,
          username: profile?.username || 'Unknown User',
          avatar_url: profile?.avatar_url,
          cafe_id: bookmark.cafe_id,
          cafe_name: cafe?.name || 'Unknown Cafe',
          cafe_image: cafe?.imageUrls?.[0],
          created_at: bookmark.created_at
        };
      });
    } catch (error) {
      console.error('Error fetching bookmark activities:', error);
      return [];
    }
  },

  // Get review activities
  getReviewActivities: async (userIds: string[], limit: number = 5): Promise<FeedActivity[]> => {
    try {
      // First get reviews for these users
      const { data: reviews, error: reviewError } = await supabase
        .from('reviews')
        .select('id, created_at, user_id, cafe_id, rating, comment')
        .in('user_id', userIds)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (reviewError) {
        console.warn('Could not fetch reviews:', reviewError);
        return [];
      }

      if (!reviews || reviews.length === 0) {
        return [];
      }

      // Get user profiles
      const userIds_unique = [...new Set(reviews.map(r => r.user_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, username, avatar_url')
        .in('id', userIds_unique);

      // Get cafe details
      const cafeIds = [...new Set(reviews.map(r => r.cafe_id))];
      const { data: cafes } = await supabase
        .from('cafes')
        .select('id, name, imageUrls')
        .in('id', cafeIds);

      // Combine data
      return reviews.map(review => {
        const profile = profiles?.find(p => p.id === review.user_id);
        const cafe = cafes?.find(c => c.id === review.cafe_id);
        
        return {
          id: `review_${review.id}`,
          type: 'review' as ActivityType,
          user_id: review.user_id,
          username: profile?.username || 'Unknown User',
          avatar_url: profile?.avatar_url,
          cafe_id: review.cafe_id,
          cafe_name: cafe?.name || 'Unknown Cafe',
          cafe_image: cafe?.imageUrls?.[0],
          created_at: review.created_at,
          rating: review.rating,
          comment: review.comment
        };
      });
    } catch (error) {
      console.error('Error fetching review activities:', error);
      return [];
    }
  },

  // Get upvote activities
  getUpvoteActivities: async (userIds: string[], limit: number = 5): Promise<FeedActivity[]> => {
    try {
      // Try user_upvotes table first (as suggested by the hint)
      const tableName = 'user_upvotes';
      const { data: upvotes, error: upvoteError } = await supabase
        .from(tableName)
        .select('id, created_at, user_id, cafe_id')
        .in('user_id', userIds)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (upvoteError) {
        console.warn('Could not fetch upvotes:', upvoteError);
        return [];
      }

      if (!upvotes || upvotes.length === 0) {
        return [];
      }

      // Get user profiles
      const userIds_unique = [...new Set(upvotes.map(u => u.user_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, username, avatar_url')
        .in('id', userIds_unique);

      // Get cafe details
      const cafeIds = [...new Set(upvotes.map(u => u.cafe_id))];
      const { data: cafes } = await supabase
        .from('cafes')
        .select('id, name, imageUrls')
        .in('id', cafeIds);

      // Combine data
      return upvotes.map(upvote => {
        const profile = profiles?.find(p => p.id === upvote.user_id);
        const cafe = cafes?.find(c => c.id === upvote.cafe_id);
        
        return {
          id: `upvote_${upvote.id}`,
          type: 'upvote' as ActivityType,
          user_id: upvote.user_id,
          username: profile?.username || 'Unknown User',
          avatar_url: profile?.avatar_url,
          cafe_id: upvote.cafe_id,
          cafe_name: cafe?.name || 'Unknown Cafe',
          cafe_image: cafe?.imageUrls?.[0],
          created_at: upvote.created_at
        };
      });
    } catch (error) {
      console.error('Error fetching upvote activities:', error);
      return [];
    }
  },

  // Get downvote activities
  getDownvoteActivities: async (userIds: string[], limit: number = 5): Promise<FeedActivity[]> => {
    try {
      // Try user_downvotes table first (as suggested by the hint)
      const tableName = 'user_downvotes';
      const { data: downvotes, error: downvoteError } = await supabase
        .from(tableName)
        .select('id, created_at, user_id, cafe_id')
        .in('user_id', userIds)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (downvoteError) {
        console.warn('Could not fetch downvotes:', downvoteError);
        return [];
      }

      if (!downvotes || downvotes.length === 0) {
        return [];
      }

      // Get user profiles
      const userIds_unique = [...new Set(downvotes.map(d => d.user_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, username, avatar_url')
        .in('id', userIds_unique);

      // Get cafe details
      const cafeIds = [...new Set(downvotes.map(d => d.cafe_id))];
      const { data: cafes } = await supabase
        .from('cafes')
        .select('id, name, imageUrls')
        .in('id', cafeIds);

      // Combine data
      return downvotes.map(downvote => {
        const profile = profiles?.find(p => p.id === downvote.user_id);
        const cafe = cafes?.find(c => c.id === downvote.cafe_id);
        
        return {
          id: `downvote_${downvote.id}`,
          type: 'downvote' as ActivityType,
          user_id: downvote.user_id,
          username: profile?.username || 'Unknown User',
          avatar_url: profile?.avatar_url,
          cafe_id: downvote.cafe_id,
          cafe_name: cafe?.name || 'Unknown Cafe',
          cafe_image: cafe?.imageUrls?.[0],
          created_at: downvote.created_at
        };
      });
    } catch (error) {
      console.error('Error fetching downvote activities:', error);
      return [];
    }
  },

  // Get activity statistics for a user
  getActivityStats: async (userId: string): Promise<{
    total_bookmarks: number;
    total_reviews: number;
    total_upvotes: number;
    total_downvotes: number;
  }> => {
    try {
      const [bookmarks, reviews, upvotes, downvotes] = await Promise.all([
        supabase
          .from('bookmarks')
          .select('id', { count: 'exact' })
          .eq('user_id', userId),
        supabase
          .from('reviews')
          .select('id', { count: 'exact' })
          .eq('user_id', userId),
        supabase
          .from('upvotes')
          .select('id', { count: 'exact' })
          .eq('user_id', userId),
        supabase
          .from('downvotes')
          .select('id', { count: 'exact' })
          .eq('user_id', userId)
      ]);

      return {
        total_bookmarks: bookmarks.count || 0,
        total_reviews: reviews.count || 0,
        total_upvotes: upvotes.count || 0,
        total_downvotes: downvotes.count || 0
      };
    } catch (error) {
      console.error('Error fetching activity stats:', error);
      return {
        total_bookmarks: 0,
        total_reviews: 0,
        total_upvotes: 0,
        total_downvotes: 0
      };
    }
  }
};

export default feedService;