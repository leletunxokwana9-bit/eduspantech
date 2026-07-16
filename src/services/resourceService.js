// src/services/resourceService.js
const API_URL = 'https://eduspantech-backend.onrender.com';

export const resourceService = {
  // ✅ Get all resources
  async getAllResources() {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`${API_URL}/api/v1/content/resources`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.status === 401) {
        // Token expired - try to refresh
        const { authService } = await import('./authService');
        const refreshResult = await authService.refreshToken();
        if (refreshResult.success) {
          const newToken = localStorage.getItem('accessToken');
          const retryResponse = await fetch(`${API_URL}/api/v1/content/resources`, {
            headers: {
              'Authorization': `Bearer ${newToken}`,
              'Content-Type': 'application/json'
            }
          });
          if (retryResponse.ok) {
            return await retryResponse.json();
          }
        }
        throw new Error('Authentication failed');
      }

      if (!response.ok) {
        throw new Error(`Failed to fetch resources: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching resources:', error);
      throw error;
    }
  },

  // ✅ Get single resource by ID
  async getResourceById(id) {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`${API_URL}/api/v1/content/resources/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.status === 401) {
        const { authService } = await import('./authService');
        const refreshResult = await authService.refreshToken();
        if (refreshResult.success) {
          const newToken = localStorage.getItem('accessToken');
          const retryResponse = await fetch(`${API_URL}/api/v1/content/resources/${id}`, {
            headers: {
              'Authorization': `Bearer ${newToken}`,
              'Content-Type': 'application/json'
            }
          });
          if (retryResponse.ok) {
            return await retryResponse.json();
          }
        }
        throw new Error('Authentication failed');
      }

      if (!response.ok) {
        throw new Error(`Failed to fetch resource: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching resource:', error);
      throw error;
    }
  },

  // ✅ Get resources by subject
  async getResourcesBySubject(subjectId) {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`${API_URL}/api/v1/content/resources/subject/${subjectId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.status === 401) {
        const { authService } = await import('./authService');
        const refreshResult = await authService.refreshToken();
        if (refreshResult.success) {
          const newToken = localStorage.getItem('accessToken');
          const retryResponse = await fetch(`${API_URL}/api/v1/content/resources/subject/${subjectId}`, {
            headers: {
              'Authorization': `Bearer ${newToken}`,
              'Content-Type': 'application/json'
            }
          });
          if (retryResponse.ok) {
            return await retryResponse.json();
          }
        }
        throw new Error('Authentication failed');
      }

      if (!response.ok) {
        throw new Error(`Failed to fetch resources by subject: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching resources by subject:', error);
      throw error;
    }
  },

  // ✅ Get subjects
  async getSubjects() {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`${API_URL}/api/v1/content/subjects`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.status === 401) {
        const { authService } = await import('./authService');
        const refreshResult = await authService.refreshToken();
        if (refreshResult.success) {
          const newToken = localStorage.getItem('accessToken');
          const retryResponse = await fetch(`${API_URL}/api/v1/content/subjects`, {
            headers: {
              'Authorization': `Bearer ${newToken}`,
              'Content-Type': 'application/json'
            }
          });
          if (retryResponse.ok) {
            return await retryResponse.json();
          }
        }
        throw new Error('Authentication failed');
      }

      if (!response.ok) {
        throw new Error(`Failed to fetch subjects: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching subjects:', error);
      throw error;
    }
  },

  // ✅ Get practice problems by resource ID
  async getPracticeProblems(resourceId) {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`${API_URL}/api/v1/content/practice/${resourceId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.status === 401) {
        const { authService } = await import('./authService');
        const refreshResult = await authService.refreshToken();
        if (refreshResult.success) {
          const newToken = localStorage.getItem('accessToken');
          const retryResponse = await fetch(`${API_URL}/api/v1/content/practice/${resourceId}`, {
            headers: {
              'Authorization': `Bearer ${newToken}`,
              'Content-Type': 'application/json'
            }
          });
          if (retryResponse.ok) {
            return await retryResponse.json();
          }
        }
        throw new Error('Authentication failed');
      }

      if (!response.ok) {
        throw new Error(`Failed to fetch practice problems: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching practice problems:', error);
      throw error;
    }
  },

  // ✅ Submit practice answer
  async submitPracticeAnswer(practiceId, answer) {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`${API_URL}/api/v1/content/practice/${practiceId}/submit`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ answer })
      });

      if (response.status === 401) {
        const { authService } = await import('./authService');
        const refreshResult = await authService.refreshToken();
        if (refreshResult.success) {
          const newToken = localStorage.getItem('accessToken');
          const retryResponse = await fetch(`${API_URL}/api/v1/content/practice/${practiceId}/submit`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${newToken}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ answer })
          });
          if (retryResponse.ok) {
            return await retryResponse.json();
          }
        }
        throw new Error('Authentication failed');
      }

      if (!response.ok) {
        throw new Error(`Failed to submit answer: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error submitting answer:', error);
      throw error;
    }
  }
};

export default resourceService;