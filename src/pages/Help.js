
import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { pricingService } from '../services/pricingService';
import TermsOfService from './Terms';
import PrivacyPolicy from './Privacy';
import {
  LifeBuoy, Search, Rocket, GraduationCap, PenTool, CreditCard, Settings,
  Mail, MessageCircle, Clock, FileText, Shield, Plus, Minus,
} from 'lucide-react';
import './Help.css';
import './Register.css';

// ---------------------------------------------------------------
// Reusable Modal — same markup/classes as Register's modal
// ---------------------------------------------------------------
const Modal = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  return (
    <div className="register-modal-overlay" onClick={onClose}>
      <div className="register-modal" onClick={(e) => e.stopPropagation()}>
        <div className="register-modal-header">
          <h2>{title}</h2>
          <button onClick={onClose} className="register-modal-close">×</button>
        </div>
        <div className="register-modal-body">{children}</div>
        <div className="register-modal-footer">
          <button onClick={onClose} className="register-modal-btn">Close</button>
        </div>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------
// Terms — identical to Register
// ---------------------------------------------------------------
const TermsContent = () => {
  const terms = TermsOfService.getFullTerms();

  return (
    <div>
      <div className="register-modal-date">
        Last Updated: {TermsOfService.effectiveDate}
      </div>

      {terms.map((section) => (
        <div key={section.id} className="register-modal-section">
          <h3>{section.title}</h3>
          {section.content.map((paragraph, index) => (
            <p key={index}>{paragraph}</p>
          ))}
        </div>
      ))}
    </div>
  );
};

// ---------------------------------------------------------------
// Privacy — identical to Register
// ---------------------------------------------------------------
const PrivacyContent = () => {
  const privacy = PrivacyPolicy.getFullPolicy();

  return (
    <div>
      <div className="register-modal-date">
        Last Updated: {PrivacyPolicy.effectiveDate}
      </div>

      {privacy.map((section) => (
        <div key={section.id} className="register-modal-section">
          <h3>{section.title}</h3>
          {section.content.map((paragraph, index) => (
            <p key={index}>{paragraph}</p>
          ))}
        </div>
      ))}
    </div>
  );
};

// ---------------------------------------------------------------
// Cookies — inline only. No require('./Cookies') so the build
// never fails on a missing module.
// ---------------------------------------------------------------
const CookiesContent = () => (
  <div>
    <div className="register-modal-date">
      Last Updated: {new Date().toLocaleDateString('en-ZA', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })}
    </div>

    <div className="register-modal-section">
      <h3>1. What Are Cookies?</h3>
      <p>
        Cookies are small text files stored in your browser. We also use
        localStorage and sessionStorage for similar purposes.
      </p>
    </div>

    <div className="register-modal-section">
      <h3>2. Cookies We Use</h3>
      <p>
        Essential cookies for authentication and login. Preference cookies
        for pricing audience and UI settings. Analytics cookies for
        aggregated usage. Third-party cookies during checkout and
        authenticated API calls.
      </p>
    </div>

    <div className="register-modal-section">
      <h3>3. Managing Cookies</h3>
      <p>
        You can delete or block cookies from your browser settings.
        Blocking essential cookies may prevent login or joining sessions.
      </p>
    </div>

    <div className="register-modal-section">
      <h3>4. Contact</h3>
      <p>Questions? Email privacy@eduspantech.com.</p>
    </div>
  </div>
);

// ---------------------------------------------------------------
// Live subscription answer
// ---------------------------------------------------------------
const formatPrice = (plan) => {
  if (plan.price === 0) return 'Free';

  const symbol =
    plan.currency === 'ZAR' ? 'R' :
    plan.currency === 'USD' ? '$' :
    plan.currency || 'R';

  const period = plan.period || '/month';

  return `${symbol}${plan.price}${period}`;
};

