// src/services/sessionService.js
import { API_BASE_URL } from '../config/api';

const sessionService = {
  bookSession: async (tutorId, date, duration = 60, topic = 'Mathematics') => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        throw new Error('Not authenticated');
      }

      // Send 'date' field (not 'startTime') to match backend expectation
      const payload = {
        tutorId: tutorId,
        date: date,  // ← Send as 'date'
        duration: duration,
        topic: topic,
        region: 'af-south-1'
      };

      console.log('📤 Booking payload:', payload);

      const response = await fetch(`${API_BASE_URL}/sessions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      console.log('📥 Booking response:', data);

      if (!response.ok) {
        throw new Error(data.error || data.message || 'Failed to book session');
      }

      return {
        success: true,
        session: data.session || data
      };
    } catch (error) {
      console.error('❌ Booking error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  },

  getMySessions: async () => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(`${API_BASE_URL}/sessions`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch sessions');
      }

      const data = await response.json();
      return {
        success: true,
        sessions: data.sessions || data || []
      };
    } catch (error) {
      console.error('❌ Failed to fetch sessions:', error);
      return {
        success: false,
        error: error.message,
        sessions: []
      };
    }
  },

  getSessionById: async (sessionId) => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(`${API_BASE_URL}/sessions/${sessionId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch session');
      }

      const data = await response.json();
      return {
        success: true,
        session: data.session || data
      };
    } catch (error) {
      console.error('❌ Failed to fetch session:', error);
      return {
        success: false,
        error: error.message
      };
    }
  },

  cancelSession: async (sessionId) => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(`${API_BASE_URL}/sessions/${sessionId}/cancel`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to cancel session');
      }

      const data = await response.json();
      return {
        success: true,
        message: data.message || 'Session cancelled successfully'
      };
    } catch (error) {
      console.error('❌ Failed to cancel session:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
};

export default sessionService;