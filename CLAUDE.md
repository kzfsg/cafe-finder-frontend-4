# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a React + TypeScript cafe finder application built with Vite, using Supabase as the backend. The app allows users to search for cafes, view details, bookmark favorites, and leave reviews. It features user authentication, location-based search, and a responsive UI built with Mantine components.

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

### Backend Integration
- **Supabase** for database, authentication, and file storage
- Real-time auth state management via Supabase client
- Custom service layer abstracts Supabase operations

### Key Architecture Patterns

**Service Layer**: All backend operations are abstracted through service files in `src/services/`:
- `authService.ts` - User authentication and profile management
- `cafeService.ts` - Cafe CRUD operations and image handling
- `bookmarkService.ts` - User bookmark functionality
- `searchService.ts` - Cafe search with filters and geolocation
- `reviewService.ts` - User reviews and ratings

**Context Management**: `AuthContext` provides global authentication state with session persistence and automatic refresh.

**Protected Routes**: Uses `ProtectedRoute` component wrapper to guard authenticated pages.

**Data Types**: Comprehensive TypeScript interfaces in `src/data/cafes.ts` define all cafe and user data structures, including legacy compatibility fields.

### Component Structure

**Pages**: 
- `HomePage` - Main cafe listing with search/filter
- `BookmarkPage` - User's saved cafes (auth required)
- `ProfilePage` - User profile and activity (auth required)

**Key Components**:
- `CafeCard` - Individual cafe display with bookmark/voting
- `CafeDetails` - Modal/page for detailed cafe view
- `Navbar` - Main navigation with search and user menu
- `MasonryGrid` - Responsive grid layout for cafe cards

### Environment Variables

Requires Supabase configuration:
- `VITE_SUPABASE_URL` - Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Supabase public anon key

### Database Schema

Uses Supabase with main tables:
- `cafes` - Cafe information with JSON location field
- `profiles` - User profiles linked to auth.users
- `bookmarks` - User cafe bookmarks
- `reviews` - User reviews with boolean rating system

### Deployment

Configured for GitHub Pages deployment with base path `/cafe-finder-frontend-v2` in Vite config.