// src/services/sessionService.js
import { API_BASE_URL } from './api';

const API_URL = API_BASE_URL;

const sessionService = {
  // ===== BOOK A SESSION =====
  bookSession: async (tutorId, date, duration, topic) => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        throw new Error('Not authenticated');
      }

      console.log('📚 Booking session:', { tutorId, date, duration, topic });

      const response = await fetch(`${API_URL}/sessions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ tutorId, date, duration, topic })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to book session');
      }

      return await response.json();
    } catch (error) {
      console.error('Book session error:', error);
      throw error;
    }
  },

  // ===== GET USER SESSIONS =====
  getSessions: async (status = null) => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        throw new Error('Not authenticated');
      }

      let url = `${API_URL}/sessions`;
      if (status) url += `?status=${status}`;

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch sessions');
      }

      return await response.json();
    } catch (error) {
      console.error('Get sessions error:', error);
      return { success: false, sessions: [] };
    }
  },

  // ===== GET SESSION BY ID =====
  getSession: async (sessionId) => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(`${API_URL}/sessions/${sessionId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch session');
      }

      return await response.json();
    } catch (error) {
      console.error('Get session error:', error);
      return { success: false, session: null };
    }
  },

  // ===== CANCEL SESSION =====
  cancelSession: async (sessionId) => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(`${API_URL}/sessions/${sessionId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to cancel session');
      }

      return await response.json();
    } catch (error) {
      console.error('Cancel session error:', error);
      throw error;
    }
  }
};

export { sessionService };
export default sessionService;