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
  const { data, loading, error } = useHomeData();
  const [activeTab, setActiveTab] = useState('overview');
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [enrollmentStatus, setEnrollmentStatus] = useState(null);
  const [user, setUser] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState(null);

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

  // If subject not found, redirect
  useEffect(() => {
    if (!loading && !subject && data) {
      playPageTransition();
      navigate('/subjects');
    }
  }, [loading, subject, data, navigate, playPageTransition]);

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

  // ===== ENROLLMENT FUNCTION WITH FIX =====
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
  // HANDLE RESOURCE CLICK WITH SOUNDS
  // ============================================
  const handleResourceClick = (resource) => {
    console.log('📄 Resource clicked:', resource);
    playClick();
    
    if (resource.path) {
      playPageTransition();
      navigate(resource.path);
      return;
    }
    
    if (resource.id && resource.type) {
      const id = resource.id;
      
      switch (resource.type) {
        case 'video':
          playPageTransition();
          navigate(`/resources/videos/${id}`);
          break;
        case 'practice':
          playPageTransition();
          navigate(`/resources/practice/${id}`);
          break;
        case 'guide':
          playPageTransition();
          navigate(`/resources/guides/${id}`);
          break;
        case 'interactive':
          playPageTransition();
          navigate(`/resources/interactive/${id}`);
          break;
        default:
          playPageTransition();
          navigate(`/resources/${id}`);
      }
      return;
    }
    
    playPageTransition();
    navigate('/resources');
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
    { id: 'topics', label: '📚 Topics' },
    { id: 'schedule', label: '🕐 Schedule' },
    { id: 'resources', label: '📄 Resources' }
  ];

  if (loading || isCheckingAuth) {
    return (
      <div className="subject-detail-container loading">
        <div className="loading-spinner"></div>
        <p>{isCheckingAuth ? 'Checking your account...' : 'Loading subject details...'}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="subject-detail-container error">
        <div className="error-icon">⚠️</div>
        <h2>Error loading subject</h2>
        <p>{error}</p>
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

  return (
    <div className="subject-detail-container">
      {/* Login Prompt Modal */}
      {showLoginPrompt && <LoginPrompt />}

      {/* Header */}
      <div className="subject-detail-header">
        <div className="subject-title-section">
          <h1>{subject.icon} {subject.name}</h1>
          <div className="subject-meta-tags">
            <span className="tag cohort-tier">{getCohortTier()}</span>
            <span className="tag region">🌍 {getRegion()}</span>
            <span className="tag aws-region">☁️ {getAWSRegion()}</span>
          </div>
        </div>
        <div className="subject-actions">
          <button
            className={`btn btn-primary ${isEnrolling ? 'loading' : ''}`}
            onClick={handleEnroll}
            disabled={isEnrolling}
          >
            {isEnrolling ? '⏳ Enrolling...' : '📚 Enroll Now'}
          </button>
          <button className="btn btn-secondary" onClick={() => { playClick(); }}>📝 View Syllabus</button>
        </div>
      </div>

      {/* Enrollment Status */}
      {enrollmentStatus && (
        <div className={`enrollment-status ${enrollmentStatus.type}`}>
          <p>{enrollmentStatus.message}</p>
          {(enrollmentStatus.action === 'upgrade' ||
            enrollmentStatus.action === 'login' ||
            enrollmentStatus.action === 'schedule' ||
            enrollmentStatus.action === 'dashboard' ||
            enrollmentStatus.action === 'subjects' ||
            enrollmentStatus.action === 'retry') && (
              <button
                className="enrollment-action-btn"
                onClick={handleEnrollmentAction}
              >
                {enrollmentStatus.action === 'upgrade' && 'Upgrade Plan →'}
                {enrollmentStatus.action === 'login' && 'Login →'}
                {enrollmentStatus.action === 'schedule' && 'View Schedule →'}
                {enrollmentStatus.action === 'dashboard' && 'Go to Dashboard →'}
                {enrollmentStatus.action === 'subjects' && 'Browse Subjects →'}
                {enrollmentStatus.action === 'retry' && 'Try Again →'}
              </button>
            )}
        </div>
      )}

      {/* Subscription info banner */}
      {user && subscription && (
        <div className="subscription-banner">
          <span className="subscription-tier">📊 {subscription.tier || subscription.subscriptionTier}</span>
          <span className="subscription-status">{subscription.status || subscription.subscriptionStatus || 'Active'}</span>
          {(subscription.tier === 'TIER_SILVER' || subscription.tier === 'Silver' || subscription.tier === 'Tier_Silver') && (
            <span className="subscription-note">💡 Upgrade to Gold for live sessions</span>
          )}
        </div>
      )}

      {/* If not logged in, show subtle login hint */}
      {!user && !isCheckingAuth && (
        <div className="login-prompt-hint">
          <p>🔐 Please <button className="login-link" onClick={() => { playClick(); setShowLoginPrompt(true); }}>login</button> to enroll in this subject.</p>
        </div>
      )}

      {/* Content */}
      <div className="subject-detail-content">
        <div className="subject-overview">
          <h3>📖 About This Subject</h3>
          <p className="subject-description">{subject.longDescription || subject.description}</p>

          <div className="subject-info-grid">
            <div className="info-card">
              <h4>🎯 Curriculum Structure</h4>
              <p><strong>Tier:</strong> {getCohortTier()}</p>
              <p><strong>Region:</strong> {getRegion()}</p>
              <p><strong>AWS Hub:</strong> {getAWSRegion()}</p>
            </div>
            <div className="info-card">
              <h4>📊 Grade Mapping</h4>
              <p><strong>South Africa:</strong> Grades 8-12</p>
              <p><strong>International:</strong> Equivalent</p>
              <div className="curriculum-adjustment">
                <p>⚠️ <strong>Adjustment:</strong> {subject.name} may be introduced earlier in accelerated curricula.</p>
              </div>
            </div>
            <div className="info-card">
              <h4>👨‍🏫 Tutor Assignment</h4>
              <p><strong>Shift:</strong> 24/7 Centralised South African Tutors</p>
              <div className="tutors-list">
                <span className="tutor-tag">🇿🇦 Tutor A (Tier 1)</span>
                <span className="tutor-tag">🇿🇦 Tutor B (Tier 2)</span>
                <span className="tutor-tag">🇿🇦 Tutor C (Tier 3)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Whiteboard Preview */}
        <div className="whiteboard-preview-section">
          <h3>✏️ Interactive Whiteboard Preview</h3>
          <div className="whiteboard-container">
            <svg className="whiteboard-canvas" viewBox="0 0 600 200" preserveAspectRatio="xMidYMid meet">
              <rect width="100%" height="100%" fill="#ffffff" />
              <text x="20" y="40" fontSize="14" fill="#333" fontFamily="monospace">📐 Interactive Whiteboard</text>
              <text x="20" y="70" fontSize="12" fill="#666" fontFamily="monospace">Draw, collaborate, and solve problems in real-time</text>
              <line x1="20" y1="100" x2="580" y2="100" stroke="#e2e8f0" strokeWidth="1" />
              <text x="20" y="130" fontSize="12" fill="#888" fontFamily="monospace">✏️ Vector tools | 📐 Shape tools | ✏️ Freehand</text>
              <text x="20" y="160" fontSize="12" fill="#aaa" fontFamily="monospace">💡 {subject.name} • Live session • Tutor: 🇿🇦</text>
            </svg>
          </div>
          <p className="whiteboard-note">💡 Whiteboard archives available for Tier_Silver and above</p>
        </div>

        {/* Tabs Section */}
        <div className="topics-section">
          <div className="tab-navigation">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => handleTabSwitch(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="tab-content">
            {activeTab === 'overview' && (
              <>
                <h3>📋 Subject Overview</h3>
                <p>{subject.longDescription || subject.description}</p>
                <div className="overview-details">
                  <p><strong>📚 Subject:</strong> {subject.name}</p>
                  <p><strong>🎯 Tier:</strong> {getCohortTier()}</p>
                  <p><strong>🌍 Region:</strong> {getRegion()}</p>
                  <p><strong>☁️ AWS Hub:</strong> {getAWSRegion()}</p>
                  <p><strong>📖 Topics:</strong> {subject.topics?.length || 0}</p>
                  <p><strong>📄 Resources:</strong> {subject.resources?.length || 0}</p>
                </div>
              </>
            )}

            {activeTab === 'topics' && (
              <>
                <h3>📚 Topics Covered</h3>
                <div className="topics-grid">
                  {subject.topics?.map((topic) => (
                    <div key={topic.id} className="topic-card">
                      <h4>{topic.name}</h4>
                      <p>{topic.description}</p>
                      <div className="subtopics">
                        <span className="subtopic-tag">📖 Study</span>
                        <span className="subtopic-tag">✏️ Practice</span>
                        <span className="subtopic-tag">🎯 Master</span>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {activeTab === 'schedule' && (
              <>
                <h3>🕐 Learning Schedule</h3>
                <div className="schedule-info">
                  <div className="schedule-item">
                    <h4>🌏 Asia-Pacific Window</h4>
                    <p><strong>Time:</strong> 08:00 – 15:00 SAST</p>
                    <p><strong>Tutor:</strong> 🇿🇦 Tutor A (Tier 1)</p>
                    <p><strong>Hubs:</strong> Sydney, Tokyo</p>
                  </div>
                  <div className="schedule-item">
                    <h4>🌏 South Asian / Indian Corridor</h4>
                    <p><strong>Time:</strong> 12:00 – 19:30 SAST</p>
                    <p><strong>Tutor:</strong> 🇿🇦 Tutor B (Tier 2)</p>
                    <p><strong>Hubs:</strong> Singapore, Mumbai</p>
                  </div>
                  <div className="schedule-item">
                    <h4>🌍 Africa / Europe Core</h4>
                    <p><strong>Time:</strong> 16:00 – 23:00 SAST</p>
                    <p><strong>Tutor:</strong> 🇿🇦 Tutor C (Tier 3)</p>
                    <p><strong>Hubs:</strong> Cape Town, Ireland</p>
                  </div>
                  <div className="schedule-item">
                    <h4>🌎 Pan-American Axis</h4>
                    <p><strong>Time:</strong> 21:00 – 04:00 SAST</p>
                    <p><strong>Tutor:</strong> 🇿🇦 Tutor D (Tier 3)</p>
                    <p><strong>Hubs:</strong> São Paulo, N. Virginia, Oregon</p>
                  </div>
                </div>
              </>
            )}

            {activeTab === 'resources' && (
              <>
                <h3>📄 Learning Resources</h3>
                <div className="resources-grid">
                  {subject.resources && subject.resources.length > 0 ? (
                    subject.resources.map((resource) => (
                      <div 
                        key={resource.id} 
                        className="resource-card"
                        onClick={() => handleResourceClick(resource)}
                        style={{ cursor: 'pointer' }}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            handleResourceClick(resource);
                          }
                        }}
                      >
                        <div className="resource-icon">
                          {resource.type === 'guide' && '📖'}
                          {resource.type === 'practice' && '✏️'}
                          {resource.type === 'video' && '🎬'}
                          {resource.type === 'interactive' && '🎮'}
                          {!resource.type && '📄'}
                        </div>
                        <div className="resource-info">
                          <h4>{resource.name}</h4>
                          <span className="resource-type">{resource.type || 'Resource'}</span>
                        </div>
                        <span className="resource-link">View →</span>
                      </div>
                    ))
                  ) : (
                    <div className="no-resources">
                      <span>📚</span>
                      <p>No resources available for this subject yet.</p>
                      <p className="no-resources-sub">Resources will be added soon.</p>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubjectDetail;