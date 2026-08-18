// src/services/tutorService.js - COMPLETE FIXED VERSION
import { API_BASE_URL } from './api';

export const tutorService = {
  // ============================================
  // GET ALL TUTORS GROUPED BY SHIFT
  // ============================================
  getTutors: async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`${API_BASE_URL}/tutors`, {
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch tutors');
      }
      
      const data = await response.json();
      console.log('📚 Tutors data:', data);
      
      if (data.success && data.tutors) {
        data.tutors = data.tutors.map(shift => ({
          ...shift,
          tutors: shift.tutors?.map(tutor => ({
            ...tutor,
            intro_video_url: tutor.intro_video_url || null,
            intro_video_thumbnail: tutor.intro_video_thumbnail || null,
            intro_video_duration: tutor.intro_video_duration || 0,
            intro_video_views: tutor.intro_video_views || 0,
            intro_video_approved: tutor.intro_video_approved || false
          })) || []
        }));
      }
      
      return data;
    } catch (error) {
      console.error('Get tutors error:', error);
      return { success: false, tutors: [], error: error.message };
    }
  },

  // ============================================
  // GET TUTOR BY ID
  // ============================================
  getTutorById: async (id) => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`${API_BASE_URL}/tutors/${id}`, {
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch tutor');
      }
      
      const data = await response.json();
      
      if (data.success && data.tutor) {
        data.tutor = {
          ...data.tutor,
          intro_video_url: data.tutor.intro_video_url || null,
          intro_video_thumbnail: data.tutor.intro_video_thumbnail || null,
          intro_video_duration: data.tutor.intro_video_duration || 0,
          intro_video_views: data.tutor.intro_video_views || 0,
          intro_video_approved: data.tutor.intro_video_approved || false
        };
      }
      
      return data;
    } catch (error) {
      console.error('Get tutor by id error:', error);
      return { success: false, tutor: null, error: error.message };
    }
  },

  // ============================================
  // GET TUTORS BY SHIFT NAME
  // ============================================
  getTutorsByShift: async (shiftName) => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`${API_BASE_URL}/tutors/shift/${shiftName}`, {
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch tutors by shift');
      }
      
      const data = await response.json();
      
      if (data.success && data.tutors) {
        data.tutors = data.tutors.map(tutor => ({
          ...tutor,
          intro_video_url: tutor.intro_video_url || null,
          intro_video_thumbnail: tutor.intro_video_thumbnail || null,
          intro_video_duration: tutor.intro_video_duration || 0,
          intro_video_views: tutor.intro_video_views || 0,
          intro_video_approved: tutor.intro_video_approved || false
        }));
      }
      
      return data;
    } catch (error) {
      console.error('Get tutors by shift error:', error);
      return { success: false, tutors: [], error: error.message };
    }
  },

  // ============================================
  // GET AVAILABLE TUTORS FOR CURRENT SHIFT
  // ============================================
  getAvailableTutors: async () => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(`${API_BASE_URL}/tutors/available`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch available tutors');
      }
      
      const data = await response.json();
      
      if (data.success && data.tutors) {
        data.tutors = data.tutors.map(tutor => ({
          ...tutor,
          intro_video_url: tutor.intro_video_url || null,
          intro_video_thumbnail: tutor.intro_video_thumbnail || null,
          intro_video_duration: tutor.intro_video_duration || 0,
          intro_video_views: tutor.intro_video_views || 0,
          intro_video_approved: tutor.intro_video_approved || false
        }));
      }
      
      return data;
    } catch (error) {
      console.error('Get available tutors error:', error);
      return { success: false, tutors: [], error: error.message };
    }
  },

  // ============================================
  // CHECK SHIFT AVAILABILITY
  // ============================================
  checkShiftAvailability: async (countryCode) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/check-shift`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ countryCode })
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to check shift availability');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Check shift availability error:', error);
      return { success: false, error: error.message };
    }
  },

  // ============================================
  // UPLOAD TUTOR INTRO VIDEO - ✅ FIXED
  // ============================================
  uploadIntroVideo: async (videoData) => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(`${API_BASE_URL}/tutor/video`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(videoData)
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to upload video');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Upload intro video error:', error);
      return { success: false, error: error.message };
    }
  },

  // ============================================
  // REMOVE TUTOR INTRO VIDEO - ✅ FIXED
  // ============================================
  removeIntroVideo: async () => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(`${API_BASE_URL}/tutor/video`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to remove video');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Remove intro video error:', error);
      return { success: false, error: error.message };
    }
  },

  // ============================================
  // GET TUTOR INTRO VIDEO - ✅ FIXED (requires tutorId)
  // ============================================
  getIntroVideo: async (tutorId) => {
    try {
      if (!tutorId) {
        throw new Error('Tutor ID is required to fetch video');
      }

      const response = await fetch(`${API_BASE_URL}/tutor/${tutorId}/video`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch video');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Get intro video error:', error);
      return { success: false, video: null, error: error.message };
    }
  },

  // ============================================
  // INCREMENT VIDEO VIEWS - ✅ FIXED
  // ============================================
  incrementVideoViews: async (tutorId) => {
    try {
      if (!tutorId) {
        throw new Error('Tutor ID is required');
      }

      const response = await fetch(`${API_BASE_URL}/tutor/${tutorId}/video/views`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to increment views');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Increment video views error:', error);
      return { success: false, error: error.message };
    }
  },

  // ============================================
  // GET ALL TUTORS WITH VIDEOS - ✅ NEW
  // ============================================
  getAllTutorsWithVideos: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/tutors/videos`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch tutors with videos');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Get tutors with videos error:', error);
      return { success: false, tutors: [], error: error.message };
    }
  }
};

export default tutorService;