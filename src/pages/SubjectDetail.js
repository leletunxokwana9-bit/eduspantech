/* =========================================================
   EDUSPANTECH — SUBJECT DETAIL
   Complete Dark Theme Stylesheet
   File: src/pages/SubjectDetail.css
========================================================= */

/* =========================================================
   1. THEME VARIABLES
========================================================= */

.sd-redesign {
  --sd-page: #07111f;
  --sd-surface: #101d2e;
  --sd-surface-raised: #142338;
  --sd-surface-soft: #17283d;
  --sd-surface-hover: #1c3049;

  --sd-heading: #f4f7fc;
  --sd-text: #dce6f3;
  --sd-muted: #a7b6ca;
  --sd-subtle: #899bb2;

  --sd-border: #293b52;
  --sd-border-strong: #3a506b;

  --sd-accent: #83b4ff;
  --sd-accent-strong: #3979cb;
  --sd-accent-hover: #4789dc;
  --sd-accent-soft: #1b3451;

  --sd-success: #8fe0b9;
  --sd-warning: #f3d58b;
  --sd-danger: #ffb5bd;

  width: 100%;
  max-width: none;
  min-height: 100vh;
  margin: 0;
  padding: 34px 34px 70px;
  background: var(--sd-page);
  color: var(--sd-text);
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  box-sizing: border-box;
  color-scheme: dark;
}

.sd-redesign *,
.sd-redesign *::before,
.sd-redesign *::after {
  box-sizing: border-box;
}

/* =========================================================
   2. GENERAL PAGE ELEMENTS
========================================================= */

.subject-detail-container {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 24px;
  background: var(--sd-page);
  color: var(--sd-text);
  font-family: inherit;
}

.subject-detail-container h1,
.subject-detail-container h2,
.subject-detail-container h3,
.subject-detail-container h4,
.subject-detail-container h5,
.subject-detail-container h6 {
  color: var(--sd-heading);
}

.subject-detail-container p {
  color: var(--sd-muted);
}

.subject-detail-container button {
  font-family: inherit;
}

.subject-detail-container button:focus-visible {
  outline: 3px solid rgba(131, 180, 255, 0.65);
  outline-offset: 3px;
}

.sd-redesign button {
  font-family: inherit;
}

.sd-redesign button:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

.sd-page-shell {
  width: 100%;
  max-width: 1440px;
  margin: 0 auto;
  color: var(--sd-text);
}

/* =========================================================
   3. LOADING AND ERROR STATES
========================================================= */

.subject-detail-container.loading,
.subject-detail-container.error {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  text-align: center;
  color: var(--sd-text);
  background: var(--sd-page);
}

.subject-detail-container.loading p,
.subject-detail-container.error p {
  color: var(--sd-muted);
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #2b3d55;
  border-top-color: var(--sd-accent);
  border-radius: 50%;
  animation: sd-spin 1s linear infinite;
}

@keyframes sd-spin {
  to {
    transform: rotate(360deg);
  }
}

.error-icon {
  margin-bottom: 16px;
  color: #ff9a9a;
  font-size: 48px;
}

.retry-button {
  padding: 10px 24px;
  border: 0;
  border-radius: 8px;
  background: var(--sd-accent-strong);
  color: #ffffff;
  font-weight: 700;
  cursor: pointer;
  transition: background 0.2s ease;
}

.retry-button:hover {
  background: var(--sd-accent-hover);
}

/* =========================================================
   4. BREADCRUMBS
========================================================= */

.sd-breadcrumbs {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 11px;
  margin: 0 0 22px;
  color: var(--sd-subtle);
  font-size: 12px;
  font-weight: 600;
}

.sd-breadcrumbs button {
  padding: 0;
  border: 0;
  background: transparent;
  color: var(--sd-muted);
  font: inherit;
  cursor: pointer;
  transition: color 0.2s ease;
}

.sd-breadcrumbs button:hover {
  color: var(--sd-accent);
}

.sd-breadcrumbs > span:last-child {
  color: var(--sd-heading);
}

/* =========================================================
   5. SUBJECT HERO
========================================================= */

.sd-hero {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 35px;
  min-height: 270px;
  padding: 48px 54px;
  overflow: hidden;
  border: 1px solid #2b405c;
  border-radius: 16px;
  background: #101f36;
  color: #ffffff;
}

.sd-hero-copy {
  position: relative;
  z-index: 2;
  max-width: 760px;
}

.sd-eyebrow {
  margin-bottom: 17px;
  color: #a9c3e7;
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 2.2px;
}

.sd-hero h1 {
  margin: 0 0 13px;
  color: #ffffff;
  font-size: clamp(34px, 4vw, 52px);
  font-weight: 750;
  letter-spacing: -1.7px;
  line-height: 1.08;
}

.sd-hero-copy > p {
  max-width: 650px;
  margin: 0;
  color: #c4d0df;
  font-size: 14px;
  line-height: 1.8;
}

.sd-hero-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 9px;
  margin-top: 25px;
}

