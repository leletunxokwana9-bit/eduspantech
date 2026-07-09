import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './PaymentSuccess.css';

const PaymentSuccess = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { plan, user, transaction, subscription } = location.state || {};

  useEffect(() => {
    if (!plan || !user) {
      navigate('/pricing');
    }
  }, [plan, user, navigate]);

  if (!plan || !user) return null;

  const getTierFeatures = () => {
    const tier = plan.tier?.toLowerCase() || '';
    const features = {
      silver: [
        'On-demand whiteboard playback archives',
        'Step-by-step mathematical proofs',
        'Static notes and resources',
        '24/7 Access to recorded lessons'
      ],
      gold: [
        'Live drop-in evening homework clinics (16:00-23:00 Local Time)',
        'Real-time interactive whiteboard',
        'South African tutor shifts',
        '24/7 Access to recorded lessons',
        'Homework help from expert tutors'
      ],
      platinum: [
        'All Gold features',
        'Weekend clinic access (Sat 08:00-14:00, Sun 16:00-23:00)',
        'Queue-bypass privileges during high-volume test weeks',
        'Priority access to tutors',
        'Advanced analytics and insights'
      ]
    };
    return features[tier] || features.gold;
  };

  const features = getTierFeatures();

  return (
    <div className="payment-success-page">
      <div className="payment-success-container">
        <div className="success-icon">
          <div className="success-circle">
            <span className="success-check">✓</span>
          </div>
        </div>

        <h1 className="success-title">Payment Successful! 🎉</h1>
        <p className="success-subtitle">
          Your enrollment is complete. Welcome to EduSpantech!
        </p>

        {transaction && (
          <div className="success-transaction">
            <span className="transaction-label">Transaction ID:</span>
            <span className="transaction-id">{transaction}</span>
          </div>
        )}

        <div className="success-user-info">
          <div className="info-row">
            <span className="info-label">Student</span>
            <span className="info-value">{user.name}</span>
          </div>
          <div className="info-row">
            <span className="info-label">Email</span>
            <span className="info-value">{user.email}</span>
          </div>
          <div className="info-row">
            <span className="info-label">Plan</span>
            <span className="info-value plan-badge">{plan.name}</span>
          </div>
          <div className="info-row">
            <span className="info-label">Price</span>
            <span className="info-value">{plan.price}{plan.period}</span>
          </div>
          <div className="info-row">
            <span className="info-label">Cohort</span>
            <span className="info-value">{user.cohort || 'HighSchool'}</span>
          </div>
          {subscription && (
            <div className="info-row">
              <span className="info-label">Subscription</span>
              <span className="info-value">{subscription}</span>
            </div>
          )}
        </div>

        <div className="success-features">
          <h3>What's Included:</h3>
          <ul>
            {features.map((feature, index) => (
              <li key={index}>
                <span className="feature-check">✓</span>
                {feature}
              </li>
            ))}
          </ul>
        </div>

        <div className="success-next-steps">
          <h3>Next Steps:</h3>
          <ol>
            <li>
              <strong>Check your email</strong> - We've sent you a confirmation with login details
            </li>
            <li>
              <strong>Access your dashboard</strong> - Start learning immediately
            </li>
            <li>
              <strong>Book a session</strong> - Schedule your first live tutoring session
            </li>
          </ol>
        </div>

        <div className="success-notes">
          <div className="note-item">
            <span className="note-icon">📧</span>
            <div>
              <strong>Confirmation Email Sent</strong>
              <p>Check your inbox for login credentials and next steps</p>
            </div>
          </div>
          <div className="note-item">
            <span className="note-icon">🔒</span>
            <div>
              <strong>Secure & Encrypted</strong>
              <p>Your data is protected with AES-256 encryption</p>
            </div>
          </div>
          <div className="note-item">
            <span className="note-icon">🔄</span>
            <div>
              <strong>Auto-Renewal Active</strong>
              <p>Your subscription will renew automatically each month</p>
            </div>
          </div>
          <div className="note-item">
            <span className="note-icon">⏰</span>
            <div>
              <strong>72-Hour Refund Window</strong>
              <p>Refund requests must be filed within 72 hours with zero usage</p>
            </div>
          </div>
        </div>

        <div className="success-actions">
          <button
            className="btn-dashboard"
            onClick={() => navigate('/dashboard')}
          >
            Go to Dashboard →
          </button>
          <button
            className="btn-session"
            onClick={() => navigate('/tutors')}
          >
            Book a Session
          </button>
        </div>

        <div className="success-footer">
          <p>© 2026 EduSpantech - Education for the love of your life ❤️</p>
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccess;