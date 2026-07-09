import React, { useState, useEffect, useRef } from 'react';
import './Features.css';

const Features = ({ featuresData }) => {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef(null);

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

  if (!featuresData) {
    return (
      <section className="features-section" ref={sectionRef}>
        <div className="container">
          <div className="features-header">
            <h2>Features</h2>
            <p>Loading...</p>
          </div>
        </div>
      </section>
    );
  }

  const { title, subtitle, items } = featuresData;

  return (
    <section className="features-section" ref={sectionRef}>
      <div className="container">
        <div className="features-header">
          <span className="features-badge">✨ Why Choose Us</span>
          <h2>{title || 'Interactive Learning at Your Fingertips'}</h2>
          <p>{subtitle || 'Everything you need to master mathematics'}</p>
        </div>
        <div className={`features-grid ${isVisible ? 'visible' : ''}`}>
          {items?.map((feature, index) => (
            <div 
              key={feature.id} 
              className="feature-card"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="feature-icon-wrapper">
                <div className="feature-icon">{feature.icon}</div>
              </div>
              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
              <div className="feature-hover-effect"></div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;