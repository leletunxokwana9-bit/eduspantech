import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useHomeData } from '../hooks/useHomeData';
import './Curriculum.css';

const Curriculum = () => {
  const navigate = useNavigate();
  const { data, loading, error } = useHomeData();

  if (loading) return <div className="curriculum-page-loading">Loading curriculum...</div>;
  if (error) return <div className="curriculum-page-error">Error loading curriculum</div>;
  if (!data) return <div className="curriculum-page-empty">No curriculum available</div>;

  const curriculum = data.curriculum?.items || [];

  // Country code mapping for flagcdn
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

  const handleViewCurriculum = (country) => {
    const slug = country.country.toLowerCase().replace(/\s+/g, '-');
    navigate(`/curriculum/${slug}`);
  };

  return (
    <div className="curriculum-page">
      <div className="curriculum-page-header">
        <h1>🌍 {data.curriculum?.title || 'Global Curriculum'}</h1>
        <p>{data.curriculum?.subtitle || 'Aligned with international standards across the world'}</p>
      </div>

      <div className="curriculum-page-grid">
        {curriculum.map((country) => {
          const countryCode = getCountryCode(country.country);
          const flagUrl = `https://flagcdn.com/w80/${countryCode}.png`;
          
          return (
            <div key={country.id} className="curriculum-page-card">
              <img 
                src={flagUrl}
                alt={`${country.country} flag`}
                className="curriculum-page-flag-image"
                onError={(e) => {
                  // Fallback to emoji if image fails
                  e.target.style.display = 'none';
                  const parent = e.target.parentNode;
                  const fallback = document.createElement('div');
                  fallback.className = 'curriculum-page-flag';
                  fallback.textContent = country.flag || '🌍';
                  parent.insertBefore(fallback, e.target);
                }}
              />
              <h3>{country.country}</h3>
              <p className="curriculum-page-description">{country.description}</p>
              <div className="curriculum-page-levels">
                {country.levels?.map((level, idx) => (
                  <span key={idx} className="level-tag">{level}</span>
                ))}
              </div>
              <div className="curriculum-page-subjects">
                {country.subjects?.map((subject, idx) => (
                  <span key={idx} className="subject-tag">{subject}</span>
                ))}
              </div>
              <button 
                className="curriculum-page-btn"
                onClick={() => handleViewCurriculum(country)}
              >
                View Curriculum →
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Curriculum;