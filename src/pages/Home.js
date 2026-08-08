// src/pages/Home.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';
import './Home.css';

// ============================================
// MATHEMATICAL ORBIT COMPONENT
// ============================================
const MathematicalOrbit = () => {
  const [isHovered, setIsHovered] = useState(false);
  const mathSymbols = ['∫', 'π', '∑', 'θ', 'Δ', '∞', '√', '∂'];

  return (
    <div 
      className="mathematical-orbit"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Core - Glowing Math Symbol */}
      <div className="core-math">
        <span>∫</span>
      </div>

      {/* Orbit Rings */}
      <div className="orbit-ring orbit-ring-1">
        <div className="orbit-node node-1">{mathSymbols[0]}</div>
        <div className="orbit-node node-2">{mathSymbols[1]}</div>
        <div className="orbit-node node-3">{mathSymbols[2]}</div>
        <div className="orbit-node node-4">{mathSymbols[3]}</div>
      </div>

      <div className="orbit-ring orbit-ring-2">
        <div className="orbit-node node-5">{mathSymbols[4]}</div>
        <div className="orbit-node node-6">{mathSymbols[5]}</div>
        <div className="orbit-node node-7">{mathSymbols[6]}</div>
        <div className="orbit-node node-8">{mathSymbols[7]}</div>
      </div>

      <div className="orbit-ring orbit-ring-3">
        <div className="orbit-node node-9">∞</div>
        <div className="orbit-node node-10">∇</div>
        <div className="orbit-node node-11">α</div>
        <div className="orbit-node node-12">β</div>
      </div>

      {/* Glowing particle trails */}
      <div className="particle-trail"></div>
      <div className="particle-trail-2"></div>
      <div className="particle-trail-3"></div>

      {/* Hover glow effect */}
      {isHovered && <div className="orbit-glow"></div>}
    </div>
  );
};

