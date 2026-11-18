
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authService } from '../services/authService';
import './ParentLogin.css';

const API_URL =
  process.env.REACT_APP_API_URL ||
  'https://eduspantech-backend.onrender.com/api';

const ParentLogin = () => {
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const [parentHeroImage, setParentHeroImage] = useState('');

  // ============================================
  // LOAD PARENT-SPECIFIC HERO IMAGE
  // ============================================

  useEffect(() => {
    const controller = new AbortController();

    const loadParentHero = async () => {
      try {
        const response = await fetch(
          `${API_URL}/login-hero/active?type=parent`,
          { signal: controller.signal }
        );

        if (!response.ok) {
          throw new Error('Unable to load parent hero image.');
        }

        const result = await response.json();

        if (result.success && result.image?.url) {
          setParentHeroImage(result.image.url);
        }
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.error('Parent hero image loading error:', err);
        }
      }
    };

    loadParentHero();

    return () => controller.abort();
  }, []);

  // ============================================
  // PARENT LOGIN
  // ============================================

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await authService.loginParent(email, password);

      console.log('PARENT LOGIN RESPONSE:', response);

      if (!response || !response.success) {
        if (response?.needsVerification) {
          setError(
            'Please verify your email before logging in. Check your inbox.'
          );
        } else {
          setError(
            response?.error || 'Invalid parent email or password.'
          );
        }

        setLoading(false);
        return;
      }

      const userData = response.user;
      const data = userData.user ? userData.user : userData;

      if (
        String(data.role || '').toLowerCase() !== 'parent'
      ) {
        setError(
          'This portal is exclusively for Parents/Guardians.'
        );

        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('userRole');
        localStorage.removeItem('user');

        setLoading(false);
        return;
      }

      localStorage.setItem('accessToken', response.accessToken);
      localStorage.setItem('refreshToken', response.refreshToken);
      localStorage.setItem('userRole', 'parent');
      localStorage.setItem('user', JSON.stringify(userData));

      if (rememberMe) {
        localStorage.setItem('saved_email', email);
      } else {
        localStorage.removeItem('saved_email');
      }

      navigate('/parent/dashboard');

    } catch (err) {
      console.error('Parent Login Error:', err);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-wrapper">
      <div className="login-bg">
        <div className="math-symbols">
          <span className="math-symbol">∫</span>
          <span className="math-symbol">∑</span>
          <span className="math-symbol">π</span>
          <span className="math-symbol">√</span>
          <span className="math-symbol">∞</span>
          <span className="math-symbol">∂</span>
          <span className="math-symbol">Δ</span>
          <span className="math-symbol">θ</span>
        </div>

        <div className="gradient-orb orb-1"></div>
        <div className="gradient-orb orb-2"></div>
        <div className="gradient-orb orb-3"></div>
      </div>

      <div className="login-container">
        <div
          className="login-left"
          style={{
            '--parent-hero-image': parentHeroImage
              ? `url("${parentHeroImage}")`
              : 'none'
          }}
        >
          <div className="brand-content">
            <div className="brand-logo">
              <span className="logo-symbol">∑</span>
              <span className="logo-text">EduSpantech</span>
            </div>

            <h1 className="brand-headline">
              Partner in your
              <br />
              <span className="highlight">child's success</span>
            </h1>

            <p className="brand-description">
              Monitor progress, view term reports, and manage tutoring
              sessions all in one place. Designed specifically for
              parents and guardians.
            </p>

            <div className="brand-stats">
              <div className="stat">
                <span className="stat-number">Live</span>
                <span className="stat-label">Progress Tracking</span>
              </div>

              <div className="stat-divider"></div>

              <div className="stat">
                <span className="stat-number">Term</span>
                <span className="stat-label">Detailed Reports</span>
              </div>

              <div className="stat-divider"></div>

              <div className="stat">
                <span className="stat-number">Easy</span>
                <span className="stat-label">Session Booking</span>
              </div>
            </div>
          </div>
        </div>

        <div className="login-right">
          <div className="login-card">
            <div className="login-header">
              <h2>Parent Portal</h2>
              <p>Sign in to view your child's dashboard</p>
            </div>

            <div className="parent-role-badge">
              <svg
                viewBox="0 0 24 24"
                width="18"
                height="18"
                fill="currentColor"
                style={{ marginRight: '8px' }}
              >
                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
              </svg>
              Parent / Guardian
            </div>

            <div className="parent-login-link-container">
              <Link to="/login" className="parent-login-text-btn">
                Are you a Student or Tutor? Login here
              </Link>
            </div>

            {error && (
              <div className="login-error">
                <span className="error-icon">✕</span>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="login-form">
              <div className="form-group">
                <label>Parent Email Address</label>

                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value.trim())}
                  placeholder="parent@example.com"
                  required
                  autoComplete="email"
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <label>Password</label>

                <div className="password-field">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    required
                    autoComplete="current-password"
                    disabled={loading}
                  />

                  <button
                    type="button"
                    className="toggle-password"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={loading}
                    aria-label={
                      showPassword ? 'Hide password' : 'Show password'
                    }
                  >
                    {showPassword ? '🙈' : '👁️'}
                  </button>
                </div>
              </div>

              <div className="form-options">
                <label className="remember-me">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                  />

                  <span className="checkmark"></span>
                  Remember me
                </label>

                <Link to="/forgot-password" className="forgot-link">
                  Forgot password?
                </Link>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="login-button"
              >
                {loading ? (
                  <>
                    <span className="spinner"></span>
                    Signing in...
                  </>
                ) : (
                  'Sign In as Parent →'
                )}
              </button>
            </form>

            <div className="login-footer">
              <p>
                Don't have an account?{' '}
                <Link to="/parent-register">
                  Register as a Parent
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ParentLogin;
