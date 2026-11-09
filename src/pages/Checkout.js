// src/pages/Checkout.js
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../services/supabaseClient';
import TermsOfService from './Terms';
import PrivacyPolicy from './Privacy';
import './Checkout.css';

const Checkout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // 1. Dynamic Plan
  const [selectedPlan, setSelectedPlan] = useState(location.state?.plan || null);
  const [loadingPlan, setLoadingPlan] = useState(!location.state?.plan); 
  
  // 2. Dynamic Account & Gateway Data from Supabase
  const [accountInfo, setAccountInfo] = useState({
    companyName: 'EduSpantech',
    supportEmail: 'support@eduspantech.com'
  });
  const [gatewayConfig, setGatewayConfig] = useState({
    publicKey: '', // Left empty to force a wait for the real key
    currency: 'ZAR'
  });
  
  // 3. UI & Payment State
  const [processing, setProcessing] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    country: 'ZA',
    agreeToTerms: false
  });
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [showAlertModal, setShowAlertModal] = useState(false);
  const [alertTitle, setAlertTitle] = useState('');
  const [alertMessage, setAlertMessage] = useState('');

  // Fetch plan from URL if state is missing (Page Refresh fix)
  useEffect(() => {
    const fetchPlanIfRefreshed = async () => {
      if (!location.state?.plan) {
        const params = new URLSearchParams(location.search);
        const planTier = params.get('plan'); 
        
        if (planTier) {
          const { data, error } = await supabase
            .from('pricing_plans')
            .select('*')
            .ilike('tier', planTier)
            .maybeSingle(); // Changed to maybeSingle for safety
            
          if (data && !error) {
            setSelectedPlan(data);
          }
        }
        setLoadingPlan(false);
      }
    };
    
    fetchPlanIfRefreshed();
  }, [location]);

  // Fetch dynamic data from Supabase
  useEffect(() => {
    const fetchData = async () => {
      // Fetch Account Info
      const { data: accountData } = await supabase.from('account_settings').select('key, value');
      if (accountData) {
        const config = {};
        accountData.forEach(item => { config[item.key] = item.value; });
        setAccountInfo(prev => ({ ...prev, ...config }));
      }

      // Fetch Paystack Gateway Config
      const { data: gatewayData, error } = await supabase
        .from('payment_gateways')
        .select('*')
        .eq('name', 'paystack')
        .eq('is_active', true)
        .maybeSingle(); // 👈 Changed from .single() to prevent 406 error
        
      if (gatewayData) {
        console.log("✅ Paystack Key Loaded:", gatewayData.public_key);
        setGatewayConfig({
          publicKey: gatewayData.public_key,
          currency: gatewayData.supported_currencies?.[0] || 'ZAR'
        });
      } else {
        console.error("❌ Failed to load Paystack key. Check RLS policies or data.", error);
      }
    };
    fetchData();
  }, []);

  const showAlert = (title, message) => {
    setAlertTitle(title);
    setAlertMessage(message);
    setShowAlertModal(true);
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // ============================================
  // PAYSTACK INTEGRATION
  // ============================================
  const handlePayment = (e) => {
    e.preventDefault();

    if (!formData.fullName || !formData.email) {
      showAlert('⚠️ Missing Information', 'Please fill in your name and email.');
      return;
    }

    if (!formData.agreeToTerms) {
      showAlert('📋 Terms Required', 'You must agree to the Terms of Service and Privacy Policy to continue.');
      return;
    }

    // Verify the public key is loaded before trying to pay
    if (!gatewayConfig.publicKey) {
      showAlert('❌ System Error', 'Payment gateway is not configured. Please try again later or contact support.');
      return;
    }

    setProcessing(true);

    const script = document.createElement('script');
    script.src = 'https://js.paystack.co/v1/inline.js';
    script.async = true;
    script.onload = () => {
      try {
        const handler = window.PaystackPop.setup({
          key: gatewayConfig.publicKey, // Uses the real key from Supabase
          email: formData.email,
          amount: Math.round((selectedPlan.price || 0) * 100), 
          plan: selectedPlan.paystack_plan_code,
          currency: gatewayConfig.currency,
          ref: `EDU-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          metadata: {
            custom_fields: [
              { display_name: "Full Name", variable_name: "full_name", value: formData.fullName },
              { display_name: "Plan", variable_name: "plan", value: selectedPlan.name },
              { display_name: "Audience", variable_name: "audience", value: selectedPlan.audience || 'school' }
            ]
          },
          callback: function(response) {
            console.log('Payment successful:', response.reference);
            setProcessing(false);
            
            navigate('/payment-success', { 
              state: { 
                reference: response.reference, 
                plan: selectedPlan, 
                user: formData 
              } 
            });
          },
          onClose: function() {
            setProcessing(false);
            showAlert('⏸️ Payment Cancelled', 'You closed the payment window. You can try again when ready.');
          }
        });
        handler.openIframe();
      } catch (err) {
        console.error('Paystack init error:', err);
        setProcessing(false);
        showAlert('❌ Payment Error', 'Could not load the payment gateway. Please try again.');
      }
    };
    script.onerror = () => {
      setProcessing(false);
      showAlert('❌ Network Error', 'Failed to load Paystack. Please check your internet connection.');
    };
    document.body.appendChild(script);
  };

  // ============================================
  // MODALS
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
          <button className="btn-primary alert-btn" onClick={() => setShowAlertModal(false)}>Got it</button>
        </div>
      </div>
    );
  };

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

  // ============================================
  // RENDER GUARDS
  // ============================================
  if (loadingPlan) {
    return (
      <div className="checkout-loading">
        <div className="spinner"></div>
        <p style={{ marginTop: '16px', color: '#94a3b8' }}>Loading plan details...</p>
      </div>
    );
  }

  if (!selectedPlan) {
    return (
      <div className="checkout-empty">
        <p>No plan selected.</p>
        <button className="btn-primary" onClick={() => navigate('/pricing')}>Back to Plans</button>
      </div>
    );
  }

  return (
    <div className="checkout-page">
      <AlertModal />
      <TermsModal />
      <PrivacyModal />

      <div className="checkout-container">
        <div className="checkout-header">
          <button className="checkout-back" onClick={() => navigate('/pricing')} disabled={processing}>
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
                  <p className="plan-description">{selectedPlan.description}</p>
                  <div className="plan-features-mini">
                    {selectedPlan.features?.slice(0, 3).map((feature, index) => (
                      <span key={index} className="mini-feature">✓ {feature}</span>
                    ))}
                  </div>
                </div>
                <div className="plan-price-mini">
                  <span className="price">
                    {selectedPlan.price === 0 ? 'Free' : `R${selectedPlan.price}`}
                  </span>
                  <span className="period">{selectedPlan.period || '/month'}</span>
                </div>
              </div>
            </div>

            {/* PAYMENT FORM */}
            <div className="checkout-section">
              <h3>👤 Account Details</h3>
              <form onSubmit={handlePayment} className="checkout-form">
                <div className="form-row">
                  <div className="form-group">
                    <label>Full Name *</label>
                    <input type="text" name="fullName" value={formData.fullName} onChange={handleInputChange} placeholder="John Doe" required disabled={processing} />
                  </div>
                  <div className="form-group">
                    <label>Email Address *</label>
                    <input type="email" name="email" value={formData.email} onChange={handleInputChange} placeholder="john@example.com" required disabled={processing} />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Country *</label>
                    <select name="country" value={formData.country} onChange={handleInputChange} required disabled={processing}>
                      <option value="ZA">South Africa</option>
                      <option value="NG">Nigeria</option>
                      <option value="GH">Ghana</option>
                      <option value="KE">Kenya</option>
                    </select>
                  </div>
                </div>

                {/* FIXED CHECKBOX */}
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
                      <span className="terms-link" onClick={(e) => { e.preventDefault(); setShowTermsModal(true); }}>Terms of Service</span>
                      {' '}and{' '}
                      <span className="terms-link" onClick={(e) => { e.preventDefault(); setShowPrivacyModal(true); }}>Privacy Policy</span>
                    </span>
                  </label>
                </div>

                {/* DISABLED UNTIL CHECKED */}
                <button 
                  type="submit" 
                  className="btn-primary" 
                  disabled={processing || !formData.agreeToTerms}
                >
                  {processing 
                    ? 'Processing...' 
                    : `Pay R${selectedPlan.price} ${selectedPlan.period || '/month'}`}
                </button>
              </form>
            </div>
          </div>

          {/* SUMMARY */}
          <div className="checkout-summary">
            <div className="summary-card">
              <h3>📊 Order Summary</h3>
              <div className="summary-plan">
                <div className="summary-plan-name">
                  <span className="plan-name">{selectedPlan.name}</span>
                  <span className="plan-tier">{selectedPlan.tier || selectedPlan.name}</span>
                </div>
                <div className="summary-plan-price">
                  <span className="price">R{selectedPlan.price}</span>
                  <span className="period">{selectedPlan.period || '/month'}</span>
                </div>
              </div>
              <div className="summary-divider"></div>
              <div className="summary-features">
                {selectedPlan.features?.map((feature, index) => (
                  <div key={index} className="summary-feature"><span>✓</span> {feature}</div>
                ))}
              </div>
              <div className="summary-divider"></div>
              <div className="summary-total">
                <span>Total</span>
                <span className="total-price">R{selectedPlan.price}<span className="period">{selectedPlan.period || '/month'}</span></span>
              </div>
              <div className="summary-security">
                <div className="security-badge"><span>🔒</span> Secured by Paystack</div>
                <div className="security-badge"><span>🛡️</span> PCI DSS Compliant</div>
              </div>
              <div className="summary-refund">
                <span>⏰</span> 72-Hour Refund Window
              </div>
              <p style={{ marginTop: 12, fontSize: 12, color: 'rgba(255,255,255,0.4)', textAlign: 'center' }}>
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