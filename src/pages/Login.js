// src/pages/Login.js
import React, { useState, useEffect, useRef } from 'react';
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
  const [isCheckingSession, setIsCheckingSession] = useState(true);

  // Modal State for Blocked Access
  const [showBlockedModal, setShowBlockedModal] = useState(false);

  // Remember Me State & Custom Save Password Modal
  const [rememberMe, setRememberMe] = useState(false);
  const [showSavePrompt, setShowSavePrompt] = useState(false);
  const [pendingUserData, setPendingUserData] = useState(null); 

  // Saved Accounts Dropdown State
  const [showSavedAccounts, setShowSavedAccounts] = useState(false);
  const [savedAccounts, setSavedAccounts] = useState([]);
  const emailInputRef = useRef(null);
  const dropdownRef = useRef(null);

  // BANNED / INACTIVE / LOCKED STATE
  const [bannedInfo, setBannedInfo] = useState(null);
  const [inactive, setInactive] = useState(false);
  const [lockedInfo, setLockedInfo] = useState(null);
  const [attemptsLeft, setAttemptsLeft] = useState(null);

  const checkIsTutor = (userData) => {
    if (!userData) return false;
    let data = userData;
    if (userData.user) data = userData.user;
    return (
      data.is_tutor === true ||
      data.is_tutor === 'true' ||
      data.role === 'tutor' ||
      data.role === 'TUTOR' ||
      data.role === 'instructor' ||
      data.userType === 'tutor' ||
      data.type === 'tutor' ||
      (data.roles && data.roles.includes('tutor'))
    );
  };

  const checkIsAdmin = (userData) => {
    if (!userData) return false;
    let data = userData;
    if (userData.user) data = userData.user;
    return (
      data.is_admin === true ||
      data.is_super_admin === true ||
      data.role === 'admin' ||
      data.admin_role != null
    );
  };

  // BACKFILL LOGIC
  useEffect(() => {
    const loadAndBackfillAccounts = async () => {
      const saved = localStorage.getItem('eduspantech_saved_accounts');
      if (!saved) return;

      try {
        let accounts = JSON.parse(saved);
        let hasChanges = false;

        const updatedAccounts = await Promise.all(accounts.map(async (account) => {
          if (account.avatar) return account;

          try {
            const API_URL = process.env.REACT_APP_API_URL || 'https://eduspantech-backend.onrender.com/api';
            const res = await fetch(`${API_URL}/auth/public-profile?email=${account.email}`);
            if (res.ok) {
              const data = await res.json();
              if (data.user && data.user.avatar) {
                hasChanges = true;
                return { ...account, avatar: data.user.avatar };
              }
            }
          } catch (err) {}
          return account;
        }));

        setSavedAccounts(updatedAccounts);
        if (hasChanges) {
          localStorage.setItem('eduspantech_saved_accounts', JSON.stringify(updatedAccounts));
        }
      } catch (e) {}
    };

    loadAndBackfillAccounts();
  }, []);

  // ✅ FIXED CLICK OUTSIDE LOGIC
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dropdownRef.current && 
        !dropdownRef.current.contains(event.target) && 
        emailInputRef.current && 
        !emailInputRef.current.contains(event.target)
      ) {
        setShowSavedAccounts(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const checkExistingSession = async () => {
      setIsCheckingSession(true);
      const token = localStorage.getItem('accessToken');
      if (token) {
        try {
          const user = await authService.getCurrentUser();
          if (user && user.name) {
            const isTutor = checkIsTutor(user);
            const isAdmin = checkIsAdmin(user);
            
            if (isAdmin) {
              localStorage.removeItem('accessToken');
              localStorage.removeItem('refreshToken');
              localStorage.removeItem('user');
              localStorage.removeItem('userRole');
              setIsCheckingSession(false);
              return;
            }

            const confirmSwitch = window.confirm(
              `You are currently logged in as "${user.name}".\n\nDo you want to switch accounts?`
            );
            if (confirmSwitch) {
              localStorage.removeItem('accessToken');
              localStorage.removeItem('refreshToken');
              localStorage.removeItem('user');
              localStorage.removeItem('userRole');
              setIsCheckingSession(false);
            } else {
              navigate(isTutor ? '/tutor/dashboard' : '/dashboard');
            }
          } else {
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            localStorage.removeItem('user');
            localStorage.removeItem('userRole');
            setIsCheckingSession(false);
          }
        } catch (err) {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('user');
          localStorage.removeItem('userRole');
          setIsCheckingSession(false);
        }
      } else {
        setIsCheckingSession(false);
      }
    };
    checkExistingSession();
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setNeedsVerification(false);
    setRoleError('');
    setBannedInfo(null);
    setInactive(false);
    setLockedInfo(null);
    setAttemptsLeft(null);
    setShowBlockedModal(false); 
    setShowSavedAccounts(false); 

    try {
      const response = await authService.login(email, password);

      if (!response || !response.success) {
        if (response?.banned) {
          setBannedInfo({ message: response.error || 'Your account has been suspended.', bannedUntil: response.bannedUntil });
          setLoading(false);
          return;
        }
        if (response?.inactive) {
          setInactive(true);
          setLoading(false);
          return;
        }
        if (response?.retryAfter) {
          setLockedInfo({ retryAfter: response.retryAfter, message: response.error || 'Too many failed attempts.' });
          setLoading(false);
          return;
        }
        if (response?.needsVerification) {
          setNeedsVerification(true);
          setUnverifiedEmail(email);
          setError('Please verify your email before logging in.');
          setLoading(false);
          return;
        }
        
        if (response?.notStudent) {
          setError('Invalid Credentials');
          setAttemptsLeft(2);
          setLoading(false);
          return;
        }

        if (typeof response?.attemptsLeft === 'number') {
          setAttemptsLeft(response.attemptsLeft);
          setError(response.error || `Invalid email or password. ${response.attemptsLeft} attempt${response.attemptsLeft === 1 ? '' : 's'} remaining.`);
          setLoading(false);
          return;
        }
        setError(response?.error || 'Login failed. Please try again.');
        setLoading(false);
        return;
      }

      const userData = response.user;
      
      if (checkIsAdmin(userData)) {
        setShowBlockedModal(true);
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        localStorage.removeItem('userRole');
        setLoading(false);
        return;
      }

      const isTutor = checkIsTutor(userData);

      if (loginRole === 'student' && isTutor) {
        setRoleError('This is a TUTOR account. Please select "Tutor" to login.');
        setLoading(false);
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        localStorage.removeItem('userRole');
        return;
      }
      if (loginRole === 'tutor' && !isTutor) {
        setRoleError('This is a STUDENT account. Please select "Student" to login.');
        setLoading(false);
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        localStorage.removeItem('userRole');
        return;
      }

      if (rememberMe) {
        setPendingUserData({ userData, isTutor });
        setShowSavePrompt(true);
        setLoading(false);
        return; 
      }

      completeLogin(userData, isTutor);

    } catch (err) {
      console.error('Login error:', err);
      const msg = err.message || '';
      if (msg.toLowerCase().includes('suspend')) {
        setBannedInfo({ message: msg });
      } else if (msg.toLowerCase().includes('inactive')) {
        setInactive(true);
      } else if (msg.toLowerCase().includes('verify')) {
        setNeedsVerification(true);
        setUnverifiedEmail(email);
        setError('Please verify your email before logging in.');
      } else {
        setError(msg || 'Invalid email or password. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const completeLogin = (userData, isTutor) => {
    localStorage.setItem('userRole', isTutor ? 'tutor' : 'student');
    const hasSeenTour = localStorage.getItem('hasSeenTour');
    if (!hasSeenTour && !isTutor) {
      localStorage.setItem('triggerTour', 'true');
    }
    navigate(isTutor ? '/tutor/dashboard' : '/dashboard');
  };

  const saveAccountForAutofill = (emailToSave, nameToSave, avatarUrl) => {
    const newAccount = { email: emailToSave, name: nameToSave || 'Student', avatar: avatarUrl || null };
    const existing = savedAccounts.filter(a => a.email !== emailToSave);
    const updated = [newAccount, ...existing].slice(0, 5); 
    setSavedAccounts(updated);
    localStorage.setItem('eduspantech_saved_accounts', JSON.stringify(updated));
  };

  const handleSavePassword = () => {
    localStorage.setItem('saved_email', email);
    setShowSavePrompt(false);
    if (pendingUserData) {
      saveAccountForAutofill(
        email, 
        pendingUserData.userData?.name || pendingUserData.userData?.user?.name,
        pendingUserData.userData?.avatar || pendingUserData.userData?.user?.avatar
      );
      completeLogin(pendingUserData.userData, pendingUserData.isTutor);
    }
  };

  const handleNeverSave = () => {
    localStorage.removeItem('saved_email');
    setShowSavePrompt(false);
    if (pendingUserData) {
      completeLogin(pendingUserData.userData, pendingUserData.isTutor);
    }
  };

  const handleSelectAccount = (account) => {
    setEmail(account.email);
    setShowSavedAccounts(false);
    setTimeout(() => {
      document.querySelector('input[type="password"]')?.focus();
    }, 50);
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
    setBannedInfo(null);
    setInactive(false);
    setLockedInfo(null);
    setShowBlockedModal(false);
  };

  if (isCheckingSession) {
    return (
      <div className="login-wrapper">
        <div className="login-bg">
          <div className="math-symbols">
            <span className="math-symbol">∫</span><span className="math-symbol">∑</span><span className="math-symbol">π</span><span className="math-symbol">√</span><span className="math-symbol">∞</span><span className="math-symbol">∂</span><span className="math-symbol">Δ</span><span className="math-symbol">θ</span>
          </div>
          <div className="gradient-orb orb-1"></div><div className="gradient-orb orb-2"></div><div className="gradient-orb orb-3"></div>
        </div>
        <div className="login-container">
          <div className="login-right" style={{ maxWidth: '500px', margin: '0 auto' }}>
            <div className="login-card" style={{ textAlign: 'center', padding: '60px 40px' }}>
              <div className="loading-spinner" style={{ width: '40px', height: '40px', border: '3px solid rgba(79,70,229,0.1)', borderTopColor: '#4f46e5', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' }}></div>
              <p style={{ color: '#94a3b8' }}>Checking your session...</p>
              <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="login-wrapper">
      <style>{`
        .parent-login-link-container {
          text-align: center;
          margin-top: 12px;
          margin-bottom: 24px;
        }
        .parent-login-text-btn {
          background: none;
          border: none;
          color: #a78bfa;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          text-decoration: underline;
          text-underline-offset: 4px;
          transition: color 0.2s ease;
          font-family: inherit;
        }
        .parent-login-text-btn:hover {
          color: #ffffff;
        }
      `}</style>

      <div className="login-bg">
        <div className="math-symbols">
          <span className="math-symbol">∫</span><span className="math-symbol">∑</span><span className="math-symbol">π</span><span className="math-symbol">√</span><span className="math-symbol">∞</span><span className="math-symbol">∂</span><span className="math-symbol">Δ</span><span className="math-symbol">θ</span>
        </div>
        <div className="gradient-orb orb-1"></div><div className="gradient-orb orb-2"></div><div className="gradient-orb orb-3"></div>
      </div>

      <div className="login-container">
        <div className="login-left">
          <div className="brand-content">
            <div className="brand-logo">
              <span className="logo-symbol">∑</span>
              <span className="logo-text">EduSpantech</span>
            </div>
            <h1 className="brand-headline">
              Education for the<br /><span className="highlight">love of your life</span>
            </h1>
            <p className="brand-description">
              From Grade 8 to 2nd-Year Tertiary — world-class mathematics tutoring,
              powered by a 24/7 global infrastructure across 9 AWS regions.
            </p>
            <div className="brand-stats">
              <div className="stat"><span className="stat-number">9</span><span className="stat-label">Global Regions</span></div>
              <div className="stat-divider"></div>
              <div className="stat"><span className="stat-number">24/7</span><span className="stat-label">Tutor Availability</span></div>
              <div className="stat-divider"></div>
              <div className="stat"><span className="stat-number">12</span><span className="stat-label">Expert Tutors</span></div>
            </div>
          </div>
        </div>

        <div className="login-right">
          <div className="login-card">
            <div className="login-header">
              <h2>Welcome Back</h2>
              <p>Sign in to continue your mathematics journey</p>
            </div>

            <div className="role-tabs">
              <button className={`role-tab ${loginRole === 'student' ? 'active' : ''}`} onClick={() => handleRoleChange('student')}>
                <span className="role-icon">👨‍🎓</span> Student
              </button>
              <button className={`role-tab ${loginRole === 'tutor' ? 'active' : ''}`} onClick={() => handleRoleChange('tutor')}>
                <span className="role-icon">👨‍🏫</span> Tutor
              </button>
            </div>

            <div className="parent-login-link-container">
              <Link to="/parent-login" className="parent-login-text-btn">
                Parent/Guardian? Login here
              </Link>
            </div>

            {roleError && (<div className="login-role-error"><span className="error-icon">⚠️</span>{roleError}</div>)}

            {bannedInfo && (
              <div className="login-banned-notice">
                <div className="banned-icon">🚫</div>
                <div className="banned-content">
                  <p><strong>Account suspended</strong></p>
                  {bannedInfo.message && <p>{bannedInfo.message}</p>}
                  <p className="banned-help">If you believe this is a mistake, contact <a href="mailto:support@eduspantech.com">support@eduspantech.com</a></p>
                </div>
              </div>
            )}

            {inactive && (
              <div className="login-inactive-notice">
                <div className="inactive-icon">⏸️</div>
                <div className="inactive-content">
                  <p><strong>Account inactive</strong></p>
                  <p>Your account has been deactivated. You cannot sign in at this time.</p>
                  <p className="inactive-help">Contact <a href="mailto:support@eduspantech.com">support@eduspantech.com</a> for assistance.</p>
                </div>
              </div>
            )}

            {lockedInfo && (
              <div className="login-locked-notice">
                <div className="locked-icon">🔒</div>
                <div className="locked-content">
                  <p><strong>Too many failed attempts</strong></p>
                  <p>{lockedInfo.message} Please wait <strong>{Math.ceil((lockedInfo.retryAfter || 0) / 60)} minute(s)</strong> before trying again.</p>
                </div>
              </div>
            )}

            {needsVerification && (
              <div className="login-verification-notice">
                <div className="verification-icon">📧</div>
                <div className="verification-content">
                  <p><strong>Verify your email address</strong></p>
                  <p>We sent a verification link to <strong>{unverifiedEmail}</strong></p>
                  <div className="verification-actions">
                    <button onClick={handleResendVerification} disabled={loading} className="resend-btn">{loading ? 'Sending...' : 'Resend verification email'}</button>
                    {resendSuccess && (<span className="resend-success">✓ Email sent! Check your inbox.</span>)}
                  </div>
                  <p className="verification-help"><span>💡</span> Check your spam folder if you don't see the email.</p>
                </div>
              </div>
            )}

            {error && !needsVerification && !roleError && !bannedInfo && !inactive && !lockedInfo && (
              <div className="login-error">
                <span className="error-icon">✕</span>{error}
                {attemptsLeft !== null && attemptsLeft > 0 && (<span className="attempts-left"> ({attemptsLeft} attempt{attemptsLeft === 1 ? '' : 's'} left)</span>)}
              </div>
            )}

            <form onSubmit={handleSubmit} className="login-form">
              
              <div className="form-group relative">
                <label>Email Address</label>
                <input
                  ref={emailInputRef} 
                  type="email" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value.trim())} 
                  onClick={() => {
                    if (savedAccounts.length > 0) setShowSavedAccounts(true);
                  }}
                  onFocus={() => {
                    if (savedAccounts.length > 0) setShowSavedAccounts(true);
                  }} 
                  placeholder="name@email.com" 
                  required 
                  autoComplete="new-password" 
                  disabled={loading || bannedInfo || inactive || lockedInfo}
                />
                {showSavedAccounts && savedAccounts.length > 0 && (
                  <div className="saved-accounts-dropdown" ref={dropdownRef}>
                    <div className="saved-accounts-header">Saved Accounts</div>
                    {savedAccounts.map((account, idx) => (
                      <div 
                        key={idx} 
                        className="saved-account-item" 
                        onMouseDown={(e) => {
                          e.preventDefault(); // Prevents input from losing focus
                          handleSelectAccount(account);
                        }}
                        style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', cursor: 'pointer', borderBottom: '1px solid rgba(255,255,255,0.05)' }}
                      >
                        <div style={{ width: '40px', height: '40px', minWidth: '40px', minHeight: '40px', borderRadius: '50%', overflow: 'hidden', backgroundColor: '#4f46e5', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          {account.avatar ? <img src={account.avatar} alt={account.name} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center', display: 'block' }} onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }} /> : null}
                          <span style={{ display: account.avatar ? 'none' : 'flex', color: '#ffffff', fontSize: '16px', fontWeight: 'bold' }}>{(account.name || 'U').charAt(0).toUpperCase()}</span>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                          <span style={{ color: '#ffffff', fontWeight: 'bold', fontSize: '14px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{account.email}</span>
                          <span style={{ color: '#a78bfa', fontSize: '12px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{account.name}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="form-group">
                <label>Password</label>
                <div className="password-field">
                  <input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter your password" required autoComplete="current-password" disabled={loading || bannedInfo || inactive || lockedInfo} />
                  <button type="button" className="toggle-password" onClick={() => setShowPassword(!showPassword)} disabled={loading || bannedInfo || inactive || lockedInfo}>{showPassword ? '🙈' : '👁️'}</button>
                </div>
              </div>

              <div className="form-options">
                <label className="remember-me">
                  <input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} />
                  <span className="checkmark"></span> Remember me
                </label>
                <Link to="/forgot-password" className="forgot-link">Forgot password?</Link>
              </div>

              <button type="submit" disabled={loading || !!bannedInfo || inactive || !!lockedInfo} className="login-button">
                {loading ? (<><span className="spinner"></span>Signing in...</>) : lockedInfo ? ('🔒 Temporarily locked') : bannedInfo ? ('🚫 Account suspended') : inactive ? ('⏸️ Account inactive') : (loginRole === 'tutor' ? 'Sign in as Tutor →' : 'Sign In →')}
              </button>
            </form>

            <div className="login-footer">
              <p>Don't have an account? <Link to="/register">Get started</Link></p>
            </div>
          </div>
        </div>
      </div>

      {/* ✅ BLOCKED ACCESS MODAL (SILENT FAIL) */}
      {showBlockedModal && (
        <div className="save-password-overlay">
          <div className="save-password-modal" style={{ textAlign: 'center', padding: '40px 32px' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🚫</div>
            <h3 style={{ fontSize: '22px', fontWeight: 'bold', color: '#ffffff', marginBottom: '8px' }}>Invalid Credentials</h3>
            <p style={{ fontSize: '14px', color: '#94a3b8', marginBottom: '24px' }}>The email or password you entered is incorrect. Please try again.</p>
            <button className="btn-save" onClick={() => setShowBlockedModal(false)} style={{ width: '100%', padding: '12px', fontSize: '15px' }}>Try Again</button>
          </div>
        </div>
      )}

      {/* ✅ CUSTOM SAVE PASSWORD MODAL */}
      {showSavePrompt && (
        <div className="save-password-overlay">
          <div className="save-password-modal">
            <button className="modal-close-btn" onClick={handleNeverSave}>×</button>
            <div className="save-password-header">
              <div className="save-password-icons"><span className="key-icon">🔑</span></div>
              <h3>Save login details?</h3>
            </div>
            <div className="save-password-body">
              <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)', margin: 0 }}>Save your email to log in faster next time on this device.</p>
              <div className="input-row"><label>Username</label><div className="input-box"><span>{email}</span></div></div>
            </div>
            <div className="save-password-actions">
              <button className="btn-never" onClick={handleNeverSave}>Never</button>
              <button className="btn-save" onClick={handleSavePassword}>Save</button>
            </div>
            <p className="save-password-footer">Your email will be saved locally on this device for faster login.</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;