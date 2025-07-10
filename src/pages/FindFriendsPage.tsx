import { useState, useEffect } from 'react';
import { Container, Title, Stack, Button, Text, Loader, Group, Grid } from '@mantine/core';
import { FiUsers, FiRefreshCw } from 'react-icons/fi';
import UserCard from '../components/UserCard';
import followerService, { type UserWithFollowerInfo } from '../services/followerService';
import '../styles/FindFriendsPage.css';

const FindFriendsPage = () => {
  const [users, setUsers] = useState<UserWithFollowerInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [offset, setOffset] = useState(0);

  const BATCH_SIZE = 3;

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async (reset: boolean = false) => {
    try {
      if (reset) {
        setIsLoading(true);
        setOffset(0);
        setUsers([]);
        setError(null);
      } else {
        setIsLoadingMore(true);
      }

      const currentOffset = reset ? 0 : offset;
      const newUsers = await followerService.getAllUsers(BATCH_SIZE, currentOffset);
      
      if (reset) {
        setUsers(newUsers);
      } else {
        setUsers(prev => [...prev, ...newUsers]);
      }
      
      // Check if we have more users to load
      setHasMore(newUsers.length === BATCH_SIZE);
      setOffset(currentOffset + BATCH_SIZE);
      
    } catch (err) {
      console.error('Error loading users:', err);
      setError('Failed to load users. Please try again.');
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  };

  const handleLoadMore = () => {
    if (!isLoadingMore && hasMore) {
      loadUsers(false);
    }
  };

  const handleRefresh = () => {
    loadUsers(true);
  };

  const handleFollowChange = (userId: string, isFollowing: boolean) => {
    setUsers(prev => 
      prev.map(user => 
        user.id === userId 
          ? { 
              ...user, 
              is_following: isFollowing,
              followers_count: isFollowing 
                ? (user.followers_count || 0) + 1 
                : Math.max(0, (user.followers_count || 0) - 1)
            }
          : user
      )
    );
  };

  if (isLoading) {
    return (
      <Container size="lg" className="find-friends-page">
        <div className="loading-container">
          <Loader size="lg" />
          <Text mt="md">Discovering amazing people...</Text>
        </div>
      </Container>
    );
  }

  if (error) {
    return (
      <Container size="lg" className="find-friends-page">
        <div className="error-container">
          <Text color="red" size="lg" mb="md">{error}</Text>
          <Button onClick={handleRefresh} leftSection={<FiRefreshCw size={16} />}>
            Try Again
          </Button>
        </div>
      </Container>
    );
  }

  return (
    <Container size="lg" className="find-friends-page">
      <div className="page-header">
        <Group justify="space-between" align="center">
          <div>
            <Title order={1} className="page-title">
              <FiUsers size={32} style={{ marginRight: '0.5rem', verticalAlign: 'middle' }} />
              Find Friends
            </Title>
            <Text color="dimmed" size="lg" mt="xs">
              Discover fellow coffee enthusiasts and cafe owners
            </Text>
          </div>
          <Button 
            variant="outline" 
            leftSection={<FiRefreshCw size={16} />}
            onClick={handleRefresh}
            loading={isLoading}
          >
            Refresh
          </Button>
        </Group>
      </div>

      {users.length === 0 ? (
        <div className="empty-state">
          <FiUsers size={64} color="#ccc" />
          <Text size="lg" color="dimmed" mt="md">
            No users found
          </Text>
          <Text size="sm" color="dimmed" mt="xs">
            Check back later for new members!
          </Text>
        </div>
      ) : (
        <Stack gap="lg" mt="xl">
          <Grid>
            {users.map((user) => (
              <Grid.Col key={user.id} span={{ base: 12, md: 6, lg: 4 }}>
                <UserCard 
                  user={user} 
                  onFollowChange={handleFollowChange}
                />
              </Grid.Col>
            ))}
          </Grid>

          {hasMore && (
            <div className="load-more-section">
              <Button
                size="lg"
                variant="outline"
                onClick={handleLoadMore}
                loading={isLoadingMore}
                fullWidth
                style={{ maxWidth: '300px', margin: '0 auto' }}
              >
                {isLoadingMore ? 'Loading more...' : 'Load More Friends'}
              </Button>
            </div>
          )}

          {!hasMore && users.length > 0 && (
            <div className="end-message">
              <Text color="dimmed" ta="center">
                You've seen all the amazing people! 🎉
              </Text>
              <Text size="sm" color="dimmed" ta="center" mt="xs">
                Check back later for new members joining the community.
              </Text>
            </div>
          )}
        </Stack>
      )}
    </Container>
  );
};

export default FindFriendsPage;