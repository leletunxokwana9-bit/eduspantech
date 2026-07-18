import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authService } from '../services/authService';
import './Login.css';

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [needsVerification, setNeedsVerification] = useState(false);
  const [unverifiedEmail, setUnverifiedEmail] = useState('');
  const [resendSuccess, setResendSuccess] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const accessToken = localStorage.getItem('accessToken');
      if (accessToken) {
        try {
          const user = await authService.getCurrentUser();
          if (user) {
            navigate('/dashboard');
            return;
          }
        } catch (err) {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('user');
        }
      }
    };
    checkAuth();
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setNeedsVerification(false);

    try {
      const response = await authService.login(email, password);
      
      if (response.success) {
        navigate('/dashboard');
      } else {
        // ✅ Check if error is due to unverified email
        if (response.needsVerification) {
          setNeedsVerification(true);
          setUnverifiedEmail(email);
          setError('Please verify your email before logging in.');
        } else {
          setError(response.error || 'Login failed. Please try again.');
        }
      }
    } catch (err) {
      // ✅ Check if error message contains verification hint
      if (err.message && err.message.toLowerCase().includes('verify')) {
        setNeedsVerification(true);
        setUnverifiedEmail(email);
        setError('Please verify your email before logging in.');
      } else {
        setError(err.message || 'Invalid email or password. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // ✅ Resend verification email
  const handleResendVerification = async () => {
    try {
      setLoading(true);
      const response = await authService.resendVerification(unverifiedEmail);
      if (response.success) {
        setResendSuccess(true);
        setTimeout(() => setResendSuccess(false), 5000);
      } else {
        alert(response.error || 'Failed to resend verification email. Please try again.');
      }
    } catch (err) {
      alert(err.message || 'Failed to resend verification email. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-wrapper">
      {/* Background with mathematical elements */}
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
        {/* Left Panel - Brand Story */}
        <div className="login-left">
          <div className="brand-content">
            <div className="brand-logo">
              <span className="logo-symbol">∑</span>
              <span className="logo-text">EduSpantech</span>
            </div>
            <h1 className="brand-headline">
              Education for the<br />
              <span className="highlight">love of your life</span>
            </h1>
            <p className="brand-description">
              From Grade 8 to 2nd-Year Tertiary — world-class mathematics tutoring,
              powered by a 24/7 global infrastructure across 9 AWS regions.
            </p>
            <div className="brand-stats">
              <div className="stat">
                <span className="stat-number">9</span>
                <span className="stat-label">Global Regions</span>
              </div>
              <div className="stat-divider"></div>
              <div className="stat">
                <span className="stat-number">24/7</span>
                <span className="stat-label">Tutor Availability</span>
              </div>
              <div className="stat-divider"></div>
              <div className="stat">
                <span className="stat-number">12</span>
                <span className="stat-label">Expert Tutors</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel - Login Form */}
        <div className="login-right">
          <div className="login-card">
            <div className="login-header">
              <h2>Welcome Back</h2>
              <p>Sign in to continue your mathematics journey</p>
            </div>

            {/* ✅ Show verification notice */}
            {needsVerification && (
              <div className="login-verification-notice">
                <div className="verification-icon">📧</div>
                <div className="verification-content">
                  <p><strong>Verify your email address</strong></p>
                  <p>We sent a verification link to <strong>{unverifiedEmail}</strong></p>
                  <div className="verification-actions">
                    <button 
                      onClick={handleResendVerification}
                      disabled={loading}
                      className="resend-btn"
                    >
                      {loading ? 'Sending...' : 'Resend verification email'}
                    </button>
                    {resendSuccess && (
                      <span className="resend-success">✓ Email sent! Check your inbox.</span>
                    )}
                  </div>
                  <p className="verification-help">
                    <span>💡</span> Check your spam folder if you don't see the email.
                  </p>
                </div>
              </div>
            )}

            {error && !needsVerification && (
              <div className="login-error">
                <span className="error-icon">✕</span>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="login-form">
              <div className="form-group">
                <label>Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value.trim())}
                  placeholder="name@email.com"
                  required
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
                    disabled={loading}
                  />
                  <button
                    type="button"
                    className="toggle-password"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? '🙈' : '👁️'}
                  </button>
                </div>
              </div>

              <div className="form-options">
                <label className="remember-me">
                  <input type="checkbox" />
                  <span className="checkmark"></span>
                  Remember me
                </label>
                <a href="/forgot-password" className="forgot-link">
                  Forgot password?
                </a>
              </div>

              <button type="submit" disabled={loading} className="login-button">
                {loading ? (
                  <>
                    <span className="spinner"></span>
                    Signing in...
                  </>
                ) : (
                  'Sign In →'
                )}
              </button>
            </form>

            <div className="login-footer">
              <p>
                Don't have an account? <Link to="/register">Get started</Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;