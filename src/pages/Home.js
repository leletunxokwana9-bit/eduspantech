// src/pages/Home.js
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';
import { supabase } from '../services/supabaseClient';
import Pricing from '../components/home/Pricing/Pricing';
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
      <div className="core-math">
        <span>∫</span>
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
  );
};

// ============================================
// FALLBACK TEAM MEMBERS DATA
// ============================================
const getFallbackTeamMembers = () => {
  return [
    {
      id: 1,
      name: 'Leletu Nxokwana',
      role: 'Full Stack Developer',
      bio: 'Lead developer and architect of the EduSpantech platform. Passionate about creating scalable educational technology solutions that make mathematics accessible to students worldwide.',
      photo_url: null,
      specialties: ['React', 'Node.js', 'AWS', 'PostgreSQL', 'TypeScript'],
      years_experience: 5,
      fun_fact: '🎮 Can solve a Rubik\'s cube in under 30 seconds'
    },
    {
      id: 2,
      name: 'Dr. Garth Van Schalkwyk',
      role: 'Director & Mathematics Researcher',
      bio: 'Dr. Garth J. van Schalkwyk serves as an Extended Curriculum Programme (ECP) lecturer in the Department of Mathematics and Applied Mathematics at the University of the Western Cape (UWC). He completed his PhD at UWC in 2019, specializing in financial mathematics, epidemiological forecasting, risk management, and optimal control.',
      photo_url: null,
      specialties: ['Financial Mathematics', 'Epidemiological Forecasting', 'Risk Management', 'Optimal Control'],
      years_experience: 15,
      fun_fact: '📚 Published numerous research papers on mathematical biology and disease modeling'
    }
  ];
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

  const getSocialIcon = (label) => {
    const icons = {
      'Twitter': '🐦',
      'LinkedIn': '💼',
      'YouTube': '▶️',
      'Instagram': '📸',
      'Facebook': '📘',
      'TikTok': '🎵',
      'WhatsApp': '💬'
    };
    return icons[label] || '🔗';
  };

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
                🎓 <strong>12 Expert Tutors</strong> online now — Ready to help you master math!
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
            
            {/* ===== LEFT COLUMN - Brand + Newsletter ===== */}
            <div className="footer-col footer-brand-col">
              <div className="footer-brand">
                <div className="brand-logo">
                  <span className="brand-icon">∫</span>
                  <span className="brand-name">{siteConfig.site_name || 'EduSpantech'}</span>
                </div>
                <p className="brand-tagline">
                  {siteConfig.site_tagline || 'Education for the love of your life ❤️'}
                </p>
                <p className="brand-subtagline">
                  {siteConfig.site_subtagline || 'From Grade 8 to 2nd-Year Tertiary Success'}
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

              {/* Newsletter */}
              <div className="footer-newsletter">
                <h4>📚 Get Weekly Math Tips</h4>
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

            {/* ===== MY SPECIFICS ===== */}
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

            {/* ===== I DO IN MY SESSIONS ===== */}
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

            {/* ===== RELATED SUBJECTS ===== */}
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

          {/* ===== SOCIAL CONNECT ===== */}
          <div className="footer-social-section">
            <div className="social-grid">
              {groupedLinks.connect?.map((link) => (
                <a 
                  key={link.id}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="social-link"
                  title={link.label}
                >
                  <span className="social-icon">{getSocialIcon(link.label)}</span>
                  <span className="social-label">{link.label}</span>
                </a>
              ))}
              {(!groupedLinks.connect || groupedLinks.connect.length === 0) && (
                <>
                  <a href={siteConfig.social_facebook} target="_blank" rel="noopener noreferrer" className="social-link">
                    <span className="social-icon">📘</span>
                    <span className="social-label">Facebook</span>
                  </a>
                  <a href={siteConfig.social_instagram} target="_blank" rel="noopener noreferrer" className="social-link">
                    <span className="social-icon">📸</span>
                    <span className="social-label">Instagram</span>
                  </a>
                  <a href={siteConfig.social_twitter} target="_blank" rel="noopener noreferrer" className="social-link">
                    <span className="social-icon">🐦</span>
                    <span className="social-label">Twitter</span>
                  </a>
                  <a href={siteConfig.social_linkedin} target="_blank" rel="noopener noreferrer" className="social-link">
                    <span className="social-icon">💼</span>
                    <span className="social-label">LinkedIn</span>
                  </a>
                  <a href={siteConfig.social_youtube} target="_blank" rel="noopener noreferrer" className="social-link">
                    <span className="social-icon">▶️</span>
                    <span className="social-label">YouTube</span>
                  </a>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ===== CTA BANNER ===== */}
      <div className="footer-cta-banner">
        <div className="container">
          <div className="cta-banner-content">
            <div className="cta-banner-text">
              <span className="cta-banner-icon">🎯</span>
              <div>
                <h4>Ready to Excel in Mathematics?</h4>
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
                {siteConfig.site_tagline || 'Education for the love of your life ❤️'}
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

          {/* ===== LEGAL STATEMENT ===== */}
          <div className="footer-legal-statement">
            <p>
              All tutors appearing on this site have contractually confirmed to us that they are qualified educators 
              with verified credentials and appropriate teaching certifications.
            </p>
            <p className="legal-statement-small">
              {siteConfig.compliance_text || 'POPIA • GDPR • CPA Compliant'} — EduSpantech is committed to educational excellence and student privacy.
            </p>
          </div>

          {/* ===== TRUST BADGES ===== */}
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
// TEAM CAROUSEL COMPONENT - FIXED
// ============================================
const TeamCarousel = ({ members, onViewAll }) => {
  const scrollRef = useRef(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);

  // ✅ FIX: Return null if no members or members is not an array
  if (!members || !Array.isArray(members) || members.length === 0) {
    return null;
  }

  const scroll = (direction) => {
    if (scrollRef.current) {
      const scrollAmount = 320;
      const newScrollLeft = scrollRef.current.scrollLeft + (direction === 'left' ? -scrollAmount : scrollAmount);
      
      scrollRef.current.scrollTo({
        left: newScrollLeft,
        behavior: 'smooth'
      });
    }
  };

  const handleScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setShowLeftArrow(scrollLeft > 20);
      setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 20);
    }
  };

  useEffect(() => {
    const current = scrollRef.current;
    if (current) {
      current.addEventListener('scroll', handleScroll);
      handleScroll();
      return () => current.removeEventListener('scroll', handleScroll);
    }
  }, []);

  return (
    <div className="team-carousel-wrapper">
      <div className="team-carousel-header">
        <div className="team-carousel-title">
          <span className="section-tag">👥 Our Team</span>
          <h2>Meet the People Behind EduSpantech</h2>
          <p>Passionate educators, developers, and designers working together to make mathematics accessible worldwide.</p>
        </div>
        <button className="team-view-all-btn" onClick={onViewAll}>
          View All Team →
        </button>
      </div>

      <div className="team-carousel-container">
        {showLeftArrow && (
          <button className="team-arrow team-arrow-left" onClick={() => scroll('left')}>
            ‹
          </button>
        )}

        <div className="team-carousel" ref={scrollRef}>
          {members.map((member) => (
            <div key={member.id || member.name || Math.random()} className="team-carousel-card">
              <div className="team-card-image-wrapper">
                {member.photo_url ? (
                  <img src={member.photo_url} alt={member.name || 'Team Member'} className="team-card-photo" />
                ) : (
                  <div className="team-card-avatar-large">
                    <span>{member.name?.charAt(0) || '?'}</span>
                  </div>
                )}
                <div className="team-card-experience-badge">
                  🎯 {member.years_experience || 0} yrs
                </div>
              </div>
              <div className="team-card-details">
                <h3>{member.name || 'Team Member'}</h3>
                <p className="team-card-role">{member.role || 'Team Member'}</p>
                <p className="team-card-bio">{member.bio?.slice(0, 100) || '...'}</p>
                <div className="team-card-specialties">
                  {member.specialties?.slice(0, 3).map((spec, idx) => (
                    <span key={idx} className="team-card-spec-tag">{spec}</span>
                  ))}
                  {member.specialties?.length > 3 && (
                    <span className="team-card-spec-tag more">+{member.specialties.length - 3}</span>
                  )}
                </div>
                {member.fun_fact && (
                  <div className="team-card-fun-fact">
                    <span>{member.fun_fact}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {showRightArrow && (
          <button className="team-arrow team-arrow-right" onClick={() => scroll('right')}>
            ›
          </button>
        )}
      </div>
    </div>
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
  const [tutorStats, setTutorStats] = useState({
    totalSessions: 0,
    studentsTaught: 0,
    totalEarnings: 0,
    avgRating: 0
  });
  const [teamMembers, setTeamMembers] = useState([]);

  const [siteConfig, setSiteConfig] = useState({
    site_name: 'EduSpantech',
    site_tagline: 'Education for the love of your life ❤️',
    site_subtagline: 'From Grade 8 to 2nd-Year Tertiary Success',
    social_facebook: 'https://web.facebook.com/profile.php?id=61593114256334',
    social_instagram: 'https://instagram.com/eduspantech',
    social_twitter: 'https://twitter.com/eduspantech',
    social_linkedin: 'https://linkedin.com/company/eduspantech',
    social_youtube: 'https://youtube.com/@eduspantech',
    contact_email: 'info@eduspantech.com',
    contact_phone: '+27 79 376 4985',
    contact_address: '19 Dock Road, Cape Town, 8001',
    compliance_text: 'POPIA • GDPR • CPA Compliant'
  });

  const [footerLinks, setFooterLinks] = useState([]);

  // ============================================
  // FETCH TEAM MEMBERS FROM SUPABASE - WITH FALLBACK
  // ============================================
  const fetchTeamMembers = async () => {
    try {
      console.log('🔍 Fetching team members from Supabase...');
      const { data, error } = await supabase
        .from('team_members')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (error) {
        console.error('❌ Supabase error:', error);
        console.log('📌 Using fallback team members');
        setTeamMembers(getFallbackTeamMembers());
        return;
      }

      if (data && data.length > 0) {
        console.log('✅ Team members loaded:', data.length);
        setTeamMembers(data);
      } else {
        console.warn('⚠️ No team members found in database, using fallback');
        setTeamMembers(getFallbackTeamMembers());
      }
    } catch (error) {
      console.error('❌ Failed to fetch team members:', error);
      console.log('📌 Using fallback team members');
      setTeamMembers(getFallbackTeamMembers());
    }
  };

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
    fetchTeamMembers();
  }, []);

  useEffect(() => {
    const checkAuth = async () => {
      const accessToken = localStorage.getItem('accessToken');
      if (accessToken) {
        setIsAuthenticated(true);
        try {
          const userData = await authService.getCurrentUserWithSubscription();
          if (userData) {
            setUser(userData);
            const isTutorAccount = userData.is_tutor === true || userData.role === 'tutor' || userData.role === 'TUTOR';
            setIsTutor(isTutorAccount);
            if (isTutorAccount) {
              await fetchTutorStats();
            }
          } else {
            const fallbackUser = await authService.getCurrentUser();
            if (fallbackUser) {
              setUser(fallbackUser);
              const isTutorAccount = fallbackUser.is_tutor === true || fallbackUser.role === 'tutor' || fallbackUser.role === 'TUTOR';
              setIsTutor(isTutorAccount);
              if (isTutorAccount) {
                await fetchTutorStats();
              }
            }
          }
        } catch (error) {
          console.error('Failed to get user:', error);
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('user');
          setIsAuthenticated(false);
          setUser(null);
          setIsTutor(false);
        }
      } else {
        setIsAuthenticated(false);
        setUser(null);
        setIsTutor(false);
      }
      setLoading(false);
    };
    checkAuth();
  }, []);

  const fetchTutorStats = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) return;

      const response = await fetch(`${process.env.REACT_APP_API_URL || 'https://eduspantech-backend.onrender.com/api'}/earnings`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.earnings) {
          setTutorStats({
            totalSessions: data.earnings.sessionsCount || 0,
            studentsTaught: data.earnings.studentCount || 0,
            totalEarnings: data.earnings.total || 0,
            avgRating: 4.8
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
    if (!user) return 'Silver';
    if (user.tier) return user.tier;
    if (user.subscriptionTier) return user.subscriptionTier;
    if (user.subscription?.tier) return user.subscription.tier;
    return 'Silver';
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

  // ============================================
  // TUTOR HOME VIEW
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
              Your tutoring dashboard is ready. Help students master mathematics today.
            </p>
            
            <div className="hero-actions">
              <button 
                className="btn-primary"
                onClick={() => navigate('/tutor/dashboard')}
              >
                📊 Go to Dashboard
              </button>
              <button 
                className="btn-secondary"
                onClick={() => navigate('/tutor/earnings')}
              >
                💰 View Earnings
              </button>
              <button 
                className="btn-secondary"
                onClick={() => navigate('/my-sessions')}
              >
                📅 My Sessions
              </button>
              <button 
                className="btn-secondary"
                onClick={() => navigate('/team')}
              >
                👥 Meet Our Team
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
            <div className="quick-actions-grid">
              <div className="quick-action-card" onClick={() => navigate('/tutor/students')}>
                <div className="quick-action-icon">👨‍🎓</div>
                <h4>View Students</h4>
                <p>See all students you're teaching</p>
              </div>
              <div className="quick-action-card" onClick={() => navigate('/tutor/earnings')}>
                <div className="quick-action-icon">💰</div>
                <h4>Check Earnings</h4>
                <p>Track your tutoring income</p>
              </div>
              <div className="quick-action-card" onClick={() => navigate('/my-sessions')}>
                <div className="quick-action-icon">📅</div>
                <h4>Manage Sessions</h4>
                <p>View and manage your sessions</p>
              </div>
              <div className="quick-action-card" onClick={() => navigate('/profile')}>
                <div className="quick-action-icon">👤</div>
                <h4>Update Profile</h4>
                <p>Keep your tutor profile current</p>
              </div>
              <div className="quick-action-card" onClick={() => navigate('/team')}>
                <div className="quick-action-icon">👥</div>
                <h4>Meet Our Team</h4>
                <p>Learn about the people behind EduSpantech</p>
              </div>
            </div>
          </div>
        </section>

        <section className="features-section">
          <div className="container">
            <div className="section-header">
              <span className="section-tag">Why EduSpantech</span>
              <h2>Built for mathematical excellence</h2>
              <p>Our platform delivers premium mathematics education through cutting-edge technology and expert South African tutors.</p>
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

        {/* ============================================
            TEAM CAROUSEL SECTION
            ============================================ */}
        {teamMembers && teamMembers.length > 0 && (
          <section className="team-carousel-section">
            <div className="container">
              <TeamCarousel 
                members={teamMembers} 
                onViewAll={() => navigate('/team')}
              />
            </div>
          </section>
        )}

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
              <p>Continue helping students master mathematics.</p>
              <button className="btn-primary btn-large" onClick={() => navigate('/tutor/dashboard')}>
                📊 Go to Dashboard
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
      <section className="hero-section">
        <div className="hero-content">
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
                <button 
                  className="btn-secondary"
                  onClick={() => navigate('/team')}
                >
                  👥 Meet Our Team
                </button>
              </>
            ) : (
              <>
                <button 
                  className="btn-primary"
                  onClick={() => navigate('/register')}
                >
                  Get Started — Free Trial
                </button>
                <button 
                  className="btn-secondary"
                  onClick={() => navigate('/login')}
                >
                  Sign In
                </button>
                <button 
                  className="btn-secondary"
                  onClick={() => navigate('/team')}
                >
                  👥 Meet Our Team
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

        <div className="hero-visual">
          <MathematicalOrbit />
        </div>
      </section>

      {/* ============================================
          QUICK ACTIONS
          ============================================ */}
      {isAuthenticated && !isTutor && (
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
              <div className="quick-action-card" onClick={() => navigate('/team')}>
                <div className="quick-action-icon">👥</div>
                <h4>Meet Our Team</h4>
                <p>Learn about the people behind EduSpantech</p>
              </div>
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

      {/* ============================================
          TEAM CAROUSEL SECTION
          ============================================ */}
      {teamMembers && teamMembers.length > 0 && (
        <section className="team-carousel-section">
          <div className="container">
            <TeamCarousel 
              members={teamMembers} 
              onViewAll={() => navigate('/team')}
            />
          </div>
        </section>
      )}

      {!isAuthenticated && <Pricing />}

      {isAuthenticated && !isTutor && (
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
                  Start Your Free Trial
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