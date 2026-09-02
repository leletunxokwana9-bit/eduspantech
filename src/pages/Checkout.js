// src/pages/Checkout.js
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useHomeData } from '../hooks/useHomeData';
import { usePayment } from '../hooks/usePayment';
import TermsOfService from './Terms';
import PrivacyPolicy from './Privacy';
import './Checkout.css';

const Checkout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { data, loading, error } = useHomeData();
  const { processPayment, loading: paymentLoading, error: paymentError } = usePayment();
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    country: 'ZA',
    paymentMethod: 'card',
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    cardholderName: '',
    billingAddress: '',
    city: '',
    postalCode: '',
    agreeToTerms: false,
    voucher: '',
    walletAddress: ''
  });
  const [processing, setProcessing] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [showPaymentSuccessModal, setShowPaymentSuccessModal] = useState(false);
  const [paymentResult, setPaymentResult] = useState(null);
  
  // Alert Modal states
  const [showAlertModal, setShowAlertModal] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertTitle, setAlertTitle] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const planId = params.get('plan');
    if (planId && data?.pricing?.items) {
      const plan = data.pricing.items.find(p => p.tier?.toLowerCase() === planId.toLowerCase());
      if (plan) setSelectedPlan(plan);
    }
  }, [location, data]);

  useEffect(() => {
    if (!loading && !selectedPlan && data?.pricing?.items) {
      const defaultPlan = data.pricing.items.find(p => p.popular) || data.pricing.items[1];
      setSelectedPlan(defaultPlan);
    }
  }, [data, loading, selectedPlan]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const showAlert = (title, message) => {
    setAlertTitle(title);
    setAlertMessage(message);
    setShowAlertModal(true);
  };

  const handleStep1Submit = (e) => {
    e.preventDefault();
    if (!formData.fullName || !formData.email || !formData.country) {
      showAlert('⚠️ Missing Information', 'Please fill in all required fields before continuing.');
      return;
    }
    setCurrentStep(2);
  };

  const handlePayment = async (e) => {
    e.preventDefault();
    setProcessing(true);

    if (formData.paymentMethod === 'card') {
      if (!formData.cardNumber || !formData.expiryDate || !formData.cvv || !formData.cardholderName) {
        showAlert('💳 Incomplete Card Details', 'Please fill in all card details before proceeding.');
        setProcessing(false);
        return;
      }
      const cardNum = formData.cardNumber.replace(/\s/g, '');
      if (cardNum.length < 16) {
        showAlert('💳 Invalid Card Number', 'Please enter a valid 16-digit card number.');
        setProcessing(false);
        return;
      }
      if (formData.cvv.length < 3) {
        showAlert('🔒 Invalid CVV', 'Please enter a valid CVV (3-4 digits).');
        setProcessing(false);
        return;
      }
    }

    if (formData.paymentMethod === 'crypto' && !formData.walletAddress) {
      showAlert('₿ Missing Wallet Address', 'Please enter your wallet address.');
      setProcessing(false);
      return;
    }

    if (formData.paymentMethod === 'voucher' && !formData.voucher) {
      showAlert('🎫 Missing Voucher Code', 'Please enter your voucher code.');
      setProcessing(false);
      return;
    }

    if (!formData.agreeToTerms) {
      showAlert('📋 Terms Required', 'Please agree to the Terms of Service and Privacy Policy.');
      setProcessing(false);
      return;
    }

    try {
      const paymentData = {
        fullName: formData.fullName,
        email: formData.email,
        country: formData.country,
        plan: selectedPlan,
        paymentMethod: formData.paymentMethod,
        cardDetails: formData.paymentMethod === 'card' ? {
          cardNumber: formData.cardNumber,
          expiryDate: formData.expiryDate,
          cvv: formData.cvv,
          cardholderName: formData.cardholderName
        } : undefined,
        billingAddress: {
          address: formData.billingAddress || '',
          city: formData.city || '',
          postalCode: formData.postalCode || '',
          country: formData.country
        },
        voucher: formData.voucher || undefined,
        walletAddress: formData.walletAddress || undefined
      };

      const result = await processPayment(paymentData);
      console.log('Payment successful:', result);

      setPaymentResult({
        plan: selectedPlan,
        user: {
          name: formData.fullName,
          email: formData.email,
          cohort: 'HighSchool'
        },
        transaction: result.transactionId,
        subscription: result.subscriptionId
      });
      setShowPaymentSuccessModal(true);
      setProcessing(false);
    } catch (err) {
      console.error('Payment error:', err);
      showAlert('❌ Payment Failed', err.message || 'Payment failed. Please try again.');
      setProcessing(false);
    }
  };

  const handleSuccessModalClose = () => {
    setShowPaymentSuccessModal(false);
    navigate('/payment-success', {
      state: paymentResult
    });
  };

  // ============================================
  // ALERT MODAL - FIXED WITH OVERLAY
  // ============================================
  const AlertModal = () => {
    if (!showAlertModal) return null;

    return (
      <div className="checkout-modal-overlay" onClick={() => setShowAlertModal(false)}>
        <div className="checkout-modal alert-modal" onClick={(e) => e.stopPropagation()}>
          <button className="checkout-modal-close" onClick={() => setShowAlertModal(false)}>×</button>
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
  // TERMS MODAL - FIXED WITH OVERLAY
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
  // PRIVACY MODAL - FIXED WITH OVERLAY
  // ============================================
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
  // PAYMENT SUCCESS MODAL - FIXED WITH OVERLAY
  // ============================================
  const PaymentSuccessModal = () => {
    if (!showPaymentSuccessModal) return null;

    return (
      <div className="checkout-modal-overlay" onClick={() => {}}>
        <div className="checkout-modal success-modal" onClick={(e) => e.stopPropagation()}>
          <button className="checkout-modal-close" onClick={handleSuccessModalClose}>×</button>
          <div className="success-icon">✅</div>
          <h2 className="success-title">Payment Successful!</h2>
          <p className="success-message">
            Your subscription to <strong>{selectedPlan?.name}</strong> has been activated!
          </p>
          <div className="success-details">
            <div className="success-detail-item">
              <span>Transaction ID</span>
              <strong>{paymentResult?.transaction || 'N/A'}</strong>
            </div>
            <div className="success-detail-item">
              <span>Plan</span>
              <strong>{selectedPlan?.name}</strong>
            </div>
            <div className="success-detail-item">
              <span>Price</span>
              <strong>{selectedPlan?.price}{selectedPlan?.period}</strong>
            </div>
            <div className="success-detail-item">
              <span>User</span>
              <strong>{formData.fullName}</strong>
            </div>
            <div className="success-detail-item">
              <span>Email</span>
              <strong>{formData.email}</strong>
            </div>
          </div>
          <button className="btn-primary success-btn" onClick={handleSuccessModalClose}>
            🚀 Go to Dashboard
          </button>
          <p className="success-note">You can also close this window and continue browsing.</p>
        </div>
      </div>
    );
  };

  if (loading) return <div className="checkout-loading">Loading checkout...</div>;
  if (error) return <div className="checkout-error">Error: {error}</div>;
  if (!data || !selectedPlan) return <div className="checkout-empty">No plan selected</div>;

  const { checkout } = data;
  const countries = [
    { code: 'ZA', name: 'South Africa' },
    { code: 'US', name: 'United States' },
    { code: 'GB', name: 'United Kingdom' },
    { code: 'AU', name: 'Australia' },
    { code: 'SG', name: 'Singapore' },
    { code: 'JP', name: 'Japan' },
    { code: 'BR', name: 'Brazil' }
  ];
  const billingCountries = checkout?.billingCountries?.length > 0 ? checkout.billingCountries : countries;
  const steps = checkout?.steps || ['Plan Selection', 'Personal Details', 'Payment'];

  const paymentMethods = [
    {
      id: 'card',
      name: 'Credit / Debit Card',
      icon: '💳'
    },
    {
      id: 'payfast',
      name: 'PayFast',
      icon: '🔒'
    },
    {
      id: 'paypal',
      name: 'PayPal',
      icon: '🅿️'
    },
    {
      id: 'crypto',
      name: 'Cryptocurrency',
      icon: '₿'
    },
    {
      id: 'bank',
      name: 'Bank Transfer',
      icon: '🏦'
    },
    {
      id: 'voucher',
      name: 'Voucher / Promo',
      icon: '🎫'
    }
  ];

  const renderPaymentFields = () => {
    switch (formData.paymentMethod) {
      case 'card':
        return (
          <div className="card-details">
            <div className="form-row">
              <div className="form-group">
                <label>Card Number *</label>
                <input
                  type="text"
                  name="cardNumber"
                  value={formData.cardNumber}
                  onChange={handleInputChange}
                  placeholder="1234 5678 9012 3456"
                  maxLength="19"
                  disabled={processing}
                />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Expiry Date *</label>
                <input
                  type="text"
                  name="expiryDate"
                  value={formData.expiryDate}
                  onChange={handleInputChange}
                  placeholder="MM/YY"
                  maxLength="5"
                  disabled={processing}
                />
              </div>
              <div className="form-group">
                <label>CVV *</label>
                <input
                  type="password"
                  name="cvv"
                  value={formData.cvv}
                  onChange={handleInputChange}
                  placeholder="•••"
                  maxLength="4"
                  disabled={processing}
                />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Cardholder Name *</label>
                <input
                  type="text"
                  name="cardholderName"
                  value={formData.cardholderName}
                  onChange={handleInputChange}
                  placeholder="John Doe"
                  disabled={processing}
                />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Billing Address</label>
                <input
                  type="text"
                  name="billingAddress"
                  value={formData.billingAddress}
                  onChange={handleInputChange}
                  placeholder="123 Main Street"
                  disabled={processing}
                />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>City</label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleInputChange}
                  placeholder="Cape Town"
                  disabled={processing}
                />
              </div>
              <div className="form-group">
                <label>Postal Code</label>
                <input
                  type="text"
                  name="postalCode"
                  value={formData.postalCode}
                  onChange={handleInputChange}
                  placeholder="8001"
                  disabled={processing}
                />
              </div>
            </div>
          </div>
        );

      case 'payfast':
        return (
          <div className="payment-info">
            <p>🔒 You will be redirected to PayFast to complete your payment securely.</p>
            <p className="payment-info-note">PayFast supports credit cards, instant EFT, and more.</p>
          </div>
        );

      case 'paypal':
        return (
          <div className="payment-info">
            <p>🅿️ You will be redirected to PayPal to complete your payment securely.</p>
            <p className="payment-info-note">Pay with your PayPal balance or linked credit card.</p>
          </div>
        );

      case 'crypto':
        return (
          <div className="payment-info">
            <p>₿ Pay with cryptocurrency using your wallet.</p>
            <div className="form-row">
              <div className="form-group">
                <label>Wallet Address *</label>
                <input
                  type="text"
                  name="walletAddress"
                  value={formData.walletAddress}
                  onChange={handleInputChange}
                  placeholder="0x..."
                  disabled={processing}
                />
              </div>
            </div>
            <p className="payment-info-note">Supported: Bitcoin (BTC), Ethereum (ETH), USDC</p>
          </div>
        );

      case 'bank':
        return (
          <div className="payment-info bank-details">
            <p>🏦 Bank Transfer Details:</p>
            <ul>
              <li><strong>Bank:</strong> Standard Bank</li>
              <li><strong>Account Name:</strong> EduSpantech (Pty) Ltd</li>
              <li><strong>Account Number:</strong> 1234567890</li>
              <li><strong>Branch Code:</strong> 051001</li>
              <li><strong>Reference:</strong> {formData.email || 'Your Email Address'}</li>
            </ul>
            <p className="payment-info-note">Payment confirmation may take 1-2 business days.</p>
          </div>
        );

      case 'voucher':
        return (
          <div className="payment-info">
            <div className="form-row">
              <div className="form-group">
                <label>Voucher / Promo Code *</label>
                <input
                  type="text"
                  name="voucher"
                  value={formData.voucher}
                  onChange={handleInputChange}
                  placeholder="Enter your voucher code"
                  disabled={processing}
                />
              </div>
            </div>
            <p className="payment-info-note">Enter a valid voucher code to redeem your discount.</p>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="checkout-page">
      {/* ===== MODALS - ALL WITH PROPER OVERLAYS ===== */}
      <AlertModal />
      <TermsModal />
      <PrivacyModal />
      <PaymentSuccessModal />

      <div className="checkout-container">
        <div className="checkout-header">
          <button className="checkout-back" onClick={() => navigate('/pricing')} disabled={processing}>
            ← Back to Plans
          </button>
          <h1>{checkout?.title || 'Complete Your Enrollment'}</h1>
          <p>{checkout?.subtitle || 'Secure your spot and start learning today'}</p>
        </div>

        <div className="checkout-steps">
          {steps.map((step, index) => (
            <div key={index} className={`step-item ${index + 1 <= currentStep ? 'active' : ''}`}>
              <div className="step-number">{index + 1}</div>
              <span className="step-label">{step}</span>
              {index < steps.length - 1 && <div className="step-line"></div>}
            </div>
          ))}
        </div>

        <div className="checkout-grid">
          <div className="checkout-main">
            <div className="checkout-section">
              <h3>📋 Selected Plan</h3>
              <div className="selected-plan-card">
                <div className="plan-info">
                  <h4>{selectedPlan.name}</h4>
                  <p className="plan-description">{selectedPlan.description}</p>
                  <div className="plan-features-mini">
                    {selectedPlan.features?.slice(0, 3).map((feature, index) => (
                      <span key={index} className="mini-feature">✓ {feature}</span>
                    ))}
                  </div>
                </div>
                <div className="plan-price-mini">
                  <span className="price">{selectedPlan.price}</span>
                  <span className="period">{selectedPlan.period}</span>
                </div>
              </div>
            </div>

            {currentStep === 1 && (
              <div className="checkout-section">
                <h3>👤 Personal Details</h3>
                <form onSubmit={handleStep1Submit} className="checkout-form">
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
                        <option value="">Select your country</option>
                        {billingCountries.map(country => (
                          <option key={country.code} value={country.code}>
                            {country.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <button type="submit" className="btn-primary" disabled={processing}>
                    Continue to Payment →
                  </button>
                </form>
              </div>
            )}

            {currentStep === 2 && (
              <div className="checkout-section">
                <h3>💳 Payment Details</h3>
                <form onSubmit={handlePayment} className="checkout-form">
                  <div className="payment-methods">
                    {paymentMethods.map(method => (
                      <label
                        key={method.id}
                        className={`payment-method ${formData.paymentMethod === method.id ? 'selected' : ''}`}
                      >
                        <input
                          type="radio"
                          name="paymentMethod"
                          value={method.id}
                          checked={formData.paymentMethod === method.id}
                          onChange={handleInputChange}
                          disabled={processing}
                        />
                        <span className="method-icon">{method.icon}</span>
                        <span className="method-name">{method.name}</span>
                      </label>
                    ))}
                  </div>

                  {renderPaymentFields()}

                  {paymentError && (
                    <div className="checkout-error-message">
                      {paymentError}
                    </div>
                  )}

                  <div className="terms-checkbox">
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        name="agreeToTerms"
                        checked={formData.agreeToTerms}
                        onChange={handleInputChange}
                        disabled={processing}
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

                  <button type="submit" className="btn-primary" disabled={processing || paymentLoading}>
                    {processing || paymentLoading ? (
                      <span className="btn-loader">
                        <span className="spinner"></span> Processing...
                      </span>
                    ) : (
                      `Pay ${selectedPlan.price}${selectedPlan.period}`
                    )}
                  </button>
                </form>
              </div>
            )}
          </div>

          <div className="checkout-summary">
            <div className="summary-card">
              <h3>📊 Order Summary</h3>
              <div className="summary-plan">
                <div className="summary-plan-name">
                  <span className="plan-name">{selectedPlan.name}</span>
                  <span className="plan-tier">{selectedPlan.tier}</span>
                </div>
                <div className="summary-plan-price">
                  <span className="price">{selectedPlan.price}</span>
                  <span className="period">{selectedPlan.period}</span>
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
                <span className="total-price">{selectedPlan.price}<span className="period">{selectedPlan.period}</span></span>
              </div>
              <div className="summary-security">
                <div className="security-badge">
                  <span>🔒</span> AES-256 Encrypted
                </div>
                <div className="security-badge">
                  <span>🛡️</span> Secure Payment
                </div>
              </div>
              <div className="summary-refund">
                <span>⏰</span> 72-Hour Refund Window
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;