// src/pages/Admin/AdminLogin.js
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
// Remove Link from react-router-dom since we deleted the footer link
import './AdminLogin.css';

// Import your favicon
import EduSpantechFavicon from '../../assets/favicon-96x96.png';

const FeatureIcon = ({ path }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    {path}
  </svg>
);

const features = [
  {
    title: 'Students',
    desc: 'Track progress and performance',
    icon: <FeatureIcon path={<path d="M22 10 12 4 2 10l10 6 10-6Z M6 12v5c0 1.5 2.7 3 6 3s6-1.5 6-3v-5" />} />,
  },
  {
    title: 'Tutors',
    desc: 'Manage sessions and availability',
    icon: <FeatureIcon path={<><circle cx="9" cy="8" r="3.2" /><path d="M3.5 20c0-3.3 2.5-5.5 5.5-5.5s5.5 2.2 5.5 5.5" /><circle cx="17" cy="8" r="2.4" /><path d="M15.5 14.5c2.3.3 4 2.2 4 5.5" /></>} />,
  },
  {
    title: 'Courses',
    desc: 'Organize curriculum and resources',
    icon: <FeatureIcon path={<path d="M4 5.5C4 4.7 4.7 4 5.5 4H12v16H5.5c-.8 0-1.5-.7-1.5-1.5v-13ZM20 5.5c0-.8-.7-1.5-1.5-1.5H12v16h6.5c.8 0 1.5-.7 1.5-1.5v-13Z" />} />,
  },
  {
    title: 'Analytics',
    desc: 'Make data-driven decisions',
    icon: <FeatureIcon path={<path d="M4 20V10 M10 20V4 M16 20v-7 M22 20H2" />} />,
  },
];

// ============================================
// CONFIG
// ============================================
const API_URL = process.env.REACT_APP_API_URL || 'https://eduspantech-backend.onrender.com/api';
const MAX_ATTEMPTS = 3;
const LOCKOUT_SECONDS = 15 * 60; // 15 min default (backend can override)
const STORAGE_KEY = 'admin_login_lockout';

// Safe JSON parse helper
const safeParse = (str) => {
  try { return str ? JSON.parse(str) : null; } catch { return null; }
};