.sd-hero-meta span {
  display: inline-flex;
  align-items: center;
  padding: 8px 12px;
  border: 1px solid rgba(255, 255, 255, 0.17);
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.07);
  color: #e0e9f5;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.3px;
}

.sd-hero-actions {
  position: relative;
  z-index: 3;
  display: flex;
  flex-shrink: 0;
  flex-direction: column;
  align-items: stretch;
  gap: 11px;
  width: 190px;
}

.sd-enrol-button {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 15px;
  min-height: 48px;
  padding: 0 17px;
  border: 0;
  border-radius: 7px;
  background: #e8f1ff;
  color: #142641;
  font-size: 12px;
  font-weight: 800;
  cursor: pointer;
  transition: background 0.2s ease, transform 0.2s ease;
}

.sd-enrol-button:hover {
  background: #cfe1fb;
  transform: translateY(-1px);
}

.sd-enrol-button:disabled {
  cursor: wait;
  opacity: 0.6;
  transform: none;
}

.sd-enrol-button span {
  font-size: 18px;
}

.sd-back-button {
  min-height: 43px;
  padding: 0 14px;
  border: 1px solid rgba(255, 255, 255, 0.24);
  border-radius: 7px;
  background: transparent;
  color: #f5f8fd;
  font-size: 11px;
  font-weight: 700;
  cursor: pointer;
  transition: background 0.2s ease;
}

.sd-back-button:hover {
  background: rgba(255, 255, 255, 0.1);
}

.sd-hero-mark {
  position: absolute;
  z-index: 1;
  top: 50%;
  right: 250px;
  color: rgba(255, 255, 255, 0.045);
  font-size: 210px;
  font-weight: 900;
  line-height: 1;
  pointer-events: none;
  user-select: none;
  transform: translateY(-50%);
}

/* =========================================================
   6. LOGIN PROMPT MODAL
========================================================= */

.login-prompt-overlay {
  position: fixed;
  z-index: 3000;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  background: rgba(2, 8, 18, 0.84);
  backdrop-filter: blur(6px);
}

.login-prompt-modal {
  position: relative;
  width: 100%;
  max-width: 420px;
  padding: 36px;
  border: 1px solid #30445e;
  border-radius: 18px;
  background: #122238;
  color: var(--sd-text);
  text-align: center;
  box-shadow: 0 25px 80px rgba(0, 0, 0, 0.55);
}

.login-prompt-close {
  position: absolute;
  top: 14px;
  right: 16px;
  display: grid;
  place-items: center;
  width: 32px;
  height: 32px;
  border: 0;
  border-radius: 50%;
  background: #20344c;
  color: #c4d2e4;
  font-size: 20px;
  cursor: pointer;
}

.login-prompt-close:hover {
  background: #2a425e;
  color: #ffffff;
}

.login-prompt-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 64px;
  height: 64px;
  margin: 0 auto 20px;
  border-radius: 18px;
  background: #1b385b;
  color: #8bbaff;
  font-size: 28px;
}

.login-prompt-modal h3 {
  margin: 0 0 10px;
  color: #f4f7fc;
  font-size: 24px;
}

.login-prompt-modal p {
  margin-bottom: 24px;
  color: #b0bfd2;
  line-height: 1.6;
}

.login-prompt-modal strong {
  color: #edf3fb;
}

.login-prompt-actions {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.login-prompt-btn {
  width: 100%;
  padding: 13px 20px;
  border: 0;
  border-radius: 9px;
  background: var(--sd-accent-strong);
  color: #ffffff;
  font-weight: 700;
  cursor: pointer;
  transition: background 0.2s ease;
}

.login-prompt-btn:hover {
  background: var(--sd-accent-hover);
}

.login-prompt-cancel {
  padding: 12px;
  border: 0;
  background: transparent;
  color: var(--sd-muted);
  cursor: pointer;
}

.login-prompt-cancel:hover {
  color: #ffffff;
}

.login-prompt-register {
  margin-top: 20px !important;
  margin-bottom: 0 !important;
  color: var(--sd-muted);
  font-size: 13px;
}

.login-prompt-register span {
  color: var(--sd-accent);
  font-weight: 700;
  cursor: pointer;
}

.login-prompt-register span:hover {
  color: #b7d5ff;
  text-decoration: underline;
}

/* =========================================================
   7. ENROLLMENT STATUS
========================================================= */

.enrollment-status {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 15px;
  margin: 20px 0;
  padding: 16px 20px;
  border: 1px solid var(--sd-border);
  border-radius: 10px;
  color: var(--sd-text);
}

.enrollment-status p {
  margin: 0;
  color: inherit;
  line-height: 1.5;
}

.enrollment-status.success {
  border-color: #245d4d;
  background: #102d29;
  color: #9be2c3;
}

.enrollment-status.error {
  border-color: #70404d;
  background: #351f29;
  color: #ffb5bd;
}

.enrollment-status.warning {
  border-color: #75602d;
  background: #352d1b;
  color: #f3d58b;
}

.enrollment-status.info {
  border-color: #345b85;
  background: #172d47;
  color: #a9ceff;
}

.enrollment-action-btn {
  padding: 9px 16px;
  border: 0;
  border-radius: 7px;
  background: var(--sd-accent-strong);
  color: #ffffff;
  font-weight: 600;
  cursor: pointer;
}

.enrollment-action-btn:hover {
  background: var(--sd-accent-hover);
}

/* =========================================================
   8. ACCOUNT SUBSCRIPTION STRIP
========================================================= */

.sd-account-strip {
  display: flex;
  align-items: center;
  gap: 14px;
  min-height: 54px;
  margin-top: 18px;
  padding: 12px 17px;
  border: 1px solid var(--sd-border);
  border-radius: 8px;
  background: var(--sd-surface);
  color: var(--sd-text);
}

.sd-account-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--sd-muted);
  font-size: 9px;
  font-weight: 800;
  letter-spacing: 1px;
}

