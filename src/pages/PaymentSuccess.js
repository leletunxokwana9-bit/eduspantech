
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

const getStoredUser = () => {
  try {
    return JSON.parse(localStorage.getItem('user') || '{}');
  } catch {
    return {};
  }
};

const updateCachedUser = (plan) => {
  try {
    const storedUser = getStoredUser();

    storedUser.subscriptionstatus = 'active';

    if (plan?.tier) {
      storedUser.subscriptiontier = plan.tier;
    }

    if (plan?.name) {
      storedUser.subscriptionplan = plan.name;
    }

    localStorage.setItem('user', JSON.stringify(storedUser));
  } catch (error) {
    console.warn('Could not update cached user details.');
  }
};

const PaymentSuccess = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const params = new URLSearchParams(location.search);

  const reference =
    location.state?.reference ||
    params.get('reference') ||
    params.get('trxref') ||
    '';

  const plan = location.state?.plan || null;

  const billingCycle =
    location.state?.billingCycle ||
    params.get('billing') ||
    'monthly';

  const [verificationStatus, setVerificationStatus] = useState('verifying');
  const [verificationError, setVerificationError] = useState('');
  const [paymentResult, setPaymentResult] = useState(null);

  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);

  // =====================================================
  // CONFIRM EXISTING PAYMENT VERIFICATION
  // =====================================================

  useEffect(() => {
    let cancelled = false;

    const confirmSubscription = async () => {
      const verification = location.state?.verification;
      const verifiedSubscription =
        location.state?.subscription ||
        verification?.subscription;

      /*
       * IMPORTANT:
       * Checkout.js already calls:
       * POST /subscriptions/verify
       *
       * If that request succeeded, the subscription has
       * already been activated by the backend.
       *
       * Do not call POST /subscriptions again here.
       */

      if (verification?.success === true && verifiedSubscription) {
        if (cancelled) return;

        const result = {
          ...verification,
          subscription: verifiedSubscription,
          plan: verification.plan || plan
        };

        setPaymentResult(result);
        setVerificationStatus('success');
        updateCachedUser(result.plan || plan);

        return;
      }

      /*
       * If the student refreshes this page, React Router
       * navigation state may no longer be available.
       *
       * In that situation, retrieve the student's existing
       * subscription using GET. This does not create another
       * subscription or process another payment.
       */

      const token = getAuthToken();

      if (!token) {
        if (cancelled) return;

        setVerificationStatus('failed');
        setVerificationError(
          'Please sign in again to check your subscription. If your payment was processed, you do not need to pay again. Contact support with your payment reference.'
        );

        return;
      }

      try {
        setVerificationStatus('verifying');
        setVerificationError('');

        const response = await fetch(
          `${API_BASE_URL}/subscriptions`,
          {
            method: 'GET',
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error('Unable to retrieve your subscription.');
        }

        const existingSubscription =
          data.subscription ||
          (Array.isArray(data.subscriptions)
            ? data.subscriptions.find(
                (item) =>
                  String(item.status || '').toLowerCase() === 'active'
              )
            : null);

        const isActive =
          existingSubscription &&
          String(existingSubscription.status || '').toLowerCase() ===
            'active';

        if (!isActive) {
          throw new Error(
            'Your subscription has not yet been confirmed. If you have already paid, please contact support before making another payment.'
          );
        }

        if (cancelled) return;

        const result = {
          success: true,
          subscription: existingSubscription,
          plan: plan || data.plan || null,
          payment: data.payment || null
        };

        setPaymentResult(result);
        setVerificationStatus('success');
        updateCachedUser(result.plan || plan);
      } catch (error) {
        console.error(
          'Could not retrieve the existing subscription:',
          error
        );

        if (cancelled) return;

        setVerificationStatus('failed');
        setVerificationError(
          'We could not retrieve your subscription details right now. If you have already paid, please do not pay again. Keep your payment reference and contact our support team.'
        );
      }
    };

    confirmSubscription();

    return () => {
      cancelled = true;
    };
  }, [location.state, plan]);

  // =====================================================
  // RECEIPT DETAILS
  // =====================================================

  const confirmedPlan =
    paymentResult?.plan ||
    plan ||
    {};

  const confirmedSubscription =
    paymentResult?.subscription ||
    location.state?.subscription ||
    {};

  const confirmedPayment =
    paymentResult?.payment ||
    {};

  const confirmedAmount =
    confirmedPayment.amount ??
    confirmedSubscription.amount ??
    confirmedPlan.monthly_price ??
    confirmedPlan.price ??
    0;

  const confirmedCurrency =
    confirmedPayment.currency ||
    confirmedSubscription.currency ||
    confirmedPlan.currency ||
    'ZAR';

  const student = getStoredUser();

  const studentEmail =
    confirmedPayment.email ||
    student.email ||
    'Signed-in student';

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

  const formattedEndDate = confirmedSubscription.end_date
    ? new Date(confirmedSubscription.end_date).toLocaleDateString(
        'en-ZA',
        {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        }
      )
    : 'Not specified';

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

          <h2 className="modal-title">
            📋 Terms of Service
          </h2>

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

          <h2 className="modal-title">
            🔒 Privacy Policy
          </h2>

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

            <h1>Checking Your Subscription</h1>

            <p className="success-subtitle">
              Please wait while we retrieve your payment and
              subscription details.
            </p>

            {reference && (
              <div className="receipt-box">
                <div className="receipt-row">
                  <span className="receipt-label">
                    Payment Reference
                  </span>

                  <span className="receipt-value mono">
                    {reference}
                  </span>
                </div>

                <div className="receipt-row">
                  <span className="receipt-label">
                    Status
                  </span>

                  <span className="receipt-value">
                    Checking subscription...
                  </span>
                </div>
              </div>
            )}

            <p className="success-subtitle">
              Please do not make another payment while we check
              your subscription.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // =====================================================
  // PAYMENT NOT CONFIRMED
  // =====================================================

  if (verificationStatus === 'failed') {
    return (
      <div className="success-page">
        <div className="success-container">
          <div className="success-card">
            <div className="payment-failed-icon">
              !
            </div>

            <h1>We're Checking Your Payment</h1>

            <p className="success-subtitle">
              We haven't been able to retrieve your subscription
              details yet. This does not necessarily mean your
              payment was unsuccessful.
            </p>

            <div className="receipt-box">
              <div className="receipt-row">
                <span className="receipt-label">
                  Payment Reference
                </span>

                <span className="receipt-value mono">
                  {reference || 'Not available'}
                </span>
              </div>

              <div className="receipt-row">
                <span className="receipt-label">
                  Status
                </span>

                <span className="receipt-value">
                  Awaiting confirmation
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
                Check Again
              </button>

              <button
                className="btn-secondary"
                onClick={() => navigate('/dashboard')}
              >
                Go to Dashboard
              </button>
            </div>

            <p className="success-subtitle">
              <strong>
                Please do not pay again if you have already
                completed your payment.
              </strong>
              {' '}If you need assistance, contact
              {' '}
              <a href="mailto:support@eduspantech.com">
                support@eduspantech.com
              </a>
              {' '}and provide your payment reference.
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
            Your payment has been verified and your
            <strong>
              {' '}
              {confirmedPlan.name ||
                confirmedPlan.tier ||
                'subscription'}
            </strong>
            {' '}subscription is now active.
          </p>

          <div className="receipt-box">
            <div className="receipt-row">
              <span className="receipt-label">
                Student
              </span>

              <span className="receipt-value">
                {studentEmail}
              </span>
            </div>

            <div className="receipt-row">
              <span className="receipt-label">
                Plan
              </span>

              <span className="receipt-value">
                {confirmedPlan.name ||
                  confirmedPlan.tier ||
                  'Active subscription'}
              </span>
            </div>

            <div className="receipt-row">
              <span className="receipt-label">
                Amount Paid
              </span>

              <span className="receipt-value">
                {confirmedPayment.amount != null
                  ? formatAmount(
                      confirmedPayment.amount,
                      confirmedCurrency
                    )
                  : confirmedSubscription.amount != null
                    ? formatAmount(
                        confirmedSubscription.amount,
                        confirmedCurrency
                      )
                    : confirmedPlan.monthly_price != null ||
                      confirmedPlan.price != null
                      ? formatAmount(
                          confirmedPlan.monthly_price ??
                            confirmedPlan.price,
                          confirmedCurrency
                        )
                      : 'See payment confirmation'}
              </span>
            </div>

            <div className="receipt-row">
              <span className="receipt-label">
                Billing Cycle
              </span>

              <span className="receipt-value">
                {confirmedSubscription.billing_cycle ||
                  billingCycle}
              </span>
            </div>

            <div className="receipt-row">
              <span className="receipt-label">
                Payment Method
              </span>

              <span className="receipt-value">
                Paystack
              </span>
            </div>

            <div className="receipt-row">
              <span className="receipt-label">
                Reference
              </span>

              <span className="receipt-value mono">
                {reference || 'See your Paystack receipt'}
              </span>
            </div>

            <div className="receipt-row">
              <span className="receipt-label">
                Subscription Ends
              </span>

              <span className="receipt-value">
                {formattedEndDate}
              </span>
            </div>

            <div className="receipt-row">
              <span className="receipt-label">
                Auto-Renewal
              </span>

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
                  Your account has been updated and your
                  purchased plan is now active.
                </p>
              </div>
            </li>

            <li>
              <div className="step-icon">📅</div>

              <div>
                <strong>Subscription Period</strong>

                <p>
                  Your subscription remains active until the
                  end date shown on your receipt.
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
            <strong>Billing Disclaimer:</strong> Your payment
            verification was successful and your subscription
            is active. Automatic recurring billing is not
            enabled for this payment.
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
            {' '}Please retain your payment reference.
          </p>
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccess;
