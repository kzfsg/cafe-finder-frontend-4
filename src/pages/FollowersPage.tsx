import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Title, Tabs, Paper, Button, Group, Text, Avatar } from '@mantine/core';
import { FiArrowLeft, FiUsers, FiUserPlus } from 'react-icons/fi';
import FollowersList from '../components/FollowersList';
import { useAuth } from '../context/AuthContext';
import authService from '../services/authService';
import followerService from '../services/followerService';
import { supabase } from '../supabase-client';
import '../styles/FollowersPage.css';

const FollowersPage = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const [profileUser, setProfileUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>('followers');
  const [followerStats, setFollowerStats] = useState({ followers_count: 0, following_count: 0 });

  useEffect(() => {
    if (userId) {
      loadProfileUser();
      loadFollowerStats();
    }
  }, [userId]);

  const loadProfileUser = async () => {
    try {
      setIsLoading(true);
      // Get user profile by ID
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;
      setProfileUser(data);
    } catch (error) {
      console.error('Error loading profile user:', error);
      navigate('/profile');
    } finally {
      setIsLoading(false);
    }
  };

  const loadFollowerStats = async () => {
    if (!userId) return;
    
    try {
      const stats = await followerService.getFollowerStats(userId);
      setFollowerStats(stats);
    } catch (error) {
      console.error('Error loading follower stats:', error);
    }
  };

  const handleBackClick = () => {
    navigate(-1);
  };

  if (isLoading) {
    return (
      <Container size="md" className="followers-page">
        <div className="loading-container">
          <Text>Loading...</Text>
        </div>
      </Container>
    );
  }

  if (!profileUser) {
    return (
      <Container size="md" className="followers-page">
        <div className="error-container">
          <Text color="red">User not found</Text>
          <Button onClick={handleBackClick} mt="md">
            Go Back
          </Button>
        </div>
      </Container>
    );
  }

  return (
    <Container size="md" className="followers-page">
        <Paper className="followers-header" p="lg" shadow="sm">
          <Group className="header-controls">
            <Button
              variant="subtle"
              leftSection={<FiArrowLeft size={16} />}
              onClick={handleBackClick}
            >
              Back
            </Button>
          </Group>
          
          <div className="profile-summary">
            <Avatar
              src={profileUser.avatar_url || '/images/default-avatar.svg'}
              size="lg"
              radius="xl"
            />
            <div className="profile-info">
              <Title order={2}>{profileUser.username}</Title>
              {profileUser.is_merchant && (
                <Text size="sm" color="blue">
                  Cafe Owner
                </Text>
              )}
              <Group gap="md" mt="xs">
                <Text size="sm" color="dimmed">
                  {followerStats.followers_count} followers
                </Text>
                <Text size="sm" color="dimmed">
                  {followerStats.following_count} following
                </Text>
              </Group>
            </div>
          </div>
        </Paper>

        <Paper className="followers-content" p="lg" shadow="sm" mt="md">
          <Tabs value={activeTab} onChange={setActiveTab} className="followers-tabs">
            <Tabs.List>
              <Tabs.Tab 
                value="followers" 
                leftSection={<FiUsers size={16} />}
              >
                Followers ({followerStats.followers_count})
              </Tabs.Tab>
              <Tabs.Tab 
                value="following" 
                leftSection={<FiUserPlus size={16} />}
              >
                Following ({followerStats.following_count})
              </Tabs.Tab>
            </Tabs.List>

            <Tabs.Panel value="followers" pt="md">
              <FollowersList
                userId={userId!}
                type="followers"
                maxHeight={600}
                showFollowButtons={currentUser?.id !== userId}
              />
            </Tabs.Panel>

            <Tabs.Panel value="following" pt="md">
              <FollowersList
                userId={userId!}
                type="following"
                maxHeight={600}
                showFollowButtons={currentUser?.id !== userId}
              />
            </Tabs.Panel>
          </Tabs>
        </Paper>
      </Container>
    );
};

export default FollowersPage;