// src/pages/TutorDashboard.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';
import { API_BASE_URL } from '../services/api';
import { 
  Calendar, 
  Clock, 
  BookOpen, 
  CheckCircle, 
  XCircle, 
  Play, 
  AlertTriangle, 
  Video,
  Users
} from 'lucide-react';
import './TutorDashboard.css';

const TutorDashboard = () => {
  const navigate = useNavigate();
  const [tutor, setTutor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState([]);
  const [students, setStudents] = useState({});
  const [viewMode, setViewMode] = useState('list');
  const [stats, setStats] = useState({
    totalSessions: 0,
    pending: 0,
    upcoming: 0,
    inProgress: 0,
    completed: 0,
    students: 0
  });
  const [activeTab, setActiveTab] = useState('upcoming');

  // ✅ CUSTOM MODAL STATE
  const [modalConfig, setModalConfig] = useState({
    isOpen: false,
    type: 'info', // 'success', 'error', 'confirm'
    title: '',
    message: '',
    confirmText: 'Confirm',
    onConfirm: null,
  });

  const showModal = (type, title, message, onConfirm = null, confirmText = 'Confirm') => {
    setModalConfig({ isOpen: true, type, title, message, onConfirm, confirmText });
  };

  const closeModal = () => {
    setModalConfig(prev => ({ ...prev, isOpen: false }));
  };

  // ============================================
  // FULLY ROBUST TUTOR CHECK FUNCTION
  // ============================================
  const checkIsTutor = (userData) => {
    if (!userData) return false;

    return (
      userData.is_tutor === true ||
      userData.role === 'tutor' ||
      userData.role === 'TUTOR' ||
      userData.userType === 'tutor' ||
      userData.userType === 'TUTOR' ||
      userData.type === 'tutor' ||
      userData.type === 'TUTOR' ||
      userData.accountType === 'tutor' ||
      userData.accountType === 'TUTOR' ||
      userData.account_type === 'tutor' ||
      userData.account_type === 'TUTOR' ||
      userData.roles?.includes('tutor') ||
      userData.roles?.includes('TUTOR') ||
      userData.roles?.some(r => r.toLowerCase() === 'tutor') ||
      userData.permissions?.includes('tutor_access') ||
      userData.permissions?.includes('tutor') ||
      userData.user_metadata?.role === 'tutor' ||
      userData.user_metadata?.role === 'TUTOR' ||
      userData.user_metadata?.is_tutor === true ||
      userData.user_metadata?.userType === 'tutor' ||
      userData.user_metadata?.type === 'tutor' ||
      userData.tutor_profile !== null ||
      userData.tutor_profile !== undefined ||
      userData.tutorId !== null ||
      userData.tutorId !== undefined ||
      userData.tutor_id !== null ||
      userData.tutor_id !== undefined ||
      userData.subscription?.tier === 'tutor' ||
      userData.subscription?.tier === 'TUTOR' ||
      userData.subscription?.plan === 'tutor' ||
      userData.subscription?.type === 'tutor' ||
      userData.subscriptionTier === 'tutor' ||
      userData.subscriptionTier === 'TUTOR' ||
      userData.subscriptionPlan === 'tutor' ||
      userData.subscriptionType === 'tutor' ||
      userData.tier === 'tutor' ||
      userData.tier === 'TUTOR' ||
      userData.plan === 'tutor' ||
      userData.plan === 'TUTOR' ||
      (userData.custom_claims && userData.custom_claims.role === 'tutor') ||
      (userData.custom_claims && userData.custom_claims.role === 'TUTOR') ||
      (userData.custom_claims && userData.custom_claims.is_tutor === true) ||
      (userData.app_metadata && userData.app_metadata.role === 'tutor') ||
      (userData.app_metadata && userData.app_metadata.is_tutor === true) ||
      userData.roles?.includes('instructor') ||
      userData.roles?.includes('teacher') ||
      userData.roles?.some(r => ['tutor', 'instructor', 'teacher', 'educator'].includes(r.toLowerCase()))
    );
  };

  useEffect(() => {
    checkAuth();
    fetchTutorData();
  }, []);

  const checkAuth = async () => {
    const token = localStorage.getItem('accessToken');
    
    if (!token) {
      navigate('/login');
      return;
    }

    try {
      const user = await authService.getCurrentUser();
      if (user) {
        setTutor(user);
        const isTutorAccount = checkIsTutor(user);
        if (!isTutorAccount) {
          console.log('Not a tutor, redirecting to student dashboard');
          navigate('/dashboard');
        }
      } else {
        navigate('/login');
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      navigate('/login');
    }
  };

  // ============================================
  // GOOGLE CALENDAR URL GENERATOR
  // ============================================
  const generateGoogleCalendarUrl = (session) => {
    try {
      const studentName = students[session.user_id]?.name || session.student_name || 'Student';
      
      const startDate = new Date(session.date);
      if (isNaN(startDate.getTime())) {
        console.error('Invalid date:', session.date);
        return '#';
      }
      
      const durationMinutes = session.duration || 60;
      const endDate = new Date(startDate.getTime() + durationMinutes * 60000);
      
      const formatGoogleDate = (date) => {
        return date.toISOString().replace(/-|:|\.\d+/g, '');
      };
      
      const startStr = formatGoogleDate(startDate);
      const endStr = formatGoogleDate(endDate);
      
      const params = new URLSearchParams({
        action: 'TEMPLATE',
        text: `${session.topic || 'Tutoring Session'} - ${studentName}`,
        dates: `${startStr}/${endStr}`,
        details: `Session with ${studentName}\nTopic: ${session.topic || 'General Tutoring'}\n${session.notes ? `Notes: ${session.notes}` : ''}\n\nPowered by EduSpantech`,
        location: 'EduSpantech Platform',
        ctz: 'America/New_York'
      });
      
      return `https://calendar.google.com/calendar/render?${params.toString()}`;
    } catch (error) {
      console.error('Error generating calendar URL:', error);
      return '#';
    }
  };

  // ============================================
  // FETCH STUDENT DETAILS
  // ============================================
  const fetchStudentDetails = async (studentId) => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`${API_BASE_URL}/auth/user/${studentId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        return data.user || data;
      }
      return null;
    } catch (error) {
      console.error('Failed to fetch student:', error);
      return null;
    }
  };

  const fetchTutorData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('accessToken');
      
      const response = await fetch(`${API_BASE_URL}/sessions`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        const sessions = data.sessions || [];
        setBookings(sessions);
        
        const studentPromises = sessions.map(async (session) => {
          if (session.user_id && !students[session.user_id]) {
            const student = await fetchStudentDetails(session.user_id);
            if (student) {
              setStudents(prev => ({ ...prev, [session.user_id]: student }));
            }
          }
        });
        await Promise.all(studentPromises);
        
        const pending = sessions.filter(s => s.status === 'pending').length;
        const upcoming = sessions.filter(s => s.status === 'upcoming' || s.status === 'pending').length;
        const inProgress = sessions.filter(s => s.status === 'in-progress' || s.status === 'started').length;
        const completed = sessions.filter(s => s.status === 'completed' || s.status === 'ended').length;
        const uniqueStudents = new Set(sessions.map(s => s.user_id)).size;
        
        setStats({
          totalSessions: sessions.length,
          pending: pending,
          upcoming: upcoming,
          inProgress: inProgress,
          completed: completed,
          students: uniqueStudents
        });
      }
    } catch (error) {
      console.error('Failed to fetch tutor data:', error);
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // RENDER STUDENT AVATAR
  // ============================================
  const renderStudentAvatar = (studentId, studentName) => {
    const student = students[studentId];
    
    if (student?.avatar) {
      return (
        <img 
          src={student.avatar} 
          alt={student.name || 'Student'} 
          className="student-avatar-img"
          style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }}
          onError={(e) => {
            e.target.style.display = 'none';
            const parent = e.target.parentElement;
            if (parent) {
              const initial = student?.name?.charAt(0)?.toUpperCase() || 'S';
              parent.textContent = initial;
              parent.style.display = 'flex';
              parent.style.alignItems = 'center';
              parent.style.justifyContent = 'center';
              parent.style.background = '#4f46e5';
              parent.style.color = 'white';
              parent.style.fontSize = '18px';
              parent.style.fontWeight = 'bold';
              parent.style.borderRadius = '50%';
              parent.style.width = '40px';
              parent.style.height = '40px';
            }
          }}
        />
      );
    }
    
    const name = student?.name || studentName || 'Student';
    const initial = name.charAt(0).toUpperCase();
    const colors = ['#4f46e5', '#7c3aed', '#059669', '#10b981', '#dc2626', '#f59e0b', '#8b5cf6', '#ec4899'];
    const hash = name.split('').reduce((acc, char) => acc + (char.charCodeAt(0) || 0), 0);
    const color = colors[Math.abs(hash) % colors.length];
    
    return (
      <div 
        className="student-avatar-initial"
        style={{
          width: '40px',
          height: '40px',
          borderRadius: '50%',
          background: color,
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '18px',
          fontWeight: 'bold',
          textTransform: 'uppercase'
        }}
      >
        {initial}
      </div>
    );
  };

  // ============================================
  // ACCEPT SESSION
  // ============================================
  const handleAcceptSession = (sessionId) => {
    showModal(
      'confirm',
      'Accept Session',
      'Are you sure you want to accept this session? The student will be notified.',
      async () => {
        closeModal();
        try {
          const token = localStorage.getItem('accessToken');
          const response = await fetch(`${API_BASE_URL}/sessions/${sessionId}/accept`, {
            method: 'PUT',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });

          if (response.ok) {
            setBookings(prev => prev.map(b => 
              b.id === sessionId ? { ...b, status: 'upcoming' } : b
            ));
            setStats(prev => ({
              ...prev,
              pending: prev.pending - 1,
              upcoming: prev.upcoming
            }));
            showModal('success', 'Session Accepted', 'The session has been successfully accepted.');
          } else {
            const error = await response.json();
            showModal('error', 'Error', 'Failed to accept session: ' + (error.error || 'Unknown error'));
          }
        } catch (error) {
          showModal('error', 'Error', 'Failed to accept session');
        }
      }
    );
  };

  // ============================================
  // START SESSION
  // ============================================
  const handleStartSession = (booking) => {
    navigate(`/session/${booking.id}`, { state: { tutor: tutor, session: booking } });
  };

  // ============================================
  // CANCEL SESSION
  // ============================================
  const handleCancelSession = (sessionId) => {
    showModal(
      'confirm',
      'Cancel Session',
      'Are you sure you want to cancel this session?',
      async () => {
        closeModal();
        try {
          const token = localStorage.getItem('accessToken');
          const response = await fetch(`${API_BASE_URL}/sessions/${sessionId}/cancel`, {
            method: 'PUT',
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });

          if (response.ok) {
            setBookings(prev => prev.map(b => 
              b.id === sessionId ? { ...b, status: 'cancelled' } : b
            ));
            setStats(prev => ({
              ...prev,
              totalSessions: prev.totalSessions - 1,
              pending: prev.pending - 1,
              upcoming: prev.upcoming - 1
            }));
            showModal('success', 'Session Cancelled', 'The session has been cancelled.');
          } else {
            showModal('error', 'Error', 'Failed to cancel session');
          }
        } catch (error) {
          showModal('error', 'Error', 'Failed to cancel session');
        }
      }
    );
  };

  // ============================================
  // GET FILTERED BOOKINGS
  // ============================================
  const getFilteredBookings = () => {
    if (activeTab === 'all') return bookings;
    if (activeTab === 'upcoming') {
      return bookings.filter(b => b.status === 'upcoming' || b.status === 'pending');
    }
    if (activeTab === 'pending') {
      return bookings.filter(b => b.status === 'pending');
    }
    return bookings.filter(b => b.status === activeTab);
  };

  // ============================================
  // FORMAT DATE
  // ============================================
  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // ============================================
  // GET TUTOR AVATAR
  // ============================================
  const getTutorAvatarImage = () => {
    if (tutor?.profile_photo) return tutor.profile_photo;
    if (tutor?.avatar) return tutor.avatar;
    return null;
  };

  const getTutorAvatarInitial = () => {
    if (!tutor || !tutor.name) return 'T';
    return tutor.name.charAt(0).toUpperCase();
  };

  // ============================================
  // RENDER STATUS BADGE
  // ============================================
  const renderStatusBadge = (status) => {
    const statusMap = {
      'pending': { label: 'Pending', className: 'pending', icon: <Clock size={14} /> },
      'upcoming': { label: 'Upcoming', className: 'upcoming', icon: <Calendar size={14} /> },
      'in-progress': { label: 'In Progress', className: 'in-progress', icon: <Play size={14} /> },
      'started': { label: 'In Progress', className: 'in-progress', icon: <Play size={14} /> },
      'completed': { label: 'Completed', className: 'completed', icon: <CheckCircle size={14} /> },
      'ended': { label: 'Completed', className: 'completed', icon: <CheckCircle size={14} /> },
      'cancelled': { label: 'Cancelled', className: 'cancelled', icon: <XCircle size={14} /> }
    };
    const info = statusMap[status] || { label: status || 'Unknown', className: 'unknown', icon: null };
    return (
      <span className={`session-status ${info.className}`}>
        {info.icon} {info.label}
      </span>
    );
  };

  // ============================================
  // RENDER CALENDAR VIEW
  // ============================================
  const renderCalendarView = () => {
    const sessions = getFilteredBookings();
    if (sessions.length === 0) {
      return (
        <div className="empty-sessions">
          <Calendar size={48} className="empty-icon" />
          <h3>No sessions to display</h3>
          <p>No sessions match your current filter.</p>
        </div>
      );
    }

    const groupedSessions = sessions.reduce((acc, session) => {
      const dateKey = new Date(session.date).toDateString();
      if (!acc[dateKey]) {
        acc[dateKey] = [];
      }
      acc[dateKey].push(session);
      return acc;
    }, {});

    const sortedDates = Object.keys(groupedSessions).sort((a, b) => {
      return new Date(a) - new Date(b);
    });

    return (
      <div className="calendar-view">
        {sortedDates.map((dateKey) => (
          <div key={dateKey} className="calendar-day">
            <div className="calendar-day-header">
              <h3>{new Date(dateKey).toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
                year: 'numeric'
              })}</h3>
              <span className="calendar-day-count">{groupedSessions[dateKey].length} sessions</span>
            </div>
            <div className="calendar-day-sessions">
              {groupedSessions[dateKey]
                .sort((a, b) => new Date(a.date) - new Date(b.date))
                .map((session) => {
                  const statusInfo = renderStatusBadge(session.status);
                  const studentName = students[session.user_id]?.name || session.student_name || 'Student';
                  const calendarUrl = generateGoogleCalendarUrl(session);
                  
                  return (
                    <div key={session.id} className={`calendar-session-block status-${session.status}`}>
                      <div className="calendar-session-time">
                        <Clock size={14} />
                        <span>
                          {new Date(session.date).toLocaleTimeString('en-US', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                        <span className="calendar-session-duration">
                          ({session.duration || 60}m)
                        </span>
                      </div>
                      <div className="calendar-session-content">
                        <div className="calendar-session-student">
                          {renderStudentAvatar(session.user_id, studentName)}
                          <div>
                            <span className="calendar-session-name">{studentName}</span>
                            <span className="calendar-session-topic">{session.topic || 'General'}</span>
                          </div>
                        </div>
                        <div className="calendar-session-actions">
                          {renderStatusBadge(session.status)}
                          <a 
                            href={calendarUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn-google-calendar-small"
                            title="Add to Google Calendar"
                          >
                            <Calendar size={16} />
                          </a>
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="tutor-dashboard-loading">
        <div className="loading-spinner"></div>
        <p>Loading your dashboard...</p>
      </div>
    );
  }

  return (
    <div className="tutor-dashboard">
      {/* ✅ CUSTOM MODAL */}
      {modalConfig.isOpen && (
        <div className="custom-modal-overlay" onClick={closeModal}>
          <div className="custom-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className={`custom-modal-icon ${modalConfig.type}`}>
              {modalConfig.type === 'success' && <CheckCircle size={48} />}
              {modalConfig.type === 'error' && <XCircle size={48} />}
              {modalConfig.type === 'confirm' && <Calendar size={48} />}
            </div>
            <h3 className="custom-modal-title">{modalConfig.title}</h3>
            <p className="custom-modal-message">{modalConfig.message}</p>
            <div className="custom-modal-actions">
              {modalConfig.onConfirm ? (
                <>
                  <button className="btn-modal-cancel" onClick={closeModal}>Cancel</button>
                  <button className="btn-modal-confirm" onClick={modalConfig.onConfirm}>{modalConfig.confirmText}</button>
                </>
              ) : (
                <button className="btn-modal-confirm" onClick={closeModal}>OK</button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="tutor-dashboard-header">
        <div className="tutor-dashboard-header-content">
          <div className="tutor-avatar">
            {getTutorAvatarImage() ? (
              <img src={getTutorAvatarImage()} alt={tutor?.name || 'Tutor'} className="tutor-avatar-img" />
            ) : (
              <span className="tutor-avatar-initial">{getTutorAvatarInitial()}</span>
            )}
          </div>
          <div className="tutor-info">
            <h1>Welcome back, {tutor?.name || 'Tutor'}!</h1>
            <p>Manage your sessions and help students succeed</p>
          </div>
          <div className="tutor-header-actions">
            <a 
              href="https://calendar.google.com/calendar"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-google-calendar-header"
            >
              <Calendar size={16} /> View Calendar
            </a>
            <button className="btn-secondary" onClick={() => {
              authService.logout();
              navigate('/login');
            }}>
              Sign Out
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="tutor-stats">
        <div className="stat-card">
          <BookOpen size={28} className="stat-icon text-blue" />
          <div className="stat-info">
            <span className="stat-number">{stats.totalSessions}</span>
            <span className="stat-label">Total Sessions</span>
          </div>
        </div>
        <div className="stat-card">
          <Clock size={28} className="stat-icon text-yellow" />
          <div className="stat-info">
            <span className="stat-number">{stats.pending}</span>
            <span className="stat-label">Pending</span>
          </div>
        </div>
        <div className="stat-card">
          <Calendar size={28} className="stat-icon text-indigo" />
          <div className="stat-info">
            <span className="stat-number">{stats.upcoming}</span>
            <span className="stat-label">Upcoming</span>
          </div>
        </div>
        <div className="stat-card">
          <Video size={28} className="stat-icon text-green" />
          <div className="stat-info">
            <span className="stat-number">{stats.inProgress}</span>
            <span className="stat-label">In Progress</span>
          </div>
        </div>
        <div className="stat-card">
          <CheckCircle size={28} className="stat-icon text-teal" />
          <div className="stat-info">
            <span className="stat-number">{stats.completed}</span>
            <span className="stat-label">Completed</span>
          </div>
        </div>
        <div className="stat-card">
          <Users size={28} className="stat-icon text-purple" />
          <div className="stat-info">
            <span className="stat-number">{stats.students}</span>
            <span className="stat-label">Students</span>
          </div>
        </div>
      </div>

      {/* Sessions */}
      <div className="tutor-sessions">
        <div className="sessions-header">
          <h2>Your Sessions</h2>
          <div className="sessions-controls">
            <div className="view-toggle">
              <button 
                className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
                onClick={() => setViewMode('list')}
              >
                List
              </button>
              <button 
                className={`view-btn ${viewMode === 'calendar' ? 'active' : ''}`}
                onClick={() => setViewMode('calendar')}
              >
                Calendar
              </button>
            </div>
            <div className="session-tabs">
              <button 
                className={`tab-btn ${activeTab === 'pending' ? 'active' : ''}`}
                onClick={() => setActiveTab('pending')}
              >
                Pending {stats.pending > 0 && <span className="badge">{stats.pending}</span>}
              </button>
              <button 
                className={`tab-btn ${activeTab === 'upcoming' ? 'active' : ''}`}
                onClick={() => setActiveTab('upcoming')}
              >
                Upcoming
              </button>
              <button 
                className={`tab-btn ${activeTab === 'completed' ? 'active' : ''}`}
                onClick={() => setActiveTab('completed')}
              >
                Completed
              </button>
              <button 
                className={`tab-btn ${activeTab === 'all' ? 'active' : ''}`}
                onClick={() => setActiveTab('all')}
              >
                All
              </button>
            </div>
          </div>
        </div>

        <div className="sessions-list">
          {viewMode === 'calendar' ? (
            renderCalendarView()
          ) : (
            getFilteredBookings().length > 0 ? (
              getFilteredBookings().map((booking) => {
                const statusInfo = renderStatusBadge(booking.status);
                const studentName = students[booking.user_id]?.name || booking.student_name || 'Student';
                const calendarUrl = generateGoogleCalendarUrl(booking);
                
                return (
                  <div key={booking.id} className="session-card">
                    <div className="session-card-header">
                      <div className="session-student">
                        {renderStudentAvatar(booking.user_id, studentName)}
                        <div>
                          <h4>{studentName}</h4>
                          <p className="student-id">ID: {booking.user_id?.slice(0, 8)}...</p>
                        </div>
                      </div>
                      <span className={`session-status ${statusInfo.className}`}>
                        {statusInfo.label}
                      </span>
                    </div>
                    <div className="session-card-body">
                      <div className="session-details">
                        <div className="detail-item">
                          <Calendar size={14} />
                          <span>{formatDate(booking.date)}</span>
                        </div>
                        <div className="detail-item">
                          <Clock size={14} />
                          <span>{booking.duration || 60} minutes</span>
                        </div>
                        <div className="detail-item">
                          <BookOpen size={14} />
                          <span>{booking.topic || 'Mathematics'}</span>
                        </div>
                      </div>
                      {booking.notes && (
                        <p className="session-notes">{booking.notes}</p>
                      )}
                    </div>
                    <div className="session-card-actions">
                      {booking.status === 'pending' && (
                        <>
                          <button 
                            className="btn-accept"
                            onClick={() => handleAcceptSession(booking.id)}
                          >
                            <CheckCircle size={16} /> Accept Session
                          </button>
                          <button 
                            className="btn-cancel"
                            onClick={() => handleCancelSession(booking.id)}
                          >
                            Cancel
                          </button>
                          <a 
                            href={calendarUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn-google-calendar"
                          >
                            <Calendar size={16} /> Add to Calendar
                          </a>
                        </>
                      )}
                      
                      {booking.status === 'upcoming' && (
                        <>
                          <button 
                            className="btn-start"
                            onClick={() => handleStartSession(booking)}
                          >
                            <Play size={16} /> Start Session
                          </button>
                          <button 
                            className="btn-cancel"
                            onClick={() => handleCancelSession(booking.id)}
                          >
                            Cancel
                          </button>
                          <a 
                            href={calendarUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn-google-calendar"
                          >
                            <Calendar size={16} /> Add to Calendar
                          </a>
                        </>
                      )}
                      
                      {(booking.status === 'in-progress' || booking.status === 'started') && (
                        <>
                          <button 
                            className="btn-start"
                            onClick={() => handleStartSession(booking)}
                          >
                            <Play size={16} /> Resume Session
                          </button>
                          <a 
                            href={calendarUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn-google-calendar"
                          >
                            <Calendar size={16} /> Add to Calendar
                          </a>
                        </>
                      )}
                      
                      {(booking.status === 'completed' || booking.status === 'ended') && (
                        <>
                          <span className="session-completed-badge"><CheckCircle size={16} /> Completed</span>
                          <a 
                            href={calendarUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn-google-calendar"
                          >
                            <Calendar size={16} /> Add to Calendar
                          </a>
                        </>
                      )}
                      
                      {booking.status === 'cancelled' && (
                        <span className="session-cancelled-badge"><XCircle size={16} /> Cancelled</span>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="empty-sessions">
                <Calendar size={48} className="empty-icon" />
                <h3>No {activeTab === 'all' ? '' : activeTab} sessions</h3>
                <p>
                  {activeTab === 'pending' ? 'No pending session requests.' :
                   activeTab === 'upcoming' ? 'No upcoming sessions scheduled.' :
                   activeTab === 'completed' ? 'No completed sessions yet.' :
                   'Students haven\'t booked sessions with you yet.'}
                </p>
                <p className="empty-sub">
                  {activeTab === 'pending' ? 'Students will appear here when they book.' :
                   'Check back later for new bookings!'}
                </p>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
};

export default TutorDashboard;