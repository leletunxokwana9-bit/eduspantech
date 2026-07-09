import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useHomeData } from '../hooks/useHomeData';
import { usePayment } from '../hooks/usePayment';
import Modal from '../components/Modal/Modal';
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

  const handleStep1Submit = (e) => {
    e.preventDefault();
    if (!formData.fullName || !formData.email || !formData.country) {
      alert('Please fill in all required fields');
      return;
    }
    setCurrentStep(2);
  };

  const handlePayment = async (e) => {
    e.preventDefault();
    setProcessing(true);

    if (formData.paymentMethod === 'card') {
      if (!formData.cardNumber || !formData.expiryDate || !formData.cvv || !formData.cardholderName) {
        alert('Please fill in all card details');
        setProcessing(false);
        return;
      }
      const cardNum = formData.cardNumber.replace(/\s/g, '');
      if (cardNum.length < 16) {
        alert('Please enter a valid 16-digit card number');
        setProcessing(false);
        return;
      }
      if (formData.cvv.length < 3) {
        alert('Please enter a valid CVV');
        setProcessing(false);
        return;
      }
    }

    if (formData.paymentMethod === 'crypto' && !formData.walletAddress) {
      alert('Please enter your wallet address');
      setProcessing(false);
      return;
    }

    if (formData.paymentMethod === 'voucher' && !formData.voucher) {
      alert('Please enter your voucher code');
      setProcessing(false);
      return;
    }

    if (!formData.agreeToTerms) {
      alert('Please agree to the Terms of Service');
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

      navigate('/payment-success', {
        state: {
          plan: selectedPlan,
          user: {
            name: formData.fullName,
            email: formData.email,
            cohort: 'HighSchool'
          },
          transaction: result.transactionId,
          subscription: result.subscriptionId
        }
      });
    } catch (err) {
      console.error('Payment error:', err);
      alert(err.message || 'Payment failed. Please try again.');
    } finally {
      setProcessing(false);
    }
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

  const getTermsData = () => {
    return TermsOfService.sections || [];
  };

  const getPrivacyData = () => {
    return PrivacyPolicy.sections || [];
  };

  const TermsContent = () => {
    const terms = getTermsData();
    const effectiveDate = TermsOfService.effectiveDate || '2026-07-09';

    return (
      <>
        <div className="last-updated">
          Last Updated: {effectiveDate}
        </div>
        {terms.map((section) => (
          <div key={section.id} className="section">
            <h2>{section.title}</h2>
            {section.content.map((paragraph, index) => (
              <p key={index}>{paragraph}</p>
            ))}
          </div>
        ))}
      </>
    );
  };

  const PrivacyContent = () => {
    const privacy = getPrivacyData();
    const effectiveDate = PrivacyPolicy.effectiveDate || '2026-07-09';

    return (
      <>
        <div className="last-updated">
          Last Updated: {effectiveDate}
        </div>
        {privacy.map((section) => (
          <div key={section.id} className="section">
            <h2>{section.title}</h2>
            {section.content.map((paragraph, index) => (
              <p key={index}>{paragraph}</p>
            ))}
          </div>
        ))}
      </>
    );
  };

  return (
    <div className="checkout-page">
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

      <Modal isOpen={showTermsModal} onClose={() => setShowTermsModal(false)} title="Terms of Service">
        <TermsContent />
      </Modal>
      <Modal isOpen={showPrivacyModal} onClose={() => setShowPrivacyModal(false)} title="Privacy Policy">
        <PrivacyContent />
      </Modal>
    </div>
  );
};

export default Checkout;