// src/pages/ParentDashboard.js
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';
import { API_BASE_URL } from '../services/api';
import {
  Users, Calendar, Clock, BookOpen, TrendingUp, CheckCircle, AlertCircle,
  MessageSquare, ChevronDown, FileText, Video, Camera, LogOut, Upload, Trash2, X
} from 'lucide-react';
import RatingStars from '../components/RatingStars';
import './ParentDashboard.css';
import './Tutors.css';

// ============================================
// TUTOR HELPERS
// ============================================
const getInitials = (name) => {
  if (!name) return 'T';
  const words = name
    .replace(/\./g, '')
    .split(' ')
    .filter((w) => w && !['Mr', 'Ms', 'Mrs', 'Dr', 'Prof'].includes(w));
  const list = words.length ? words : name.split(' ');
  return ((list[0]?.[0] || '') + (list.length > 1 ? list[list.length - 1][0] : '')).toUpperCase() || 'T';
};

const isImageSrc = (src) =>
  !!src && (src.startsWith('data:image') || src.startsWith('http://') || src.startsWith('https://'));

const getTierNumber = (tier) => {
  const m = String(tier || '').match(/\d/);
  return m ? m[0] : null;
};

const getTierLabel = (tier) => {
  if (!tier) return '';
  const n = getTierNumber(tier);
  return n ? `Tier ${n}` : String(tier).replace(/_/g, ' ');
};

const SHIFT_LABELS = {
  APAC: 'APAC',
  SOUTH_ASIA: 'South Asia',
  AFRICA_EUROPE: 'Africa & Europe',
  AMERICAS: 'Americas'
};

const getRatingValue = (tutor) => {
  if (!tutor) return 0;
  const raw = tutor.rating_avg ?? tutor.ratingAvg ?? tutor.tutor_rating ?? tutor.avg_rating ?? 0;
  const n = Number(raw);
  return isNaN(n) ? 0 : n;
};

const getRatingCount = (tutor) => {
  if (!tutor) return 0;
  const raw = tutor.rating_count ?? tutor.ratingCount ?? tutor.tutor_rating_count ?? 0;
  const n = Number(raw);
  return isNaN(n) ? 0 : n;
};

const TutorAvatar = ({ tutor }) => {
  const [failed, setFailed] = useState(false);
  if (isImageSrc(tutor.avatar) && !failed) {
    return (
      <img
        src={tutor.avatar}
        alt={tutor.name}
        className="tutor-avatar-img"
        loading="lazy"
        onError={() => setFailed(true)}
      />
    );
  }
  return <span className="tutor-avatar-initials">{getInitials(tutor.name)}</span>;
};

// ============================================
// ATTENDANCE / OUTCOME HELPERS
// ============================================
const deriveOutcome = (session) => {
  const raw = (session.status || '').toLowerCase();

  if (raw === 'cancelled' || raw === 'canceled') {
    if (session.cancelled_by === 'tutor') return 'cancelled-tutor';
    if (session.cancelled_by === 'parent' || session.cancelled_by === 'student') return 'cancelled-parent';
    return 'cancelled-parent';
  }
  if (raw === 'rescheduled') return 'rescheduled';
  if (raw === 'completed' || raw === 'ended') {
    if (session.attendance === 'missed') {
      return session.missed_by === 'tutor' ? 'missed-tutor' : 'missed-student';
    }
    if (session.attendance === 'late') return 'late';
    return 'attended';
  }
  if (raw === 'ongoing' || raw === 'active') return 'ongoing';
  
  return 'upcoming';
};

const OUTCOME_META = {
  attended:          { label: 'Attended',            tone: 'success', icon: '✅' },
  late:              { label: 'Attended (late)',     tone: 'warn',    icon: '⏰' },
  'missed-student':  { label: 'Missed · Student',    tone: 'danger',  icon: '❌' },
  'missed-tutor':    { label: 'Missed · Tutor',      tone: 'danger',  icon: '🚫' },
  'cancelled-parent':{ label: 'Cancelled · You',     tone: 'muted',   icon: '🔁' },
  'cancelled-tutor': { label: 'Cancelled · Tutor',   tone: 'muted',   icon: '🔁' },
  rescheduled:       { label: 'Rescheduled',         tone: 'warn',    icon: '🕓' },
  upcoming:          { label: 'Upcoming',            tone: 'info',    icon: '📅' },
  ongoing:           { label: 'In progress',         tone: 'info',    icon: '🟢' }
};

const isPastOutcome = (o) =>
  ['attended', 'late', 'missed-student', 'missed-tutor', 'rescheduled'].includes(o);
const isCancelledOutcome = (o) =>
  ['cancelled-parent', 'cancelled-tutor'].includes(o);
const isUpcomingOutcome = (o) => ['upcoming', 'ongoing'].includes(o);

