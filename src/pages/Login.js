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
      <div className="lg-page">
        <div className="lg-shell">
          <div className="lg-panel">
            <div className="lg-card" style={{ textAlign: 'center' }}>
              <div className="lg-loader" />
              <p>Checking your session...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const formLocked = loading || !!bannedInfo || inactive || !!lockedInfo;

  // ============================================
  // LOGIN PAGE
  // ============================================

  return (
    <div className="lg-page">

      <div className="lg-shell">

        {/* ===== HERO (left) — one shared pool, like the Home hero ===== */}
        <section className="lg-hero">

          <div className="lg-copy">
            <h1 className="lg-headline">
              Learn. Practice.
              <span className="lg-accent"> Excel.</span>
            </h1>

            <p className="lg-lead">
              Get expert online tutoring, revision resources and
              personalised learning — anytime, anywhere.
            </p>
          </div>

          <div className="lg-stats">

            <div className="lg-stat">
              <span className="lg-stat-icon">🎓</span>

              <span
                className="lg-stat-num"
                title={
                  studentCount !== null
                    ? `${studentCount.toLocaleString()} registered students`
                    : 'Loading student count'
                }
              >
                {formatStudentCount(studentCount)}
              </span>

              <span className="lg-stat-label">Students</span>
            </div>

            <div className="lg-stat-sep" />

            <div className="lg-stat">
              <span className="lg-stat-icon">★</span>
              <span className="lg-stat-num">4.9/5</span>
              <span className="lg-stat-label">Satisfaction Rate</span>
            </div>

            <div className="lg-stat-sep" />

            <div className="lg-stat">
              <span className="lg-stat-icon">♜</span>
              <span className="lg-stat-num">26</span>
              <span className="lg-stat-label">SA Universities</span>
            </div>

          </div>

          {!heroImageLoading && heroImage?.url && (
            <div className="lg-visual">
              <img
                src={heroImage.url}
                alt={heroImage.alt_text || 'EduSpantech student learning'}
                className="lg-visual-img"
              />
            </div>
          )}

        </section>

        {/* ===== SIGN IN (right) ===== */}
        <section className="lg-panel">

          <div className="lg-card">

            <div className="lg-head">
              <h2>Welcome Back</h2>
              <p>Sign in to continue your learning journey</p>
            </div>

            <div className="lg-tabs">

              <button
                type="button"
                className={`lg-tab ${loginRole === 'student' ? 'is-active' : ''}`}
                onClick={() => handleRoleChange('student')}
              >
                <span className="lg-tab-icon">🎓</span>
                Student
              </button>

              <button
                type="button"
                className={`lg-tab ${loginRole === 'tutor' ? 'is-active' : ''}`}
                onClick={() => handleRoleChange('tutor')}
              >
                <span className="lg-tab-icon">♟</span>
                Tutor
              </button>

              <Link
                to="/parent"
                className="lg-tab lg-tab--link"
              >
                <span className="lg-tab-icon">🛡</span>
                Parent/Guardian
              </Link>

            </div>

            {roleError && (
              <div className="lg-notice lg-notice--error">
                <span>⚠️</span>
                {roleError}
              </div>
            )}

            {bannedInfo && (
              <div className="lg-notice lg-notice--banned">
                <div className="lg-notice-icon">🚫</div>

                <div className="lg-notice-body">
                  <p><strong>Account suspended</strong></p>
                  <p>{bannedInfo.message}</p>

                  <p className="lg-notice-help">
                    If you believe this is a mistake, contact{' '}
                    <a href="mailto:support@eduspantech.com">
                      support@eduspantech.com
                    </a>
                  </p>
                </div>
              </div>
            )}

            {inactive && (
              <div className="lg-notice lg-notice--inactive">
                <div className="lg-notice-icon">⏸️</div>

                <div className="lg-notice-body">
                  <p><strong>Account inactive</strong></p>

                  <p>
                    Your account has been deactivated.
                    You cannot sign in at this time.
                  </p>

                  <p className="lg-notice-help">
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
              <div className="lg-notice lg-notice--locked">
                <div className="lg-notice-icon">🔒</div>

                <div className="lg-notice-body">
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
              <div className="lg-notice lg-notice--verify">
                <div className="lg-notice-icon">📧</div>

                <div className="lg-notice-body">
                  <p><strong>Verify your email address</strong></p>

                  <p>
                    We sent a verification link to{' '}
                    <strong>{unverifiedEmail}</strong>
                  </p>

                  <div className="lg-verify-actions">
                    <button
                      type="button"
                      onClick={handleResendVerification}
                      disabled={loading}
                      className="lg-resend"
                    >
                      {loading
                        ? 'Sending...'
                        : 'Resend verification email'}
                    </button>

                    {resendSuccess && (
                      <span className="lg-resend-ok">
                        ✓ Email sent! Check your inbox.
                      </span>
                    )}
                  </div>

                  <p className="lg-notice-help">
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
                <div className="lg-notice lg-notice--error">
                  <span className="lg-error-icon">✕</span>

                  {error}

                  {attemptsLeft !== null && attemptsLeft > 0 && (
                    <span className="lg-attempts">
                      {' '}({attemptsLeft} attempts left)
                    </span>
                  )}
                </div>
              )}

            <form onSubmit={handleSubmit} className="lg-form">

              <div className="lg-field lg-field--rel">

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
                  disabled={formLocked}
                />

                {showSavedAccounts && savedAccounts.length > 0 && (
                  <div
                    className="lg-saved"
                    ref={dropdownRef}
                  >
                    <div className="lg-saved-head">
                      Saved Accounts
                    </div>

                    {savedAccounts.map((account, idx) => (
                      <div
                        key={account.email || idx}
                        className="lg-saved-item"
                        onMouseDown={(e) => {
                          e.preventDefault();
                          handleSelectAccount(account);
                        }}
                      >
                        <div className="lg-avatar">
                          {account.avatar ? (
                            <img
                              src={account.avatar}
                              alt={account.name}
                              className="lg-avatar-img"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                              }}
                            />
                          ) : (
                            (account.name || 'U').charAt(0).toUpperCase()
                          )}
                        </div>

                        <div className="lg-saved-info">
                          <span className="lg-saved-email">
                            {account.email}
                          </span>

                          <span className="lg-saved-name">
                            {account.name}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

              </div>

              <div className="lg-field">

                <label>Password</label>

                <div className="lg-pass">

                  <input
                    ref={passwordInputRef}
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    required
                    autoComplete="current-password"
                    disabled={formLocked}
                  />

                  <button
                    type="button"
                    className="lg-eye"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={formLocked}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? '🙈' : '👁️'}
                  </button>

                </div>
              </div>

              <div className="lg-options">

                <label className="lg-remember">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                  />

                  <span className="lg-check" />
                  Remember me
                </label>

                <Link to="/forgot-password" className="lg-link">
                  Forgot password?
                </Link>

              </div>

              <button
                type="submit"
                disabled={formLocked}
                className="lg-submit"
              >
                {loading ? (
                  <>
                    <span className="lg-spin" />
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

            <div className="lg-foot">
              <p>
                Don't have an account?{' '}
                <Link to="/register">Create an account →</Link>
              </p>
            </div>

          </div>

        </section>

      </div>

      {showBlockedModal && (
        <div className="lg-overlay">
          <div className="lg-modal">
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
              className="lg-btn-primary"
              onClick={() => setShowBlockedModal(false)}
              style={{ width: '100%' }}
            >
              Try Again
            </button>
          </div>
        </div>
      )}

      {showSavePrompt && (
        <div className="lg-overlay">

          <div className="lg-modal">

            <button
              type="button"
              className="lg-modal-x"
              onClick={handleNeverSave}
              aria-label="Close"
            >
              ×
            </button>

            <div className="lg-modal-head">
              <div className="lg-modal-icon">
                <span className="lg-key">🔑</span>
              </div>

              <h3>Save login details?</h3>
            </div>

            <div className="lg-modal-body">

              <p>
                Save your email to log in faster next time on this device.
              </p>

              <div className="lg-modal-row">
                <label>Username</label>

                <div className="lg-modal-box">
                  <span>{email}</span>
                </div>
              </div>

            </div>

            <div className="lg-modal-actions">

              <button
                type="button"
                className="lg-btn-ghost"
                onClick={handleNeverSave}
              >
                Never
              </button>

              <button
                type="button"
                className="lg-btn-primary"
                onClick={handleSavePassword}
              >
                Save
              </button>

            </div>

            <p className="lg-modal-foot">
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
