import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useHomeData } from '../hooks/useHomeData';
import './CurriculumDetail.css';

const CurriculumDetail = () => {
  const { countryId } = useParams();
  const navigate = useNavigate();
  const { data, loading, error } = useHomeData();

  if (loading) return <div className="loading">Loading curriculum...</div>;
  if (error) return <div className="error">Error: {error}</div>;
  if (!data) return <div className="empty">No data available</div>;

  const country = data.curriculum?.items?.find(
    (item) => item.country.toLowerCase().replace(/\s+/g, '-') === countryId
  );

  if (!country) {
    return (
      <div className="not-found">
        <h2>❌ Curriculum not found</h2>
        <button onClick={() => navigate('/curriculum')}>Back to Curriculum</button>
      </div>
    );
  }

  return (
    <div className="curriculum-detail">
      <button className="back-btn" onClick={() => navigate('/curriculum')}>← Back to Curriculum</button>

      <div className="curriculum-detail-header">
        <img 
          src={country.flag} 
          alt={`${country.country} flag`}
          className="country-flag-image-large"
        />
        <h1>{country.country} Curriculum</h1>
        <p className="curriculum-description">{country.description}</p>
      </div>

      <div className="curriculum-detail-grid">
        <div className="detail-section">
          <h3>📚 Grade Levels</h3>
          <div className="level-tags">
            {country.levels?.map((level, idx) => (
              <span key={idx} className="level-tag">{level}</span>
            ))}
          </div>
        </div>

        <div className="detail-section">
          <h3>📖 Subjects Offered</h3>
          <div className="subject-tags">
            {country.subjects?.map((subject, idx) => (
              <span key={idx} className="subject-tag">{subject}</span>
            ))}
          </div>
        </div>

        <div className="detail-section">
          <h3>📊 Grade Mapping</h3>
          <div className="grade-mapping">
            <div className="grade-row">
              <span className="grade-label">South Africa</span>
              <span className="grade-value">Grades 8-12</span>
            </div>
            <div className="grade-row">
              <span className="grade-label">{country.country}</span>
              <span className="grade-value">{country.levels?.join(' → ')}</span>
            </div>
          </div>
        </div>

        <div className="detail-section">
          <h3>🎯 Topics Covered</h3>
          <ul className="topic-list">
            {getTopicsByCountry(country.country)?.map((topic, idx) => (
              <li key={idx}>{topic}</li>
            ))}
          </ul>
        </div>

        {country.resources && country.resources.length > 0 && (
          <div className="detail-section resources-section">
            <h3>📄 Resources</h3>
            <div className="resource-list">
              {country.resources.map((resource) => (
                <a 
                  key={resource.id}
                  href={resource.url} 
                  className="resource-link" 
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {resource.type === 'framework' && '📋'}
                  {resource.type === 'guidelines' && '📊'}
                  {resource.type === 'exams' && '📝'}
                  {resource.type === 'guides' && '📖'}
                  {' '}{resource.name}
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const getTopicsByCountry = (country) => {
  const topics = {
    'South Africa': [
      'Algebra & Functions', 'Euclidean Geometry', 'Analytical Geometry',
      'Trigonometry', 'Calculus (Grade 12)', 'Statistics & Probability',
      'Financial Mathematics', 'Number Patterns'
    ],
    'USA': [
      'Algebra I & II', 'Geometry', 'Pre-Calculus',
      'AP Calculus AB/BC', 'Statistics', 'Trigonometry',
      'Matrices', 'Functions'
    ],
    'UK': [
      'Number & Algebra', 'Shape & Space', 'Statistics & Probability',
      'Calculus (A-Level)', 'Further Pure Mathematics',
      'Mechanics', 'Decision Mathematics'
    ],
    'Australia': [
      'Algebra & Functions', 'Geometry & Trigonometry', 'Calculus (VCE)',
      'Statistics & Probability', 'Mathematical Methods', 'Specialist Mathematics'
    ],
    'Singapore': [
      'Algebra', 'Geometry & Trigonometry', 'Calculus (H2)',
      'Statistics (H2)', 'Linear Algebra', 'Matrices & Vectors'
    ],
    'Japan': [
      'Mathematics I (Algebra, Geometry)', 'Mathematics II (Calculus, Trigonometry)',
      'Mathematics III (Advanced Calculus)', 'Statistics', 'Vectors', 'Matrices'
    ],
    'Brazil': [
      'Algebra & Functions', 'Geometry', 'Trigonometry',
      'Analytical Geometry', 'Probability & Statistics', 'Financial Mathematics'
    ]
  };
  return topics[country] || ['Algebra', 'Geometry', 'Statistics', 'Calculus'];
};

export default CurriculumDetail;