function Home() {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [failedFlags, setFailedFlags] = useState({});

  // Check authentication status on mount
  useEffect(() => {
    const checkAuth = async () => {
      const accessToken = localStorage.getItem('accessToken');
      if (accessToken) {
        setIsAuthenticated(true);
        try {
          const userData = await authService.getCurrentUserWithSubscription();
          if (userData) {
            setUser(userData);
          } else {
            const fallbackUser = await authService.getCurrentUser();
            if (fallbackUser) {
              setUser(fallbackUser);
            }
          }
        } catch (error) {
          console.error('Failed to get user:', error);
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('user');
          setIsAuthenticated(false);
          setUser(null);
        }
      } else {
        setIsAuthenticated(false);
        setUser(null);
      }
      setLoading(false);
    };
    checkAuth();
  }, []);

  const getUserName = () => {
    if (!user) return 'Student';
    return user.name?.split(' ')[0] || user.name || 'Student';
  };

  const getUserTier = () => {
    if (!user) return 'Silver';
    if (user.tier) return user.tier;
    if (user.subscriptionTier) return user.subscriptionTier;
    if (user.subscription?.tier) return user.subscription.tier;
    return 'Silver';
  };

  // Country list with flagCDN URLs
  const countries = [
    { 
      id: 'za',
      code: 'ZA', 
      name: 'South Africa', 
      description: 'CAPS & IEB (Grades 8–12)',
      levels: ['Grade 8-12', 'Matric', 'University Prep']
    },
    { 
      id: 'us',
      code: 'US', 
      name: 'United States', 
      description: 'Algebra 1/2, Geometry, Pre-Calculus, AP Calculus',
      levels: ['Middle School', 'High School', 'AP']
    },
    { 
      id: 'gb',
      code: 'GB', 
      name: 'United Kingdom', 
      description: 'GCSE & A-Level Mathematics',
      levels: ['Key Stage 4', 'Key Stage 5', 'University Prep']
    },
    { 
      id: 'au',
      code: 'AU', 
      name: 'Australia', 
      description: 'Mathematical Methods & Specialist',
      levels: ['Years 7-10', 'Years 11-12', 'Tertiary Prep']
    },
    { 
      id: 'sg',
      code: 'SG', 
      name: 'Singapore', 
      description: 'GCE O-Level & Junior College H2',
      levels: ['Secondary 1-4', 'Junior College', 'University Prep']
    },
    { 
      id: 'jp',
      code: 'JP', 
      name: 'Japan', 
      description: 'Senior High Mathematics & Vectors',
      levels: ['Junior High', 'Senior High', 'University Prep']
    }
  ];

  const handleFlagError = (countryId) => {
    setFailedFlags(prev => ({ ...prev, [countryId]: true }));
  };

  if (loading) {
    return (
      <div className="home-loading">
        <div className="loader">Loading...</div>
      </div>
    );
  }

  return (
    <div className="home-page">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <div className="hero-badge">🌍 Global Mathematics Platform</div>
          
          {isAuthenticated ? (
            <>
              <h1 className="hero-title">
                Welcome back, <br />
                <span className="highlight">{getUserName()}! 👋</span>
              </h1>
              <p className="hero-subtitle">
                Continue your mathematics journey with your {getUserTier()} Tier plan.
                Your next session is just a click away.
              </p>
            </>
          ) : (
            <>
              <h1 className="hero-title">
                Education for the <br />
                <span className="highlight">love of your life</span> ❤️
              </h1>
              <p className="hero-subtitle">
                From Grade 8 to 2nd-Year Tertiary — world-class mathematics tutoring,
                powered by a 24/7 global infrastructure across 9 AWS regions.
              </p>
            </>
          )}
          
          <div className="hero-actions">
            {isAuthenticated ? (
              <>
                <button 
                  className="btn-primary"
                  onClick={() => navigate('/subjects')}
                >
                  📚 Continue Learning
                </button>
                <button 
                  className="btn-secondary"
                  onClick={() => navigate('/profile')}
                >
                  👤 My Profile
                </button>
              </>
            ) : (
              <>
                <button 
                  className="btn-primary"
                  onClick={() => navigate('/register')}
                >
                  🚀 Get Started — Free Trial
                </button>
                <button 
                  className="btn-secondary"
                  onClick={() => navigate('/login')}
                >
                  🔑 Sign In
                </button>
              </>
            )}
          </div>

          <div className="hero-stats">
            {isAuthenticated ? (
              <>
                <div className="stat-item">
                  <span className="stat-number">{user?.sessionsCompleted || 0}</span>
                  <span className="stat-label-white">Sessions Completed</span>
                </div>
                <div className="stat-divider"></div>
                <div className="stat-item">
                  <span className="stat-number">{user?.streakDays || 0}</span>
                  <span className="stat-label-white">Day Streak</span>
                </div>
                <div className="stat-divider"></div>
                <div className="stat-item">
                  <span className="stat-number">{getUserTier()}</span>
                  <span className="stat-label-white">Current Plan</span>
                </div>
              </>
            ) : (
              <>
                <div className="stat-item">
                  <span className="stat-number">9</span>
                  <span className="stat-label-white">Global Regions</span>
                </div>
                <div className="stat-divider"></div>
                <div className="stat-item">
                  <span className="stat-number">24/7</span>
                  <span className="stat-label-white">Tutor Availability</span>
                </div>
                <div className="stat-divider"></div>
                <div className="stat-item">
                  <span className="stat-number">12</span>
                  <span className="stat-label-white">Expert Tutors</span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* ============================================
            MATHEMATICAL ORBIT - HERO VISUAL
            ============================================ */}
        <div className="hero-visual">
          <MathematicalOrbit />
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <div className="container">
          <div className="section-header">
            <span className="section-tag">
              {isAuthenticated ? 'Your Learning Tools' : 'Why EduSpantech'}
            </span>
            <h2>
              {isAuthenticated 
                ? `Continue mastering mathematics, ${getUserName()}`
                : 'Built for mathematical excellence'
              }
            </h2>
            <p>
              {isAuthenticated
                ? 'Access your personalized learning tools and continue your journey to mathematical mastery.'
                : 'Our platform delivers premium mathematics education through cutting-edge technology and expert South African tutors.'
              }
            </p>
          </div>
          <div className="features-grid">
            <div className="feature-card feature-card-1">
              <div className="feature-icon">🎯</div>
              <h3>24/7 Global Access</h3>
              <p>Learn anytime, anywhere. Our 9-region infrastructure ensures low-latency connections for students worldwide.</p>
              <div className="feature-meta">
                <span>⚡ &lt;30ms latency</span>
              </div>
            </div>
            <div className="feature-card feature-card-2">
              <div className="feature-icon">📐</div>
              <h3>Interactive Whiteboard</h3>
              <p>Real-time collaborative math solving with ultra-low-bandwidth vector rendering — only 15MB per hour.</p>
              <div className="feature-meta">
                <span>🖊️ WebGL powered</span>
              </div>
            </div>
            <div className="feature-card feature-card-3">
              <div className="feature-icon">🌍</div>
              <h3>Global Curriculum Alignment</h3>
              <p>South Africa CAPS/IEB, US Algebra/AP Calculus, UK A-Levels, Australia, Singapore, and more.</p>
              <div className="feature-meta">
                <span>📚 7+ curricula</span>
              </div>
            </div>
            <div className="feature-card feature-card-4">
              <div className="feature-icon">🔒</div>
              <h3>Enterprise-Grade Security</h3>
              <p>AES-256 encryption, zero-knowledge PII masking, and compliance with POPIA &amp; GDPR standards.</p>
              <div className="feature-meta">
                <span>🛡️ GDPR &amp; POPIA</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Actions for Authenticated Users */}
      {isAuthenticated && (
        <section className="quick-actions-section">
          <div className="container">
            <div className="quick-actions-grid">
              <div className="quick-action-card" onClick={() => navigate('/subjects')}>
                <div className="quick-action-icon">📖</div>
                <h4>Browse Subjects</h4>
                <p>Explore available mathematics topics</p>
              </div>
              <div className="quick-action-card" onClick={() => navigate('/tutors')}>
                <div className="quick-action-icon">🧑‍🏫</div>
                <h4>Find a Tutor</h4>
                <p>Connect with expert mathematics tutors</p>
              </div>
              <div className="quick-action-card" onClick={() => navigate('/profile')}>
                <div className="quick-action-icon">⚙️</div>
                <h4>Account Settings</h4>
                <p>Manage your profile and preferences</p>
              </div>
              <div className="quick-action-card" onClick={() => navigate('/resources')}>
                <div className="quick-action-icon">📚</div>
                <h4>Learning Resources</h4>
                <p>Access on-demand math content vaults</p>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Pricing Section - Only show to non-authenticated users */}
      {!isAuthenticated && (
        <section className="pricing-section">
          <div className="container">
            <div className="section-header">
              <span className="section-tag">Flexible Plans</span>
              <h2>Choose your learning path</h2>
              <p>Affordable monthly subscriptions designed for every student's needs.</p>
            </div>
            <div className="pricing-grid">
              <div className="pricing-card pricing-silver">
                <div className="pricing-tier">Silver</div>
                <div className="pricing-price">
                  R100 <span>/ month</span>
                </div>
                <p className="pricing-description">Self-study with on-demand content</p>
                <ul className="pricing-features">
                  <li>✅ On-demand whiteboard archives</li>
                  <li>✅ Step-by-step mathematical proofs</li>
                  <li>✅ Video-free presentation playback</li>
                  <li>✅ Topic-based math domain vaults</li>
                </ul>
                <button className="btn-outline" onClick={() => navigate('/register')}>
                  Get Started
                </button>
              </div>
              <div className="pricing-card pricing-gold featured">
                <div className="pricing-badge">Most Popular</div>
                <div className="pricing-tier">Gold</div>
                <div className="pricing-price">
                  R200 <span>/ month</span>
                </div>
                <p className="pricing-description">Live evening homework clinics</p>
                <ul className="pricing-features">
                  <li>✅ All Silver features</li>
                  <li>✅ Live drop-in evening clinics</li>
                  <li>✅ Real-time interactive canvas</li>
                  <li>✅ Regional evening windows (16:00-23:00)</li>
                </ul>
                <button className="btn-primary" onClick={() => navigate('/register')}>
                  🚀 Get Started
                </button>
              </div>
              <div className="pricing-card pricing-platinum">
                <div className="pricing-tier">Platinum</div>
                <div className="pricing-price">
                  R350 <span>/ month</span>
                </div>
                <p className="pricing-description">Premium priority access &amp; weekend clinics</p>
                <ul className="pricing-features">
                  <li>✅ All Gold features</li>
                  <li>✅ Weekend math clinics</li>
                  <li>✅ Queue-bypass privileges</li>
                  <li>✅ Priority during test weeks</li>
                </ul>
                <button className="btn-outline" onClick={() => navigate('/register')}>
                  Get Started
                </button>
              </div>
            </div>
            <p className="pricing-note">* Multi-currency pricing available: $6–$20 / R$25–R$90</p>
          </div>
        </section>
      )}

      {/* Progress Section for Authenticated Users */}
      {isAuthenticated && (
        <section className="progress-section">
          <div className="container">
            <div className="progress-content">
              <div className="progress-text">
                <span className="section-tag">Your Progress</span>
                <h2>Track your mathematical journey</h2>
                <p>Stay motivated with real-time progress tracking and personalized learning recommendations.</p>
              </div>
              <div className="progress-stats">
                <div className="progress-stat">
                  <div className="progress-circle" style={{ '--progress': '75%' }}>
                    <span>75%</span>
                  </div>
                  <p>Algebra Mastery</p>
                </div>
                <div className="progress-stat">
                  <div className="progress-circle" style={{ '--progress': '45%' }}>
                    <span>45%</span>
                  </div>
                  <p>Calculus Progress</p>
                </div>
                <div className="progress-stat">
                  <div className="progress-circle" style={{ '--progress': '90%' }}>
                    <span>90%</span>
                  </div>
                  <p>Geometry Complete</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Curriculum Section */}
      <section className="curriculum-section">
        <div className="container">
          <div className="section-header">
            <span className="section-tag">Global Reach</span>
            <h2>Mathematics without borders</h2>
            <p>Our South African tutors are trained to teach multiple international curricula seamlessly.</p>
          </div>
          <div className="curriculum-grid">
            {countries.map((country) => {
              const flagUrl = `https://flagcdn.com/w80/${country.id}.png`;
              const showFallback = failedFlags[country.id];
              
              return (
                <div key={country.id} className="curriculum-item">
                  {!showFallback ? (
                    <img 
                      src={flagUrl}
                      alt={`${country.name} flag`}
                      className="curriculum-flag-img"
                      onError={() => handleFlagError(country.id)}
                      loading="lazy"
                    />
                  ) : (
                    <div className="curriculum-flag-fallback">{country.code}</div>
                  )}
                  <h4>{country.name}</h4>
                  <p>{country.description}</p>
                  <div className="curriculum-levels">
                    {country.levels?.map((level, idx) => (
                      <span key={idx} className="level-tag">{level}</span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Infrastructure Section */}
      <section className="infrastructure-section">
        <div className="container">
          <div className="infrastructure-content">
            <div className="infrastructure-text">
              <span className="section-tag">Powered by AWS</span>
              <h2>9-region global infrastructure</h2>
              <p>Our platform spans 9 AWS regions worldwide, ensuring low-latency connections and 99.99% availability.</p>
              <ul className="infrastructure-list">
                <li>🇿🇦 Cape Town (af-south-1) — Primary</li>
                <li>🇧🇷 São Paulo (sa-east-1)</li>
                <li>🇸🇬 Singapore (ap-southeast-1)</li>
                <li>🇮🇪 Ireland (eu-west-1)</li>
                <li>🇺🇸 N. Virginia (us-east-1)</li>
                <li>🇺🇸 Oregon (us-west-2)</li>
                <li>🇯🇵 Tokyo (ap-northeast-1)</li>
                <li>🇮🇳 Mumbai (ap-south-1)</li>
                <li>🇦🇺 Sydney (ap-southeast-2)</li>
              </ul>
            </div>
            <div className="infrastructure-map">
              <div className="map-grid">
                {[1,2,3,4,5,6,7,8,9].map((i) => (
                  <div key={i} className="map-node" style={{ '--delay': i * 0.1 }}>
                    <span className="map-pulse"></span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="container">
          <div className="cta-content">
            {isAuthenticated ? (
              <>
                <h2>Ready for your next <br />mathematics session?</h2>
                <p>Continue your learning journey with your personalized tutor matching.</p>
                <button className="btn-primary btn-large" onClick={() => navigate('/subjects')}>
                  📚 Browse Subjects
                </button>
              </>
            ) : (
              <>
                <h2>Ready to make mathematics <br />the love of your life?</h2>
                <p>Join thousands of students already learning with EduSpantech.</p>
                <button className="btn-primary btn-large" onClick={() => navigate('/register')}>
                  🚀 Start Your Free Trial
                </button>
                <p className="cta-small">No credit card required • 7-day free trial</p>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="container">
          <div className="footer-grid">
            <div className="footer-brand">
              <h3>📚 EduSpantech</h3>
              <p>Education for the love of your life ❤️</p>
              <p className="footer-tagline">From Grade 8 to 2nd-Year Tertiary Success</p>
            </div>
            <div className="footer-links">
              <h4>Platform</h4>
              <a href="/subjects">Subjects</a>
              <a href="/curriculum">Curriculum</a>
              <a href="/tutors">Tutors</a>
              <a href="/pricing">Pricing</a>
            </div>
            <div className="footer-links">
              <h4>Support</h4>
              <a href="/help">Help Center</a>
              <a href="/contact">Contact Us</a>
              <a href="/privacy">Privacy Policy</a>
              <a href="/terms">Terms of Service</a>
            </div>
            <div className="footer-links">
              <h4>Connect</h4>
              <a href="https://twitter.com/eduspantech">Twitter</a>
              <a href="https://linkedin.com/company/eduspantech">LinkedIn</a>
              <a href="https://youtube.com/@eduspantech">YouTube</a>
              <a href="https://instagram.com/eduspantech">Instagram</a>
            </div>
          </div>
          <div className="footer-bottom">
            <p>© 2026 EduSpantech — Education for the love of your life ❤️</p>
            <p className="footer-compliance">POPIA • GDPR • CPA Compliant</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default Home;