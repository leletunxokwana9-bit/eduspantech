// src/services/authService.js
const API_URL = 'https://eduspantech-backend.onrender.com';

export const authService = {
  // ===== LOGIN =====
  login: async (email, password) => {
    try {
      const url = `${API_URL}/api/v1/auth/login`;
      console.log('📤 Sending login to:', url);

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ 
          email: email.trim(), 
          password: password 
        })
      });

      const text = await response.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch (e) {
        return { 
          success: false, 
          error: 'Server returned invalid response' 
        };
      }

      if (!response.ok) {
        return { 
          success: false, 
          error: data.error || data.message || `Server error: ${response.status}` 
        };
      }

      if (data.success && data.accessToken) {
        localStorage.setItem('accessToken', data.accessToken);
        if (data.refreshToken) {
          localStorage.setItem('refreshToken', data.refreshToken);
        }
        if (data.user) {
          localStorage.setItem('user', JSON.stringify(data.user));
        }
        
        return { 
          success: true, 
          user: data.user 
        };
      }

      return { 
        success: false, 
        error: data.error || 'Login failed' 
      };
    } catch (error) {
      console.error('❌ Login error:', error);
      return { 
        success: false, 
        error: 'Network error - could not connect to server' 
      };
    }
  },

  // ===== REGISTER =====
  register: async (userData) => {
    try {
      const url = `${API_URL}/api/v1/auth/register`;
      console.log('📤 Sending register to:', url);

      const payload = {
        name: userData.name || userData.fullName,
        email: userData.email,
        password: userData.password,
        cohort_flag: userData.cohort_flag || userData.cohort || 'HighSchool',
        country_code: userData.country_code || userData.country || 'ZA',
        grade: userData.grade || '',
        timezone: userData.timezone || 'Africa/Johannesburg'
      };

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const text = await response.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch (e) {
        return { 
          success: false, 
          error: 'Server returned invalid response' 
        };
      }

      if (!response.ok) {
        return { 
          success: false, 
          error: data.error || data.message || `Server error: ${response.status}` 
        };
      }

      if (data.success && data.accessToken) {
        localStorage.setItem('accessToken', data.accessToken);
        if (data.refreshToken) {
          localStorage.setItem('refreshToken', data.refreshToken);
        }
        if (data.user) {
          localStorage.setItem('user', JSON.stringify(data.user));
        }
        
        return { 
          success: true, 
          user: data.user 
        };
      }

      return { 
        success: false, 
        error: data.error || 'Registration failed' 
      };
    } catch (error) {
      console.error('❌ Register error:', error);
      return { 
        success: false, 
        error: 'Network error - could not connect to server' 
      };
    }
  },

  // ===== LOGOUT =====
  logout: () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
  },

  // ===== CHECK AUTH =====
  isAuthenticated: () => {
    return !!localStorage.getItem('accessToken');
  },

  // ===== GET CURRENT USER =====
  getCurrentUser: () => {
    try {
      const user = localStorage.getItem('user');
      return user ? JSON.parse(user) : null;
    } catch {
      return null;
    }
  },

  // ===== GET TOKEN =====
  getToken: () => {
    return localStorage.getItem('accessToken');
  },

  // ===== REFRESH TOKEN =====
  refreshToken: async () => {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) {
        return { success: false, error: 'No refresh token' };
      }

      const response = await fetch(`${API_URL}/api/v1/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ refreshToken })
      });

      const data = await response.json();
      
      if (data.success && data.accessToken) {
        localStorage.setItem('accessToken', data.accessToken);
        return { success: true, accessToken: data.accessToken };
      }

      return { success: false, error: data.error || 'Refresh failed' };
    } catch (error) {
      return { success: false, error: 'Network error' };
    }
  },

  // ===== GET USER WITH SUBSCRIPTION =====
  getCurrentUserWithSubscription: async () => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) return null;

      // Get user data
      const userResponse = await fetch(`${API_URL}/api/v1/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!userResponse.ok) return null;
      const userData = await userResponse.json();

      // Get subscription data
      const subResponse = await fetch(`${API_URL}/api/v1/subscription/me`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      let subscription = null;
      if (subResponse.ok) {
        const subData = await subResponse.json();
        if (subData.success) {
          subscription = subData.subscription;
        }
      }

      // Merge user and subscription
      const fullUser = userData.user || userData;
      if (subscription) {
        fullUser.tier = subscription.tier;
        fullUser.subscriptionStatus = subscription.status;
        fullUser.subscriptionEnd = subscription.end_date;
        fullUser.subscription = subscription;
      }

      // Store updated user in localStorage
      localStorage.setItem('user', JSON.stringify(fullUser));

      return fullUser;
    } catch (error) {
      console.error('Failed to get user with subscription:', error);
      return null;
    }
  },

  // ===== GET USER ENROLLMENTS =====
  getEnrollments: async () => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) return [];

      const response = await fetch(`${API_URL}/api/v1/content/my/subjects`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) return [];
      const data = await response.json();
      return data.subjects || [];
    } catch (error) {
      console.error('Failed to fetch enrollments:', error);
      return [];
    }
  }
};

export default authService;