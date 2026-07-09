import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useHomeData } from '../hooks/useHomeData';
import './Pricing.css';

const Pricing = () => {
  const navigate = useNavigate();
  const { data, loading, error } = useHomeData();
  const [billingCycle, setBillingCycle] = useState('monthly');

  if (loading) return <div className="pricing-page-loading">Loading pricing...</div>;
  if (error) return <div className="pricing-page-error">Error loading pricing</div>;
  if (!data) return <div className="pricing-page-empty">No pricing available</div>;

  const plans = data.pricing?.items || [];
  const hasAnnualPricing = plans.some(item => item.annualPrice);

  return (
    <div className="pricing-page">
      <div className="pricing-page-header">
        <h1>💰 {data.pricing?.title || 'Choose Your Plan'}</h1>
        <p>{data.pricing?.subtitle || 'Flexible subscription options for every learner'}</p>
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
                onClick={() => navigate(`/checkout?plan=${plan.tier || plan.name.toLowerCase()}`)}
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