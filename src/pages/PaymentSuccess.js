// src/pages/PaymentSuccess.js
import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import TermsOfService from './Terms';
import PrivacyPolicy from './Privacy';
import './PaymentSuccess.css';
import './Checkout.css'; // 👈 Import Checkout CSS to use the modal styles

const PaymentSuccess = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Extract state passed from Checkout.js
  const { reference, plan, user } = location.state || {};

  // Modal State
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);

  // If someone navigates here directly without paying, kick them back
  useEffect(() => {
    if (!reference) {
      navigate('/pricing');
    }
  }, [reference, navigate]);

  if (!reference) return null;

  // ============================================
  // MODALS (Matches Checkout.js exactly)
  // ============================================
  const TermsModal = () => {
    if (!showTermsModal) return null;
    const terms = TermsOfService.sections || [];
    const effectiveDate = TermsOfService.effectiveDate || '2026-07-09';

    return (
      <div className="checkout-modal-overlay" onClick={() => setShowTermsModal(false)}>
        <div className="checkout-modal terms-modal" onClick={(e) => e.stopPropagation()}>
          <button className="checkout-modal-close" onClick={() => setShowTermsModal(false)}>×</button>
          <h2 className="modal-title">📋 Terms of Service</h2>
          <div className="modal-scroll-content">
            <div className="last-updated">Last Updated: {effectiveDate}</div>
            {terms.map((section) => (
              <div key={section.id} className="section">
                <h3>{section.title}</h3>
                {section.content.map((paragraph, index) => <p key={index}>{paragraph}</p>)}
              </div>
            ))}
          </div>
          <button className="btn-primary modal-close-btn" onClick={() => setShowTermsModal(false)}>Close</button>
        </div>
      </div>
    );
  };

  const PrivacyModal = () => {
    if (!showPrivacyModal) return null;
    const privacy = PrivacyPolicy.sections || [];
    const effectiveDate = PrivacyPolicy.effectiveDate || '2026-07-09';

    return (
      <div className="checkout-modal-overlay" onClick={() => setShowPrivacyModal(false)}>
        <div className="checkout-modal privacy-modal" onClick={(e) => e.stopPropagation()}>
          <button className="checkout-modal-close" onClick={() => setShowPrivacyModal(false)}>×</button>
          <h2 className="modal-title">🔒 Privacy Policy</h2>
          <div className="modal-scroll-content">
            <div className="last-updated">Last Updated: {effectiveDate}</div>
            {privacy.map((section) => (
              <div key={section.id} className="section">
                <h3>{section.title}</h3>
                {section.content.map((paragraph, index) => <p key={index}>{paragraph}</p>)}
              </div>
            ))}
          </div>
          <button className="btn-primary modal-close-btn" onClick={() => setShowPrivacyModal(false)}>Close</button>
        </div>
      </div>
    );
  };

  return (
    <div className="success-page">
      <TermsModal />
      <PrivacyModal />

      <div className="success-container">
        
        {/* Main Success Card */}
        <div className="success-card">
          <div className="success-icon-wrapper">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
              <polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>
          </div>

          <h1>Payment Successful</h1>
          <p className="success-subtitle">
            Your enrollment is complete. Your account has been successfully updated to the <strong>{plan?.name || 'new'}</strong> plan.
          </p>

          {/* Receipt Box */}
          <div className="receipt-box">
            <div className="receipt-row">
              <span className="receipt-label">Student</span>
              <span className="receipt-value">{user?.email}</span>
            </div>
            <div className="receipt-row">
              <span className="receipt-label">Plan Upgraded To</span>
              <span className="receipt-value">{plan?.name || 'Subscription'}</span>
            </div>
            <div className="receipt-row">
              <span className="receipt-label">Amount Paid</span>
              <span className="receipt-value">R{plan?.price || '0.00'}{plan?.period || '/month'}</span>
            </div>
            <div className="receipt-row">
              <span className="receipt-label">Reference</span>
              <span className="receipt-value mono">{reference}</span>
            </div>
            <div className="receipt-row">
              <span className="receipt-label">Date</span>
              <span className="receipt-value">{new Date().toLocaleDateString('en-ZA', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
            </div>
          </div>

          <div className="success-actions">
            <button className="btn-primary" onClick={() => navigate('/dashboard')}>
              Go to Dashboard
            </button>
            <button className="btn-secondary" onClick={() => window.print()}>
              Print Receipt
            </button>
          </div>
        </div>

        {/* Next Steps / What to expect */}
        <div className="next-steps-card">
          <h3>What happens next?</h3>
          <ul>
            <li>
              <div className="step-icon">🔓</div>
              <div>
                <strong>Instant Access</strong>
                <p>You can now access all resources included in your {plan?.name} plan.</p>
              </div>
            </li>
            <li>
              <div className="step-icon">⏰</div>
              <div>
                <strong>Auto-Renewal</strong>
                <p>Your subscription will automatically renew on {new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('en-ZA')}. You can cancel anytime.</p>
              </div>
            </li>
            <li>
              <div className="step-icon">📧</div>
              <div>
                <strong>Confirmation Email</strong>
                <p>A receipt and confirmation have been sent to {user?.email}.</p>
              </div>
            </li>
          </ul>
        </div>

        {/* Professional Corporate Disclaimer with Modals */}
        <div className="disclaimer-section">
          <p>
            <strong>Billing Disclaimer:</strong> Your subscription will automatically renew at the end of the billing period unless cancelled. 
            You can manage or cancel your subscription at any time from your account dashboard. 
            By completing this purchase, you agree to our{' '}
            <button 
              type="button" 
              className="disclaimer-link-btn" 
              onClick={() => setShowTermsModal(true)}
            >
              Terms of Service
            </button>{' '}
            and{' '}
            <button 
              type="button" 
              className="disclaimer-link-btn" 
              onClick={() => setShowPrivacyModal(true)}
            >
              Privacy Policy
            </button>.
          </p>
          <p>
            Need help? Contact our support team at <a href="mailto:support@eduspantech.com">support@eduspantech.com</a>. 
            Please retain this email as proof of purchase.
          </p>
        </div>

      </div>
    </div>
  );
};

export default PaymentSuccess;