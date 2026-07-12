// src/pages/Subjects.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useHomeData } from '../hooks/useHomeData';
import './Subjects.css';

const Subjects = () => {
  const navigate = useNavigate();
  const { data, loading, error } = useHomeData();
  const [subjects, setSubjects] = useState([]);

  useEffect(() => {
    if (data) {
      // Try multiple paths to find subjects
      let foundSubjects = [];
      
      if (data.subjects && Array.isArray(data.subjects)) {
        foundSubjects = data.subjects;
      } else if (data.subjects?.items && Array.isArray(data.subjects.items)) {
        foundSubjects = data.subjects.items;
      } else if (data.items && Array.isArray(data.items)) {
        foundSubjects = data.items;
      }
      
      setSubjects(foundSubjects);
    }
  }, [data]);

  const handleSubjectClick = (subject) => {
    const slug = subject.name.toLowerCase().replace(/\s+/g, '-');
    navigate(`/subjects/${slug}`);
  };

  if (loading) {
    return <div className="subjects-loading">Loading subjects...</div>;
  }

  if (error) {
    return <div className="subjects-error">Error loading subjects</div>;
  }

  if (subjects.length === 0) {
    return <div className="subjects-empty">No subjects available</div>;
  }

  return (
    <div className="subjects-page">
      <div className="subjects-header">
        <h1>📚 Mathematics Subjects</h1>
        <p>Master any topic with expert guidance and interactive tools</p>
      </div>

      <div className="subjects-grid">
        {subjects.map((subject) => (
          <div
            key={subject.id}
            className="subject-card"
            onClick={() => handleSubjectClick(subject)}
            style={{ borderColor: subject.color || '#4f46e5' }}
          >
            <div className="subject-card-icon" style={{ background: subject.color || '#4f46e5' }}>
              {subject.icon || '📚'}
            </div>
            <h3>{subject.name}</h3>
            <p>{subject.description}</p>
            <div className="subject-card-footer">
              <span className="subject-tier">{subject.tier || 'Tier 1'}</span>
              <span className="subject-topics">📖 {subject.topics?.length || 0} topics</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Subjects;