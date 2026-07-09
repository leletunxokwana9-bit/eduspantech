import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useHomeData } from '../hooks/useHomeData';
import './Pricing.css';

const Pricing = () => {
  const navigate = useNavigate();
  const { data, loading, error } = useHomeData();

  if (loading) return <div className="pricing-page-loading">Loading pricing...</div>;
  if (error) return <div className="pricing-page-error">Error loading pricing</div>;
  if (!data) return <div className="pricing-page-empty">No pricing available</div>;

  const plans = data.pricing?.items || [];

  const handleGetStarted = (plan) => {
    navigate(`/checkout?plan=${plan.tier.toLowerCase()}`);
  };

  return (
    <div className="pricing-page">
      <div className="pricing-page-header">
        <h1>💰 {data.pricing?.title || 'Choose Your Plan'}</h1>
        <p>{data.pricing?.subtitle || 'Flexible subscription options for every learner'}</p>
      </div>

      <div className="pricing-page-grid">
        {plans.map((plan) => (
          <div key={plan.id} className={`pricing-page-card ${plan.popular ? 'popular' : ''}`}>
            {plan.popular && <div className="pricing-page-popular-badge">🌟 Most Popular</div>}
            <div className="pricing-page-tier">{plan.tier}</div>
            <h3>{plan.name}</h3>
            <p className="pricing-page-description">{plan.description}</p>
            <div className="pricing-page-price">
              <span className="price-amount">{plan.price}</span>
              <span className="price-period">{plan.period}</span>
            </div>
            <ul className="pricing-page-features">
              {plan.features?.map((feature, idx) => (
                <li key={idx}>
                  <span className="check-icon">✓</span> {feature}
                </li>
              ))}
            </ul>
            <button 
              className={`pricing-page-btn ${plan.popular ? 'primary' : 'secondary'}`}
              onClick={() => handleGetStarted(plan)}
            >
              Get Started
            </button>
            <p className="pricing-page-note">No credit card required</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Pricing;