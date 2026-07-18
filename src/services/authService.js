// src/services/authService.js

// ===== API CONFIGURATION =====
// ✅ Use environment variable or fallback to production URL
const API_URL = process.env.REACT_APP_API_URL || 'https://eduspantech-backend.onrender.com/api/v1';

// Remove trailing slash if present
const BASE_URL = API_URL.endsWith('/') ? API_URL.slice(0, -1) : API_URL;

console.log('🔗 AuthService API URL:', BASE_URL);
console.log('🌍 Environment:', process.env.REACT_APP_ENV || 'development');

export const authService = {
  // ===== LOGIN =====
  login: async (email, password) => {
    try {
      const url = `${BASE_URL}/auth/login`;
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
        console.error('❌ Failed to parse login response:', text);
        return { 
          success: false, 
          error: 'Server returned invalid response' 
        };
      }

      if (!response.ok) {
        // ✅ Check if user needs verification
        if (response.status === 403 && data.needsVerification) {
          return { 
            success: false, 
            error: data.error || 'Please verify your email before logging in',
            needsVerification: true,
            email: email
          };
        }
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
      const url = `${BASE_URL}/auth/register`;
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

      console.log('📦 Register payload:', { ...payload, password: '***' });

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
        console.error('❌ Failed to parse register response:', text);
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

      // ✅ Registration successful - user must verify email
      if (data.success) {
        // ✅ Store email for verification flow
        if (data.user) {
          localStorage.setItem('pendingVerificationEmail', data.user.email);
        }
        
        return { 
          success: true, 
          message: data.message || 'Registration successful. Please check your email to verify your account.',
          user: data.user,
          requiresVerification: true
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

  // ===== VERIFY EMAIL =====
  verifyEmail: async (token) => {
    try {
      const url = `${BASE_URL}/auth/verify-email?token=${token}`;
      console.log('🔍 Verifying email with token:', token);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        }
      });

      const text = await response.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch (e) {
        console.error('❌ Failed to parse verification response:', text);
        return { 
          success: false, 
          error: 'Server returned invalid response' 
        };
      }

      if (!response.ok) {
        return { 
          success: false, 
          error: data.error || 'Verification failed' 
        };
      }

      // ✅ Clear pending verification email on success
      if (data.success) {
        localStorage.removeItem('pendingVerificationEmail');
      }

      return data;
    } catch (error) {
      console.error('❌ Verification error:', error);
      return { 
        success: false, 
        error: 'Network error - could not connect to server' 
      };
    }
  },

  // ===== RESEND VERIFICATION EMAIL =====
  resendVerification: async (email) => {
    try {
      const url = `${BASE_URL}/auth/resend-verification`;
      console.log('📤 Resending verification to:', email);

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ email })
      });

      const text = await response.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch (e) {
        console.error('❌ Failed to parse resend response:', text);
        return { 
          success: false, 
          error: 'Server returned invalid response' 
        };
      }

      if (!response.ok) {
        return { 
          success: false, 
          error: data.error || 'Failed to resend verification' 
        };
      }

      return data;
    } catch (error) {
      console.error('❌ Resend verification error:', error);
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
    localStorage.removeItem('pendingVerificationEmail');
    console.log('🔓 Logged out successfully');
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

  // ===== CHECK IF USER NEEDS VERIFICATION =====
  needsVerification: () => {
    return !!localStorage.getItem('pendingVerificationEmail');
  },

  // ===== GET PENDING VERIFICATION EMAIL =====
  getPendingVerificationEmail: () => {
    return localStorage.getItem('pendingVerificationEmail');
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
      const response = await fetch(`${BASE_URL}/auth/refresh`, {
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

      // If refresh fails, clear tokens
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
      const userResponse = await fetch(`${BASE_URL}/auth/me`, {
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
          const retryResponse = await fetch(`${BASE_URL}/auth/me`, {
            headers: {
              'Authorization': `Bearer ${newToken}`
            }
          });
          if (retryResponse.ok) {
            const userData = await retryResponse.json();
            const fullUser = userData.user || userData;
            // Also fetch subscription
            try {
              const subResponse = await fetch(`${BASE_URL}/subscription/me`, {
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
        const subResponse = await fetch(`${BASE_URL}/subscription/me`, {
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

      const response = await fetch(`${BASE_URL}/content/my/subjects`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.status === 401) {
        const refreshResult = await authService.refreshToken();
        if (refreshResult.success) {
          const newToken = localStorage.getItem('accessToken');
          const retryResponse = await fetch(`${BASE_URL}/content/my/subjects`, {
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