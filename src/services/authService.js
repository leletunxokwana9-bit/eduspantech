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
        console.log('❌ No refresh token found');
        return { success: false, error: 'No refresh token' };
      }

      console.log('🔄 Refreshing token...');
      const response = await fetch(`${API_URL}/api/v1/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ refreshToken })
      });

      const data = await response.json();
      console.log('📊 Refresh response:', data);
      
      if (data.success && data.accessToken) {
        localStorage.setItem('accessToken', data.accessToken);
        if (data.refreshToken) {
          localStorage.setItem('refreshToken', data.refreshToken);
        }
        if (data.user) {
          localStorage.setItem('user', JSON.stringify(data.user));
        }
        return { success: true, accessToken: data.accessToken };
      }

      // ✅ If refresh fails, clear tokens and redirect
      authService.logout();
      return { success: false, error: data.error || 'Refresh failed' };
    } catch (error) {
      console.error('❌ Refresh error:', error);
      authService.logout();
      return { success: false, error: 'Network error' };
    }
  },

  // ===== GET USER WITH SUBSCRIPTION =====
  getCurrentUserWithSubscription: async () => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        console.log('❌ No token found');
        return null;
      }

      console.log('🔍 Fetching user with subscription...');

      // Get user data
      const userResponse = await fetch(`${API_URL}/api/v1/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (userResponse.status === 401) {
        console.log('⚠️ Token expired, attempting refresh...');
        const refreshResult = await authService.refreshToken();
        if (refreshResult.success) {
          // Retry with new token
          const newToken = localStorage.getItem('accessToken');
          const retryResponse = await fetch(`${API_URL}/api/v1/auth/me`, {
            headers: {
              'Authorization': `Bearer ${newToken}`
            }
          });
          if (retryResponse.ok) {
            const userData = await retryResponse.json();
            const fullUser = userData.user || userData;
            // Also fetch subscription
            try {
              const subResponse = await fetch(`${API_URL}/api/v1/subscription/me`, {
                headers: {
                  'Authorization': `Bearer ${newToken}`
                }
              });
              if (subResponse.ok) {
                const subData = await subResponse.json();
                if (subData.success) {
                  fullUser.tier = subData.subscription?.tier;
                  fullUser.subscriptionStatus = subData.subscription?.status;
                  fullUser.subscriptionEnd = subData.subscription?.end_date;
                  fullUser.subscription = subData.subscription;
                }
              }
            } catch (e) {}
            return fullUser;
          }
        }
        return null;
      }

      if (!userResponse.ok) {
        console.log('❌ Failed to get user:', userResponse.status);
        return null;
      }

      const userData = await userResponse.json();
      console.log('✅ User data fetched');
      const fullUser = userData.user || userData;

      // Get subscription data
      try {
        const subResponse = await fetch(`${API_URL}/api/v1/subscription/me`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (subResponse.ok) {
          const subData = await subResponse.json();
          if (subData.success) {
            fullUser.tier = subData.subscription?.tier;
            fullUser.subscriptionStatus = subData.subscription?.status;
            fullUser.subscriptionEnd = subData.subscription?.end_date;
            fullUser.subscription = subData.subscription;
          }
        }
      } catch (subError) {
        console.log('⚠️ Could not fetch subscription:', subError.message);
      }

      // Save merged user to localStorage
      localStorage.setItem('user', JSON.stringify(fullUser));

      return fullUser;
    } catch (error) {
      console.error('❌ Failed to get user with subscription:', error);
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

      if (response.status === 401) {
        const refreshResult = await authService.refreshToken();
        if (refreshResult.success) {
          const newToken = localStorage.getItem('accessToken');
          const retryResponse = await fetch(`${API_URL}/api/v1/content/my/subjects`, {
            headers: {
              'Authorization': `Bearer ${newToken}`,
              'Content-Type': 'application/json'
            }
          });
          if (retryResponse.ok) {
            const data = await retryResponse.json();
            return data.subjects || [];
          }
        }
        return [];
      }

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