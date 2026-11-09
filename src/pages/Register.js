// src/pages/Register.js
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authService } from '../services/authService';
import TermsOfService from './Terms';
import PrivacyPolicy from './Privacy';
import './Register.css';

const Register = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    cohort: 'HighSchool',
    country: 'ZA',
    grade: '',
    gradeValue: '', // Store the actual integer value
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
            const role = localStorage.getItem('userRole') || 'student';
            if (role === 'tutor') {
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

  // Tutor alert text + redirect target now points to /tutors
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('type') === 'tutor') {
      alert('📚 Tutor accounts are created by the Eduspantech team. Please visit the Tutors page to apply.');
      navigate('/tutors');
    }
  }, [navigate]);

  const getGradeOptions = () => {
    if (formData.cohort === 'HighSchool') {
      return [
        { label: 'Grade 8', value: 8 },
        { label: 'Grade 9', value: 9 },
        { label: 'Grade 10', value: 10 },
        { label: 'Grade 11', value: 11 },
        { label: 'Grade 12', value: 12 }
      ];
    } else {
      return [
        { label: '1st Year', value: 1 },
        { label: '2nd Year', value: 2 }
      ];
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleGradeChange = (e) => {
    const value = e.target.value;
    const selectedGrade = getGradeOptions().find(g => g.label === value);
    setFormData({
      ...formData,
      grade: value,           // Display label
      gradeValue: selectedGrade ? selectedGrade.value : ''  // Integer value for backend
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

    if (!formData.gradeValue) {
      setError('Please select your grade');
      setLoading(false);
      return;
    }

    try {
      const registrationData = {
        name: formData.fullName,
        email: formData.email,
        password: formData.password,
        cohort: formData.cohort,
        country: formData.country,
        grade: formData.gradeValue,
        cohort_flag: formData.cohort === 'HighSchool' ? 'HighSchool' : 'UniversityFirstYear',
        role: 'student'
      };

      console.log('📤 Registration data:', registrationData);

      const response = await authService.register(registrationData);
      
      if (response.success) {
        setRegisteredEmail(formData.email);
        setRegistrationSuccess(true);
        setFormData({
          fullName: '',
          email: '',
          password: '',
          confirmPassword: '',
          cohort: 'HighSchool',
          country: 'ZA',
          grade: '',
          gradeValue: '',
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
      <div 
        className="register-modal-overlay"
        onClick={onClose}
      >
        <div 
          className="register-modal"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="register-modal-header">
            <h2>{title}</h2>
            <button 
              onClick={onClose}
              className="register-modal-close"
            >
              ×
            </button>
          </div>
          <div className="register-modal-body">
            {children}
          </div>
          <div className="register-modal-footer">
            <button 
              onClick={onClose}
              className="register-modal-btn"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Terms Content using TermsOfService data
  const TermsContent = () => {
    const terms = TermsOfService.getFullTerms();
    
    return (
      <div>
        <div className="register-modal-date">
          Last Updated: {TermsOfService.effectiveDate}
        </div>
        {terms.map((section) => (
          <div key={section.id} className="register-modal-section">
            <h3>{section.title}</h3>
            {section.content.map((paragraph, index) => (
              <p key={index}>{paragraph}</p>
            ))}
          </div>
        ))}
      </div>
    );
  };

  // Privacy Content using PrivacyPolicy data
  const PrivacyContent = () => {
    const privacy = PrivacyPolicy.getFullPolicy();
    
    return (
      <div>
        <div className="register-modal-date">
          Last Updated: {PrivacyPolicy.effectiveDate}
        </div>
        {privacy.map((section) => (
          <div key={section.id} className="register-modal-section">
            <h3>{section.title}</h3>
            {section.content.map((paragraph, index) => (
              <p key={index}>{paragraph}</p>
            ))}
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
                  <p>🔒 Please check your inbox and click the verification link to activate your account.</p>
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
                  onClick={() => navigate('/login')}
                  className="register-submit-btn"
                  style={{ marginTop: '24px', width: '100%' }}
                >
                  Go to Login →
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
      <div className="register-bg">
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

      <div className="register-container">
        <div className="register-left">
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

            <div className="tutor-note">
              <div className="tutor-note-icon">👨‍🏫</div>
              <div className="tutor-note-content">
                <h4>Are you a Tutor?</h4>
                <p>
                  Tutor accounts are created by the Eduspantech team. 
                  If you're interested in joining as a tutor, please 
                  <Link to="/tutors"> apply on our Tutors page</Link> with your qualifications.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="register-right">
          <div className="register-card">
            <div className="register-header">
              <h2>Student Registration</h2>
              <p>Join EduSpantech and start your mathematics journey</p>
              <div className="register-badge">
                <span>🎓 For Students Only</span>
              </div>
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
                      placeholder="John Doe"
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
                      placeholder="name@email.com"
                      required
                      disabled={loading}
                    />
                  </div>

                  <div className="form-group">
                    <label>Student Level</label>
                    <select
                      name="cohort"
                      value={formData.cohort}
                      onChange={handleChange}
                      disabled={loading}
                    >
                      <option value="HighSchool">High School (Grades 8-12)</option>
                      <option value="UniversityFirstYear">University (1st-2nd Year)</option>
                    </select>
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

                  <div className="form-group">
                    <label>Grade / Year</label>
                    <select
                      name="grade"
                      value={formData.grade}
                      onChange={handleGradeChange}
                      required
                      disabled={loading}
                    >
                      <option value="">Select your grade</option>
                      {getGradeOptions().map((g) => (
                        <option key={g.value} value={g.label}>
                          {g.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <button
                    type="button"
                    className="register-next-btn"
                    onClick={() => setStep(2)}
                    disabled={!formData.fullName || !formData.email || !formData.grade}
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
                Already have an account? <Link to="/login">Sign in</Link>
              </p>
            </div>
          </div>
        </div>
      </div>

      <Modal
        isOpen={showTermsModal}
        onClose={() => setShowTermsModal(false)}
        title="Terms of Service"
      >
        <TermsContent />
      </Modal>

      <Modal
        isOpen={showPrivacyModal}
        onClose={() => setShowPrivacyModal(false)}
        title="Privacy Policy"
      >
        <PrivacyContent />
      </Modal>
    </div>
  );
};

export default Register;