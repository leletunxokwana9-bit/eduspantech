const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api/v1';

export const authService = {
  // ===== LOGIN =====
  login: async (email, password) => {
    try {
      const url = `${API_BASE_URL}/auth/login`;
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

  // ===== REGISTER - Accepts an object =====
  register: async (userData) => {
    try {
      const url = `${API_BASE_URL}/auth/register`;
      console.log('📤 Sending register to:', url);
      console.log('📦 Registration data:', userData);

      // Map frontend field names to backend expected field names
      const payload = {
        name: userData.name || userData.fullName,
        email: userData.email,
        password: userData.password,
        cohort_flag: userData.cohort_flag || userData.cohort || 'HighSchool',
        country_code: userData.country_code || userData.country || 'ZA',
        grade: userData.grade || '',
        timezone: userData.timezone || 'Africa/Johannesburg'
      };

      console.log('📤 Sending payload:', payload);

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const text = await response.text();
      console.log('📥 Raw response:', text);
      
      let data;
      try {
        data = JSON.parse(text);
      } catch (e) {
        return { 
          success: false, 
          error: 'Server returned invalid response' 
        };
      }

      console.log('📦 Parsed response:', data);

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
  }
};

export default authService;