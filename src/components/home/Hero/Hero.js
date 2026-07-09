import React from 'react';
import './Hero.css';

const Hero = ({ heroData }) => {
  if (!heroData) {
    return (
      <section className="hero-section">
        <div className="container">
          <div className="hero-content">
            <h1>Welcome to EduSpantech</h1>
            <p>Loading...</p>
          </div>
        </div>
      </section>
    );
  }

  const { badge, title, highlight, description, ctaPrimary, ctaSecondary, trustBadges } = heroData;

  return (
    <section className="hero-section">
      <div className="container">
        <div className="hero-content">
          {badge && <span className="hero-badge">{badge}</span>}
          <h1>
            {title}{' '}
            <span className="hero-highlight">{highlight}</span>
          </h1>
          <p className="hero-description">{description}</p>
          <div className="hero-actions">
            <button className="btn-primary">{ctaPrimary || 'Get Started'}</button>
            <button className="btn-secondary">{ctaSecondary || 'Login'}</button>
          </div>
          {trustBadges && (
            <div className="hero-trust">
              {trustBadges.map((badge, index) => (
                <span key={index} className="trust-badge">✓ {badge}</span>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default Hero;