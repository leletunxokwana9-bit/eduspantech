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
    console.log('📊 Subjects page - raw data:', data);
    
    if (data) {
      // ✅ Try multiple paths to find subjects
      let foundSubjects = [];
      
      // Path 1: data.subjects (direct array)
      if (data.subjects && Array.isArray(data.subjects)) {
        foundSubjects = data.subjects;
        console.log('✅ Found subjects in data.subjects:', foundSubjects.length);
      }
      // Path 2: data.subjects.items
      else if (data.subjects?.items && Array.isArray(data.subjects.items)) {
        foundSubjects = data.subjects.items;
        console.log('✅ Found subjects in data.subjects.items:', foundSubjects.length);
      }
      // Path 3: data.items
      else if (data.items && Array.isArray(data.items)) {
        foundSubjects = data.items;
        console.log('✅ Found subjects in data.items:', foundSubjects.length);
      }
      // Path 4: data.subjects.subjects (nested)
      else if (data.subjects?.subjects && Array.isArray(data.subjects.subjects)) {
        foundSubjects = data.subjects.subjects;
        console.log('✅ Found subjects in data.subjects.subjects:', foundSubjects.length);
      }
      
      setSubjects(foundSubjects);
    }
  }, [data]);

  const handleSubjectClick = (subject) => {
    const slug = subject.name.toLowerCase().replace(/\s+/g, '-');
    navigate(`/subjects/${slug}`);
  };

  if (loading) {
    return (
      <div className="subjects-loading">
        <div className="loader">Loading subjects...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="subjects-error">
        <p>Error loading subjects: {error}</p>
        <button onClick={() => window.location.reload()} className="subjects-retry-btn">
          🔄 Retry
        </button>
      </div>
    );
  }

  if (subjects.length === 0) {
    return (
      <div className="subjects-empty">
        <span className="empty-icon">📚</span>
        <p>No subjects available</p>
        <p className="subjects-empty-sub">Please check your connection or try again later.</p>
        <button onClick={() => window.location.reload()} className="subjects-retry-btn">
          🔄 Retry
        </button>
      </div>
    );
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