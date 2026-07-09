import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Pricing.css';

const Pricing = ({ pricingData }) => {
  const navigate = useNavigate();
  const [billingCycle, setBillingCycle] = useState('monthly');

  if (!pricingData) {
    return (
      <section className="pricing-section">
        <div className="container">
          <div className="pricing-header">
            <h2>Pricing</h2>
            <p>Loading...</p>
          </div>
        </div>
      </section>
    );
  }

  const { title, subtitle, items } = pricingData;
  const hasAnnualPricing = items?.some(item => item.annualPrice);

  return (
    <section className="pricing-section">
      <div className="container">
        <div className="pricing-header">
          <span className="pricing-badge">💰 Pricing</span>
          <h2>{title || 'Choose Your Plan'}</h2>
          <p>{subtitle || 'Flexible subscription options for every learner'}</p>
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
        <div className="pricing-grid">
          {items?.map((plan) => {
            const isPopular = plan.popular;
            const price = billingCycle === 'annual' && plan.annualPrice ? plan.annualPrice : plan.price;
            const period = billingCycle === 'annual' && plan.annualPrice ? '/year' : plan.period || '/month';

            return (
              <div key={plan.id} className={`pricing-card ${isPopular ? 'popular' : ''}`}>
                {isPopular && <div className="popular-badge">⭐ Most Popular</div>}
                <div className="pricing-plan-icon">📐</div>
                <div className="pricing-plan-name">{plan.name}</div>
                <div className="pricing-plan-price">
                  {price}
                  <span>{period}</span>
                </div>
                <div className="pricing-plan-tier">{plan.tier || plan.name}</div>
                <p className="pricing-plan-description">{plan.description}</p>
                <ul className="pricing-features">
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
                  className={`pricing-cta ${isPopular ? 'popular-cta' : ''}`}
                  onClick={() => navigate(`/checkout?plan=${plan.tier || plan.name.toLowerCase()}`)}
                >
                  Get Started
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                    <polyline points="12 5 19 12 12 19"></polyline>
                  </svg>
                </button>
                {plan.note && <div className="pricing-note">{plan.note}</div>}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default Pricing;