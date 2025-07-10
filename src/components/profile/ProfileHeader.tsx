import { useState, useEffect } from 'react';
import { Avatar, Text } from '@mantine/core';
import { useNavigate } from 'react-router-dom';
import type { User } from '../../context/AuthContext';
import FollowButton from '../FollowButton';
import followerService from '../../services/followerService';
import { useAuth } from '../../context/AuthContext';
import '../../styles/ProfileComponents.css';

interface ProfileHeaderProps {
  user: User | null;
  reviewCount: number;
  isOwnProfile?: boolean;
}

export default function ProfileHeader({ user, reviewCount, isOwnProfile = false }: ProfileHeaderProps) {
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [isLoadingStats, setIsLoadingStats] = useState(true);

  useEffect(() => {
    if (user?.id) {
      loadFollowerStats();
    }
  }, [user?.id]);

  const loadFollowerStats = async () => {
    if (!user?.id) return;
    
    try {
      setIsLoadingStats(true);
      const stats = await followerService.getFollowerStats(user.id);
      setFollowersCount(stats.followers_count);
      setFollowingCount(stats.following_count);
    } catch (error) {
      console.error('Error loading follower stats:', error);
    } finally {
      setIsLoadingStats(false);
    }
  };

  const handleFollowChange = (isFollowing: boolean) => {
    // Update follower count when someone follows/unfollows
    setFollowersCount(prev => isFollowing ? prev + 1 : prev - 1);
  };

  const handleFollowersClick = () => {
    if (user?.id) {
      navigate(`/profile/${user.id}/followers`);
    }
  };

  return (
    <div className="bento-card profile-card">
      <div className="profile-header">
        <div className="profile-avatar-container">
          <Avatar
            src={user?.avatar_url || '/images/default-avatar.svg'}
            className="profile-avatar"
            alt={user?.username || 'User'}
          />
        </div>
        <div className="profile-info">
          <div className="profile-name-section">
            <h2 className="profile-name">{user?.username || 'User'}</h2>
            {user?.is_merchant && (
              <Text size="sm" color="blue" className="merchant-badge">
                Merchant
              </Text>
            )}
          </div>
          <Text color="dimmed" className="profile-occupation">
            {user?.is_merchant ? 'Cafe Owner' : 'Coffee Enthusiast'}
          </Text>
          
          <div className="profile-stats">
            <div className="stat-item">
              <span className="stat-value">{reviewCount}</span>
              <span className="stat-label">Reviews</span>
            </div>
            <div className="stat-item clickable" onClick={handleFollowersClick}>
              <span className="stat-value">{isLoadingStats ? '...' : followersCount}</span>
              <span className="stat-label">Followers</span>
            </div>
            <div className="stat-item clickable" onClick={handleFollowersClick}>
              <span className="stat-value">{isLoadingStats ? '...' : followingCount}</span>
              <span className="stat-label">Following</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Follow Button - only show if not own profile */}
      {!isOwnProfile && user?.id && currentUser?.id !== user.id && (
        <div className="profile-actions">
          <FollowButton
            userId={user.id}
            username={user.username}
            size="sm"
            fullWidth
            onFollowChange={handleFollowChange}
          />
        </div>
      )}
      
      <div className="xp-container">
        <div className="xp-label">
          <span>Level 7: Cafe Aficionado</span>
          <span>75%</span>
        </div>
        <div className="xp-bar-container">
          <div className="xp-bar-progress" style={{ width: '75%' }}></div>
        </div>
      </div>
    </div>
  );
}
