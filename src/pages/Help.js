// src/pages/Help.js
import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  LifeBuoy,
  Search,
  Rocket,
  GraduationCap,
  PenTool,
  CreditCard,
  Settings,
  Mail,
  MessageCircle,
  Clock,
  FileText,
  Shield,
  Cookie,
  Plus,
  Minus,
} from 'lucide-react';
import './Help.css';

const API_URL =
  process.env.REACT_APP_API_URL || 'https://eduspantech-backend.onrender.com/api';

// ---------------------------------------------------------------
// Live subscription plans — grouped into High School vs Tertiary
// ---------------------------------------------------------------
const normalizePlan = (p) => {
  const rawAudience = String(
    p.audience ?? p.category ?? p.level ?? p.tier_group ?? ''
  ).toLowerCase();
  const text = `${rawAudience} ${p.name ?? p.plan_name ?? ''} ${p.description ?? ''}`.toLowerCase();

  let group = 'other';
  if (/(high\s*school|secondary|grade|matric|fet)/.test(text) || rawAudience.includes('high')) {
    group = 'highschool';
  } else if (
    /(tertiary|university|college|undergrad|postgrad|tvet|he(s|i))/.test(text) ||
    rawAudience.includes('tertiary')
  ) {
    group = 'tertiary';
  }

  return {
    id: p.id ?? p.plan_id ?? p.code ?? `${p.name}-${p.price}`,
    name: p.name ?? p.plan_name ?? p.tier ?? 'Plan',
    price: Number(p.price ?? p.amount ?? p.monthly_price ?? 0),
    currency: p.currency ?? 'R',
    interval: p.interval ?? p.billing_interval ?? 'month',
    features: Array.isArray(p.features)
      ? p.features
      : typeof p.features === 'string'
        ? p.features.split(',').map((s) => s.trim()).filter(Boolean)
        : [],
    description: p.description ?? p.summary ?? '',
    group,
  };
};

const formatPrice = (plan) => {
  const sym = plan.currency === 'ZAR' ? 'R' : plan.currency;
  return `${sym}${plan.price}/${plan.interval === 'monthly' ? 'month' : plan.interval}`;
};

