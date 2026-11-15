// src/components/ReviewModal.js
import React, { useState } from 'react';
import { API_BASE_URL } from '../services/api';
import './ReviewModal.css';

const ReviewModal = ({ session, onClose, onSuccess }) => {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState('');
  const [subs, setSubs] = useState({
    knowledge: 0, patience: 0, punctuality: 0, engagement: 0,
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!session) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (rating < 1) { setError('Please select a rating'); return; }
    setSubmitting(true);
    setError('');
    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch(`${API_BASE_URL}/sessions/${session.id}/review`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          rating,
          comment: comment.trim() || null,
          subKnowledge: subs.knowledge || null,
          subPatience: subs.patience || null,
          subPunctuality: subs.punctuality || null,
          subEngagement: subs.engagement || null,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        onSuccess && onSuccess(data);
        onClose();
      } else {
        setError(data.error || 'Failed to submit review');
      }
    } catch (err) {
      setError('Network error — please try again');
    } finally {
      setSubmitting(false);
    }
  };

  const renderStarInput = (value, setValue, currentHover, setHoverFn, size = 32) => (
    <div className="star-input" onMouseLeave={() => setHoverFn(0)}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          className={`star-btn ${n <= (currentHover || value) ? 'active' : ''}`}
          style={{ fontSize: size }}
          onMouseEnter={() => setHoverFn(n)}
          onClick={() => setValue(n)}
          aria-label={`${n} star${n > 1 ? 's' : ''}`}
        >★</button>
      ))}
    </div>
  );

  return (
    <div className="review-modal-overlay" onClick={onClose}>
      <div className="review-modal" onClick={(e) => e.stopPropagation()}>
        <div className="review-modal-header">
          <h3>Rate this session</h3>
          <button className="review-modal-close" onClick={onClose}>✕</button>
        </div>

        <p className="review-modal-sub">
          {session.topic || 'Tutoring Session'} with{' '}
          <strong>{session.tutor?.name || session.tutorName || 'your tutor'}</strong>
        </p>

        {error && <div className="review-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <label className="review-label">Overall rating *</label>
          {renderStarInput(rating, setRating, hover, setHover)}

          <label className="review-label">Comment (optional)</label>
          <textarea
            className="review-textarea"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="What went well? What could improve?"
            rows={4}
            maxLength={1000}
          />
          <div className="review-char-count">{comment.length}/1000</div>

          <label className="review-label">Rate specific areas (optional)</label>
          {[
            ['knowledge', 'Knowledgeable'],
            ['patience', 'Patient'],
            ['punctuality', 'Punctual'],
            ['engagement', 'Engaging'],
          ].map(([key, label]) => (
            <div key={key} className="sub-row">
              <span className="sub-label">{label}</span>
              {renderStarInput(
                subs[key],
                (v) => setSubs((s) => ({ ...s, [key]: v })),
                subs[key],
                () => {},
                18
              )}
            </div>
          ))}

          <div className="review-modal-actions">
            <button type="button" className="btn-cancel" onClick={onClose} disabled={submitting}>
              Cancel
            </button>
            <button type="submit" className="btn-submit" disabled={submitting || rating === 0}>
              {submitting ? 'Submitting…' : 'Submit Review'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReviewModal;