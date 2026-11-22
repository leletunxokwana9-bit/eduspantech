import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';
import { supabase } from '../services/supabaseClient';
import Pricing from '../components/home/Pricing/Pricing';
import RegionsMap from '../components/RegionsMap';
import './Home.css';

// ===== Social brand icons (real PNGs, not emojis) =====
import facebookIcon from '../assets/social/facebook-round-color-icon.png';
import xIcon from '../assets/social/x-social-media-black-icon.png';
import linkedinIcon from '../assets/social/linkedin-app-icon.png';
import instagramIcon from '../assets/social/ig-instagram-icon.png';
import tiktokIcon from '../assets/social/tiktok-rounded-square-white-icon.png';

// ============================================
// MATHEMATICAL ORBIT COMPONENT
// Retained for the tutor homepage.
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
      <div className="orbit-stage">
        <div className="orbit-depth-layer orbit-depth-back"></div>
        <div className="orbit-depth-layer orbit-depth-mid"></div>

        <div className="core-math">
          <div className="core-inner">
            <span>∫</span>
          </div>
          <div className="core-halo"></div>
          <div className="core-rings">
            <span className="core-ring core-ring-1"></span>
            <span className="core-ring core-ring-2"></span>
          </div>
        </div>

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

        <div className="particle-trail"></div>
        <div className="particle-trail-2"></div>
        <div className="particle-trail-3"></div>

        {isHovered && <div className="orbit-glow"></div>}
      </div>
    </div>
  );
};

