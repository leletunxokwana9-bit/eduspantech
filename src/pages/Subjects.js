// src/pages/Subjects.js
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useHomeData } from '../hooks/useHomeData';
import './Subjects.css';

const Subjects = () => {
  const navigate = useNavigate();
  const { data, loading, error } = useHomeData();

  if (loading) return <div className="subjects-page-loading">Loading subjects...</div>;
  if (error) return <div className="subjects-page-error">Error loading subjects</div>;
  if (!data) return <div className="subjects-page-empty">No subjects available</div>;

  // ✅ FIXED: Use data.subjects directly (not data.subjects?.items)
  const subjects = Array.isArray(data.subjects) ? data.subjects : [];

  const handleViewSubject = (subject) => {
    const slug = subject.name.toLowerCase().replace(/\s+/g, '-');
    navigate(`/subjects/${slug}`);
  };

  if (subjects.length === 0) {
    return <div className="subjects-page-empty">No subjects available</div>;
  }

  return (
    <div className="subjects-page">
      <div className="subjects-page-header">
        <h1>📚 Mathematics Subjects</h1>
        <p>Master any topic with expert guidance and interactive tools</p>
      </div>

      <div className="subjects-page-grid">
        {subjects.map((subject) => (
          <div 
            key={subject.id} 
            className="subjects-page-card"
            onClick={() => handleViewSubject(subject)}
          >
            <div className="subjects-page-icon" style={{ background: `${subject.color}20`, color: subject.color }}>
              {subject.icon || '📚'}
            </div>
            <h3>{subject.name}</h3>
            <p>{subject.description}</p>
            <div className="subjects-page-card-footer">
              <span className="subjects-page-tier">{subject.tier || 'Tier 1'}</span>
              <span className="subjects-page-topics-count">📖 {subject.topics?.length || 0} topics</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Subjects;