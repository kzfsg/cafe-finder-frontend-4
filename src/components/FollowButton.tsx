import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@mantine/core';
import { FiUserPlus, FiUserMinus } from 'react-icons/fi';
import followerService from '../services/followerService';
import authService from '../services/authService';
import '../styles/FollowButton.css';

interface FollowButtonProps {
  userId: string;
  username?: string;
  className?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'filled' | 'outline' | 'light' | 'subtle';
  fullWidth?: boolean;
  onFollowChange?: (isFollowing: boolean) => void;
}

const FollowButton: React.FC<FollowButtonProps> = ({
  userId,
  username,
  className = '',
  size = 'sm',
  variant = 'filled',
  fullWidth = false,
  onFollowChange
}) => {
  const [isFollowing, setIsFollowing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingStatus, setIsLoadingStatus] = useState(true);
  const [isCurrentUser, setIsCurrentUser] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    checkCurrentUser();
    checkFollowStatus();
  }, [userId]);

  const checkCurrentUser = async () => {
    try {
      const currentUser = await authService.getCurrentUser();
      setIsCurrentUser(currentUser?.id === userId);
    } catch (error) {
      console.error('Error checking current user:', error);
      setIsCurrentUser(false);
    }
  };

  const checkFollowStatus = async () => {
    try {
      setIsLoadingStatus(true);
      const isLoggedIn = await authService.isLoggedIn();
      
      if (!isLoggedIn) {
        setIsLoadingStatus(false);
        return;
      }

      const following = await followerService.isFollowing(userId);
      setIsFollowing(following);
    } catch (error) {
      console.error('Error checking follow status:', error);
      // Handle 406 errors gracefully - assume not following
      setIsFollowing(false);
    } finally {
      setIsLoadingStatus(false);
    }
  };

  const handleFollowClick = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering parent click events
    
    // Check if user is logged in
    const isLoggedIn = await authService.isLoggedIn();
    if (!isLoggedIn) {
      navigate('/login', { state: { from: window.location.pathname } });
      return;
    }

    try {
      setIsLoading(true);
      const result = await followerService.toggleFollow(userId);
      
      if (result.success) {
        setIsFollowing(result.is_following);
        if (onFollowChange) {
          onFollowChange(result.is_following);
        }
      } else {
        console.error('Follow operation failed:', result.message);
      }
    } catch (error) {
      console.error('Error toggling follow:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Don't render if still loading status or if it's the current user
  if (isLoadingStatus || isCurrentUser) {
    return null;
  }

  return (
    <Button
      className={`follow-button ${isFollowing ? 'following' : 'not-following'} ${className}`}
      onClick={handleFollowClick}
      disabled={isLoading}
      loading={isLoading}
      size={size}
      variant={isFollowing ? 'outline' : variant}
      fullWidth={fullWidth}
      color={isFollowing ? 'gray' : 'blue'}
      leftSection={isFollowing ? <FiUserMinus size={16} /> : <FiUserPlus size={16} />}
      title={isFollowing ? `Unfollow ${username || 'user'}` : `Follow ${username || 'user'}`}
    >
      {isFollowing ? 'Following' : 'Follow'}
    </Button>
  );
};

export default FollowButton;