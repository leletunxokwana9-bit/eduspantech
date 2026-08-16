// src/pages/ForgotPassword.js
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import './ForgotPassword.css';

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [userData, setUserData] = useState(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [isDark, setIsDark] = useState(false);

  const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://eduspantech-backend.onrender.com/api';

  console.log('🔍 ForgotPassword component mounted!');
  console.log('🔍 Current URL:', window.location.pathname);
  console.log('🔍 API_BASE_URL:', API_BASE_URL);

  useEffect(() => {
    const theme = localStorage.getItem('theme') || 'dark';
    setIsDark(theme === 'dark');
  }, []);

  useEffect(() => {
    if (resendCooldown > 0) {
      const interval = setInterval(() => {
        setResendCooldown(prev => prev - 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [resendCooldown]);

  const handleSearchAccount = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    if (!email) {
      setError('Please enter your email address');
      setLoading(false);
      return;
    }

    try {
      console.log('🔍 Checking user with email:', email);
      const response = await fetch(`${API_BASE_URL}/auth/check-user`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email })
      });

      const data = await response.json();
      console.log('🔍 Check user response:', data);

      if (data.success && data.exists) {
        setUserData(data.user);
        setSuccess('✅ Account found! Please verify your identity.');
        setTimeout(() => {
          setStep(2);
          setSuccess('');
        }, 1500);
      } else {
        setError('❌ No account found with this email address.');
      }
    } catch (err) {
      console.error('❌ Search account error:', err);
      setError('Failed to search for account. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSendVerification = async () => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      console.log('🔍 Sending verification code to:', email);
      const response = await fetch(`${API_BASE_URL}/auth/send-verification-code`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email })
      });

      const data = await response.json();
      console.log('🔍 Send code response:', data);

      if (data.success) {
        setSuccess('✅ Verification code sent to your email!');
        setResendCooldown(60);
        setStep(3);
      } else {
        setError(data.error || 'Failed to send verification code.');
      }
    } catch (err) {
      console.error('❌ Send verification error:', err);
      setError('Failed to send verification code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters.');
      setLoading(false);
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      setLoading(false);
      return;
    }

    try {
      console.log('🔍 Resetting password for:', email);
      const response = await fetch(`${API_BASE_URL}/auth/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email,
          code: verificationCode,
          newPassword
        })
      });

      const data = await response.json();
      console.log('🔍 Reset password response:', data);

      if (data.success) {
        setSuccess('✅ Password reset successfully! Redirecting to login...');
        setTimeout(() => {
          navigate('/login');
        }, 2500);
      } else {
        setError(data.error || 'Failed to reset password. Please try again.');
      }
    } catch (err) {
      console.error('❌ Reset password error:', err);
      setError('Failed to reset password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getAvatar = () => {
    if (!userData) return null;
    if (userData.avatar) return userData.avatar;
    return null;
  };

  const getInitials = () => {
    if (!userData || !userData.name) return '?';
    return userData.name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getColor = () => {
    if (!userData || !userData.name) return '#4f46e5';
    const colors = ['#1a73e8', '#e91e63', '#ff6f00', '#7b1fa2', '#0d47a1', '#00695c', '#bf360c', '#4a148c', '#1a237e', '#880e4f', '#004d40'];
    const hash = userData.name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[hash % colors.length];
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const StepIndicator = () => (
    <div className="step-indicator">
      <div className={`step-dot ${step >= 1 ? 'active' : ''}`}>
        <span>1</span>
        <span className="step-label">Find Account</span>
      </div>
      <div className={`step-line ${step >= 2 ? 'active' : ''}`}></div>
      <div className={`step-dot ${step >= 2 ? 'active' : ''}`}>
        <span>2</span>
        <span className="step-label">Verify Identity</span>
      </div>
      <div className={`step-line ${step >= 3 ? 'active' : ''}`}></div>
      <div className={`step-dot ${step >= 3 ? 'active' : ''}`}>
        <span>3</span>
        <span className="step-label">Reset Password</span>
      </div>
    </div>
  );

  return (
    <div className={`forgot-password-wrapper ${isDark ? 'dark' : 'light'}`}>
      <div className="forgot-password-bg">
        <div className="gradient-orb orb-1"></div>
        <div className="gradient-orb orb-2"></div>
        <div className="gradient-orb orb-3"></div>
      </div>

      <div className="forgot-password-container">
        <div className="forgot-password-card">
          <div className="card-header">
            <button className="back-btn" onClick={() => navigate('/login')}>
              ← Back to Login
            </button>
            <div className="header-content">
              <span className="header-icon">🔐</span>
              <h1>Reset Password</h1>
              <p>We'll help you recover your account</p>
            </div>
          </div>

          <StepIndicator />

          {step === 1 && (
            <div className="step-content">
              <div className="step-description">
                <p>Enter your email address to find your account.</p>
              </div>

              {error && <div className="error-message">{error}</div>}
              {success && <div className="success-message">{success}</div>}

              <form onSubmit={handleSearchAccount} className="forgot-form">
                <div className="form-group">
                  <label>Email Address</label>
                  <div className="input-wrapper">
                    <span className="input-icon">📧</span>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value.trim())}
                      placeholder="name@email.com"
                      required
                      disabled={loading}
                    />
                  </div>
                </div>

                <button type="submit" className="btn-primary" disabled={loading}>
                  {loading ? (
                    <>
                      <span className="spinner"></span>
                      Searching...
                    </>
                  ) : (
                    '🔍 Find Account'
                  )}
                </button>
              </form>
            </div>
          )}

          {step === 2 && userData && (
            <div className="step-content">
              <div className="step-description">
                <p>We found your account! Please verify your identity.</p>
              </div>

              {error && <div className="error-message">{error}</div>}
              {success && <div className="success-message">{success}</div>}

              <div className="user-preview-card">
                <div className="user-avatar" style={{ background: getColor() }}>
                  {getAvatar() ? (
                    <img src={getAvatar()} alt={userData.name} />
                  ) : (
                    <span className="initials">{getInitials()}</span>
                  )}
                </div>
                <div className="user-info">
                  <h3>{userData.name}</h3>
                  <p className="user-email">{userData.email}</p>
                  <div className="user-meta">
                    <span className="user-role">
                      {userData.is_tutor ? '👨‍🏫 Tutor' : '👨‍🎓 Student'}
                    </span>
                    {userData.tier && (
                      <span className="user-tier">🏅 {userData.tier}</span>
                    )}
                    <span className="user-joined">
                      📅 Joined {formatDate(userData.created_at)}
                    </span>
                  </div>
                  {userData.is_tutor && userData.tutor_subjects && (
                    <div className="user-subjects">
                      {userData.tutor_subjects.map((subject, i) => (
                        <span key={i} className="subject-tag">{subject}</span>
                      ))}
                    </div>
                  )}
                  {userData.country && (
                    <div className="user-country">
                      🌍 {userData.country}
                    </div>
                  )}
                </div>
              </div>

              <div className="verify-actions">
                <p className="verify-hint">
                  We'll send a verification code to <strong>{email}</strong>
                </p>
                <button 
                  className="btn-primary" 
                  onClick={handleSendVerification}
                  disabled={loading || resendCooldown > 0}
                >
                  {loading ? (
                    <>
                      <span className="spinner"></span>
                      Sending...
                    </>
                  ) : resendCooldown > 0 ? (
                    `Wait ${resendCooldown}s`
                  ) : (
                    '📧 Send Verification Code'
                  )}
                </button>
                <button 
                  className="btn-secondary"
                  onClick={() => {
                    setStep(1);
                    setError('');
                    setSuccess('');
                  }}
                  disabled={loading}
                >
                  ← Back to Email
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="step-content">
              <div className="step-description">
                <p>Enter the verification code sent to your email and create a new password.</p>
              </div>

              {error && <div className="error-message">{error}</div>}
              {success && <div className="success-message">{success}</div>}

              <form onSubmit={handleResetPassword} className="forgot-form">
                <div className="form-group">
                  <label>Verification Code</label>
                  <div className="input-wrapper">
                    <span className="input-icon">🔑</span>
                    <input
                      type="text"
                      value={verificationCode}
                      onChange={(e) => setVerificationCode(e.target.value)}
                      placeholder="Enter 6-digit code"
                      required
                      disabled={loading}
                      maxLength="6"
                    />
                  </div>
                  <div className="code-hint">
                    <button 
                      type="button" 
                      className="resend-link"
                      onClick={handleSendVerification}
                      disabled={resendCooldown > 0}
                    >
                      {resendCooldown > 0 
                        ? `Resend in ${resendCooldown}s` 
                        : 'Resend code →'}
                    </button>
                  </div>
                </div>

                <div className="form-group">
                  <label>New Password</label>
                  <div className="input-wrapper">
                    <span className="input-icon">🔒</span>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Min 8 characters"
                      required
                      disabled={loading}
                      minLength="8"
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

                <div className="form-group">
                  <label>Confirm Password</label>
                  <div className="input-wrapper">
                    <span className="input-icon">✅</span>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm your new password"
                      required
                      disabled={loading}
                    />
                  </div>
                </div>

                <div className="password-rules">
                  <span className={`rule ${newPassword.length >= 8 ? 'valid' : ''}`}>
                    {newPassword.length >= 8 ? '✅' : '⬜'} At least 8 characters
                  </span>
                  <span className={`rule ${/[a-z]/.test(newPassword) ? 'valid' : ''}`}>
                    {/[a-z]/.test(newPassword) ? '✅' : '⬜'} Contains lowercase
                  </span>
                  <span className={`rule ${/[A-Z]/.test(newPassword) ? 'valid' : ''}`}>
                    {/[A-Z]/.test(newPassword) ? '✅' : '⬜'} Contains uppercase
                  </span>
                  <span className={`rule ${/[0-9]/.test(newPassword) ? 'valid' : ''}`}>
                    {/[0-9]/.test(newPassword) ? '✅' : '⬜'} Contains number
                  </span>
                </div>

                <button type="submit" className="btn-primary" disabled={loading}>
                  {loading ? (
                    <>
                      <span className="spinner"></span>
                      Resetting...
                    </>
                  ) : (
                    '🔒 Reset Password'
                  )}
                </button>

                <button 
                  type="button" 
                  className="btn-secondary"
                  onClick={() => {
                    setStep(2);
                    setError('');
                    setSuccess('');
                  }}
                  disabled={loading}
                >
                  ← Back to Verification
                </button>
              </form>
            </div>
          )}

          <div className="card-footer">
            <p>
              Remember your password? <Link to="/login">Sign in</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;