const LiveSubscriptionAnswer = ({ plans, loading, error, lastUpdated }) => {
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

  const highschool = plans.filter((p) => p.group === 'highschool');
  const tertiary = plans.filter((p) => p.group === 'tertiary');
  const other = plans.filter((p) => p.group === 'other');

  const renderGroup = (title, items) => (
    <div className="faq-plan-group" style={{ marginBottom: '16px' }}>
      <h4 style={{ margin: '8px 0', color: '#fff' }}>{title}</h4>
      {items.length === 0 ? (
        <p style={{ color: '#94a3b8', margin: 0 }}>No plans currently available.</p>
      ) : (
        <ul style={{ margin: 0, paddingLeft: '20px', color: '#cbd5e1' }}>
          {items.map((p) => (
            <li key={p.id} style={{ marginBottom: '8px' }}>
              <strong style={{ color: '#fff' }}>{p.name}</strong> — {formatPrice(p)}
              {p.features.length > 0 && <> — {p.features.join(', ')}</>}
              {p.description && <> — {p.description}</>}
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
      {other.length > 0 && renderGroup('📋 Other Plans', other)}
      {lastUpdated && (
        <p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>
          Updated {lastUpdated.toLocaleTimeString()}
        </p>
      )}
    </div>
  );
};

const Help = () => {
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedFaq, setExpandedFaq] = useState(null);

  // -------- Live subscription plans state --------
  const [plans, setPlans] = useState([]);
  const [plansLoading, setPlansLoading] = useState(true);
  const [plansError, setPlansError] = useState(null);
  const [plansUpdated, setPlansUpdated] = useState(null);

  const fetchPlans = useCallback(async (silent = false) => {
    if (!silent) setPlansLoading(true);
    try {
      const res = await fetch(`${API_URL}/subscriptions`, {
        headers: { 'Content-Type': 'application/json' },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      const rows = Array.isArray(json) ? json : json.plans ?? json.data ?? [];
      setPlans(rows.map(normalizePlan));
      setPlansUpdated(new Date());
      setPlansError(null);
    } catch (e) {
      console.error('❌ Failed to fetch subscription plans:', e);
      setPlansError(e.message);
    } finally {
      setPlansLoading(false);
    }
  }, []);

  // Initial load + light real-time (30s poll + refetch on focus)
  useEffect(() => {
    fetchPlans();
    let interval;
    const start = () => {
      interval = setInterval(() => fetchPlans(true), 30000);
    };
    const stop = () => {
      if (interval) clearInterval(interval);
    };
    const onFocus = () => fetchPlans(true);
    const onVisibility = () => {
      if (document.visibilityState === 'visible') {
        fetchPlans(true);
        start();
      } else {
        stop();
      }
    };

    if (document.visibilityState === 'visible') start();
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      stop();
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [fetchPlans]);

  // Fallback text used only if the API returns nothing at all
  const fallbackSubscriptionAnswer =
    'We offer three plans: Silver (R100/month) - self-study with archives, Gold (R200/month) - live evening clinics, and Platinum (R350/month) - premium access with weekend clinics and priority support.';

  const faqs = [
    {
      id: 1,
      category: 'account',
      question: 'How do I create an account?',
      answer:
        'Click the "Register" button in the top right corner. Fill in your name, email, password, and select your grade level. Agree to the Terms of Service and click "Create Account".',
    },
    {
      id: 2,
      category: 'account',
      question: 'How do I reset my password?',
      answer:
        'On the login page, click "Forgot password". Enter your email address and we\'ll send you a password reset link. Follow the instructions in the email to set a new password.',
    },
    {
      id: 3,
      category: 'subscription',
      question: 'What subscription plans are available?',
      // Fallback string used in search + when the API has no plans
      answer:
        plans.length === 0 && !plansLoading
          ? fallbackSubscriptionAnswer
          : 'View live High School and Tertiary subscription plans below.',
      // The renderer checks for this and uses it instead of <p>{answer}</p>
      render: () => (
        <LiveSubscriptionAnswer
          plans={plans}
          loading={plansLoading}
          error={plansError}
          lastUpdated={plansUpdated}
        />
      ),
    },
    {
      id: 4,
      category: 'subscription',
      question: 'How do I upgrade my plan?',
      answer:
        'Go to your Profile page and click "Upgrade Plan". Select your desired tier and complete the payment process. Your new plan will be activated immediately.',
    },
    {
      id: 5,
      category: 'technical',
      question: 'What browser do you recommend?',
      answer:
        'We recommend using the latest version of Google Chrome, Mozilla Firefox, or Microsoft Edge for the best experience. Safari is also supported on macOS.',
    },
    {
      id: 6,
      category: 'technical',
      question: 'Why is the whiteboard not working?',
      answer:
        'Make sure you have JavaScript enabled and your browser is up to date. Check your internet connection. If the issue persists, try clearing your browser cache or using a different browser.',
    },
    {
      id: 7,
      category: 'sessions',
      question: 'How do I schedule a tutoring session?',
      answer:
        'Go to the Tutors page, select a tutor, and choose an available time slot. Platinum members get priority queue-bypass access. Gold members can access evening clinics (16:00-23:00 Local Time).',
    },
    {
      id: 8,
      category: 'sessions',
      question: 'What happens if I miss a session?',
      answer:
        'You can reschedule up to 24 hours before your session. Late cancellations or no-shows may count toward your session limit depending on your plan. Contact support for exceptions.',
    },
    {
      id: 9,
      category: 'billing',
      question: 'How do I cancel my subscription?',
      answer:
        'Go to your Profile page, click on "Account Settings", and select "Cancel Subscription". Your access will continue until the end of your current billing cycle.',
    },
    {
      id: 10,
      category: 'billing',
      question: 'What payment methods do you accept?',
      answer:
        'We accept Credit/Debit Cards (Visa, Mastercard, American Express), PayFast, and Bank Transfer (EFT). All payments are processed securely.',
    },
  ];

  const categories = [
    { id: 'all', label: 'All Topics' },
    { id: 'account', label: 'Account' },
    { id: 'subscription', label: 'Subscription' },
    { id: 'technical', label: 'Technical' },
    { id: 'sessions', label: 'Sessions' },
    { id: 'billing', label: 'Billing' },
  ];

  const filteredFaqs = faqs.filter((faq) => {
    const matchesCategory = activeCategory === 'all' || faq.category === activeCategory;
    // Search still works against the fallback string for item 3
    const haystack = `${faq.question} ${typeof faq.answer === 'string' ? faq.answer : ''}`.toLowerCase();
    const matchesSearch = haystack.includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const toggleFaq = (id) => {
    setExpandedFaq(expandedFaq === id ? null : id);
  };

  return (
    <div className="help-page">
      <div className="help-container">
        {/* Header */}
        <div className="help-header">
          <h1>
            <LifeBuoy size={32} strokeWidth={2} className="help-title-icon" />
            Help &amp; Support
          </h1>
          <p>Find answers to your questions or get in touch with our support team</p>
        </div>

        {/* Search Bar */}
        <div className="help-search">
          <Search size={18} strokeWidth={2} className="help-search-icon" />
          <input
            type="text"
            placeholder="Search for help..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Quick Links */}
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

        {/* Category Filter */}
        <div className="help-categories">
          {categories.map((cat) => (
            <button
              key={cat.id}
              className={`category-btn ${activeCategory === cat.id ? 'active' : ''}`}
              onClick={() => setActiveCategory(cat.id)}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* FAQ Section */}
        <div className="help-faq-section">
          <h2>Frequently Asked Questions</h2>
          {filteredFaqs.length > 0 ? (
            <div className="faq-list">
              {filteredFaqs.map((faq) => (
                <div
                  key={faq.id}
                  className={`faq-item ${expandedFaq === faq.id ? 'expanded' : ''}`}
                >
                  <button className="faq-question" onClick={() => toggleFaq(faq.id)}>
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
                      {/* ✅ Item 3 renders live plans; everything else uses plain text */}
                      {typeof faq.render === 'function' ? faq.render() : <p>{faq.answer}</p>}
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

        {/* Contact Support */}
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

        {/* Quick Links to Terms & Privacy */}
        <div className="help-legal-links">
          <Link to="/terms" className="legal-link">
            <FileText size={16} strokeWidth={2} />
            Terms of Service
          </Link>
          <Link to="/privacy" className="legal-link">
            <Shield size={16} strokeWidth={2} />
            Privacy Policy
          </Link>
          <Link to="/cookies" className="legal-link">
            <Cookie size={16} strokeWidth={2} />
            Cookie Policy
          </Link>
        </div>

        {/* System Status */}
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
    </div>
  );
};

export default Help;