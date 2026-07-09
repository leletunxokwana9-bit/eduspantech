// Authentication hook with mock data for development
import { useState } from 'react';
import { authService } from '../services/authService';

export const useAuth = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);

  const register = async (userData) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await authService.register(userData);
      setUser(result.user);
      return result;
    } catch (err) {
      setError(err.message || 'Registration failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await authService.login(email, password);
      setUser(result.user);
      return result;
    } catch (err) {
      setError(err.message || 'Login failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await authService.logout();
      setUser(null);
      return result;
    } catch (err) {
      setError(err.message || 'Logout failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const getCurrentUser = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await authService.getCurrentUser();
      setUser(result);
      return result;
    } catch (err) {
      setError(err.message || 'Failed to get user');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    user,
    register,
    login,
    logout,
    getCurrentUser,
    isAuthenticated: !!user
  };
};

export default useAuth;