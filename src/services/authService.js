
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

  return candidates.find(token =>
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
    typeof refreshToken === 'string' &&
    refreshToken !== 'undefined' &&
    refreshToken !== 'null'
  ) {
    localStorage.setItem('refreshToken', refreshToken);
  }
};

// ==================================================
// REQUEST STATE
// ==================================================

let meInFlight = null;
let refreshInFlight = null;

// ==================================================
// CLEAR TOKENS
// ==================================================

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

    return JSON.parse(
      new TextDecoder().decode(bytes)
    );

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
// USER ROLE NORMALISATION
// ==================================================

const isTrue = (value) => {
  return (
    value === true ||
    value === 1 ||
    value === '1' ||
    String(value).toLowerCase() === 'true'
  );
};

const normalizeRole = (user) => {
  if (!user || typeof user !== 'object') {
    return 'student';
  }

  const roles = Array.isArray(user.roles)
    ? user.roles.map(role =>
        String(
          typeof role === 'object'
            ? role.role || role.name || ''
            : role
        ).toLowerCase()
      )
    : [];

  const roleValues = [
    user.role,
    user.user_role,
    user.userRole,
    user.userType,
    user.user_type,
    user.type,
    ...roles,
    localStorage.getItem('userRole'),
  ]
    .filter(Boolean)
    .map(role => String(role).toLowerCase().trim());

  // Admin accounts must not be mistaken for tutors.
  if (
    isTrue(user.is_super_admin) ||
    isTrue(user.is_admin) ||
    roleValues.some(role =>
      ['admin', 'administrator', 'super_admin', 'superadmin'].includes(role)
    )
  ) {
    return 'admin';
  }

  // Tutor flags take priority over a default student role.
  if (
    isTrue(user.is_tutor) ||
    isTrue(user.isTutor) ||
    roleValues.some(role =>
      ['tutor', 'instructor'].includes(role)
    )
  ) {
    return 'tutor';
  }

  if (roleValues.includes('parent')) {
    return 'parent';
  }

  return 'student';
};

const normaliseUser = (user) => {
  if (
    !user ||
    typeof user !== 'object' ||
    Array.isArray(user)
  ) {
    return null;
  }

  const role = normalizeRole(user);

  return {
    ...user,
    role,
    is_tutor: role === 'tutor' || isTrue(user.is_tutor),
    is_admin: role === 'admin' || isTrue(user.is_admin),
  };
};

// ==================================================
// STORED USER
// ==================================================

const getStoredUser = () => {
  try {
    const user = localStorage.getItem('user');

    if (!user) return null;

    return normaliseUser(JSON.parse(user));

  } catch {
    return null;
  }
};

const saveUser = (user) => {
  const normalized = normaliseUser(user);

  if (!normalized) return null;

  localStorage.setItem(
    'user',
    JSON.stringify(normalized)
  );

  localStorage.setItem(
    'userRole',
    normalized.role
  );

  return normalized;
};

// ==================================================
// RESPONSE HELPERS
// ==================================================

const readResponse = async (response) => {
  try {
    return await response.json();
  } catch {
    return {};
  }
};

