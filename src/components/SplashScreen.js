// src/components/SplashScreen.js
import React, { useState, useEffect } from 'react';
import logo from '../assets/EduspanLogo.png';
import './SplashScreen.css';

const SplashScreen = ({ isReady }) => {
  const [progress, setProgress] = useState(0);
  const [isDone, setIsDone] = useState(false);

  // Fake progress bar up to 90%
  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) return prev;
        return prev + Math.random() * 8;
      });
    }, 150);
    return () => clearInterval(interval);
  }, []);

  // When app is ready, fill to 100% and fade out
  useEffect(() => {
    if (isReady) {
      setProgress(100);
      const timer = setTimeout(() => {
        setIsDone(true);
      }, 400); // Wait for fade-out CSS
      return () => clearTimeout(timer);
    }
  }, [isReady]);

  if (isDone) return null;

  return (
    <div className={`splash-container ${isReady ? 'splash-fade-out' : ''}`}>
      <div className="splash-bg-glow" />
      <div className="splash-content">
        
        {/* Bouncing / Breathing Logo */}
        <div className="splash-logo-wrapper">
          <img src={logo} alt="EduSpantech Logo" className="splash-logo" />
        </div>
        
        <h1 className="splash-title">EduSpantech</h1>
        <p className="splash-tagline">Education for the love of my life</p>
        
        <div className="splash-loader-track">
          <div 
            className="splash-loader-fill" 
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </div>
      </div>
    </div>
  );
};

export default SplashScreen;
