// src/pages/ParentRegister.js
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authService } from '../services/authService';
import './ParentRegister.css';

// ✅ SAFE PLACEHOLDERS: These prevent React Error #130 if Terms.js or Privacy.js have bad exports
const TermsOfService = { 
  getFullTerms: () => [
    { id: 1, title: 'Acceptance of Terms', content: ['By using EduSpantech, you agree to these terms.'] }
  ], 
  effectiveDate: 'January 1, 2026' 
};

const PrivacyPolicy = { 
  getFullPolicy: () => [
    { id: 1, title: 'Data Collection', content: ['We collect only the information necessary to provide our services.'] }
  ], 
  effectiveDate: 'January 1, 2026' 
};

const ParentRegister = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    country: 'ZA',
    agreeToTerms: false
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState(1);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState('');

  // Check if user is already logged in
  useEffect(() => {
    const checkAuth = async () => {
      const accessToken = localStorage.getItem('accessToken');
      if (accessToken) {
        try {
          const user = await authService.getCurrentUser();
          if (user) {
            const role = localStorage.getItem('userRole') || 'parent';
            if (role === 'parent') {
              navigate('/parent/dashboard');
            } else if (role === 'tutor') {
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

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters');
      setLoading(false);
      return;
    }

    if (!formData.agreeToTerms) {
      setError('Please agree to the Terms of Service');
      setLoading(false);
      return;
    }

    try {
      const registrationData = {
        name: formData.fullName,
        email: formData.email,
        password: formData.password,
        country: formData.country,
        role: 'parent'
      };

      console.log('📤 Parent Registration data:', registrationData);

      const response = await authService.register(registrationData);
      
      if (response.success) {
        setRegisteredEmail(formData.email);
        setRegistrationSuccess(true);
        setFormData({
          fullName: '',
          email: '',
          password: '',
          confirmPassword: '',
          country: 'ZA',
          agreeToTerms: false
        });
        setStep(1);
      } else {
        setError(response.error || 'Registration failed. Please try again.');
      }
    } catch (err) {
      console.error('Registration error:', err);
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Modal Component
  const Modal = ({ isOpen, onClose, title, children }) => {
    if (!isOpen) return null;

    return (
      <div className="register-modal-overlay" onClick={onClose}>
        <div className="register-modal" onClick={(e) => e.stopPropagation()}>
          <div className="register-modal-header">
            <h2>{title}</h2>
            <button onClick={onClose} className="register-modal-close">×</button>
          </div>
          <div className="register-modal-body">{children}</div>
          <div className="register-modal-footer">
            <button onClick={onClose} className="register-modal-btn">Close</button>
          </div>
        </div>
      </div>
    );
  };

  const TermsContent = () => {
    const terms = TermsOfService.getFullTerms();
    return (
      <div>
        <div className="register-modal-date">Last Updated: {TermsOfService.effectiveDate}</div>
        {terms.map((section) => (
          <div key={section.id} className="register-modal-section">
            <h3>{section.title}</h3>
            {section.content.map((paragraph, index) => <p key={index}>{paragraph}</p>)}
          </div>
        ))}
      </div>
    );
  };

  const PrivacyContent = () => {
    const privacy = PrivacyPolicy.getFullPolicy();
    return (
      <div>
        <div className="register-modal-date">Last Updated: {PrivacyPolicy.effectiveDate}</div>
        {privacy.map((section) => (
          <div key={section.id} className="register-modal-section">
            <h3>{section.title}</h3>
            {section.content.map((paragraph, index) => <p key={index}>{paragraph}</p>)}
          </div>
        ))}
      </div>
    );
  };

  // Show verification success screen
  if (registrationSuccess) {
    return (
      <div className="register-wrapper">
        <div className="register-bg">
          <div className="math-symbols">
            <span className="math-symbol">∫</span><span className="math-symbol">∑</span><span className="math-symbol">π</span><span className="math-symbol">√</span><span className="math-symbol">∞</span><span className="math-symbol">∂</span><span className="math-symbol">Δ</span><span className="math-symbol">θ</span>
          </div>
          <div className="gradient-orb orb-1"></div><div className="gradient-orb orb-2"></div><div className="gradient-orb orb-3"></div>
        </div>

        <div className="register-container">
          <div className="register-right" style={{ maxWidth: '500px', margin: '0 auto', width: '100%' }}>
            <div className="register-card verify-success-card">
              <div className="verification-success">
                <div className="success-icon">
                  <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                    <polyline points="22 4 12 14.01 9 11.01"></polyline>
                  </svg>
                </div>
                
                <h2>Verify Your Email</h2>
                <p className="verify-subtitle">
                  We've sent a verification link to <br />
                  <strong>{registeredEmail}</strong>
                </p>

                <div className="verify-note">
                  <p>🔒 Please check your inbox and click the verification link to activate your Parent Account.</p>
                </div>

                <div className="verify-resend">
                  <p>Didn't receive the email?</p>
                  <button 
                    onClick={async () => {
                      try {
                        setLoading(true);
                        await authService.resendVerification(registeredEmail);
                        alert('Verification email resent! Please check your inbox.');
                      } catch (err) {
                        alert('Failed to resend verification email. Please try again.');
                      } finally {
                        setLoading(false);
                      }
                    }}
                    disabled={loading}
                    className="resend-link"
                  >
                    {loading ? 'Sending...' : 'Resend verification email'}
                  </button>
                </div>

                <button
                  onClick={() => navigate('/parent-login')}
                  className="register-submit-btn"
                  style={{ marginTop: '24px', width: '100%' }}
                >
                  Go to Parent Login →
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="register-wrapper">
      <style>{`
        .student-register-link-container {
          text-align: center;
          margin-top: 10px;
          margin-bottom: 20px;
        }
        .student-register-text-btn {
          background: none;
          border: none;
          color: #a78bfa;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          text-decoration: underline;
          text-underline-offset: 4px;
          transition: color 0.2s ease;
          font-family: inherit;
          text-decoration: none;
        }
        .student-register-text-btn:hover {
          color: #ffffff;
        }
      `}</style>

      <div className="register-bg">
        <div className="math-symbols">
          <span className="math-symbol">∫</span><span className="math-symbol">∑</span><span className="math-symbol">π</span><span className="math-symbol">√</span><span className="math-symbol">∞</span><span className="math-symbol">∂</span><span className="math-symbol">Δ</span><span className="math-symbol">θ</span>
        </div>
        <div className="gradient-orb orb-1"></div><div className="gradient-orb orb-2"></div><div className="gradient-orb orb-3"></div>
      </div>

      <div className="register-container">
        <div className="register-left">
          <div className="brand-content">
            <div className="brand-logo">
              <span className="logo-symbol">∑</span>
              <span className="logo-text">EduSpantech</span>
            </div>
            <h1 className="brand-headline">
              Partner in your<br />
              <span className="highlight">child's success</span>
            </h1>
            <p className="brand-description">
              Monitor progress, view term reports, and manage tutoring sessions all in one place. Designed specifically for parents and guardians.
            </p>
            <div className="brand-stats">
              <div className="stat"><span className="stat-number">Live</span><span className="stat-label">Progress Tracking</span></div>
              <div className="stat-divider"></div>
              <div className="stat"><span className="stat-number">Term</span><span className="stat-label">Detailed Reports</span></div>
              <div className="stat-divider"></div>
              <div className="stat"><span className="stat-number">Easy</span><span className="stat-label">Session Booking</span></div>
            </div>
          </div>
        </div>

        <div className="register-right">
          <div className="register-card">
            <div className="register-header">
              <h2>Parent Registration</h2>
              <p>Create an account to manage your child's education</p>
              <div className="register-badge">
                <span>👨‍👩‍👧 For Parents & Guardians Only</span>
              </div>
            </div>

            <div className="student-register-link-container">
              <Link to="/register" className="student-register-text-btn">
                Registering as a Student? Sign up here
              </Link>
            </div>

            {error && (
              <div className="register-error">
                <span className="error-icon">✕</span>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="register-form">
              {step === 1 && (
                <div className="register-step">
                  <div className="form-group">
                    <label>Full Name</label>
                    <input
                      type="text"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleChange}
                      placeholder="Jane Doe"
                      required
                      disabled={loading}
                    />
                  </div>

                  <div className="form-group">
                    <label>Email Address</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="parent@email.com"
                      required
                      disabled={loading}
                    />
                  </div>

                  <div className="form-group">
                    <label>Country</label>
                    <select
                      name="country"
                      value={formData.country}
                      onChange={handleChange}
                      disabled={loading}
                    >
                      <option value="ZA">South Africa 🇿🇦</option>
                      <option value="US">United States 🇺🇸</option>
                      <option value="GB">United Kingdom 🇬🇧</option>
                      <option value="AU">Australia 🇦🇺</option>
                      <option value="SG">Singapore 🇸🇬</option>
                      <option value="JP">Japan 🇯🇵</option>
                      <option value="BR">Brazil 🇧🇷</option>
                      <option value="CA">Canada 🇨🇦</option>
                      <option value="NG">Nigeria 🇳🇬</option>
                    </select>
                  </div>

                  <button
                    type="button"
                    className="register-next-btn"
                    onClick={() => setStep(2)}
                    disabled={!formData.fullName || !formData.email}
                  >
                    Next Step →
                  </button>
                </div>
              )}

              {step === 2 && (
                <div className="register-step">
                  <div className="form-group">
                    <label>Password</label>
                    <div className="password-field">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        placeholder="Min 8 characters"
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
                    <small className="form-hint">
                      Must be at least 8 characters with letters and numbers
                    </small>
                  </div>

                  <div className="form-group">
                    <label>Confirm Password</label>
                    <div className="password-field">
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        placeholder="Confirm your password"
                        required
                        disabled={loading}
                      />
                      <button
                        type="button"
                        className="toggle-password"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      >
                        {showConfirmPassword ? '🙈' : '👁️'}
                      </button>
                    </div>
                  </div>

                  <div className="form-group checkbox-group">
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        name="agreeToTerms"
                        checked={formData.agreeToTerms}
                        onChange={handleChange}
                        disabled={loading}
                      />
                      <span className="checkmark"></span>
                      <span>
                        I agree to the{' '}
                        <span
                          className="terms-link"
                          onClick={(e) => {
                            e.preventDefault();
                            setShowTermsModal(true);
                          }}
                        >
                          Terms of Service
                        </span>
                        {' '}and{' '}
                        <span
                          className="terms-link"
                          onClick={(e) => {
                            e.preventDefault();
                            setShowPrivacyModal(true);
                          }}
                        >
                          Privacy Policy
                        </span>
                      </span>
                    </label>
                  </div>

                  <div className="register-actions">
                    <button
                      type="button"
                      className="register-back-btn"
                      onClick={() => setStep(1)}
                      disabled={loading}
                    >
                      ← Back
                    </button>
                    <button
                      type="submit"
                      className="register-submit-btn"
                      disabled={loading || !formData.agreeToTerms}
                    >
                      {loading ? (
                        <>
                          <span className="spinner"></span>
                          Creating Account...
                        </>
                      ) : (
                        'Create Account →'
                      )}
                    </button>
                  </div>
                </div>
              )}
            </form>

            <div className="register-footer">
              <p>
                Already have an account? <Link to="/parent-login">Sign in</Link>
              </p>
            </div>
          </div>
        </div>
      </div>

      <Modal isOpen={showTermsModal} onClose={() => setShowTermsModal(false)} title="Terms of Service">
        <TermsContent />
      </Modal>

      <Modal isOpen={showPrivacyModal} onClose={() => setShowPrivacyModal(false)} title="Privacy Policy">
        <PrivacyContent />
      </Modal>
    </div>
  );
};

export default ParentRegister;