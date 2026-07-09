import React from 'react';
import './Terms.css';

const Terms = () => {
  return (
    <div className="terms-page">
      <div className="terms-container">
        <h1>Terms of Service</h1>
        <p className="terms-date">Last Updated: {new Date().toLocaleDateString()}</p>

        <section>
          <h2>1. Acceptance of Terms</h2>
          <p>By creating an account or using EduSpantech, you agree to these Terms of Service. If you do not agree, please do not use the platform.</p>
        </section>

        <section>
          <h2>2. User Accounts</h2>
          <h3>2.1 Eligibility</h3>
          <p>EduSpantech is exclusively for:</p>
          <ul>
            <li>High School Students (Grades 8-12, including Matric)</li>
            <li>University Students (1st and 2nd Year)</li>
          </ul>
          <p>Users under 18 must have parent or guardian consent.</p>
          <h3>2.2 Registration</h3>
          <p>You agree to provide accurate and complete information, including your cohort, country, and grade level.</p>
        </section>

        <section>
          <h2>3. Content and Conduct</h2>
          <h3>3.1 Intellectual Property</h3>
          <p>All mathematical content, proofs, and materials are proprietary to EduSpantech and protected by copyright.</p>
          <h3>3.2 Acceptable Use</h3>
          <p>You agree not to:</p>
          <ul>
            <li>Share, reproduce, or distribute proprietary mathematical content</li>
            <li>Attempt to remove or bypass WebGL watermarks</li>
            <li>Use the platform for any unlawful purpose</li>
          </ul>
        </section>

        <section>
          <h2>4. Payments and Refunds</h2>
          <h3>4.1 Subscription Tiers</h3>
          <ul>
            <li><strong>Silver:</strong> R100/month - On-demand content</li>
            <li><strong>Gold:</strong> R200/month - Live tutoring</li>
            <li><strong>Platinum:</strong> R350/month - Priority access</li>
          </ul>
          <h3>4.2 Refund Policy</h3>
          <p>In accordance with Section 42 of the South African Consumer Protection Act (CPA), educational content is classified as an instantly viewable digital property. Refunds are only available within 72 hours of purchase if NO system entries, page loads, or media packet requests have been recorded.</p>
        </section>

        <section>
          <h2>5. Disclaimer</h2>
          <p>EduSpantech provides educational support services. We do not guarantee specific academic results.</p>
        </section>

        <section>
          <h2>6. Governing Law</h2>
          <p>These Terms are governed by the laws of South Africa. All disputes shall be resolved in South African courts.</p>
        </section>

        <section>
          <h2>7. Contact</h2>
          <p>For questions about these Terms, contact us at: legal@eduspantech.com</p>
        </section>
      </div>
    </div>
  );
};

export default Terms;