.sd-account-indicator > span {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #24976a;
}

.sd-account-strip > strong {
  color: var(--sd-heading);
  font-size: 12px;
}

.sd-account-strip > span {
  margin-left: auto;
  color: #7bd5aa;
  font-size: 11px;
  font-weight: 700;
}

.sd-account-strip > button {
  padding: 0;
  border: 0;
  background: transparent;
  color: var(--sd-accent);
  font-size: 11px;
  font-weight: 800;
  cursor: pointer;
}

.sd-account-strip > button:hover {
  color: #b7d5ff;
}

.sd-signin-note {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 14px;
  color: var(--sd-muted);
  font-size: 11px;
}

.sd-signin-note button {
  padding: 0;
  border: 0;
  background: transparent;
  color: var(--sd-accent);
  font-size: 11px;
  font-weight: 800;
  cursor: pointer;
}

.sd-signin-note button:hover {
  color: #b7d5ff;
}

/* =========================================================
   9. SECTION HEADINGS
========================================================= */

.sd-learning-overview {
  margin-top: 43px;
}

.sd-section-heading {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 20px;
  margin-bottom: 20px;
}

.sd-section-kicker,
.sd-panel-index {
  display: block;
  color: #8ea2bb;
  font-size: 9px;
  font-weight: 800;
  letter-spacing: 1.6px;
}

.sd-section-heading h2 {
  margin: 9px 0 6px;
  color: var(--sd-heading);
  font-size: 24px;
  font-weight: 750;
  letter-spacing: -0.6px;
}

.sd-section-heading p {
  margin: 0;
  color: var(--sd-muted);
  font-size: 12px;
  line-height: 1.7;
}

.sd-active-label {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 11px;
  border: 1px solid #285b4b;
  border-radius: 5px;
  background: #122e2a;
  color: #91d9b7;
  font-size: 10px;
  font-weight: 700;
  white-space: nowrap;
}

.sd-active-label i {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #55bd8a;
}

/* =========================================================
   10. SUBJECT STATISTICS
========================================================= */

.sd-stat-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 13px;
}

.sd-stat-card {
  display: flex;
  align-items: center;
  gap: 15px;
  min-height: 94px;
  padding: 17px;
  border: 1px solid var(--sd-border);
  border-radius: 9px;
  background: var(--sd-surface);
  transition: border-color 0.2s ease, background 0.2s ease, transform 0.2s ease;
}

.sd-stat-card:hover {
  border-color: #45617f;
  background: var(--sd-surface-raised);
  transform: translateY(-2px);
}

.sd-stat-icon {
  display: grid;
  place-items: center;
  width: 38px;
  height: 38px;
  flex: 0 0 38px;
  border-radius: 9px;
  background: var(--sd-accent-soft);
  color: #9bc4ff;
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.4px;
}

.sd-stat-card div {
  display: flex;
  flex-direction: column;
  gap: 5px;
  min-width: 0;
}

.sd-stat-card strong {
  color: var(--sd-heading);
  font-size: 19px;
  font-weight: 800;
  line-height: 1.1;
  overflow-wrap: anywhere;
}

.sd-stat-card div > span {
  color: var(--sd-muted);
  font-size: 10px;
  font-weight: 600;
}

/* =========================================================
   11. MAIN WORKSPACE
========================================================= */

.sd-workspace {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 280px;
  align-items: start;
  gap: 20px;
  margin-top: 43px;
}

.sd-workspace-main {
  min-width: 0;
  overflow: hidden;
  border: 1px solid var(--sd-border);
  border-radius: 11px;
  background: var(--sd-surface);
}

.sd-tabs-header {
  padding: 26px 28px 0;
  border-bottom: 1px solid var(--sd-border);
}

.sd-tabs-header h2 {
  margin: 8px 0 20px;
  color: var(--sd-heading);
  font-size: 23px;
  font-weight: 750;
  letter-spacing: -0.5px;
}

/* =========================================================
   12. TAB NAVIGATION
========================================================= */

