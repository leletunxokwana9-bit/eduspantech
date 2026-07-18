// src/pages/VerifyEmail.js
import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';
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
      setMessage('Invalid verification link');
      return;
    }

    const verify = async () => {
      try {
        const data = await authService.verifyEmail(token);
        if (data.success) {
          setStatus('success');
          setMessage('Email verified successfully! Redirecting to login...');
          setTimeout(() => navigate('/login'), 3000);
        } else {
          setStatus('error');
          setMessage(data.error || 'Verification failed');
        }
      } catch (error) {
        setStatus('error');
        setMessage(error.message || 'Something went wrong. Please try again.');
      }
    };
    
    verify();
  }, [searchParams, navigate]);

  return (
    <div className="verify-container">
      <div className="verify-card">
        {status === 'verifying' && (
          <>
            <div className="spinner"></div>
            <h2>Verifying your email...</h2>
            <p>Please wait while we confirm your email address.</p>
          </>
        )}
        {status === 'success' && (
          <>
            <div className="success-icon">✅</div>
            <h2>Email Verified!</h2>
            <p>{message}</p>
            <button onClick={() => navigate('/login')} className="verify-btn">
              Go to Login →
            </button>
          </>
        )}
        {status === 'error' && (
          <>
            <div className="error-icon">❌</div>
            <h2>Verification Failed</h2>
            <p>{message}</p>
            <button onClick={() => navigate('/login')} className="verify-btn">
              Back to Login
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default VerifyEmail; // ✅ MUST BE DEFAULT EXPORT