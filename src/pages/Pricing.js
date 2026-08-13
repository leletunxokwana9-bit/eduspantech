// src/pages/Pricing.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';
import pricingService from '../services/pricingService';
import './Pricing.css';

const Pricing = () => {
  const navigate = useNavigate();
  const [plans, setPlans] = useState([]);
  const [billingCycle, setBillingCycle] = useState('monthly');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [userSubscription, setUserSubscription] = useState(null);

  useEffect(() => {
    const init = async () => {
      try {
        console.log('🔍 Pricing page initializing...');
        console.log('📦 pricingService:', pricingService);
        
        const token = localStorage.getItem('accessToken');
        let user = null;
        
        if (token) {
          try {
            user = await authService.getCurrentUser();
            if (user) {
              setIsAuthenticated(true);
              if (pricingService && typeof pricingService.getUserSubscription === 'function') {
                const subscription = await pricingService.getUserSubscription(user.id);
                setUserSubscription(subscription);
              }
            } else {
              setIsAuthenticated(false);
              authService.logout();
            }
          } catch (err) {
            console.error('Auth check failed:', err);
            setIsAuthenticated(false);
          }
        } else {
          setIsAuthenticated(false);
        }

        // Fetch pricing plans
        if (pricingService && typeof pricingService.getPricingPlans === 'function') {
          console.log('📊 Fetching pricing plans...');
          const pricingPlans = await pricingService.getPricingPlans();
          console.log('✅ Pricing plans:', pricingPlans);
          setPlans(pricingPlans);
        } else {
          console.error('❌ pricingService.getPricingPlans is not a function');
          console.error('📦 pricingService:', pricingService);
          setError('Pricing service not available');
        }
      } catch (err) {
        console.error('❌ Error initializing pricing page:', err);
        setError('Failed to load pricing data');
      } finally {
        setLoading(false);
      }
    };

    init();
  }, []);

  if (loading) {
    return (
      <div className="pricing-page-loading">
        <div className="loading-spinner"></div>
        <p>Loading pricing...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="pricing-page-error">
        <p>{error}</p>
        <button onClick={() => window.location.reload()}>Retry</button>
      </div>
    );
  }

  if (plans.length === 0) {
    return <div className="pricing-page-empty">No pricing plans available</div>;
  }

  const hasAnnualPricing = plans.some(plan => plan.annualPrice !== null && plan.annualPrice > 0);

  const handleGetStarted = (plan) => {
    if (!isAuthenticated) {
      setSelectedPlan(plan);
      setShowLoginPrompt(true);
      return;
    }

    if (userSubscription && userSubscription.plan_id === plan.id) {
      alert('You are already subscribed to this plan!');
      return;
    }

    navigate(`/checkout?plan=${plan.tier.toLowerCase()}&billing=${billingCycle}`);
  };

  const handleLoginRedirect = () => {
    navigate('/login', { state: { from: '/pricing' } });
  };

  const handleLogout = () => {
    authService.logout();
    setIsAuthenticated(false);
    setUserSubscription(null);
    navigate('/');
  };

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
      {showLoginPrompt && <LoginPrompt />}

      <div className="pricing-page-header">
        <h1>💰 Choose Your Plan</h1>
        <p>Flexible subscription options for every learner</p>
        
        {!isAuthenticated && (
          <div className="pricing-auth-banner">
            <span>🔐 Please <button onClick={() => navigate('/login', { state: { from: '/pricing' } })}>login</button> to subscribe to any plan</span>
          </div>
        )}

        {isAuthenticated && userSubscription && (
          <div className="current-plan-banner">
            <span>✅ You are currently on the <strong>{userSubscription.plan?.name || 'Free'}</strong> plan</span>
            {userSubscription.plan?.name !== 'Free' && (
              <button onClick={handleLogout} className="logout-btn">
                Sign Out
              </button>
            )}
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
              <span className="toggle-save">Save 10%</span>
            </button>
          </div>
        )}
      </div>

      <div className="pricing-page-grid">
        {plans.map((plan) => {
          const isPopular = plan.popular;
          const price = billingCycle === 'annual' && plan.annualPrice ? plan.annualPrice : plan.price;
          const period = billingCycle === 'annual' && plan.annualPrice ? '/year' : plan.period || '/month';
          const isCurrentPlan = userSubscription && userSubscription.plan_id === plan.id;
          const isFreePlan = plan.tier === 'Free' || plan.name === 'Free';
          const currencySymbol = plan.currency === 'ZAR' ? 'R' : '$';

          return (
            <div key={plan.id} className={`pricing-page-card ${isPopular ? 'popular' : ''} ${isCurrentPlan ? 'current-plan' : ''}`}>
              {isPopular && <div className="popular-badge">⭐ Most Popular</div>}
              {isCurrentPlan && <div className="current-badge">✅ Current Plan</div>}
              <div className="pricing-page-plan-icon">📐</div>
              <div className="pricing-page-plan-name">{plan.name}</div>
              <div className="pricing-page-plan-price">
                {price === 0 ? 'Free' : `${currencySymbol}${price}`}
                <span>{period}</span>
              </div>
              <div className="pricing-page-plan-tier">{plan.tier}</div>
              <p className="pricing-page-plan-description">{plan.description}</p>
              <ul className="pricing-page-features">
                {plan.features && plan.features.map((feature, index) => (
                  <li key={index}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                    {feature}
                  </li>
                ))}
              </ul>
              {isFreePlan ? (
                <button 
                  className={`pricing-page-cta ${isPopular ? 'popular-cta' : ''}`}
                  onClick={() => navigate('/dashboard')}
                >
                  Get Started Free
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                    <polyline points="12 5 19 12 12 19"></polyline>
                  </svg>
                </button>
              ) : (
                <button 
                  className={`pricing-page-cta ${isPopular ? 'popular-cta' : ''} ${isCurrentPlan ? 'current-plan-btn' : ''}`}
                  onClick={() => handleGetStarted(plan)}
                  disabled={isCurrentPlan}
                >
                  {isCurrentPlan ? 'Current Plan' : 'Get Started'}
                  {!isCurrentPlan && (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="5" y1="12" x2="19" y2="12"></line>
                      <polyline points="12 5 19 12 12 19"></polyline>
                    </svg>
                  )}
                </button>
              )}
              {plan.note && <div className="pricing-page-note">{plan.note}</div>}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Pricing;