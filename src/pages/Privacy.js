// EduSpantech Privacy Policy
// Version: 1.0
// Last Updated: July 9, 2026

export const PrivacyPolicy = {
  version: "1.0",
  effectiveDate: "2026-07-09",

  sections: [
    {
      id: "informationWeCollect",
      title: "1. Information We Collect",
      content: [
        "Personal Identifiers: Full name, email address, and parent/guardian contact details.",
        "Billing Information: Payment method details (processed by third-party, NOT stored by us). Last 4 digits of payment card and billing zip code for verification.",
        "Account Information: Unique User UUID (anonymized), IANA timezone identifier, country of residence, and immutable cohort tag (HighSchool or UniversityFirstYear).",
        "Technical & Usage Data: IP address, browser type, operating system, device information, session duration, and whiteboard interaction metrics.",
        "Log Data: Server logs including Moodle LMS access, WebSocket handshakes, and security event logs for troubleshooting and auditing."
      ]
    },
    {
      id: "howWeUseData",
      title: "2. How We Use Your Information",
      content: [
        "To Provide and Maintain the Service: Deliver live tutoring sessions, route to correct cohort, and connect to appropriate South African tutor.",
        "For Platform Security: Enforce Centralised Shift Authorization Matrix, prevent DDoS attacks, block parameter tampering, and verify identities.",
        "To Process Payments: Handle subscription renewals, process refund claims via automated LMS usage audits, and prevent billing disputes.",
        "To Enforce Digital Rights Management: Embed your User UUID and IP as persistent WebGL watermark to protect our content from piracy.",
        "To Improve the Service: Analyze usage patterns across 9 global AWS hubs and optimize infrastructure lifecycle.",
        "To Comply with Legal Obligations: Comply with POPIA, GDPR, Section 42 of South African Consumer Protection Act (CPA), and EU Digital Content Directive."
      ]
    },
    {
      id: "dataStorage",
      title: "3. Data Storage & Geo-Distribution",
      content: [
        "Your data is processed across 9 global AWS data hubs with primary write node in Cape Town, South Africa (af-south-1).",
        "Data is continuously replicated to read-replicas in Sao Paulo, Singapore, Ireland, N. Virginia, Oregon, Tokyo, Mumbai, and Sydney.",
        "Cross-region storage replication RPO: ≤ 1 second. Recovery Time Objective (RTO): ≤ 30 seconds.",
        "Split-Brain Write Interception mechanism enforces read-only fallback during network outages.",
        "South African residents have rights under POPIA. EU residents have rights under GDPR."
      ]
    },
    {
      id: "zeroKnowledge",
      title: "4. Zero-Knowledge Privacy Guardrails",
      content: [
        "Your real name, physical location, and payment profile metadata are symmetrically encrypted using AES-256 algorithm BEFORE cross-replication.",
        "Local edge data centers only hold access to randomized, anonymized User UUID.",
        "Even in the event of an infrastructure breach, your core registration details remain completely unreadable and safe.",
        "Zero-Knowledge PII Masking Routine ensures data protection across 9 geographic hubs."
      ]
    },
    {
      id: "securityMeasures",
      title: "5. Data Security Measures",
      content: [
        "Zero-Knowledge PII Masking: AES-256 encryption before data replication.",
        "Strict Networking Controls: Isolated VPCs with strict NACLs and Security Groups preventing direct internet ingress.",
        "Database Encryption at Rest: All data encrypted via AWS KMS using AES-256 algorithm.",
        "Advanced Authentication: HMAC SHA-256 signature verification for all server-side communications.",
        "Automated Infrastructure Gatekeeper: Token Bucket Algorithm for rate limiting and Centralised Shift Authorization Matrix.",
        "Distributed Lock Verification: Redlock Algorithm across Redis clusters to prevent split-brain counting."
      ]
    },
    {
      id: "informationSharing",
      title: "6. Information Sharing",
      content: [
        "We do not sell, trade, or otherwise transfer your personally identifiable information.",
        "We may share with Trusted Third-Party Service Providers (e.g., AWS, payment processor) who assist in operations, so long as they agree to keep information confidential.",
        "We may release information when required to comply with the law, enforce policies, or protect rights, property, or safety.",
        "Data is shared with South African tutors only through anonymized User UUID."
      ]
    },
    {
      id: "cookies",
      title: "7. Cookies",
      content: [
        "We use cookies to understand and save your preferences for future visits.",
        "We use cookies to track advertisements and compile aggregate traffic data.",
        "You may choose to refuse cookies, but this may limit your ability to use the Service."
      ]
    },
    {
      id: "childrensPrivacy",
      title: "8. Children's Privacy",
      content: [
        "Our Service is directed to students, including minors.",
        "By using the Service, you represent that you have authority to provide consent for the minor.",
        "We do not knowingly collect personal information from minors without verifiable parental consent.",
        "If we become aware of improper collection, we will delete that information."
      ]
    },
    {
      id: "changes",
      title: "9. Changes to This Privacy Policy",
      content: [
        "EduSpantech may update this Privacy Policy from time to time.",
        "We will notify you of changes by posting the new policy on this page.",
        "Updated policy is effective when posted.",
        "Review this policy periodically for changes."
      ]
    },
    {
      id: "contact",
      title: "10. Contact Us",
      content: [
        "For questions about this Privacy Policy or data practices:",
        "Email: data-privacy@eduspantech.com",
        "For general inquiries: support@eduspantech.com",
        "For security concerns: security@eduspantech.com"
      ]
    }
  ],

  getFullPolicy() {
    return this.sections;
  },

  getSection(id) {
    return this.sections.find(section => section.id === id) || null;
  }
};

export default PrivacyPolicy;