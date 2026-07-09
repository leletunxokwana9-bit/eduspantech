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

  const subjects = data.subjects?.items || [];

  const handleSubjectClick = (subject) => {
    const slug = subject.name.toLowerCase().replace(/\s+/g, '-');
    navigate(`/subjects/${slug}`);
  };

  return (
    <div className="subjects-page">
      <div className="subjects-page-header">
        <h1>📚 {data.subjects?.title || 'Mathematics Subjects'}</h1>
        <p>{data.subjects?.subtitle || 'Master any topic with expert guidance and interactive tools'}</p>
      </div>

      <div className="subjects-page-grid">
        {subjects.map((subject) => (
          <div 
            key={subject.id} 
            className="subject-page-card"
            onClick={() => handleSubjectClick(subject)}
            style={{ cursor: 'pointer' }}
          >
            <div className="subject-page-icon-wrapper" style={{ background: subject.color || '#4f46e5' }}>
              <div className="subject-page-icon">{subject.icon}</div>
            </div>
            <h3>{subject.name}</h3>
            <p>{subject.description || 'Explore this subject'}</p>
            <div className="subject-page-tags">
              <span>{subject.topics?.length || 0} Topics</span>
              <span>{subject.resources?.length || 0} Resources</span>
            </div>
            <button 
              className="subject-page-btn"
              style={{ backgroundColor: subject.color || '#4f46e5' }}
            >
              Explore →
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Subjects;