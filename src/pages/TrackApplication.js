// src/pages/TrackApplication.js
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { tutorApplicationService } from '../services/tutorApplicationService';
import './TrackApplication.css';

const STAGES = [
  { key: 'received', label: 'Application Received' },
  { key: 'review', label: 'Under Review' },
  { key: 'interview', label: 'Interview' },
  { key: 'approved', label: 'Onboarding' }
];

const STATUS_TO_STAGE = {
  pending: 1,
  under_review: 2,
  interview_scheduled: 3,
  interview_passed: 3,
  interview_failed: 3,
  background_check: 3,
  approved: 4,
  rejected: 4,      // kept for fallback — but we render a distinct layout for it
  withdrawn: 4
};

const STATUS_HEADLINES = {
  pending: 'Application Received',
  under_review: 'Under Review',
  interview_scheduled: 'Interview Scheduled',
  interview_passed: 'Interview Passed',
  interview_failed: 'Interview Not Passed',
  background_check: 'Background Check',
  approved: 'Approved',
  rejected: 'Not Approved',
  withdrawn: 'Withdrawn'
};

const TrackApplication = () => {
  const [email, setEmail] = useState('');
  const [idNumber, setIdNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const handleIdChange = (e) => {
    setIdNumber(e.target.value.replace(/\D/g, ''));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setResult(null);

    if (!email.trim()) return setError('Please enter your email address');
    if (!idNumber.trim()) return setError('Please enter your ID number');
    if (!/^\d{6,20}$/.test(idNumber)) return setError('ID number must be 6–20 digits');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return setError('Please enter a valid email');

    setLoading(true);
    try {
      const res = await tutorApplicationService.track(email.trim(), idNumber.trim());
      if (res.found) {
        setResult(res.application);
      } else {
        setError(res.error || 'No application found for those details');
      }
    } catch (err) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const isRejected = result?.status === 'rejected';
  const isWithdrawn = result?.status === 'withdrawn';
  const isFinalNegative = isRejected || isWithdrawn;

  // When rejected, freeze the timeline at whatever stage they got to.
  // We don't have per-stage dates in the DB yet, so we show "Done" for
  // stages 1–3 (since they were reviewed and interviewed) and mark the
  // 4th slot as "Not Approved" instead of "Onboarding".
  const activeStage = result
    ? (isRejected ? 3 : (isWithdrawn ? 3 : (STATUS_TO_STAGE[result.status] || 1)))
    : 0;

  const headline = result ? (STATUS_HEADLINES[result.status] || 'Status') : '';
  const formattedDate = result?.submitted_at
    ? new Date(result.submitted_at).toLocaleDateString('en-ZA', {
        day: 'numeric', month: 'short', year: 'numeric'
      })
    : '';

  return (
    <div className="ta-page">
      <div className="ta-container">
        {/* LEFT — search form */}
        <div className="ta-left">
          <div className="ta-left-header">
            <div className="ta-icon-circle">👤</div>
            <div>
              <h2>Your Details</h2>
              <p>Use the same email and ID number you used in your application.</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="ta-form">
            <div className="ta-field">
              <label>
                <span className="ta-label-icon">👤</span>
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="Enter your email address"
                disabled={loading}
                autoComplete="email"
              />
            </div>

            <div className="ta-field">
              <label>
                <span className="ta-label-icon">🆔</span>
                ID Number
              </label>
              <input
                type="text"
                inputMode="numeric"
                value={idNumber}
                onChange={handleIdChange}
                placeholder="Enter your ID number"
                disabled={loading}
                maxLength={20}
              />
            </div>

            {error && <div className="ta-error">⚠️ {error}</div>}

            <button type="submit" className="ta-submit" disabled={loading}>
              {loading ? '⏳ Checking…' : '🔍 Check Status'}
            </button>
          </form>

          <div className="ta-left-footer">
            <span className="ta-note">
              Your future<br />in teaching<br />matters! ✨
            </span>
          </div>
        </div>

        {/* RIGHT — status card */}
        <div className="ta-right">
          <div className="ta-right-header">
            <div className={`ta-status-circle ${isFinalNegative ? 'rejected' : ''}`}>
              <span className="ta-check">{isFinalNegative ? '✕' : '✓'}</span>
            </div>
            <div>
              <h2>Application Status</h2>
              <p>Here's the latest update on your application.</p>
            </div>
          </div>

          {!result ? (
            <div className="ta-placeholder">
              <div className="ta-placeholder-icon">📄</div>
              <h3>No details yet</h3>
              <p>Enter your email and ID number on the left, then click <strong>Check Status</strong>.</p>
            </div>
          ) : (
            <>
              {/* Headline box — green for success, red for rejected/withdrawn */}
              <div className={`ta-headline-box ${isFinalNegative ? 'rejected' : ''}`}>
                <div className={`ta-headline-icon ${isFinalNegative ? 'rejected' : ''}`}>
                  {isFinalNegative ? '✕' : '👤'}
                </div>
                <div>
                  <h3>{headline}</h3>
                  <p>{result.message}</p>
                </div>
              </div>

              {/* Progress timeline — hidden for final negative states */}
              {!isFinalNegative && (
                <div className="ta-timeline">
                  {STAGES.map((stage, idx) => {
                    const stageNum = idx + 1;
                    const isDone = stageNum < activeStage;
                    const isActive = stageNum === activeStage;
                    return (
                      <React.Fragment key={stage.key}>
                        <div className={`ta-timeline-node ${isDone ? 'done' : ''} ${isActive ? 'active' : ''}`}>
                          <div className="ta-timeline-dot">
                            {isDone ? '✓' : isActive ? '●' : '○'}
                          </div>
                          <div className="ta-timeline-label">{stage.label}</div>
                          <div className="ta-timeline-status">
                            {isDone ? 'Done' : isActive ? formattedDate : 'Pending'}
                          </div>
                        </div>
                        {idx < STAGES.length - 1 && (
                          <div className={`ta-timeline-line ${stageNum < activeStage ? 'done' : ''}`} />
                        )}
                      </React.Fragment>
                    );
                  })}
                </div>
              )}

              {/* When rejected — show the journey summary compactly instead of a misleading timeline */}
              {isRejected && (
                <div className="ta-journey-summary">
                  <div className="ta-journey-steps">
                    <span className="ta-journey-step done">
                      ✓ Received
                    </span>
                    <span className="ta-journey-arrow">›</span>
                    <span className="ta-journey-step done">
                      ✓ Reviewed
                    </span>
                    <span className="ta-journey-arrow">›</span>
                    <span className="ta-journey-step rejected">
                      ✕ Not Approved
                    </span>
                  </div>
                  <p className="ta-journey-note">
                    Your application was reviewed and we've decided not to move forward at this time.
                  </p>
                </div>
              )}

              {/* Interview box — only when actually scheduled and not rejected */}
              {result.interview_at && !isFinalNegative && (
                <div className="ta-interview-box">
                  <h4>📅 Interview Scheduled</h4>
                  <p><strong>Date:</strong> {new Date(result.interview_at).toLocaleString('en-ZA')}</p>
                  {result.interview_link && (
                    <a
                      href={result.interview_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ta-interview-link"
                    >
                      🎥 Join Interview
                    </a>
                  )}
                </div>
              )}

              {/* Approved */}
              {result.status === 'approved' && (
                <div className="ta-approved-box">
                  <h4>🎉 You're approved!</h4>
                  <p>Check your email for login credentials, then sign in to access your tutor dashboard.</p>
                  <Link to="/login" className="ta-login-btn">
                    Login to your tutor dashboard →
                  </Link>
                </div>
              )}

              {/* Rejection reason */}
              {isRejected && result.rejection_reason && (
                <div className="ta-rejection-box">
                  <h4>Reason</h4>
                  <p>{result.rejection_reason}</p>
                </div>
              )}

              {/* Applicant summary card */}
              <div className="ta-summary">
                <div className="ta-summary-photo">
                  {result.photo_url ? (
                    <img src={result.photo_url} alt={result.full_name} />
                  ) : (
                    <div className="ta-summary-initials">
                      {(result.full_name || '?').charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="ta-summary-info">
                  <h3>{result.full_name}</h3>
                  <p>{result.email}</p>
                  {result.subjects?.length > 0 && (
                    <div className="ta-summary-subjects">
                      {result.subjects.slice(0, 5).map(s => (
                        <span key={s} className="ta-subject-pill">{s}</span>
                      ))}
                    </div>
                  )}
                  <div className="ta-summary-meta">
                    {result.country && <span>🌍 {result.country}</span>}
                    {result.years_experience > 0 && <span>📅 {result.years_experience} yrs</span>}
                    {result.hourly_rate && <span>💵 R{result.hourly_rate}/hr</span>}
                  </div>
                </div>
              </div>
            </>
          )}

          <div className="ta-support">
            <span className="ta-support-icon">ⓘ</span>
            <div>
              <strong>Need help?</strong> If you're experiencing issues, please contact our support team at{' '}
              <a href="mailto:support@eduspantech.com">support@eduspantech.com</a>.
            </div>
          </div>
        </div>
      </div>

      <div className="ta-back">
        Not applied yet? <Link to="/become-a-tutor">Become a Tutor →</Link>
      </div>
    </div>
  );
};

export default TrackApplication;