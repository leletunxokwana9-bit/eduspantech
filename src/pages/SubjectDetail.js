// src/pages/SubjectDetail.js
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useHomeData } from '../hooks/useHomeData';
import { authService } from '../services/authService';
import { useSound } from '../context/SoundContext';
import './SubjectDetail.css';

import { API_BASE_URL } from '../services/api';

const SubjectDetail = () => {
  const { subjectName } = useParams();
  const navigate = useNavigate();
  const { data, loading: homeLoading, error: homeError } = useHomeData();
  const [activeTab, setActiveTab] = useState('overview');
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [enrollmentStatus, setEnrollmentStatus] = useState(null);
  const [user, setUser] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState(null);

  // ===== CONTENT TREE STATE =====
  const [contentTree, setContentTree] = useState({ topics: [], subjectResources: [] });
  const [contentLoading, setContentLoading] = useState(true);
  const [expandedTopics, setExpandedTopics] = useState({});
  const [activeResource, setActiveResource] = useState(null);

  // ===== SOUND HOOK =====
  const {
    playClick,
    playTabSwitch,
    playPageTransition,
    playEnrollSuccess,
    playEnrollFail,
    playAlreadyEnrolled,
    playEnrollComplete,
    playSubscriptionCreated,
    playSuccess,
    playNotification
  } = useSound();

  // Make sure subjects is always an array
  const subjects = Array.isArray(data?.subjects) ? data.subjects : [];

  // Find subject - handles both slug and exact name
  const subject = subjects.find((item) => {
    if (!item?.name) return false;
    const itemSlug = item.name.toLowerCase().replace(/\s+/g, '-');
    return itemSlug === subjectName || item.name === subjectName;
  });

  // ===== HELPER: Get subscription from JWT token =====
  const getSubscriptionFromToken = () => {
    const token = localStorage.getItem('accessToken');
    if (!token) return null;

    try {
      const tokenParts = token.split('.');
      if (tokenParts.length === 3) {
        const payload = JSON.parse(atob(tokenParts[1]));
        console.log('📦 Token payload:', payload);

        return {
          tier: payload.subscriptionTier || payload.tier || null,
          status: payload.subscriptionStatus || 'active',
          subscriptionTier: payload.subscriptionTier || payload.tier || null,
          subscriptionStatus: payload.subscriptionStatus || 'active'
        };
      }
    } catch (error) {
      console.error('Error decoding token:', error);
    }
    return null;
  };

  // Check authentication status on mount
  useEffect(() => {
    const checkAuth = async () => {
      setIsCheckingAuth(true);

      const isAuthenticated = authService.isAuthenticated();

      if (isAuthenticated) {
        try {
          // Get subscription from token first
          const tokenSubscription = getSubscriptionFromToken();
          if (tokenSubscription) {
            console.log('✅ Subscription from token:', tokenSubscription);
            setSubscription(tokenSubscription);
          }

          const userData = await authService.getCurrentUserWithSubscription();
          if (userData) {
            setUser(userData);

            // If userData has subscription, use it
            if (userData.subscription) {
              setSubscription(userData.subscription);
            }
          } else {
            const fallbackUser = await authService.getCurrentUser();
            if (fallbackUser) {
              setUser(fallbackUser);
            }
          }
        } catch (error) {
          console.error('Failed to get user:', error);
          authService.logout();
        }
      }

      setIsCheckingAuth(false);
    };

    checkAuth();
  }, []);

  // ===== FETCH CONTENT TREE =====
  useEffect(() => {
    const fetchContentTree = async () => {
      if (!subject?.id) return;
      try {
        setContentLoading(true);
        const res = await fetch(`${API_BASE_URL}/content/subjects/${subject.id}/full`);
        const json = await res.json();
        if (json.success) {
          setContentTree({
            topics: json.topics || [],
            subjectResources: json.subjectResources || []
          });
        }
      } catch (err) {
        console.error('Failed to fetch content tree:', err);
      } finally {
        setContentLoading(false);
      }
    };
    fetchContentTree();
  }, [subject?.id]);

  // If subject not found, redirect
  useEffect(() => {
    if (!homeLoading && !subject && data) {
      playPageTransition();
      navigate('/subjects');
    }
  }, [homeLoading, subject, data, navigate, playPageTransition]);

  const getCohortTier = () => {
    if (subject?.name === 'Algebra' || subject?.name === 'Geometry') return 'Tier 1';
    if (subject?.name === 'Calculus' || subject?.name === 'Statistics' || subject?.name === 'Trigonometry') return 'Tier 2';
    if (subject?.name === 'Differential Equations' || subject?.name === 'Linear Algebra' || subject?.name === 'Matrices') return 'Tier 3';
    return 'Tier 1';
  };

  const getRegion = () => {
    const regions = {
      'Algebra': 'Global',
      'Geometry': 'Global',
      'Calculus': 'Global',
      'Statistics': 'Global',
      'Trigonometry': 'Global',
      'Matrices': 'Global',
      'Functions': 'Global',
      'Financial Mathematics': 'South Africa',
      'Differential Equations': 'Global',
      'Linear Algebra': 'Global'
    };
    return regions[subject?.name] || 'Global';
  };

  const getAWSRegion = () => {
    const regions = {
      'South Africa': 'af-south-1',
      'USA': 'us-east-1',
      'UK': 'eu-west-1',
      'Australia': 'ap-southeast-2',
      'Singapore': 'ap-southeast-1',
      'Japan': 'ap-northeast-1',
      'Brazil': 'sa-east-1'
    };
    return regions[getRegion()] || 'us-east-1';
  };

  // ===== HANDLE LOGIN REDIRECT =====
  const handleLoginRedirect = () => {
    playClick();
    navigate('/login', { state: { from: `/subjects/${subjectName}` } });
  };

  // ===== LOGIN PROMPT MODAL =====
  const LoginPrompt = () => (
    <div className="login-prompt-overlay" onClick={() => setShowLoginPrompt(false)}>
      <div className="login-prompt-modal" onClick={(e) => e.stopPropagation()}>
        <button className="login-prompt-close" onClick={() => setShowLoginPrompt(false)}>×</button>
        <div className="login-prompt-icon">🔒</div>
        <h3>Login Required</h3>
        <p>Please log in to enroll in <strong>{selectedSubject?.name || subject?.name}</strong>.</p>
        <div className="login-prompt-actions">
          <button className="login-prompt-btn" onClick={handleLoginRedirect}>
            Login Now →
          </button>
          <button className="login-prompt-cancel" onClick={() => setShowLoginPrompt(false)}>
            Cancel
          </button>
        </div>
        <p className="login-prompt-register">
          Don't have an account? <span onClick={() => navigate('/register')}>Register here</span>
        </p>
      </div>
    </div>
  );

  // ===== ENROLLMENT FUNCTION =====
  const handleEnroll = async () => {
    console.log('🚀 ENROLLMENT STARTED');
    playClick();

    // Check authentication first
    if (!authService.isAuthenticated()) {
      setSelectedSubject(subject);
      setShowLoginPrompt(true);
      playNotification();
      return;
    }

    if (isCheckingAuth) {
      return;
    }

    setIsEnrolling(true);
    setEnrollmentStatus(null);

    try {
      const subjectId = subject.id;
      console.log('📚 Subject ID:', subjectId);

      // Get token
      const token = localStorage.getItem('accessToken');
      if (!token) {
        console.log('❌ No token found');
        playEnrollFail();
        setEnrollmentStatus({
          type: 'error',
          message: 'Please login again to enroll.',
          action: 'login'
        });
        setIsEnrolling(false);
        return;
      }

      // ===== FIX: Get subscription from JWT token =====
      const subscriptionFromToken = getSubscriptionFromToken();
      console.log('📊 Subscription from token:', subscriptionFromToken);

      // Check if user has a subscription tier in the token
      if (!subscriptionFromToken || !subscriptionFromToken.tier) {
        console.log('❌ No subscription tier found in token');
        playEnrollFail();
        setEnrollmentStatus({
          type: 'error',
          message: 'You need an active subscription to enroll. Please subscribe first.',
          action: 'upgrade'
        });
        setIsEnrolling(false);
        return;
      }

      console.log('✅ User has subscription tier:', subscriptionFromToken.tier);

      // Silver tier warning
      const tier = subscriptionFromToken.tier;
      if (tier === 'TIER_SILVER' || tier === 'Silver' || tier === 'Tier_Silver') {
        playNotification();
        setEnrollmentStatus({
          type: 'warning',
          message: 'Silver tier provides archive access only. Upgrade to Gold for live sessions.',
          action: 'upgrade'
        });
      }

      // ===== SEND ENROLLMENT REQUEST =====
      console.log('📤 Sending enrollment request...');
      const enrollmentResponse = await fetch(`${API_BASE_URL}/content/subjects/${subjectId}/enroll`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      console.log('📡 Enrollment response status:', enrollmentResponse.status);

      if (enrollmentResponse.ok) {
        // ===== SUCCESS SOUNDS =====
        playEnrollSuccess();
        setTimeout(() => playEnrollComplete(), 300);
        setTimeout(() => playSubscriptionCreated(), 600);

        setEnrollmentStatus({
          type: 'success',
          message: `✅ Successfully enrolled in ${subject.name}! You now have access to all materials.`,
          action: 'dashboard'
        });

        setTimeout(() => {
          playSuccess();
          navigate('/dashboard');
        }, 2000);
      } else if (enrollmentResponse.status === 400) {
        const errorData = await enrollmentResponse.json();
        console.log('📄 Error data:', errorData);

        if (errorData.error && errorData.error.toLowerCase().includes('already enrolled')) {
          // ===== ALREADY ENROLLED SOUND =====
          playAlreadyEnrolled();
          setEnrollmentStatus({
            type: 'info',
            message: `ℹ️ You are already enrolled in ${subject.name}. You can access all materials from your dashboard.`,
            action: 'dashboard'
          });
        } else {
          playEnrollFail();
          setEnrollmentStatus({
            type: 'error',
            message: errorData.error || 'Failed to enroll. Please try again.',
            action: 'retry'
          });
        }
      } else if (enrollmentResponse.status === 401) {
        playEnrollFail();
        setEnrollmentStatus({
          type: 'error',
          message: 'Session expired. Please login again.',
          action: 'login'
        });
      } else {
        const errorData = await enrollmentResponse.json();
        console.log('❌ Error response:', errorData);
        playEnrollFail();
        setEnrollmentStatus({
          type: 'error',
          message: errorData.error || 'Failed to enroll. Please try again.',
          action: 'retry'
        });
      }
    } catch (error) {
      console.error('❌ Enrollment error:', error);
      playEnrollFail();
      setEnrollmentStatus({
        type: 'error',
        message: 'An error occurred during enrollment. Please try again.',
        action: 'retry'
      });
    } finally {
      setIsEnrolling(false);
    }
  };

  // ===== HANDLE ENROLLMENT ACTION WITH SOUNDS =====
  const handleEnrollmentAction = () => {
    if (!enrollmentStatus) return;

    playClick();

    switch (enrollmentStatus.action) {
      case 'upgrade':
        playPageTransition();
        navigate('/pricing');
        break;
      case 'login':
        playPageTransition();
        navigate('/login', { state: { redirect: `/subjects/${subjectName}` } });
        break;
      case 'schedule':
        playTabSwitch();
        setActiveTab('schedule');
        setEnrollmentStatus(null);
        break;
      case 'dashboard':
        playPageTransition();
        navigate('/dashboard');
        break;
      case 'subjects':
        playPageTransition();
        navigate('/subjects');
        break;
      case 'prereqs':
        setEnrollmentStatus(null);
        break;
      case 'retry':
        setEnrollmentStatus(null);
        handleEnroll();
        break;
      default:
        setEnrollmentStatus(null);
    }
  };

  // ============================================
  // RESOURCE HANDLING
  // ============================================
  const getResourceIcon = (type) => ({
    video: '🎬',
    pdf: '📄',
    practice: '✏️',
    guide: '📖',
    quiz: '📝',
    link: '🔗'
  }[type] || '📎');

  const handleResourceClick = (resource) => {
    console.log('📄 Resource clicked:', resource);
    playClick();
    setActiveResource(resource);
  };

  const toggleTopic = (topicId) => {
    playClick();
    setExpandedTopics(prev => ({
      ...prev,
      [topicId]: prev[topicId] === false ? true : false
    }));
  };

  const renderResourceViewer = (r) => {
    if (r.type === 'video' && r.youtube_id) {
      return (
        <div className="sd-viewer-embed">
          <iframe
            src={`https://www.youtube.com/embed/${r.youtube_id}`}
            title={r.name}
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      );
    }
    if (r.type === 'pdf') {
      return (
        <div className="sd-viewer-embed">
          <iframe src={r.url} title={r.name} />
          <a href={r.url} target="_blank" rel="noopener noreferrer" className="sd-open-link">
            📄 Open in new tab
          </a>
        </div>
      );
    }
    return (
      <a href={r.url} target="_blank" rel="noopener noreferrer" className="sd-open-link">
        🔗 Open Resource
      </a>
    );
  };

  // ===== HANDLE TAB SWITCH WITH SOUNDS =====
  const handleTabSwitch = (tabId) => {
    if (activeTab !== tabId) {
      playTabSwitch();
      setActiveTab(tabId);
    }
  };

  const tabs = [
    { id: 'overview', label: '📋 Overview' },
    { id: 'topics', label: '📚 Topics & Content' },
    { id: 'schedule', label: '🕐 Schedule' }
  ];

  if (homeLoading || isCheckingAuth) {
    return (
      <div className="subject-detail-container loading">
        <div className="loading-spinner"></div>
        <p>{isCheckingAuth ? 'Checking your account...' : 'Loading subject details...'}</p>
      </div>
    );
  }

  if (homeError) {
    return (
      <div className="subject-detail-container error">
        <div className="error-icon">⚠️</div>
        <h2>Error loading subject</h2>
        <p>{homeError}</p>
        <button className="retry-button" onClick={() => window.location.reload()}>
          Try Again
        </button>
      </div>
    );
  }

  if (!subject) {
    return (
      <div className="subject-detail-container error">
        <div className="error-icon">🔍</div>
        <h2>Subject Not Found</h2>
        <p>The subject you're looking for doesn't exist.</p>
        <button className="retry-button" onClick={() => navigate('/subjects')}>
          Back to Subjects
        </button>
      </div>
    );
  }

  const resourceCount = contentTree.topics.reduce((total, topic) =>
    total + (topic.resources?.length || 0) +
    (topic.subtopics?.reduce((subTotal, sub) => subTotal + (sub.resources?.length || 0), 0) || 0), 0
  ) + contentTree.subjectResources.length;

  const topicCount = contentTree.topics.length;

  return (
    <main className="subject-detail-container sd-redesign">
      {showLoginPrompt && <LoginPrompt />}

      <div className="sd-page-shell">
        <div className="sd-breadcrumbs">
          <button type="button" onClick={() => navigate('/subjects')}>Subjects</button>
          <span>/</span>
          <span>{subject.name}</span>
        </div>

        <section className="sd-hero">
          <div className="sd-hero-copy">
            <div className="sd-eyebrow">YOUR LEARNING SPACE</div>
            <h1>{subject.name}</h1>
            <p>{subject.longDescription || subject.description || 'Explore the learning materials and curriculum for this subject.'}</p>
            <div className="sd-hero-meta">
              <span>{getCohortTier()}</span>
              <span>{getRegion()}</span>
              <span>{getAWSRegion()}</span>
            </div>
          </div>
          <div className="sd-hero-actions">
            <button
              type="button"
              className="sd-enrol-button"
              onClick={handleEnroll}
              disabled={isEnrolling}
            >
              {isEnrolling ? 'Enrolling…' : 'Enrol in subject'}
              <span aria-hidden="true">→</span>
            </button>
            <button
              type="button"
              className="sd-back-button"
              onClick={() => { playClick(); navigate('/subjects'); }}
            >
              Browse subjects
            </button>
          </div>
          <div className="sd-hero-mark" aria-hidden="true">{subject.icon || '✦'}</div>
        </section>

        {enrollmentStatus && (
          <div className={`enrollment-status ${enrollmentStatus.type}`} role="status">
            <p>{enrollmentStatus.message}</p>
            {(enrollmentStatus.action === 'upgrade' || enrollmentStatus.action === 'login' ||
              enrollmentStatus.action === 'schedule' || enrollmentStatus.action === 'dashboard' ||
              enrollmentStatus.action === 'subjects' || enrollmentStatus.action === 'retry') && (
              <button type="button" className="enrollment-action-btn" onClick={handleEnrollmentAction}>
                {enrollmentStatus.action === 'upgrade' && 'Upgrade plan →'}
                {enrollmentStatus.action === 'login' && 'Log in →'}
                {enrollmentStatus.action === 'schedule' && 'View schedule →'}
                {enrollmentStatus.action === 'dashboard' && 'Go to dashboard →'}
                {enrollmentStatus.action === 'subjects' && 'Browse subjects →'}
                {enrollmentStatus.action === 'retry' && 'Try again →'}
              </button>
            )}
          </div>
        )}

        {user && subscription && (
          <section className="sd-account-strip">
            <div className="sd-account-indicator"><span /> ACCOUNT PLAN</div>
            <strong>{subscription.tier || subscription.subscriptionTier || 'Subscription'}</strong>
            <span>{subscription.status || subscription.subscriptionStatus || 'Active'}</span>
            {(subscription.tier === 'TIER_SILVER' || subscription.tier === 'Silver' || subscription.tier === 'Tier_Silver') && (
              <button type="button" onClick={() => navigate('/pricing')}>Explore live-session plans</button>
            )}
          </section>
        )}

        {!user && !isCheckingAuth && (
          <div className="sd-signin-note">
            <span>Already have an account?</span>
            <button type="button" onClick={() => { playClick(); setShowLoginPrompt(true); }}>Log in to enrol</button>
          </div>
        )}

        <section className="sd-learning-overview">
          <div className="sd-section-heading">
            <div>
              <span className="sd-section-kicker">SUBJECT AT A GLANCE</span>
              <h2>Build your understanding</h2>
              <p>Everything published for this subject, organised in one learning space.</p>
            </div>
            <span className="sd-active-label"><i /> Subject page</span>
          </div>

          <div className="sd-stat-grid">
            <article className="sd-stat-card">
              <span className="sd-stat-icon">01</span>
              <div><strong>{contentLoading ? '—' : topicCount}</strong><span>Learning topics</span></div>
            </article>
            <article className="sd-stat-card">
              <span className="sd-stat-icon">02</span>
              <div><strong>{contentLoading ? '—' : resourceCount}</strong><span>Published resources</span></div>
            </article>
            <article className="sd-stat-card">
              <span className="sd-stat-icon">03</span>
              <div><strong>{getCohortTier()}</strong><span>Learning tier</span></div>
            </article>
            <article className="sd-stat-card">
              <span className="sd-stat-icon">04</span>
              <div><strong>{getRegion()}</strong><span>Learning region</span></div>
            </article>
          </div>
        </section>

        <section className="sd-workspace">
          <div className="sd-workspace-main">
            <div className="sd-tabs-header">
              <div>
                <span className="sd-section-kicker">COURSE WORKSPACE</span>
                <h2>Explore this subject</h2>
              </div>
              <nav className="sd-tabs" aria-label="Subject sections">
                {tabs.map(tab => (
                  <button
                    type="button"
                    key={tab.id}
                    className={activeTab === tab.id ? 'active' : ''}
                    onClick={() => handleTabSwitch(tab.id)}
                  >
                    {tab.id === 'overview' ? 'Overview' : tab.id === 'topics' ? 'Curriculum & resources' : 'Schedule'}
                  </button>
                ))}
              </nav>
            </div>

            <div className="sd-tab-panel">
              {activeTab === 'overview' && (
                <div className="sd-overview-panel">
                  <div className="sd-overview-intro">
                    <span className="sd-panel-index">01 / OVERVIEW</span>
                    <h3>{subject.name}</h3>
                    <p>{subject.longDescription || subject.description || 'Learning information for this subject will appear here as it is published.'}</p>
                  </div>
                  <div className="sd-overview-facts">
                    <div><span>Subject</span><strong>{subject.name}</strong></div>
                    <div><span>Learning tier</span><strong>{getCohortTier()}</strong></div>
                    <div><span>Region</span><strong>{getRegion()}</strong></div>
                    <div><span>Infrastructure region</span><strong>{getAWSRegion()}</strong></div>
                  </div>
                  <div className="sd-overview-callout">
                    <div className="sd-callout-symbol">↗</div>
                    <div><strong>Continue into the curriculum</strong><p>Open the curriculum and resources tab to explore topics, lessons and materials published for this subject.</p></div>
                    <button type="button" onClick={() => handleTabSwitch('topics')}>Explore curriculum</button>
                  </div>
                </div>
              )}

              {activeTab === 'topics' && (
                <div className="sd-curriculum-panel">
                  <div className="sd-panel-heading">
                    <div><span className="sd-panel-index">02 / LEARNING CONTENT</span><h3>Curriculum & resources</h3></div>
                    <span>{contentLoading ? 'Loading…' : `${topicCount} topics · ${resourceCount} resources`}</span>
                  </div>
                  {contentLoading ? (
                    <div className="sd-content-loading"><div className="loading-spinner" /><p>Loading published learning content…</p></div>
                  ) : (contentTree.topics.length === 0 && contentTree.subjectResources.length === 0) ? (
                    <div className="sd-empty-content">
                      <div className="sd-empty-symbol">＋</div>
                      <h4>Learning content is being prepared</h4>
                      <p>There are no published topics or resources for this subject yet. New material will appear here when it is published.</p>
                    </div>
                  ) : (
                    <div className="sd-topic-tree">
                      {contentTree.subjectResources.length > 0 && (
                        <section className="sd-topic-block sd-general-resources">
                          <div className="sd-topic-block-heading"><div><span>FOUNDATION</span><h4>Subject resources</h4></div><small>{contentTree.subjectResources.length} items</small></div>
                          <div className="sd-resource-list">
                            {contentTree.subjectResources.map(r => (
                              <button type="button" key={r.id} className="sd-resource-card" onClick={() => handleResourceClick(r)}>
                                <span className="sd-res-icon">{getResourceIcon(r.type)}</span>
                                <span className="sd-res-body"><strong className="sd-res-name">{r.name}</strong>{r.description && <span className="sd-res-desc">{r.description}</span>}</span>
                                {r.is_free && <span className="sd-res-free">FREE</span>}
                                <span className="sd-resource-arrow">↗</span>
                              </button>
                            ))}
                          </div>
                        </section>
                      )}

                      {contentTree.topics.map((topic, index) => {
                        const isExpanded = expandedTopics[topic.id] !== false;
                        const topicResCount = (topic.resources?.length || 0) +
                          (topic.subtopics?.reduce((total, sub) => total + (sub.resources?.length || 0), 0) || 0);
                        return (
                          <section key={topic.id} className="sd-topic-block">
                            <button type="button" className="sd-topic-title" onClick={() => toggleTopic(topic.id)} aria-expanded={isExpanded}>
                              <span className="sd-topic-number">{String(index + 1).padStart(2, '0')}</span>
                              <span className="sd-topic-title-copy"><strong>{topic.name}</strong>{topic.description && <small>{topic.description}</small>}</span>
                              <span className="sd-topic-count">{topicResCount} resources</span>
                              <span className={`sd-toggle ${isExpanded ? 'expanded' : ''}`}>⌄</span>
                            </button>
                            {isExpanded && (
                              <div className="sd-topic-content">
                                {topic.resources?.length > 0 && (
                                  <div className="sd-resource-list">
                                    {topic.resources.map(r => (
                                      <button type="button" key={r.id} className="sd-resource-card" onClick={() => handleResourceClick(r)}>
                                        <span className="sd-res-icon">{getResourceIcon(r.type)}</span>
                                        <span className="sd-res-body"><strong className="sd-res-name">{r.name}</strong>{r.description && <span className="sd-res-desc">{r.description}</span>}</span>
                                        {r.is_free && <span className="sd-res-free">FREE</span>}
                                        <span className="sd-resource-arrow">↗</span>
                                      </button>
                                    ))}
                                  </div>
                                )}
                                {topic.subtopics?.map(sub => (
                                  <div key={sub.id} className="sd-subtopic-block">
                                    <div className="sd-subtopic-heading"><strong>{sub.name}</strong>{sub.description && <span>{sub.description}</span>}</div>
                                    {sub.resources?.length > 0 && (
                                      <div className="sd-resource-list">
                                        {sub.resources.map(r => (
                                          <button type="button" key={r.id} className="sd-resource-card" onClick={() => handleResourceClick(r)}>
                                            <span className="sd-res-icon">{getResourceIcon(r.type)}</span>
                                            <span className="sd-res-body"><strong className="sd-res-name">{r.name}</strong>{r.description && <span className="sd-res-desc">{r.description}</span>}</span>
                                            {r.is_free && <span className="sd-res-free">FREE</span>}
                                            <span className="sd-resource-arrow">↗</span>
                                          </button>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                          </section>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'schedule' && (
                <div className="sd-schedule-panel">
                  <span className="sd-panel-index">03 / YOUR SESSIONS</span>
                  <h3>Learning schedule</h3>
                  <div className="sd-empty-content">
                    <div className="sd-empty-symbol">◷</div>
                    <h4>Your subject sessions belong here</h4>
                    <p>Session times should be shown from your actual bookings. Visit your dashboard to view and manage scheduled tutoring sessions.</p>
                    <button type="button" className="sd-inline-action" onClick={() => navigate('/dashboard')}>Open learner dashboard →</button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <aside className="sd-workspace-aside">
            <section className="sd-aside-card sd-about-card">
              <span className="sd-section-kicker">SUBJECT DETAILS</span>
              <h3>Learning profile</h3>
              <div className="sd-aside-detail"><span>Subject tier</span><strong>{getCohortTier()}</strong></div>
              <div className="sd-aside-detail"><span>Region</span><strong>{getRegion()}</strong></div>
              <div className="sd-aside-detail"><span>Cloud hub</span><strong>{getAWSRegion()}</strong></div>
              <div className="sd-aside-detail"><span>Published topics</span><strong>{contentLoading ? '—' : topicCount}</strong></div>
            </section>
            <section className="sd-aside-card sd-next-card">
              <span className="sd-next-label">READY TO LEARN?</span>
              <h3>Make progress, one topic at a time.</h3>
              <p>Access the published learning material for {subject.name} in your curriculum workspace.</p>
              <button type="button" onClick={() => handleTabSwitch('topics')}>View learning content <span>→</span></button>
            </section>
          </aside>
        </section>
      </div>

      {activeResource && (
        <div className="sd-viewer-overlay" onClick={() => setActiveResource(null)}>
          <div className="sd-viewer" onClick={e => e.stopPropagation()}>
            <button type="button" className="sd-viewer-close" onClick={() => setActiveResource(null)}>✕</button>
            <h2>{getResourceIcon(activeResource.type)} {activeResource.name}</h2>
            {activeResource.description && <p className="sd-viewer-desc">{activeResource.description}</p>}
            {renderResourceViewer(activeResource)}
          </div>
        </div>
      )}
    </main>
  );
};

export default SubjectDetail;
