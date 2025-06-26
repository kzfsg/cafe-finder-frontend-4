import type { CafeLocation } from './cafes';

export type SubmissionStatus = 'pending' | 'approved' | 'rejected';

export interface CafeSubmission {
  id: string;
  // Submitter information
  submitted_by: string; // user_id
  submitted_by_username?: string;
  submitted_at: string;
  
  // Cafe details
  name: string;
  description: string;
  location: CafeLocation;
  wifi: boolean;
  powerOutletAvailable: boolean;
  seatingCapacity?: string;
  noiseLevel?: string;
  priceRange?: string;
  
  // Images (stored as URLs or base64)
  image_urls: string[];
  
  // Submission status and review
  status: SubmissionStatus;
  reviewed_by?: string; // admin user_id
  reviewed_at?: string;
  admin_notes?: string;
  rejection_reason?: string;
  
  // Additional metadata
  created_at: string;
  updated_at: string;
}

export interface SubmissionFormData {
  name: string;
  description: string;
  address: string;
  city: string;
  country: string;
  latitude?: number;
  longitude?: number;
  wifi: boolean;
  powerOutletAvailable: boolean;
  seatingCapacity?: string;
  noiseLevel?: string;
  priceRange?: string;
  images: File[];
}

export interface AdminReviewData {
  status: 'approved' | 'rejected';
  admin_notes?: string;
  rejection_reason?: string;
}

// For the admin dashboard
export interface SubmissionStats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  recent_submissions: number; // last 7 days
}