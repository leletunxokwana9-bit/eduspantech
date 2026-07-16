// src/pages/Pricing.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useHomeData } from '../hooks/useHomeData';
import { authService } from '../services/authService';
import './Pricing.css';

const Pricing = () => {
  const navigate = useNavigate();
  const { data, loading, error } = useHomeData();
  const [billingCycle, setBillingCycle] = useState('monthly');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);

  // ✅ Check authentication
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        setIsAuthenticated(false);
        setCheckingAuth(false);
        return;
      }

      try {
        const user = await authService.getCurrentUser();
        if (user) {
          setIsAuthenticated(true);
        } else {
          setIsAuthenticated(false);
          authService.logout();
        }
      } catch (err) {
        console.error('Auth check failed:', err);
        setIsAuthenticated(false);
      } finally {
        setCheckingAuth(false);
      }
    };
    checkAuth();
  }, []);

  if (loading || checkingAuth) {
    return (
      <div className="pricing-page-loading">
        <div className="loading-spinner"></div>
        <p>{checkingAuth ? 'Checking authentication...' : 'Loading pricing...'}</p>
      </div>
    );
  }

  if (error) return <div className="pricing-page-error">Error loading pricing</div>;
  if (!data) return <div className="pricing-page-empty">No pricing available</div>;

  const plans = data.pricing?.items || [];
  const hasAnnualPricing = plans.some(item => item.annualPrice);

  // ✅ Handle Get Started with auth check
  const handleGetStarted = (plan) => {
    console.log('📚 Getting started with plan:', plan);
    
    // ✅ Check authentication before proceeding
    if (!isAuthenticated) {
      setSelectedPlan(plan);
      setShowLoginPrompt(true);
      return;
    }

    // Redirect to checkout with plan selection
    navigate(`/checkout?plan=${plan.tier || plan.name.toLowerCase()}`);
  };

  // ✅ Handle login redirect
  const handleLoginRedirect = () => {
    navigate('/login', { state: { from: '/pricing' } });
  };

  // ✅ Login Prompt Modal (same as Resources and Tutors pages)
  const LoginPrompt = () => (
    <div className="login-prompt-overlay" onClick={() => setShowLoginPrompt(false)}>
      <div className="login-prompt-modal" onClick={(e) => e.stopPropagation()}>
        <button className="login-prompt-close" onClick={() => setShowLoginPrompt(false)}>×</button>
        <div className="login-prompt-icon">🔒</div>
        <h3>Login Required</h3>
        <p>Please log in to subscribe to the <strong>{selectedPlan?.name}</strong> plan.</p>
        <div className="login-prompt-actions">
          <button className="login-prompt-btn" onClick={handleLoginRedirect}>
            Login Now →
          </button>
          <button className="login-prompt-cancel" onClick={() => setShowLoginPrompt(false)}>
            Cancel
          </button>
        </div>
        <p className="login-prompt-register">
          Don't have an account? <span onClick={() => navigate('/register')}>Register here</span>
        </p>
      </div>
    </div>
  );

  return (
    <div className="pricing-page">
      {/* Login Prompt Modal */}
      {showLoginPrompt && <LoginPrompt />}

      <div className="pricing-page-header">
        <h1>💰 {data.pricing?.title || 'Choose Your Plan'}</h1>
        <p>{data.pricing?.subtitle || 'Flexible subscription options for every learner'}</p>
        
        {/* ✅ Auth banner - shows if not logged in */}
        {!isAuthenticated && (
          <div className="pricing-auth-banner">
            <span>🔐 Please <button onClick={() => navigate('/login', { state: { from: '/pricing' } })}>login</button> to subscribe to any plan</span>
          </div>
        )}

        {hasAnnualPricing && (
          <div className="billing-toggle">
            <button 
              className={`toggle-btn ${billingCycle === 'monthly' ? 'active' : ''}`}
              onClick={() => setBillingCycle('monthly')}
            >
              Monthly
            </button>
            <button 
              className={`toggle-btn ${billingCycle === 'annual' ? 'active' : ''}`}
              onClick={() => setBillingCycle('annual')}
            >
              Annual
              <span className="toggle-save">Save 20%</span>
            </button>
          </div>
        )}
      </div>

      <div className="pricing-page-grid">
        {plans.map((plan) => {
          const isPopular = plan.popular;
          const price = billingCycle === 'annual' && plan.annualPrice ? plan.annualPrice : plan.price;
          const period = billingCycle === 'annual' && plan.annualPrice ? '/year' : plan.period || '/month';

          return (
            <div key={plan.id} className={`pricing-page-card ${isPopular ? 'popular' : ''}`}>
              {isPopular && <div className="popular-badge">⭐ Most Popular</div>}
              <div className="pricing-page-plan-icon">📐</div>
              <div className="pricing-page-plan-name">{plan.name}</div>
              <div className="pricing-page-plan-price">
                {price}
                <span>{period}</span>
              </div>
              <div className="pricing-page-plan-tier">{plan.tier || plan.name}</div>
              <p className="pricing-page-plan-description">{plan.description}</p>
              <ul className="pricing-page-features">
                {plan.features?.map((feature, index) => (
                  <li key={index}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                    {feature}
                  </li>
                ))}
              </ul>
              <button 
                className={`pricing-page-cta ${isPopular ? 'popular-cta' : ''}`}
                onClick={() => handleGetStarted(plan)}
              >
                Get Started
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                  <polyline points="12 5 19 12 12 19"></polyline>
                </svg>
              </button>
              {plan.note && <div className="pricing-page-note">{plan.note}</div>}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Pricing;