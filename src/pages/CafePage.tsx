import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import cafeService from '../services/cafeService';
import type { Cafe } from '../data/cafes';
import UpvoteButton from '../components/UpvoteButton';
import DownvoteButton from '../components/DownvoteButton';
import ReviewSection from '../components/ReviewSection';
import '../styles/CafePage.css';

const CafePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [cafe, setCafe] = useState<Cafe | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  useEffect(() => {
    const fetchCafe = async () => {
      if (!id) {
        setError('Invalid cafe ID');
        setLoading(false);
        return;
      }

      try {
        const cafeData = await cafeService.getCafeById(parseInt(id));
        if (cafeData) {
          setCafe(cafeData);
        } else {
          setError('Cafe not found');
        }
      } catch (err) {
        setError('Failed to load cafe');
        console.error('Error fetching cafe:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchCafe();
  }, [id]);

  const handleVoteUpdate = (updatedCafe: Cafe) => {
    setCafe(updatedCafe);
  };

  if (loading) {
    return (
      <div className="cafe-page">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading cafe...</p>
        </div>
      </div>
    );
  }

  if (error || !cafe) {
    return (
      <div className="cafe-page">
        <div className="error-container">
          <h2>Oops! Something went wrong</h2>
          <p>{error || 'Cafe not found'}</p>
          <button onClick={() => navigate('/')} className="back-home-btn">
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  const mainImage = cafe.imageUrls && cafe.imageUrls.length > 0 
    ? cafe.imageUrls[0] 
    : (cafe.image || '/images/no-image.svg');

  return (
    <div className="cafe-page">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-image">
          <img 
            src={mainImage} 
            alt={cafe.title || cafe.name || 'Cafe'} 
            onError={(e) => {
              (e.target as HTMLImageElement).src = '/images/no-image.svg';
            }}
          />
          <div className="hero-overlay">
            <div className="hero-content">
              <h1 className="hero-title">{cafe.title || cafe.name || 'Unnamed Cafe'}</h1>
              <div className="hero-location">
                <i className="location-icon">📍</i>
                <span>{cafe.location?.address || 'Location not available'}</span>
              </div>
              <div className="hero-actions">
                <button 
                  className="maps-btn"
                  onClick={() => window.open(`https://maps.google.com/maps/search/?api=1&query=${encodeURIComponent(`${cafe.location?.address || ''}, ${cafe.location?.city || ''}, ${cafe.location?.country || ''}`)}`, '_blank')}
                >
                  <i>🗺️</i> View on Maps
                </button>
                <button className="back-btn" onClick={() => navigate(-1)}>
                  <i>←</i> Back
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <div className="main-content">
        {/* Info Cards */}
        <section className="info-cards">
          <div className="info-card votes-card">
            <div className="card-header">
              <h3>Community Rating</h3>
            </div>
            <div className="vote-actions">
              <UpvoteButton
                cafeId={cafe.id}
                upvotes={cafe.upvotes || 0}
                onUpvote={(_, newUpvoteCount, updatedCafe) => {
                  if (updatedCafe) {
                    handleVoteUpdate({
                      ...updatedCafe,
                      id: cafe.id,
                      upvotes: newUpvoteCount
                    });
                  }
                }}
              />
              <DownvoteButton
                cafeId={cafe.id}
                downvotes={cafe.downvotes || 0}
                onDownvote={(_, newDownvoteCount, updatedCafe) => {
                  if (updatedCafe) {
                    handleVoteUpdate({
                      ...updatedCafe,
                      id: cafe.id,
                      downvotes: newDownvoteCount
                    });
                  }
                }}
              />
            </div>
          </div>

          <div className="info-card quick-info">
            <div className="card-header">
              <h3>Quick Info</h3>
            </div>
            <div className="quick-info-grid">
              <div className="quick-info-item">
                <i className="info-icon">📶</i>
                <span className="info-label">WiFi</span>
                <span className="info-value">{cafe.wifi ? 'Available' : 'Not Available'}</span>
              </div>
              <div className="quick-info-item">
                <i className="info-icon">🔌</i>
                <span className="info-label">Power</span>
                <span className="info-value">{cafe.powerOutletAvailable ? 'Available' : 'Not Available'}</span>
              </div>
              <div className="quick-info-item">
                <i className="info-icon">🕐</i>
                <span className="info-label">Hours</span>
                <span className="info-value">{cafe.amenities?.openingHours || 'Not specified'}</span>
              </div>
              <div className="quick-info-item">
                <i className="info-icon">👥</i>
                <span className="info-label">Capacity</span>
                <span className="info-value">{cafe.amenities?.seatingCapacity || 'Not specified'}</span>
              </div>
            </div>
          </div>
        </section>

        {/* Description */}
        <section className="description-section">
          <div className="section-header">
            <h2>About This Cafe</h2>
          </div>
          <div className="description-content">
            <p>{cafe.description || 'No description available for this cafe.'}</p>
          </div>
        </section>

        {/* Gallery */}
        {cafe.imageUrls && cafe.imageUrls.length > 1 && (
          <section className="gallery-section">
            <div className="section-header">
              <h2>Gallery</h2>
            </div>
            <div className="gallery-grid">
              {cafe.imageUrls.map((image, index) => (
                <div key={index} className="gallery-item">
                  <img 
                    src={image} 
                    alt={`${cafe.title || cafe.name} - Photo ${index + 1}`}
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/images/no-image.svg';
                    }}
                  />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Amenities */}
        <section className="amenities-section">
          <div className="section-header">
            <h2>Amenities & Details</h2>
          </div>
          <div className="amenities-grid">
            <div className="amenity-card">
              <div className="amenity-icon">📶</div>
              <div className="amenity-content">
                <h3>WiFi</h3>
                <p>{cafe.wifi ? 'Free WiFi Available' : 'No WiFi Available'}</p>
              </div>
            </div>
            <div className="amenity-card">
              <div className="amenity-icon">🔌</div>
              <div className="amenity-content">
                <h3>Power Outlets</h3>
                <p>{cafe.powerOutletAvailable ? 'Power outlets available' : 'No power outlets'}</p>
              </div>
            </div>
            <div className="amenity-card">
              <div className="amenity-icon">🕐</div>
              <div className="amenity-content">
                <h3>Opening Hours</h3>
                <p>{cafe.amenities?.openingHours || 'Hours not specified'}</p>
              </div>
            </div>
            <div className="amenity-card">
              <div className="amenity-icon">👥</div>
              <div className="amenity-content">
                <h3>Seating Capacity</h3>
                <p>{cafe.amenities?.seatingCapacity || 'Capacity not specified'}</p>
              </div>
            </div>
            <div className="amenity-card">
              <div className="amenity-icon">🔊</div>
              <div className="amenity-content">
                <h3>Noise Level</h3>
                <p>{cafe.amenities?.noiseLevel || 'Not specified'}</p>
              </div>
            </div>
          </div>
        </section>

        {/* Reviews */}
        <section className="reviews-section">
          <div className="section-header">
            <h2>Reviews & Ratings</h2>
          </div>
          <div className="reviews-content">
            <ReviewSection cafe={cafe} />
          </div>
        </section>
      </div>
    </div>
  );
};

export default CafePage;