// src/pages/Help.js
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './Help.css';

const Help = () => {
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedFaq, setExpandedFaq] = useState(null);

  // FAQ Data
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
      answer: 'We offer three plans: Silver (R100/month) - self-study with archives, Gold (R200/month) - live evening clinics, and Platinum (R350/month) - premium access with weekend clinics and priority support.'
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

  // Categories for filtering
  const categories = [
    { id: 'all', label: 'All Topics' },
    { id: 'account', label: 'Account' },
    { id: 'subscription', label: 'Subscription' },
    { id: 'technical', label: 'Technical' },
    { id: 'sessions', label: 'Sessions' },
    { id: 'billing', label: 'Billing' }
  ];

  // Filter FAQs
  const filteredFaqs = faqs.filter(faq => {
    const matchesCategory = activeCategory === 'all' || faq.category === activeCategory;
    const matchesSearch = faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
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
          <h1>🆘 Help & Support</h1>
          <p>Find answers to your questions or get in touch with our support team</p>
        </div>

        {/* Search Bar */}
        <div className="help-search">
          <input
            type="text"
            placeholder="Search for help..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <button className="help-search-btn">🔍</button>
        </div>

        {/* Quick Links */}
        <div className="help-quick-links">
          <Link to="/help/getting-started" className="quick-link">
            <span className="quick-icon">🚀</span>
            <span>Getting Started</span>
          </Link>
          <Link to="/help/tutors" className="quick-link">
            <span className="quick-icon">👨‍🏫</span>
            <span>Working with Tutors</span>
          </Link>
          <Link to="/help/whiteboard" className="quick-link">
            <span className="quick-icon">✏️</span>
            <span>Using Whiteboard</span>
          </Link>
          <Link to="/help/billing" className="quick-link">
            <span className="quick-icon">💳</span>
            <span>Billing & Payments</span>
          </Link>
          <Link to="/help/technical" className="quick-link">
            <span className="quick-icon">⚙️</span>
            <span>Technical Issues</span>
          </Link>
          <Link to="/help/contact" className="quick-link">
            <span className="quick-icon">📧</span>
            <span>Contact Support</span>
          </Link>
        </div>

        {/* Category Filter */}
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

        {/* FAQ Section */}
        <div className="help-faq-section">
          <h2>Frequently Asked Questions</h2>
          {filteredFaqs.length > 0 ? (
            <div className="faq-list">
              {filteredFaqs.map(faq => (
                <div key={faq.id} className={`faq-item ${expandedFaq === faq.id ? 'expanded' : ''}`}>
                  <button className="faq-question" onClick={() => toggleFaq(faq.id)}>
                    <span>{faq.question}</span>
                    <span className="faq-icon">{expandedFaq === faq.id ? '−' : '+'}</span>
                  </button>
                  {expandedFaq === faq.id && (
                    <div className="faq-answer">
                      <p>{faq.answer}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="help-no-results">
              <span>🔍</span>
              <p>No results found for "{searchQuery}"</p>
              <p className="help-no-results-sub">Try different keywords or browse categories above</p>
            </div>
          )}
        </div>

        {/* Contact Support */}
        <div className="help-contact-section">
          <div className="help-contact-card">
            <h3>Still need help?</h3>
            <p>Our support team is available 24/7 to assist you with any questions or issues.</p>
            <div className="help-contact-options">
              <button className="help-contact-btn primary">📧 Email Support</button>
              <button className="help-contact-btn secondary">💬 Live Chat</button>
            </div>
            <div className="help-response-time">
              <span>⏱️ Response time: Usually within 2 hours</span>
            </div>
          </div>
        </div>

        {/* Quick Links to Terms & Privacy */}
        <div className="help-legal-links">
          <Link to="/terms" className="legal-link">📜 Terms of Service</Link>
          <Link to="/privacy" className="legal-link">🔒 Privacy Policy</Link>
          <Link to="/cookies" className="legal-link">🍪 Cookie Policy</Link>
        </div>

        {/* System Status */}
        <div className="help-status">
          <div className="status-indicator">
            <span className="status-dot green"></span>
            <span>All systems operational</span>
          </div>
          <span className="status-updated">Last updated: {new Date().toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
};

export default Help;