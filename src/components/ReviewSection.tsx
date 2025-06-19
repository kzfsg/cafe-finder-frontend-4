import React, { useState, useEffect } from 'react';
import type { Cafe, Review } from '../data/cafes';
import reviewService, { type ReviewSubmission } from '../services/reviewService';
import { useAuth } from '../context/AuthContext';
import { formatDistanceToNow } from 'date-fns';

interface ReviewSectionProps {
  cafe: Cafe;
}

const ReviewSection: React.FC<ReviewSectionProps> = ({ cafe }) => {
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [newReview, setNewReview] = useState({
    rating: true,
    comment: ''
  });
  const [cafeReviews, setCafeReviews] = useState<Review[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userReview, setUserReview] = useState<Review | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    const fetchReviews = async () => {
      const reviews = await reviewService.getCafeReviews(cafe.id);
      setCafeReviews(reviews);
      
      if (user) {
        const existingReview = await reviewService.hasUserReviewedCafe(cafe.id, user.id);
        if (existingReview) {
          setUserReview(existingReview);
          setNewReview({
            rating: existingReview.rating,
            comment: existingReview.comment
          });
        }
      }
    };
    
    fetchReviews();
  }, [cafe.id, user]);

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      alert('You must be logged in to leave a review');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const reviewData: ReviewSubmission = {
        cafe_id: cafe.id,
        rating: newReview.rating,
        comment: newReview.comment
      };
      
      const result = await reviewService.addReview(reviewData, user);
      
      if (result) {
        if (userReview) {
          setCafeReviews(prev => 
            prev.map(review => review.id === result.id ? result : review)
          );
        } else {
          setCafeReviews(prev => [result, ...prev]);
        }
        
        setUserReview(result);
        setNewReview({ rating: true, comment: '' });
        setShowReviewForm(false);
      }
    } catch (error) {
      console.error('Error submitting review:', error);
      alert('Failed to submit review. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderRating = (isPositive: boolean) => {
    return (
      <div className="rating">
        <span className={`rating-icon ${isPositive ? 'positive' : 'negative'}`}>
          {isPositive ? '👍' : '👎'}
        </span>
      </div>
    );
  };

  return (
    <section className="cafe-reviews-section">
      <div className="reviews-header">
        <h2>Reviews</h2>
        {user ? (
          <button 
            className="add-review-button"
            onClick={() => setShowReviewForm(!showReviewForm)}
          >
            {userReview ? 'Edit Your Review' : 'Add Review'}
          </button>
        ) : (
          <p className="login-prompt">Please log in to leave a review</p>
        )}
      </div>

      {showReviewForm && user && (
        <form className="review-form" onSubmit={handleSubmitReview}>
          <div className="rating-input">
            <label>Your Rating:</label>
            <div className="rating-buttons">
              <button 
                type="button"
                className={`rating-button ${newReview.rating ? 'active' : ''}`}
                onClick={() => setNewReview({...newReview, rating: true})}
              >
                👍 Positive
              </button>
              <button 
                type="button"
                className={`rating-button ${!newReview.rating ? 'active' : ''}`}
                onClick={() => setNewReview({...newReview, rating: false})}
              >
                👎 Negative
              </button>
            </div>
          </div>
          <div className="comment-input">
            <label htmlFor="review-comment">Your Review:</label>
            <textarea 
              id="review-comment"
              value={newReview.comment}
              onChange={(e) => setNewReview({...newReview, comment: e.target.value})}
              placeholder="Share your experience at this cafe..."
              required
            />
          </div>
          <button 
            type="submit" 
            className="submit-review-button"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Submitting...' : userReview ? 'Update Review' : 'Submit Review'}
          </button>
        </form>
      )}

      <div className="reviews-list">
        {cafeReviews.length > 0 ? cafeReviews.map((review) => (
          <div key={review.id} className="review-item">
            <div className="review-header">
              <div className="reviewer-info">
                {review.user?.avatar_url ? (
                  <img src={review.user.avatar_url} alt={review.user.username} className="reviewer-image" />
                ) : (
                  <div className="reviewer-initial">{review.user?.username.charAt(0) || '?'}</div>
                )}
                <div className="reviewer-details">
                  <span className="reviewer-name">{review.user?.username || 'Anonymous'}</span>
                  <span className="review-date">{formatDistanceToNow(new Date(review.created_at))} ago</span>
                </div>
              </div>
              {renderRating(review.rating)}
            </div>
            <p className="review-comment">{review.comment}</p>
            {user && review.user_id === user.id && (
              <div className="review-actions">
                <button 
                  className="edit-review-button"
                  onClick={() => {
                    setNewReview({
                      rating: review.rating,
                      comment: review.comment
                    });
                    setShowReviewForm(true);
                  }}
                >
                  Edit
                </button>
                <button 
                  className="delete-review-button"
                  onClick={async () => {
                    if (window.confirm('Are you sure you want to delete your review?')) {
                      const success = await reviewService.deleteReview(review.id, user.id);
                      if (success) {
                        setCafeReviews(prev => prev.filter(r => r.id !== review.id));
                        setUserReview(null);
                      }
                    }
                  }}
                >
                  Delete
                </button>
              </div>
            )}
          </div>
        )) : (
          <p className="no-reviews">No reviews yet. Be the first to leave a review!</p>
        )}
      </div>
    </section>
  );
};

export default ReviewSection;