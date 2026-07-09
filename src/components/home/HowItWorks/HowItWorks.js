import React, { useState, useEffect, useRef } from 'react';
import './HowItWorks.css';

const HowItWorks = ({ howItWorksData }) => {
  const [activeStep, setActiveStep] = useState(0);
  const sectionRef = useRef(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => {
      if (sectionRef.current) {
        observer.unobserve(sectionRef.current);
      }
    };
  }, []);

  if (!howItWorksData) {
    return (
      <section className="howitworks-section" ref={sectionRef}>
        <div className="container">
          <div className="howitworks-header">
            <h2>How It Works</h2>
            <p>Loading...</p>
          </div>
        </div>
      </section>
    );
  }

  const { badge, title, subtitle, steps } = howItWorksData;

  return (
    <section className="howitworks-section" ref={sectionRef}>
      <div className="container">
        <div className="howitworks-header">
          {badge && <span className="howitworks-badge">{badge}</span>}
          <h2>{title || 'Start Learning in 3 Simple Steps'}</h2>
          <p>{subtitle || 'Your path to mathematics mastery'}</p>
        </div>
        <div className="howitworks-container">
          <div className="howitworks-steps">
            {steps?.map((step, index) => (
              <div 
                key={step.id} 
                className={`step-item ${index === activeStep ? 'active' : ''} ${isVisible ? 'visible' : ''}`}
                onMouseEnter={() => setActiveStep(index)}
                style={{ animationDelay: `${index * 0.2}s` }}
              >
                <div className="step-number-wrapper">
                  <div className="step-number">{step.id}</div>
                  {index < steps.length - 1 && <div className="step-connector"></div>}
                </div>
                <div className="step-content">
                  <div className="step-icon">{['🎯', '📋', '🚀'][index]}</div>
                  <h3>{step.step}</h3>
                  <p>{step.description}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="howitworks-visual">
            <div className="visual-placeholder">
              <div className="visual-icon">📚</div>
              <p>Start your journey today</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

// THIS MUST BE HERE
export default HowItWorks;