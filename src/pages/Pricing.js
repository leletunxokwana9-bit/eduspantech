// src/pages/Pricing.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';
import pricingService from '../services/pricingService';
import './Pricing.css';

// ✅ NEW: audiences shown in the toggle. `id` must match plan.audience from the backend.
// Plans with no `audience` value are treated as 'school'; plans with audience 'all' show in both views.
const AUDIENCES = [
  {
    id: 'school',
    title: 'Grade 8–12 Learners',
    subtitle: 'High school mathematics',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M4 5.5A1.5 1.5 0 0 1 5.5 4H19v15H5.5A1.5 1.5 0 0 0 4 20.5z" />
        <path d="M4 20.5A1.5 1.5 0 0 1 5.5 19H19" />
        <path d="M9 8h6" />
      </svg>
    ),
  },
  {
    id: 'tertiary',
    title: 'Tertiary Students',
    subtitle: 'University and college',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M2 9l10-5 10 5-10 5z" />
        <path d="M6 11.5V16c0 1.4 2.7 3 6 3s6-1.6 6-3v-4.5" />
        <path d="M22 9v6" />
      </svg>
    ),
  },
];

const AUDIENCE_STORAGE_KEY = 'pricingAudience';

// ✅ NEW: initial audience = ?audience=tertiary in the URL, else last choice, else 'school'
const getInitialAudience = () => {
  try {
    const fromUrl = new URLSearchParams(window.location.search).get('audience');
    if (AUDIENCES.some((a) => a.id === fromUrl)) return fromUrl;
    const saved = localStorage.getItem(AUDIENCE_STORAGE_KEY);
    if (AUDIENCES.some((a) => a.id === saved)) return saved;
  } catch (err) {
    // storage or URL access blocked: fall back to default
  }
  return 'school';
};

const Pricing = () => {
  const navigate = useNavigate();
  const [plans, setPlans] = useState([]);
  const [billingCycle, setBillingCycle] = useState('monthly');
  const [audience, setAudience] = useState(getInitialAudience); // ✅ NEW
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

  // ✅ NEW: only the plans for the selected audience
  const activeAudience = AUDIENCES.find((a) => a.id === audience) || AUDIENCES[0];
  const visiblePlans = plans.filter((plan) => {
    const planAudience = plan.audience || 'school';
    return planAudience === 'all' || planAudience === audience;
  });

  // ✅ CHANGED: annual pricing is checked against the visible plans only
  const hasAnnualPricing = visiblePlans.some(plan => plan.annualPrice !== null && plan.annualPrice > 0);

  // ✅ NEW: if the chosen audience has no annual pricing, fall back to monthly
  const activeBilling = hasAnnualPricing ? billingCycle : 'monthly';

  const handleAudienceChange = (nextAudience) => {
    setAudience(nextAudience);
    try {
      localStorage.setItem(AUDIENCE_STORAGE_KEY, nextAudience);
    } catch (err) {
      // storage blocked: the choice just won't be remembered
    }
  };

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

    // ✅ CHANGED: audience is passed so checkout can tell Gold (school) from Gold (tertiary)
    navigate(`/checkout?plan=${plan.tier.toLowerCase()}&billing=${activeBilling}&audience=${audience}`);
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

        {/* ✅ NEW: audience toggle (Grade 8–12 Learners / Tertiary Students) */}
        <div className="audience-toggle-wrap">
          <span className="audience-toggle-label" id="audience-toggle-label">I am a</span>
          <div className="audience-toggle" role="group" aria-labelledby="audience-toggle-label">
            {AUDIENCES.map((option) => (
              <button
                key={option.id}
                type="button"
                className={`audience-btn ${audience === option.id ? 'active' : ''}`}
                aria-pressed={audience === option.id}
                onClick={() => handleAudienceChange(option.id)}
              >
                {option.icon}
                <span className="audience-btn-text">
                  <span className="audience-btn-title">{option.title}</span>
                  <span className="audience-btn-sub">{option.subtitle}</span>
                </span>
              </button>
            ))}
          </div>
        </div>

        {hasAnnualPricing && (
          <div className="billing-toggle">
            <button
              className={`toggle-btn ${activeBilling === 'monthly' ? 'active' : ''}`}
              onClick={() => setBillingCycle('monthly')}
            >
              Monthly
            </button>
            <button
              className={`toggle-btn ${activeBilling === 'annual' ? 'active' : ''}`}
              onClick={() => setBillingCycle('annual')}
            >
              Annual
              {/* ✅ FIXED: was "Save 10%", actual discount is 16.7% (2 months free) */}
              <span className="toggle-save">Save 17%</span>
            </button>
          </div>
        )}
      </div>

      {/* ✅ NEW: empty state when the selected audience has no plans yet */}
      {visiblePlans.length === 0 ? (
        <div className="audience-empty">
          <h3>{activeAudience.title} plans are coming soon</h3>
          <p>We're still setting up pricing for this group. Check back shortly.</p>
        </div>
      ) : (
        // ✅ CHANGED: key={audience} remounts the grid so it fades in on every switch
        <div className="pricing-page-grid audience-fade" key={audience}>
          {visiblePlans.map((plan) => {
            const isPopular = plan.popular;
            const price = activeBilling === 'annual' && plan.annualPrice ? plan.annualPrice : plan.price;
            // ✅ FIXED: added parentheses for correct operator precedence
            const period = (activeBilling === 'annual' && plan.annualPrice) ? '/year' : (plan.period || '/month');
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
      )}
    </div>
  );
};

export default Pricing;