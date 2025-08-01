# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a React + TypeScript social cafe discovery application built with Vite, using Supabase as the backend. The app allows users to search for cafes, view details, bookmark favorites, leave reviews, and follow other users to see their activity. It features comprehensive user authentication, social networking capabilities, location-based search, admin functionality, and a responsive UI built with Mantine components.

## Common Commands

- **Development**: `npm run dev` - Start development server
- **Build**: `npm run build` - TypeScript compilation + Vite build  
- **Lint**: `npm run lint` - Run ESLint
- **Preview**: `npm run preview` - Preview production build
- **Deploy**: `npm run deploy` - Deploy to GitHub Pages (builds first)

## Architecture

### Frontend Stack
- **React 19** with TypeScript
- **Vite** for build tooling and development
- **React Router** for client-side routing
- **Mantine** UI library for components and styling
- **TanStack Query** for data fetching and caching
- **Framer Motion** for animations
- **React Icons** for iconography

### Backend Integration
- **Supabase** for database, authentication, and file storage
- **Supabase Storage** for cafe image management in bucket structure
- Real-time auth state management via Supabase client
- Row Level Security (RLS) policies for data access control
- Custom service layer abstracts all Supabase operations

### Key Architecture Patterns

**Service Layer**: All backend operations are abstracted through service files in `src/services/`:
- `authService.ts` - User authentication and profile management
- `cafeService.ts` - Cafe CRUD operations and image handling from storage buckets
- `bookmarkService.ts` - User bookmark functionality
- `searchService.ts` - Cafe search with filters and geolocation
- `reviewService.ts` - User reviews with boolean rating system
- `followerService.ts` - Social following/follower relationships
- `upvoteService.ts` / `downvoteService.ts` - Cafe voting system
- `feedService.ts` - Social activity feed aggregation
- `submissionService.ts` - User cafe submission workflow
- `batchedCafeService.ts` - Optimized batch cafe operations

**Context Management**: `AuthContext` provides global authentication state with session persistence and automatic refresh.

**Protected Routes**: Uses `ProtectedRoute` component wrapper to guard authenticated pages.

**Data Types**: Comprehensive TypeScript interfaces in `src/data/cafes.ts` define all cafe and user data structures, including legacy compatibility fields.

**Error Handling**: Services handle RLS policy violations gracefully and provide fallback behavior for unauthorized access.

### Component Structure

**Pages**: 
- `HomePage` - Main cafe listing with search/filter
- `BookmarkPage` - User's saved cafes (auth required)
- `ProfilePage` - User profile and activity dashboard (auth required)
- `PublicProfilePage` - View other users' profiles with public data
- `FindFriendsPage` - User discovery with follow functionality
- `FriendsFeedPage` - Activity feed from followed users
- `FollowersPage` - Manage follower/following relationships
- `SubmitCafePage` - User cafe submission form (auth required)
- `AdminPage` - Admin dashboard for managing submissions (auth required)

**Key Components**:
- `CafeCard` - Individual cafe display with bookmark/voting
- `CafeDetails` - Modal/page for detailed cafe view
- `Navbar` - Main navigation with search, bookmarks, friends feed, and user menu
- `MasonryGrid` - Responsive grid layout for cafe cards
- `ActivityFeedItem` - Individual activity items in social feed
- `UserCard` - User discovery cards with follow buttons
- `FollowButton` - Reusable follow/unfollow functionality

### Social Features Architecture

**Following System**: Users can follow/unfollow other users, with bidirectional relationship tracking and follower counts.

**Activity Feed**: Aggregates activities (bookmarks, reviews, upvotes, downvotes) from followed users with real-time timestamps.

**Public Profiles**: Users can view others' profiles with public activity data while respecting privacy boundaries.

**Voting System**: Boolean-based cafe voting (upvote/downvote) separate from review system.

### Environment Variables

Requires Supabase configuration:
- `VITE_SUPABASE_URL` - Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Supabase public anon key

### Database Schema

Uses Supabase with main tables:
- `cafes` - Cafe information with JSON location field, vote counts
- `profiles` - User profiles linked to auth.users with social metadata
- `bookmarks` - User cafe bookmarks
- `reviews` - User reviews with boolean rating system
- `followers` - Social following relationships (follower_id, following_id)
- `user_upvotes` / `user_downvotes` - Cafe voting system
- `submissions` - User-submitted cafes awaiting admin approval

### Image Storage System

**Supabase Storage Buckets**: 
- **`cafe-images`** - Approved cafe images with structure: `cafe-{id}/` folders containing all images for each cafe
- **`submissions`** - User submission images with structure: `{user_id}/` folders for pending submissions
- **Example**: `cafe-1/image1.jpg` (approved), `user-123/submission.png` (pending)
- **Handling**: `cafeService.ts` contains `getCafeImageUrls()` function that fetches all images for a cafe and returns public URLs
- **Fallback**: Uses `/images/no-image.svg` when no images exist

### RLS Policies Requirements

Critical for social features to function:
- **followers table**: Requires read policies for follow status checking
- **cafes table**: Requires read policies for public cafe data access
- **profiles table**: Requires read policies for public user information
- **bookmarks/reviews tables**: May require policies for activity feed functionality

### Authentication System

**User Types**: 
- Regular users - Standard cafe discovery and social features
- Merchants - Can manage cafes and view merchant dashboard
- Admins - Can approve/reject cafe submissions and manage content

**Auth Flow**: 
- Account type selection during signup
- Merchant verification process
- Profile creation in `profiles` table linked to `auth.users`

### Deployment

Configured for GitHub Pages deployment with base path `/cafe-finder-frontend-v2` in Vite config. Production builds automatically set correct base path via environment detection.

## Important Code Patterns

**Service Error Handling**: All services gracefully handle RLS policy violations and missing relationships, returning empty arrays/fallback data rather than throwing errors.

**Image URL Transformation**: Use `transformCafeData()` from `cafeService.ts` to properly handle cafe images from storage buckets.

**Social Data Loading**: Feed and social features use separate queries to fetch core data first, then enrich with user profiles and cafe details to avoid foreign key relationship errors.

**Legacy Compatibility**: Cafe interfaces maintain backward compatibility fields to support existing components while transitioning to new data structure.