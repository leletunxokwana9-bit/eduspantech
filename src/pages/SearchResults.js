import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useHomeData } from '../hooks/useHomeData';
import './SearchResults.css';

const SearchResults = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { data, loading, error } = useHomeData();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState({
    subjects: [],
    tutors: [],
    resources: [],
    curriculum: []
  });

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const q = params.get('q') || '';
    setQuery(q);
    
    if (q && data) {
      performSearch(q);
    }
  }, [location, data]);

  const performSearch = (searchTerm) => {
    const term = searchTerm.toLowerCase().trim();
    
    const subjects = data.subjects?.items?.filter(subject =>
      subject.name.toLowerCase().includes(term) ||
      subject.description.toLowerCase().includes(term) ||
      subject.topics?.some(t => t.name.toLowerCase().includes(term))
    ) || [];

    const tutors = [];
    data.tutors?.shifts?.forEach(shift => {
      shift.tutors?.forEach(tutor => {
        if (
          tutor.name.toLowerCase().includes(term) ||
          tutor.subjects?.some(s => s.toLowerCase().includes(term)) ||
          tutor.bio?.toLowerCase().includes(term)
        ) {
          tutors.push({ ...tutor, shiftName: shift.name });
        }
      });
    });

    const resources = data.resources?.vaults?.filter(vault =>
      vault.name.toLowerCase().includes(term) ||
      vault.description.toLowerCase().includes(term) ||
      vault.topics?.some(t => t.toLowerCase().includes(term))
    ) || [];

    const curriculum = data.curriculum?.items?.filter(country =>
      country.country.toLowerCase().includes(term) ||
      country.subjects?.some(s => s.toLowerCase().includes(term)) ||
      country.levels?.some(l => l.toLowerCase().includes(term))
    ) || [];

    setResults({ subjects, tutors, resources, curriculum });
  };

  if (loading) return <div className="search-loading">Searching...</div>;
  if (error) return <div className="search-error">Error: {error}</div>;

  const totalResults = results.subjects.length + results.tutors.length + 
                       results.resources.length + results.curriculum.length;

  return (
    <div className="search-results">
      <div className="search-header">
        <h1>🔍 Search Results</h1>
        <p>
          {totalResults} results for <strong>"{query}"</strong>
        </p>
      </div>

      {totalResults === 0 && query && (
        <div className="no-results">
          <span>🔍</span>
          <h3>No results found</h3>
          <p>Try searching for subjects, tutors, or topics</p>
        </div>
      )}

      {!query && (
        <div className="no-results">
          <span>🔍</span>
          <h3>Enter a search term</h3>
          <p>Search for subjects, tutors, curriculum, or resources</p>
        </div>
      )}

      {results.subjects.length > 0 && (
        <div className="result-section">
          <h2>📚 Subjects ({results.subjects.length})</h2>
          <div className="result-grid">
            {results.subjects.map((subject) => (
              <div 
                key={subject.id} 
                className="result-card"
                onClick={() => navigate(`/subjects/${subject.name.toLowerCase().replace(/\s+/g, '-')}`)}
              >
                <div className="result-icon" style={{ background: subject.color || '#4f46e5' }}>
                  {subject.icon}
                </div>
                <div className="result-info">
                  <h4>{subject.name}</h4>
                  <p>{subject.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {results.tutors.length > 0 && (
        <div className="result-section">
          <h2>👨‍🏫 Tutors ({results.tutors.length})</h2>
          <div className="result-grid">
            {results.tutors.map((tutor, idx) => (
              <div key={idx} className="result-card">
                <div className="result-icon">
                  {tutor.image ? <img src={tutor.image} alt={tutor.name} /> : '🧑‍🏫'}
                </div>
                <div className="result-info">
                  <h4>{tutor.name}</h4>
                  <p>{tutor.tier} • {tutor.shiftName}</p>
                  <div className="result-tags">
                    {tutor.subjects?.map((s, i) => (
                      <span key={i} className="tag">{s}</span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {results.resources.length > 0 && (
        <div className="result-section">
          <h2>📄 Resources ({results.resources.length})</h2>
          <div className="result-grid">
            {results.resources.map((vault) => (
              <div 
                key={vault.id} 
                className="result-card"
                onClick={() => navigate(`/resources/${vault.name.toLowerCase().replace(/\s+/g, '-')}`)}
              >
                <div className="result-icon">{vault.icon}</div>
                <div className="result-info">
                  <h4>{vault.name}</h4>
                  <p>{vault.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {results.curriculum.length > 0 && (
        <div className="result-section">
          <h2>🌍 Curriculum ({results.curriculum.length})</h2>
          <div className="result-grid">
            {results.curriculum.map((country) => (
              <div 
                key={country.id} 
                className="result-card"
                onClick={() => navigate(`/curriculum/${country.country.toLowerCase().replace(/\s+/g, '-')}`)}
              >
                <div className="result-icon">{country.flag}</div>
                <div className="result-info">
                  <h4>{country.country}</h4>
                  <p>{country.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchResults;