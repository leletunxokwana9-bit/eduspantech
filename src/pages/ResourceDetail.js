// src/pages/ResourceDetail.js
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { resourceService } from '../services/resourceService';
import { authService } from '../services/authService';
import './ResourceDetail.css';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://eduspantech-backend.onrender.com/api/v1';

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
  const [selectedVideo, setSelectedVideo] = useState(null);

  const videoId = id || resourceId;

  // ✅ Helper function to get clean description from JSON content
  const getPracticeDescription = (content) => {
    if (!content) return 'Practice problems with step-by-step solutions.';
    
    try {
      if (content.startsWith('{')) {
        const parsed = JSON.parse(content);
        if (parsed.problems && Array.isArray(parsed.problems)) {
          return `${parsed.problems.length} practice problems with step-by-step solutions.`;
        }
      }
    } catch (e) {}
    return content.length > 100 ? content.substring(0, 100) + '...' : content;
  };

  // ✅ Helper function to get problem count
  const getProblemCount = (content) => {
    if (!content) return 0;
    try {
      if (content.startsWith('{')) {
        const parsed = JSON.parse(content);
        if (parsed.problems && Array.isArray(parsed.problems)) {
          return parsed.problems.length;
        }
      }
    } catch (e) {}
    return 0;
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        const data = await resourceService.getAllResources();
        console.log('📚 All resources from API:', data);
        setAllResources(data.resources || []);
        
        const subjectsResponse = await fetch(`${API_BASE_URL}/content/subjects`);
        const subjectsData = await subjectsResponse.json();
        const subjectsList = subjectsData.subjects || [];
        setSubjects(subjectsList);
        
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
        
        const vaults = getVaultsFromResources(data.resources || [], subjectsList);
        
        if (videoId) {
          const foundVideo = data.resources?.find(r => r.id === videoId && r.type === 'video');
          if (foundVideo) {
            setSelectedVideo(foundVideo);
            const subject = subjectsList.find(s => s.id === foundVideo.subject_id);
            if (subject) {
              const foundVault = vaults.find(v => v.id === subject.id);
              if (foundVault) setVault(foundVault);
            }
            setLoading(false);
            setError(null);
            return;
          }
        }
        
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
            if (partialMatch) setVault(partialMatch);
            else setVault(null);
          }
        } else {
          setVault(null);
        }
        
        setError(null);
      } catch (err) {
        console.error('❌ Error fetching resources:', err);
        setError('Failed to load resources');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [vaultName, videoId]);

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
          practice: [],
          guides: []
        };
      }
      
      if (resource.type === 'video') {
        grouped[subjectId].videos.push(resource);
      } else if (resource.type === 'practice') {
        grouped[subjectId].practice.push(resource);
      } else if (resource.type === 'guide') {
        grouped[subjectId].guides.push(resource);
      }
    });
    
    return Object.values(grouped);
  };

  const getYouTubeThumbnail = (url) => {
    if (!url) return null;
    if (url.includes('youtube.com/embed')) {
      const videoId = url.split('/embed/')[1]?.split('?')[0];
      if (videoId) return `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;
    } else if (url.includes('youtu.be')) {
      const videoId = url.split('/').pop()?.split('?')[0];
      if (videoId) return `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;
    } else if (url.includes('youtube.com/watch')) {
      const params = new URLSearchParams(url.split('?')[1]);
      const videoId = params.get('v');
      if (videoId) return `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;
    }
    return null;
  };

  const isYouTube = (url) => {
    if (!url) return false;
    return url.includes('youtube.com/embed') || 
           url.includes('youtu.be') || 
           url.includes('youtube.com/watch');
  };

  const handleVideoClick = (video) => {
    setSelectedVideo(video);
    navigate(`/resources/videos/${video.id}`, { replace: true });
  };

  const handleBackToVault = () => {
    setSelectedVideo(null);
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
    return tier === 'Tier_Silver' || tier === 'Silver' || tier === 'Tier_Gold' || tier === 'Gold' || tier === 'Tier_Platinum' || tier === 'Platinum';
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

  if (selectedVideo) {
    const isYouTubeVideo = isYouTube(selectedVideo.url);
    const thumbnail = getYouTubeThumbnail(selectedVideo.url);

    return (
      <div className="resource-detail-container">
        <div className="resource-detail-header">
          <button className="back-btn" onClick={handleBackToVault}>
            ← Back to {vault ? vault.name : 'Resources'}
          </button>
          <h1>🎬 {selectedVideo.name}</h1>
        </div>

        <div className="video-player-container">
          <div className="video-player">
            {isYouTubeVideo ? (
              <div className="video-embed-wrapper">
                <iframe
                  width="100%"
                  height="450"
                  src={selectedVideo.url}
                  title={selectedVideo.name}
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  style={{ borderRadius: '12px', background: '#000' }}
                />
              </div>
            ) : (
              <div 
                className="video-placeholder" 
                style={{
                  background: thumbnail ? `url(${thumbnail})` : '#141b2d',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  minHeight: '300px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative'
                }}
              >
                <div className="video-thumbnail" style={{ textAlign: 'center' }}>
                  <span className="play-icon" style={{ fontSize: '64px', opacity: 0.8 }}>▶</span>
                  <div className="video-controls" style={{ marginTop: '16px' }}>
                    <button className="play-btn">▶ Play Video</button>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="video-info">
            <h3>{selectedVideo.name}</h3>
            <p>{selectedVideo.content || 'No description available'}</p>
            <div className="video-meta">
              <span className="meta-tag">📚 {vault?.name || 'Unknown'}</span>
              {isYouTubeVideo && <span className="meta-tag">🎬 YouTube</span>}
            </div>
            {!hasSilverAccess() && (
              <div className="upgrade-prompt">
                <p>💡 This video requires a subscription to access.</p>
                <button onClick={() => navigate('/pricing')}>Upgrade Now</button>
              </div>
            )}
          </div>
        </div>

        {vault && vault.videos && vault.videos.length > 1 && (
          <div className="related-videos">
            <h3>More from {vault.name}</h3>
            <div className="related-videos-grid">
              {vault.videos
                .filter(v => v.id !== selectedVideo.id)
                .map(video => {
                  const thumb = getYouTubeThumbnail(video.url);
                  return (
                    <div 
                      key={video.id} 
                      className="related-video-card"
                      onClick={() => handleVideoClick(video)}
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
                        <span style={{ fontSize: '28px', opacity: 0.5 }}>▶</span>
                      </div>
                      <h4>{video.name}</h4>
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

  if (!vault && !vaultName && !selectedVideo) {
    navigate('/resources');
    return null;
  }

  return (
    <div className="resource-detail-container">
      <div className="resource-detail-header">
        <button className="back-btn" onClick={() => navigate('/resources')}>
          ← All Resources
        </button>
        <h1>{vault?.icon} {vault?.name}</h1>
        <p>{vault?.description}</p>
        <div className="vault-stats">
          <span>🎬 {vault?.videos?.length || 0} Videos</span>
          <span>✏️ {vault?.practice?.length || 0} Practice</span>
          <span>📖 {vault?.guides?.length || 0} Guides</span>
        </div>
      </div>

      <div className="resource-tabs">
        <button 
          className={`tab-btn ${activeTab === 'videos' ? 'active' : ''}`}
          onClick={() => setActiveTab('videos')}
        >
          🎬 Videos ({vault?.videos?.length || 0})
        </button>
        <button 
          className={`tab-btn ${activeTab === 'practice' ? 'active' : ''}`}
          onClick={() => setActiveTab('practice')}
        >
          ✏️ Practice ({vault?.practice?.length || 0})
        </button>
        <button 
          className={`tab-btn ${activeTab === 'guides' ? 'active' : ''}`}
          onClick={() => setActiveTab('guides')}
        >
          📖 Guides ({vault?.guides?.length || 0})
        </button>
      </div>

      {activeTab === 'videos' && (
        <div className="videos-grid">
          {vault?.videos && vault.videos.length > 0 ? (
            vault.videos.map((video) => {
              const thumbnail = getYouTubeThumbnail(video.url);
              const isYouTubeVideo = isYouTube(video.url);
              
              return (
                <div 
                  key={video.id} 
                  className="video-card"
                  onClick={() => handleVideoClick(video)}
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
                    <p>{video.content?.substring(0, 80)}...</p>
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

      {activeTab === 'practice' && (
        <div className="practice-grid">
          {vault?.practice && vault.practice.length > 0 ? (
            vault.practice.map((item) => {
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
          {vault?.guides && vault.guides.length > 0 ? (
            vault.guides.map((guide) => (
              <div key={guide.id} className="guide-card">
                <div className="guide-card-icon">📖</div>
                <div className="guide-card-info">
                  <h4>{guide.name}</h4>
                  <p>{guide.content}</p>
                </div>
                <button className="view-btn">View Guide →</button>
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