const getErrorMessage = (data, fallback) => {
  return data?.error || data?.message || fallback;
};

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

      const data = await readResponse(response);

      if (!response.ok) {
        return {
          success: false,
          error: getErrorMessage(
            data,
            'Registration failed. Please try again.'
          ),
        };
      }

      return {
        success: Boolean(data.success),
        message:
          data.message ||
          'Registration successful! Please check your email for verification.',
        user: data.user || null,
        error: data.success
          ? null
          : data.error || 'Registration failed.',
      };

    } catch (error) {
      console.error('Register error:', error);

      return {
        success: false,
        error: error.message || 'Registration failed.',
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

      const data = await readResponse(response);

      if (response.ok && data.accessToken) {
        setTokens(
          data.accessToken,
          data.refreshToken
        );

        let user = null;

        if (data.user) {
          user = saveUser({
            ...data.user,
            role: 'parent',
          });
        }

        meInFlight = null;

        window.dispatchEvent(
          new Event('auth:login')
        );

        return {
          success: true,
          user,
          accessToken: data.accessToken,
          refreshToken: data.refreshToken,
        };
      }

      if (response.status === 403) {
        return {
          success: false,
          error: getErrorMessage(data, 'Access denied.'),
          needsVerification: Boolean(data.needsVerification),
          email: data.email,
        };
      }

      return {
        success: false,
        error: getErrorMessage(
          data,
          response.status === 401
            ? 'Invalid email or password.'
            : 'Login failed.'
        ),
      };

    } catch (error) {
      console.error('Parent login error:', error);

      return {
        success: false,
        error: error.message || 'Login failed. Check your connection.',
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

      const data = await readResponse(response);

      if (response.ok && data.accessToken) {
        setTokens(
          data.accessToken,
          data.refreshToken
        );

        let user = null;

        if (data.user) {
          user = saveUser(data.user);
        }

        meInFlight = null;

        window.dispatchEvent(
          new Event('auth:login')
        );

        console.log('Login successful');
        console.log('Authenticated role:', user?.role);
        console.log('Tutor account:', user?.is_tutor);

        return {
          success: true,
          user,
          accessToken: data.accessToken,
          refreshToken: data.refreshToken,
        };
      }

      if (response.status === 429) {
        return {
          success: false,
          error: getErrorMessage(data, 'Too many failed attempts.'),
          retryAfter: data.retryAfter || 900,
          attemptsLeft: 0,
        };
      }

      if (response.status === 403) {
        return {
          success: false,
          error: getErrorMessage(data, 'Access denied.'),
          banned: Boolean(data.banned),
          bannedUntil: data.bannedUntil || null,
          banReason: data.banReason || null,
          inactive: Boolean(data.inactive),
          needsVerification: Boolean(data.needsVerification),
          email: data.email,
        };
      }

      if (response.status === 401) {
        return {
          success: false,
          error: getErrorMessage(
            data,
            data.requires2FA
              ? 'Two-factor code required.'
              : 'Invalid email or password.'
          ),
          requires2FA: Boolean(data.requires2FA),
          attemptsLeft:
            typeof data.attemptsLeft === 'number'
              ? data.attemptsLeft
              : null,
        };
      }

      return {
        success: false,
        error: getErrorMessage(data, 'Login failed.'),
      };

    } catch (error) {
      console.error('Login error:', error);

      return {
        success: false,
        error: error.message || 'Login failed. Check your connection.',
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
          const refreshed = await authService.refreshToken();

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

          return null;
        }

        const data = await readResponse(response);

        const user = saveUser(data.user || data);

        if (!user) {
          console.error('Invalid current-user response:', data);
          return null;
        }

        console.log('Current authenticated user:', {
          role: user.role,
          is_tutor: user.is_tutor,
          is_admin: user.is_admin,
        });

        return user;

      } catch (error) {
        console.error('Get current user error:', error);
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

      const response = await fetch(
        `${API_BASE_URL}/subscriptions`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await readResponse(response);

        user.subscription =
          data.subscription || data;

        saveUser(user);
      }

    } catch (error) {
      console.error(
        'Failed to fetch subscription:',
        error
      );
    }

    return user;
  },

  // ------------------------------------------------
  // UPDATE PROFILE
  // ------------------------------------------------

  updateProfile: async (userData) => {
    try {
      let token = getToken();

      if (!token) {
        throw new Error('Not authenticated.');
      }

      let response = await fetch(
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
        const refreshed = await authService.refreshToken();

        if (!refreshed) {
          throw new Error('Session expired.');
        }

        token = getToken();

        response = await fetch(
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
      }

      const data = await readResponse(response);

      if (!response.ok) {
        throw new Error(
          getErrorMessage(data, 'Failed to update profile.')
        );
      }

      if (data.user) {
        data.user = saveUser(data.user);
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

  changePassword: async (currentPassword, newPassword) => {
    try {
      let token = getToken();

      if (!token) {
        throw new Error('Not authenticated.');
      }

      const makeRequest = () => fetch(
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

      let response = await makeRequest();

      if (response.status === 401) {
        const refreshed = await authService.refreshToken();

        if (!refreshed) {
          throw new Error('Session expired.');
        }

        token = getToken();
        response = await makeRequest();
      }

      const data = await readResponse(response);

      if (!response.ok) {
        throw new Error(
          getErrorMessage(data, 'Failed to change password.')
        );
      }

      return data;

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
        throw new Error('Not authenticated.');
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

      const data = await readResponse(response);

      if (!response.ok) {
        throw new Error(
          getErrorMessage(data, 'Failed to delete account.')
        );
      }

      clearTokens();

      return data;

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

        if (
          response.status === 400 ||
          response.status === 401 ||
          response.status === 403
        ) {
          clearTokens();
          return false;
        }

        if (!response.ok) {
          console.error(
            'Token refresh temporarily failed:',
            response.status
          );

          return false;
        }

        const data = await readResponse(response);

        if (
          !data.accessToken ||
          typeof data.accessToken !== 'string' ||
          data.accessToken.split('.').length !== 3
        ) {
          console.error(
            'Refresh response did not contain a valid access token.'
          );

          return false;
        }

        setTokens(
          data.accessToken,
          data.refreshToken
        );

        if (data.user) {
          saveUser(data.user);
        }

        window.dispatchEvent(
          new Event('auth:refreshed')
        );

        return true;

      } catch (error) {
        console.error('Refresh token error:', error);
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

      const data = await readResponse(response);

      if (!response.ok) {
        throw new Error(
          getErrorMessage(data, 'Verification failed.')
        );
      }

      return data;

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

      const data = await readResponse(response);

      if (!response.ok) {
        throw new Error(
          getErrorMessage(data, 'Failed to resend verification.')
        );
      }

      return {
        success: true,
        message:
          data.message ||
          'Verification email resent successfully!',
      };

    } catch (error) {
      console.error('Resend verification error:', error);
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

      const data = await readResponse(response);

      if (!response.ok) {
        throw new Error(
          getErrorMessage(data, 'Auto-verify failed.')
        );
      }

      return data;

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

    if (isTokenValid(token)) {
      return true;
    }

    // An expired access token may still be refreshable.
    return Boolean(getRefreshToken());
  },

  // ------------------------------------------------
  // STORED USER
  // ------------------------------------------------

  getStoredUser: () => getStoredUser(),

  // ------------------------------------------------
  // ROLE HELPERS
  // ------------------------------------------------

  getUserRole: () => {
    const user = getStoredUser();

    if (user) {
      return user.role;
    }

    return normalizeRole({
      role: localStorage.getItem('userRole'),
    });
  },

  isTutor: () => {
    const user = getStoredUser();

    return user?.role === 'tutor';
  },

  isAdmin: () => {
    const user = getStoredUser();

    return user?.role === 'admin';
  },

  // ------------------------------------------------
  // UPDATE AVATAR
  // ------------------------------------------------

  updateAvatar: async (avatarData) => {
    try {
      const token = getToken();

      if (!token) {
        throw new Error('Not authenticated.');
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

      const data = await readResponse(response);

      if (!response.ok) {
        throw new Error(
          getErrorMessage(data, 'Failed to update avatar.')
        );
      }

      if (data.user) {
        data.user = saveUser(data.user);
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
