import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useHomeData } from '../hooks/useHomeData';
import './CurriculumDetail.css';

const CurriculumDetail = () => {
  const { countryId } = useParams();
  const navigate = useNavigate();
  const { data, loading, error } = useHomeData();
  const [country, setCountry] = useState(null);
  const [flagLoaded, setFlagLoaded] = useState(false);
  const [flagError, setFlagError] = useState(false);

  useEffect(() => {
    if (data?.curriculum?.items) {
      const found = data.curriculum.items.find(
        item => item.country.toLowerCase().replace(/\s+/g, '-') === countryId
      );
      setCountry(found);
    }
  }, [data, countryId]);

  if (loading) return <div className="curriculum-detail-loading">Loading...</div>;
  if (error) return <div className="curriculum-detail-error">Error loading curriculum</div>;
  if (!country) return <div className="curriculum-detail-not-found">Country not found</div>;

  // ===== COUNTRY CODE MAPPING FOR FLAGCDN =====
  const getCountryCode = (countryName) => {
    const countryMap = {
      'South Africa': 'za',
      'USA': 'us',
      'United States': 'us',
      'UK': 'gb',
      'United Kingdom': 'gb',
      'Australia': 'au',
      'Singapore': 'sg',
      'Japan': 'jp',
      'Brazil': 'br',
      'Canada': 'ca',
      'Germany': 'de',
      'France': 'fr',
      'India': 'in',
      'China': 'cn',
      'New Zealand': 'nz'
    };
    return countryMap[countryName] || countryName.toLowerCase().substring(0, 2);
  };

  // ===== GRADE MAPPING BASED ON COUNTRY =====
  const getGradeMapping = () => {
    const mappings = {
      'South Africa': {
        label: 'South Africa',
        levels: ['Grade 8-12', 'Matric', 'University Prep']
      },
      'USA': {
        label: 'USA',
        levels: ['Middle School', 'High School', 'AP / College']
      },
      'UK': {
        label: 'UK',
        levels: ['Key Stage 4', 'Key Stage 5', 'University Prep']
      },
      'Australia': {
        label: 'Australia',
        levels: ['Years 7-10', 'Years 11-12', 'Tertiary Prep']
      },
      'Singapore': {
        label: 'Singapore',
        levels: ['Secondary 1-4', 'Junior College', 'University Prep']
      },
      'Japan': {
        label: 'Japan',
        levels: ['Junior High', 'Senior High', 'University Prep']
      },
      'Brazil': {
        label: 'Brazil',
        levels: ['Years 8-9', 'Years 1-3', 'University Prep']
      }
    };
    return mappings[country.country] || { label: country.country, levels: country.levels || [] };
  };

  const gradeMapping = getGradeMapping();

  // ===== TOPICS BASED ON COUNTRY =====
  const getTopics = () => {
    const topics = {
      'South Africa': [
        'Algebra & Functions',
        'Euclidean Geometry',
        'Analytical Geometry',
        'Trigonometry',
        'Calculus (Grade 12)',
        'Statistics & Probability',
        'Financial Mathematics',
        'Number Patterns'
      ],
      'USA': [
        'Algebra 1 & 2',
        'Geometry',
        'Pre-Calculus',
        'AP Calculus AB/BC',
        'Statistics',
        'Trigonometry',
        'Linear Algebra'
      ],
      'UK': [
        'Pure Mathematics',
        'Mechanics',
        'Statistics',
        'Decision Mathematics',
        'Further Maths'
      ],
      'Australia': [
        'Mathematical Methods',
        'Specialist Mathematics',
        'General Mathematics',
        'Essential Mathematics'
      ],
      'Singapore': [
        'Elementary Mathematics',
        'Additional Mathematics',
        'H2 Mathematics',
        'Further Mathematics'
      ],
      'Japan': [
        'Mathematics I',
        'Mathematics II',
        'Mathematics III',
        'Applied Mathematics'
      ],
      'Brazil': [
        'Ensino Fundamental',
        'Ensino Médio',
        'Pré-Vestibular',
        'Cálculo'
      ]
    };
    return topics[country.country] || ['Algebra', 'Geometry', 'Calculus', 'Statistics'];
  };

  const topics = getTopics();

  // ===== FLAG URL =====
  const countryCode = getCountryCode(country.country);
  const flagUrl = `https://flagcdn.com/w120/${countryCode}.png`;

  const handleFlagLoad = () => {
    setFlagLoaded(true);
  };

  const handleFlagError = () => {
    setFlagError(true);
    setFlagLoaded(false);
  };

  return (
    <div className="curriculum-detail-page">
      <div className="curriculum-detail-container">
        <button className="curriculum-detail-back" onClick={() => navigate('/curriculum')}>
          ← Back to Curriculum
        </button>

        <div className="curriculum-detail-header">
          {/* ===== REAL FLAG FROM FLAGCDN ===== */}
          {!flagError ? (
            <img 
              src={flagUrl}
              alt={`${country.country} flag`}
              className="curriculum-detail-flag"
              onLoad={handleFlagLoad}
              onError={handleFlagError}
              loading="lazy"
              style={{ display: flagLoaded ? 'block' : 'block' }}
            />
          ) : (
            <div className="curriculum-detail-flag-fallback">
              {country.flag || '🌍'}
            </div>
          )}
          <h1>{country.country} Curriculum</h1>
          <p>{country.description}</p>
        </div>

        <div className="curriculum-detail-grid">
          {/* ===== GRADE LEVELS ===== */}
          <div className="curriculum-detail-card">
            <h3>📚 Grade Levels</h3>
            <div className="curriculum-detail-tags">
              {gradeMapping.levels.map((level, index) => (
                <span key={index} className="level-tag">{level}</span>
              ))}
            </div>
          </div>

          {/* ===== SUBJECTS OFFERED ===== */}
          <div className="curriculum-detail-card">
            <h3>📖 Subjects Offered</h3>
            <div className="curriculum-detail-tags">
              {country.subjects?.map((subject, index) => (
                <span key={index} className="subject-tag">{subject}</span>
              ))}
            </div>
          </div>

          {/* ===== GRADE MAPPING ===== */}
          <div className="curriculum-detail-card full-width">
            <h3>📊 Grade Mapping</h3>
            <div className="curriculum-detail-mapping">
              <div className="mapping-item">
                <span className="mapping-label">{gradeMapping.label}</span>
                <div className="mapping-arrows">
                  {gradeMapping.levels.map((level, index) => (
                    <React.Fragment key={index}>
                      <span className="mapping-level">{level}</span>
                      {index < gradeMapping.levels.length - 1 && (
                        <span className="mapping-arrow">→</span>
                      )}
                    </React.Fragment>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* ===== TOPICS COVERED ===== */}
          <div className="curriculum-detail-card full-width">
            <h3>🎯 Topics Covered</h3>
            <div className="curriculum-detail-topics">
              {topics.map((topic, index) => (
                <span key={index} className="topic-tag">{topic}</span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CurriculumDetail;