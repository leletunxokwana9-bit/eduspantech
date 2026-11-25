
// src/pages/PaymentSuccess.js

import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { API_BASE_URL } from '../services/api';
import TermsOfService from './Terms';
import PrivacyPolicy from './Privacy';
import './PaymentSuccess.css';
import './Checkout.css';

const getAuthToken = () =>
  localStorage.getItem('accessToken') ||
  localStorage.getItem('token') ||
  localStorage.getItem('authToken');

const PaymentSuccess = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const params = new URLSearchParams(location.search);

  const reference =
    location.state?.reference ||
    params.get('reference') ||
    params.get('trxref');

  const plan =
    location.state?.plan ||
    null;

  const planId =
    plan?.id ||
    params.get('planId');

  const billingCycle =
    location.state?.billingCycle ||
    params.get('billing') ||
    'monthly';

  const [verificationStatus, setVerificationStatus] = useState('verifying');
  const [verificationError, setVerificationError] = useState('');
  const [paymentResult, setPaymentResult] = useState(null);

  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const verifyPayment = async () => {
      if (!reference || !planId) {
        setVerificationStatus('failed');
        setVerificationError(
          'The payment reference or selected plan is missing. Please contact support before attempting another payment.'
        );
        return;
      }

      const token = getAuthToken();

      if (!token) {
        setVerificationStatus('failed');
        setVerificationError(
          'Your login session has expired. Please sign in and contact support with your payment reference.'
        );
        return;
      }

      try {
        setVerificationStatus('verifying');
        setVerificationError('');

        const response = await fetch(`${API_BASE_URL}/subscriptions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            reference,
            planId,
            billingCycle
          })
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(
            data.error || 'We could not verify your payment.'
          );
        }

        if (cancelled) return;

        setPaymentResult(data);
        setVerificationStatus('success');

        // Update cached user details where possible.
        const storedUser = localStorage.getItem('user');

        if (storedUser) {
          try {
            const parsedUser = JSON.parse(storedUser);

            parsedUser.subscriptiontier =
              data.plan?.tier || parsedUser.subscriptiontier;

            parsedUser.subscriptionstatus = 'active';

            localStorage.setItem('user', JSON.stringify(parsedUser));
          } catch (error) {
            console.warn('Could not update cached user:', error);
          }
        }

      } catch (error) {
        console.error('Payment verification error:', error);

        if (!cancelled) {
          setVerificationStatus('failed');
          setVerificationError(error.message);
        }
      }
    };

    verifyPayment();

    return () => {
      cancelled = true;
    };
  }, [reference, planId, billingCycle]);

  const confirmedPlan =
    paymentResult?.plan || plan || {};

  const confirmedSubscription =
    paymentResult?.subscription || {};

  const confirmedAmount =
    paymentResult?.payment?.amount ??
    confirmedSubscription.amount ??
    confirmedPlan.monthly_price ??
    confirmedPlan.price ??
    0;

  const confirmedCurrency =
    paymentResult?.payment?.currency ||
    confirmedSubscription.currency ||
    confirmedPlan.currency ||
    'ZAR';

  const formatAmount = (amount, currency) => {
    try {
      return new Intl.NumberFormat('en-ZA', {
        style: 'currency',
        currency: currency || 'ZAR'
      }).format(Number(amount || 0));
    } catch {
      return `${currency || 'ZAR'} ${Number(amount || 0).toFixed(2)}`;
    }
  };

  // =====================================================
  // TERMS MODAL
  // =====================================================

  const TermsModal = () => {
    if (!showTermsModal) return null;

    const terms = TermsOfService.sections || [];
    const effectiveDate =
      TermsOfService.effectiveDate || '2026-07-09';

    return (
      <div
        className="checkout-modal-overlay"
        onClick={() => setShowTermsModal(false)}
      >
        <div
          className="checkout-modal terms-modal"
          onClick={(event) => event.stopPropagation()}
        >
          <button
            className="checkout-modal-close"
            onClick={() => setShowTermsModal(false)}
          >
            ×
          </button>

          <h2 className="modal-title">📋 Terms of Service</h2>

          <div className="modal-scroll-content">
            <div className="last-updated">
              Last Updated: {effectiveDate}
            </div>

            {terms.map((section) => (
              <div key={section.id} className="section">
                <h3>{section.title}</h3>

                {section.content.map((paragraph, index) => (
                  <p key={index}>{paragraph}</p>
                ))}
              </div>
            ))}
          </div>

          <button
            className="btn-primary modal-close-btn"
            onClick={() => setShowTermsModal(false)}
          >
            Close
          </button>
        </div>
      </div>
    );
  };

  // =====================================================
  // PRIVACY MODAL
  // =====================================================

  const PrivacyModal = () => {
    if (!showPrivacyModal) return null;

    const privacy = PrivacyPolicy.sections || [];
    const effectiveDate =
      PrivacyPolicy.effectiveDate || '2026-07-09';

    return (
      <div
        className="checkout-modal-overlay"
        onClick={() => setShowPrivacyModal(false)}
      >
        <div
          className="checkout-modal privacy-modal"
          onClick={(event) => event.stopPropagation()}
        >
          <button
            className="checkout-modal-close"
            onClick={() => setShowPrivacyModal(false)}
          >
            ×
          </button>

          <h2 className="modal-title">🔒 Privacy Policy</h2>

          <div className="modal-scroll-content">
            <div className="last-updated">
              Last Updated: {effectiveDate}
            </div>

            {privacy.map((section) => (
              <div key={section.id} className="section">
                <h3>{section.title}</h3>

                {section.content.map((paragraph, index) => (
                  <p key={index}>{paragraph}</p>
                ))}
              </div>
            ))}
          </div>

          <button
            className="btn-primary modal-close-btn"
            onClick={() => setShowPrivacyModal(false)}
          >
            Close
          </button>
        </div>
      </div>
    );
  };

  // =====================================================
  // VERIFYING STATE
  // =====================================================

  if (verificationStatus === 'verifying') {
    return (
      <div className="success-page">
        <div className="success-container">
          <div className="success-card">
            <div className="success-icon-wrapper">
              <div className="payment-verification-spinner" />
            </div>

            <h1>Verifying Your Payment</h1>

            <p className="success-subtitle">
              Please wait while we securely verify your transaction
              with Paystack and activate your subscription.
            </p>

            <div className="receipt-box">
              <div className="receipt-row">
                <span className="receipt-label">Reference</span>
                <span className="receipt-value mono">
                  {reference}
                </span>
              </div>

              <div className="receipt-row">
                <span className="receipt-label">Status</span>
                <span className="receipt-value">
                  Verifying transaction...
                </span>
              </div>
            </div>

            <p className="success-subtitle">
              Do not close this page while verification is in progress.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // =====================================================
  // FAILED VERIFICATION
  // =====================================================

  if (verificationStatus === 'failed') {
    return (
      <div className="success-page">
        <div className="success-container">
          <div className="success-card">
            <div className="payment-failed-icon">
              !
            </div>

            <h1>Payment Not Yet Confirmed</h1>

            <p className="success-subtitle">
              We could not confirm and activate your subscription.
              This does not necessarily mean that Paystack did not
              receive your payment.
            </p>

            <div className="receipt-box">
              <div className="receipt-row">
                <span className="receipt-label">Reference</span>
                <span className="receipt-value mono">
                  {reference || 'Unavailable'}
                </span>
              </div>

              <div className="receipt-row">
                <span className="receipt-label">Verification</span>
                <span className="receipt-value">
                  Not confirmed
                </span>
              </div>
            </div>

            <p className="payment-verification-error">
              {verificationError}
            </p>

            <div className="success-actions">
              <button
                className="btn-primary"
                onClick={() => window.location.reload()}
              >
                Retry Verification
              </button>

              <button
                className="btn-secondary"
                onClick={() => navigate('/dashboard')}
              >
                Go to Dashboard
              </button>
            </div>

            <p className="success-subtitle">
              If you were charged, do not pay again before contacting
              support with your reference number.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // =====================================================
  // SUCCESS MODALS
  // =====================================================

  return (
    <div className="success-page">
      <TermsModal />
      <PrivacyModal />

      <div className="success-container">

        <div className="success-card">
          <div className="success-icon-wrapper">
            <svg
              width="48"
              height="48"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          </div>

          <h1>Payment Successful</h1>

          <p className="success-subtitle">
            Your payment has been verified by Paystack and your
            <strong>
              {' '}{confirmedPlan.name || confirmedPlan.tier || 'subscription'}
            </strong>
            {' '}subscription is now active.
          </p>

          <div className="receipt-box">

            <div className="receipt-row">
              <span className="receipt-label">Student</span>
              <span className="receipt-value">
                {paymentResult?.payment?.email ||
                  localStorage.getItem('user') &&
                  JSON.parse(localStorage.getItem('user')).email ||
                  'Signed-in student'}
              </span>
            </div>

            <div className="receipt-row">
              <span className="receipt-label">Plan</span>
              <span className="receipt-value">
                {confirmedPlan.name || confirmedPlan.tier}
              </span>
            </div>

            <div className="receipt-row">
              <span className="receipt-label">Amount Paid</span>
              <span className="receipt-value">
                {formatAmount(confirmedAmount, confirmedCurrency)}
              </span>
            </div>

            <div className="receipt-row">
              <span className="receipt-label">Billing Cycle</span>
              <span className="receipt-value">
                {confirmedSubscription.billing_cycle || billingCycle}
              </span>
            </div>

            <div className="receipt-row">
              <span className="receipt-label">Payment Method</span>
              <span className="receipt-value">
                Paystack
              </span>
            </div>

            <div className="receipt-row">
              <span className="receipt-label">Reference</span>
              <span className="receipt-value mono">
                {reference}
              </span>
            </div>

            <div className="receipt-row">
              <span className="receipt-label">Subscription Ends</span>
              <span className="receipt-value">
                {confirmedSubscription.end_date
                  ? new Date(
                      confirmedSubscription.end_date
                    ).toLocaleDateString('en-ZA', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })
                  : 'Not specified'}
              </span>
            </div>

            <div className="receipt-row">
              <span className="receipt-label">Auto-Renewal</span>
              <span className="receipt-value">
                Not enabled
              </span>
            </div>

          </div>

          <div className="success-actions">
            <button
              className="btn-primary"
              onClick={() => navigate('/dashboard')}
            >
              Go to Dashboard
            </button>

            <button
              className="btn-secondary"
              onClick={() => window.print()}
            >
              Print Receipt
            </button>
          </div>
        </div>

        <div className="next-steps-card">
          <h3>What happens next?</h3>

          <ul>
            <li>
              <div className="step-icon">🔓</div>
              <div>
                <strong>Instant Access</strong>
                <p>
                  Your account has been updated and your purchased
                  plan is now active.
                </p>
              </div>
            </li>

            <li>
              <div className="step-icon">📅</div>
              <div>
                <strong>Subscription Period</strong>
                <p>
                  Your subscription remains active until the end
                  date shown on your receipt.
                </p>
              </div>
            </li>

            <li>
              <div className="step-icon">💳</div>
              <div>
                <strong>Future Payments</strong>
                <p>
                  Automatic renewal is not enabled for this
                  transaction. You can renew your plan before
                  it expires.
                </p>
              </div>
            </li>
          </ul>
        </div>

        <div className="disclaimer-section">
          <p>
            <strong>Billing Disclaimer:</strong> This transaction
            has been verified and your subscription activated.
            Automatic recurring billing is not enabled for this
            payment.
            {' '}Please review our{' '}
            <button
              type="button"
              className="disclaimer-link-btn"
              onClick={() => setShowTermsModal(true)}
            >
              Terms of Service
            </button>
            {' '}and{' '}
            <button
              type="button"
              className="disclaimer-link-btn"
              onClick={() => setShowPrivacyModal(true)}
            >
              Privacy Policy
            </button>.
          </p>

          <p>
            Need help? Contact our support team at{' '}
            <a href="mailto:support@eduspantech.com">
              support@eduspantech.com
            </a>.
            Please retain your payment reference.
          </p>
        </div>

      </div>
    </div>
  );
};

export default PaymentSuccess;
