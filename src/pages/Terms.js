// EduSpantech Terms of Service
// Version: 1.0
// Last Updated: July 9, 2026

export const TermsOfService = {
  version: "1.0",
  effectiveDate: "2026-07-09",
  
  sections: [
    {
      id: "description",
      title: "1. Description of Service",
      content: [
        "EduSpantech provides a global, live, and on-demand mathematics tutoring service for students from Grade 8 through Second-Year Tertiary level.",
        "The Service is delivered via a proprietary, video-free, ultra-low-bandwidth digital whiteboard platform staffed by a centralized team of South African tutors.",
        "The Service operates on a 24-hour cycle across 9 global AWS data hubs, covering multiple international time zones.",
        "All video streaming capabilities are permanently disabled at the server level to maximize accessibility."
      ]
    },
    {
      id: "accounts",
      title: "2. User Accounts & Cohorts",
      content: [
        "You must create an account to access the Service. You are responsible for maintaining the confidentiality of your account credentials.",
        "Upon registration, your account will be permanently tagged as either 'HighSchool' or 'UniversityFirstYear' cohort.",
        "This assignment is immutable and ensures you are routed to the correct academic content and tutor tier (Tier 1, 2, or 3).",
        "Tutors will adapt instruction based on your verified country code and regional curriculum.",
        "Grade labels are for display purposes only. Internal system tokens (Cohort_Tier_1, Cohort_Tier_2, Cohort_Tier_3) determine actual access privileges."
      ]
    },
    {
      id: "subscriptions",
      title: "3. Subscription Tiers & Billing",
      content: [
        "Tier_Silver - R100 / $6 / R$25 per month: Access to on-demand whiteboard playback archives and static notes. No live tutor interaction.",
        "Tier_Gold - R200 / $12 / R$50 per month: Live evening homework clinic access (16:00-23:00 Local Time) with South African tutors.",
        "Tier_Platinum - R350 / $20 / R$90 per month: Weekend clinic access (Sat 08:00-14:00, Sun 16:00-23:00) with queue-bypass privileges.",
        "All subscriptions are auto-renewing. Your payment method will be charged monthly until you cancel."
      ]
    },
    {
      id: "refunds",
      title: "4. Refund & Cancellation Policy",
      content: [
        "You may cancel your auto-renewing subscription at any time through your account settings.",
        "Cancellation takes effect at the end of your current billing cycle. No partial refunds for unused time.",
        "72-Hour Grace Window: You may request a refund for an accidental auto-renewal transaction within 72 hours.",
        "Refund Approval requires an automated system audit verifying zero system entries after the billing date.",
        "Any interaction with the Service after renewal will result in AUTOMATIC REJECTION of the refund."
      ]
    },
    {
      id: "platformUse",
      title: "5. Platform Use & Restrictions",
      content: [
        "The platform enforces a permanent video-free baseline. Service is for audio and vector-based whiteboard communication only.",
        "Prohibited Actions: Attempting to access video streams, tampering with cohort tags, data mining, web scraping, recording content, bypassing security protocols, or manipulating the WebGL watermark.",
        "Any attempt to disable, hide, or remove the watermark will destabilize the whiteboard engine and result in immediate session termination and permanent ban."
      ]
    },
    {
      id: "intellectualProperty",
      title: "6. Intellectual Property",
      content: [
        "All content on the Service is the exclusive property of EduSpantech or its licensors.",
        "Whiteboard drawings, instructional materials, text, graphics, logos, and software are protected by copyright laws.",
        "Access does NOT grant you rights to use, reproduce, or distribute our intellectual property for commercial or non-personal purposes."
      ]
    },
    {
      id: "drm",
      title: "7. Content Security & Digital Rights Management",
      content: [
        "All whiteboard displays contain a persistent, dynamic, moving floating coordinate watermark embedded within the WebGL drawing loop.",
        "The watermark displays your unique User UUID and public IP address and shifts position every 60 seconds.",
        "Any attempt to hide, remove, or manipulate the watermark will destabilize the rendering engine and result in immediate session termination and permanent ban from the Service."
      ]
    },
    {
      id: "liability",
      title: "8. Limitation of Liability & Disclaimers",
      content: [
        "Service is provided on an 'AS IS' and 'AS AVAILABLE' basis. No warranty that the Service will be uninterrupted, secure, or error-free.",
        "EduSpantech provides tutoring and educational support only. NO guarantees regarding academic performance, grades, or test scores.",
        "To the maximum extent permitted by law, EduSpantech is NOT liable for indirect, incidental, special, consequential, or punitive damages, or any loss of profits or revenues."
      ]
    },
    {
      id: "governingLaw",
      title: "9. Governing Law & Dispute Resolution",
      content: [
        "These Terms shall be governed by the laws of the Republic of South Africa.",
        "Disputes shall be subject to the exclusive jurisdiction of South African courts.",
        "EduSpantech may enforce its intellectual property rights in any jurisdiction worldwide."
      ]
    },
    {
      id: "contact",
      title: "10. Contact Information",
      content: [
        "For questions or concerns regarding these Terms, contact us at:",
        "Email: support@eduspantech.com"
      ]
    }
  ],

  getFullTerms() {
    return this.sections;
  },

  getSection(id) {
    return this.sections.find(section => section.id === id) || null;
  }
};

export default TermsOfService;