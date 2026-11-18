
// src/services/authService.js

import { API_BASE_URL } from './api';

// ==================================================
// TOKEN HELPERS
// ==================================================

const getToken = () => {
  const candidates = [
    localStorage.getItem('accessToken'),
    localStorage.getItem('token'),
    localStorage.getItem('authToken'),
  ];

  return candidates.find((token) =>
    typeof token === 'string' &&
    token.trim() !== '' &&
    token !== 'undefined' &&
    token !== 'null' &&
    token.split('.').length === 3
  ) || null;
};

const getRefreshToken = () => {
  const token = localStorage.getItem('refreshToken');

  if (
    !token ||
    token === 'undefined' ||
    token === 'null'
  ) {
    return null;
  }

  return token;
};

const setTokens = (accessToken, refreshToken) => {
  if (
    accessToken &&
    typeof accessToken === 'string' &&
    accessToken.split('.').length === 3
  ) {
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('token', accessToken);
    localStorage.removeItem('authToken');
  }

  if (
    refreshToken &&
    typeof refreshToken === 'string'
  ) {
    localStorage.setItem('refreshToken', refreshToken);
  }
};

const clearTokens = () => {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('token');
  localStorage.removeItem('authToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('user');
  localStorage.removeItem('userRole');

  meInFlight = null;

  try {
    window.dispatchEvent(new Event('auth:logout'));
  } catch {
    // Ignore event errors.
  }
};

// ==================================================
// JWT HELPERS
// ==================================================

const decodeToken = (token) => {
  try {
    if (!token) return null;

    const parts = token.split('.');

    if (parts.length !== 3 || !parts[1]) {
      return null;
    }

    const base64 = parts[1]
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const padded = base64.padEnd(
      base64.length + ((4 - (base64.length % 4)) % 4),
      '='
    );

    const binary = atob(padded);

    const bytes = Uint8Array.from(
      binary,
      character => character.charCodeAt(0)
    );

    const decoded = new TextDecoder().decode(bytes);

    return JSON.parse(decoded);

  } catch (error) {
    console.error('JWT decoding error:', error);
    return null;
  }
};

const isTokenValid = (token) => {
  const payload = decodeToken(token);

  if (!payload || !payload.exp) {
    return false;
  }

  return payload.exp * 1000 > Date.now();
};

// ==================================================
// STORED USER
// ==================================================

const getStoredUser = () => {
  try {
    const user = localStorage.getItem('user');

    return user ? JSON.parse(user) : null;

  } catch {
    return null;
  }
};

// ==================================================
// REQUEST STATE
// ==================================================

let meInFlight = null;
let refreshInFlight = null;

// ==================================================
// AUTH SERVICE
// ==================================================

const authService = {

  // ------------------------------------------------
  // REGISTER
  // ------------------------------------------------

  register: async (userData) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/auth/register`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(userData),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 400) {
          throw new Error(
            data.error || 'Invalid registration data.'
          );
        }

        if (response.status === 409) {
          throw new Error(
            'An account with this email already exists.'
          );
        }

        if (response.status === 500) {
          throw new Error(
            'Server error. Please try again later.'
          );
        }

        throw new Error(
          data.error || 'Registration failed'
        );
      }

      if (data.success) {
        return {
          success: true,
          message:
            data.message ||
            'Registration successful! Please check your email for verification.',
          user: data.user || null,
        };
      }

      return {
        success: false,
        error:
          data.error ||
          'Registration failed. Please try again.',
      };

    } catch (error) {
      console.error('Register error:', error);

      return {
        success: false,
        error:
          error.message ||
          'Registration failed. Please try again.',
      };
    }
  },

  // ------------------------------------------------
  // PARENT LOGIN
  // ------------------------------------------------

  loginParent: async (email, password) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/auth/login`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email,
            password,
            role: 'parent',
          }),
        }
      );

      let data = {};

      try {
        data = await response.json();
      } catch {
        // Non-JSON response.
      }

      if (response.ok && data.accessToken) {
        setTokens(
          data.accessToken,
          data.refreshToken
        );

        if (data.user) {
          localStorage.setItem(
            'user',
            JSON.stringify(data.user)
          );

          localStorage.setItem(
            'userRole',
            data.user.role || 'parent'
          );
        }

        return {
          success: true,
          user: data.user || null,
          accessToken: data.accessToken,
          refreshToken: data.refreshToken,
        };
      }

      if (response.status === 403) {
        if (data.needsVerification) {
          return {
            success: false,
            error:
              data.error ||
              'Please verify your email before logging in',
            needsVerification: true,
            email: data.email,
          };
        }

        return {
          success: false,
          error: data.error || 'Access denied',
        };
      }

      if (response.status === 401) {
        return {
          success: false,
          error:
            data.error || 'Invalid email or password',
        };
      }

      return {
        success: false,
        error: data.error || 'Login failed',
      };

    } catch (error) {
      console.error('Parent Login error:', error);

      return {
        success: false,
        error:
          error.message ||
          'Login failed. Please check your connection.',
      };
    }
  },

  // ------------------------------------------------
  // STUDENT / TUTOR LOGIN
  // ------------------------------------------------

  login: async (email, password, totp) => {
    try {
      const body = {
        email,
        password,
      };

      if (totp) {
        body.totp = totp;
      }

      const response = await fetch(
        `${API_BASE_URL}/auth/login`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(body),
        }
      );

      let data = {};

      try {
        data = await response.json();
      } catch {
        // Non-JSON response.
      }

      if (response.ok && data.accessToken) {
        setTokens(
          data.accessToken,
          data.refreshToken
        );

        if (data.user) {
          localStorage.setItem(
            'user',
            JSON.stringify(data.user)
          );

          const role =
            data.user.role ||
            (
              data.user.is_tutor === true ||
              data.user.is_tutor === 1
                ? 'tutor'
                : 'student'
            );

          localStorage.setItem('userRole', role);
        }

        meInFlight = null;

        window.dispatchEvent(
          new Event('auth:login')
        );

        return {
          success: true,
          user: data.user || null,
          accessToken: data.accessToken,
          refreshToken: data.refreshToken,
        };
      }

      if (response.status === 429) {
        return {
          success: false,
          error:
            data.error || 'Too many failed attempts',
          retryAfter: data.retryAfter || 900,
          attemptsLeft: 0,
        };
      }

      if (response.status === 403) {
        if (data.banned) {
          return {
            success: false,
            error:
              data.error ||
              'Your account has been suspended',
            banned: true,
            bannedUntil: data.bannedUntil || null,
            banReason: data.banReason || null,
          };
        }

        if (data.inactive) {
          return {
            success: false,
            error:
              data.error || 'Your account is inactive',
            inactive: true,
          };
        }

        if (data.needsVerification) {
          return {
            success: false,
            error:
              data.error ||
              'Please verify your email before logging in',
            needsVerification: true,
            email: data.email,
          };
        }

        return {
          success: false,
          error: data.error || 'Access denied',
        };
      }

      if (response.status === 401) {
        if (data.requires2FA) {
          return {
            success: false,
            error:
              data.error || 'Two-factor code required',
            requires2FA: true,
            attemptsLeft:
              typeof data.attemptsLeft === 'number'
                ? data.attemptsLeft
                : null,
          };
        }

        return {
          success: false,
          error:
            data.error || 'Invalid email or password',
          attemptsLeft:
            typeof data.attemptsLeft === 'number'
              ? data.attemptsLeft
              : null,
        };
      }

      return {
        success: false,
        error: data.error || 'Login failed',
      };

    } catch (error) {
      console.error('Login error:', error);

      return {
        success: false,
        error:
          error.message ||
          'Login failed. Please check your connection.',
      };
    }
  },

  // ------------------------------------------------
  // LOGOUT
  // ------------------------------------------------

  logout: () => {
    clearTokens();

    window.location.href = '/login';
  },

  // ------------------------------------------------
  // CURRENT USER
  // ------------------------------------------------

  getCurrentUser: async () => {
    if (meInFlight) {
      return meInFlight;
    }

    meInFlight = (async () => {
      try {
        let token = getToken();

        if (!token) {
          return null;
        }

        let response = await fetch(
          `${API_BASE_URL}/auth/me`,
          {
            method: 'GET',
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          }
        );

        if (response.status === 401) {
          const refreshed =
            await authService.refreshToken();

          if (!refreshed) {
            return null;
          }

          token = getToken();

          if (!token) {
            return null;
          }

          response = await fetch(
            `${API_BASE_URL}/auth/me`,
            {
              method: 'GET',
              headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
              },
            }
          );
        }

        if (!response.ok) {
          console.error(
            'Current user request failed:',
            response.status
          );

          if (response.status === 401) {
            clearTokens();
          }

          return null;
        }

        const data = await response.json();

        const user = data.user || data;

        if (
          !user ||
          typeof user !== 'object' ||
          Array.isArray(user)
        ) {
          return null;
        }

        localStorage.setItem(
          'user',
          JSON.stringify(user)
        );

        return user;

      } catch (error) {
        console.error(
          'Get current user error:',
          error
        );

        return null;

      } finally {
        meInFlight = null;
      }
    })();

    return meInFlight;
  },

  // ------------------------------------------------
  // CURRENT USER WITH SUBSCRIPTION
  // ------------------------------------------------

  getCurrentUserWithSubscription: async () => {
    const user = await authService.getCurrentUser();

    if (!user) {
      return null;
    }

    try {
      const token = getToken();

      if (!token) {
        return user;
      }

      const subResponse = await fetch(
        `${API_BASE_URL}/subscriptions`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (subResponse.ok) {
        const subData = await subResponse.json();

        user.subscription =
          subData.subscription || subData;

        localStorage.setItem(
          'user',
          JSON.stringify(user)
        );
      }

    } catch (subError) {
      console.error(
        'Failed to fetch subscription:',
        subError
      );
    }

    return user;
  },

  // ------------------------------------------------
  // UPDATE PROFILE
  // ------------------------------------------------

  updateProfile: async (userData) => {
    try {
      const token = getToken();

      if (!token) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(
        `${API_BASE_URL}/auth/profile`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(userData),
        }
      );

      if (response.status === 401) {
        const refreshed =
          await authService.refreshToken();

        if (refreshed) {
          const newToken = getToken();

          const retryResponse = await fetch(
            `${API_BASE_URL}/auth/profile`,
            {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${newToken}`,
              },
              body: JSON.stringify(userData),
            }
          );

          if (retryResponse.ok) {
            const data = await retryResponse.json();

            if (data.user) {
              localStorage.setItem(
                'user',
                JSON.stringify(data.user)
              );
            }

            return data;
          }
        }

        throw new Error('Session expired');
      }

      if (!response.ok) {
        const error = await response.json();

        throw new Error(
          error.error || 'Failed to update profile'
        );
      }

      const data = await response.json();

      if (data.user) {
        localStorage.setItem(
          'user',
          JSON.stringify(data.user)
        );
      }

      return data;

    } catch (error) {
      console.error('Update profile error:', error);
      throw error;
    }
  },

  // ------------------------------------------------
  // CHANGE PASSWORD
  // ------------------------------------------------

  changePassword: async (
    currentPassword,
    newPassword
  ) => {
    try {
      const token = getToken();

      if (!token) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(
        `${API_BASE_URL}/auth/change-password`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            currentPassword,
            newPassword,
          }),
        }
      );

      if (response.status === 401) {
        const refreshed =
          await authService.refreshToken();

        if (refreshed) {
          const newToken = getToken();

          const retryResponse = await fetch(
            `${API_BASE_URL}/auth/change-password`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${newToken}`,
              },
              body: JSON.stringify({
                currentPassword,
                newPassword,
              }),
            }
          );

          if (retryResponse.ok) {
            return await retryResponse.json();
          }
        }

        throw new Error('Session expired');
      }

      if (!response.ok) {
        const error = await response.json();

        throw new Error(
          error.error || 'Failed to change password'
        );
      }

      return await response.json();

    } catch (error) {
      console.error('Change password error:', error);
      throw error;
    }
  },

  // ------------------------------------------------
  // DELETE ACCOUNT
  // ------------------------------------------------

  deleteAccount: async () => {
    try {
      const token = getToken();

      if (!token) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(
        `${API_BASE_URL}/auth/account`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        const error = await response.json();

        throw new Error(
          error.error || 'Failed to delete account'
        );
      }

      clearTokens();

      return await response.json();

    } catch (error) {
      console.error('Delete account error:', error);
      throw error;
    }
  },

  // ------------------------------------------------
  // REFRESH TOKEN
  // ------------------------------------------------

  refreshToken: async () => {
    if (refreshInFlight) {
      return refreshInFlight;
    }

    refreshInFlight = (async () => {
      try {
        const refreshToken = getRefreshToken();

        if (!refreshToken) {
          clearTokens();
          return false;
        }

        const response = await fetch(
          `${API_BASE_URL}/auth/refresh`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              refreshToken,
            }),
          }
        );

        if (!response.ok) {
          clearTokens();
          return false;
        }

        const data = await response.json();

        if (
          !data.accessToken ||
          typeof data.accessToken !== 'string' ||
          data.accessToken.split('.').length !== 3
        ) {
          clearTokens();
          return false;
        }

        setTokens(
          data.accessToken,
          data.refreshToken
        );

        if (data.user) {
          localStorage.setItem(
            'user',
            JSON.stringify(data.user)
          );
        }

        return true;

      } catch (error) {
        console.error('Refresh token error:', error);

        clearTokens();

        return false;

      } finally {
        refreshInFlight = null;
      }
    })();

    return refreshInFlight;
  },

  // ------------------------------------------------
  // VERIFY EMAIL
  // ------------------------------------------------

  verifyEmail: async (token) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/auth/verify-email?token=${encodeURIComponent(token)}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        const error = await response.json();

        throw new Error(
          error.error || 'Verification failed'
        );
      }

      return await response.json();

    } catch (error) {
      console.error('Verify email error:', error);
      throw error;
    }
  },

  // ------------------------------------------------
  // RESEND VERIFICATION
  // ------------------------------------------------

  resendVerification: async (email) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/auth/resend-verification`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || 'Failed to resend verification'
        );
      }

      return {
        success: true,
        message:
          data.message ||
          'Verification email resent successfully!',
      };

    } catch (error) {
      console.error(
        'Resend verification error:',
        error
      );

      throw error;
    }
  },

  // ------------------------------------------------
  // AUTO VERIFY
  // ------------------------------------------------

  autoVerify: async (email) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/auth/auto-verify`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email }),
        }
      );

      if (!response.ok) {
        const error = await response.json();

        throw new Error(
          error.error || 'Auto-verify failed'
        );
      }

      return await response.json();

    } catch (error) {
      console.error('Auto-verify error:', error);
      throw error;
    }
  },

  // ------------------------------------------------
  // AUTHENTICATION STATUS
  // ------------------------------------------------

  isAuthenticated: () => {
    const token = getToken();

    if (!token) {
      return false;
    }

    return isTokenValid(token);
  },

  // ------------------------------------------------
  // STORED USER
  // ------------------------------------------------

  getStoredUser: () => getStoredUser(),

  // ------------------------------------------------
  // UPDATE AVATAR
  // ------------------------------------------------

  updateAvatar: async (avatarData) => {
    try {
      const token = getToken();

      if (!token) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(
        `${API_BASE_URL}/auth/profile`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(avatarData),
        }
      );

      if (!response.ok) {
        const error = await response.json();

        throw new Error(
          error.error || 'Failed to update avatar'
        );
      }

      const data = await response.json();

      if (data.user) {
        localStorage.setItem(
          'user',
          JSON.stringify(data.user)
        );
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
