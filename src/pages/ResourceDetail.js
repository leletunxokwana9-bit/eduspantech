// src/pages/ResourceDetail.js
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';
import { API_BASE_URL } from '../services/api';
import './ResourceDetail.css';

const ResourceDetail = () => {
  const { vaultName, resourceId, id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [vault, setVault] = useState(null);
  const [allResources, setAllResources] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [activeTab, setActiveTab] = useState('videos');
  const [user, setUser] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [selectedResource, setSelectedResource] = useState(null);

  const resourceId_ = id || resourceId;

  // Helper: get clean practice description
  const getPracticeDescription = (content) => {
    if (!content) return 'Practice problems with step-by-step solutions.';
    try {
      if (typeof content === 'string' && content.startsWith('{')) {
        const parsed = JSON.parse(content);
        if (parsed.problems && Array.isArray(parsed.problems)) {
          return `${parsed.problems.length} practice problems with step-by-step solutions.`;
        }
      } else if (typeof content === 'object' && content.problems) {
        return `${content.problems.length} practice problems with step-by-step solutions.`;
      }
    } catch (e) { /* ignore */ }
    return typeof content === 'string'
      ? (content.length > 100 ? content.substring(0, 100) + '...' : content)
      : 'Practice problems with step-by-step solutions.';
  };

  // Helper: get problem count
  const getProblemCount = (content) => {
    if (!content) return 0;
    try {
      if (typeof content === 'string' && content.startsWith('{')) {
        const parsed = JSON.parse(content);
        if (parsed.problems && Array.isArray(parsed.problems)) {
          return parsed.problems.length;
        }
      } else if (typeof content === 'object' && content.problems) {
        return content.problems.length;
      }
    } catch (e) { /* ignore */ }
    return 0;
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch resources
        const resourcesResponse = await fetch(`${API_BASE_URL}/content/resources`);
        if (!resourcesResponse.ok) {
          throw new Error(`Failed to fetch resources: ${resourcesResponse.status}`);
        }
        const resourcesData = await resourcesResponse.json();
        console.log('📚 All resources from API:', resourcesData);

        const resources = resourcesData.resources || [];
        setAllResources(resources);

        // Fetch subjects
        const subjectsResponse = await fetch(`${API_BASE_URL}/content/subjects`);
        if (!subjectsResponse.ok) {
          throw new Error(`Failed to fetch subjects: ${subjectsResponse.status}`);
        }
        const subjectsData = await subjectsResponse.json();
        const subjectsList = subjectsData.subjects || [];
        setSubjects(subjectsList);

        // Check auth
        const isAuthenticated = authService.isAuthenticated();
        if (isAuthenticated) {
          const userData = await authService.getCurrentUserWithSubscription();
          if (userData) {
            setUser(userData);
            const tier = userData.tier || userData.subscriptionTier || 'Free';
            const status = userData.subscriptionStatus || 'inactive';
            setSubscription({ tier, status });
          }
        }

        // Build vaults
        const vaults = getVaultsFromResources(resources, subjectsList);

        // Handle direct resource view
        if (resourceId_) {
          const found = resources.find(r => r.id === resourceId_);
          if (found) {
            setSelectedResource(found);
            const subj = subjectsList.find(s => s.id === found.subject_id);
            if (subj) {
              const fv = vaults.find(v => v.id === subj.id);
              if (fv) setVault(fv);
            }
            setLoading(false);
            return;
          }
        }

        // Handle vault navigation
        if (vaultName) {
          const slug = vaultName.toLowerCase().replace(/\s+/g, '-');
          const foundVault = vaults.find(v => {
            const vaultSlug = v.name.toLowerCase().replace(/\s+/g, '-');
            return vaultSlug === slug;
          });

          if (foundVault) {
            setVault(foundVault);
          } else {
            const partialMatch = vaults.find(v =>
              v.name.toLowerCase().includes(vaultName.toLowerCase()) ||
              vaultName.toLowerCase().includes(v.name.toLowerCase())
            );
            if (partialMatch) {
              setVault(partialMatch);
            } else {
              setVault({
                id: null,
                name: vaultName,
                icon: '📚',
                description: `Resources for ${vaultName}`,
                videos: resources.filter(r => r.type === 'video'),
                pdfs: resources.filter(r => r.type === 'pdf'),
                practice: resources.filter(r => r.type === 'practice'),
                guides: resources.filter(r =>
                  r.type === 'guide' || r.type === 'link' || r.type === 'quiz'
                )
              });
            }
          }
        } else {
          setVault({
            id: null,
            name: 'All Resources',
            icon: '📚',
            description: 'All available learning resources',
            videos: resources.filter(r => r.type === 'video'),
            pdfs: resources.filter(r => r.type === 'pdf'),
            practice: resources.filter(r => r.type === 'practice'),
            guides: resources.filter(r =>
              r.type === 'guide' || r.type === 'link' || r.type === 'quiz'
            )
          });
        }

        setError(null);
      } catch (err) {
        console.error('❌ Error fetching resources:', err);
        setError('Failed to load resources: ' + err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [vaultName, resourceId_]);

  // Build vaults from resources
  const getVaultsFromResources = (resources, subjectsList) => {
    if (!resources || !resources.length) return [];

    const grouped = {};
    resources.forEach(resource => {
      const subjectId = resource.subject_id;
      if (!subjectId) return;

      if (!grouped[subjectId]) {
        const subject = subjectsList.find(s => s.id === subjectId);
        grouped[subjectId] = {
          id: subjectId,
          name: subject?.name || 'Unknown Subject',
          icon: subject?.icon || '📚',
          description: subject?.description || '',
          videos: [],
          pdfs: [],
          practice: [],
          guides: []
        };
      }

      if (resource.type === 'video') {
        grouped[subjectId].videos.push(resource);
      } else if (resource.type === 'pdf') {
        grouped[subjectId].pdfs.push(resource);
      } else if (resource.type === 'practice') {
        grouped[subjectId].practice.push(resource);
      } else {
        grouped[subjectId].guides.push(resource);
      }
    });

    return Object.values(grouped);
  };

  const getYouTubeThumbnail = (url) => {
    if (!url) return null;
    let vid = null;
    if (url.includes('youtube.com/embed')) {
      vid = url.split('/embed/')[1]?.split('?')[0];
    } else if (url.includes('youtu.be')) {
      vid = url.split('/').pop()?.split('?')[0];
    } else if (url.includes('youtube.com/watch')) {
      const params = new URLSearchParams(url.split('?')[1]);
      vid = params.get('v');
    }
    return vid ? `https://img.youtube.com/vi/${vid}/mqdefault.jpg` : null;
  };

  const isYouTube = (url) => {
    if (!url) return false;
    return url.includes('youtube.com/embed') ||
      url.includes('youtu.be') ||
      url.includes('youtube.com/watch');
  };

  const handleResourceClick = (r) => {
    setSelectedResource(r);
  };

  const handleBackToVault = () => {
    setSelectedResource(null);
    if (vault) {
      const slug = vault.name.toLowerCase().replace(/\s+/g, '-');
      navigate(`/resources/${slug}`);
    } else {
      navigate('/resources');
    }
  };

  const hasSilverAccess = () => {
    if (!subscription) return false;
    const tier = subscription.tier;
    return tier === 'Tier_Silver' || tier === 'Silver' || tier === 'Tier_Gold' ||
      tier === 'Gold' || tier === 'Tier_Platinum' || tier === 'Platinum';
  };

  const renderResourceViewer = (r) => {
    if (r.type === 'video' && r.youtube_id) {
      return (
        <div className="video-embed-wrapper">
          <iframe
            width="100%"
            height="450"
            src={`https://www.youtube.com/embed/${r.youtube_id}`}
            title={r.name}
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            style={{ borderRadius: '12px', background: '#000' }}
          />
        </div>
      );
    }
    if (r.type === 'video' && isYouTube(r.url)) {
      return (
        <div className="video-embed-wrapper">
          <iframe
            width="100%"
            height="450"
            src={r.url}
            title={r.name}
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            style={{ borderRadius: '12px', background: '#000' }}
          />
        </div>
      );
    }
    if (r.type === 'pdf') {
      return (
        <div className="pdf-embed-wrapper">
          <iframe
            src={r.url}
            title={r.name}
            style={{ width: '100%', height: '600px', borderRadius: '12px', background: '#fff', border: 'none' }}
          />
          <a
            href={r.url}
            target="_blank"
            rel="noopener noreferrer"
            className="open-in-tab-btn"
          >
            📄 Open PDF in new tab
          </a>
        </div>
      );
    }
    return (
      <a
        href={r.url}
        target="_blank"
        rel="noopener noreferrer"
        className="open-in-tab-btn"
      >
        🔗 Open Resource
      </a>
    );
  };

  if (loading) {
    return (
      <div className="resource-detail-loading">
        <div className="loading-spinner"></div>
        <p>Loading resources...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="resource-detail-error">
        <h2>⚠️ Error Loading Resources</h2>
        <p>{error}</p>
        <button onClick={() => navigate('/resources')}>Back to Resources</button>
      </div>
    );
  }

  if (selectedResource) {
    const isYouTubeVideo = selectedResource.type === 'video' && (selectedResource.youtube_id || isYouTube(selectedResource.url));

    return (
      <div className="resource-detail-container">
        <div className="resource-detail-header">
          <button className="back-btn" onClick={handleBackToVault}>
            ← Back to {vault ? vault.name : 'Resources'}
          </button>
          <h1>
            {selectedResource.type === 'video' ? '🎬' :
              selectedResource.type === 'pdf' ? '📄' :
                selectedResource.type === 'practice' ? '✏️' :
                  selectedResource.type === 'guide' ? '📖' : '📎'}{' '}
            {selectedResource.name}
          </h1>
        </div>

        <div className="video-player-container">
          <div className="video-player">
            {renderResourceViewer(selectedResource)}
          </div>

          <div className="video-info">
            <h3>{selectedResource.name}</h3>
            <p>{selectedResource.description || 'No description available'}</p>
            <div className="video-meta">
              <span className="meta-tag">📚 {vault?.name || 'Resources'}</span>
              <span className="meta-tag">
                {selectedResource.type === 'video' ? '🎬 Video' :
                  selectedResource.type === 'pdf' ? '📄 PDF' :
                    selectedResource.type === 'practice' ? '✏️ Practice' :
                      selectedResource.type === 'guide' ? '📖 Guide' : '📎 Resource'}
              </span>
              {isYouTubeVideo && <span className="meta-tag">▶️ YouTube</span>}
              {selectedResource.is_free && (
                <span className="meta-tag" style={{ background: 'rgba(34,197,94,0.15)', color: '#22c55e' }}>FREE</span>
              )}
            </div>
            {!hasSilverAccess() && !selectedResource.is_free && (
              <div className="upgrade-prompt">
                <p>💡 This resource requires a subscription to access.</p>
                <button onClick={() => navigate('/pricing')}>Upgrade Now</button>
              </div>
            )}
          </div>
        </div>

        {vault && (
          <div className="related-videos">
            <h3>More from {vault.name}</h3>
            <div className="related-videos-grid">
              {[
                ...(vault.videos || []),
                ...(vault.pdfs || []),
                ...(vault.practice || []),
                ...(vault.guides || [])
              ]
                .filter(v => v.id !== selectedResource.id)
                .slice(0, 8)
                .map(item => {
                  const thumb = getYouTubeThumbnail(item.url);
                  return (
                    <div
                      key={item.id}
                      className="related-video-card"
                      onClick={() => handleResourceClick(item)}
                    >
                      <div
                        className="related-video-thumbnail"
                        style={{
                          background: thumb ? `url(${thumb})` : '#141b2d',
                          backgroundSize: 'cover',
                          backgroundPosition: 'center',
                          height: '80px',
                          borderRadius: '6px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          marginBottom: '8px'
                        }}
                      >
                        <span style={{ fontSize: '28px', opacity: 0.5 }}>
                          {item.type === 'video' ? '▶' :
                            item.type === 'pdf' ? '📄' :
                              item.type === 'practice' ? '✏️' :
                                item.type === 'guide' ? '📖' : '📎'}
                        </span>
                      </div>
                      <h4>{item.name}</h4>
                    </div>
                  );
                })}
            </div>
          </div>
        )}
      </div>
    );
  }

  if (!vault && vaultName) {
    return (
      <div className="resource-detail-error">
        <h2>🔍 Vault Not Found</h2>
        <p>The resource vault "{vaultName}" doesn't exist.</p>
        <button onClick={() => navigate('/resources')}>Browse All Resources</button>
      </div>
    );
  }

  if (!vault && !vaultName && !selectedResource) {
    navigate('/resources');
    return null;
  }

  const safeVault = {
    videos: vault?.videos || [],
    pdfs: vault?.pdfs || [],
    practice: vault?.practice || [],
    guides: vault?.guides || [],
    ...vault
  };

  return (
    <div className="resource-detail-container">
      <div className="resource-detail-header">
        <button className="back-btn" onClick={() => navigate('/resources')}>
          ← All Resources
        </button>
        <h1>{safeVault.icon || '📚'} {safeVault.name}</h1>
        <p>{safeVault.description}</p>
        <div className="vault-stats">
          <span>🎬 {safeVault.videos.length} Videos</span>
          <span>📄 {safeVault.pdfs.length} PDFs</span>
          <span>✏️ {safeVault.practice.length} Practice</span>
          <span>📖 {safeVault.guides.length} Guides</span>
        </div>
      </div>

      <div className="resource-tabs">
        <button
          className={`tab-btn ${activeTab === 'videos' ? 'active' : ''}`}
          onClick={() => setActiveTab('videos')}
        >
          🎬 Videos ({safeVault.videos.length})
        </button>
        <button
          className={`tab-btn ${activeTab === 'pdfs' ? 'active' : ''}`}
          onClick={() => setActiveTab('pdfs')}
        >
          📄 PDFs ({safeVault.pdfs.length})
        </button>
        <button
          className={`tab-btn ${activeTab === 'practice' ? 'active' : ''}`}
          onClick={() => setActiveTab('practice')}
        >
          ✏️ Practice ({safeVault.practice.length})
        </button>
        <button
          className={`tab-btn ${activeTab === 'guides' ? 'active' : ''}`}
          onClick={() => setActiveTab('guides')}
        >
          📖 Guides ({safeVault.guides.length})
        </button>
      </div>

      {activeTab === 'videos' && (
        <div className="videos-grid">
          {safeVault.videos.length > 0 ? (
            safeVault.videos.map((video) => {
              const thumbnail = getYouTubeThumbnail(video.url);
              const isYouTubeVideo = isYouTube(video.url) || video.youtube_id;

              return (
                <div
                  key={video.id}
                  className="video-card"
                  onClick={() => handleResourceClick(video)}
                >
                  <div
                    className="video-card-thumbnail"
                    style={{
                      background: thumbnail ? `url(${thumbnail})` : 'rgba(79, 70, 229, 0.1)',
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                      height: '140px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      position: 'relative',
                      borderRadius: '12px 12px 0 0'
                    }}
                  >
                    <span className="play-icon" style={{
                      fontSize: '40px',
                      opacity: 0.8,
                      color: 'white',
                      textShadow: '0 2px 8px rgba(0,0,0,0.5)'
                    }}>▶</span>
                    {isYouTubeVideo && (
                      <span style={{
                        position: 'absolute',
                        bottom: '8px',
                        right: '12px',
                        background: 'rgba(0,0,0,0.7)',
                        color: 'white',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontSize: '11px'
                      }}>YouTube</span>
                    )}
                  </div>
                  <div className="video-card-info">
                    <h4>{video.name}</h4>
                    <p>{video.description?.substring(0, 80) || ''}</p>
                    <div className="video-card-meta">
                      <span className="type">Video</span>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="no-resources-message">
              <span>📹</span>
              <p>No videos available in this vault yet.</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'pdfs' && (
        <div className="videos-grid">
          {safeVault.pdfs.length > 0 ? (
            safeVault.pdfs.map((pdf) => (
              <div
                key={pdf.id}
                className="video-card"
                onClick={() => handleResourceClick(pdf)}
              >
                <div
                  className="video-card-thumbnail"
                  style={{
                    background: 'rgba(239, 68, 68, 0.1)',
                    height: '140px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '12px 12px 0 0'
                  }}
                >
                  <span style={{ fontSize: '48px' }}>📄</span>
                </div>
                <div className="video-card-info">
                  <h4>{pdf.name}</h4>
                  <p>{pdf.description?.substring(0, 80) || ''}</p>
                  <div className="video-card-meta">
                    <span className="type">PDF</span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="no-resources-message">
              <span>📄</span>
              <p>No PDFs available in this vault yet.</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'practice' && (
        <div className="practice-grid">
          {safeVault.practice.length > 0 ? (
            safeVault.practice.map((item) => {
              const problemCount = getProblemCount(item.content);
              const description = getPracticeDescription(item.content);

              return (
                <div key={item.id} className="practice-card">
                  <div className="practice-card-icon">✏️</div>
                  <div className="practice-card-info">
                    <h4>{item.name}</h4>
                    <p>{description}</p>
                    {problemCount > 0 && (
                      <span className="problem-count">{problemCount} problems</span>
                    )}
                  </div>
                  <button
                    className="start-btn"
                    onClick={() => {
                      console.log('🔍 Navigating to practice:', item.id);
                      navigate(`/practice/${item.id}`);
                    }}
                  >
                    Start Practice →
                  </button>
                </div>
              );
            })
          ) : (
            <div className="no-resources-message">
              <span>✏️</span>
              <p>No practice problems available yet.</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'guides' && (
        <div className="guides-grid">
          {safeVault.guides.length > 0 ? (
            safeVault.guides.map((guide) => (
              <div
                key={guide.id}
                className="guide-card"
                onClick={() => handleResourceClick(guide)}
                style={{ cursor: 'pointer' }}
              >
                <div className="guide-card-icon">
                  {guide.type === 'quiz' ? '📝' : guide.type === 'link' ? '🔗' : '📖'}
                </div>
                <div className="guide-card-info">
                  <h4>{guide.name}</h4>
                  <p>{guide.description}</p>
                </div>
                <button className="view-btn">View →</button>
              </div>
            ))
          ) : (
            <div className="no-resources-message">
              <span>📖</span>
              <p>No study guides available yet.</p>
            </div>
          )}
        </div>
      )}

      {subscription && (
        <div className="subscription-info-banner">
          <span>📊 Your Plan: {subscription.tier}</span>
          {!hasSilverAccess() && (
            <span className="upgrade-hint">💡 Upgrade to access all content</span>
          )}
        </div>
      )}
    </div>
  );
};

export default ResourceDetail;