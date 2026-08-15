// src/services/resourceService.js
import { API_BASE_URL } from './api';

const API_URL = API_BASE_URL;

const resourceService = {
  // ===== GET ALL RESOURCES =====
  getAllResources: async () => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        throw new Error('Authentication required');
      }

      console.log('📚 Fetching resources from:', `${API_URL}/content/resources`);
      
      const response = await fetch(`${API_URL}/content/resources`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch resources: ${response.status}`);
      }

      const data = await response.json();
      console.log('📚 Resources fetched:', data);
      return data;
    } catch (error) {
      console.error('Error fetching resources:', error);
      return { resources: [] };
    }
  },

  // ===== GET RESOURCES BY SUBJECT =====
  getResourcesBySubject: async (subjectId) => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        throw new Error('Authentication required');
      }

      const response = await fetch(`${API_URL}/content/resources?subject_id=${subjectId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch resources: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching resources by subject:', error);
      return { resources: [] };
    }
  },

  // ===== GET SINGLE RESOURCE =====
  getResource: async (resourceId) => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        throw new Error('Authentication required');
      }

      const response = await fetch(`${API_URL}/content/resources/${resourceId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch resource: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching resource:', error);
      return null;
    }
  },

  // ===== GET SUBJECTS =====
  getSubjects: async () => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        throw new Error('Authentication required');
      }

      const response = await fetch(`${API_URL}/content/subjects`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch subjects: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching subjects:', error);
      return { subjects: [] };
    }
  },

  // ===== GET RESOURCES BY TYPE =====
  getResourcesByType: async (type) => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        throw new Error('Authentication required');
      }

      const response = await fetch(`${API_URL}/content/resources?type=${type}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch resources: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching resources by type:', error);
      return { resources: [] };
    }
  }
};

// ===== EXPORT BOTH WAYS =====
export { resourceService };
export default resourceService;