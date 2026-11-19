
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authService } from '../services/authService';
import './Login.css';

const API_URL =
  process.env.REACT_APP_API_URL ||
  'https://eduspantech-backend.onrender.com/api';

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

  const [showBlockedModal, setShowBlockedModal] = useState(false);

  const [rememberMe, setRememberMe] = useState(false);
  const [showSavePrompt, setShowSavePrompt] = useState(false);
  const [pendingUserData, setPendingUserData] = useState(null);

  const [showSavedAccounts, setShowSavedAccounts] = useState(false);
  const [savedAccounts, setSavedAccounts] = useState([]);

  const emailInputRef = useRef(null);
  const passwordInputRef = useRef(null);
  const dropdownRef = useRef(null);

  const [bannedInfo, setBannedInfo] = useState(null);
  const [inactive, setInactive] = useState(false);
  const [lockedInfo, setLockedInfo] = useState(null);
  const [attemptsLeft, setAttemptsLeft] = useState(null);

  const [heroImage, setHeroImage] = useState(null);
  const [heroImageLoading, setHeroImageLoading] = useState(true);

  const [studentCount, setStudentCount] = useState(null);

  // ============================================
  // FORMAT LIVE STUDENT COUNT
  // ============================================

  const formatStudentCount = (count) => {
    if (count === null || count === undefined) {
      return '—';
    }

    const number = Number(count);

    if (!Number.isFinite(number) || number < 0) {
      return '—';
    }

    if (number >= 1000000) {
      return `${(number / 1000000).toFixed(1).replace(/\.0$/, '')}M+`;
    }

    if (number >= 1000) {
      return `${Math.floor(number / 1000)}K+`;
    }

    return number.toLocaleString();
  };

  // ============================================
  // LOAD LIVE STUDENT COUNT
  // ============================================

  useEffect(() => {
    let isMounted = true;

    const loadStudentCount = async () => {
      try {
        const response = await fetch(
          `${API_URL}/stats/student-count`,
          {
            method: 'GET',
            headers: {
              Accept: 'application/json'
            },
            cache: 'no-store'
          }
        );

        if (!response.ok) {
          throw new Error('Unable to load student count');
        }

        const data = await response.json();

        if (
          isMounted &&
          data.success &&
          Number.isFinite(Number(data.totalStudents))
        ) {
          setStudentCount(Number(data.totalStudents));
        }
      } catch (err) {
        console.error('Live student count error:', err);
      }
    };

    loadStudentCount();

    return () => {
      isMounted = false;
    };
  }, []);

  // ============================================
  // LOAD ACTIVE LOGIN HERO IMAGE
  // ============================================

  useEffect(() => {
    let isMounted = true;

    const loadHeroImage = async () => {
      try {
        const response = await fetch(`${API_URL}/login-hero/active`);

        if (!response.ok) {
          throw new Error('Unable to load login hero image');
        }

        const data = await response.json();

        if (isMounted && data.success && data.image?.url) {
          setHeroImage(data.image);
        }
      } catch (err) {
        console.error('Login hero image error:', err);
      } finally {
        if (isMounted) {
          setHeroImageLoading(false);
        }
      }
    };

    loadHeroImage();

    return () => {
      isMounted = false;
    };
  }, []);

  // ============================================
  // ROLE CHECKS
  // ============================================

  const checkIsTutor = (userData) => {
    if (!userData) return false;

    const data = userData.user || userData;

    return (
      data.is_tutor === true ||
      data.is_tutor === 'true' ||
      data.role === 'tutor' ||
      data.role === 'TUTOR' ||
      data.role === 'instructor' ||
      data.userType === 'tutor' ||
      data.type === 'tutor' ||
      (Array.isArray(data.roles) && data.roles.includes('tutor'))
    );
  };

  const checkIsAdmin = (userData) => {
    if (!userData) return false;

    const data = userData.user || userData;

    return (
      data.is_admin === true ||
      data.is_super_admin === true ||
      data.role === 'admin' ||
      data.admin_role != null
    );
  };

  // ============================================
  // LOAD SAVED ACCOUNTS
  // ============================================

  useEffect(() => {
    let isMounted = true;

    const loadAndBackfillAccounts = async () => {
      const saved = localStorage.getItem('eduspantech_saved_accounts');

      if (!saved) return;

      try {
        const accounts = JSON.parse(saved);

        if (!Array.isArray(accounts)) {
          return;
        }

        let hasChanges = false;

        const updatedAccounts = await Promise.all(
          accounts.map(async (account) => {
            if (account.avatar) return account;

            try {
              const response = await fetch(
                `${API_URL}/auth/public-profile?email=${encodeURIComponent(account.email)}`
              );

              if (response.ok) {
                const data = await response.json();

                if (data.user?.avatar) {
                  hasChanges = true;

                  return {
                    ...account,
                    avatar: data.user.avatar
                  };
                }
              }
            } catch (err) {
              console.error('Saved account avatar error:', err);
            }

            return account;
          })
        );

        if (!isMounted) return;

        setSavedAccounts(updatedAccounts);

        if (hasChanges) {
          localStorage.setItem(
            'eduspantech_saved_accounts',
            JSON.stringify(updatedAccounts)
          );
        }
      } catch (err) {
        console.error('Saved accounts error:', err);
      }
    };

    loadAndBackfillAccounts();

    return () => {
      isMounted = false;
    };
  }, []);

  // ============================================
  // CLOSE SAVED ACCOUNTS DROPDOWN
  // ============================================

  useEffect(() => {
    const handleClickOutside = (event) => {
      const clickedDropdown =
        dropdownRef.current?.contains(event.target);

      const clickedEmail =
        emailInputRef.current?.contains(event.target);

      if (!clickedDropdown && !clickedEmail) {
        setShowSavedAccounts(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // ============================================
  // CHECK EXISTING SESSION
  // ============================================

  useEffect(() => {
    let isMounted = true;

    const checkExistingSession = async () => {
      setIsCheckingSession(true);

      const token = localStorage.getItem('accessToken');

      if (!token) {
        if (isMounted) setIsCheckingSession(false);
        return;
      }

      try {
        const user = await authService.getCurrentUser();

        if (!isMounted) return;

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

        if (isMounted) {
          setIsCheckingSession(false);
        }
      }
    };

    checkExistingSession();

    return () => {
      isMounted = false;
    };
  }, [navigate]);

  // ============================================
  // COMPLETE LOGIN
  // ============================================

  const completeLogin = (userData, isTutor) => {
    localStorage.setItem('userRole', isTutor ? 'tutor' : 'student');

    const hasSeenTour = localStorage.getItem('hasSeenTour');

    if (!hasSeenTour && !isTutor) {
      localStorage.setItem('triggerTour', 'true');
    }

    navigate(isTutor ? '/tutor/dashboard' : '/dashboard');
  };

  // ============================================
  // SAVE ACCOUNT
  // ============================================

  const saveAccountForAutofill = (emailToSave, nameToSave, avatarUrl) => {
    const newAccount = {
      email: emailToSave,
      name: nameToSave || 'Student',
      avatar: avatarUrl || null
    };

    const existing = savedAccounts.filter(
      account => account.email !== emailToSave
    );

    const updated = [newAccount, ...existing].slice(0, 5);

    setSavedAccounts(updated);

    localStorage.setItem(
      'eduspantech_saved_accounts',
      JSON.stringify(updated)
    );
  };

  const handleSavePassword = () => {
    localStorage.setItem('saved_email', email);

    setShowSavePrompt(false);

    if (pendingUserData) {
      saveAccountForAutofill(
        email,
        pendingUserData.userData?.name ||
          pendingUserData.userData?.user?.name,
        pendingUserData.userData?.avatar ||
          pendingUserData.userData?.user?.avatar
      );

      completeLogin(
        pendingUserData.userData,
        pendingUserData.isTutor
      );

      setPendingUserData(null);
    }
  };

  const handleNeverSave = () => {
    localStorage.removeItem('saved_email');

    setShowSavePrompt(false);

    if (pendingUserData) {
      completeLogin(
        pendingUserData.userData,
        pendingUserData.isTutor
      );

      setPendingUserData(null);
    }
  };

  const handleSelectAccount = (account) => {
    setEmail(account.email);
    setShowSavedAccounts(false);

    requestAnimationFrame(() => {
      passwordInputRef.current?.focus();
    });
  };

  // ============================================
  // LOGIN SUBMISSION
  // ============================================

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
          setBannedInfo({
            message: response.error || 'Your account has been suspended.',
            bannedUntil: response.bannedUntil
          });
          return;
        }

        if (response?.inactive) {
          setInactive(true);
          return;
        }

        if (response?.retryAfter) {
          setLockedInfo({
            retryAfter: response.retryAfter,
            message: response.error || 'Too many failed attempts.'
          });
          return;
        }

        if (response?.needsVerification) {
          setNeedsVerification(true);
          setUnverifiedEmail(email);
          setError('Please verify your email before logging in.');
          return;
        }

        if (response?.notStudent) {
          setError('Invalid Credentials');
          setAttemptsLeft(2);
          return;
        }

        if (typeof response?.attemptsLeft === 'number') {
          setAttemptsLeft(response.attemptsLeft);

          setError(
            response.error ||
            `Invalid email or password. ${response.attemptsLeft} attempts remaining.`
          );
          return;
        }

        setError(response?.error || 'Login failed. Please try again.');
        return;
      }

      const userData = response.user;

      if (checkIsAdmin(userData)) {
        setShowBlockedModal(true);

        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        localStorage.removeItem('userRole');

        return;
      }

      const isTutor = checkIsTutor(userData);

      if (loginRole === 'student' && isTutor) {
        setRoleError(
          'This is a TUTOR account. Please select "Tutor" to login.'
        );

        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        localStorage.removeItem('userRole');

        return;
      }

      if (loginRole === 'tutor' && !isTutor) {
        setRoleError(
          'This is a STUDENT account. Please select "Student" to login.'
        );

        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        localStorage.removeItem('userRole');

        return;
      }

      if (rememberMe) {
        setPendingUserData({ userData, isTutor });
        setShowSavePrompt(true);
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

  // ============================================
  // RESEND VERIFICATION
  // ============================================

  const handleResendVerification = async () => {
    try {
      setLoading(true);

      const response = await authService.resendVerification(unverifiedEmail);

      if (response.success) {
        setResendSuccess(true);

        setTimeout(() => {
          setResendSuccess(false);
        }, 5000);
      } else {
        alert(
          response.error ||
          'Failed to resend verification email. Please try again.'
        );
      }
    } catch (err) {
      alert(
        err.message ||
        'Failed to resend verification email. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // ROLE CHANGE
  // ============================================

  const handleRoleChange = (role) => {
    setLoginRole(role);
    setRoleError('');
    setError('');
    setBannedInfo(null);
    setInactive(false);
    setLockedInfo(null);
    setShowBlockedModal(false);
  };

  // ============================================
  // SESSION LOADING SCREEN
  // ============================================

  if (isCheckingSession) {
    return (
      <div className="login-wrapper">
        <div className="login-container">
          <div className="login-right">
            <div className="login-card" style={{ textAlign: 'center' }}>
              <div className="loading-spinner" />
              <p>Checking your session...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ============================================
  // LOGIN PAGE
  // ============================================

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

        <div className="gradient-orb orb-1" />
        <div className="gradient-orb orb-2" />
        <div className="gradient-orb orb-3" />
      </div>

      <div className="login-container login-container-new">

        <section className="login-left">

          <div className="hero-copy">
            <h1 className="brand-headline">
              Learn. Practice.
              <span className="highlight"> Excel.</span>
            </h1>

            <p className="brand-description">
              Get expert online tutoring, revision resources and
              personalised learning — anytime, anywhere.
            </p>
          </div>

          <div className="brand-features">

            <div className="brand-feature">
              <span className="feature-icon">▶</span>
              <span className="feature-text">
                Live &amp; On-Demand Lessons
              </span>
            </div>

            <div className="brand-feature">
              <span className="feature-icon">▥</span>
              <span className="feature-text">
                Track Your Progress
              </span>
            </div>

            <div className="brand-feature">
              <span className="feature-icon">♟</span>
              <span className="feature-text">
                Learn with Expert Tutors
              </span>
            </div>

            <div className="brand-feature">
              <span className="feature-icon">✓</span>
              <span className="feature-text">
                Prepare for Exams with Confidence
              </span>
            </div>

          </div>

          <div className="brand-stats">

            <div className="stat">
              <span className="stat-icon">🎓</span>

              <span
                className="stat-number"
                title={
                  studentCount !== null
                    ? `${studentCount.toLocaleString()} registered students`
                    : 'Loading student count'
                }
              >
                {formatStudentCount(studentCount)}
              </span>

              <span className="stat-label">Students</span>
            </div>

            <div className="stat-divider" />

            <div className="stat">
              <span className="stat-icon">★</span>
              <span className="stat-number">4.9/5</span>
              <span className="stat-label">Satisfaction Rate</span>
            </div>

            <div className="stat-divider" />

            <div className="stat">
              <span className="stat-icon">♜</span>
              <span className="stat-number">26</span>
              <span className="stat-label">SA Universities</span>
            </div>

          </div>

          <div className="login-hero-image">

            {!heroImageLoading && heroImage?.url && (
              <img
                src={heroImage.url}
                alt={heroImage.alt_text || 'EduSpantech student learning'}
                className="hero-student-image"
              />
            )}

            <div className="hero-image-overlay" />

          </div>

        </section>

        <section className="login-right">

          <div className="login-card">

            <div className="login-header">
              <h2>Welcome Back</h2>
              <p>Sign in to continue your learning journey</p>
            </div>

            <div className="role-tabs">

              <button
                type="button"
                className={`role-tab ${loginRole === 'student' ? 'active' : ''}`}
                onClick={() => handleRoleChange('student')}
              >
                <span className="role-icon">🎓</span>
                Student
              </button>

              <button
                type="button"
                className={`role-tab ${loginRole === 'tutor' ? 'active' : ''}`}
                onClick={() => handleRoleChange('tutor')}
              >
                <span className="role-icon">♟</span>
                Tutor
              </button>

              {/* IMPORTANT:
                  Parent/Guardian goes to the public Parent Home.
                  It must NOT go directly to /parent-login.
                  The Parent Home has its own ParentNavbar and Login button.
              */}
              <Link
                to="/parent"
                className="role-tab parent-role-tab"
                onClick={() => {
                  console.log('Navigating to public Parent Home: /parent');
                }}
              >
                <span className="role-icon">🛡</span>
                Parent/Guardian
              </Link>

            </div>

            {roleError && (
              <div className="login-role-error">
                <span>⚠️</span>
                {roleError}
              </div>
            )}

            {bannedInfo && (
              <div className="login-banned-notice">
                <div className="banned-icon">🚫</div>

                <div className="banned-content">
                  <p><strong>Account suspended</strong></p>
                  <p>{bannedInfo.message}</p>

                  <p className="banned-help">
                    If you believe this is a mistake, contact{' '}
                    <a href="mailto:support@eduspantech.com">
                      support@eduspantech.com
                    </a>
                  </p>
                </div>
              </div>
            )}

            {inactive && (
              <div className="login-inactive-notice">
                <div className="inactive-icon">⏸️</div>

                <div className="inactive-content">
                  <p><strong>Account inactive</strong></p>

                  <p>
                    Your account has been deactivated.
                    You cannot sign in at this time.
                  </p>

                  <p className="inactive-help">
                    Contact{' '}
                    <a href="mailto:support@eduspantech.com">
                      support@eduspantech.com
                    </a>{' '}
                    for assistance.
                  </p>
                </div>
              </div>
            )}

            {lockedInfo && (
              <div className="login-locked-notice">
                <div className="locked-icon">🔒</div>

                <div className="locked-content">
                  <p><strong>Too many failed attempts</strong></p>

                  <p>
                    {lockedInfo.message} Please wait{' '}
                    <strong>
                      {Math.ceil((lockedInfo.retryAfter || 0) / 60)}
                      {' '}minute(s)
                    </strong>{' '}
                    before trying again.
                  </p>
                </div>
              </div>
            )}

            {needsVerification && (
              <div className="login-verification-notice">
                <div className="verification-icon">📧</div>

                <div className="verification-content">
                  <p><strong>Verify your email address</strong></p>

                  <p>
                    We sent a verification link to{' '}
                    <strong>{unverifiedEmail}</strong>
                  </p>

                  <div className="verification-actions">
                    <button
                      type="button"
                      onClick={handleResendVerification}
                      disabled={loading}
                      className="resend-btn"
                    >
                      {loading
                        ? 'Sending...'
                        : 'Resend verification email'}
                    </button>

                    {resendSuccess && (
                      <span className="resend-success">
                        ✓ Email sent! Check your inbox.
                      </span>
                    )}
                  </div>

                  <p className="verification-help">
                    💡 Check your spam folder if you don't see the email.
                  </p>
                </div>
              </div>
            )}

            {error &&
              !needsVerification &&
              !roleError &&
              !bannedInfo &&
              !inactive &&
              !lockedInfo && (
                <div className="login-error">
                  <span className="error-icon">✕</span>

                  {error}

                  {attemptsLeft !== null && attemptsLeft > 0 && (
                    <span className="attempts-left">
                      {' '}({attemptsLeft} attempts left)
                    </span>
                  )}
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
                    if (savedAccounts.length > 0) {
                      setShowSavedAccounts(true);
                    }
                  }}
                  onFocus={() => {
                    if (savedAccounts.length > 0) {
                      setShowSavedAccounts(true);
                    }
                  }}
                  placeholder="you@example.com"
                  required
                  autoComplete="username"
                  disabled={loading || !!bannedInfo || inactive || !!lockedInfo}
                />

                {showSavedAccounts && savedAccounts.length > 0 && (
                  <div
                    className="saved-accounts-dropdown"
                    ref={dropdownRef}
                  >
                    <div className="saved-accounts-header">
                      Saved Accounts
                    </div>

                    {savedAccounts.map((account, idx) => (
                      <div
                        key={account.email || idx}
                        className="saved-account-item"
                        onMouseDown={(e) => {
                          e.preventDefault();
                          handleSelectAccount(account);
                        }}
                      >
                        <div className="account-avatar">
                          {account.avatar ? (
                            <img
                              src={account.avatar}
                              alt={account.name}
                              className="custom-modal-avatar-img"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                              }}
                            />
                          ) : (
                            (account.name || 'U').charAt(0).toUpperCase()
                          )}
                        </div>

                        <div className="account-info">
                          <span className="account-email">
                            {account.email}
                          </span>

                          <span className="account-name">
                            {account.name}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

              </div>

              <div className="form-group">

                <label>Password</label>

                <div className="password-field">

                  <input
                    ref={passwordInputRef}
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    required
                    autoComplete="current-password"
                    disabled={loading || !!bannedInfo || inactive || !!lockedInfo}
                  />

                  <button
                    type="button"
                    className="toggle-password"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={loading || !!bannedInfo || inactive || !!lockedInfo}
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

                  <span className="checkmark" />
                  Remember me
                </label>

                <Link to="/forgot-password" className="forgot-link">
                  Forgot password?
                </Link>

              </div>

              <button
                type="submit"
                disabled={
                  loading ||
                  !!bannedInfo ||
                  inactive ||
                  !!lockedInfo
                }
                className="login-button"
              >
                {loading ? (
                  <>
                    <span className="spinner" />
                    Signing in...
                  </>
                ) : lockedInfo ? (
                  '🔒 Temporarily locked'
                ) : bannedInfo ? (
                  '🚫 Account suspended'
                ) : inactive ? (
                  '⏸️ Account inactive'
                ) : (
                  'Sign In →'
                )}
              </button>

            </form>

            <div className="login-footer">
              <p>
                Don't have an account?{' '}
                <Link to="/register">Create an account →</Link>
              </p>
            </div>

          </div>

        </section>

      </div>

      {showBlockedModal && (
        <div className="save-password-overlay">
          <div className="save-password-modal">
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>
              🚫
            </div>

            <h3>Invalid Credentials</h3>

            <p>
              The email or password you entered is incorrect.
              Please try again.
            </p>

            <button
              type="button"
              className="btn-save"
              onClick={() => setShowBlockedModal(false)}
              style={{ width: '100%' }}
            >
              Try Again
            </button>
          </div>
        </div>
      )}

      {showSavePrompt && (
        <div className="save-password-overlay">

          <div className="save-password-modal">

            <button
              type="button"
              className="modal-close-btn"
              onClick={handleNeverSave}
            >
              ×
            </button>

            <div className="save-password-header">
              <div className="save-password-icons">
                <span className="key-icon">🔑</span>
              </div>

              <h3>Save login details?</h3>
            </div>

            <div className="save-password-body">

              <p>
                Save your email to log in faster next time on this device.
              </p>

              <div className="input-row">
                <label>Username</label>

                <div className="input-box">
                  <span>{email}</span>
                </div>
              </div>

            </div>

            <div className="save-password-actions">

              <button
                type="button"
                className="btn-never"
                onClick={handleNeverSave}
              >
                Never
              </button>

              <button
                type="button"
                className="btn-save"
                onClick={handleSavePassword}
              >
                Save
              </button>

            </div>

            <p className="save-password-footer">
              Your email will be saved locally on this device
              for faster login.
            </p>

          </div>

        </div>
      )}

    </div>
  );
};

export default Login;