.sd-tabs {
  display: flex;
  align-items: center;
  gap: 25px;
  overflow-x: auto;
  scrollbar-width: thin;
  scrollbar-color: #405773 transparent;
}

.sd-tabs button {
  position: relative;
  flex-shrink: 0;
  padding: 0 0 15px;
  border: 0;
  background: transparent;
  color: #a0b0c4;
  font-size: 11px;
  font-weight: 700;
  cursor: pointer;
  white-space: nowrap;
  transition: color 0.2s ease;
}

.sd-tabs button:hover {
  color: #c4dcff;
}

.sd-tabs button.active {
  color: var(--sd-accent);
}

.sd-tabs button.active::after {
  position: absolute;
  right: 0;
  bottom: -1px;
  left: 0;
  height: 2px;
  border-radius: 2px 2px 0 0;
  background: #6ea8f5;
  content: "";
}

.sd-tab-panel {
  min-height: 400px;
  padding: 28px;
  color: var(--sd-text);
}

/* =========================================================
   13. OVERVIEW PANEL
========================================================= */

.sd-overview-intro {
  padding-bottom: 26px;
  border-bottom: 1px solid var(--sd-border);
}

.sd-overview-intro h3 {
  margin: 12px 0 10px;
  color: var(--sd-heading);
  font-size: 25px;
  font-weight: 750;
  letter-spacing: -0.6px;
}

.sd-overview-intro > p {
  max-width: 700px;
  margin: 0;
  color: #b0bfd2;
  font-size: 13px;
  line-height: 1.8;
}

.sd-overview-facts {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0 24px;
  padding: 8px 0;
}

.sd-overview-facts > div {
  display: flex;
  flex-direction: column;
  gap: 7px;
  padding: 17px 0;
  border-bottom: 1px solid var(--sd-border);
}

.sd-overview-facts span {
  color: #9aabc0;
  font-size: 10px;
  font-weight: 700;
}

.sd-overview-facts strong {
  color: #e4edf8;
  font-size: 13px;
  font-weight: 750;
  overflow-wrap: anywhere;
}

/* =========================================================
   14. OVERVIEW CALLOUT
========================================================= */

.sd-overview-callout {
  display: flex;
  align-items: center;
  gap: 15px;
  margin-top: 22px;
  padding: 18px;
  border: 1px solid #304760;
  border-radius: 8px;
  background: var(--sd-surface-soft);
}

.sd-callout-symbol {
  display: grid;
  place-items: center;
  width: 36px;
  height: 36px;
  flex: 0 0 36px;
  border-radius: 8px;
  background: #203b5b;
  color: #a9ccff;
  font-size: 18px;
  font-weight: 800;
}

.sd-overview-callout > div:nth-child(2) {
  flex: 1;
  min-width: 0;
}

.sd-overview-callout strong {
  color: var(--sd-heading);
  font-size: 12px;
}

.sd-overview-callout p {
  margin: 5px 0 0;
  color: #aab9cc;
  font-size: 11px;
  line-height: 1.6;
}

.sd-overview-callout button {
  flex-shrink: 0;
  padding: 10px 13px;
  border: 0;
  border-radius: 6px;
  background: var(--sd-accent-strong);
  color: #ffffff;
  font-size: 10px;
  font-weight: 750;
  cursor: pointer;
  transition: background 0.2s ease;
}

.sd-overview-callout button:hover {
  background: var(--sd-accent-hover);
}

/* =========================================================
   15. CURRICULUM PANEL
========================================================= */

.sd-panel-heading {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 15px;
  margin-bottom: 24px;
}

.sd-panel-heading h3 {
  margin: 8px 0 0;
  color: var(--sd-heading);
  font-size: 22px;
  font-weight: 750;
  letter-spacing: -0.5px;
}

.sd-panel-heading > span {
  color: var(--sd-muted);
  font-size: 10px;
  font-weight: 700;
  white-space: nowrap;
}

.sd-topic-tree {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* =========================================================
   16. TOPIC BLOCKS
========================================================= */

.sd-topic-block {
  overflow: hidden;
  border: 1px solid var(--sd-border);
  border-radius: 8px;
  background: var(--sd-surface);
}

.sd-topic-title {
  display: flex;
  align-items: center;
  gap: 14px;
  width: 100%;
  padding: 17px 18px;
  border: 0;
  background: var(--sd-surface);
  color: var(--sd-text);
  text-align: left;
  cursor: pointer;
  transition: background 0.2s ease;
}

.sd-topic-title:hover {
  background: var(--sd-surface-soft);
}

.sd-topic-number {
  display: grid;
  place-items: center;
  width: 34px;
  height: 34px;
  flex: 0 0 34px;
  border-radius: 7px;
  background: var(--sd-accent-soft);
  color: #a9ccff;
  font-size: 10px;
  font-weight: 800;
}

.sd-topic-title-copy {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 5px;
  min-width: 0;
}

.sd-topic-title-copy strong {
  color: var(--sd-heading);
  font-size: 12px;
  font-weight: 750;
}

.sd-topic-title-copy small {
  overflow: hidden;
  color: var(--sd-muted);
  font-size: 10px;
  text-overflow: ellipsis;
}

.sd-topic-count {
  color: #9aabc0;
  font-size: 10px;
  font-weight: 600;
  white-space: nowrap;
}

.sd-toggle {
  flex-shrink: 0;
  color: #b4c4d8;
  font-size: 18px;
  transition: transform 0.2s ease;
}

.sd-toggle.expanded {
  transform: rotate(180deg);
}

.sd-topic-content {
  padding: 0 18px 18px 66px;
  color: var(--sd-text);
}

.sd-topic-content:empty {
  display: none;
}

/* =========================================================
   17. GENERAL SUBJECT RESOURCES HEADING
========================================================= */

.sd-topic-block-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 15px;
  padding: 17px 18px;
  border-bottom: 1px solid var(--sd-border);
}

