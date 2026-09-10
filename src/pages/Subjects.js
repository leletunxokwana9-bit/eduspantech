// src/pages/Subjects.js
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useHomeData } from '../hooks/useHomeData';
import './Subjects.css';

const Subjects = () => {
  const navigate = useNavigate();
  const { data, loading, error } = useHomeData();

  // Helper: Get default icon based on subject name
  const getDefaultIcon = (name) => {
    if (!name) return '📚';
    const icons = {
      'Mathematics': '🔢',
      'Math': '🔢',
      'Physics': '⚛️',
      'Chemistry': '🧪',
      'Biology': '🧬',
      'Life Sci': '🧬',
      'Accounting': '📊',
      'Economics': '📈',
      'Business': '💼',
      'Statistics': '📉',
      'ECP': '📘'
    };
    for (const [key, icon] of Object.entries(icons)) {
      if (name.toLowerCase().includes(key.toLowerCase())) {
        return icon;
      }
    }
    return '📚';
  };

  // Helper: Get default color based on subject name
  const getDefaultColor = (name) => {
    if (!name) return '#4f46e5';
    const colors = {
      'Mathematics': '#4f46e5',
      'Math': '#4f46e5',
      'Physics': '#06b6d4',
      'Chemistry': '#10b981',
      'Biology': '#22c55e',
      'Life Sci': '#22c55e',
      'Accounting': '#f59e0b',
      'Economics': '#8b5cf6',
      'Business': '#ec4899',
      'Statistics': '#14b8a6',
      'ECP': '#f97316'
    };
    for (const [key, color] of Object.entries(colors)) {
      if (name.toLowerCase().includes(key.toLowerCase())) {
        return color;
      }
    }
    return '#4f46e5';
  };

  if (loading) return <div className="subjects-page-loading">Loading subjects...</div>;
  if (error) return <div className="subjects-page-error">Error loading subjects</div>;
  if (!data) return <div className="subjects-page-empty">No subjects available</div>;

  // ✅ Map subjects with default values
  const subjects = Array.isArray(data.subjects) ? data.subjects.map(subject => ({
    id: subject.id,
    name: subject.name,
    description: subject.description || subject.code || 'No description',
    icon: subject.icon || getDefaultIcon(subject.name),
    color: subject.color || getDefaultColor(subject.name),
    tier: subject.tier || subject.year_level || 'TIER_1',
    display_order: subject.display_order || 0,
    is_active: subject.is_active !== undefined ? subject.is_active : true,
    code: subject.code,
    track: subject.track,
    semester: subject.semester,
    institution: subject.institution,
    topics: subject.topics || []
  })) : [];

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