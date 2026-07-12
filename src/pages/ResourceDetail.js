import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useHomeData } from '../hooks/useHomeData';
import { authService } from '../services/authService';
import './ResourceDetails.css';

const ResourceDetail = () => {
  const { vaultName, resourceId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { data, loading, error } = useHomeData();
  
  const [resource, setResource] = useState(null);
  const [resourceType, setResourceType] = useState('resource');
  const [vault, setVault] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  // Find the resource from location state or data
  useEffect(() => {
    // First check if we have data from navigation state
    if (location.state?.resource) {
      setResource(location.state.resource);
      setResourceType(location.state.type || 'resource');
      setVault(location.state.vault || null);
      return;
    }

    // Otherwise find from data
    if (data?.resources?.vaults) {
      const foundVault = data.resources.vaults.find(
        v => v.name.toLowerCase().replace(/\s+/g, '-') === vaultName
      );

      if (foundVault) {
        setVault(foundVault);
        
        // Build all resources from vault
        const allResources = [];
        
        if (foundVault.videos) {
          if (Array.isArray(foundVault.videos)) {
            foundVault.videos.forEach(v => allResources.push({ ...v, type: 'video' }));
          } else {
            allResources.push({ ...foundVault.videos, type: 'video' });
          }
        }
        if (foundVault.practice) {
          if (Array.isArray(foundVault.practice)) {
            foundVault.practice.forEach(p => allResources.push({ ...p, type: 'practice' }));
          } else {
            allResources.push({ ...foundVault.practice, type: 'practice' });
          }
        }
        if (foundVault.guides) {
          if (Array.isArray(foundVault.guides)) {
            foundVault.guides.forEach(g => allResources.push({ ...g, type: 'guide' }));
          } else {
            allResources.push({ ...foundVault.guides, type: 'guide' });
          }
        }
        if (foundVault.interactive) {
          if (Array.isArray(foundVault.interactive)) {
            foundVault.interactive.forEach(i => allResources.push({ ...i, type: 'interactive' }));
          } else {
            allResources.push({ ...foundVault.interactive, type: 'interactive' });
          }
        }
        if (foundVault.resources) {
          if (Array.isArray(foundVault.resources)) {
            foundVault.resources.forEach(r => allResources.push({ ...r, type: r.type || 'resource' }));
          } else {
            allResources.push({ ...foundVault.resources, type: foundVault.resources.type || 'resource' });
          }
        }

        // Find the specific resource
        let foundResource = null;
        for (const r of allResources) {
          const rId = r.id ? String(r.id) : r.name?.toLowerCase().replace(/\s+/g, '-');
          const searchId = resourceId || '';
          if (rId === searchId || r.name?.toLowerCase().replace(/\s+/g, '-') === resourceId) {
            foundResource = r;
            break;
          }
        }

        if (foundResource) {
          setResource(foundResource);
          setResourceType(foundResource.type || 'resource');
        } else {
          // If no specific resource, show vault overview
          setResource({
            id: foundVault.id,
            name: foundVault.name,
            description: foundVault.description,
            icon: foundVault.icon,
            topics: foundVault.topics || [],
            type: 'vault'
          });
          setResourceType('vault');
        }
      }
    }
  }, [data, vaultName, resourceId, location.state]);

  // Check authentication
  useEffect(() => {
    const checkAuth = async () => {
      setIsCheckingAuth(true);
      const isAuthenticated = authService.isAuthenticated();
      if (isAuthenticated) {
        try {
          const userData = await authService.getCurrentUser();
          if (userData) {
            setIsEnrolled(true);
          }
        } catch (error) {
          console.error('Failed to get user:', error);
        }
      }
      setIsCheckingAuth(false);
    };
    checkAuth();
  }, []);

  const getIcon = () => {
    if (resource?.icon) return resource.icon;
    switch (resourceType) {
      case 'video': return '🎬';
      case 'practice': return '✏️';
      case 'guide': return '📖';
      case 'interactive': return '🎮';
      case 'vault': return '📁';
      default: return '📄';
    }
  };

  const getTypeLabel = () => {
    switch (resourceType) {
      case 'video': return 'Video Lesson';
      case 'practice': return 'Practice Problems';
      case 'guide': return 'Study Guide';
      case 'interactive': return 'Interactive Activity';
      case 'vault': return 'Resource Collection';
      default: return 'Resource';
    }
  };

  const getBackUrl = () => {
    return vault ? `/resources/${vault.name.toLowerCase().replace(/\s+/g, '-')}` : '/resources';
  };

  // Get actual video embed URL
  const getEmbedUrl = () => {
    if (resource?.embedUrl) return resource.embedUrl;
    if (resource?.videoUrl) return resource.videoUrl;
    if (resource?.url) return resource.url;
    return null;
  };

  if (loading || isCheckingAuth) {
    return (
      <div className="resource-detail-container loading">
        <div className="loading-spinner"></div>
        <p>Loading resource...</p>
      </div>
    );
  }

  if (error || !resource) {
    return (
      <div className="resource-detail-container error">
        <div className="error-icon">🔍</div>
        <h2>Resource Not Found</h2>
        <p>The resource you're looking for doesn't exist or has been moved.</p>
        <button className="btn-primary" onClick={() => navigate('/resources')}>
          Back to Resources
        </button>
      </div>
    );
  }

  const tabs = [
    { id: 'overview', label: '📋 Overview' },
    { id: 'content', label: '📄 Content' },
    { id: 'related', label: '🔗 Related' }
  ];

  // Find related resources from the same vault
  const getRelatedResources = () => {
    if (!vault) return [];
    const allRelated = [];
    if (vault.videos) {
      if (Array.isArray(vault.videos)) {
        vault.videos.forEach(v => allRelated.push({ ...v, type: 'video' }));
      } else {
        allRelated.push({ ...vault.videos, type: 'video' });
      }
    }
    if (vault.practice) {
      if (Array.isArray(vault.practice)) {
        vault.practice.forEach(p => allRelated.push({ ...p, type: 'practice' }));
      } else {
        allRelated.push({ ...vault.practice, type: 'practice' });
      }
    }
    if (vault.guides) {
      if (Array.isArray(vault.guides)) {
        vault.guides.forEach(g => allRelated.push({ ...g, type: 'guide' }));
      } else {
        allRelated.push({ ...vault.guides, type: 'guide' });
      }
    }
    if (vault.interactive) {
      if (Array.isArray(vault.interactive)) {
        vault.interactive.forEach(i => allRelated.push({ ...i, type: 'interactive' }));
      } else {
        allRelated.push({ ...vault.interactive, type: 'interactive' });
      }
    }
    if (vault.resources) {
      if (Array.isArray(vault.resources)) {
        vault.resources.forEach(r => allRelated.push({ ...r, type: r.type || 'resource' }));
      } else {
        allRelated.push({ ...vault.resources, type: vault.resources.type || 'resource' });
      }
    }
    return allRelated.filter(r => r.id !== resource.id && r.name !== resource.name).slice(0, 4);
  };

  const relatedResources = getRelatedResources();

  // Navigate within app (same tab)
  const handleResourceClick = (related) => {
    const vaultSlug = vault?.name?.toLowerCase().replace(/\s+/g, '-') || '';
    const relatedSlug = related.id || related.name?.toLowerCase().replace(/\s+/g, '-') || '';
    navigate(`/resources/${vaultSlug}/${relatedSlug}`, {
      state: { resource: related, type: related.type, vault }
    });
  };

  const embedUrl = getEmbedUrl();

  return (
    <div className="resource-detail-container">
      {/* Header */}
      <div className="resource-detail-header">
        <div className="resource-header-top">
          <button className="back-button" onClick={() => navigate(getBackUrl())}>
            ← Back to {vault?.name || 'Resources'}
          </button>
          <span className="resource-type-badge">{getIcon()} {getTypeLabel()}</span>
        </div>
        <div className="resource-title-section">
          <h1>{getIcon()} {resource.name}</h1>
          <p className="resource-description">{resource.description || 'No description available.'}</p>
          <div className="resource-meta-tags">
            <span className="tag">📚 {vault?.name || 'General'}</span>
            {resource.duration && <span className="tag">⏱️ {resource.duration}</span>}
            {resource.difficulty && <span className="tag">📊 {resource.difficulty}</span>}
            {resource.tier && <span className="tag">🎯 {resource.tier}</span>}
          </div>
        </div>
        <div className="resource-actions">
          {isEnrolled ? (
            <button className="btn-primary" onClick={() => navigate(`/session/${resource.id}`)}>
              🚀 Start Learning
            </button>
          ) : (
            <button className="btn-secondary" onClick={() => navigate('/pricing')}>
              🔒 Subscribe to Access
            </button>
          )}
          {resource.downloadUrl && (
            <button className="btn-outline" onClick={() => window.open(resource.downloadUrl, '_blank')}>
              📥 Download
            </button>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="resource-detail-content">
        {/* Video Player */}
        {resourceType === 'video' && (
          <div className="video-player-section">
            <div className="video-container">
              {embedUrl ? (
                <iframe
                  src={embedUrl}
                  title={resource.name}
                  className="video-iframe"
                  allowFullScreen
                  allow="autoplay; encrypted-media; picture-in-picture"
                  sandbox="allow-same-origin allow-scripts allow-presentation allow-forms"
                />
              ) : (
                <div className="video-placeholder">
                  <div className="video-icon">🎬</div>
                  <p className="video-title">{resource.name}</p>
                  <p className="video-subtitle">{resource.description || 'Video content is being prepared'}</p>
                  {isEnrolled && (
                    <button className="btn-primary" style={{ marginTop: '16px' }} onClick={() => navigate(`/session/${resource.id}`)}>
                      Watch in Session
                    </button>
                  )}
                </div>
              )}
            </div>
            {resource.views !== undefined && (
              <div className="video-info">
                <div className="video-stats">
                  <span>👁️ {resource.views} views</span>
                  {resource.likes !== undefined && <span>❤️ {resource.likes} likes</span>}
                  {resource.date && <span>📅 {resource.date}</span>}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Practice Problems */}
        {resourceType === 'practice' && (
          <div className="practice-section">
            <div className="practice-stats">
              <div className="practice-stat">
                <span className="stat-number">{resource.problems || 10}</span>
                <span className="stat-label">Problems</span>
              </div>
              <div className="practice-stat">
                <span className="stat-number">{resource.difficulty || 'Medium'}</span>
                <span className="stat-label">Difficulty</span>
              </div>
              {resource.timeLimit && (
                <div className="practice-stat">
                  <span className="stat-number">{resource.timeLimit}</span>
                  <span className="stat-label">Time Limit</span>
                </div>
              )}
            </div>
            <p className="practice-description">{resource.description || 'Practice problems to master this topic.'}</p>
            <button className="btn-primary" onClick={() => navigate(`/practice/${resource.id}`)}>
              ✏️ Start Practice
            </button>
          </div>
        )}

        {/* Study Guide */}
        {resourceType === 'guide' && (
          <div className="guide-section">
            <div className="guide-stats">
              <div className="guide-stat">
                <span className="stat-number">{resource.pages || 0}</span>
                <span className="stat-label">Pages</span>
              </div>
              {resource.difficulty && (
                <div className="guide-stat">
                  <span className="stat-number">{resource.difficulty}</span>
                  <span className="stat-label">Difficulty</span>
                </div>
              )}
            </div>
            <p className="guide-description">{resource.description || 'Study guide to help you master this topic.'}</p>
            <button className="btn-primary" onClick={() => navigate(`/guide/${resource.id}`)}>
              📖 Read Guide
            </button>
          </div>
        )}

        {/* Vault Overview */}
        {resourceType === 'vault' && (
          <div className="vault-section">
            <div className="vault-topics">
              <h3>📚 Topics in this Collection</h3>
              <div className="vault-topics-grid">
                {resource.topics?.map((topic, index) => (
                  <span key={index} className="vault-topic">{topic}</span>
                ))}
              </div>
            </div>
            <button className="btn-primary" onClick={() => navigate('/resources')}>
              Browse All Resources
            </button>
          </div>
        )}

        {/* Tabs Section */}
        <div className="resource-tabs">
          <div className="tab-navigation">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="tab-content">
            {activeTab === 'overview' && (
              <div className="tab-panel">
                <h3>📋 Overview</h3>
                <p>{resource.longDescription || resource.description || 'No description available.'}</p>
                <div className="resource-details-grid">
                  <div className="detail-item">
                    <span className="detail-label">Type</span>
                    <span className="detail-value">{getTypeLabel()}</span>
                  </div>
                  {resource.difficulty && (
                    <div className="detail-item">
                      <span className="detail-label">Difficulty</span>
                      <span className="detail-value">{resource.difficulty}</span>
                    </div>
                  )}
                  {resource.duration && (
                    <div className="detail-item">
                      <span className="detail-label">Duration</span>
                      <span className="detail-value">{resource.duration}</span>
                    </div>
                  )}
                  {resource.tier && (
                    <div className="detail-item">
                      <span className="detail-label">Tier</span>
                      <span className="detail-value">{resource.tier}</span>
                    </div>
                  )}
                  {resource.topics && resource.topics.length > 0 && (
                    <div className="detail-item full-width">
                      <span className="detail-label">Topics</span>
                      <div className="detail-tags">
                        {resource.topics.map((topic, i) => (
                          <span key={i} className="topic-tag">{topic}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'content' && (
              <div className="tab-panel">
                <h3>📄 Content</h3>
                <div className="content-section">
                  {resource.content ? (
                    <div dangerouslySetInnerHTML={{ __html: resource.content }} />
                  ) : (
                    <div className="content-placeholder">
                      <p>📖 {resource.name}</p>
                      <p className="content-sub">{resource.description || 'Content is being prepared.'}</p>
                      {isEnrolled && (
                        <button 
                          className="btn-primary" 
                          onClick={() => navigate(`/session/${resource.id}`)}
                        >
                          View Full Content →
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'related' && (
              <div className="tab-panel">
                <h3>🔗 Related Resources</h3>
                {relatedResources.length > 0 ? (
                  <div className="related-grid">
                    {relatedResources.map((related, index) => (
                      <div 
                        key={index} 
                        className="related-card" 
                        onClick={() => handleResourceClick(related)}
                      >
                        <div className="related-icon">
                          {related.type === 'video' && '🎬'}
                          {related.type === 'practice' && '✏️'}
                          {related.type === 'guide' && '📖'}
                          {related.type === 'interactive' && '🎮'}
                          {!related.type && '📄'}
                        </div>
                        <div className="related-info">
                          <h4>{related.name}</h4>
                          <span className="related-type">{related.type || 'Resource'}</span>
                        </div>
                        <span className="related-arrow">→</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="no-related">No related resources found.</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResourceDetail;