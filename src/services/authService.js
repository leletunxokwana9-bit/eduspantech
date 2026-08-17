// src/services/authService.js
import { API_BASE_URL } from './api';  // ✅ FIXED: Correct path

// ===== HELPER: Get token =====
const getToken = () => localStorage.getItem('accessToken');
const getRefreshToken = () => localStorage.getItem('refreshToken');

// ===== HELPER: Set tokens =====
const setTokens = (accessToken, refreshToken) => {
  if (accessToken) localStorage.setItem('accessToken', accessToken);
  if (refreshToken) localStorage.setItem('refreshToken', refreshToken);
};

// ===== HELPER: Clear tokens =====
const clearTokens = () => {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('user');
};

const authService = {
  // ============================================
  // REGISTER - FIXED with better error handling
  // ============================================
  register: async (userData) => {
    try {
      console.log('📤 Sending registration to:', `${API_BASE_URL}/auth/register`);
      console.log('📤 Registration data:', userData);
      
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      const data = await response.json();
      console.log('📥 Registration response:', data);
      
      if (!response.ok) {
        // Handle specific error cases
        if (response.status === 400) {
          throw new Error(data.error || 'Invalid registration data. Please check your information.');
        }
        if (response.status === 409) {
          throw new Error('An account with this email already exists. Please login instead.');
        }
        if (response.status === 500) {
          throw new Error('Server error. Please try again later.');
        }
        throw new Error(data.error || 'Registration failed');
      }

      // Registration successful
      if (data.success) {
        console.log('✅ Registration successful! Verification email sent.');
        return {
          success: true,
          message: data.message || 'Registration successful! Please check your email for verification.',
          user: data.user || null
        };
      }

      // If we get here but no success flag
      return {
        success: false,
        error: data.error || 'Registration failed. Please try again.'
      };
      
    } catch (error) {
      console.error('Register error:', error);
      return {
        success: false,
        error: error.message || 'Registration failed. Please try again.'
      };
    }
  },

  // ===== LOGIN =====
  login: async (email, password) => {
    try {
      console.log('📤 Sending login to:', `${API_BASE_URL}/auth/login`);
      
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Invalid email or password');
        }
        if (response.status === 403) {
          throw new Error('Account not verified. Please check your email.');
        }
        throw new Error(data.error || 'Login failed');
      }

      if (data.accessToken) {
        setTokens(data.accessToken, data.refreshToken);
        if (data.user) {
          localStorage.setItem('user', JSON.stringify(data.user));
        }
      }

      return {
        success: true,
        user: data.user || null,
        accessToken: data.accessToken,
        refreshToken: data.refreshToken
      };
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  },

  // ===== LOGOUT =====
  logout: () => {
    clearTokens();
    window.location.href = '/login';
  },

  // ===== GET CURRENT USER =====
  getCurrentUser: async () => {
    try {
      const token = getToken();
      if (!token) {
        console.log('No token found');
        return null;
      }

      const response = await fetch(`${API_BASE_URL}/auth/me`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.status === 401) {
        // Token expired, try refresh
        const refreshed = await authService.refreshToken();
        if (refreshed) {
          const newToken = getToken();
          const retryResponse = await fetch(`${API_BASE_URL}/auth/me`, {
            headers: {
              'Authorization': `Bearer ${newToken}`,
              'Content-Type': 'application/json',
            },
          });
          if (retryResponse.ok) {
            const data = await retryResponse.json();
            localStorage.setItem('user', JSON.stringify(data.user));
            return data.user;
          }
        }
        return null;
      }

      if (!response.ok) {
        const error = await response.json();
        console.error('Get user error:', error);
        return null;
      }

      const data = await response.json();
      if (data.user) {
        localStorage.setItem('user', JSON.stringify(data.user));
        return data.user;
      }
      return data;
    } catch (error) {
      console.error('Get current user error:', error);
      return null;
    }
  },

  // ===== GET USER WITH SUBSCRIPTION =====
  getCurrentUserWithSubscription: async () => {
    try {
      const token = getToken();
      if (!token) {
        console.log('No token found');
        return null;
      }

      const response = await fetch(`${API_BASE_URL}/auth/me`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.status === 401) {
        const refreshed = await authService.refreshToken();
        if (refreshed) {
          const newToken = getToken();
          const retryResponse = await fetch(`${API_BASE_URL}/auth/me`, {
            headers: {
              'Authorization': `Bearer ${newToken}`,
              'Content-Type': 'application/json',
            },
          });
          if (retryResponse.ok) {
            const data = await retryResponse.json();
            // Also fetch subscription
            const subResponse = await fetch(`${API_BASE_URL}/subscriptions`, {
              headers: {
                'Authorization': `Bearer ${newToken}`,
              },
            });
            if (subResponse.ok) {
              const subData = await subResponse.json();
              data.user.subscription = subData.subscription;
            }
            localStorage.setItem('user', JSON.stringify(data.user));
            return data.user;
          }
        }
        return null;
      }

      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      
      // Fetch subscription
      try {
        const subResponse = await fetch(`${API_BASE_URL}/subscriptions`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        if (subResponse.ok) {
          const subData = await subResponse.json();
          if (data.user) {
            data.user.subscription = subData.subscription || subData;
          }
        }
      } catch (subError) {
        console.error('Failed to fetch subscription:', subError);
      }

      if (data.user) {
        localStorage.setItem('user', JSON.stringify(data.user));
        return data.user;
      }
      return data;
    } catch (error) {
      console.error('Get user with subscription error:', error);
      return null;
    }
  },

  // ===== UPDATE PROFILE =====
  updateProfile: async (userData) => {
    try {
      const token = getToken();
      if (!token) throw new Error('Not authenticated');

      console.log('📤 Updating profile at:', `${API_BASE_URL}/auth/profile`);
      
      const response = await fetch(`${API_BASE_URL}/auth/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(userData),
      });

      if (response.status === 401) {
        const refreshed = await authService.refreshToken();
        if (refreshed) {
          const newToken = getToken();
          const retryResponse = await fetch(`${API_BASE_URL}/auth/profile`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${newToken}`,
            },
            body: JSON.stringify(userData),
          });
          if (retryResponse.ok) {
            const data = await retryResponse.json();
            if (data.user) {
              localStorage.setItem('user', JSON.stringify(data.user));
            }
            return data;
          }
        }
        throw new Error('Session expired');
      }

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update profile');
      }

      const data = await response.json();
      if (data.user) {
        localStorage.setItem('user', JSON.stringify(data.user));
      }
      return data;
    } catch (error) {
      console.error('Update profile error:', error);
      throw error;
    }
  },

  // ===== CHANGE PASSWORD =====
  changePassword: async (currentPassword, newPassword) => {
    try {
      const token = getToken();
      if (!token) throw new Error('Not authenticated');

      const response = await fetch(`${API_BASE_URL}/auth/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      if (response.status === 401) {
        const refreshed = await authService.refreshToken();
        if (refreshed) {
          const newToken = getToken();
          const retryResponse = await fetch(`${API_BASE_URL}/auth/change-password`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${newToken}`,
            },
            body: JSON.stringify({ currentPassword, newPassword }),
          });
          if (retryResponse.ok) {
            return await retryResponse.json();
          }
        }
        throw new Error('Session expired');
      }

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to change password');
      }

      return await response.json();
    } catch (error) {
      console.error('Change password error:', error);
      throw error;
    }
  },

  // ===== DELETE ACCOUNT =====
  deleteAccount: async () => {
    try {
      const token = getToken();
      if (!token) throw new Error('Not authenticated');

      const response = await fetch(`${API_BASE_URL}/auth/account`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete account');
      }

      clearTokens();
      return await response.json();
    } catch (error) {
      console.error('Delete account error:', error);
      throw error;
    }
  },

  // ===== REFRESH TOKEN =====
  refreshToken: async () => {
    try {
      const refreshToken = getRefreshToken();
      if (!refreshToken) {
        clearTokens();
        return false;
      }

      const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken }),
      });

      if (!response.ok) {
        clearTokens();
        return false;
      }

      const data = await response.json();
      if (data.accessToken) {
        setTokens(data.accessToken, data.refreshToken);
        if (data.user) {
          localStorage.setItem('user', JSON.stringify(data.user));
        }
        return true;
      }
      return false;
    } catch (error) {
      console.error('Refresh token error:', error);
      clearTokens();
      return false;
    }
  },

  // ===== VERIFY EMAIL =====
  verifyEmail: async (token) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/verify-email?token=${token}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Verification failed');
      }

      return await response.json();
    } catch (error) {
      console.error('Verify email error:', error);
      throw error;
    }
  },

  // ============================================
  // RESEND VERIFICATION - FIXED
  // ============================================
  resendVerification: async (email) => {
    try {
      console.log('📤 Resending verification to:', `${API_BASE_URL}/auth/resend-verification`);
      
      const response = await fetch(`${API_BASE_URL}/auth/resend-verification`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();
      console.log('📥 Resend verification response:', data);

      if (!response.ok) {
        throw new Error(data.error || 'Failed to resend verification');
      }

      return {
        success: true,
        message: data.message || 'Verification email resent successfully!'
      };
    } catch (error) {
      console.error('Resend verification error:', error);
      throw error;
    }
  },

  // ===== AUTO VERIFY (DEV ONLY) =====
  autoVerify: async (email) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/auto-verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Auto-verify failed');
      }

      return await response.json();
    } catch (error) {
      console.error('Auto-verify error:', error);
      throw error;
    }
  },

  // ===== CHECK AUTHENTICATION =====
  isAuthenticated: () => {
    const token = getToken();
    if (!token) return false;
    
    // Check if token is expired
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const expired = payload.exp * 1000 < Date.now();
      if (expired) {
        clearTokens();
        return false;
      }
      return true;
    } catch {
      return false;
    }
  },

  // ===== GET STORED USER =====
  getStoredUser: () => {
    try {
      const user = localStorage.getItem('user');
      return user ? JSON.parse(user) : null;
    } catch {
      return null;
    }
  },

  // ===== UPDATE AVATAR =====
  updateAvatar: async (avatarData) => {
    try {
      const token = getToken();
      if (!token) throw new Error('Not authenticated');

      const response = await fetch(`${API_BASE_URL}/auth/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(avatarData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update avatar');
      }

      const data = await response.json();
      if (data.user) {
        localStorage.setItem('user', JSON.stringify(data.user));
      }
      return data;
    } catch (error) {
      console.error('Update avatar error:', error);
      throw error;
    }
  },
};

export { authService };
export default authService;