.sd-topic-block-heading > div > span {
  color: #9aabc0;
  font-size: 9px;
  font-weight: 800;
  letter-spacing: 1.2px;
}

.sd-topic-block-heading h4 {
  margin: 6px 0 0;
  color: var(--sd-heading);
  font-size: 13px;
}

.sd-topic-block-heading small {
  color: var(--sd-muted);
  font-size: 10px;
}

/* =========================================================
   18. SUBTOPICS
========================================================= */

.sd-subtopic-block {
  margin-top: 17px;
}

.sd-subtopic-heading {
  display: flex;
  flex-direction: column;
  gap: 5px;
  padding: 10px 0;
}

.sd-subtopic-heading strong {
  color: #e2ebf7;
  font-size: 11px;
}

.sd-subtopic-heading span {
  color: #aab9cc;
  font-size: 10px;
  line-height: 1.6;
}

/* =========================================================
   19. RESOURCE LIST
========================================================= */

.sd-resource-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding-top: 10px;
}

.sd-resource-card {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  min-width: 0;
  padding: 12px;
  border: 1px solid #2b4059;
  border-radius: 7px;
  background: var(--sd-surface-raised);
  color: var(--sd-text);
  text-align: left;
  cursor: pointer;
  transition: border-color 0.2s ease, background 0.2s ease;
}

.sd-resource-card:hover {
  border-color: #49698c;
  background: var(--sd-surface-hover);
}

.sd-res-icon {
  display: grid;
  place-items: center;
  width: 34px;
  height: 34px;
  flex: 0 0 34px;
  border-radius: 7px;
  background: #203852;
  color: #b8d5ff;
  font-size: 15px;
}

.sd-res-body {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.sd-res-name {
  overflow: hidden;
  color: #eaf1fa;
  font-size: 11px;
  font-weight: 750;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.sd-res-desc {
  overflow: hidden;
  color: #a5b5c9;
  font-size: 10px;
  line-height: 1.5;
  text-overflow: ellipsis;
}

.sd-res-free {
  flex-shrink: 0;
  padding: 4px 6px;
  border-radius: 4px;
  background: #17392f;
  color: #9be0bd;
  font-size: 8px;
  font-weight: 800;
  letter-spacing: 0.5px;
}

.sd-resource-arrow {
  flex-shrink: 0;
  color: #a9bad0;
  font-size: 15px;
}

/* =========================================================
   20. CONTENT LOADING STATE
========================================================= */

.sd-content-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 260px;
  padding: 35px;
  color: var(--sd-text);
  text-align: center;
}

.sd-content-loading p {
  max-width: 440px;
  color: #aab9cc;
  font-size: 12px;
  line-height: 1.7;
}

/* =========================================================
   21. EMPTY CONTENT STATE
========================================================= */

.sd-empty-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 260px;
  padding: 35px;
  color: var(--sd-text);
  text-align: center;
}

.sd-empty-symbol {
  display: grid;
  place-items: center;
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: var(--sd-accent-soft);
  color: #a9ccff;
  font-size: 24px;
}

.sd-empty-content h4 {
  margin: 15px 0 7px;
  color: var(--sd-heading);
  font-size: 15px;
}

.sd-empty-content p {
  max-width: 440px;
  color: #aab9cc;
  font-size: 12px;
  line-height: 1.7;
}

.sd-empty-content .sd-inline-action {
  margin-top: 8px;
}

/* =========================================================
   22. SCHEDULE PANEL
========================================================= */

.sd-schedule-panel {
  min-height: 320px;
  color: var(--sd-text);
}

.sd-schedule-panel > h3 {
  margin: 9px 0 8px;
  color: var(--sd-heading);
  font-size: 22px;
}

.sd-schedule-panel .sd-empty-content {
  margin-top: 20px;
  border: 1px dashed var(--sd-border-strong);
  border-radius: 9px;
  background: var(--sd-surface-raised);
}

