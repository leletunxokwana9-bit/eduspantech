// src/pages/Resources.js
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useHomeData } from '../hooks/useHomeData';
import './Resources.css';

const Resources = () => {
  const navigate = useNavigate();
  const { data, loading, error } = useHomeData();

  if (loading) return <div className="resources-page-loading">Loading resources...</div>;
  if (error) return <div className="resources-page-error">Error loading resources</div>;
  if (!data) return <div className="resources-page-empty">No resources available</div>;

  // ✅ FIXED: Access vaults correctly
  const vaults = data.resources?.vaults || [];

  const handleAccessResources = (vault) => {
    const slug = vault.name.toLowerCase().replace(/\s+/g, '-');
    navigate(`/resources/${slug}`);
  };

  return (
    <div className="resources-page">
      <div className="resources-page-header">
        <h1>📚 {data.resources?.title || 'Learning Resources'}</h1>
        <p>{data.resources?.subtitle || 'On-demand whiteboard archives and study materials'}</p>
      </div>

      <div className="resources-page-grid">
        {vaults.map((vault) => (
          <div key={vault.id} className="resources-page-card">
            <div className="resources-page-icon">{vault.icon}</div>
            <h3>{vault.name}</h3>
            <p>{vault.description}</p>
            <div className="resources-page-topics">
              {vault.topics?.map((topic, idx) => (
                <span key={idx} className="topic-tag">#{topic}</span>
              ))}
            </div>
            <button 
              className="resources-page-btn"
              onClick={() => handleAccessResources(vault)}
            >
              Access Resources →
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Resources;