const LiveSubscriptionAnswer = ({ plans, loading, error }) => {
  if (loading && plans.length === 0) {
    return <p className="faq-live-status">Loading current plans…</p>;
  }

  if (error && plans.length === 0) {
    return (
      <p className="faq-live-status faq-live-status--error">
        Couldn't load live plans right now. Please try again shortly.
      </p>
    );
  }

  const highschool = plans.filter(
    p => p.audience === 'school' || p.audience === 'highschool'
  );

  const tertiary = plans.filter(p => p.audience === 'tertiary');
  const allAudience = plans.filter(p => p.audience === 'all');

  const renderGroup = (title, items) => (
    <div className="faq-plan-group" style={{ marginBottom: '16px' }}>
      <h4 style={{ margin: '8px 0', color: '#fff' }}>{title}</h4>

      {items.length === 0 ? (
        <p style={{ color: '#94a3b8', margin: 0 }}>
          No plans currently available.
        </p>
      ) : (
        <ul style={{ margin: 0, paddingLeft: '20px', color: '#cbd5e1' }}>
          {items.map(p => (
            <li key={p.id || p.name} style={{ marginBottom: '8px' }}>
              <strong style={{ color: '#fff' }}>{p.name}</strong>
              {' — '}
              {formatPrice(p)}

              {Array.isArray(p.features) && p.features.length > 0 && (
                <>
                  {' — '}
                  {p.features.slice(0, 3).join(', ')}
                  {p.features.length > 3 ? ', …' : ''}
                </>
              )}

              {p.description && !p.features?.length && (
                <> — {p.description}</>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );

  return (
    <div className="faq-live-plans">
      <p style={{ marginBottom: '12px' }}>
        We offer separate plans for <strong>High School</strong> and{' '}
        <strong>Tertiary</strong> learners:
      </p>

      {renderGroup('📘 High School Plans', highschool)}
      {renderGroup('🎓 Tertiary Plans', tertiary)}

      {allAudience.length > 0 &&
        renderGroup('📋 Plans for Everyone', allAudience)}
    </div>
  );
};

// ---------------------------------------------------------------
// Help page
// ---------------------------------------------------------------
const Help = () => {
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedFaq, setExpandedFaq] = useState(null);

  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [showCookiesModal, setShowCookiesModal] = useState(false);

  const [plans, setPlans] = useState([]);
  const [plansLoading, setPlansLoading] = useState(true);
  const [plansError, setPlansError] = useState(null);

  const fetchPlans = useCallback(async (silent = false) => {
    if (!silent) setPlansLoading(true);

    try {
      if (pricingService?.getPricingPlans) {
        const result = await pricingService.getPricingPlans();
        setPlans(result || []);
        setPlansError(null);
      } else {
        setPlansError('Pricing service not available');
      }
    } catch (e) {
      console.error('❌ Failed to fetch pricing plans:', e);
      setPlansError(e.message);
    } finally {
      setPlansLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPlans();

    const onFocus = () => fetchPlans(true);

    window.addEventListener('focus', onFocus);

    return () => window.removeEventListener('focus', onFocus);
  }, [fetchPlans]);

  const fallbackSubscriptionAnswer =
    'We offer three plans: Silver (R100/month) - self-study with archives, Gold (R200/month) - live evening clinics, and Platinum (R350/month) - premium access with weekend clinics and priority support.';

  const faqs = [
    {
      id: 1,
      category: 'account',
      question: 'How do I create an account?',
      answer: 'Click the "Register" button in the top right corner. Fill in your name, email, password, and select your grade level. Agree to the Terms of Service and click "Create Account".'
    },
    {
      id: 2,
      category: 'account',
      question: 'How do I reset my password?',
      answer: 'On the login page, click "Forgot password". Enter your email address and we\'ll send you a password reset link. Follow the instructions in the email to set a new password.'
    },
    {
      id: 3,
      category: 'subscription',
      question: 'What subscription plans are available?',
      answer: plans.length === 0 && !plansLoading
        ? fallbackSubscriptionAnswer
        : 'See the live High School and Tertiary plans below.',
      render: () => (
        <LiveSubscriptionAnswer
          plans={plans}
          loading={plansLoading}
          error={plansError}
        />
      )
    },
    {
      id: 4,
      category: 'subscription',
      question: 'How do I upgrade my plan?',
      answer: 'Go to your Profile page and click "Upgrade Plan". Select your desired tier and complete the payment process. Your new plan will be activated immediately.'
    },
    {
      id: 5,
      category: 'technical',
      question: 'What browser do you recommend?',
      answer: 'We recommend using the latest version of Google Chrome, Mozilla Firefox, or Microsoft Edge for the best experience. Safari is also supported on macOS.'
    },
    {
      id: 6,
      category: 'technical',
      question: 'Why is the whiteboard not working?',
      answer: 'Make sure you have JavaScript enabled and your browser is up to date. Check your internet connection. If the issue persists, try clearing your browser cache or using a different browser.'
    },
    {
      id: 7,
      category: 'sessions',
      question: 'How do I schedule a tutoring session?',
      answer: 'Go to the Tutors page, select a tutor, and choose an available time slot. Platinum members get priority queue-bypass access. Gold members can access evening clinics (16:00-23:00 Local Time).'
    },
    {
      id: 8,
      category: 'sessions',
      question: 'What happens if I miss a session?',
      answer: 'You can reschedule up to 24 hours before your session. Late cancellations or no-shows may count toward your session limit depending on your plan. Contact support for exceptions.'
    },
    {
      id: 9,
      category: 'billing',
      question: 'How do I cancel my subscription?',
      answer: 'Go to your Profile page, click on "Account Settings", and select "Cancel Subscription". Your access will continue until the end of your current billing cycle.'
    },
    {
      id: 10,
      category: 'billing',
      question: 'What payment methods do you accept?',
      answer: 'We accept Credit/Debit Cards (Visa, Mastercard, American Express), PayFast, and Bank Transfer (EFT). All payments are processed securely.'
    }
  ];

  const categories = [
    { id: 'all', label: 'All Topics' },
    { id: 'account', label: 'Account' },
    { id: 'subscription', label: 'Subscription' },
    { id: 'technical', label: 'Technical' },
    { id: 'sessions', label: 'Sessions' },
    { id: 'billing', label: 'Billing' }
  ];

  const filteredFaqs = faqs.filter(faq => {
    const matchesCategory =
      activeCategory === 'all' || faq.category === activeCategory;

    const haystack =
      `${faq.question} ${typeof faq.answer === 'string' ? faq.answer : ''}`.toLowerCase();

    const matchesSearch =
      haystack.includes(searchQuery.toLowerCase());

    return matchesCategory && matchesSearch;
  });

  const toggleFaq = (id) => {
    setExpandedFaq(expandedFaq === id ? null : id);
  };

  return (
    <div className="help-page">
      <div className="help-container">
        <div className="help-header">
          <h1>
            <LifeBuoy size={32} strokeWidth={2} className="help-title-icon" />
            Help &amp; Support
          </h1>

          <p>
            Find answers to your questions or get in touch with our support team
          </p>
        </div>

        <div className="help-search">
          <Search size={18} strokeWidth={2} className="help-search-icon" />
          <input
            type="text"
            placeholder="Search for help..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="help-quick-links">
          <Link to="/help/getting-started" className="quick-link">
            <Rocket size={24} strokeWidth={1.75} className="quick-icon" />
            <span>Getting Started</span>
          </Link>

          <Link to="/help/tutors" className="quick-link">
            <GraduationCap size={24} strokeWidth={1.75} className="quick-icon" />
            <span>Working with Tutors</span>
          </Link>

          <Link to="/help/whiteboard" className="quick-link">
            <PenTool size={24} strokeWidth={1.75} className="quick-icon" />
            <span>Using Whiteboard</span>
          </Link>

          <Link to="/help/billing" className="quick-link">
            <CreditCard size={24} strokeWidth={1.75} className="quick-icon" />
            <span>Billing &amp; Payments</span>
          </Link>

          <Link to="/help/technical" className="quick-link">
            <Settings size={24} strokeWidth={1.75} className="quick-icon" />
            <span>Technical Issues</span>
          </Link>

          <Link to="/help/contact" className="quick-link">
            <Mail size={24} strokeWidth={1.75} className="quick-icon" />
            <span>Contact Support</span>
          </Link>
        </div>

        <div className="help-categories">
          {categories.map(cat => (
            <button
              key={cat.id}
              className={`category-btn ${activeCategory === cat.id ? 'active' : ''}`}
              onClick={() => setActiveCategory(cat.id)}
            >
              {cat.label}
            </button>
          ))}
        </div>

        <div className="help-faq-section">
          <h2>Frequently Asked Questions</h2>

          {filteredFaqs.length > 0 ? (
            <div className="faq-list">
              {filteredFaqs.map(faq => (
                <div
                  key={faq.id}
                  className={`faq-item ${expandedFaq === faq.id ? 'expanded' : ''}`}
                >
                  <button
                    className="faq-question"
                    onClick={() => toggleFaq(faq.id)}
                  >
                    <span>{faq.question}</span>

                    <span className="faq-icon">
                      {expandedFaq === faq.id ? (
                        <Minus size={18} strokeWidth={2.25} />
                      ) : (
                        <Plus size={18} strokeWidth={2.25} />
                      )}
                    </span>
                  </button>

                  {expandedFaq === faq.id && (
                    <div className="faq-answer">
                      {typeof faq.render === 'function'
                        ? faq.render()
                        : <p>{faq.answer}</p>}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="help-no-results">
              <Search size={40} strokeWidth={1.5} className="help-no-results-icon" />
              <p>No results found for "{searchQuery}"</p>
              <p className="help-no-results-sub">
                Try different keywords or browse categories above
              </p>
            </div>
          )}
        </div>

        <div className="help-contact-section">
          <div className="help-contact-card">
            <h3>Still need help?</h3>
            <p>
              Our support team is available 24/7 to assist you with any questions or issues.
            </p>

            <div className="help-contact-options">
              <button className="help-contact-btn primary">
                <Mail size={18} strokeWidth={2} />
                Email Support
              </button>

              <button className="help-contact-btn secondary">
                <MessageCircle size={18} strokeWidth={2} />
                Live Chat
              </button>
            </div>

            <div className="help-response-time">
              <Clock size={14} strokeWidth={2} />
              <span>Response time: Usually within 2 hours</span>
            </div>
          </div>
        </div>

        <div className="help-legal-links">
          <button
            type="button"
            className="legal-link"
            onClick={() => setShowTermsModal(true)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              font: 'inherit',
              padding: 0,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6
            }}
          >
            <FileText size={16} strokeWidth={2} />
            Terms of Service
          </button>

          <button
            type="button"
            className="legal-link"
            onClick={() => setShowPrivacyModal(true)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              font: 'inherit',
              padding: 0,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6
            }}
          >
            <Shield size={16} strokeWidth={2} />
            Privacy Policy
          </button>

          <button
            type="button"
            className="legal-link"
            onClick={() => setShowCookiesModal(true)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              font: 'inherit',
              padding: 0,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6
            }}
          >
            <span role="img" aria-label="Cookie">🍪</span>
            Cookie Policy
          </button>
        </div>

        <div className="help-status">
          <div className="status-indicator">
            <span className="status-dot green"></span>
            <span>All systems operational</span>
          </div>

          <span className="status-updated">
            Last updated: {new Date().toLocaleString()}
          </span>
        </div>
      </div>

      <Modal
        isOpen={showTermsModal}
        onClose={() => setShowTermsModal(false)}
        title="Terms of Service"
      >
        <TermsContent />
      </Modal>

      <Modal
        isOpen={showPrivacyModal}
        onClose={() => setShowPrivacyModal(false)}
        title="Privacy Policy"
      >
        <PrivacyContent />
      </Modal>

      <Modal
        isOpen={showCookiesModal}
        onClose={() => setShowCookiesModal(false)}
        title="Cookie Policy"
      >
        <CookiesContent />
      </Modal>
    </div>
  );
};

export default Help;
