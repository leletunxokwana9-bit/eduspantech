import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Curriculum.css';

const Curriculum = ({ curriculumData }) => {
  const navigate = useNavigate();
  const [selectedCountry, setSelectedCountry] = useState(null);

  if (!curriculumData) {
    return (
      <section className="curriculum-section">
        <div className="container">
          <div className="curriculum-header">
            <h2>Curriculum</h2>
            <p>Loading...</p>
          </div>
        </div>
      </section>
    );
  }

  const { title, subtitle, items } = curriculumData;

  return (
    <section className="curriculum-section">
      <div className="container">
        <div className="curriculum-header">
          <span className="curriculum-badge">🌍 Global Alignment</span>
          <h2>{title || 'Global Curriculum'}</h2>
          <p>{subtitle || 'Aligned with international standards across the world'}</p>
        </div>
        <div className="curriculum-grid">
          {items?.map((item) => (
            <div 
              key={item.id} 
              className={`curriculum-card ${selectedCountry === item.id ? 'expanded' : ''}`}
              onClick={() => setSelectedCountry(selectedCountry === item.id ? null : item.id)}
            >
              <div className="curriculum-card-header">
                <div className="curriculum-flag">{item.flag}</div>
                <div className="curriculum-country-info">
                  <h3>{item.country}</h3>
                  <div className="curriculum-levels">
                    {item.levels?.map((level, index) => (
                      <span key={index} className="level-tag">{level}</span>
                    ))}
                  </div>
                </div>
                <div className="curriculum-expand-icon">
                  {selectedCountry === item.id ? '−' : '+'}
                </div>
              </div>
              {selectedCountry === item.id && (
                <div className="curriculum-card-body">
                  <div className="curriculum-subjects">
                    <strong>Subjects:</strong>
                    {item.subjects?.map((subject, index) => (
                      <span key={index} className="subject-tag">{subject}</span>
                    ))}
                  </div>
                  <p className="curriculum-description">{item.description}</p>
                  <button 
                    className="curriculum-explore-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/curriculum/${item.id}`);
                    }}
                  >
                    Explore Curriculum →
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Curriculum;