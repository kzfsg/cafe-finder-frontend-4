import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Paper, Avatar, Text, Group, Stack, Badge, Card, Image } from '@mantine/core';
import { FiMapPin, FiStar, FiBookmark } from 'react-icons/fi';
import FollowButton from './FollowButton';
import type { UserWithFollowerInfo } from '../services/followerService';
import bookmarkService from '../services/bookmarkService';
import reviewService from '../services/reviewService';
import type { Review } from '../services/reviewService';
import type { Cafe } from '../data/cafes';
import '../styles/UserCard.css';

interface UserCardProps {
  user: UserWithFollowerInfo;
  onFollowChange?: (userId: string, isFollowing: boolean) => void;
}

interface BookmarkedCafe {
  id: number;
  title?: string;
  name?: string;
  image?: string;
}

const UserCard: React.FC<UserCardProps> = ({ user, onFollowChange }) => {
  const navigate = useNavigate();
  const [bookmarkedCafes, setBookmarkedCafes] = useState<BookmarkedCafe[]>([]);
  const [recentReview, setRecentReview] = useState<Review | null>(null);
  const [isLoadingData, setIsLoadingData] = useState(true);

  useEffect(() => {
    loadUserData();
  }, [user.id]);

  const loadUserData = async () => {
    try {
      setIsLoadingData(true);
      
      // Load user's bookmarked cafes (limited to 3 for display)
      const bookmarks = await bookmarkService.getBookmarkedCafes(user.id, 3);
      setBookmarkedCafes(bookmarks.map(cafe => ({
        id: cafe.id,
        title: cafe.title || cafe.name,
        name: cafe.name,
        image: cafe.image
      })));

      // Load user's most recent review
      const reviews = await reviewService.getUserReviews(user.id, 1);
      if (reviews.length > 0) {
        setRecentReview(reviews[0]);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setIsLoadingData(false);
    }
  };

  const handleCardClick = (e: React.MouseEvent) => {
    // Don't navigate if clicking on follow button or other interactive elements
    if ((e.target as HTMLElement).closest('.follow-button, .user-card-bookmark')) {
      return;
    }
    navigate(`/profile/${user.id}`);
  };

  const handleBookmarkClick = (cafe: BookmarkedCafe, e: React.MouseEvent) => {
    e.stopPropagation();
    // Navigate to cafe details or handle bookmark click
    console.log('Cafe clicked:', cafe);
  };

  const handleFollowChange = (isFollowing: boolean) => {
    if (onFollowChange) {
      onFollowChange(user.id, isFollowing);
    }
  };

  return (
    <Paper 
      className="user-card" 
      shadow="sm" 
      p="lg" 
      radius="md"
      onClick={handleCardClick}
    >
      <Stack gap="md">
        {/* User Header */}
        <Group gap="md">
          <Avatar
            src={user.avatar_url || '/images/default-avatar.svg'}
            size="lg"
            radius="xl"
          />
          <div className="user-info">
            <Group gap="xs" align="center">
              <Text fw={500} size="lg">{user.username}</Text>
              {user.is_merchant && (
                <Badge color="blue" size="sm" variant="light">
                  Cafe Owner
                </Badge>
              )}
            </Group>
            <Text size="sm" color="dimmed">
              {user.followers_count} followers · {user.following_count} following
            </Text>
          </div>
          <div className="user-actions">
            <FollowButton
              userId={user.id}
              username={user.username}
              size="sm"
              onFollowChange={handleFollowChange}
            />
          </div>
        </Group>

        {/* Bookmarked Cafes */}
        <div className="user-bookmarks-section">
          <Group gap="xs" mb="xs">
            <FiBookmark size={16} />
            <Text size="sm" fw={500}>Bookmarked Cafes</Text>
          </Group>
          {isLoadingData ? (
            <Text size="xs" color="dimmed">Loading...</Text>
          ) : bookmarkedCafes.length > 0 ? (
            <div className="bookmarks-grid">
              {bookmarkedCafes.slice(0, 3).map((cafe) => (
                <Card
                  key={cafe.id}
                  className="user-card-bookmark"
                  p="xs"
                  radius="sm"
                  onClick={(e) => handleBookmarkClick(cafe, e)}
                >
                  <Image
                    src={cafe.image || '/images/no-image.svg'}
                    alt={cafe.title || cafe.name || 'Cafe'}
                    height={60}
                    radius="sm"
                    fallbackSrc="/images/no-image.svg"
                  />
                  <Text size="xs" ta="center" mt="xs" lineClamp={2}>
                    {cafe.title || cafe.name || 'Unnamed Cafe'}
                  </Text>
                </Card>
              ))}
            </div>
          ) : (
            <Text size="xs" color="dimmed">No bookmarked cafes yet</Text>
          )}
        </div>

        {/* Recent Review */}
        <div className="user-review-section">
          <Group gap="xs" mb="xs">
            <FiStar size={16} />
            <Text size="sm" fw={500}>Latest Review</Text>
          </Group>
          {isLoadingData ? (
            <Text size="xs" color="dimmed">Loading...</Text>
          ) : recentReview ? (
            <div className="recent-review">
              <Group gap="xs" mb="xs">
                <Text size="xs" fw={500}>{recentReview.cafe_name}</Text>
                <Badge 
                  color={recentReview.rating ? 'green' : 'red'} 
                  size="xs"
                  variant="light"
                >
                  {recentReview.rating ? '👍' : '👎'}
                </Badge>
              </Group>
              <Text size="xs" color="dimmed" lineClamp={2}>
                {recentReview.review_text || 'No review text'}
              </Text>
              <Text size="xs" color="dimmed" mt="xs">
                {new Date(recentReview.created_at).toLocaleDateString()}
              </Text>
            </div>
          ) : (
            <Text size="xs" color="dimmed">No reviews yet</Text>
          )}
        </div>
      </Stack>
    </Paper>
  );
};

export default UserCard;