.sd-inline-action {
  padding: 10px 14px;
  border: 0;
  border-radius: 6px;
  background: var(--sd-accent-strong);
  color: #ffffff;
  font-size: 11px;
  font-weight: 750;
  cursor: pointer;
  transition: background 0.2s ease;
}

.sd-inline-action:hover {
  background: var(--sd-accent-hover);
}

/* =========================================================
   23. WORKSPACE SIDEBAR
========================================================= */

.sd-workspace-aside {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.sd-aside-card {
  padding: 21px;
  border: 1px solid var(--sd-border);
  border-radius: 10px;
  background: var(--sd-surface);
  color: var(--sd-text);
}

.sd-about-card h3 {
  margin: 9px 0 18px;
  color: var(--sd-heading);
  font-size: 16px;
  font-weight: 750;
}

.sd-aside-detail {
  display: flex;
  flex-direction: column;
  gap: 5px;
  padding: 12px 0;
  border-top: 1px solid var(--sd-border);
}

.sd-aside-detail span {
  color: #9eafc4;
  font-size: 10px;
  font-weight: 600;
}

.sd-aside-detail strong {
  color: #e4edf8;
  font-size: 12px;
  font-weight: 750;
  overflow-wrap: anywhere;
}

/* =========================================================
   24. NEXT ACTION SIDEBAR CARD
========================================================= */

.sd-next-card {
  border-color: #304760;
  background: var(--sd-surface-soft);
}

.sd-next-label {
  color: #9fc3f1;
  font-size: 9px;
  font-weight: 800;
  letter-spacing: 1.3px;
}

.sd-next-card h3 {
  margin: 12px 0 9px;
  color: var(--sd-heading);
  font-size: 17px;
  line-height: 1.4;
}

.sd-next-card p {
  margin: 0 0 18px;
  color: #aab9cc;
  font-size: 11px;
  line-height: 1.7;
}

.sd-next-card button {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  width: 100%;
  padding: 12px 13px;
  border: 0;
  border-radius: 6px;
  background: var(--sd-accent-strong);
  color: #ffffff;
  font-size: 10px;
  font-weight: 750;
  cursor: pointer;
  transition: background 0.2s ease;
}

.sd-next-card button:hover {
  background: var(--sd-accent-hover);
}

.sd-next-card button span {
  font-size: 16px;
}

/* =========================================================
   25. RESOURCE VIEWER MODAL
========================================================= */

.sd-viewer-overlay {
  position: fixed;
  z-index: 3000;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  background: rgba(1, 7, 16, 0.88);
  backdrop-filter: blur(5px);
}

.sd-viewer {
  position: relative;
  width: 100%;
  max-width: 900px;
  max-height: 90vh;
  overflow-y: auto;
  padding: 30px;
  border: 1px solid #30445e;
  border-radius: 16px;
  background: var(--sd-surface);
  color: var(--sd-text);
  box-shadow: 0 25px 80px rgba(0, 0, 0, 0.6);
}

.sd-viewer-close {
  position: absolute;
  top: 15px;
  right: 15px;
  display: grid;
  place-items: center;
  width: 35px;
  height: 35px;
  border: 0;
  border-radius: 50%;
  background: #20344c;
  color: #d1dceb;
  font-size: 18px;
  cursor: pointer;
}

.sd-viewer-close:hover {
  background: #2b4562;
  color: #ffffff;
}

.sd-viewer h2 {
  margin: 0 0 12px;
  padding-right: 45px;
  color: var(--sd-heading);
  font-size: 22px;
}

.sd-viewer-desc {
  margin-bottom: 20px;
  color: #b0bfd2;
  line-height: 1.6;
}

.sd-viewer-embed {
  width: 100%;
  margin-top: 20px;
  color: var(--sd-text);
}

.sd-viewer-embed iframe {
  display: block;
  width: 100%;
  min-height: 500px;
  border: 1px solid var(--sd-border);
  border-radius: 10px;
  background: #ffffff;
}

.sd-viewer-embed iframe[src*="youtube"] {
  min-height: auto;
  aspect-ratio: 16 / 9;
}

.sd-open-link {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin-top: 15px;
  padding: 11px 18px;
  border-radius: 8px;
  background: var(--sd-accent-strong);
  color: #ffffff;
  font-weight: 600;
  text-decoration: none;
  transition: background 0.2s ease;
}

.sd-open-link:hover {
  background: var(--sd-accent-hover);
  color: #ffffff;
}

/* =========================================================
   26. LEGACY SUBJECT COMPONENT COMPATIBILITY
   Keeps older subject components readable in dark mode.
========================================================= */

.subject-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 24px;
  margin-bottom: 30px;
}

.subject-header-content {
  flex: 1;
}

.subject-header-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.subject-title {
  margin: 0 0 12px;
  color: var(--sd-heading);
  font-size: 32px;
  font-weight: 800;
}

.subject-description {
  color: var(--sd-muted);
  font-size: 15px;
  line-height: 1.7;
}

.subject-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 18px;
}

