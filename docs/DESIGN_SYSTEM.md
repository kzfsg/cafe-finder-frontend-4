# Design System

This document provides comprehensive coverage of the design system including color palette, typography, component patterns, asset organization, and responsive design principles used throughout the cafe finder application.

## Overview

The design system is built on a clean, modern aesthetic that emphasizes usability and accessibility. It combines custom typography, a warm color palette inspired by coffee culture, and smooth animations to create an engaging user experience for cafe discovery.

## Color Palette

### Primary Colors

```css
/* Brand Colors */
#FF5722  /* Primary Orange - Main brand color */
#E64A19  /* Primary Orange Dark - Hover states */
#FFB09E  /* Primary Orange Light - Disabled states */
#FFF3F0  /* Primary Orange Tint - Light backgrounds */

/* Neutral Colors */
#333333  /* Primary Text - Headings and important text */
#555555  /* Secondary Text - Body text */
#666666  /* Tertiary Text - Descriptions */
#929EAF  /* Muted Text - Less important information */
#aaaaaa  /* Placeholder Text - Form placeholders */

/* Background Colors */
#F0F2F5  /* Primary Background - App background */
#ffffff  /* Secondary Background - Cards and containers */
#f5f5f5  /* Tertiary Background - Subtle variations */
#e0e0e0  /* Border Color - Dividers and borders */
```

### Semantic Colors

```css
/* Status Colors */
#10B981  /* Success Green - Positive actions */
#4285F4  /* Info Blue - Links and information */
#d32f2f  /* Error Red - Errors and warnings */
#f59e0b  /* Warning Yellow - Bookmarks and highlights */

/* Interactive Colors */
#646cff  /* Link Blue - Default links */
#535bf2  /* Link Blue Hover - Link hover state */
#747bff  /* Link Blue Light - Light mode links */

/* Social Colors */
#66BB6A  /* Upvote Green */
#EF5350  /* Downvote Red */
#42A5F5  /* Review Blue */
#FF9800  /* Bookmark Orange */
```

### Usage Guidelines

