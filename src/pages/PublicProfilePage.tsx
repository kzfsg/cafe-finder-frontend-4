import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Title, Button, Loader, Text, Group } from '@mantine/core';
import { FiArrowLeft } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import reviewService from '../services/reviewService';
import bookmarkService from '../services/bookmarkService';
import { supabase } from '../supabase-client';
import type { User } from '../context/AuthContext';
import type { Cafe } from '../data/cafes';
import type { Review } from '../services/reviewService';
import ProfileHeader from '../components/profile/ProfileHeader';
import BookmarkedCafes from '../components/profile/BookmarkedCafes';
import UserReviews from '../components/profile/UserReviews';
import UserSubmissions from '../components/profile/UserSubmissions';
import MerchantDashboard from '../components/merchant/MerchantDashboard';
import '../styles/Dashboard.css';
import '../styles/ProfileComponents.css';

// Extend the Review type to include the additional fields we're adding
type ExtendedReview = Review & {
  cafe_name: string;
  cafe_image?: string;
};

export default function PublicProfilePage() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  
  const [profileUser, setProfileUser] = useState<User | null>(null);
  const [userReviews, setUserReviews] = useState<ExtendedReview[]>([]);
  const [bookmarkedCafes, setBookmarkedCafes] = useState<Cafe[]>([]);
  const [reviewCount, setReviewCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    if (userId) {
      // If viewing own profile, redirect to main profile page
      if (currentUser?.id === userId) {
        navigate('/profile');
        return;
      }
      
      loadUserProfile();
    }
  }, [userId, currentUser, navigate]);

  const loadUserProfile = async () => {
    if (!userId) return;
    
    try {
      setIsLoading(true);
      setError(null);
      
      // Fetch user profile from profiles table
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (profileError) {
        if (profileError.code === 'PGRST116') {
          setError('User not found');
        } else {
          throw profileError;
        }
        return;
      }

      // Convert profile to User format
      const user: User = {
        id: profile.id,
        email: '', // Don't expose email in public profiles
        username: profile.username,
        avatar_url: profile.avatar_url,
        created_at: profile.created_at,
        updated_at: profile.updated_at,
        is_merchant: profile.is_merchant
      };
      
      setProfileUser(user);
      
      // Fetch user's reviews
      const reviews = await reviewService.getUserReviews(userId) as ExtendedReview[];
      setUserReviews(reviews);
      setReviewCount(reviews.length);
      
      // Fetch user's bookmarked cafes (public view with limit)
      const bookmarks = await bookmarkService.getBookmarkedCafes(userId, 6); // Limit to 6 for public view
      setBookmarkedCafes(bookmarks);
      
    } catch (err) {
      console.error('Error loading user profile:', err);
      setError('Failed to load user profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackClick = () => {
    navigate(-1);
  };

  if (isLoading) {
    return (
      <Container size="md" style={{ padding: '4rem 0', textAlign: 'center' }}>
        <Loader size="lg" />
        <Text mt="md">Loading profile...</Text>
      </Container>
    );
  }

  if (error) {
    return (
      <Container size="md" style={{ padding: '4rem 0', textAlign: 'center' }}>
        <Text color="red" size="lg" mb="md">{error}</Text>
        <Button onClick={handleBackClick} leftSection={<FiArrowLeft size={16} />}>
          Go Back
        </Button>
      </Container>
    );
  }

  if (!profileUser) {
    return (
      <Container size="md" style={{ padding: '4rem 0', textAlign: 'center' }}>
        <Text size="lg" mb="md">User not found</Text>
        <Button onClick={handleBackClick} leftSection={<FiArrowLeft size={16} />}>
          Go Back
        </Button>
      </Container>
    );
  }

  // If user is a merchant, show merchant dashboard (limited public view)
  if (profileUser.is_merchant) {
    return (
      <div className="dashboard-container">
        <div className="profile-navigation">
          <Button 
            variant="subtle" 
            leftSection={<FiArrowLeft size={16} />}
            onClick={handleBackClick}
            mb="md"
          >
            Back
          </Button>
        </div>
        <MerchantDashboard userId={userId} isPublicView={true} />
      </div>
    );
  }

  // Otherwise, show regular user profile (public view)
  return (
    <div className="dashboard-container">
      <div className="profile-navigation">
        <Button 
          variant="subtle" 
          leftSection={<FiArrowLeft size={16} />}
          onClick={handleBackClick}
          mb="md"
        >
          Back
        </Button>
      </div>
      
      <div className="bento-grid">
        {/* User Profile Card */}
        <ProfileHeader 
          user={profileUser} 
          reviewCount={reviewCount}
          isOwnProfile={false}
        />
        
        {/* Bookmarked Cafes Card */}
        <BookmarkedCafes 
          bookmarkedCafes={bookmarkedCafes} 
          isPublicView={true}
          username={profileUser.username}
        />
        
        {/* User Reviews Card */}
        <UserReviews 
          userReviews={userReviews} 
          isPublicView={true}
          username={profileUser.username}
        />
        
        {/* User Submissions Card (if they have any) */}
        <UserSubmissions 
          userId={userId}
          isPublicView={true}
          username={profileUser.username}
        />
      </div>
    </div>
  );
}