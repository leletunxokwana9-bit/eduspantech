// src/services/tutorService.js
import API from '../config/api';

export const tutorService = {
  // ============================================
  // GET ALL TUTORS GROUPED BY SHIFT
  // ============================================
  getTutors: async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(API.tutors.all, {
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
      const response = await fetch(API.tutors.byId(id), {
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch tutor');
      }
      
      return await response.json();
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
      const response = await fetch(API.tutors.byShift(shiftName), {
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch tutors by shift');
      }
      
      return await response.json();
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

      const response = await fetch(API.tutors.available, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch available tutors');
      }
      
      return await response.json();
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
      const response = await fetch(API.auth.shiftCheck, {
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
  }
};

export default tutorService;