// src/pages/VerifyEmail.js
import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';
import logo from '../assets/favicon-96x96.png'; // 👈 Import the logo
import './VerifyEmail.css';

const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('verifying');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const token = searchParams.get('token');
    if (!token) {
      setStatus('error');
      setMessage('Invalid or missing verification token. Please check your link.');
      return;
    }

    const verify = async () => {
      try {
        const data = await authService.verifyEmail(token);
        if (data.success) {
          setStatus('success');
          setMessage('Your email has been verified successfully. You can now access your account.');
          // 🚨 REMOVED the setTimeout auto-redirect. The user must click the button.
        } else {
          setStatus('error');
          setMessage(data.error || 'Verification failed. The link may have expired.');
        }
      } catch (error) {
        setStatus('error');
        setMessage(error.message || 'Something went wrong. Please try again.');
      }
    };
    
    verify();
  }, [searchParams, navigate]);

  return (
    <div className="verify-page">
      <div className="verify-bg">
        <div className="gradient-orb orb-1"></div>
        <div className="gradient-orb orb-2"></div>
      </div>

      <div className="verify-container">
        {/* ✅ Replaced Sigma with the EduSpantech Logo */}
        <div className="verify-brand">
          <img src={logo} alt="EduSpantech Logo" className="verify-logo-img" />
          <span className="verify-logo-text">EduSpantech</span>
        </div>

        <div className="verify-card">
          {status === 'verifying' && (
            <div className="verify-state">
              <div className="spinner"></div>
              <h2>Verifying your email...</h2>
              <p>Please wait while we confirm your email address.</p>
            </div>
          )}

          {status === 'success' && (
            <div className="verify-state">
              <div className="success-icon">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                  <polyline points="22 4 12 14.01 9 11.01"></polyline>
                </svg>
              </div>
              <h2>Email Verified!</h2>
              <p>{message}</p>
              
              {/* User must click this to leave the page */}
              <button onClick={() => navigate('/login')} className="verify-btn">
                Go to Login →
              </button>
            </div>
          )}

          {status === 'error' && (
            <div className="verify-state">
              <div className="error-icon">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" y1="8" x2="12" y2="12"></line>
                  <line x1="12" y1="16" x2="12.01" y2="16"></line>
                </svg>
              </div>
              <h2>Verification Failed</h2>
              <p>{message}</p>
              <button onClick={() => navigate('/login')} className="verify-btn">
                Back to Login
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VerifyEmail;