**Primary Orange (#FF5722)**: Used for main CTAs, active states, and brand elements
**Neutral Colors**: Text hierarchy from darkest (#333) to lightest (#aaa)
**Background**: Light gray (#F0F2F5) for main app, white for cards
**Interactive**: Blue tones for links, semantic colors for status

## Typography

### Font Families

#### Primary Font - Tryst
```css
@font-face {
  font-family: tryst;
  src: url('/fonts/Tryst-Regular.otf');
}

.tryst {
  font-family: tryst;
}
```

**Usage**: Headlines, titles, and brand elements
**Characteristics**: Custom serif font for distinctive branding

#### Secondary Font - Nunito
```css
@font-face {
  font-family: nunito;
  src: url('/fonts/Nunito-VariableFont_wght.ttf');
}

.nunito {
  font-family: nunito;
}
```

**Usage**: Body text, UI elements, and general content
**Characteristics**: Variable weight sans-serif for excellent readability

#### Italic Variant - Nunito Italic
```css
@font-face {
  font-family: nunitoItalic;
  src: url('Nunito-Italic-VariableFont_wght.ttf');
}

.nunitoItalic {
  font-family: nunitoItalic;
}
```

**Usage**: Subtitles, captions, and emphasized text

### Typography Scale

```css
/* Headings */
h1 {
  font-size: 3.2em;
  line-height: 1.1;
  font-family: 'tryst';
  color: #333;
}

h2 {
  font-size: 1.8rem;
  font-family: 'tryst';
  color: #333;
}

h3.cafe-title {
  font-size: 22px;
  font-family: 'tryst';
  color: #333;
}

/* Body Text */
body {
  font-family: 'nunito';
  font-size: 1rem;
  line-height: 1.5;
  color: #929EAF;
}

/* UI Text */
.search-label {
  font-size: 0.65rem;
  font-weight: 600;
  color: #333;
}

.search-value {
  font-size: 0.8rem;
  color: #717171;
}
```

### Typography Usage

- **Headlines**: Tryst font for distinctive branding
- **Body Text**: Nunito for optimal readability
- **UI Elements**: Nunito with specific weights and sizes
- **Emphasis**: Nunito Italic for subtle highlighting

## Component Patterns

### Button System

#### Primary Button
```css
.auth-button {
  background-color: #FF5722;
  color: white;
  font-family: 'nunito';
  font-weight: 600;
  padding: 0.75rem;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 1rem;
  transition: all 0.2s ease;
}

.auth-button:hover {
  background-color: #E64A19;
}

.auth-button:disabled {
  background-color: #FFB09E;
  cursor: not-allowed;
}
```

#### Secondary Button
```css
.login-button {
  color: #FF5722;
  border: 1px solid #FF5722;
  background-color: transparent;
  padding: 8px 16px;
  border-radius: 20px;
  font-family: 'nunito';
  font-weight: 600;
  font-size: 14px;
}

.login-button:hover {
  background-color: rgba(255, 87, 34, 0.1);
}
```

#### Icon Button
```css
.icon-button {
  background: none;
  border: none;
  cursor: pointer;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #555;
  transition: all 0.2s ease;
}

.icon-button:hover {
  background-color: rgba(0, 0, 0, 0.05);
  color: #333;
}
```

### Card System

#### Cafe Card
```css
.cafe-card {
  break-inside: avoid;
  margin-bottom: 16px;
  border-radius: 12px;
  overflow: hidden;
  background-color: white;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  cursor: pointer;
}

.cafe-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.15);
}
```

#### Auth Card
```css
.auth-card {
  width: 100%;
  max-width: 450px;
  background-color: white;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  padding: 2rem;
}
```

### Form System

#### Input Fields
```css
.form-group input {
  padding: 0.75rem 1rem;
  border: 1px solid #ccc;
  border-radius: 8px;
  font-family: 'nunito';
  font-size: 1rem;
  transition: all 0.2s ease;
}

.form-group input:focus {
  outline: none;
  border-color: #FF5722;
  box-shadow: 0 0 0 2px rgba(255, 87, 34, 0.2);
}

.form-group input::placeholder {
  color: #aaa;
}
```

#### Labels
```css
.form-group label {
  font-family: 'nunito';
  font-weight: 600;
  color: #333;
  font-size: 0.9rem;
}
```

### Navigation System

#### Navbar
```css
.navbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background-color: #F0F2F5;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  position: sticky;
  top: 0;
  z-index: 100;
}
```

#### Logo
```css
.logo {
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 5px;
}

.logo-text {
  font-size: 1.5rem;
  margin: 0;
  color: #333;
  font-family: 'tryst';
}
```

### Search System

#### Search Bar
```css
.search-bar {
  width: 100%;
  max-width: 800px;
  background: white;
  box-shadow: 0 0 5px hsl(0 0% 78%);
  height: 55px;
  border-radius: 100vw;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 1rem;
}
```

#### Search Button
```css
.search-button {
  background: #d74f00;
  color: white;
  border: none;
  border-radius: 50%;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background 250ms ease;
}
```

## Layout System

### Container System

#### App Container
```css
.app-container {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.app-content {
  flex: 1;
  padding: 2rem;
  max-width: 1280px;
  margin: 0 auto;
  width: 100%;
}
```

#### Masonry Grid
```css
.masonry-container {
  display: flex;
  width: 100%;
  gap: 15px;
  margin-top: 30px;
  max-width: 100%;
  padding: 0;
  box-sizing: border-box;
}

.masonry-column {
  display: flex;
  flex-direction: column;
  flex: 1;
  gap: 20px;
}
```

### Responsive Breakpoints

```css
/* Mobile First Approach */
@media (max-width: 480px) {
  /* Mobile styles */
}

@media (max-width: 600px) {
  .masonry-container {
    flex-direction: column;
  }
  
  .masonry-column:nth-child(2) {
    display: none;
  }
}

@media (max-width: 768px) {
  .search-bar {
    flex-direction: column;
    height: auto;
    padding: 1rem;
    border-radius: 12px;
  }
}

@media (max-width: 900px) {
  .masonry-column:nth-child(3) {
    display: none;
  }
}

@media (min-width: 1200px) {
  .masonry-grid {
    grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));
  }
}
```

## Animation System

### Keyframe Animations

#### Fade In
```css
@keyframes fadeIn {
  from { 
    opacity: 0; 
    transform: translateY(20px); 
  }
  to { 
    opacity: 1; 
    transform: translateY(0); 
  }
}

.main-title-container {
  opacity: 0;
  animation: fadeIn 1s ease-in-out forwards;
}
```

#### Fade In From Top
```css
@keyframes fadeInFromTop {
  from { 
    opacity: 0; 
    transform: translateY(-20px); 
  }
  to { 
    opacity: 1; 
    transform: translateY(0); 
  }
}

.cafe-card {
  opacity: 0;
  animation: fadeInFromTop 1s ease-in-out forwards;
}
```

#### Scale Animations
```css
@keyframes scaleIn {
  from { 
    transform: scale(0.9); 
    opacity: 0; 
  }
  to { 
    transform: scale(1); 
    opacity: 1; 
  }
}

@keyframes scaleOut {
  from { 
    transform: scale(1); 
    opacity: 1; 
  }
  to { 
    transform: scale(0.9); 
    opacity: 0; 
  }
}
```

#### Loading Spinner
```css
@keyframes spin {
  to { 
    transform: rotate(360deg); 
  }
}

.loading-spinner {
  width: 50px;
  height: 50px;
  border: 5px solid rgba(255, 87, 34, 0.2);
  border-radius: 50%;
  border-top-color: #FF5722;
  animation: spin 1s ease-in-out infinite;
}
```

### Transition System

#### Standard Transitions
```css
/* Hover transitions */
.cafe-card {
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

/* Button transitions */
.auth-button {
  transition: all 0.2s ease;
}

/* Icon transitions */
.icon-button {
  transition: all 0.2s ease;
}

/* Form field transitions */
.form-group input {
  transition: all 0.2s ease;
}
```

#### Animation Delays
```css
/* Staggered animations for masonry columns */
.masonry-column:nth-child(1) .cafe-card {
  animation-delay: 0.3s;
}

.masonry-column:nth-child(2) .cafe-card {
  animation-delay: 0.5s;
}

.masonry-column:nth-child(3) .cafe-card {
  animation-delay: 0.7s;
}
```

## Icon System

### Icon Assets

Located in `/public/icons/`:

```
bookmark.svg         - Empty bookmark state
bookmark-filled.svg  - Filled bookmark state
heart.svg           - Like/favorite icon
upvote.svg          - Upvote arrow
downvote.svg        - Downvote arrow
wifi.svg            - WiFi availability
power.svg           - Power outlet availability
location.svg        - Location pin
map-pin.svg         - Map marker
clock.svg           - Time/hours icon
users.svg           - Social/users icon
volume.svg          - Noise level indicator
default-avatar.svg  - Default user avatar
```

### Icon Usage Patterns

#### Amenity Icons
```css
.amenity-icon {
  width: 16px;
  height: 16px;
  object-fit: contain;
  filter: brightness(0);
  transition: all 0.2s ease;
}

.amenity.available .amenity-icon {
  filter: brightness(0);
}
```

#### Navigation Icons
```css
.custom-icon {
  width: 24px;
  height: 24px;
  color: #555;
  transition: all 0.2s ease;
}

.icon-button:hover .custom-icon {
  color: #333;
}
```

## Avatar System

### Profile Avatar
```css
.profile-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  background-color: #e0e0e0;
}

.profile-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 50%;
}
```

### Default Avatar Fallback
```css
/* Used when no avatar is available */
background-image: url('/images/default-avatar.svg');
```

## Badge System

### Distance Badge
```css
.cafe-distance-badge {
  position: absolute;
  top: 10px;
  left: 10px;
  background-color: rgba(255, 255, 255, 0.8);
  border-radius: 16px;
  padding: 4px 10px;
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 12px;
  font-weight: 600;
  color: #555;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
}
```

### Status Badges
```css
.amenity {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background-color: #f5f5f5;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.amenity.available {
  background: rgb(255, 255, 255);
}
```

## Error and Loading States

### Loading States
```css
.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 300px;
  width: 100%;
  padding: 2rem;
  text-align: center;
}

.button-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 87, 34, 0.2);
  border-radius: 50%;
  border-top-color: #FF5722;
  animation: spin 0.8s linear infinite;
}
```

### Error States
```css
.error-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 200px;
  width: 100%;
  padding: 2rem;
  text-align: center;
  color: #d32f2f;
  background-color: rgba(211, 47, 47, 0.05);
  border-radius: 8px;
  margin: 2rem 0;
}

.auth-error {
  background-color: #FEE2E2;
  color: #B91C1C;
  padding: 0.75rem;
  border-radius: 6px;
  margin-bottom: 1.5rem;
  font-family: 'nunito';
  font-size: 0.9rem;
}
```

### Empty States
```css
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 200px;
  width: 100%;
  padding: 2rem;
  text-align: center;
  background-color: #f5f5f5;
  border-radius: 8px;
  margin: 2rem 0;
}
```

## Modal System

### Modal Overlay
```css
.cafe-details-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1100;
  padding: 20px;
  overflow-y: auto;
}
```

### Modal Content
```css
.cafe-details-wrapper {
  max-width: 90%;
  max-height: 90vh;
  display: flex;
  justify-content: center;
  border-radius: 16px;
  animation: scaleIn 0.3s ease-out;
}

.cafe-details-wrapper.closing {
  animation: scaleOut 0.25s ease-in forwards;
}
```

## Social Component Styling

### User Cards
Located in `/src/styles/UserCard.css`

### Activity Feed Items
Located in `/src/styles/ActivityFeedItem.css`

### Follow Buttons
Located in `/src/styles/FollowButton.css`

### Vote Buttons
Located in `/src/styles/UpvoteButton.css` and `/src/styles/DownvoteButton.css`

## Asset Organization

### Directory Structure
```
public/
├── fonts/
│   ├── Tryst-Regular.otf
│   ├── Nunito-VariableFont_wght.ttf
│   └── Nunito-Italic-VariableFont_wght.ttf
├── icons/
│   ├── bookmark.svg
│   ├── wifi.svg
│   ├── power.svg
│   └── ...
├── images/
│   ├── no-image.svg
│   ├── default-avatar.svg
│   └── no-image.jpg
└── favicon.svg

src/
├── styles/
│   ├── ActivityFeedItem.css
│   ├── UserCard.css
│   ├── SearchBar.css
│   └── ...
├── components/
│   └── auth/
│       └── Auth.css
├── App.css
└── index.css
```

### Asset Naming Conventions

**Icons**: Descriptive kebab-case names (`bookmark-filled.svg`)
**Images**: Descriptive names with clear purpose (`no-image.svg`, `default-avatar.svg`)
**Fonts**: Include variant information (`Nunito-VariableFont_wght.ttf`)
**CSS**: Component-specific or feature-specific naming

## Accessibility Considerations

### Focus States
```css
button:focus,
button:focus-visible {
  outline: 4px auto -webkit-focus-ring-color;
}

.form-group input:focus {
  outline: none;
  border-color: #FF5722;
  box-shadow: 0 0 0 2px rgba(255, 87, 34, 0.2);
}
```

### Color Contrast
- Primary text (#333) on white provides excellent contrast
- Secondary text (#555) maintains good readability
- Interactive elements use sufficient contrast ratios
- Error states use appropriate red tones for visibility

### Typography
- Nunito font chosen for excellent readability
- Adequate font sizes (minimum 12px)
- Proper line height for comfortable reading
- Clear visual hierarchy through font weights and sizes

This comprehensive design system ensures consistency across the application while providing flexibility for future enhancements and mobile adaptation.