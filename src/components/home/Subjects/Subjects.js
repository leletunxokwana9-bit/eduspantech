import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Subjects.css';

const Subjects = ({ subjectsData }) => {
  const navigate = useNavigate();
  const [hoveredSubject, setHoveredSubject] = useState(null);

  if (!subjectsData) {
    return (
      <section className="subjects-section">
        <div className="container">
          <div className="subjects-header">
            <h2>Subjects</h2>
            <p>Loading...</p>
          </div>
        </div>
      </section>
    );
  }

  const { title, subtitle, items } = subjectsData;

  return (
    <section className="subjects-section">
      <div className="container">
        <div className="subjects-header">
          <span className="subjects-badge">📚 Curriculum</span>
          <h2>{title || 'Mathematics Subjects'}</h2>
          <p>{subtitle || 'Master any topic with expert guidance and interactive tools'}</p>
        </div>
        <div className="subjects-grid">
          {items?.map((subject) => (
            <div 
              key={subject.id} 
              className={`subject-card ${hoveredSubject === subject.id ? 'hovered' : ''}`}
              onMouseEnter={() => setHoveredSubject(subject.id)}
              onMouseLeave={() => setHoveredSubject(null)}
              onClick={() => navigate(`/subjects/${subject.id}`)}
              style={{ '--subject-color': subject.color }}
            >
              <div className="subject-icon-wrapper">
                <div className="subject-icon" style={{ background: `${subject.color}20`, color: subject.color }}>
                  {subject.icon}
                </div>
              </div>
              <h3>{subject.name}</h3>
              <p>{subject.description}</p>
              <div className="subject-arrow">→</div>
              <div className="subject-glow" style={{ background: `radial-gradient(circle at center, ${subject.color}30, transparent 70%)` }}></div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Subjects;