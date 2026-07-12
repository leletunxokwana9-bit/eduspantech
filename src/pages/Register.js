import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
    agreeToTerms: false
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState(1);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);

  // Check if user is already logged in
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
          console.log('Token invalid, staying on register page');
        }
      }
    };
    checkAuth();
  }, [navigate]);

  const getGradeOptions = () => {
    if (formData.cohort === 'HighSchool') {
      return ['Grade 8', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12'];
    } else {
      return ['1st Year', '2nd Year'];
    }
  };

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
        cohort: formData.cohort,
        country: formData.country,
        grade: formData.grade,
        cohort_flag: formData.cohort === 'HighSchool' ? 'HighSchool' : 'UniversityFirstYear'
      };

      console.log('Registration Data:', registrationData);
      const response = await authService.register(registrationData);
      console.log('Registration response:', response);
      
      if (response.success) {
        navigate('/dashboard');
      } else {
        setError('Registration failed. Please try again.');
      }
    } catch (err) {
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
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999
        }}
        onClick={onClose}
      >
        <div 
          style={{
            background: 'white',
            borderRadius: '16px',
            maxWidth: '700px',
            width: '90%',
            maxHeight: '85vh',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
            overflow: 'hidden'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '20px 24px',
            borderBottom: '1px solid #f1f3f5',
            flexShrink: 0
          }}>
            <h2 style={{ fontSize: '20px', fontWeight: 700, margin: 0, color: '#1a1a2e' }}>{title}</h2>
            <button 
              onClick={onClose}
              style={{
                background: '#f3f4f6',
                border: 'none',
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                fontSize: '24px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#6b7280'
              }}
            >
              ×
            </button>
          </div>
          <div style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>
            {children}
          </div>
          <div style={{
            padding: '16px 24px',
            borderTop: '1px solid #f1f3f5',
            display: 'flex',
            justifyContent: 'flex-end',
            flexShrink: 0
          }}>
            <button 
              onClick={onClose}
              style={{
                padding: '10px 28px',
                background: '#4f46e5',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
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
        <div style={{ 
          fontSize: '13px', 
          color: '#6b7280', 
          marginBottom: '20px', 
          paddingBottom: '12px', 
          borderBottom: '1px solid #f3f4f6' 
        }}>
          Last Updated: {TermsOfService.effectiveDate}
        </div>
        {terms.map((section) => (
          <div key={section.id} style={{ marginBottom: '24px' }}>
            <h2 style={{ 
              fontSize: '18px', 
              fontWeight: 700, 
              color: '#1a1a2e', 
              margin: '0 0 10px 0' 
            }}>
              {section.title}
            </h2>
            {section.content.map((paragraph, index) => (
              <p key={index} style={{ 
                fontSize: '14px', 
                lineHeight: '1.7', 
                color: '#374151', 
                marginBottom: '8px' 
              }}>
                {paragraph}
              </p>
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
        <div style={{ 
          fontSize: '13px', 
          color: '#6b7280', 
          marginBottom: '20px', 
          paddingBottom: '12px', 
          borderBottom: '1px solid #f3f4f6' 
        }}>
          Last Updated: {PrivacyPolicy.effectiveDate}
        </div>
        {privacy.map((section) => (
          <div key={section.id} style={{ marginBottom: '24px' }}>
            <h2 style={{ 
              fontSize: '18px', 
              fontWeight: 700, 
              color: '#1a1a2e', 
              margin: '0 0 10px 0' 
            }}>
              {section.title}
            </h2>
            {section.content.map((paragraph, index) => (
              <p key={index} style={{ 
                fontSize: '14px', 
                lineHeight: '1.7', 
                color: '#374151', 
                marginBottom: '8px' 
              }}>
                {paragraph}
              </p>
            ))}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="register-container">
      <div className="register-card">
        <div className="register-header">
          <h2>📝 Create Account</h2>
          <p className="register-subtitle">
            Join EduSpantech and start your mathematics journey
          </p>
          <div className="register-steps">
            <span className={`step-indicator ${step >= 1 ? 'active' : ''}`}>1</span>
            <span className="step-line"></span>
            <span className={`step-indicator ${step >= 2 ? 'active' : ''}`}>2</span>
          </div>
        </div>

        {error && <div className="register-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          {step === 1 && (
            <div className="register-step">
              <div className="form-group">
                <label>Full Name *</label>
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  placeholder="e.g. John Doe"
                  required
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <label>Email Address *</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="your@email.com"
                  required
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <label>Student Level *</label>
                <select
                  name="cohort"
                  value={formData.cohort}
                  onChange={handleChange}
                  disabled={loading}
                >
                  <option value="HighSchool">High School (Grades 8-12)</option>
                  <option value="UniversityFirstYear">University (1st-2nd Year)</option>
                </select>
                <small className="form-hint">
                  {formData.cohort === 'HighSchool' 
                    ? 'For students in Grade 8 through Matric' 
                    : 'For first and second year university students'}
                </small>
              </div>

              <div className="form-group">
                <label>Country *</label>
                <select
                  name="country"
                  value={formData.country}
                  onChange={handleChange}
                  disabled={loading}
                >
                  <option value="ZA">South Africa 🇿🇦</option>
                  <option value="US">USA 🇺🇸</option>
                  <option value="GB">UK 🇬🇧</option>
                  <option value="AU">Australia 🇦🇺</option>
                  <option value="SG">Singapore 🇸🇬</option>
                  <option value="JP">Japan 🇯🇵</option>
                  <option value="BR">Brazil 🇧🇷</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="form-group">
                <label>Grade/Year *</label>
                <select
                  name="grade"
                  value={formData.grade}
                  onChange={handleChange}
                  required
                  disabled={loading}
                >
                  <option value="">Select your grade</option>
                  {getGradeOptions().map((g) => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
              </div>

              <button
                type="button"
                className="register-next-btn"
                onClick={() => setStep(2)}
                disabled={!formData.fullName || !formData.email || !formData.grade}
              >
                Next →
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="register-step">
              <div className="form-group">
                <label>Password *</label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Min 8 characters"
                  required
                  disabled={loading}
                />
                <small className="form-hint">
                  Must be at least 8 characters with letters and numbers
                </small>
              </div>

              <div className="form-group">
                <label>Confirm Password *</label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Confirm your password"
                  required
                  disabled={loading}
                />
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
                  {loading ? 'Creating Account...' : 'Create Account →'}
                </button>
              </div>
            </div>
          )}
        </form>

        <p className="register-login-link">
          Already have an account? <a href="/login">Login here</a>
        </p>
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