const AttendanceBadge = ({ outcome }) => {
  const meta = OUTCOME_META[outcome] || OUTCOME_META.upcoming;
  return (
    <span className={`attendance-badge tone-${meta.tone}`}>
      <span className="attendance-badge-icon">{meta.icon}</span>
      {meta.label}
    </span>
  );
};

// ============================================
// PARENT DASHBOARD
// ============================================
const ParentDashboard = () => {
  const navigate = useNavigate();
  const [parent, setParent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tagline, setTagline] = useState('Welcome back');

  // Avatar
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [photoError, setPhotoError] = useState('');
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [showViewPhotoModal, setShowViewPhotoModal] = useState(false);

  // Children
  const [children, setChildren] = useState([]);
  const [activeChildId, setActiveChildId] = useState(null);
  const [showChildDropdown, setShowChildDropdown] = useState(false);

  // Unlink Child
  const [childToRemove, setChildToRemove] = useState(null);
  const [unlinkLoading, setUnlinkLoading] = useState(false);

  // Sessions
  const [sessions, setSessions] = useState([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [sessionTab, setSessionTab] = useState('upcoming');
  const [outcomeFilter, setOutcomeFilter] = useState('all');

  // Link child
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [studentEmail, setStudentEmail] = useState('');
  const [linkError, setLinkError] = useState('');
  const [linkSuccess, setLinkSuccess] = useState('');
  const [linkLoading, setLinkLoading] = useState(false);

  // Report Modal
  const [showReportModal, setShowReportModal] = useState(false);

  // Tutor modal
  const [viewingTutor, setViewingTutor] = useState(null);
  const [showTutorModal, setShowTutorModal] = useState(false);
  const [showFullProfile, setShowFullProfile] = useState(false);

  const activeChild = children.find(c => c.id === activeChildId) || children[0];

  useEffect(() => {
    const initDashboard = async () => {
      try {
        const user = await authService.getCurrentUser();
        if (!user) {
          navigate('/parent-login');
          return;
        }
        setParent(user);
        if (user.avatar) setAvatarUrl(user.avatar);

        try {
          const token = localStorage.getItem('accessToken');
          const res = await fetch(`${API_BASE_URL}/app-messages/parent`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (res.ok) {
            const data = await res.json();
            const messagesArray = Array.isArray(data) ? data : (data.messages || data.data || []);
            if (messagesArray.length > 0) {
              const randomIndex = Math.floor(Math.random() * messagesArray.length);
              const randomMessage = messagesArray[randomIndex];
              setTagline(randomMessage.message || randomMessage.content || randomMessage);
            } else {
              setTagline(`Welcome back, ${user.name?.split(' ')[0] || 'Parent'}`);
            }
          }
        } catch (err) {
          setTagline(`Welcome back, ${user.name?.split(' ')[0] || 'Parent'}`);
        }

        await fetchLinkedChildren();
      } catch (error) {
        navigate('/parent-login');
      } finally {
        setLoading(false);
      }
    };

    initDashboard();
  }, [navigate]);

  useEffect(() => {
    if (activeChildId) {
      fetchSessions(activeChildId);
    }
  }, [activeChildId]);

  const fetchLinkedChildren = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch(`${API_BASE_URL}/auth/parent/children`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.children && data.children.length > 0) {
          setChildren(data.children);
          setActiveChildId(data.children[0].id);
        }
      }
    } catch (err) {
      console.error('Failed to fetch linked children:', err);
    }
  };

  const fetchSessions = async (studentId) => {
    if (!studentId) {
      setSessions([]);
      return;
    }
    setSessionsLoading(true);
    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch(`${API_BASE_URL}/auth/parent/children/${studentId}/sessions`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        const list = data.sessions || [];
        const now = new Date();

        const enriched = list.map((s) => {
          const start = s.date ? new Date(s.date) : null;
          let status = (s.status || 'upcoming').toLowerCase();
          
          if (status !== 'cancelled' && status !== 'completed' && status !== 'ended') {
            if (start && !isNaN(start.getTime())) {
              if (now < start) {
                status = 'upcoming';
              } else {
                status = 'completed';
              }
            }
          }

          if (status === 'ended') status = 'completed';
          
          return { ...s, status };
        });
        
        setSessions(enriched);
      } else {
        setSessions([]);
      }
    } catch (err) {
      console.error('Failed to fetch sessions:', err);
      setSessions([]);
    } finally {
      setSessionsLoading(false);
    }
  };

  const handleSignOut = () => {
    authService.logout();
    navigate('/parent-login');
  };

  const handleTutorNameClick = (tutor) => {
    if (!tutor) return;
    setViewingTutor(tutor);
    setShowTutorModal(true);
    setShowFullProfile(false);
  };

  const handleCloseTutorModal = () => {
    setShowTutorModal(false);
    setViewingTutor(null);
    setShowFullProfile(false);
  };

  // ============ PHOTO HANDLERS ============
  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setPhotoError('❌ Please upload an image file (JPG, PNG, WEBP)');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setPhotoError('❌ Image must be under 5MB');
      return;
    }
    setPhotoUploading(true);
    setPhotoError('');
    setShowPhotoModal(false);
    try {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = async () => {
        const base64Image = reader.result;
        const token = localStorage.getItem('accessToken');
        const response = await fetch(`${API_BASE_URL}/auth/profile`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ avatar: base64Image })
        });
        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            setAvatarUrl(base64Image);
            const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
            storedUser.avatar = base64Image;
            localStorage.setItem('user', JSON.stringify(storedUser));
          }
        } else {
          const errorData = await response.json();
          setPhotoError(errorData.error || '❌ Failed to upload photo');
        }
        setPhotoUploading(false);
      };
    } catch (error) {
      console.error('❌ Photo upload error:', error);
      setPhotoError('❌ Error uploading photo');
      setPhotoUploading(false);
    }
  };

  const handleRemovePhoto = async () => {
    if (!window.confirm('Are you sure you want to remove your profile photo?')) return;
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`${API_BASE_URL}/auth/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ avatar: null })
      });
      if (response.ok) {
        setAvatarUrl(null);
        const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
        storedUser.avatar = null;
        localStorage.setItem('user', JSON.stringify(storedUser));
        setShowPhotoModal(false);
      }
    } catch (error) {
      console.error('❌ Remove photo error:', error);
    }
  };

  const triggerFileInput = () => fileInputRef.current?.click();
  const triggerCameraInput = () => cameraInputRef.current?.click();

  const handleLinkChild = async (e) => {
    e.preventDefault();
    setLinkError('');
    setLinkSuccess('');
    setLinkLoading(true);
    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch(`${API_BASE_URL}/auth/parent/link-child`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ studentEmail })
      });
      const data = await res.json();
      if (res.ok) {
        setLinkSuccess('Child linked successfully!');
        await fetchLinkedChildren();
        setTimeout(() => {
          setShowLinkModal(false);
          setLinkSuccess('');
          setStudentEmail('');
        }, 1500);
      } else {
        setLinkError(data.error);
      }
    } catch (err) {
      setLinkError('An error occurred. Please try again.');
    } finally {
      setLinkLoading(false);
    }
  };

  // ✅ Unlink child handler
  const handleUnlinkChild = async () => {
    if (!childToRemove) return;
    setUnlinkLoading(true);

    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch(`${API_BASE_URL}/auth/parent/children/${childToRemove.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.ok) {
        const updatedChildren = children.filter(c => c.id !== childToRemove.id);
        setChildren(updatedChildren);
        
        if (activeChildId === childToRemove.id) {
          setActiveChildId(updatedChildren.length > 0 ? updatedChildren[0].id : null);
        }
        
        setChildToRemove(null);
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to unlink child');
      }
    } catch (err) {
      alert('An error occurred while unlinking');
    } finally {
      setUnlinkLoading(false);
    }
  };

  const getAvatarInitial = (name) => name ? name.charAt(0).toUpperCase() : 'S';

  // ============ SESSION SPLITTING ============
  const decoratedSessions = sessions.map((s) => ({ ...s, outcome: deriveOutcome(s) }));

  const upcomingList = decoratedSessions
    .filter((s) => isUpcomingOutcome(s.outcome))
    .sort((a, b) => (a.date || 0) - (b.date || 0));

  const pastList = decoratedSessions
    .filter((s) => isPastOutcome(s.outcome));

  const cancelledList = decoratedSessions
    .filter((s) => isCancelledOutcome(s.outcome));

  const allList = decoratedSessions;

  const filterPastByOutcome = (list) => {
    if (outcomeFilter === 'all') return list;
    if (outcomeFilter === 'attended') return list.filter(s => s.outcome === 'attended');
    if (outcomeFilter === 'late') return list.filter(s => s.outcome === 'late');
    if (outcomeFilter === 'missed')
      return list.filter(s => s.outcome === 'missed-student' || s.outcome === 'missed-tutor');
    if (outcomeFilter === 'rescheduled') return list.filter(s => s.outcome === 'rescheduled');
    return list;
  };

  const computeAttendanceRate = () => {
    const counted = pastList.filter((s) =>
      ['attended', 'late', 'missed-student', 'missed-tutor'].includes(s.outcome)
    );
    if (counted.length === 0) return activeChild?.attendance || 'N/A';
    const attended = counted.filter((s) => s.outcome === 'attended' || s.outcome === 'late').length;
    return `${Math.round((attended / counted.length) * 100)}%`;
  };

  const getTabs = () => ([
    { key: 'upcoming', label: 'Upcoming', count: upcomingList.length },
    { key: 'past', label: 'Past', count: pastList.length },
    { key: 'cancelled', label: 'Cancelled', count: cancelledList.length },
    { key: 'all', label: 'All', count: decoratedSessions.length }
  ]);

  const currentList = (() => {
    if (sessionTab === 'upcoming') return upcomingList;
    if (sessionTab === 'past') return filterPastByOutcome(pastList);
    if (sessionTab === 'cancelled') return cancelledList;
    return allList;
  })();

  const renderEmptyTab = () => {
    const copy = {
      upcoming:  { title: 'No upcoming sessions',  sub: 'Book a session to get started' },
      past:      { title: 'No past sessions yet',  sub: 'Completed sessions will appear here' },
      cancelled: { title: 'No cancelled sessions', sub: 'Good news — nothing to worry about' },
      all:       { title: 'No sessions yet',       sub: 'Book a session to get started' }
    }[sessionTab];
    return (
      <div className="sessions-empty">
        <Calendar size={40} className="sessions-empty-icon" />
        <p className="sessions-empty-title">{copy.title}</p>
        <p className="sessions-empty-sub">{copy.sub}</p>
      </div>
    );
  };

  const sessionsCardTitle = activeChild?.name
    ? `${activeChild.name}'s Sessions`
    : 'Sessions';

  if (loading) {
    return (
      <div className="parent-dashboard-loading">
        <div className="loading-spinner"></div>
        <p>Loading your dashboard...</p>
      </div>
    );
  }

  return (
    <div className="parent-dashboard">
      {/* Header */}
      <div className="parent-dashboard-header">
        <div className="parent-header-content">
          <div className="parent-profile-group">
            <div
              className="parent-avatar-container"
              onClick={() => setShowPhotoModal(true)}
              title="Manage Profile Photo"
            >
              {photoUploading ? (
                <div className="avatar-loading-spinner"></div>
              ) : avatarUrl ? (
                <img src={avatarUrl} alt="Parent" className="parent-avatar-img" />
              ) : (
                <div className="parent-avatar-initial">
                  {parent?.name?.charAt(0).toUpperCase() || 'P'}
                </div>
              )}
              {!photoUploading && (
                <div className="avatar-edit-overlay">
                  <Camera size={16} />
                </div>
              )}
            </div>
            <div className="parent-text-info">
              <h1>{parent?.name || 'Parent Portal'}</h1>
              <p>{tagline}</p>
            </div>
          </div>
          <div className="parent-header-actions">
            <button className="btn-sign-out" onClick={handleSignOut}>
              <LogOut size={18} />
              Sign Out
            </button>
          </div>
        </div>
      </div>

      {photoError && (
        <div className="profile-error" style={{ margin: '0 auto 20px', maxWidth: '1200px', padding: '0 32px' }}>
          {photoError}
        </div>
      )}

      {/* Child Selector */}
      <div className="child-selector-section">
        <div className="child-selector-header">
          <div className="child-selector-title-group">
            <h2>Managing Child:</h2>
            {children.length > 0 ? (
              <div className="child-dropdown-wrapper">
                <button
                  className="child-dropdown-btn"
                  onClick={() => setShowChildDropdown(!showChildDropdown)}
                >
                  <div className="child-btn-avatar">
                    {activeChild?.avatar ? (
                      <img src={activeChild.avatar} alt={activeChild.name} />
                    ) : (
                      getAvatarInitial(activeChild?.name || '')
                    )}
                  </div>
                  <div className="child-btn-info">
                    <span className="child-btn-name">{activeChild?.name || 'N/A'}</span>
                    <span className="child-btn-grade">{activeChild?.grade || 'N/A'}</span>
                  </div>
                  <ChevronDown size={18} className={`dropdown-icon ${showChildDropdown ? 'open' : ''}`} />
                </button>

                {showChildDropdown && (
                  <div className="child-dropdown-menu">
                    {children.map(child => (
                      <div
                        key={child.id}
                        className={`child-dropdown-item ${child.id === activeChildId ? 'active' : ''}`}
                        onClick={() => {
                          setActiveChildId(child.id);
                          setShowChildDropdown(false);
                          setSessionTab('upcoming');
                          setOutcomeFilter('all');
                        }}
                      >
                        <div className="child-btn-avatar small">
                          {child.avatar ? (
                            <img src={child.avatar} alt={child.name} />
                          ) : (
                            getAvatarInitial(child.name)
                          )}
                        </div>
                        <div className="child-item-details">
                          <span className="child-item-name">{child.name}</span>
                          <span className="child-item-grade">{child.grade}</span>
                        </div>
                        
                        {child.id === activeChildId && <CheckCircle size={16} className="check-icon" />}
                        
                        {/* ✅ Unlink Child Button */}
                        <button 
                          className="btn-unlink-child"
                          title="Unlink this child"
                          onClick={(e) => {
                            e.stopPropagation();
                            setChildToRemove(child);
                            setShowChildDropdown(false);
                          }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                    <div className="child-dropdown-footer">
                      <button className="btn-add-child" onClick={() => setShowLinkModal(true)}>
                        + Link Another Child
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <button className="btn-primary" style={{ padding: '10px 20px', fontSize: '14px' }} onClick={() => setShowLinkModal(true)}>
                + Link a Child
              </button>
            )}
          </div>
        </div>

        {activeChild && (
          <div className="child-quick-stats">
            <div className="child-stat-card">
              <div className="stat-icon-wrapper bg-blue"><TrendingUp size={24} className="text-blue" /></div>
              <div className="stat-info">
                <span className="stat-value">{activeChild.average || 'N/A'}</span>
                <span className="stat-label">Current Average</span>
              </div>
            </div>
            <div className="child-stat-card">
              <div className="stat-icon-wrapper bg-green"><CheckCircle size={24} className="text-green" /></div>
              <div className="stat-info">
                <span className="stat-value">{computeAttendanceRate()}</span>
                <span className="stat-label">Attendance Rate</span>
              </div>
            </div>
            <div className="child-stat-card">
              <div className="stat-icon-wrapper bg-purple"><Calendar size={24} className="text-purple" /></div>
              <div className="stat-info">
                <span className="stat-value">{activeChild.nextSession || 'N/A'}</span>
                <span className="stat-label">Next Session</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Main Grid */}
      {activeChild ? (
        <div className="parent-content-grid">
          <div className="parent-main-column">
            <div className="dashboard-card">
              <div className="card-header sessions-card-header">
                <div className="card-title">
                  <Calendar size={20} className="text-indigo" />
                  <h3>{sessionsCardTitle}</h3>
                </div>
                <button className="btn-link" onClick={() => navigate('/my-sessions')}>View All</button>
              </div>

              <div className="sessions-tabs" role="tablist">
                {getTabs().map((tab) => (
                  <button
                    key={tab.key}
                    role="tab"
                    aria-selected={sessionTab === tab.key}
                    className={`sessions-tab ${sessionTab === tab.key ? 'active' : ''}`}
                    onClick={() => {
                      setSessionTab(tab.key);
                      if (tab.key !== 'past') setOutcomeFilter('all');
                    }}
                  >
                    {tab.label}
                    <span className="sessions-tab-count">{tab.count}</span>
                  </button>
                ))}
              </div>

              {sessionTab === 'past' && pastList.length > 0 && (
                <div className="sessions-outcome-filter">
                  <span className="outcome-filter-label">Outcome:</span>
                  {[
                    { key: 'all', label: 'All' },
                    { key: 'attended', label: 'Attended' },
                    { key: 'late', label: 'Late' },
                    { key: 'missed', label: 'Missed' },
                    { key: 'rescheduled', label: 'Rescheduled' }
                  ].map((f) => (
                    <button
                      key={f.key}
                      className={`outcome-chip ${outcomeFilter === f.key ? 'active' : ''}`}
                      onClick={() => setOutcomeFilter(f.key)}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              )}

              <div className="card-body sessions-card-body">
                {sessionsLoading ? (
                  <div className="sessions-empty"><p>Loading sessions...</p></div>
                ) : currentList.length === 0 ? (
                  renderEmptyTab()
                ) : (
                  <div className="schedule-list">
                    {currentList.map((session) => (
                      <div key={session.id} className="schedule-item">
                        <div className="schedule-date">
                          <span className="day">{session.day || '--'}</span>
                          <span className="month">{session.month || '---'}</span>
                          <span className="year">
                            {session.date 
                              ? new Date(session.date).getFullYear() 
                              : new Date().getFullYear()}
                          </span>
                        </div>
                        <div className="schedule-details">
                          <div className="schedule-topic-row">
                            <h4>{session.topic || 'Tutoring Session'}</h4>
                            <AttendanceBadge outcome={session.outcome} />
                          </div>
                          <span
                            className="tutor-name-link"
                            role="button"
                            tabIndex={0}
                            onClick={() => handleTutorNameClick(session.tutorData)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                handleTutorNameClick(session.tutorData);
                              }
                            }}
                          >
                            With {session.tutorName || session.tutor?.name || 'Tutor'}
                          </span>
                          
                          <div className="schedule-time">
                            <Clock size={14} /> {session.timeRange || 'TBD'}
                          </div>
                          
                          {session.tutorNote && (
                            <p className="session-note">💬 {session.tutorNote}</p>
                          )}
                        </div>
                        <div className="schedule-actions">
                          <button className="btn-icon" title="Message Tutor">
                            <MessageSquare size={16} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <button className="btn-primary w-full mt-4" onClick={() => navigate('/tutors')}>
                  <Calendar size={16} /> Book New Session
                </button>
              </div>
            </div>

            <div className="dashboard-card">
              <div className="card-header">
                <div className="card-title">
                  <FileText size={20} className="text-yellow" />
                  <h3>Recent Academic Reports</h3>
                </div>
              </div>
              <div className="card-body">
                {activeChild.recentReport ? (
                  <div className="report-item">
                    <div className="report-icon"><BookOpen size={20} /></div>
                    <div className="report-details">
                      <h4>{activeChild.recentReport}</h4>
                      <p>Issued recently</p>
                    </div>
                    <div className="report-grade">
                      <span className="grade-badge">{activeChild.recentReportGrade || 'N/A'}</span>
                      <button 
                        className="btn-link-sm" 
                        onClick={() => setShowReportModal(true)}
                      >
                        View
                      </button>
                    </div>
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: '30px 20px', color: '#94a3b8' }}>
                    <FileText size={40} style={{ margin: '0 auto 12px', color: '#4f46e5' }} />
                    <p style={{ margin: 0, fontSize: '14px' }}>No reports yet</p>
                    <p style={{ margin: '4px 0 0', fontSize: '12px', opacity: 0.7 }}>Reports will appear here after the first term assessment.</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="parent-side-column">
            <div className="dashboard-card">
              <div className="card-header">
                <div className="card-title">
                  <TrendingUp size={20} className="text-green" />
                  <h3>Learning Insights</h3>
                </div>
              </div>
              <div className="card-body">
                <div className="insight-box success">
                  <CheckCircle size={18} className="insight-icon" />
                  <div>
                    <h4>Strong Progress in Algebra</h4>
                    <p>Performance increased by 12% this month.</p>
                  </div>
                </div>
                <div className="insight-box warning">
                  <AlertCircle size={18} className="insight-icon" />
                  <div>
                    <h4>Needs Focus on Geometry</h4>
                    <p>Average dropped slightly. Consider an extra session.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="dashboard-card">
              <div className="card-header">
                <div className="card-title">
                  <Users size={20} className="text-blue" />
                  <h3>Parent Actions</h3>
                </div>
              </div>
              <div className="card-body action-buttons">
                <button className="btn-action"><MessageSquare size={18} /> Message Tutor</button>
                <button className="btn-action"><FileText size={18} /> Update Billing Details</button>
                <button className="btn-action"><Video size={18} /> View Session Recordings</button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: '#94a3b8' }}>
          <Users size={64} style={{ margin: '0 auto 20px', color: '#4f46e5' }} />
          <h3 style={{ fontSize: '20px', color: '#ffffff', marginBottom: '8px' }}>No Children Linked Yet</h3>
          <p>Link your child's student account to start monitoring their progress.</p>
        </div>
      )}

      {/* Report Modal */}
      {showReportModal && activeChild?.recentReport && (
        <div className="modal-overlay" onClick={() => setShowReportModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Academic Report</h3>
              <button onClick={() => setShowReportModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div style={{ marginBottom: '20px' }}>
                <h4 style={{ fontSize: '18px', margin: '0 0 4px 0' }}>{activeChild.recentReport}</h4>
                <p style={{ fontSize: '13px', color: '#94a3b8', margin: 0 }}>Issued recently</p>
              </div>
              
              <div style={{ display: 'flex', gap: '16px', marginBottom: '20px' }}>
                <div style={{ flex: 1, background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <span style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '4px' }}>Final Grade</span>
                  <span style={{ fontSize: '24px', fontWeight: '700', color: '#34d399' }}>{activeChild.recentReportGrade || 'N/A'}</span>
                </div>
                <div style={{ flex: 1, background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <span style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '4px' }}>Attendance</span>
                  <span style={{ fontSize: '24px', fontWeight: '700', color: '#60a5fa' }}>{activeChild.attendance || 'N/A'}</span>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#e2e8f0', marginBottom: '8px' }}>Tutor Feedback</label>
                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', fontSize: '14px', color: '#cbd5e1', lineHeight: '1.6' }}>
                  "{activeChild.recentReportFeedback || 'Great effort this term!'}"
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-primary" onClick={() => setShowReportModal(false)}>Close Report</button>
            </div>
          </div>
        </div>
      )}

      {/* Link Child Modal */}
      {showLinkModal && (
        <div className="modal-overlay" onClick={() => setShowLinkModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Link a Student</h3>
              <button onClick={() => setShowLinkModal(false)}>✕</button>
            </div>
            <form onSubmit={handleLinkChild}>
              <div className="modal-body">
                <p>Enter the email address of your child's EduSpantech student account.</p>
                {linkError && <div className="error-msg">{linkError}</div>}
                {linkSuccess && <div className="success-msg">{linkSuccess}</div>}
                <label>Student Email</label>
                <input
                  type="email"
                  value={studentEmail}
                  onChange={e => setStudentEmail(e.target.value)}
                  placeholder="student@example.com"
                  required
                />
              </div>
              <div className="modal-footer">
                <button type="button" onClick={() => setShowLinkModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={linkLoading}>
                  {linkLoading ? 'Linking...' : 'Link Child'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Unlink Child Modal */}
      {childToRemove && (
        <div className="modal-overlay" onClick={() => setChildToRemove(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Unlink Child</h3>
              <button onClick={() => setChildToRemove(null)}>✕</button>
            </div>
            <div className="modal-body">
              <div style={{ textAlign: 'center', marginBottom: '20px', color: '#f87171' }}>
                <AlertCircle size={48} style={{ margin: '0 auto 12px' }} />
                <h4 style={{ fontSize: '18px', color: '#fff', margin: '0 0 8px' }}>Are you sure?</h4>
                <p style={{ margin: 0 }}>
                  You are about to unlink <strong>{childToRemove.name}</strong>.
                  You will no longer be able to view their sessions or academic reports.
                </p>
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" onClick={() => setChildToRemove(null)}>Cancel</button>
              <button 
                type="button" 
                className="btn-danger" 
                onClick={handleUnlinkChild}
                disabled={unlinkLoading}
              >
                {unlinkLoading ? 'Unlinking...' : 'Yes, Unlink Child'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Photo Modal */}
      {showPhotoModal && (
        <div className="modal-overlay" onClick={() => setShowPhotoModal(false)}>
          <div className="modal-content photo-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Profile Photo</h3>
              <button onClick={() => setShowPhotoModal(false)}>✕</button>
            </div>
            <div className="photo-modal-body">
              <div className="photo-preview-container">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Profile" className="photo-large-view" />
                ) : (
                  <div className="photo-large-initial">
                    {parent?.name?.charAt(0).toUpperCase() || 'P'}
                  </div>
                )}
              </div>
              {photoUploading && (
                <div className="photo-uploading-status">
                  <div className="loading-spinner"></div>
                  <p>Uploading photo...</p>
                </div>
              )}
            </div>
            <div className="photo-modal-actions">
              {avatarUrl ? (
                <>
                  <button className="photo-action-btn view" onClick={() => { setShowPhotoModal(false); setShowViewPhotoModal(true); }}>
                    <EyeIcon /> View Full Photo
                  </button>
                  <button className="photo-action-btn change" onClick={triggerFileInput}>
                    <Upload size={18} /> Change Photo
                  </button>
                  <button className="photo-action-btn remove" onClick={handleRemovePhoto}>
                    <Trash2 size={18} /> Remove Photo
                  </button>
                </>
              ) : (
                <>
                  <button className="photo-action-btn capture" onClick={triggerCameraInput}>
                    <Camera size={18} /> Capture Photo
                  </button>
                  <button className="photo-action-btn upload" onClick={triggerFileInput}>
                    <Upload size={18} /> Upload from Device
                  </button>
                </>
              )}
            </div>
            <input type="file" ref={fileInputRef} onChange={handlePhotoUpload} accept="image/*" style={{ display: 'none' }} />
            <input type="file" ref={cameraInputRef} onChange={handlePhotoUpload} accept="image/*" capture="user" style={{ display: 'none' }} />
          </div>
        </div>
      )}

      {/* View Full Photo Modal */}
      {showViewPhotoModal && (
        <div className="modal-overlay" onClick={() => setShowViewPhotoModal(false)}>
          <div className="view-photo-container" onClick={e => e.stopPropagation()}>
            <button className="view-photo-close" onClick={() => setShowViewPhotoModal(false)}>
              <X size={24} />
            </button>
            {avatarUrl && <img src={avatarUrl} alt="Profile" className="view-photo-full" />}
          </div>
        </div>
      )}

      {/* ============================================
          TUTOR PROFILE MODAL — with ratings & reviews
          ============================================ */}
      {showTutorModal && viewingTutor && (() => {
        const ratingValue = getRatingValue(viewingTutor);
        const ratingCount = getRatingCount(viewingTutor);
        return (
          <div className="tutor-modal-overlay" onClick={handleCloseTutorModal}>
            <div className="tutor-modal" onClick={(e) => e.stopPropagation()}>
              <button className="tutor-modal-close" onClick={handleCloseTutorModal} aria-label="Close">×</button>

              {!showFullProfile ? (
                /* ───── Compact view ───── */
                <div className="tutor-modal-content">
                  <div className="tutor-modal-avatar">
                    <TutorAvatar tutor={viewingTutor} />
                  </div>
                  <h2 className="tutor-modal-name">{viewingTutor.name}</h2>
                  {viewingTutor.tier && (
                    <span className="tutor-modal-tier">{getTierLabel(viewingTutor.tier)}</span>
                  )}

                  {/* ⭐ Rating line */}
                  <div className="tutor-rating-line">
                    {ratingCount > 0 ? (
                      <>
                        <RatingStars value={ratingValue} size={16} showValue />
                        <span className="tutor-rating-count">
                          {ratingCount} review{ratingCount > 1 ? 's' : ''}
                        </span>
                      </>
                    ) : (
                      <span className="tutor-rating-new">⭐ Not yet rated</span>
                    )}
                  </div>

                  {viewingTutor.subjects && viewingTutor.subjects.length > 0 && (
                    <div className="tutor-modal-subjects">
                      {viewingTutor.subjects.map((subject, idx) => (
                        <span key={idx} className="subject-tag">{subject}</span>
                      ))}
                    </div>
                  )}
                  {viewingTutor.bio && (
                    <p className="tutor-modal-bio">{viewingTutor.bio}</p>
                  )}
                  <div className="tutor-modal-actions">
                    <button className="modal-btn secondary" onClick={() => setShowFullProfile(true)}>
                      👤 View Full Profile
                    </button>
                    <button className="modal-btn cancel" onClick={handleCloseTutorModal}>
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                /* ───── Full profile view ───── */
                <div className="tutor-modal-full-profile">
                  <button className="back-btn" onClick={() => setShowFullProfile(false)}>
                    ← Back
                  </button>
                  <div className="full-profile-header">
                    <div className="full-profile-avatar">
                      <TutorAvatar tutor={viewingTutor} />
                    </div>
                    <div className="full-profile-info">
                      <h2>{viewingTutor.name}</h2>
                      {viewingTutor.tier && (
                        <span className="full-profile-tier">{getTierLabel(viewingTutor.tier)}</span>
                      )}
                      {viewingTutor.email && (
                        <p className="full-profile-email">{viewingTutor.email}</p>
                      )}
                    </div>
                  </div>
                  <div className="full-profile-body">
                    {viewingTutor.bio && (
                      <div className="profile-section">
                        <h3>📝 About Me</h3>
                        <p>{viewingTutor.bio}</p>
                      </div>
                    )}
                    {viewingTutor.subjects && viewingTutor.subjects.length > 0 && (
                      <div className="profile-section">
                        <h3>📖 Subjects</h3>
                        <div className="profile-subjects">
                          {viewingTutor.subjects.map((subject, idx) => (
                            <span key={idx} className="subject-tag">{subject}</span>
                          ))}
                        </div>
                      </div>
                    )}
                    {viewingTutor.shiftId && SHIFT_LABELS[viewingTutor.shiftId] && (
                      <div className="profile-section">
                        <h3>⏰ Availability</h3>
                        <p>{SHIFT_LABELS[viewingTutor.shiftId]}</p>
                      </div>
                    )}

                    {/* ⭐ Ratings & Reviews */}
                    <div className="profile-section">
                      <h3>⭐ Ratings & Reviews</h3>

                      {ratingCount > 0 && (
                        <div className="rating-summary">
                          <div className="rating-big">
                            <span className="rating-big-value">{ratingValue.toFixed(1)}</span>
                            <RatingStars value={ratingValue} size={18} />
                            <span className="rating-big-count">
                              {ratingCount} review{ratingCount > 1 ? 's' : ''}
                            </span>
                          </div>

                          {viewingTutor.ratingDistribution && (
                            <div className="rating-distribution">
                              {[5, 4, 3, 2, 1].map((star) => {
                                const count = Number(viewingTutor.ratingDistribution[String(star)]) || 0;
                                const pct = ratingCount ? (count / ratingCount) * 100 : 0;
                                return (
                                  <div key={star} className="dist-row">
                                    <span className="dist-label">{star}★</span>
                                    <div className="dist-bar">
                                      <div className="dist-fill" style={{ width: `${pct}%` }} />
                                    </div>
                                    <span className="dist-count">{count}</span>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      )}

                      {ratingCount === 0 && (
                        <p className="no-reviews">Not yet rated — no reviews have been submitted.</p>
                      )}

                      {(viewingTutor.recentReviews || []).length > 0 && (
                        <div className="recent-reviews">
                          {viewingTutor.recentReviews.slice(0, 3).map((r) => (
                            <div key={r.id} className="review-card">
                              <div className="review-header">
                                <RatingStars value={r.rating} size={13} />
                                <span className="review-author">{r.reviewerLabel || 'Learner'}</span>
                                <span className="review-date">
                                  {r.createdAt
                                    ? new Date(r.createdAt).toLocaleDateString('en-US', {
                                        month: 'short', day: 'numeric', year: 'numeric'
                                      })
                                    : ''}
                                </span>
                              </div>
                              {r.comment && <p className="review-comment">{r.comment}</p>}
                              {r.tutorReply && (
                                <div className="tutor-reply">
                                  <strong>Tutor replied:</strong> {r.tutorReply}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      })()}
    </div>
  );
};

const EyeIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

export default ParentDashboard;