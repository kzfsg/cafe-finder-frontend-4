import { useState, useEffect } from 'react';
import { Avatar, Text, Stack, Button, Group, Loader, Paper } from '@mantine/core';
import { Link } from 'react-router-dom';
import { FiUser, FiUsers } from 'react-icons/fi';
import followerService, { type UserWithFollowerInfo } from '../services/followerService';
import FollowButton from './FollowButton';
import '../styles/FollowersList.css';

interface FollowersListProps {
  userId: string;
  type: 'followers' | 'following';
  maxHeight?: number;
  showFollowButtons?: boolean;
}

const FollowersList: React.FC<FollowersListProps> = ({
  userId,
  type,
  maxHeight = 400,
  showFollowButtons = true
}) => {
  const [users, setUsers] = useState<UserWithFollowerInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadUsers();
  }, [userId, type]);

  const loadUsers = async (offset: number = 0) => {
    try {
      setIsLoading(offset === 0);
      setError(null);
      
      const newUsers = type === 'followers' 
        ? await followerService.getFollowers(userId, 20, offset)
        : await followerService.getFollowing(userId, 20, offset);
      
      if (offset === 0) {
        setUsers(newUsers);
      } else {
        setUsers(prev => [...prev, ...newUsers]);
      }
      
      setHasMore(newUsers.length === 20);
    } catch (err) {
      console.error(`Error loading ${type}:`, err);
      setError(`Failed to load ${type}`);
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  };

  const handleLoadMore = () => {
    if (!isLoadingMore && hasMore) {
      setIsLoadingMore(true);
      loadUsers(users.length);
    }
  };

  const handleFollowChange = (targetUserId: string, isFollowing: boolean) => {
    setUsers(prev => 
      prev.map(user => 
        user.id === targetUserId 
          ? { ...user, is_following: isFollowing }
          : user
      )
    );
  };

  if (isLoading) {
    return (
      <div className="followers-list-loading">
        <Loader size="md" />
        <Text color="dimmed" size="sm">Loading {type}...</Text>
      </div>
    );
  }

  if (error) {
    return (
      <div className="followers-list-error">
        <Text color="red" size="sm">{error}</Text>
        <Button 
          size="xs" 
          variant="subtle" 
          onClick={() => loadUsers()}
          mt="sm"
        >
          Try Again
        </Button>
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <div className="followers-list-empty">
        <div className="empty-icon">
          {type === 'followers' ? <FiUsers size={48} /> : <FiUser size={48} />}
        </div>
        <Text color="dimmed" size="sm">
          {type === 'followers' ? 'No followers yet' : 'Not following anyone yet'}
        </Text>
      </div>
    );
  }

  return (
    <div className="followers-list" style={{ maxHeight }}>
      <Stack gap="md">
        {users.map((user) => (
          <Paper key={user.id} className="follower-item" p="sm" shadow="xs">
            <Group gap="sm">
              <Avatar
                src={user.avatar_url || '/images/default-avatar.svg'}
                size="md"
                radius="xl"
              />
              
              <div className="follower-info">
                <Link to={`/profile/${user.id}`} className="follower-name-link">
                  <Text size="sm" weight={500}>
                    {user.username}
                  </Text>
                </Link>
                {user.is_merchant && (
                  <Text size="xs" color="blue">
                    Cafe Owner
                  </Text>
                )}
                <div className="follower-stats">
                  <Text size="xs" color="dimmed">
                    {user.followers_count} followers · {user.following_count} following
                  </Text>
                </div>
              </div>
              
              {showFollowButtons && (
                <div className="follower-actions">
                  <FollowButton
                    userId={user.id}
                    username={user.username}
                    size="xs"
                    onFollowChange={(isFollowing) => handleFollowChange(user.id, isFollowing)}
                  />
                </div>
              )}
            </Group>
          </Paper>
        ))}
        
        {hasMore && (
          <Button
            variant="subtle"
            size="sm"
            onClick={handleLoadMore}
            loading={isLoadingMore}
            className="load-more-btn"
          >
            Load More
          </Button>
        )}
      </Stack>
    </div>
  );
};

export default FollowersList;