const AdminLogin = () => {
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // ✅ NEW STATE FOR NON-ADMIN DETECTION
  const [isNotAdmin, setIsNotAdmin] = useState(false);

  const [attemptsLeft, setAttemptsLeft] = useState(null);

  // 2FA state (activated only if backend returns requires2FA)
  const [requires2FA, setRequires2FA] = useState(false);
  const [totp, setTotp] = useState('');

  // Lockout state
  const [lockedUntil, setLockedUntil] = useState(null);
  const [secondsLeft, setSecondsLeft] = useState(0);

  // Remember the original email used before lockout for display
  const [lockedEmail, setLockedEmail] = useState('');

  // Prevent double submits
  const submittingRef = useRef(false);

  // ============================================
  // RESTORE LOCKOUT ON MOUNT
  // ============================================
  useEffect(() => {
    const saved = safeParse(localStorage.getItem(STORAGE_KEY));
    if (saved && saved.until && saved.until > Date.now()) {
      setLockedUntil(saved.until);
      setLockedEmail(saved.email || '');
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  // ============================================
  // COUNTDOWN TICKER
  // ============================================
  useEffect(() => {
    if (!lockedUntil) return;
    const tick = () => {
      const left = Math.max(0, Math.ceil((lockedUntil - Date.now()) / 1000));
      setSecondsLeft(left);
      if (left === 0) {
        setLockedUntil(null);
        setAttemptsLeft(null);
        setError('');
        localStorage.removeItem(STORAGE_KEY);
      }
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [lockedUntil]);

  // ============================================
  // HELPERS
  // ============================================
  const formatTime = (totalSeconds) => {
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const applyLockout = (seconds, emailForLock) => {
    const until = Date.now() + seconds * 1000;
    setLockedUntil(until);
    setLockedEmail(emailForLock || email);
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      until,
      email: emailForLock || email
    }));
  };

  // ============================================
  // SUBMIT
  // ============================================
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submittingRef.current) return;
    if (lockedUntil && lockedUntil > Date.now()) return;

    submittingRef.current = true;
    setLoading(true);
    setError('');
    setIsNotAdmin(false); // ✅ Reset the flag on new submit
    setAttemptsLeft(null);

    try {
      const body = {
        email: email.trim(),
        password
      };
      if (requires2FA && totp.trim()) {
        body.totp = totp.trim();
      }

      const response = await fetch(`${API_URL}/auth/admin-login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(body)
      });

      // --------------------------------------------
      // 429 — Too Many Requests (lockout)
      // --------------------------------------------
      if (response.status === 429) {
        let retryAfter = LOCKOUT_SECONDS;
        try {
          const d = await response.json();
          retryAfter = d.retryAfter || d.retry_after || LOCKOUT_SECONDS;
        } catch { /* ignore */ }
        applyLockout(retryAfter, email.trim());
        setError('Too many failed attempts. Please wait before trying again.');
        return;
      }

      // --------------------------------------------
      // 2FA required
      // --------------------------------------------
      let data = null;
      try { data = await response.json(); } catch { /* ignore */ }

      if (response.status === 401 && data?.requires2FA) {
        setRequires2FA(true);
        setError('Enter your 6-digit authenticator code to continue.');
        return;
      }

      // --------------------------------------------
      // Success
      // --------------------------------------------
      if (response.ok && data?.accessToken) {
        localStorage.setItem('accessToken', data.accessToken);
        localStorage.setItem('refreshToken', data.refreshToken);
        localStorage.setItem('user', JSON.stringify(data.user));
        localStorage.removeItem(STORAGE_KEY);

        // Admin guard (redundant now — the endpoint already enforces it)
        const isAdmin = data.user?.is_admin || data.user?.is_super_admin;
        if (isAdmin) {
          navigate('/admin/dashboard');
        } else {
          setError('Access denied. Admin privileges required.');
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('user');
        }
        return;
      }

      // --------------------------------------------
      // Failure — map status to message + attempt info
      // --------------------------------------------

      // ✅ Non-admin account attempted the admin login
      if (data?.notAdmin) {
        setIsNotAdmin(true);
        return;
      }

      const serverMsg = data?.error || data?.message;

      if (response.status === 500) {
        setError('Server error. Please try again later.');
      } else if (response.status === 401) {
        // Use attemptsLeft from backend if provided
        const left = typeof data?.attemptsLeft === 'number' ? data.attemptsLeft : null;
        if (left !== null) {
          setAttemptsLeft(left);
          if (left === 0) {
            const ra = data?.retryAfter || LOCKOUT_SECONDS;
            applyLockout(ra, email.trim());
            setError('Too many failed attempts. Please wait before trying again.');
          } else {
            setError(serverMsg || `Invalid email or password. ${left} attempt${left === 1 ? '' : 's'} left.`);
          }
        } else {
          setError(serverMsg || 'Invalid email or password.');
        }
      } else if (response.status === 403) {
        // 403 from admin-login means "not an admin" OR "banned/inactive/unverified admin"
        if (data?.notAdmin) {
          setIsNotAdmin(true);
        } else {
          setError(serverMsg || 'Account not verified. Please check your email.');
        }
      } else if (response.status === 423) {
        // Locked (backend explicit)
        let retryAfter = LOCKOUT_SECONDS;
        if (data?.retryAfter) retryAfter = data.retryAfter;
        applyLockout(retryAfter, email.trim());
        setError('Account temporarily locked. Please wait.');
      } else {
        setError(serverMsg || 'Login failed. Please try again.');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('Unable to connect to server. Please check your internet connection.');
    } finally {
      setLoading(false);
      submittingRef.current = false;
    }
  };

  // ============================================
  // DERIVED
  // ============================================
  const isLocked = !!lockedUntil && lockedUntil > Date.now();

  return (
    <div className="admin-login-page">
      {/* Left hero panel */}
      <aside className="admin-login-hero">
        <div className="admin-login-hero-glow glow-1"></div>
        <div className="admin-login-hero-glow glow-2"></div>

        <div className="admin-login-hero-content">
          <div className="admin-login-hero-brand">
            {/* Replaced SVG with the actual favicon logo */}
            <img src={EduSpantechFavicon} alt="EduSpantech" className="brand-logo-img" />
            <span className="admin-login-hero-brand-name">EduSpantech</span>
          </div>

          <h1 className="admin-login-hero-heading">
            Empowering educators.
            <br />
            <span>Building brighter futures.</span>
          </h1>
          <p className="admin-login-hero-sub">
            Manage students, tutors, courses and more — all from one powerful admin platform.
          </p>

          <ul className="admin-login-hero-features">
            {features.map((f) => (
              <li key={f.title}>
                <span className="admin-login-hero-feature-icon">{f.icon}</span>
                <span>
                  <strong>{f.title}</strong>
                  <em>{f.desc}</em>
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="admin-login-hero-footer">EduSpantech · Admin Portal</div>
      </aside>

      {/* Right login panel */}
      <main className="admin-login-panel">
        <div className="admin-login-card">
          <div className="admin-login-card-brand">
            {/* Replaced SVG with the actual favicon logo */}
            <img src={EduSpantechFavicon} alt="EduSpantech" className="brand-logo-img" />
            <span>EduSpantech</span>
          </div>

          <div className="admin-login-header">
            <h2>Welcome back</h2>
            <p>Sign in to your admin account to continue.</p>
          </div>

          {/* ===== ERROR / STATUS ===== */}
          {error && !isLocked && !isNotAdmin && (
            <div className="admin-login-error" role="alert">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="13" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              {error}
            </div>
          )}

          {/* ✅ NEW NON-ADMIN WARNING BANNER */}
          {isNotAdmin && (
            <div className="admin-login-error" role="alert" style={{ background: 'rgba(251, 191, 36, 0.1)', borderColor: 'rgba(251, 191, 36, 0.3)', color: '#fbbf24' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
              </svg>
              <div>
                <strong style={{ display: 'block', marginBottom: 4 }}>Access Denied</strong>
                This portal is for administrators only. Please use the standard login.
                <a href="/login" style={{ display: 'block', marginTop: 6, color: '#fbbf24', fontWeight: 600, textDecoration: 'underline' }}>
                  Go to Standard Login →
                </a>
              </div>
            </div>
          )}

          {/* ===== LOCKOUT BANNER ===== */}
          {isLocked && (
            <div className="admin-login-lockout" role="alert">
              <div className="admin-login-lockout-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="4" y="10.5" width="16" height="10" rx="2" />
                  <path d="M7.5 10.5V7a4.5 4.5 0 0 1 9 0v3.5" />
                </svg>
              </div>
              <div className="admin-login-lockout-body">
                <strong>Account temporarily locked</strong>
                <span>
                  Too many failed attempts
                  {lockedEmail ? ` for ${lockedEmail}` : ''}.
                  Try again in <b>{formatTime(secondsLeft)}</b>.
                </span>
              </div>
            </div>
          )}

          {/* ===== ATTEMPTS WARNING ===== */}
          {!isLocked && attemptsLeft !== null && attemptsLeft > 0 && (
            <div className="admin-login-attempts" role="status">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 9v4M12 17h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
              </svg>
              {attemptsLeft} attempt{attemptsLeft === 1 ? '' : 's'} remaining before temporary lockout.
            </div>
          )}

          <form onSubmit={handleSubmit} method="POST" className="admin-login-form">
            <div className="form-group">
              <label htmlFor="admin-email">Email address</label>
              <div className="input-shell">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2.5" y="4.5" width="19" height="15" rx="2.2" />
                  <path d="m3 6.5 9 6.2 9-6.2" />
                </svg>
                <input
                  id="admin-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@eduspantech.com"
                  autoComplete="username"
                  required
                  disabled={loading || isLocked}
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="admin-password">Password</label>
              <div className="input-shell">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="4" y="10.5" width="16" height="10" rx="2" />
                  <path d="M7.5 10.5V7a4.5 4.5 0 0 1 9 0v3.5" />
                </svg>
                <input
                  id="admin-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  required
                  disabled={loading || isLocked}
                />
                <button
                  type="button"
                  className="input-toggle"
                  onClick={() => setShowPassword((v) => !v)}
                  disabled={loading || isLocked}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  tabIndex={0}
                >
                  {showPassword ? (
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7Z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  ) : (
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 3l18 18" />
                      <path d="M10.6 5.2A10.6 10.6 0 0 1 12 5c6.4 0 10 7 10 7a15.6 15.6 0 0 1-3.4 4.3M6.6 6.6C3.9 8.3 2 12 2 12s3.6 7 10 7a9.9 9.9 0 0 0 4-.8" />
                      <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* ===== 2FA FIELD (appears only when required by backend) ===== */}
            {requires2FA && (
              <div className="form-group">
                <label htmlFor="admin-totp">Authenticator code</label>
                <div className="input-shell">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="4" y="4" width="16" height="16" rx="2" />
                    <path d="M9 9h.01M15 9h.01M9 15h.01M15 15h.01" />
                  </svg>
                  <input
                    id="admin-totp"
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={6}
                    value={totp}
                    onChange={(e) => setTotp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="6-digit code"
                    autoComplete="one-time-code"
                    disabled={loading || isLocked}
                  />
                </div>
              </div>
            )}

            <button type="submit" disabled={loading || isLocked} className="admin-login-btn">
              {isLocked
                ? `Locked — retry in ${formatTime(secondsLeft)}`
                : loading
                ? 'Authenticating…'
                : requires2FA
                ? 'Verify code'
                : 'Access admin panel'}
              {!loading && !isLocked && (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              )}
            </button>
          </form>
          
          {/* Footer link REMOVED as requested */}
        </div>
      </main>
    </div>
  );
};

export default AdminLogin;