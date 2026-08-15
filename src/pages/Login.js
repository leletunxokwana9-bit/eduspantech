// src/pages/Login.js
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
  const [loginRole, setLoginRole] = useState('student');
  const [roleError, setRoleError] = useState('');

  // ============================================
  // ROBUST TUTOR CHECK - HANDLES ALL CASES
  // ============================================
  const checkIsTutor = (userData) => {
    if (!userData) return false;
    
    console.log('🔍 CHECKING USER DATA:', userData);
    console.log('🔍 is_tutor:', userData.is_tutor);
    console.log('🔍 role:', userData.role);
    
    // Check if data is nested
    let data = userData;
    if (userData.user) {
      console.log('🔍 Data is nested in user object');
      data = userData.user;
      console.log('🔍 Nested is_tutor:', data.is_tutor);
      console.log('🔍 Nested role:', data.role);
    }
    
    // Check multiple possible fields
    const isTutor = 
      data.is_tutor === true ||
      data.is_tutor === 'true' ||
      data.role === 'tutor' ||
      data.role === 'TUTOR' ||
      data.role === 'instructor' ||
      data.userType === 'tutor' ||
      data.type === 'tutor' ||
      (data.roles && data.roles.includes('tutor'));
    
    console.log('🔍 FINAL RESULT - isTutor:', isTutor);
    
    return isTutor;
  };

  useEffect(() => {
    const checkAuth = async () => {
      const accessToken = localStorage.getItem('accessToken');
      if (accessToken) {
        try {
          const user = await authService.getCurrentUser();
          if (user) {
            const isTutor = checkIsTutor(user);
            
            console.log('🔍 checkAuth - isTutor:', isTutor);
            
            if (isTutor) {
              navigate('/tutor/dashboard');
            } else {
              navigate('/dashboard');
            }
            return;
          }
        } catch (err) {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('user');
          localStorage.removeItem('userRole');
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
    setRoleError('');

    try {
      const response = await authService.login(email, password);
      
      console.log('🔍 LOGIN RESPONSE:', response);
      
      // Check if login was successful
      if (!response || !response.success) {
        if (response?.needsVerification) {
          setNeedsVerification(true);
          setUnverifiedEmail(email);
          setError('Please verify your email before logging in.');
        } else {
          setError(response?.error || 'Login failed. Please try again.');
        }
        setLoading(false);
        return;
      }

      const userData = response.user;
      
      // ============================================
      // CHECK IF USER IS A TUTOR
      // ============================================
      const isTutor = checkIsTutor(userData);
      
      console.log('🔍 Login Debug - FINAL:', {
        isTutor: isTutor,
        loginRole: loginRole,
        email: email
      });

      // ============================================
      // BLOCK: Tutor trying to login as Student
      // ============================================
      if (loginRole === 'student' && isTutor) {
        console.log('🚫 BLOCKED: Tutor trying to login as Student');
        setRoleError('❌ This is a TUTOR account. Please select "Tutor" to login.');
        setLoading(false);
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        localStorage.removeItem('userRole');
        return;
      }
      
      // ============================================
      // BLOCK: Student trying to login as Tutor
      // ============================================
      if (loginRole === 'tutor' && !isTutor) {
        console.log('🚫 BLOCKED: Student trying to login as Tutor');
        setRoleError('❌ This is a STUDENT account. Please select "Student" to login.');
        setLoading(false);
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        localStorage.removeItem('userRole');
        return;
      }

      // ============================================
      // SUCCESS: Valid login with correct role
      // ============================================
      console.log('✅ SUCCESS: Login as:', isTutor ? 'TUTOR' : 'STUDENT');
      localStorage.setItem('userRole', isTutor ? 'tutor' : 'student');
      
      // Navigate based on ACTUAL role
      if (isTutor) {
        navigate('/tutor/dashboard');
      } else {
        navigate('/dashboard');
      }
      
    } catch (err) {
      console.error('Login error:', err);
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

  const handleRoleChange = (role) => {
    setLoginRole(role);
    setRoleError('');
    setError('');
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

        <div className="login-right">
          <div className="login-card">
            <div className="login-header">
              <h2>Welcome Back</h2>
              <p>Sign in to continue your mathematics journey</p>
            </div>

            {/* Role Selection Tabs */}
            <div className="role-tabs">
              <button
                className={`role-tab ${loginRole === 'student' ? 'active' : ''}`}
                onClick={() => handleRoleChange('student')}
              >
                <span className="role-icon">👨‍🎓</span>
                Student
              </button>
              <button
                className={`role-tab ${loginRole === 'tutor' ? 'active' : ''}`}
                onClick={() => handleRoleChange('tutor')}
              >
                <span className="role-icon">👨‍🏫</span>
                Tutor
              </button>
            </div>

            {/* Role Error Message */}
            {roleError && (
              <div className="login-role-error">
                <span className="error-icon">⚠️</span>
                {roleError}
              </div>
            )}

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

            {error && !needsVerification && !roleError && (
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
                  loginRole === 'tutor' ? 'Sign in as Tutor →' : 'Sign In →'
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