.subject-meta span {
  display: inline-flex;
  align-items: center;
  padding: 7px 12px;
  border: 1px solid var(--sd-border-strong);
  border-radius: 7px;
  background: var(--sd-surface-soft);
  color: #c3d0e1;
  font-size: 12px;
  font-weight: 700;
}

.enroll-button {
  padding: 12px 20px;
  border: 0;
  border-radius: 8px;
  background: var(--sd-accent-strong);
  color: #ffffff;
  font-weight: 700;
  cursor: pointer;
}

.enroll-button:hover {
  background: var(--sd-accent-hover);
}

.enroll-button:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

.syllabus-button {
  padding: 12px 20px;
  border: 1px solid var(--sd-border-strong);
  border-radius: 8px;
  background: var(--sd-surface-raised);
  color: var(--sd-text);
  font-weight: 700;
  cursor: pointer;
}

.syllabus-button:hover {
  background: var(--sd-surface-hover);
}

/* =========================================================
   27. LEGACY SUBJECT INFORMATION
========================================================= */

.subject-information {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 20px;
  margin: 30px 0;
}

.subject-information-card {
  padding: 22px;
  border: 1px solid var(--sd-border);
  border-radius: 12px;
  background: var(--sd-surface);
}

.subject-information-card h3 {
  margin: 0 0 15px;
  color: var(--sd-heading);
  font-size: 17px;
}

.subject-information-card p {
  color: var(--sd-muted);
  line-height: 1.65;
}

/* =========================================================
   28. LEGACY SUBJECT TABS
========================================================= */

.subject-tabs {
  display: flex;
  align-items: center;
  gap: 25px;
  margin-top: 30px;
  border-bottom: 1px solid var(--sd-border);
}

.subject-tab {
  position: relative;
  padding: 15px 0;
  border: 0;
  background: transparent;
  color: var(--sd-muted);
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
}

.subject-tab:hover,
.subject-tab.active {
  color: var(--sd-accent);
}

.subject-tab.active::after {
  position: absolute;
  right: 0;
  bottom: -1px;
  left: 0;
  height: 3px;
  border-radius: 3px 3px 0 0;
  background: #6ea8f5;
  content: "";
}

/* =========================================================
   29. LEGACY TOPICS AND RESOURCES
========================================================= */

.topic-item {
  margin-bottom: 12px;
  overflow: hidden;
  border: 1px solid var(--sd-border);
  border-radius: 10px;
  background: var(--sd-surface);
}

.topic-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 15px;
  padding: 17px 20px;
  background: var(--sd-surface);
  cursor: pointer;
}

.topic-header:hover {
  background: var(--sd-surface-soft);
}

.topic-header h3 {
  margin: 0;
  color: var(--sd-heading);
  font-size: 15px;
}

.topic-content {
  padding: 0 20px 20px;
  color: var(--sd-text);
}

.resource-item {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 8px;
  padding: 12px;
  border-radius: 8px;
  background: var(--sd-surface-raised);
  color: var(--sd-text);
  cursor: pointer;
}

.resource-item:hover {
  background: var(--sd-surface-hover);
}

.resource-item-name {
  color: #e3edf9;
  font-size: 14px;
  font-weight: 600;
}

/* =========================================================
   30. LEGACY SCHEDULE
========================================================= */

.schedule-container {
  padding: 25px 0;
}

.schedule-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 15px;
  margin-bottom: 12px;
  padding: 17px;
  border: 1px solid var(--sd-border);
  border-radius: 10px;
  background: var(--sd-surface);
  color: var(--sd-text);
}

.schedule-item h4 {
  margin: 0 0 5px;
  color: var(--sd-heading);
}

.schedule-item p {
  margin: 0;
  color: var(--sd-muted);
  font-size: 13px;
}

/* =========================================================
   31. WHITEBOARD
   Whiteboard remains a white drawing surface by design.
========================================================= */

.whiteboard-preview {
  position: relative;
  overflow: hidden;
  border: 1px solid var(--sd-border-strong);
  border-radius: 12px;
  background: #ffffff;
}

.whiteboard-preview img {
  display: block;
  width: 100%;
  height: auto;
}

/* =========================================================
   32. GENERIC DARK FORM CONTROLS
========================================================= */

.sd-redesign input,
.sd-redesign select,
.sd-redesign textarea {
  border: 1px solid var(--sd-border-strong);
  border-radius: 7px;
  background: var(--sd-surface-raised);
  color: var(--sd-heading);
}

.sd-redesign input::placeholder,
.sd-redesign textarea::placeholder {
  color: var(--sd-subtle);
  opacity: 1;
}

.sd-redesign select option {
  background: var(--sd-surface-raised);
  color: var(--sd-heading);
}

.sd-redesign input:focus,
.sd-redesign select:focus,
.sd-redesign textarea:focus {
  border-color: var(--sd-accent);
  outline: 2px solid rgba(131, 180, 255, 0.2);
}

.sd-redesign hr {
  border: 0;
  border-top: 1px solid var(--sd-border);
}

