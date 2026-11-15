// src/components/RatingStars.js
import React from 'react';
import './RatingStars.css';

const RatingStars = ({ value = 0, size = 16, showValue = false, count = null }) => {
  const rounded = Math.round((Number(value) || 0) * 2) / 2;

  return (
    <span className="rating-stars" style={{ fontSize: size }}>
      {[1, 2, 3, 4, 5].map((i) => {
        const cls = rounded >= i ? 'full' : rounded >= i - 0.5 ? 'half' : 'empty';
        return <span key={i} className={`star ${cls}`}>★</span>;
      })}
      {showValue && Number(value) > 0 && (
        <span className="rating-value">{Number(value).toFixed(1)}</span>
      )}
      {count !== null && (
        <span className="rating-count">({count})</span>
      )}
    </span>
  );
};

export default RatingStars;