import React from 'react';
import { useNavigate } from 'react-router-dom';
import './Hero.css';

const Hero = ({ heroData }) => {
  const navigate = useNavigate();

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

  const { badge, title, highlight, description, ctaPrimary, ctaSecondary, trustBadges, dashboardPreview } = heroData;

  const getInitials = (name) => {
    return name.split(' ').map(word => word[0]).join('').toUpperCase();
  };

  return (
    <section className="hero-section">
      <div className="container">
        <div className="hero-grid">
          <div className="hero-content">
            {badge && <span className="hero-badge">{badge}</span>}
            <h1>
              {title}{' '}
              <span className="hero-highlight">{highlight}</span>
            </h1>
            <p className="hero-description">{description}</p>
            <div className="hero-actions">
              <button 
                className="btn-primary"
                onClick={() => navigate('/register')}
              >
                {ctaPrimary || 'Get Started Free'}
              </button>
              <button 
                className="btn-secondary"
                onClick={() => navigate('/login')}
              >
                {ctaSecondary || 'Login to Account'}
              </button>
            </div>
            {trustBadges && (
              <div className="hero-trust">
                {trustBadges.map((badge, index) => (
                  <span key={index} className="trust-badge">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                    {badge}
                  </span>
                ))}
              </div>
            )}
          </div>

          {dashboardPreview && (
            <div className="hero-dashboard-preview">
              <div className="dashboard-preview-card">
                <div className="dashboard-sidebar">
                  {dashboardPreview.sidebar?.map((item, index) => (
                    <div key={index} className="sidebar-item">
                      <span className="sidebar-icon">{item.icon}</span>
                      <span className="sidebar-label">{item.label}</span>
                    </div>
                  ))}
                </div>
                <div className="dashboard-main">
                  <div className="dashboard-header">
                    <div className="dashboard-user">
                      <div className="user-avatar">{getInitials(dashboardPreview.welcome?.replace('Welcome back, ', '').replace('!', '') || 'User')}</div>
                      <div>
                        <h4>{dashboardPreview.welcome}</h4>
                        <p>{dashboardPreview.subtitle}</p>
                      </div>
                    </div>
                  </div>
                  <div className="dashboard-course">
                    <div className="course-icon">📐</div>
                    <div className="course-info">
                      <h4>{dashboardPreview.course}</h4>
                      <p>{dashboardPreview.chapter}</p>
                    </div>
                    <div className="course-progress">
                      <div className="progress-bar">
                        <div 
                          className="progress-fill" 
                          style={{ width: `${dashboardPreview.progress || 70}%` }}
                        ></div>
                      </div>
                      <span className="progress-text">{dashboardPreview.progress || 70}%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default Hero;