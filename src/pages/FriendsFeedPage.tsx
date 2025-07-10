import { useState, useEffect } from 'react';
import { Container, Title, Text, Button, Group, Stack, Loader, Center, Alert } from '@mantine/core';
import { FiRefreshCw, FiUsers, FiActivity, FiUserPlus } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import feedService from '../services/feedService';
import followerService from '../services/followerService';
import ActivityFeedItem from '../components/ActivityFeedItem';
import type { FeedActivity } from '../services/feedService';
import '../styles/FriendsFeedPage.css';

export default function FriendsFeedPage() {
  const { user } = useAuth();
  const [activities, setActivities] = useState<FeedActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [followingCount, setFollowingCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  
  const ITEMS_PER_PAGE = 20;

  useEffect(() => {
    loadFeed();
    loadFollowingCount();
  }, [user]);

  const loadFeed = async (offset: number = 0) => {
    if (!user) return;

    try {
      setLoading(offset === 0);
      setError(null);
      
      const feedData = await feedService.getFriendsFeed(ITEMS_PER_PAGE, offset);
      
      if (offset === 0) {
        setActivities(feedData);
      } else {
        setActivities(prev => [...prev, ...feedData]);
      }
      
      setHasMore(feedData.length === ITEMS_PER_PAGE);
    } catch (err) {
      console.error('Error loading feed:', err);
      setError('Failed to load friends feed');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadFollowingCount = async () => {
    if (!user) return;

    try {
      const stats = await followerService.getFollowerStats(user.id);
      setFollowingCount(stats.following_count);
    } catch (err) {
      console.error('Error loading following count:', err);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadFeed(0);
    await loadFollowingCount();
  };

  const handleLoadMore = () => {
    loadFeed(activities.length);
  };

  if (loading) {
    return (
      <Container size="md" style={{ padding: '4rem 0' }}>
        <Center>
          <Stack align="center" gap="md">
            <Loader size="lg" />
            <Text>Loading your friends feed...</Text>
          </Stack>
        </Center>
      </Container>
    );
  }

  if (followingCount === 0) {
    return (
      <Container size="md" style={{ padding: '4rem 0' }}>
        <Center>
          <Stack align="center" gap="xl" style={{ maxWidth: 400, textAlign: 'center' }}>
            <FiUsers size={64} color="#6c757d" />
            <div>
              <Title order={2} mb="sm">No Friends to Follow</Title>
              <Text color="dimmed" size="lg" mb="xl">
                You're not following anyone yet. Start following friends to see their cafe activity here.
              </Text>
            </div>
            <Group gap="md">
              <Button
                component={Link}
                to="/find-friends"
                leftSection={<FiUserPlus size={16} />}
                size="lg"
                variant="filled"
              >
                Find Friends
              </Button>
              <Button
                variant="light"
                onClick={handleRefresh}
                leftSection={<FiRefreshCw size={16} />}
                size="lg"
              >
                Refresh
              </Button>
            </Group>
          </Stack>
        </Center>
      </Container>
    );
  }

  return (
    <Container size="md" className="friends-feed-page">
      <div className="feed-header">
        <Group justify="space-between" align="center" mb="xl">
          <div>
            <Title order={1} mb="xs">
              Friends Feed
            </Title>
            <Text color="dimmed" size="lg">
              See what your friends are up to
            </Text>
          </div>
          <Group gap="sm">
            <Button
              variant="subtle"
              leftSection={<FiUsers size={16} />}
              component={Link}
              to="/find-friends"
            >
              Find Friends
            </Button>
            <Button
              variant="light"
              onClick={handleRefresh}
              loading={refreshing}
              leftSection={<FiRefreshCw size={16} />}
            >
              Refresh
            </Button>
          </Group>
        </Group>

        {/* Stats */}
        <Group gap="md" mb="xl">
          <div className="stat-card">
            <Text size="xs" color="dimmed" tt="uppercase" fw={700}>
              Following
            </Text>
            <Text size="xl" fw={700} color="blue">
              {followingCount}
            </Text>
          </div>
          <div className="stat-card">
            <Text size="xs" color="dimmed" tt="uppercase" fw={700}>
              Activities
            </Text>
            <Text size="xl" fw={700} color="green">
              {activities.length}
            </Text>
          </div>
        </Group>
      </div>

      {error && (
        <Alert color="red" mb="md">
          {error}
        </Alert>
      )}

      {activities.length === 0 ? (
        <Center py="xl">
          <Stack align="center" gap="md" style={{ maxWidth: 400, textAlign: 'center' }}>
            <FiActivity size={48} color="#6c757d" />
            <div>
              <Title order={3} mb="sm">No Activity Yet</Title>
              <Text color="dimmed" mb="xl">
                Your friends haven't been active recently. Check back later or encourage them to discover new cafes!
              </Text>
            </div>
            <Group gap="md">
              <Button
                component={Link}
                to="/find-friends"
                leftSection={<FiUserPlus size={16} />}
                variant="filled"
              >
                Find More Friends
              </Button>
              <Button
                variant="light"
                onClick={handleRefresh}
                leftSection={<FiRefreshCw size={16} />}
              >
                Refresh
              </Button>
            </Group>
          </Stack>
        </Center>
      ) : (
        <div className="feed-content">
          <Stack gap="md">
            {activities.map((activity) => (
              <ActivityFeedItem key={activity.id} activity={activity} />
            ))}
          </Stack>

          {hasMore && (
            <Center mt="xl">
              <Button
                variant="light"
                onClick={handleLoadMore}
                loading={loading}
                size="lg"
              >
                Load More Activities
              </Button>
            </Center>
          )}
        </div>
      )}
    </Container>
  );
}