// ============================================
// ENHANCED FOOTER COMPONENT
// ============================================
const EnhancedFooter = ({ siteConfig, footerLinks }) => {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const [selectedRegion, setSelectedRegion] = useState('Global');

  const groupedLinks = footerLinks.reduce((acc, link) => {
    if (!acc[link.category]) acc[link.category] = [];
    acc[link.category].push(link);
    return acc;
  }, {});

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (email) {
      setSubscribed(true);
      setEmail('');
      setTimeout(() => setSubscribed(false), 3000);
    }
  };

  const relatedSubjects = [
    { label: 'Algebra & Geometry', url: '/subjects/algebra-geometry' },
    { label: 'Calculus & Trigonometry', url: '/subjects/calculus-trig' },
    { label: 'Statistics & Probability', url: '/subjects/stat-prob' },
    { label: 'Math & Science', url: '/subjects/math-science' },
    { label: 'Exam Prep & Revision', url: '/subjects/exam-prep' },
    { label: 'Tertiary Math', url: '/subjects/tertiary-math' },
  ];

  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer-enhanced">
      {/* ===== TOP BAR ===== */}
      <div className="footer-top-bar">
        <div className="container">
          <div className="top-bar-content">
            <div className="top-bar-left">
              <span className="live-dot"></span>
              <span className="top-bar-text">
                🎓 <strong>12 Expert Tutors</strong> online now — Ready to help you learn!
              </span>
            </div>
            <div className="top-bar-right">
              <select
                className="region-select"
                value={selectedRegion}
                onChange={(e) => setSelectedRegion(e.target.value)}
              >
                <option value="Global">🌍 Global</option>
                <option value="ZA">🇿🇦 South Africa</option>
                <option value="US">🇺🇸 United States</option>
                <option value="GB">🇬🇧 United Kingdom</option>
                <option value="AU">🇦🇺 Australia</option>
                <option value="SG">🇸🇬 Singapore</option>
              </select>
              <span className="region-tag">
                {selectedRegion === 'Global' ? '🌍 9 Regions' : '📡 Live'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ===== MAIN FOOTER GRID ===== */}
      <div className="footer-main">
        <div className="container">
          <div className="footer-grid">

            <div className="footer-col footer-brand-col">
              <div className="footer-brand">
                <div className="brand-logo">
                  <span className="brand-icon">∫</span>
                  <span className="brand-name">{siteConfig.site_name || 'EduSpantech'}</span>
                </div>
                <p className="brand-tagline">
                  {siteConfig.site_tagline || 'Education for the love of my life'}
                </p>
                <p className="brand-subtagline">
                  {siteConfig.site_subtagline || 'From Grade 7 to 2nd-Year Tertiary Success'}
                </p>
                <div className="brand-contact">
                  {siteConfig.contact_email && (
                    <a href={`mailto:${siteConfig.contact_email}`} className="contact-link">
                      📧 {siteConfig.contact_email}
                    </a>
                  )}
                  {siteConfig.contact_phone && (
                    <a href={`tel:${siteConfig.contact_phone}`} className="contact-link">
                      📞 {siteConfig.contact_phone}
                    </a>
                  )}
                </div>
                {siteConfig.contact_address && (
                  <p className="brand-address">📍 {siteConfig.contact_address}</p>
                )}
              </div>

              <div className="footer-newsletter">
                <h4>📚 Get Weekly Learning Tips</h4>
                <p>Join 2,500+ students getting exam hacks and tutor updates</p>
                <form className="newsletter-form" onSubmit={handleSubscribe}>
                  <div className="form-group">
                    <input
                      type="email"
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                    <button type="submit">
                      {subscribed ? '✅' : '📩'}
                    </button>
                  </div>
                  <p className="form-note">No spam. Unsubscribe anytime. 🔒</p>
                </form>
              </div>
            </div>

            <div className="footer-col footer-specs">
              <h4>🎯 Tutor Specialties</h4>
              <div className="specs-grid">
                <span className="spec-tag">🎓 Grade 8-9</span>
                <span className="spec-tag">📚 Grade 10-11</span>
                <span className="spec-tag">🏆 Matric/AP</span>
                <span className="spec-tag">🏛️ University</span>
                <span className="spec-tag">🌍 Global Curricula</span>
                <span className="spec-tag">🧑‍🏫 Expert Tutors</span>
                <span className="spec-tag">📐 Geometry</span>
                <span className="spec-tag">⚡ Calculus</span>
                <span className="spec-tag">📊 Statistics</span>
                <span className="spec-tag">🧮 Algebra</span>
                <span className="spec-tag">🧪 Trigonometry</span>
                <span className="spec-tag">📈 Probability</span>
              </div>
            </div>

            <div className="footer-col footer-sessions">
              <h4>📖 What We Teach</h4>
              <div className="sessions-grid">
                <div className="session-group">
                  <span className="session-label">Core Math:</span>
                  <span className="session-tag">Algebra</span>
                  <span className="session-tag">Geometry</span>
                  <span className="session-tag">Calculus</span>
                </div>
                <div className="session-group">
                  <span className="session-label">Advanced:</span>
                  <span className="session-tag">Trigonometry</span>
                  <span className="session-tag">Statistics</span>
                  <span className="session-tag">Probability</span>
                </div>
                <div className="session-group">
                  <span className="session-label">Exam Prep:</span>
                  <span className="session-tag">Matric</span>
                  <span className="session-tag">AP Calculus</span>
                  <span className="session-tag">A-Levels</span>
                </div>
                <div className="session-group">
                  <span className="session-label">Tertiary:</span>
                  <span className="session-tag">Linear Algebra</span>
                  <span className="session-tag">Differential Eq.</span>
                  <span className="session-tag">Discrete Math</span>
                </div>
              </div>
            </div>

            <div className="footer-col footer-related">
              <h4>🔗 Related Subjects</h4>
              <div className="related-grid">
                {relatedSubjects.map((subject, idx) => (
                  <a key={idx} href={subject.url} className="related-tag">
                    {subject.label}
                  </a>
                ))}
              </div>
            </div>
          </div>

          {/* ===== SOCIAL CONNECT — real brand icons ===== */}
          <div className="footer-social-section">
            <div className="social-grid">
              <a href={siteConfig.social_facebook} target="_blank" rel="noopener noreferrer" className="social-link" title="Facebook">
                <img src={facebookIcon} alt="Facebook" className="social-img" />
                <span className="social-label">Facebook</span>
              </a>
              <a href={siteConfig.social_twitter} target="_blank" rel="noopener noreferrer" className="social-link" title="X (Twitter)">
                <img src={xIcon} alt="X" className="social-img" />
                <span className="social-label">X</span>
              </a>
              <a href={siteConfig.social_linkedin} target="_blank" rel="noopener noreferrer" className="social-link" title="LinkedIn">
                <img src={linkedinIcon} alt="LinkedIn" className="social-img" />
                <span className="social-label">LinkedIn</span>
              </a>
              <a href={siteConfig.social_instagram} target="_blank" rel="noopener noreferrer" className="social-link" title="Instagram">
                <img src={instagramIcon} alt="Instagram" className="social-img" />
                <span className="social-label">Instagram</span>
              </a>
              <a href={siteConfig.social_tiktok || 'https://tiktok.com/@eduspantech'} target="_blank" rel="noopener noreferrer" className="social-link" title="TikTok">
                <img src={tiktokIcon} alt="TikTok" className="social-img" />
                <span className="social-label">TikTok</span>
              </a>
            </div>
          </div>

          {groupedLinks.connect && groupedLinks.connect.length > 0 && (
            <div className="footer-social-section" style={{ borderTop: 'none', marginTop: -8 }}>
              <div className="social-grid">
                {groupedLinks.connect.map((link) => (
                  <a key={link.id} href={link.url} target="_blank" rel="noopener noreferrer" className="social-link" title={link.label}>
                    <span className="social-label">{link.label}</span>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ===== CTA BANNER ===== */}
      <div className="footer-cta-banner">
        <div className="container">
          <div className="cta-banner-content">
            <div className="cta-banner-text">
              <span className="cta-banner-icon">🎯</span>
              <div>
                <h4>Ready to Excel?</h4>
                <p>Get matched with the perfect tutor for your learning style.</p>
              </div>
            </div>
            <div className="cta-banner-buttons">
              <a href="/register" className="cta-btn-primary">
                Start Free Trial <span>→</span>
              </a>
              <a href="/tutors" className="cta-btn-secondary">
                Browse Tutors
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* ===== BOTTOM BAR ===== */}
      <div className="footer-bottom">
        <div className="container">
          <div className="bottom-bar-content">
            <div className="bottom-bar-left">
              <p className="copyright">
                © {currentYear} {siteConfig.site_name || 'EduSpantech'}
              </p>
              <p className="copyright-tagline">
                {siteConfig.site_tagline || 'Education for the love of my life'}
              </p>
            </div>

            <div className="bottom-bar-center">
              <div className="compliance-badges">
                {siteConfig.compliance_text && (
                  <span className="compliance-badge">🛡️ {siteConfig.compliance_text}</span>
                )}
                <span className="compliance-badge">🔒 SSL Encrypted</span>
                <span className="compliance-badge">✅ Verified Tutors</span>
              </div>
            </div>

            <div className="bottom-bar-right">
              <div className="footer-legal-links">
                <a href="/privacy">Privacy</a>
                <span className="divider">|</span>
                <a href="/terms">Terms</a>
                <span className="divider">|</span>
                <a href="/cookies">Cookies</a>
                <span className="divider">|</span>
                <a href="/accessibility">♿ Accessibility</a>
                <span className="divider">|</span>
                <a href="/support">Help</a>
              </div>
            </div>
          </div>

          <div className="footer-legal-statement">
            <p>
              All tutors appearing on this site have contractually confirmed to us that they are qualified educators
              with verified credentials and appropriate teaching certifications.
            </p>
            <p className="legal-statement-small">
              {siteConfig.compliance_text || 'POPIA • GDPR • CPA Compliant'} — EduSpantech is committed to educational excellence and student privacy.
            </p>
          </div>

          <div className="footer-trust-badges">
            <span className="trust-badge">📚 Quality Education</span>
            <span className="trust-badge">🎓 Expert Tutors</span>
            <span className="trust-badge">🔒 Secure Platform</span>
            <span className="trust-badge">🌍 Global Reach</span>
            <span className="trust-badge">⭐ 4.9/5 Rating</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

// ============================================
// MAIN HOME COMPONENT
// ============================================
function Home() {
  const navigate = useNavigate();

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [failedFlags, setFailedFlags] = useState({});
  const [isTutor, setIsTutor] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  // Homepage hero image loaded from the separate home-hero bucket.
  const [homeHeroImage, setHomeHeroImage] = useState('');

  const [tutorStats, setTutorStats] = useState({
    totalSessions: 0,
    studentsTaught: 0,
    totalEarnings: 0,
    avgRating: 0
  });

  const [siteConfig, setSiteConfig] = useState({
    site_name: 'EduSpantech',
    site_tagline: 'Education for the love of my life',
    site_subtagline: 'From Grade 8 to 2nd-Year Tertiary Success',
    social_facebook: 'https://web.facebook.com/profile.php?id=61593114256334',
    social_instagram: 'https://instagram.com/eduspantech',
    social_twitter: 'https://twitter.com/eduspantech',
    social_linkedin: 'https://linkedin.com/company/eduspantech',
    social_youtube: 'https://youtube.com/@eduspantech',
    social_tiktok: 'https://tiktok.com/@eduspantech',
    contact_email: 'info@eduspantech.com',
    contact_phone: '+27 79 376 4985',
    contact_address: '19 Dock Road, Cape Town, 8001',
    compliance_text: 'POPIA • GDPR • CPA Compliant'
  });

  const [footerLinks, setFooterLinks] = useState([]);

  const checkIsAdmin = (userData) => {
    if (!userData) return false;
    return (
      userData.is_admin === true ||
      userData.is_super_admin === true ||
      userData.role === 'admin' ||
      userData.role === 'ADMIN'
    );
  };

  const checkIsTutor = (userData) => {
    if (!userData) return false;
    if (checkIsAdmin(userData)) return false;
    return (
      userData.is_tutor === true ||
      userData.role === 'tutor' ||
      userData.role === 'TUTOR'
    );
  };

  // ============================================
  // FETCH ACTIVE HOMEPAGE HERO IMAGE
  // Uses the backend endpoint for the home-hero bucket.
  // ============================================
  useEffect(() => {
    const fetchHomeHeroImage = async () => {
      try {
        const API_URL =
          process.env.REACT_APP_API_URL ||
          'https://eduspantech-backend.onrender.com/api';

        const response = await fetch(`${API_URL}/home-hero/active`);

        if (!response.ok) {
          throw new Error('Unable to fetch homepage hero image');
        }

        const result = await response.json();

        const imageUrl =
          result.image?.public_url ||
          result.image?.image_url ||
          result.image?.url ||
          result.public_url ||
          result.image_url ||
          result.url;

        if (result.success && imageUrl) {
          setHomeHeroImage(imageUrl);
        }
      } catch (error) {
        console.error('Failed to load homepage hero image:', error);
      }
    };

    fetchHomeHeroImage();
  }, []);

  useEffect(() => {
    const fetchSiteData = async () => {
      try {
        const { data: configData, error: configError } = await supabase
          .from('site_config')
          .select('config_key, config_value');

        if (!configError && configData) {
          const configObj = {};
          configData.forEach(item => {
            configObj[item.config_key] = item.config_value;
          });
          setSiteConfig(prev => ({ ...prev, ...configObj }));
        }

        const { data: linksData, error: linksError } = await supabase
          .from('footer_links')
          .select('*')
          .eq('is_active', true)
          .order('sort_order', { ascending: true });

        if (!linksError && linksData) {
          setFooterLinks(linksData);
        }
      } catch (error) {
        console.error('Failed to fetch site data:', error);
      }
    };

    fetchSiteData();
  }, []);

  useEffect(() => {
    const checkAuth = async () => {
      const accessToken = localStorage.getItem('accessToken');

      if (accessToken) {
        setIsAuthenticated(true);

        try {
          let resolvedUser = await authService.getCurrentUserWithSubscription();

          if (!resolvedUser) {
            resolvedUser = await authService.getCurrentUser();
          }

          if (resolvedUser) {
            setUser(resolvedUser);

            const adminAccount = checkIsAdmin(resolvedUser);
            const tutorAccount = checkIsTutor(resolvedUser);

            setIsAdmin(adminAccount);
            setIsTutor(tutorAccount);

            if (tutorAccount) {
              await fetchTutorStats();
            }
          } else {
            setIsAdmin(false);
            setIsTutor(false);
          }
        } catch (error) {
          console.error('Failed to get user:', error);
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('user');
          setIsAuthenticated(false);
          setUser(null);
          setIsTutor(false);
          setIsAdmin(false);
        }
      } else {
        setIsAuthenticated(false);
        setUser(null);
        setIsTutor(false);
        setIsAdmin(false);
      }

      setLoading(false);
    };

    checkAuth();
  }, []);

  const fetchTutorStats = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) return;

      const response = await fetch(
        `${process.env.REACT_APP_API_URL || 'https://eduspantech-backend.onrender.com/api'}/earnings`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (response.ok) {
        const data = await response.json();

        if (data.success && data.earnings) {
          setTutorStats({
            totalSessions: data.earnings.sessionsCount || 0,
            studentsTaught: data.earnings.studentCount || 0,
            totalEarnings: data.earnings.total || 0,
            avgRating: data.earnings.avgRating || 0
          });
        }
      }
    } catch (error) {
      console.error('Failed to fetch tutor stats:', error);
    }
  };

  const getUserName = () => {
    if (!user) return 'Student';
    return user.name?.split(' ')[0] || user.name || 'Student';
  };

  const getUserTier = () => {
    if (!user) return 'Free';
    if (user.tier) return user.tier;
    if (user.subscriptionTier) return user.subscriptionTier;
    if (user.subscription?.tier) return user.subscription.tier;
    return 'Free';
  };

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

  if (isAuthenticated && isAdmin) {
    navigate('/admin/dashboard', { replace: true });

    return (
      <div className="home-loading">
        <div className="loader">Redirecting to admin panel…</div>
      </div>
    );
  }

  // ============================================
  // TUTOR HOME VIEW
  // Existing tutor design remains unchanged.
  // ============================================
  if (isAuthenticated && isTutor) {
    return (
      <div className="home-page">
        <section className="hero-section">
          <div className="hero-content">
            <h1 className="hero-title">
              Welcome back, <br />
              <span className="highlight">{getUserName()}! 👨‍🏫</span>
            </h1>

            <p className="hero-subtitle">
              Your tutoring dashboard is ready. Help students master their subjects today.
            </p>

            <div className="action-actions">
              <button
                className="action-cta"
                onClick={() => navigate('/tutor/dashboard')}
              >
                <span className="action-cta-left">
                  <span className="icon">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="3" width="7" height="9" rx="2"/>
                      <rect x="14" y="3" width="7" height="5" rx="2"/>
                      <rect x="14" y="12" width="7" height="9" rx="2"/>
                      <rect x="3" y="16" width="7" height="5" rx="2"/>
                    </svg>
                  </span>
                  <span>
                    <div className="label">Go to Dashboard</div>
                    <div className="sub">Students, progress and today's overview</div>
                  </span>
                </span>
                <span className="arrow">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12h14M13 6l6 6-6 6"/>
                  </svg>
                </span>
              </button>

              <button
                className="action-card earnings"
                onClick={() => navigate('/tutor/earnings')}
              >
                <span className="tile">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 17l6-6 4 4 8-8"/>
                    <path d="M15 7h6v6"/>
                  </svg>
                </span>
                <span className="text">
                  <div className="label">View Earnings</div>
                  <div className="sub">Payouts, history and monthly totals</div>
                </span>
                <svg className="chev" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 6l6 6-6 6"/>
                </svg>
              </button>

              <button
                className="action-card sessions"
                onClick={() => navigate('/my-sessions')}
              >
                <span className="tile">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="4" width="18" height="17" rx="3"/>
                    <path d="M8 2v4M16 2v4M3 10h18"/>
                    <circle cx="12" cy="15" r="1.4" fill="currentColor"/>
                  </svg>
                </span>
                <span className="text">
                  <div className="label">My Sessions</div>
                  <div className="sub">Upcoming lessons and past bookings</div>
                </span>
                <svg className="chev" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 6l6 6-6 6"/>
                </svg>
              </button>

              <button
                className="action-card team"
                onClick={() => navigate('/profile')}
              >
                <span className="tile">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="9" cy="8" r="3.5"/>
                    <path d="M2.5 20c0-3.6 2.9-6 6.5-6s6.5 2.4 6.5 6"/>
                    <path d="M16 4.6a3.5 3.5 0 010 6.8M18 14.3c2.2.6 3.5 2.4 3.5 5.2"/>
                  </svg>
                </span>
                <span className="text">
                  <div className="label">Update Profile</div>
                  <div className="sub">Keep your tutor profile current</div>
                </span>
                <svg className="chev" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 6l6 6-6 6"/>
                </svg>
              </button>
            </div>

            <div className="hero-stats">
              <div className="stat-item">
                <span className="stat-number">{tutorStats.totalSessions}</span>
                <span className="stat-label-white">Sessions</span>
              </div>
              <div className="stat-divider"></div>
              <div className="stat-item">
                <span className="stat-number">{tutorStats.studentsTaught}</span>
                <span className="stat-label-white">Students</span>
              </div>
              <div className="stat-divider"></div>
              <div className="stat-item">
                <span className="stat-number">R{tutorStats.totalEarnings.toFixed(2)}</span>
                <span className="stat-label-white">Earnings</span>
              </div>
              <div className="stat-divider"></div>
              <div className="stat-item">
                <span className="stat-number">{tutorStats.avgRating}⭐</span>
                <span className="stat-label-white">Rating</span>
              </div>
            </div>
          </div>

          <div className="hero-visual">
            <MathematicalOrbit />
          </div>
        </section>

        <section className="quick-actions-section">
          <div className="container">
            <div className="section-header">
              <span className="section-tag">🚀 Quick Actions</span>
              <h2>Manage your tutoring</h2>
              <p>Everything you need to manage your tutoring business</p>
            </div>

            <div className="action-actions" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))' }}>
              <button className="action-card earnings" onClick={() => navigate('/tutor/students')}>
                <span className="tile">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
                    <circle cx="9" cy="7" r="4"/>
                    <path d="M23 21v-2a4 4 0 00-3-3.87"/>
                  </svg>
                </span>
                <span className="text">
                  <div className="label">View Students</div>
                  <div className="sub">See all students you're teaching</div>
                </span>
                <svg className="chev" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 6l6 6-6 6"/>
                </svg>
              </button>

              <button className="action-card sessions" onClick={() => navigate('/tutor/earnings')}>
                <span className="tile">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 17l6-6 4 4 8-8"/>
                    <path d="M15 7h6v6"/>
                  </svg>
                </span>
                <span className="text">
                  <div className="label">Check Earnings</div>
                  <div className="sub">Track your tutoring income</div>
                </span>
                <svg className="chev" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 6l6 6-6 6"/>
                </svg>
              </button>

              <button className="action-card team" onClick={() => navigate('/my-sessions')}>
                <span className="tile">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="4" width="18" height="17" rx="3"/>
                    <path d="M8 2v4M16 2v4M3 10h18"/>
                  </svg>
                </span>
                <span className="text">
                  <div className="label">Manage Sessions</div>
                  <div className="sub">View and manage your sessions</div>
                </span>
                <svg className="chev" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 6l6 6-6 6"/>
                </svg>
              </button>

              <button className="action-card earnings" onClick={() => navigate('/profile')}>
                <span className="tile">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="8" r="4"/>
                    <path d="M4 21c0-4 3.6-7 8-7s8 3 8 7"/>
                  </svg>
                </span>
                <span className="text">
                  <div className="label">Update Profile</div>
                  <div className="sub">Keep your tutor profile current</div>
                </span>
                <svg className="chev" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 6l6 6-6 6"/>
                </svg>
              </button>
            </div>
          </div>
        </section>

        <section className="features-section">
          <div className="container">
            <div className="section-header">
              <span className="section-tag">Why EduSpantech</span>
              <h2>Built for educational excellence</h2>
              <p>Our platform delivers premium education through cutting-edge technology and expert South African tutors.</p>
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
                <p>Real-time collaborative solving with ultra-low-bandwidth vector rendering — only 15MB per hour.</p>
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

        <section className="regions-map-section">
          <div className="container">
            <RegionsMap />
          </div>
        </section>

        <section className="curriculum-section">
          <div className="container">
            <div className="section-header">
              <span className="section-tag">Global Reach</span>
              <h2>Education without borders</h2>
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

        <section className="cta-section">
          <div className="container">
            <div className="cta-content">
              <h2>Ready for your next <br />tutoring session?</h2>
              <p>Continue helping students master their subjects.</p>

              <button
                className="action-cta"
                style={{ maxWidth: 380, margin: '0 auto' }}
                onClick={() => navigate('/tutor/dashboard')}
              >
                <span className="action-cta-left">
                  <span className="icon">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="3" width="7" height="9" rx="2"/>
                      <rect x="14" y="3" width="7" height="5" rx="2"/>
                      <rect x="14" y="12" width="7" height="9" rx="2"/>
                      <rect x="3" y="16" width="7" height="5" rx="2"/>
                    </svg>
                  </span>
                  <span>
                    <div className="label">Go to Dashboard</div>
                    <div className="sub">Students, progress and today's overview</div>
                  </span>
                </span>
                <span className="arrow">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12h14M13 6l6 6-6 6"/>
                  </svg>
                </span>
              </button>
            </div>
          </div>
        </section>

        <EnhancedFooter siteConfig={siteConfig} footerLinks={footerLinks} />
      </div>
    );
  }

  // ============================================
  // STUDENT / NON-AUTHENTICATED HOME VIEW
  // ============================================
  return (
    <div className="home-page">
      <section className="hero-section student-home-hero">
        <div className="hero-content">
          {isAuthenticated ? (
            <>
              <h1 className="hero-title">
                Welcome back, <br />
                <span className="highlight">{getUserName()}! 👋</span>
              </h1>

              <p className="hero-subtitle">
                Continue your education journey with your {getUserTier()} Tier plan.
                Your next session is just a click away.
              </p>
            </>
          ) : (
            <>
              <h1 className="hero-title-refined">
                Education for the<br />
                <em className="accent">love of my life</em> 
              </h1>

              <p className="hero-subtitle-refined">
                From Grade 8 to 2nd-Year Tertiary — world-class tutoring, powered
                by a 24/7 global infrastructure across 9 AWS regions.
              </p>
            </>
          )}

          <div className="action-actions" style={{ maxWidth: 420, marginTop: 34 }}>
            {isAuthenticated ? (
              <>
                <button
                  className="action-cta"
                  onClick={() => navigate('/subjects')}
                >
                  <span className="action-cta-left">
                    <span className="icon">
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M4 19.5A2.5 2.5 0 016.5 17H20"/>
                        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/>
                      </svg>
                    </span>
                    <span>
                      <div className="label">Continue Learning</div>
                      <div className="sub">Browse your subjects and resources</div>
                    </span>
                  </span>
                  <span className="arrow">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M5 12h14M13 6l6 6-6 6"/>
                    </svg>
                  </span>
                </button>

                <button className="action-card earnings" onClick={() => navigate('/profile')}>
                  <span className="tile">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="8" r="4"/>
                      <path d="M4 21c0-4 3.6-7 8-7s8 3 8 7"/>
                    </svg>
                  </span>
                  <span className="text">
                    <div className="label">My Profile</div>
                    <div className="sub">Manage your account and preferences</div>
                  </span>
                  <svg className="chev" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 6l6 6-6 6"/>
                  </svg>
                </button>

                <button className="action-card sessions" onClick={() => navigate('/tutors')}>
                  <span className="tile">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
                      <circle cx="9" cy="7" r="4"/>
                      <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/>
                    </svg>
                  </span>
                  <span className="text">
                    <div className="label">Find a Tutor</div>
                    <div className="sub">Connect with expert educators</div>
                  </span>
                  <svg className="chev" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 6l6 6-6 6"/>
                  </svg>
                </button>
              </>
            ) : (
              <>
                <button
                  className="action-cta"
                  onClick={() => navigate('/register')}
                >
                  <span className="action-cta-left">
                    <span className="icon">
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 5v14M5 12h14"/>
                      </svg>
                    </span>
                    <span>
                      <div className="label">Start a free trial</div>
                      <div className="sub">No card required — 7 days on us</div>
                    </span>
                  </span>
                  <span className="arrow">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M5 12h14M13 6l6 6-6 6"/>
                    </svg>
                  </span>
                </button>

                <button
                  className="action-card team"
                  onClick={() => navigate('/tutors')}
                >
                  <span className="tile">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="9" cy="8" r="3.5"/>
                      <path d="M2.5 20c0-3.6 2.9-6 6.5-6s6.5 2.4 6.5 6"/>
                    </svg>
                  </span>
                  <span className="text">
                    <div className="label">Meet our tutors</div>
                    <div className="sub">See the educators behind EduSpantech</div>
                  </span>
                  <svg className="chev" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 6l6 6-6 6"/>
                  </svg>
                </button>

                <button
                  className="action-card sessions"
                  onClick={() => navigate('/login')}
                >
                  <span className="tile">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4"/>
                      <path d="M10 17l5-5-5-5M15 12H3"/>
                    </svg>
                  </span>
                  <span className="text">
                    <div className="label">Sign in</div>
                    <div className="sub">Already have an account?</div>
                  </span>
                  <svg className="chev" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 6l6 6-6 6"/>
                  </svg>
                </button>

                <p className="hero-cta-note" style={{ marginTop: 4 }}>
                  No card required. Already have an account?{' '}
                  <button
                    type="button"
                    className="hero-cta-link"
                    onClick={() => navigate('/login')}
                  >
                    Sign in
                  </button>
                </p>
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
              <div className="hero-stats-refined">
                <div className="stat-refined">
                  <div className="stat-refined-num">9</div>
                  <div className="stat-refined-lbl">Global regions covered</div>
                </div>
                <div className="stat-refined">
                  <div className="stat-refined-num">24/7</div>
                  <div className="stat-refined-lbl">Tutor availability</div>
                </div>
                <div className="stat-refined">
                  <div className="stat-refined-num">12</div>
                  <div className="stat-refined-lbl">Expert tutors on staff</div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Student homepage hero — full-bleed background image, no card */}
        <div
          className={`hero-visual home-hero-visual ${homeHeroImage ? 'has-image' : ''}`}
          style={homeHeroImage ? { backgroundImage: `url(${homeHeroImage})` } : {}}
          role="img"
          aria-label="Student experiencing online learning using a computer and smartphone"
        >
          <div className="home-hero-overlay" />
        </div>
      </section>

      {isAuthenticated && !isTutor && (
        <section className="quick-actions-section">
          <div className="container">
            <div className="action-actions" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))' }}>
              <button className="action-card earnings" onClick={() => navigate('/subjects')}>
                <span className="tile">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 19.5A2.5 2.5 0 016.5 17H20"/>
                    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/>
                  </svg>
                </span>
                <span className="text">
                  <div className="label">Browse Subjects</div>
                  <div className="sub">Explore available topics</div>
                </span>
                <svg className="chev" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 6l6 6-6 6"/>
                </svg>
              </button>

              <button className="action-card sessions" onClick={() => navigate('/tutors')}>
                <span className="tile">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
                    <circle cx="9" cy="7" r="4"/>
                    <path d="M23 21v-2a4 4 0 00-3-3.87"/>
                  </svg>
                </span>
                <span className="text">
                  <div className="label">Find a Tutor</div>
                  <div className="sub">Connect with expert educators</div>
                </span>
                <svg className="chev" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 6l6 6-6 6"/>
                </svg>
              </button>

              <button className="action-card team" onClick={() => navigate('/profile')}>
                <span className="tile">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="8" r="4"/>
                    <path d="M4 21c0-4 3.6-7 8-7s8 3 8 7"/>
                  </svg>
                </span>
                <span className="text">
                  <div className="label">Account Settings</div>
                  <div className="sub">Manage your profile and preferences</div>
                </span>
                <svg className="chev" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 6l6 6-6 6"/>
                </svg>
              </button>

              <button className="action-card earnings" onClick={() => navigate('/resources')}>
                <span className="tile">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z"/>
                    <path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z"/>
                  </svg>
                </span>
                <span className="text">
                  <div className="label">Learning Resources</div>
                  <div className="sub">Access on-demand content vaults</div>
                </span>
                <svg className="chev" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 6l6 6-6 6"/>
                </svg>
              </button>
            </div>
          </div>
        </section>
      )}

      <section className="features-section">
        <div className="container">
          <div className="section-header">
            <span className="section-tag">
              {isAuthenticated ? 'Your Learning Tools' : 'Why EduSpantech'}
            </span>

            <h2>
              {isAuthenticated
                ? `Continue your learning journey, ${getUserName()}`
                : 'Built for educational excellence'
              }
            </h2>

            <p>
              {isAuthenticated
                ? 'Access your personalized learning tools and continue your journey to mastery.'
                : 'Our platform delivers premium education through cutting-edge technology and expert South African tutors.'
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
              <p>Real-time collaborative solving with ultra-low-bandwidth vector rendering — only 15MB per hour.</p>
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

      <section className="regions-map-section">
        <div className="container">
          <RegionsMap />
        </div>
      </section>

      {!isAuthenticated && <Pricing />}

      {isAuthenticated && !isTutor && (
        <section className="progress-section">
          <div className="container">
            <div className="progress-content">
              <div className="progress-text">
                <span className="section-tag">Your Progress</span>
                <h2>Track your learning journey</h2>
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

      <section className="curriculum-section">
        <div className="container">
          <div className="section-header">
            <span className="section-tag">Global Reach</span>
            <h2>Education without borders</h2>
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

      <section className="cta-section">
        <div className="container">
          <div className="cta-content">
            {isAuthenticated ? (
              <>
                <h2>Ready for your next <br />session?</h2>
                <p>Continue your learning journey with your personalized tutor matching.</p>

                <button
                  className="action-cta"
                  style={{ maxWidth: 380, margin: '0 auto' }}
                  onClick={() => navigate('/subjects')}
                >
                  <span className="action-cta-left">
                    <span className="icon">
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M4 19.5A2.5 2.5 0 016.5 17H20"/>
                        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/>
                      </svg>
                    </span>
                    <span>
                      <div className="label">Browse Subjects</div>
                      <div className="sub">Continue where you left off</div>
                    </span>
                  </span>
                  <span className="arrow">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M5 12h14M13 6l6 6-6 6"/>
                    </svg>
                  </span>
                </button>
              </>
            ) : (
              <>
                <h2>Ready to make education <br />the love of my life?</h2>
                <p>Join thousands of students already learning with EduSpantech.</p>

                <button
                  className="action-cta"
                  style={{ maxWidth: 380, margin: '0 auto' }}
                  onClick={() => navigate('/register')}
                >
                  <span className="action-cta-left">
                    <span className="icon">
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 5v14M5 12h14"/>
                      </svg>
                    </span>
                    <span>
                      <div className="label">Start Your Free Trial</div>
                      <div className="sub">No credit card required</div>
                    </span>
                  </span>
                  <span className="arrow">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M5 12h14M13 6l6 6-6 6"/>
                    </svg>
                  </span>
                </button>

                <p className="cta-small">No credit card required • 7-day free trial</p>
              </>
            )}
          </div>
        </div>
      </section>

      <EnhancedFooter siteConfig={siteConfig} footerLinks={footerLinks} />
    </div>
  );
}

export default Home;
