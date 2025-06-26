import { supabase } from '../supabase-client';
import type { User } from './authService';
import type { 
  CafeSubmission, 
  SubmissionFormData, 
  AdminReviewData, 
  SubmissionStats,
  SubmissionStatus
} from '../data/submissions';

const SUBMISSIONS_TABLE = 'cafe_submissions';

const submissionService = {
  // Submit a new cafe for review
  async submitCafe(formData: SubmissionFormData, user: User): Promise<CafeSubmission | null> {
    try {
      // First, upload images to storage if any
      const imageUrls: string[] = [];
      
      if (formData.images.length > 0) {
        for (const image of formData.images) {
          const fileExt = image.name.split('.').pop();
          const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
          const filePath = `submissions/${user.id}/${fileName}`;
          
          const { error: uploadError } = await supabase.storage
            .from('cafe-images')
            .upload(filePath, image);
          
          if (uploadError) {
            console.error('Error uploading image:', uploadError);
            continue; // Skip this image but continue with others
          }
          
          const { data: { publicUrl } } = supabase.storage
            .from('cafe-images')
            .getPublicUrl(filePath);
          
          imageUrls.push(publicUrl);
        }
      }
      
      // Create submission record
      const submissionData = {
        submitted_by: user.id,
        name: formData.name,
        description: formData.description,
        location: {
          address: formData.address,
          city: formData.city,
          country: formData.country,
          latitude: formData.latitude,
          longitude: formData.longitude
        },
        wifi: formData.wifi,
        powerOutletAvailable: formData.powerOutletAvailable,
        seatingCapacity: formData.seatingCapacity,
        noiseLevel: formData.noiseLevel,
        priceRange: formData.priceRange,
        image_urls: imageUrls,
        status: 'pending' as SubmissionStatus
      };
      
      const { data, error } = await supabase
        .from(SUBMISSIONS_TABLE)
        .insert(submissionData)
        .select(`
          *,
          profiles:submitted_by(username)
        `)
        .single();
      
      if (error) {
        console.error('Error submitting cafe:', error);
        throw error;
      }
      
      return {
        ...data,
        submitted_by_username: data.profiles?.username
      };
    } catch (error) {
      console.error('Error in submitCafe:', error);
      return null;
    }
  },

  // Get all submissions (admin only)
  async getAllSubmissions(status?: SubmissionStatus): Promise<CafeSubmission[]> {
    try {
      let query = supabase
        .from(SUBMISSIONS_TABLE)
        .select(`
          *,
          profiles:submitted_by(username),
          admin_profiles:reviewed_by(username)
        `)
        .order('created_at', { ascending: false });
      
      if (status) {
        query = query.eq('status', status);
      }
      
      const { data, error } = await query;
      
      if (error) {
        console.error('Error fetching submissions:', error);
        throw error;
      }
      
      return (data || []).map(submission => ({
        ...submission,
        submitted_by_username: submission.profiles?.username,
        reviewed_by_username: submission.admin_profiles?.username
      }));
    } catch (error) {
      console.error('Error in getAllSubmissions:', error);
      return [];
    }
  },

  // Get submissions by user
  async getUserSubmissions(userId: string): Promise<CafeSubmission[]> {
    try {
      const { data, error } = await supabase
        .from(SUBMISSIONS_TABLE)
        .select('*')
        .eq('submitted_by', userId)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching user submissions:', error);
        throw error;
      }
      
      return data || [];
    } catch (error) {
      console.error('Error in getUserSubmissions:', error);
      return [];
    }
  },

  // Admin review submission
  async reviewSubmission(
    submissionId: string, 
    reviewData: AdminReviewData, 
    adminUser: User
  ): Promise<boolean> {
    try {
      const updateData = {
        status: reviewData.status,
        reviewed_by: adminUser.id,
        reviewed_at: new Date().toISOString(),
        admin_notes: reviewData.admin_notes,
        rejection_reason: reviewData.rejection_reason,
        updated_at: new Date().toISOString()
      };
      
      const { error } = await supabase
        .from(SUBMISSIONS_TABLE)
        .update(updateData)
        .eq('id', submissionId);
      
      if (error) {
        console.error('Error reviewing submission:', error);
        throw error;
      }
      
      // If approved, create the actual cafe record
      if (reviewData.status === 'approved') {
        await this.createCafeFromSubmission(submissionId);
      }
      
      return true;
    } catch (error) {
      console.error('Error in reviewSubmission:', error);
      return false;
    }
  },

  // Create approved cafe in main cafes table
  async createCafeFromSubmission(submissionId: string): Promise<boolean> {
    try {
      // Get the submission data
      const { data: submission, error: fetchError } = await supabase
        .from(SUBMISSIONS_TABLE)
        .select('*')
        .eq('id', submissionId)
        .eq('status', 'approved')
        .single();
      
      if (fetchError || !submission) {
        console.error('Error fetching approved submission:', fetchError);
        return false;
      }
      
      // Create cafe record
      const cafeData = {
        name: submission.name,
        description: submission.description,
        location: submission.location,
        wifi: submission.wifi,
        powerOutletAvailable: submission.powerOutletAvailable,
        seatingCapacity: submission.seatingCapacity,
        noiseLevel: submission.noiseLevel,
        priceRange: submission.priceRange,
        image_urls: submission.image_urls,
        upvotes: 0,
        downvotes: 0,
        submitted_by: submission.submitted_by // Track original submitter
      };
      
      const { error: insertError } = await supabase
        .from('cafes')
        .insert(cafeData);
      
      if (insertError) {
        console.error('Error creating cafe from submission:', insertError);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Error in createCafeFromSubmission:', error);
      return false;
    }
  },

  // Get submission statistics
  async getSubmissionStats(): Promise<SubmissionStats> {
    try {
      // Get all submissions count by status
      const { data: allSubmissions, error } = await supabase
        .from(SUBMISSIONS_TABLE)
        .select('status, created_at');
      
      if (error) {
        console.error('Error fetching submission stats:', error);
        throw error;
      }
      
      const submissions = allSubmissions || [];
      const now = new Date();
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      
      const stats: SubmissionStats = {
        total: submissions.length,
        pending: submissions.filter(s => s.status === 'pending').length,
        approved: submissions.filter(s => s.status === 'approved').length,
        rejected: submissions.filter(s => s.status === 'rejected').length,
        recent_submissions: submissions.filter(s => 
          new Date(s.created_at) >= weekAgo
        ).length
      };
      
      return stats;
    } catch (error) {
      console.error('Error in getSubmissionStats:', error);
      return {
        total: 0,
        pending: 0,
        approved: 0,
        rejected: 0,
        recent_submissions: 0
      };
    }
  },

  // Delete submission (admin only)
  async deleteSubmission(submissionId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from(SUBMISSIONS_TABLE)
        .delete()
        .eq('id', submissionId);
      
      if (error) {
        console.error('Error deleting submission:', error);
        throw error;
      }
      
      return true;
    } catch (error) {
      console.error('Error in deleteSubmission:', error);
      return false;
    }
  }
};

export default submissionService;