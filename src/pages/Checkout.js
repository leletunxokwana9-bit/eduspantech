
// src/pages/Checkout.js
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../services/supabaseClient';
import TermsOfService from './Terms';
import PrivacyPolicy from './Privacy';
import './Checkout.css';

const API_BASE_URL = (process.env.REACT_APP_API_URL || '').replace(/\/$/, '');

const PAYSTACK_SCRIPT_URL = 'https://js.paystack.co/v1/inline.js';

const loadPaystackScript = () => {
  return new Promise((resolve, reject) => {
    if (window.PaystackPop) {
      resolve();
      return;
    }

    const existingScript = document.querySelector(
      `script[src="${PAYSTACK_SCRIPT_URL}"]`
    );

    if (existingScript) {
      existingScript.addEventListener('load', resolve, { once: true });
      existingScript.addEventListener('error', reject, { once: true });
      return;
    }

    const script = document.createElement('script');
    script.src = PAYSTACK_SCRIPT_URL;
    script.async = true;

    script.onload = resolve;
    script.onerror = reject;

    document.body.appendChild(script);
  });
};

const Checkout = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // 1. Selected plan
  const [selectedPlan, setSelectedPlan] = useState(
    location.state?.plan || null
  );

  const [loadingPlan, setLoadingPlan] = useState(
    !location.state?.plan
  );

  // 2. Account and gateway configuration
  const [accountInfo, setAccountInfo] = useState({
    companyName: 'EduSpantech',
    supportEmail: 'support@eduspantech.com'
  });

  const [gatewayConfig, setGatewayConfig] = useState({
    publicKey: '',
    currency: 'ZAR'
  });

  const [gatewayLoading, setGatewayLoading] = useState(true);

  // 3. Payment state
  const [processing, setProcessing] = useState(false);

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    country: 'ZA',
    agreeToTerms: false
  });

  // 4. Modal state
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [showAlertModal, setShowAlertModal] = useState(false);

  const [alertTitle, setAlertTitle] = useState('');
  const [alertMessage, setAlertMessage] = useState('');

  // ============================================
  // AUTHENTICATION
  // ============================================

  const getAccessToken = () => {
    return localStorage.getItem('accessToken');
  };

  // ============================================
  // FETCH EXACT PLAN
  // ============================================

  useEffect(() => {
    let mounted = true;

    const fetchPlanIfRefreshed = async () => {
      if (location.state?.plan?.id) {
        setSelectedPlan(location.state.plan);
        setLoadingPlan(false);
        return;
      }

      const params = new URLSearchParams(location.search);

      const planTier = params.get('plan');
      const audience = params.get('audience') || 'school';

      if (!planTier) {
        if (mounted) {
          setSelectedPlan(null);
          setLoadingPlan(false);
        }
        return;
      }

      try {
        let query = supabase
          .from('pricing_plans')
          .select('*')
          .ilike('tier', planTier);

        if (audience) {
          query = query.eq('audience', audience);
        }

        const { data, error } = await query.maybeSingle();

        if (error) {
          console.error('Plan lookup error:', error);
          throw error;
        }

        if (mounted) {
          setSelectedPlan(data || null);
        }
      } catch (error) {
        console.error('Could not retrieve selected plan:', error);

        if (mounted) {
          setSelectedPlan(null);
        }
      } finally {
        if (mounted) {
          setLoadingPlan(false);
        }
      }
    };

    fetchPlanIfRefreshed();

    return () => {
      mounted = false;
    };
  }, [location.state, location.search]);

  // ============================================
  // FETCH ACCOUNT AND PAYSTACK CONFIGURATION
  // ============================================

  useEffect(() => {
    let mounted = true;

    const fetchData = async () => {
      try {
        const { data: accountData, error: accountError } = await supabase
          .from('account_settings')
          .select('key, value');

        if (accountError) {
          console.warn('Account settings could not be loaded:', accountError);
        }

        if (accountData && mounted) {
          const config = {};

          accountData.forEach((item) => {
            config[item.key] = item.value;
          });

          setAccountInfo((previous) => ({
            ...previous,
            ...config
          }));
        }

        const { data: gatewayData, error: gatewayError } = await supabase
          .from('payment_gateways')
          .select('*')
          .eq('name', 'paystack')
          .eq('is_active', true)
          .maybeSingle();

        if (gatewayError) {
          console.error('Paystack configuration error:', gatewayError);
          throw gatewayError;
        }

        if (!gatewayData?.public_key) {
          throw new Error('Active Paystack public key not found.');
        }

        if (mounted) {
          setGatewayConfig({
            publicKey: gatewayData.public_key,
            currency:
              gatewayData.supported_currencies?.includes('ZAR')
                ? 'ZAR'
                : gatewayData.supported_currencies?.[0] || 'ZAR'
          });
        }
      } catch (error) {
        console.error('Checkout configuration error:', error);

        if (mounted) {
          setGatewayConfig({
            publicKey: '',
            currency: 'ZAR'
          });
        }
      } finally {
        if (mounted) {
          setGatewayLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      mounted = false;
    };
  }, []);

  // ============================================
  // ALERT
  // ============================================

  const showAlert = (title, message) => {
    setAlertTitle(title);
    setAlertMessage(message);
    setShowAlertModal(true);
  };

  // ============================================
  // FORM INPUT
  // ============================================

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;

    setFormData((previous) => ({
      ...previous,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // ============================================
  // PLAN PRICE
  // ============================================

  const getPlanAmount = () => {
    const amount = Number(
      selectedPlan?.monthly_price ??
      selectedPlan?.price ??
      0
    );

    return Number.isFinite(amount) ? amount : 0;
  };

  const getPlanCurrency = () => {
    return selectedPlan?.currency || gatewayConfig.currency || 'ZAR';
  };

  const formatAmount = (amount) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: getPlanCurrency()
    }).format(amount);
  };

  // ============================================
  // BACKEND PAYMENT VERIFICATION
  // ============================================

  const verifyPaymentOnBackend = async (reference) => {
    const token = getAccessToken();

    if (!token) {
      throw new Error('Your login session has expired. Please log in again.');
    }

    if (!selectedPlan?.id) {
      throw new Error('The selected plan ID is missing.');
    }

    const response = await fetch(`${API_BASE_URL}/api/subscriptions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        reference,
        plan_id: selectedPlan.id,
        billing_cycle: 'monthly',
        fullName: formData.fullName,
        email: formData.email,
        country: formData.country
      })
    });

    let result;

    try {
      result = await response.json();
    } catch (error) {
      throw new Error('The server returned an invalid payment response.');
    }

    if (!response.ok || !result?.success) {
      throw new Error(
        result?.error ||
        result?.message ||
        'Payment verification failed. Please contact support.'
      );
    }

    if (!result.subscription) {
      throw new Error(
        'Payment was received, but the server did not confirm a saved subscription. Please contact support before paying again.'
      );
    }

    return result;
  };

  // ============================================
  // PAYSTACK PAYMENT
  // ============================================

  const handlePayment = async (e) => {
    e.preventDefault();

    if (processing) return;

    if (!selectedPlan?.id) {
      showAlert(
        'Plan Error',
        'The selected plan could not be identified. Please return to Pricing and select your plan again.'
      );
      return;
    }

    if (!formData.fullName.trim() || !formData.email.trim()) {
      showAlert(
        '⚠️ Missing Information',
        'Please fill in your name and email.'
      );
      return;
    }

    if (!formData.agreeToTerms) {
      showAlert(
        '📋 Terms Required',
        'You must agree to the Terms of Service and Privacy Policy to continue.'
      );
      return;
    }

    if (!getAccessToken()) {
      showAlert(
        'Login Required',
        'Your login session is missing. Please log in again before making a payment.'
      );
      return;
    }

    if (!gatewayConfig.publicKey || gatewayLoading) {
      showAlert(
        'Payment Gateway Unavailable',
        'Paystack is not configured or is still loading. Please try again later.'
      );
      return;
    }

    const amount = getPlanAmount();

    if (!Number.isFinite(amount) || amount <= 0) {
      showAlert(
        'Invalid Plan Price',
        'The selected plan does not have a valid monthly price.'
      );
      return;
    }

    const currency = getPlanCurrency();

    if (currency !== gatewayConfig.currency) {
      showAlert(
        'Currency Mismatch',
        'The selected plan currency does not match the configured Paystack currency.'
      );
      return;
    }

    setProcessing(true);

    try {
      await loadPaystackScript();

      if (!window.PaystackPop) {
        throw new Error('Paystack could not be initialized.');
      }

      const reference =
        `EDU-${Date.now()}-${Math.random().toString(36).slice(2, 10).toUpperCase()}`;

      const paymentConfig = {
        key: gatewayConfig.publicKey,
        email: formData.email.trim(),
        amount: Math.round(amount * 100),
        currency,
        ref: reference,

        metadata: {
          custom_fields: [
            {
              display_name: 'Full Name',
              variable_name: 'full_name',
              value: formData.fullName.trim()
            },
            {
              display_name: 'Plan',
              variable_name: 'plan',
              value: selectedPlan.name
            },
            {
              display_name: 'Plan ID',
              variable_name: 'plan_id',
              value: selectedPlan.id
            },
            {
              display_name: 'Audience',
              variable_name: 'audience',
              value: selectedPlan.audience || 'school'
            },
            {
              display_name: 'Billing Cycle',
              variable_name: 'billing_cycle',
              value: 'monthly'
            }
          ]
        },

        callback: async (response) => {
          try {
            if (!response?.reference) {
              throw new Error('Paystack did not return a transaction reference.');
            }

            // Never treat the browser callback as verified payment.
            // The backend must independently verify the transaction.
            const verification = await verifyPaymentOnBackend(
              response.reference
            );

            navigate('/payment-success', {
              replace: true,
              state: {
                reference: response.reference,
                plan: selectedPlan,
                user: formData,
                verification,
                subscription: verification.subscription
              }
            });
          } catch (error) {
            console.error('Payment verification error:', error);

            showAlert(
              'Payment Verification Pending',
              error.message ||
              'We could not confirm your payment. Please do not make another payment until the transaction has been checked. Contact support with your payment reference: ' +
              response.reference
            );

            setProcessing(false);
          }
        },

        onClose: () => {
          setProcessing(false);

          showAlert(
            '⏸️ Payment Window Closed',
            'The Paystack payment window was closed. If you completed the payment, please contact support with your transaction reference before trying again.'
          );
        }
      };

      const handler = window.PaystackPop.setup(paymentConfig);

      handler.openIframe();
    } catch (error) {
      console.error('Paystack initialization error:', error);

      setProcessing(false);

      showAlert(
        '❌ Payment Error',
        error.message || 'Could not initialize Paystack. Please try again.'
      );
    }
  };

  // ============================================
  // ALERT MODAL
  // ============================================

  const AlertModal = () => {
    if (!showAlertModal) return null;

    return (
      <div
        className="checkout-modal-overlay"
        onClick={() => setShowAlertModal(false)}
      >
        <div
          className="checkout-modal alert-modal"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            className="checkout-modal-close"
            onClick={() => setShowAlertModal(false)}
          >
            ×
          </button>

          <div className="alert-icon">⚠️</div>
          <h2 className="alert-title">{alertTitle || 'Notice'}</h2>
          <p className="alert-message">{alertMessage}</p>

          <button
            className="btn-primary alert-btn"
            onClick={() => setShowAlertModal(false)}
          >
            Got it
          </button>
        </div>
      </div>
    );
  };

  // ============================================
  // TERMS MODAL
  // ============================================

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
          onClick={(e) => e.stopPropagation()}
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

  // ============================================
  // PRIVACY MODAL
  // ============================================

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
          onClick={(e) => e.stopPropagation()}
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

  // ============================================
  // RENDER GUARDS
  // ============================================

  if (loadingPlan) {
    return (
      <div className="checkout-loading">
        <div className="spinner"></div>
        <p style={{ marginTop: '16px', color: '#94a3b8' }}>
          Loading plan details...
        </p>
      </div>
    );
  }

  if (!selectedPlan) {
    return (
      <div className="checkout-empty">
        <p>No plan selected.</p>
        <button
          className="btn-primary"
          onClick={() => navigate('/pricing')}
        >
          Back to Plans
        </button>
      </div>
    );
  }

  const planAmount = getPlanAmount();
  const planCurrency = getPlanCurrency();

  // ============================================
  // MAIN RENDER
  // ============================================

  return (
    <div className="checkout-page">
      <AlertModal />
      <TermsModal />
      <PrivacyModal />

      <div className="checkout-container">
        <div className="checkout-header">
          <button
            className="checkout-back"
            onClick={() => navigate('/pricing')}
            disabled={processing}
          >
            ← Back to Plans
          </button>

          <h1>Complete Your Enrollment</h1>
          <p>Secure payment powered by Paystack</p>
        </div>

        <div className="checkout-grid">
          <div className="checkout-main">

            {/* SELECTED PLAN */}

            <div className="checkout-section">
              <h3>📋 Selected Plan</h3>

              <div className="selected-plan-card">
                <div className="plan-info">
                  <h4>{selectedPlan.name}</h4>

                  <p className="plan-description">
                    {selectedPlan.description}
                  </p>

                  <div className="plan-features-mini">
                    {selectedPlan.features?.slice(0, 3).map(
                      (feature, index) => (
                        <span key={index} className="mini-feature">
                          ✓ {feature}
                        </span>
                      )
                    )}
                  </div>
                </div>

                <div className="plan-price-mini">
                  <span className="price">
                    {formatAmount(planAmount)}
                  </span>

                  <span className="period">
                    {selectedPlan.period || '/month'}
                  </span>
                </div>
              </div>
            </div>

            {/* PAYMENT FORM */}

            <div className="checkout-section">
              <h3>👤 Account Details</h3>

              <form
                onSubmit={handlePayment}
                className="checkout-form"
              >
                <div className="form-row">
                  <div className="form-group">
                    <label>Full Name *</label>

                    <input
                      type="text"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleInputChange}
                      placeholder="John Doe"
                      required
                      disabled={processing}
                    />
                  </div>

                  <div className="form-group">
                    <label>Email Address *</label>

                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="john@example.com"
                      required
                      disabled={processing}
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Country *</label>

                    <select
                      name="country"
                      value={formData.country}
                      onChange={handleInputChange}
                      required
                      disabled={processing}
                    >
                      <option value="ZA">South Africa</option>
                      <option value="NG">Nigeria</option>
                      <option value="GH">Ghana</option>
                      <option value="KE">Kenya</option>
                    </select>
                  </div>
                </div>

                {/* TERMS CHECKBOX */}

                <div className="terms-checkbox">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      name="agreeToTerms"
                      checked={formData.agreeToTerms}
                      onChange={handleInputChange}
                      disabled={processing}
                    />

                    <span className="custom-checkbox"></span>

                    <span className="checkbox-text">
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

                {/* PAYMENT BUTTON */}

                <button
                  type="submit"
                  className="btn-primary"
                  disabled={
                    processing ||
                    !formData.agreeToTerms ||
                    gatewayLoading
                  }
                >
                  {processing
                    ? 'Processing...'
                    : gatewayLoading
                      ? 'Loading payment gateway...'
                      : `Pay ${formatAmount(planAmount)} ${selectedPlan.period || '/month'}`}
                </button>
              </form>
            </div>
          </div>

          {/* ORDER SUMMARY */}

          <div className="checkout-summary">
            <div className="summary-card">
              <h3>📊 Order Summary</h3>

              <div className="summary-plan">
                <div className="summary-plan-name">
                  <span className="plan-name">
                    {selectedPlan.name}
                  </span>

                  <span className="plan-tier">
                    {selectedPlan.tier || selectedPlan.name}
                  </span>
                </div>

                <div className="summary-plan-price">
                  <span className="price">
                    {formatAmount(planAmount)}
                  </span>

                  <span className="period">
                    {selectedPlan.period || '/month'}
                  </span>
                </div>
              </div>

              <div className="summary-divider"></div>

              <div className="summary-features">
                {selectedPlan.features?.map((feature, index) => (
                  <div key={index} className="summary-feature">
                    <span>✓</span> {feature}
                  </div>
                ))}
              </div>

              <div className="summary-divider"></div>

              <div className="summary-total">
                <span>Total</span>

                <span className="total-price">
                  {formatAmount(planAmount)}

                  <span className="period">
                    {selectedPlan.period || '/month'}
                  </span>
                </span>
              </div>

              <div className="summary-security">
                <div className="security-badge">
                  <span>🔒</span> Secured by Paystack
                </div>

                <div className="security-badge">
                  <span>🛡️</span> PCI DSS Compliant
                </div>
              </div>

              <div className="summary-refund">
                <span>⏰</span> 72-Hour Refund Window
              </div>

              <p
                style={{
                  marginTop: 12,
                  fontSize: 12,
                  color: 'rgba(255,255,255,0.4)',
                  textAlign: 'center'
                }}
              >
                Need help? {accountInfo.supportEmail}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
