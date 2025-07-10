import { useState } from 'react';
import { Paper, Avatar, Text, Group, Badge, Image, Stack, Button } from '@mantine/core';
import { FiBookmark, FiMessageCircle, FiThumbsUp, FiThumbsDown, FiMapPin, FiClock } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import type { FeedActivity } from '../services/feedService';
import '../styles/ActivityFeedItem.css';

interface ActivityFeedItemProps {
  activity: FeedActivity;
}

const ActivityFeedItem: React.FC<ActivityFeedItemProps> = ({ activity }) => {
  const navigate = useNavigate();
  const [imageLoaded, setImageLoaded] = useState(false);

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'bookmark':
        return <FiBookmark size={16} color="#f59e0b" />;
      case 'review':
        return <FiMessageCircle size={16} color="#3b82f6" />;
      case 'upvote':
        return <FiThumbsUp size={16} color="#10b981" />;
      case 'downvote':
        return <FiThumbsDown size={16} color="#ef4444" />;
      default:
        return <FiBookmark size={16} />;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'bookmark':
        return 'orange';
      case 'review':
        return 'blue';
      case 'upvote':
        return 'green';
      case 'downvote':
        return 'red';
      default:
        return 'gray';
    }
  };

  const getActivityText = (activity: FeedActivity) => {
    switch (activity.type) {
      case 'bookmark':
        return 'bookmarked';
      case 'review':
        return activity.rating ? 'recommended' : 'didn\'t recommend';
      case 'upvote':
        return 'upvoted';
      case 'downvote':
        return 'downvoted';
      default:
        return 'interacted with';
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) {
      return 'just now';
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes}m ago`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours}h ago`;
    } else {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days}d ago`;
    }
  };

  const handleCafeClick = () => {
    navigate(`/cafes/${activity.cafe_id}`);
  };

  const handleUserClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/user/${activity.user_id}`);
  };

  return (
    <Paper className="activity-feed-item" shadow="sm" p="lg" radius="md" mb="md">
      <Stack gap="md">
        {/* Header with user info and activity type */}
        <Group gap="md">
          <Avatar
            src={activity.avatar_url || '/images/default-avatar.svg'}
            size="md"
            radius="xl"
            onClick={handleUserClick}
            style={{ cursor: 'pointer' }}
          />
          <div style={{ flex: 1 }}>
            <Group gap="xs" align="center">
              <Text 
                fw={500} 
                size="sm" 
                onClick={handleUserClick}
                style={{ cursor: 'pointer' }}
                className="username-link"
              >
                {activity.username}
              </Text>
              <Text size="sm" color="dimmed">
                {getActivityText(activity)}
              </Text>
              <Badge 
                color={getActivityColor(activity.type)} 
                size="xs" 
                variant="light"
                leftSection={getActivityIcon(activity.type)}
              >
                {activity.type}
              </Badge>
            </Group>
            <Group gap="xs" mt="xs">
              <FiClock size={12} color="gray" />
              <Text size="xs" color="dimmed">
                {formatTimeAgo(activity.created_at)}
              </Text>
            </Group>
          </div>
        </Group>

        {/* Cafe information */}
        <Group 
          gap="md" 
          onClick={handleCafeClick}
          style={{ cursor: 'pointer' }}
          className="cafe-info"
        >
          {activity.cafe_image && (
            <Image
              src={activity.cafe_image}
              alt={activity.cafe_name}
              width={80}
              height={80}
              radius="md"
              fallbackSrc="/images/no-image.svg"
              onLoad={() => setImageLoaded(true)}
            />
          )}
          <div style={{ flex: 1 }}>
            <Text fw={500} size="md" className="cafe-name">
              {activity.cafe_name}
            </Text>
            <Group gap="xs" mt="xs">
              <FiMapPin size={12} color="gray" />
              <Text size="xs" color="dimmed">
                Cafe
              </Text>
            </Group>
          </div>
        </Group>

        {/* Activity-specific content */}
        {activity.type === 'review' && activity.comment && (
          <div className="review-content">
            <Text size="sm" color="dimmed" style={{ 
              backgroundColor: '#f8f9fa', 
              padding: '8px 12px', 
              borderRadius: '8px',
              borderLeft: `4px solid ${activity.rating ? '#10b981' : '#ef4444'}`
            }}>
              "{activity.comment}"
            </Text>
          </div>
        )}

        {/* Action buttons */}
        <Group gap="xs" justify="flex-end">
          <Button
            variant="subtle"
            size="xs"
            onClick={handleCafeClick}
            leftSection={<FiMapPin size={14} />}
          >
            View Cafe
          </Button>
        </Group>
      </Stack>
    </Paper>
  );
};

export default ActivityFeedItem;