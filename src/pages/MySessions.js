// src/pages/MySessions.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';
import { API_BASE_URL } from '../services/api';
import './MySessions.css';

const MySessions = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showRedirectPopup, setShowRedirectPopup] = useState(false);
  const [selectedSession, setSelectedSession] = useState(null);
  const [expandedSession, setExpandedSession] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');

  // ===== CUSTOM POPUP STATE =====
  const [showCancelPopup, setShowCancelPopup] = useState(false);
  const [showReschedulePopup, setShowReschedulePopup] = useState(false);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [showErrorPopup, setShowErrorPopup] = useState(false);
  const [popupMessage, setPopupMessage] = useState('');
  const [popupTitle, setPopupTitle] = useState('');
  const [popupType, setPopupType] = useState('info');
  const [sessionToCancel, setSessionToCancel] = useState(null);
  const [sessionToReschedule, setSessionToReschedule] = useState(null);
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleDuration, setRescheduleDuration] = useState(60);
  const [rescheduleTopic, setRescheduleTopic] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    const fetchUserAndSessions = async () => {
      try {
        const userData = await authService.getCurrentUser();
        if (userData) {
          setUser(userData);
          await fetchUserSessions();
        } else {
          navigate('/login');
        }
      } catch (err) {
        setError('Failed to load user data');
        navigate('/login');
      } finally {
        setLoading(false);
      }
    };

    fetchUserAndSessions();
  }, [navigate]);

  // ============================================
  // FETCH SESSIONS
  // ============================================
  const fetchUserSessions = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      
      if (!token) {
        console.log('No token found, skipping session fetch');
        setSessions([]);
        return;
      }

      console.log('📡 Fetching sessions from:', `${API_BASE_URL}/sessions`);
      
      const response = await fetch(`${API_BASE_URL}/sessions`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('📡 Response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Sessions data:', data);

        let sessionsList = [];
        if (data.success && data.sessions) {
          sessionsList = data.sessions;
        } else if (Array.isArray(data)) {
          sessionsList = data;
        } else if (data.data && Array.isArray(data.data)) {
          sessionsList = data.data;
        } else if (data.sessions) {
          sessionsList = data.sessions;
        } else {
          sessionsList = [];
        }

        console.log('📋 Sessions list length:', sessionsList.length);

        const enrichedSessions = await Promise.all(
          sessionsList.map(async (session) => {
            let tutor = null;
            
            if (session.tutor_id) {
              try {
                const tutorResponse = await fetch(`${API_BASE_URL}/tutors/${session.tutor_id}`, {
                  headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                  }
                });
                
                if (tutorResponse.ok) {
                  const tutorData = await tutorResponse.json();
                  tutor = tutorData.tutor || tutorData;
                  console.log('✅ Tutor found:', tutor?.name);
                }
              } catch (e) {
                console.error('Failed to fetch tutor details:', e);
              }
            }

            let duration = 60;
            if (session.start_time && session.end_time) {
              const start = new Date(session.start_time);
              const end = new Date(session.end_time);
              duration = Math.round((end - start) / 60000);
            }

            const now = new Date();
            const startTime = new Date(session.start_time);
            const endTime = new Date(session.end_time);
            let status = session.status || 'upcoming';
            
            if (status === 'active' || status === 'upcoming') {
              if (endTime < now) {
                status = 'completed';
              } else if (startTime < now && endTime > now) {
                status = 'ongoing';
              } else {
                status = 'upcoming';
              }
            }

            return {
              id: session.id,
              tutorId: session.tutor_id,
              userId: session.user_id,
              tutor: tutor,
              date: session.start_time,
              start_time: session.start_time,
              end_time: session.end_time,
              duration: duration,
              status: status,
              roomId: session.room_id,
              region: session.region,
              topic: session.topic || 'Tutoring Session',
              notes: session.notes || '',
              meetingLink: session.meeting_link || session.meetingLink || '',
              dateFormatted: formatDate(session.start_time),
              timeFormatted: formatTime(session.start_time),
              durationFormatted: formatDuration(duration)
            };
          })
        );

        setSessions(enrichedSessions);
        console.log('✅ Enriched sessions:', enrichedSessions.length);
      } else {
        const errorData = await response.json();
        console.error('❌ Failed to fetch sessions:', errorData);
        setSessions([]);
      }
    } catch (error) {
      console.error('❌ Failed to fetch sessions:', error);
      setSessions([]);
    }
  };

  // ============================================
  // ✅ RENDER TUTOR AVATAR - SAME AS TUTORS PAGE
  // ============================================
  const renderTutorAvatar = (tutor) => {
    if (!tutor) return '🧑‍🏫';

    const photoUrl = tutor.avatar || tutor.profileImage;
    
    if (photoUrl) {
      return (
        <img 
          src={photoUrl} 
          alt={tutor.name} 
          className="tutor-avatar-img"
          loading="lazy"
          onError={(e) => {
            e.target.style.display = 'none';
            const parent = e.target.parentElement;
            if (parent) {
              const initials = tutor.name
                .split(' ')
                .map(word => word[0])
                .join('')
                .toUpperCase()
                .slice(0, 2);
              
              const colors = ['#1a73e8', '#e91e63', '#ff6f00', '#7b1fa2', '#0d47a1', '#00695c', '#bf360c', '#4a148c', '#1a237e', '#880e4f', '#004d40'];
              const hash = tutor.name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
              const color = colors[hash % colors.length];
              
              const fallbackDiv = document.createElement('div');
              fallbackDiv.className = 'tutor-avatar-default';
              fallbackDiv.style.cssText = `
                width: 48px;
                height: 48px;
                border-radius: 50%;
                background: ${color};
                color: white;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 18px;
                font-weight: bold;
                text-transform: uppercase;
                flex-shrink: 0;
              `;
              fallbackDiv.textContent = initials;
              parent.appendChild(fallbackDiv);
            }
          }}
        />
      );
    }
    
    const initials = tutor.name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
    
    const colors = ['#1a73e8', '#e91e63', '#ff6f00', '#7b1fa2', '#0d47a1', '#00695c', '#bf360c', '#4a148c', '#1a237e', '#880e4f', '#004d40'];
    const hash = tutor.name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const color = colors[hash % colors.length];
    
    return (
      <div 
        className="tutor-avatar-default"
        style={{
          width: '48px',
          height: '48px',
          borderRadius: '50%',
          background: color,
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '18px',
          fontWeight: 'bold',
          textTransform: 'uppercase',
          flexShrink: 0
        }}
      >
        {initials}
      </div>
    );
  };

  // ============================================
  // FORMAT HELPERS
  // ============================================
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatTime = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDuration = (minutes) => {
    if (!minutes) return 'N/A';
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    if (remainingMinutes === 0) return `${hours}h`;
    return `${hours}h ${remainingMinutes}min`;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'upcoming':
        return 'status-upcoming';
      case 'ongoing':
        return 'status-ongoing';
      case 'completed':
        return 'status-completed';
      case 'cancelled':
        return 'status-cancelled';
      default:
        return 'status-upcoming';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'upcoming':
        return 'Upcoming';
      case 'ongoing':
        return 'Ongoing';
      case 'completed':
        return 'Completed';
      case 'cancelled':
        return 'Cancelled';
      default:
        return 'Upcoming';
    }
  };

  // ============================================
  // ✅ CUSTOM POPUP HELPERS
  // ============================================
  const showPopup = (title, message, type = 'info') => {
    setPopupTitle(title);
    setPopupMessage(message);
    setPopupType(type);
    setShowSuccessPopup(true);
  };

  const showErrorPopup = (message) => {
    setPopupTitle('❌ Error');
    setPopupMessage(message);
    setPopupType('error');
    setShowErrorPopup(true);
  };

  // ============================================
  // ✅ CANCEL SESSION WITH CUSTOM POPUP
  // ============================================
  const handleCancelClick = (session) => {
    setSessionToCancel(session);
    setShowCancelPopup(true);
  };

  const confirmCancel = async () => {
    if (!sessionToCancel) return;
    
    setActionLoading(true);
    
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`${API_BASE_URL}/sessions/${sessionToCancel.id}/cancel`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        // Update local state
        setSessions(prev => 
          prev.map(s => 
            s.id === sessionToCancel.id 
              ? { ...s, status: 'cancelled' }
              : s
          )
        );
        
        setShowCancelPopup(false);
        setSessionToCancel(null);
        showPopup('✅ Session Cancelled', 'Your session has been cancelled successfully.', 'success');
        
        // Refresh sessions after a moment
        setTimeout(() => {
          fetchUserSessions();
        }, 1000);
      } else {
        const errorData = await response.json();
        showErrorPopup(errorData.error || 'Failed to cancel session. Please try again.');
      }
    } catch (error) {
      console.error('Error cancelling session:', error);
      showErrorPopup('An error occurred. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  // ============================================
  // ✅ RESCHEDULE SESSION
  // ============================================
  const handleRescheduleClick = (session) => {
    setSessionToReschedule(session);
    setRescheduleDate('');
    setRescheduleDuration(session.duration || 60);
    setRescheduleTopic(session.topic || 'Mathematics');
    setShowReschedulePopup(true);
  };

  const confirmReschedule = async () => {
    if (!sessionToReschedule) return;
    
    if (!rescheduleDate) {
      showErrorPopup('Please select a new date and time.');
      return;
    }

    setActionLoading(true);
    
    try {
      const token = localStorage.getItem('accessToken');
      
      // First cancel the existing session
      const cancelResponse = await fetch(`${API_BASE_URL}/sessions/${sessionToReschedule.id}/cancel`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!cancelResponse.ok) {
        showErrorPopup('Failed to cancel the existing session. Please try again.');
        setActionLoading(false);
        return;
      }

      // Book a new session with the same tutor
      const bookResponse = await fetch(`${API_BASE_URL}/sessions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          tutorId: sessionToReschedule.tutorId,
          date: rescheduleDate,
          duration: rescheduleDuration,
          topic: rescheduleTopic
        })
      });

      const bookData = await bookResponse.json();

      if (bookResponse.ok) {
        setShowReschedulePopup(false);
        setSessionToReschedule(null);
        showPopup('✅ Session Rescheduled', 'Your session has been rescheduled successfully!', 'success');
        
        // Refresh sessions
        setTimeout(() => {
          fetchUserSessions();
        }, 1000);
      } else {
        showErrorPopup(bookData.error || 'Failed to reschedule session. Please try again.');
      }
    } catch (error) {
      console.error('Error rescheduling session:', error);
      showErrorPopup('An error occurred. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  // ============================================
  // HANDLERS
  // ============================================
  const handleSessionClick = (session) => {
    setSelectedSession(session);
    setExpandedSession(expandedSession === session.id ? null : session.id);
  };

  const handleJoinSession = (session) => {
    if (session.meetingLink) {
      window.open(session.meetingLink, '_blank');
    } else {
      navigate(`/session/${session.id}`, { state: { tutor: session.tutor } });
    }
  };

  const handleRedirectToTutors = () => {
    setShowRedirectPopup(true);
  };

  const handleProceed = () => {
    setShowRedirectPopup(false);
    navigate('/tutors');
  };

  const handleCancelPopup = () => {
    setShowRedirectPopup(false);
  };

  const getFilteredSessions = () => {
    if (filterStatus === 'all') return sessions;
    return sessions.filter(s => s.status === filterStatus);
  };

  const filteredSessions = getFilteredSessions();
  const upcomingSessions = sessions.filter(s => s.status === 'upcoming' || s.status === 'ongoing');
  const completedSessions = sessions.filter(s => s.status === 'completed');
  const cancelledSessions = sessions.filter(s => s.status === 'cancelled');

  // ============================================
  // ✅ CUSTOM POPUP COMPONENT
  // ============================================
  const CustomPopup = ({ isOpen, onClose, title, message, type = 'info', onConfirm, confirmText = 'OK', showCancel = false }) => {
    if (!isOpen) return null;

    const getIcon = () => {
      switch (type) {
        case 'success':
          return '✅';
        case 'error':
          return '❌';
        case 'warning':
          return '⚠️';
        default:
          return 'ℹ️';
      }
    };

    const getColor = () => {
      switch (type) {
        case 'success':
          return '#34d399';
        case 'error':
          return '#ef4444';
        case 'warning':
          return '#f59e0b';
        default:
          return '#4f46e5';
      }
    };

    return (
      <div className="popup-overlay" onClick={onClose}>
        <div className="popup-modal" onClick={(e) => e.stopPropagation()}>
          <div className="popup-icon" style={{ color: getColor() }}>{getIcon()}</div>
          <h3 className="popup-title">{title}</h3>
          <p className="popup-message">{message}</p>
          <div className="popup-actions">
            {showCancel && (
              <button className="popup-btn cancel-btn" onClick={onClose}>
                Cancel
              </button>
            )}
            <button className="popup-btn proceed-btn" onClick={onConfirm || onClose} style={{ background: getColor() }}>
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    );
  };

  // ============================================
  // ✅ CANCEL CONFIRMATION POPUP
  // ============================================
  const CancelConfirmationPopup = ({ isOpen, onClose, onConfirm, session, loading }) => {
    if (!isOpen || !session) return null;

    return (
      <div className="popup-overlay" onClick={onClose}>
        <div className="popup-modal" onClick={(e) => e.stopPropagation()}>
          <div className="popup-icon" style={{ color: '#ef4444' }}>⚠️</div>
          <h3 className="popup-title">Cancel Session</h3>
          <p className="popup-message">
            Are you sure you want to cancel your session with <strong>{session.tutor?.name || 'Tutor'}</strong> on <strong>{session.dateFormatted}</strong>?
            <br /><br />
            This action cannot be undone.
          </p>
          <div className="popup-actions">
            <button className="popup-btn cancel-btn" onClick={onClose} disabled={loading}>
              Keep Session
            </button>
            <button className="popup-btn proceed-btn" onClick={onConfirm} disabled={loading} style={{ background: '#ef4444' }}>
              {loading ? 'Cancelling...' : 'Yes, Cancel Session'}
            </button>
          </div>
        </div>
      </div>
    );
  };

  // ============================================
  // ✅ RESCHEDULE POPUP
  // ============================================
  const ReschedulePopup = ({ isOpen, onClose, onConfirm, session, date, setDate, duration, setDuration, topic, setTopic, loading }) => {
    if (!isOpen || !session) return null;

    return (
      <div className="popup-overlay" onClick={onClose}>
        <div className="popup-modal reschedule-modal" onClick={(e) => e.stopPropagation()}>
          <button className="popup-close" onClick={onClose}>×</button>
          <div className="popup-icon" style={{ color: '#4f46e5' }}>🔄</div>
          <h3 className="popup-title">Reschedule Session</h3>
          <p className="popup-message">
            Reschedule your session with <strong>{session.tutor?.name || 'Tutor'}</strong>
          </p>
          
          <div className="reschedule-form">
            <div className="form-group">
              <label>📅 New Date & Time</label>
              <input
                type="datetime-local"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                min={new Date(Date.now() + 3600000).toISOString().slice(0, 16)}
                required
              />
            </div>

            <div className="form-group">
              <label>⏱️ Duration</label>
              <select
                value={duration}
                onChange={(e) => setDuration(parseInt(e.target.value))}
              >
                <option value={30}>30 minutes</option>
                <option value={60}>60 minutes</option>
                <option value={90}>90 minutes</option>
                <option value={120}>120 minutes</option>
              </select>
            </div>

            <div className="form-group">
              <label>📖 Topic</label>
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="Enter topic..."
              />
            </div>
          </div>

          <div className="popup-actions">
            <button className="popup-btn cancel-btn" onClick={onClose} disabled={loading}>
              Cancel
            </button>
            <button className="popup-btn proceed-btn" onClick={onConfirm} disabled={loading || !date} style={{ background: '#4f46e5' }}>
              {loading ? 'Rescheduling...' : 'Confirm Reschedule'}
            </button>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="my-sessions-loading">
        <div className="loading-spinner"></div>
        <p>Loading your sessions...</p>
      </div>
    );
  }

  if (error) {
    return <div className="my-sessions-error">{error}</div>;
  }

  return (
    <div className="my-sessions-wrapper">
      {/* ===== CUSTOM POPUPS ===== */}
      <CustomPopup
        isOpen={showSuccessPopup}
        onClose={() => setShowSuccessPopup(false)}
        title={popupTitle}
        message={popupMessage}
        type={popupType}
        confirmText="OK"
      />

      <CustomPopup
        isOpen={showErrorPopup}
        onClose={() => setShowErrorPopup(false)}
        title={popupTitle}
        message={popupMessage}
        type="error"
        confirmText="Try Again"
      />

      <CancelConfirmationPopup
        isOpen={showCancelPopup}
        onClose={() => {
          setShowCancelPopup(false);
          setSessionToCancel(null);
        }}
        onConfirm={confirmCancel}
        session={sessionToCancel}
        loading={actionLoading}
      />

      <ReschedulePopup
        isOpen={showReschedulePopup}
        onClose={() => {
          setShowReschedulePopup(false);
          setSessionToReschedule(null);
        }}
        onConfirm={confirmReschedule}
        session={sessionToReschedule}
        date={rescheduleDate}
        setDate={setRescheduleDate}
        duration={rescheduleDuration}
        setDuration={setRescheduleDuration}
        topic={rescheduleTopic}
        setTopic={setRescheduleTopic}
        loading={actionLoading}
      />

      {/* Background Effects */}
      <div className="my-sessions-bg">
        <div className="gradient-orb orb-1"></div>
        <div className="gradient-orb orb-2"></div>
        <div className="gradient-orb orb-3"></div>
      </div>

      <div className="my-sessions-container">
        {/* Header Section */}
        <div className="my-sessions-header">
          <div className="header-content">
            <div className="header-left">
              <h1 className="header-title">
                <span className="title-icon">📋</span>
                My Sessions
              </h1>
              <p className="header-subtitle">
                {sessions.length === 0 
                  ? "You haven't booked any sessions yet"
                  : `${sessions.length} session${sessions.length > 1 ? 's' : ''} total`
                }
              </p>
            </div>
            {sessions.length > 0 && (
              <div className="header-right">
                <button 
                  className="book-new-btn"
                  onClick={handleRedirectToTutors}
                >
                  <span className="btn-icon">➕</span>
                  Book New Session
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Stats Summary */}
        {sessions.length > 0 && (
          <div className="sessions-stats">
            <div className="stat-item">
              <span className="stat-number">{upcomingSessions.length}</span>
              <span className="stat-label">📅 Upcoming</span>
            </div>
            <div className="stat-divider"></div>
            <div className="stat-item">
              <span className="stat-number">{completedSessions.length}</span>
              <span className="stat-label">✅ Completed</span>
            </div>
            <div className="stat-divider"></div>
            <div className="stat-item">
              <span className="stat-number">{cancelledSessions.length}</span>
              <span className="stat-label">❌ Cancelled</span>
            </div>
            <div className="stat-divider"></div>
            <div className="stat-item">
              <span className="stat-number">
                {sessions.reduce((acc, s) => acc + (s.duration || 0), 0)}min
              </span>
              <span className="stat-label">⏱️ Total Time</span>
            </div>
          </div>
        )}

        {/* Filter Bar */}
        {sessions.length > 0 && (
          <div className="filter-bar">
            <div className="filter-buttons">
              <button 
                className={`filter-btn ${filterStatus === 'all' ? 'active' : ''}`}
                onClick={() => setFilterStatus('all')}
              >
                All ({sessions.length})
              </button>
              <button 
                className={`filter-btn ${filterStatus === 'upcoming' ? 'active' : ''}`}
                onClick={() => setFilterStatus('upcoming')}
              >
                Upcoming ({upcomingSessions.length})
              </button>
              <button 
                className={`filter-btn ${filterStatus === 'completed' ? 'active' : ''}`}
                onClick={() => setFilterStatus('completed')}
              >
                Completed ({completedSessions.length})
              </button>
              <button 
                className={`filter-btn ${filterStatus === 'cancelled' ? 'active' : ''}`}
                onClick={() => setFilterStatus('cancelled')}
              >
                Cancelled ({cancelledSessions.length})
              </button>
            </div>
          </div>
        )}

        {/* Session List */}
        {sessions.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📅</div>
            <h3>No Sessions Booked Yet</h3>
            <p>
              You haven't booked any tutoring sessions. Browse our expert tutors and 
              schedule your first session today!
            </p>
            <button 
              className="empty-book-btn"
              onClick={handleRedirectToTutors}
            >
              Find a Tutor
            </button>
          </div>
        ) : (
          <div className="sessions-grid">
            {filteredSessions.map((session) => (
              <div 
                key={session.id} 
                className={`session-card ${expandedSession === session.id ? 'expanded' : ''}`}
              >
                <div 
                  className="session-card-header"
                  onClick={() => handleSessionClick(session)}
                >
                  <div className="session-status-badge">
                    <span className={`status-dot ${getStatusColor(session.status)}`}></span>
                    <span className="status-label">{getStatusLabel(session.status)}</span>
                  </div>
                  
                  <div className="session-info">
                    <h3 className="session-title">{session.topic || 'Tutoring Session'}</h3>
                    <div className="session-meta">
                      <span className="session-tutor">
                        <span className="meta-icon">👨‍🏫</span>
                        {session.tutor?.name || 'Tutor'}
                      </span>
                      <span className="session-date">
                        <span className="meta-icon">📅</span>
                        {session.dateFormatted}
                      </span>
                      <span className="session-time">
                        <span className="meta-icon">⏰</span>
                        {session.timeFormatted}
                      </span>
                      <span className="session-duration">
                        <span className="meta-icon">⏱️</span>
                        {session.durationFormatted}
                      </span>
                    </div>
                  </div>

                  <div className="session-actions-preview">
                    {session.status === 'upcoming' && (
                      <button 
                        className="session-action-btn join-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleJoinSession(session);
                        }}
                      >
                        Join
                      </button>
                    )}
                    <button className="expand-btn">
                      {expandedSession === session.id ? '▲' : '▼'}
                    </button>
                  </div>
                </div>

                {/* Expanded Details */}
                {expandedSession === session.id && (
                  <div className="session-details">
                    <div className="details-grid">
                      {/* Tutor Info with Avatar */}
                      <div className="detail-section tutor-info">
                        <h4>👨‍🏫 Tutor Information</h4>
                        <div className="tutor-detail-card">
                          <div className="tutor-avatar">
                            {renderTutorAvatar(session.tutor)}
                          </div>
                          <div className="tutor-detail-info">
                            <span className="tutor-detail-name">{session.tutor?.name || 'Tutor'}</span>
                            <span className="tutor-detail-tier">🏅 {session.tutor?.tier || 'Gold'}</span>
                            {session.tutor?.subjects && (
                              <div className="tutor-detail-subjects">
                                {session.tutor.subjects.map((subject, idx) => (
                                  <span key={idx} className="subject-tag">{subject}</span>
                                ))}
                              </div>
                            )}
                            {session.tutor?.bio && (
                              <p className="tutor-detail-bio">{session.tutor.bio}</p>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Session Details */}
                      <div className="detail-section session-info-detail">
                        <h4>📋 Session Details</h4>
                        <div className="session-detail-items">
                          <div className="detail-item">
                            <span className="detail-label">Topic:</span>
                            <span className="detail-value">{session.topic || 'General Tutoring'}</span>
                          </div>
                          <div className="detail-item">
                            <span className="detail-label">Date:</span>
                            <span className="detail-value">{session.dateFormatted}</span>
                          </div>
                          <div className="detail-item">
                            <span className="detail-label">Time:</span>
                            <span className="detail-value">{session.timeFormatted}</span>
                          </div>
                          <div className="detail-item">
                            <span className="detail-label">Duration:</span>
                            <span className="detail-value">{session.durationFormatted}</span>
                          </div>
                          {session.notes && (
                            <div className="detail-item full-width">
                              <span className="detail-label">Notes:</span>
                              <span className="detail-value">{session.notes}</span>
                            </div>
                          )}
                          {session.meetingLink && (
                            <div className="detail-item full-width">
                              <span className="detail-label">Meeting Link:</span>
                              <span className="detail-value link-value">{session.meetingLink}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="session-actions">
                      {session.status === 'upcoming' && (
                        <>
                          <button 
                            className="action-btn join-btn"
                            onClick={() => handleJoinSession(session)}
                          >
                            <span className="btn-icon">▶️</span>
                            Join Session
                          </button>
                          <button 
                            className="action-btn reschedule-btn"
                            onClick={() => handleRescheduleClick(session)}
                          >
                            <span className="btn-icon">🔄</span>
                            Reschedule
                          </button>
                          <button 
                            className="action-btn cancel-btn"
                            onClick={() => handleCancelClick(session)}
                          >
                            <span className="btn-icon">❌</span>
                            Cancel
                          </button>
                        </>
                      )}
                      {session.status === 'completed' && (
                        <button 
                          className="action-btn review-btn"
                          onClick={() => navigate(`/session/${session.id}/review`)}
                        >
                          <span className="btn-icon">⭐</span>
                          Review Session
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Quick Stats Summary */}
        {sessions.length > 0 && (
          <div className="quick-stats">
            <div className="quick-stat-card">
              <span className="quick-stat-icon">⭐</span>
              <div className="quick-stat-info">
                <span className="quick-stat-number">{sessions.filter(s => s.status === 'completed').length}</span>
                <span className="quick-stat-label">Completed Sessions</span>
              </div>
            </div>
            <div className="quick-stat-card">
              <span className="quick-stat-icon">📚</span>
              <div className="quick-stat-info">
                <span className="quick-stat-number">{new Set(sessions.map(s => s.tutor?.id)).size}</span>
                <span className="quick-stat-label">Unique Tutors</span>
              </div>
            </div>
            <div className="quick-stat-card">
              <span className="quick-stat-icon">⏱️</span>
              <div className="quick-stat-info">
                <span className="quick-stat-number">
                  {Math.round(sessions.reduce((acc, s) => acc + (s.duration || 0), 0) / 60)}
                </span>
                <span className="quick-stat-label">Total Hours</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Redirect Popup */}
      {showRedirectPopup && (
        <div className="popup-overlay">
          <div className="popup-backdrop" onClick={handleCancelPopup}></div>
          <div className="popup-card">
            <div className="popup-icon">🔔</div>
            <h3 className="popup-title">No Sessions Booked</h3>
            <p className="popup-message">
              You haven't booked any tutoring sessions yet. You will be redirected to 
              the tutors page to browse and book your first session.
            </p>
            <div className="popup-actions">
              <button className="popup-btn cancel-btn" onClick={handleCancelPopup}>
                Cancel
              </button>
              <button className="popup-btn proceed-btn" onClick={handleProceed}>
                Proceed to Tutors
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MySessions;