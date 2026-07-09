import React from 'react';
import { useNavigate } from 'react-router-dom';
import './CTA.css';

const CTA = ({ ctaData }) => {
  const navigate = useNavigate();

  if (!ctaData) {
    return (
      <section className="cta-section">
        <div className="container">
          <div className="cta-content">
            <h2>Ready to Start?</h2>
            <button onClick={() => navigate('/pricing')}>Get Started</button>
          </div>
        </div>
      </section>
    );
  }

  const { title, description, primaryText, secondaryText, note } = ctaData;

  return (
    <section className="cta-section">
      <div className="container">
        <div className="cta-content">
          <div className="cta-icon">🚀</div>
          <h2>{title || 'Ready to Master Mathematics?'}</h2>
          <p>{description || 'Join thousands of students already learning with EduSpantech'}</p>
          <div className="cta-actions">
            <button 
              className="btn-primary"
              onClick={() => navigate('/register')}
            >
              {primaryText || 'Start Free Trial →'}
            </button>
            <button 
              className="btn-secondary"
              onClick={() => navigate('/pricing')}
            >
              {secondaryText || 'View Plans'}
            </button>
          </div>
          {note && <p className="cta-note">{note}</p>}
        </div>
      </div>
    </section>
  );
};

// THIS MUST BE HERE
export default CTA;