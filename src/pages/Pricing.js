// src/pages/Pricing.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';
// 👇 FIXED: Added curly braces to match the named export
import { pricingService } from '../services/pricingService';
import { supabase } from '../services/supabaseClient'; 
import './Pricing.css';

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

const getInitialAudience = () => {
  try {
    const fromUrl = new URLSearchParams(window.location.search).get('audience');
    if (AUDIENCES.some((a) => a.id === fromUrl)) return fromUrl;
    const saved = localStorage.getItem(AUDIENCE_STORAGE_KEY);
    if (AUDIENCES.some((a) => a.id === saved)) return saved;
  } catch (err) {}
  return 'school';
};

const Pricing = () => {
  const navigate = useNavigate();
  const [plans, setPlans] = useState([]);
  const [billingCycle, setBillingCycle] = useState('monthly');
  const [audience, setAudience] = useState(getInitialAudience);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [userSubscription, setUserSubscription] = useState(null);

  useEffect(() => {
    const init = async () => {
      try {
        const token = localStorage.getItem('accessToken');
        let userId = null;

        if (token) {
          try {
            const user = await authService.getCurrentUser();
            if (user && user.id) {
              userId = user.id;
              setIsAuthenticated(true);
            }
          } catch (err) {
            console.warn("⚠️ Backend auth failed, checking Supabase session...");
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user) {
              userId = session.user.id;
              setIsAuthenticated(true);
            } else {
              setIsAuthenticated(false);
              authService.logout();
            }
          }
        } else {
          setIsAuthenticated(false);
        }

        if (userId) {
          try {
            const subscription = await pricingService.getUserSubscription(userId);
            setUserSubscription(subscription);
          } catch (subErr) {
            console.warn("⚠️ Could not fetch user subscription:", subErr);
          }
        }

        if (pricingService?.getPricingPlans) {
          const pricingPlans = await pricingService.getPricingPlans();
          setPlans(pricingPlans || []);
        } else {
          setError('Pricing service not available');
        }
      } catch (err) {
        console.error('Error initializing pricing page:', err);
        setError('Failed to load pricing data');
      } finally {
        setLoading(false);
      }
    };

    init();
  }, []);

  useEffect(() => {
    const subscribedAudience = userSubscription?.plan?.audience;
    if (subscribedAudience && AUDIENCES.some((a) => a.id === subscribedAudience)) {
      setAudience(subscribedAudience);
    }
  }, [userSubscription]);

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

  const activeAudience = AUDIENCES.find((a) => a.id === audience) || AUDIENCES[0];
  const visiblePlans = plans.filter((plan) => plan?.audience === 'all' || plan?.audience === audience || !plan?.audience);

  const hasAnnualPricing = visiblePlans.some(plan => plan?.annualPrice !== null && plan?.annualPrice > 0);
  const activeBilling = hasAnnualPricing ? billingCycle : 'monthly';

  const subscribedAudience = userSubscription?.plan?.audience;
  const showTierHint = Boolean(isAuthenticated && subscribedAudience && subscribedAudience !== audience);

  const handleAudienceChange = (nextAudience) => {
    setAudience(nextAudience);
    try { localStorage.setItem(AUDIENCE_STORAGE_KEY, nextAudience); } catch (err) {}
  };

  const handleGetStarted = (plan) => {
    if (!isAuthenticated) {
      setSelectedPlan(plan);
      setShowLoginPrompt(true);
      return;
    }

    if (userSubscription && (userSubscription?.plan_id === plan?.id || userSubscription?.plan?.id === plan?.id)) {
      alert('You are already subscribed to this plan!');
      return;
    }

    const planTier = plan?.tier ? plan.tier.toLowerCase() : 'standard';

    navigate(
      `/checkout?plan=${planTier}&billing=${activeBilling}&audience=${audience}`,
      { state: { plan } }
    );
  };

  const handleLoginRedirect = () => navigate('/login', { state: { from: '/pricing' } });
  const handleLogout = () => { authService.logout(); setIsAuthenticated(false); setUserSubscription(null); navigate('/'); };

  const LoginPrompt = () => (
    <div className="login-prompt-overlay" onClick={() => setShowLoginPrompt(false)}>
      <div className="login-prompt-modal" onClick={(e) => e.stopPropagation()}>
        <button className="login-prompt-close" onClick={() => setShowLoginPrompt(false)}>×</button>
        <div className="login-prompt-icon">🔒</div>
        <h3>Login Required</h3>
        <p>Please log in to subscribe to the <strong>{selectedPlan?.name || 'selected'}</strong> plan.</p>
        <div className="login-prompt-actions">
          <button className="login-prompt-btn" onClick={handleLoginRedirect}>Login Now →</button>
          <button className="login-prompt-cancel" onClick={() => setShowLoginPrompt(false)}>Cancel</button>
        </div>
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
            <span>✅ You are currently on the <strong>{userSubscription?.plan?.name || 'Free'}</strong> plan</span>
            {(userSubscription?.plan?.name ?? 'Free') !== 'Free' && (
              <button onClick={handleLogout} className="logout-btn">Sign Out</button>
            )}
          </div>
        )}

        <div className="audience-toggle-wrap">
          <span className="audience-toggle-label">I am a</span>
          <div className="audience-toggle">
            {AUDIENCES.map((option) => (
              <button key={option.id} type="button" className={`audience-btn ${audience === option.id ? 'active' : ''}`} onClick={() => handleAudienceChange(option.id)}>
                {option.icon}
                <span className="audience-btn-text">
                  <span className="audience-btn-title">{option.title}</span>
                  <span className="audience-btn-sub">{option.subtitle}</span>
                </span>
              </button>
            ))}
          </div>
          {showTierHint && <p className="audience-hint">You're viewing <strong>{activeAudience.title}</strong> pricing.</p>}
        </div>

        {hasAnnualPricing && (
          <div className="billing-toggle">
            <button className={`toggle-btn ${activeBilling === 'monthly' ? 'active' : ''}`} onClick={() => setBillingCycle('monthly')}>Monthly</button>
            <button className={`toggle-btn ${activeBilling === 'annual' ? 'active' : ''}`} onClick={() => setBillingCycle('annual')}>Annual <span className="toggle-save">Save 17%</span></button>
          </div>
        )}
      </div>

      {visiblePlans.length === 0 ? (
        <div className="audience-empty"><h3>No plans found</h3></div>
      ) : (
        <div className="pricing-page-grid audience-fade" key={audience}>
          {visiblePlans.map((plan) => {
            if (!plan) return null;
            const isPopular = plan?.popular;
            const price = activeBilling === 'annual' && plan?.annualPrice ? plan.annualPrice : (plan?.price || 0);
            const period = (activeBilling === 'annual' && plan?.annualPrice) ? '/year' : (plan?.period || '/month');
            
            const isCurrentPlan = userSubscription && (userSubscription?.plan_id === plan?.id || userSubscription?.plan?.id === plan?.id);
            
            const isFreePlan = plan?.tier === 'Free' || plan?.name === 'Free';
            const currencySymbol = plan?.currency === 'ZAR' ? 'R' : '$';
            const badgeText = plan?.badge || (isPopular ? 'Popular' : null);

            return (
              <div key={plan.id || Math.random()} className={`pricing-page-card ${isPopular ? 'popular' : ''} ${isCurrentPlan ? 'current-plan' : ''}`}>
                
                {isCurrentPlan && <div className="current-badge">✅ YOUR PLAN</div>}
                {!isCurrentPlan && badgeText && <div className="popular-badge">⭐ {badgeText}</div>}

                <div className="pricing-page-plan-icon">📐</div>
                <div className="pricing-page-plan-name">{plan?.name || 'Plan'}</div>
                
                <div className="pricing-page-plan-price">
                  {price === 0 ? 'Free' : `${currencySymbol}${price}`}
                  <span>{period}</span>
                </div>
                
                <p className="pricing-page-plan-description">{plan?.description || ''}</p>
                
                <ul className="pricing-page-features">
                  {plan?.features && Array.isArray(plan.features) && plan.features.map((feature, index) => (
                    <li key={index}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                      {feature}
                    </li>
                  ))}
                </ul>

                {isFreePlan ? (
                  <button className={`pricing-page-cta ${isPopular ? 'popular-cta' : ''}`} onClick={() => navigate('/dashboard')}>Get Started Free</button>
                ) : (
                  <button className={`pricing-page-cta ${isPopular && !isCurrentPlan ? 'popular-cta' : ''} ${isCurrentPlan ? 'current-plan-btn' : ''}`} onClick={() => handleGetStarted(plan)} disabled={isCurrentPlan}>
                    {isCurrentPlan ? 'Active Plan' : 'Get Started'}
                  </button>
                )}
                {plan?.note && <div className="pricing-page-note">{plan.note}</div>}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Pricing;