.sd-redesign code,
.sd-redesign pre {
  border: 1px solid var(--sd-border);
  border-radius: 6px;
  background: #0b1727;
  color: #dce9fa;
}

/* =========================================================
   33. SCROLLBARS
========================================================= */

.sd-redesign * {
  scrollbar-color: #405773 #101d2e;
}

.sd-redesign *::-webkit-scrollbar {
  width: 9px;
  height: 9px;
}

.sd-redesign *::-webkit-scrollbar-track {
  background: #101d2e;
}

.sd-redesign *::-webkit-scrollbar-thumb {
  border: 2px solid #101d2e;
  border-radius: 20px;
  background: #405773;
}

.sd-redesign *::-webkit-scrollbar-thumb:hover {
  background: #587493;
}

/* =========================================================
   34. TABLET RESPONSIVENESS
========================================================= */

@media (max-width: 1100px) {
  .sd-workspace {
    grid-template-columns: minmax(0, 1fr) 250px;
  }

  .sd-stat-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .sd-hero {
    padding: 35px;
  }

  .sd-hero-mark {
    right: 210px;
  }
}

/* =========================================================
   35. MOBILE RESPONSIVENESS
========================================================= */

@media (max-width: 800px) {
  .sd-redesign {
    padding: 22px 15px 50px;
    background: var(--sd-page);
  }

  .sd-hero {
    align-items: flex-start;
    flex-direction: column;
    padding: 30px 25px;
  }

  .sd-hero-actions {
    flex-direction: row;
    width: 100%;
  }

  .sd-hero-actions button {
    flex: 1;
  }

  .sd-hero-mark {
    top: 30px;
    right: 20px;
    font-size: 120px;
    transform: none;
  }

  .sd-workspace {
    grid-template-columns: 1fr;
  }

  .sd-workspace-aside {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .sd-tabs-header {
    padding: 22px 18px 0;
  }

  .sd-tab-panel {
    padding: 22px 18px;
  }

  .sd-workspace-main,
  .sd-aside-card,
  .sd-stat-card,
  .sd-account-strip {
    background-color: var(--sd-surface);
  }
}

/* =========================================================
   36. SMALL MOBILE RESPONSIVENESS
========================================================= */

@media (max-width: 560px) {
  .sd-redesign {
    padding: 18px 12px 40px;
  }

  .sd-hero {
    padding: 27px 20px;
  }

  .sd-hero h1 {
    font-size: 34px;
  }

  .sd-hero-copy > p {
    font-size: 13px;
  }

  .sd-hero-actions {
    flex-direction: column;
  }

  .sd-hero-mark {
    right: 10px;
    font-size: 90px;
  }

  .sd-stat-grid {
    grid-template-columns: 1fr 1fr;
    gap: 8px;
  }

  .sd-stat-card {
    gap: 9px;
    min-height: 76px;
    padding: 12px;
  }

  .sd-stat-icon {
    width: 31px;
    height: 31px;
    flex-basis: 31px;
  }

  .sd-stat-card strong {
    font-size: 15px;
  }

  .sd-stat-card div > span {
    font-size: 9px;
  }

  .sd-section-heading {
    align-items: flex-start;
    flex-direction: column;
  }

  .sd-workspace-aside {
    grid-template-columns: 1fr;
  }

  .sd-tabs {
    gap: 16px;
  }

  .sd-tabs button {
    font-size: 10px;
  }

  .sd-tabs-header h2 {
    font-size: 21px;
  }

  .sd-overview-facts {
    grid-template-columns: 1fr;
  }

  .sd-overview-callout {
    align-items: flex-start;
    flex-wrap: wrap;
  }

  .sd-overview-callout button {
    margin-left: 52px;
  }

  .sd-topic-content {
    padding-right: 12px;
    padding-left: 14px;
  }

  .sd-topic-title {
    gap: 9px;
    padding: 14px 12px;
  }

  .sd-topic-count {
    display: none;
  }

  .sd-account-strip {
    flex-wrap: wrap;
  }

  .sd-account-strip > span {
    margin-left: 0;
  }

  .sd-panel-heading {
    align-items: flex-start;
    flex-direction: column;
  }

  .sd-viewer {
    max-height: 94vh;
    padding: 22px;
  }

  .sd-viewer-embed iframe {
    min-height: 350px;
  }

  .login-prompt-modal {
    padding: 30px 22px;
  }

  .enrollment-status {
    align-items: flex-start;
    flex-direction: column;
  }

  .subject-information {
    grid-template-columns: 1fr;
  }

  .subject-header {
    flex-direction: column;
  }

  .subject-tabs {
    gap: 20px;
    overflow-x: auto;
  }

  .subject-title {
    font-size: 26px;
  }
}

/* =========================================================
   37. REDUCED MOTION ACCESSIBILITY
========================================================= */

@media (prefers-reduced-motion: reduce) {
  .sd-redesign *,
  .sd-redesign *::before,
  .sd-redesign *::after {
    scroll-behavior: auto !important;
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
