import React, { useState } from 'react';
import type { Cafe } from '../data/cafes';
import '../styles/CafeDetails.css';
import UpvoteButton from './UpvoteButton';
import DownvoteButton from './DownvoteButton';
import ReviewSection from './ReviewSection';

interface CafeDetailsProps {
  cafe: Cafe;
  onClose: () => void;
  onVoteUpdate?: (updatedCafe: Cafe) => void;
}

const CafeDetails: React.FC<CafeDetailsProps> = ({ cafe, onClose, onVoteUpdate }) => {
  const [activeImageIndex, setActiveImageIndex] = useState(0);


  return (
    <div className="cafe-details-container">
      <button className="close-button" onClick={onClose}>×</button>
      
      {/* Main Header Section */}
      <header className="cafe-header">
        <h1 className="cafe-title">{cafe.title || cafe.name || 'Unnamed Cafe'}</h1>
        <div className="cafe-actions">
          <button className="maps-button" onClick={() => window.open(`https://maps.google.com/maps/search/?api=1&query=${encodeURIComponent(`${cafe.location?.address || ''}, ${cafe.location?.city || ''}, ${cafe.location?.country || ''}`)}`, '_blank')}>
            <img src="/cafe-finder-frontend-v2/icons/map-pin.svg" alt="Location" className="button-icon" />
            View on Maps
          </button>
          <div className="vote-buttons">
            <UpvoteButton
              cafeId={cafe.id}
              upvotes={cafe.upvotes || 0}
              onUpvote={(_, newUpvoteCount, updatedCafe) => {
                // Update the cafe state if callback is provided
                if (onVoteUpdate && updatedCafe) {
                  // Just pass the updated cafe with the new vote count
                  onVoteUpdate({
                    ...updatedCafe,
                    id: cafe.id,  // Ensure ID is included
                    upvotes: newUpvoteCount  // Ensure upvote count is updated
                  });
                  console.log('Cafe upvoted to', newUpvoteCount);
                  
                  // Force refresh of the component by updating the upvotes in the local cafe object
                  cafe.upvotes = newUpvoteCount;
                }
              }}
            />
            <DownvoteButton
              cafeId={cafe.id}
              downvotes={cafe.downvotes || 0}
              onDownvote={(_, newDownvoteCount, updatedCafe) => {
                // Update the cafe state if callback is provided
                if (onVoteUpdate && updatedCafe) {
                  // Just pass the updated cafe with the new vote count
                  onVoteUpdate({
                    ...updatedCafe,
                    id: cafe.id,  // Ensure ID is included
                    downvotes: newDownvoteCount  // Ensure downvote count is updated
                  });
                  console.log('Cafe downvoted to', newDownvoteCount);
                  
                  // Force refresh of the component by updating the downvotes in the local cafe object
                  cafe.downvotes = newDownvoteCount;
                }
              }}
            />
          </div>
        </div>
      </header>

      {/* Description Section */}
      <section className="cafe-description-section">
        <p>{cafe.description}</p>
      </section>

      {/* Gallery Section */}
      <section className="cafe-gallery-section">
        <h2>Gallery</h2>
        <div className="gallery-main">
          <img 
            src={cafe.imageUrls && cafe.imageUrls.length > 0 ? cafe.imageUrls[activeImageIndex] : (cafe.image || '/images/no-image.svg')} 
            alt={`${cafe.title || cafe.name || 'Cafe'} - Photo ${activeImageIndex + 1}`} 
            className="gallery-main-image" 
            onError={(e) => {
              (e.target as HTMLImageElement).src = '/images/no-image.svg';
            }}
          />
          
          {cafe.imageUrls && cafe.imageUrls.length > 1 && (
            <div className="gallery-navigation">
              <button 
                className="gallery-nav-button"
                onClick={() => setActiveImageIndex(prev => (prev === 0 ? (cafe.imageUrls?.length || 1) - 1 : prev - 1))}
                aria-label="Previous photo"
              >
                &#10094;
              </button>
              <button 
                className="gallery-nav-button"
                onClick={() => setActiveImageIndex(prev => (prev === (cafe.imageUrls?.length || 1) - 1 ? 0 : prev + 1))}
                aria-label="Next photo"
              >
                &#10095;
              </button>
            </div>
          )}
        </div>
        <div className="gallery-thumbnails">
          {cafe.imageUrls && cafe.imageUrls.length > 0 ? cafe.imageUrls.map((image, index) => (
            <img 
              key={index}
              src={image} 
              alt={`${cafe.title || cafe.name || 'Cafe'} - Thumbnail ${index + 1}`}
              className={`gallery-thumbnail ${index === activeImageIndex ? 'active' : ''}`}
              onClick={() => setActiveImageIndex(index)}
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/images/no-image.svg';
              }}
            />
          )) : (
            <div className="no-images">No images available</div>
          )}
        </div>
      </section>

      {/* Amenities Section */}
      <section className="cafe-amenities-section">
        <h2>Amenities</h2>
        <div className="amenities-grid">
          <div className="amenity-item">
            <img src="/cafe-finder-frontend-v2/icons/wifi.svg" alt="WiFi" className="amenity-icon" />
            <span>{cafe.wifi ? 'WiFi Available' : 'No WiFi'}</span>
          </div>
          <div className="amenity-item">
            <img src="/cafe-finder-frontend-v2/icons/power.svg" alt="Power" className="amenity-icon" />
            <span>{cafe.powerOutletAvailable ? 'Power Outlets' : 'No Power Outlets'}</span>
          </div>
          <div className="amenity-item">
            <img src="/cafe-finder-frontend-v2/icons/clock.svg" alt="Hours" className="amenity-icon" />
            <span>{cafe.amenities?.openingHours || 'Hours not available'}</span>
          </div>
          <div className="amenity-item">
            <img src="/cafe-finder-frontend-v2/icons/users.svg" alt="Capacity" className="amenity-icon" />
            <span>{cafe.amenities?.seatingCapacity || 'Capacity not available'}</span>
          </div>
          <div className="amenity-item">
            <img src="/cafe-finder-frontend-v2/icons/volume.svg" alt="Noise" className="amenity-icon" />
            <span>Noise Level: {cafe.amenities?.noiseLevel || 'Not specified'}</span>
          </div>
        </div>
      </section>

      {/* Reviews Section */}
      <ReviewSection cafe={cafe} />
    </div>
  );
};

export default CafeDetails;
