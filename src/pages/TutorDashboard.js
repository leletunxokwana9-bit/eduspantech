// src/pages/TutorDashboard.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';
import { API_BASE_URL } from '../services/api';
import './TutorDashboard.css';

const TutorDashboard = () => {
  const navigate = useNavigate();
  const [tutor, setTutor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState([]);
  const [students, setStudents] = useState({});
  const [stats, setStats] = useState({
    totalSessions: 0,
    pending: 0,
    upcoming: 0,
    inProgress: 0,
    completed: 0,
    students: 0
  });
  const [activeTab, setActiveTab] = useState('upcoming');

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
      
      // Parse and format the date
      const startDate = new Date(session.date);
      if (isNaN(startDate.getTime())) {
        console.error('Invalid date:', session.date);
        return '#';
      }
      
      // Calculate end time based on duration
      const durationMinutes = session.duration || 60;
      const endDate = new Date(startDate.getTime() + durationMinutes * 60000);
      
      // Format for Google Calendar (YYYYMMDDTHHMMSSZ)
      const formatGoogleDate = (date) => {
        return date.toISOString().replace(/-|:|\.\d+/g, '');
      };
      
      const startStr = formatGoogleDate(startDate);
      const endStr = formatGoogleDate(endDate);
      
      // Build the URL parameters
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
        
        // Fetch student details for each session
        const studentPromises = sessions.map(async (session) => {
          if (session.user_id && !students[session.user_id]) {
            const student = await fetchStudentDetails(session.user_id);
            if (student) {
              setStudents(prev => ({ ...prev, [session.user_id]: student }));
            }
          }
        });
        await Promise.all(studentPromises);
        
        // Calculate stats
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
  const handleAcceptSession = async (sessionId) => {
    if (!window.confirm('✅ Accept this session? The student will be notified.')) return;
    
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
        const data = await response.json();
        setBookings(prev => prev.map(b => 
          b.id === sessionId ? { ...b, status: 'upcoming' } : b
        ));
        setStats(prev => ({
          ...prev,
          pending: prev.pending - 1,
          upcoming: prev.upcoming
        }));
        alert('✅ Session accepted successfully! The student has been notified.');
      } else {
        const error = await response.json();
        alert('❌ Failed to accept session: ' + (error.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Accept session error:', error);
      alert('❌ Failed to accept session');
    }
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
  const handleCancelSession = async (sessionId) => {
    if (!window.confirm('Are you sure you want to cancel this session?')) return;
    
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
        alert('✅ Session cancelled successfully');
      } else {
        alert('❌ Failed to cancel session');
      }
    } catch (error) {
      console.error('Cancel session error:', error);
      alert('❌ Failed to cancel session');
    }
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
      'pending': { label: '⏳ Pending', className: 'pending' },
      'upcoming': { label: '📅 Upcoming', className: 'upcoming' },
      'in-progress': { label: '🔄 In Progress', className: 'in-progress' },
      'started': { label: '🔄 In Progress', className: 'in-progress' },
      'completed': { label: '✅ Completed', className: 'completed' },
      'ended': { label: '✅ Completed', className: 'completed' },
      'cancelled': { label: '❌ Cancelled', className: 'cancelled' }
    };
    return statusMap[status] || { label: status || 'Unknown', className: 'unknown' };
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
          <span className="stat-icon">📚</span>
          <div className="stat-info">
            <span className="stat-number">{stats.totalSessions}</span>
            <span className="stat-label">Total Sessions</span>
          </div>
        </div>
        <div className="stat-card">
          <span className="stat-icon">⏳</span>
          <div className="stat-info">
            <span className="stat-number">{stats.pending}</span>
            <span className="stat-label">Pending</span>
          </div>
        </div>
        <div className="stat-card">
          <span className="stat-icon">📅</span>
          <div className="stat-info">
            <span className="stat-number">{stats.upcoming}</span>
            <span className="stat-label">Upcoming</span>
          </div>
        </div>
        <div className="stat-card">
          <span className="stat-icon">🔄</span>
          <div className="stat-info">
            <span className="stat-number">{stats.inProgress}</span>
            <span className="stat-label">In Progress</span>
          </div>
        </div>
        <div className="stat-card">
          <span className="stat-icon">✅</span>
          <div className="stat-info">
            <span className="stat-number">{stats.completed}</span>
            <span className="stat-label">Completed</span>
          </div>
        </div>
        <div className="stat-card">
          <span className="stat-icon">👨‍🎓</span>
          <div className="stat-info">
            <span className="stat-number">{stats.students}</span>
            <span className="stat-label">Students</span>
          </div>
        </div>
      </div>

      {/* Sessions */}
      <div className="tutor-sessions">
        <div className="sessions-header">
          <h2>📋 Your Sessions</h2>
          <div className="session-tabs">
            <button 
              className={`tab-btn ${activeTab === 'pending' ? 'active' : ''}`}
              onClick={() => setActiveTab('pending')}
            >
              ⏳ Pending {stats.pending > 0 && <span className="badge">{stats.pending}</span>}
            </button>
            <button 
              className={`tab-btn ${activeTab === 'upcoming' ? 'active' : ''}`}
              onClick={() => setActiveTab('upcoming')}
            >
              📅 Upcoming
            </button>
            <button 
              className={`tab-btn ${activeTab === 'completed' ? 'active' : ''}`}
              onClick={() => setActiveTab('completed')}
            >
              ✅ Completed
            </button>
            <button 
              className={`tab-btn ${activeTab === 'all' ? 'active' : ''}`}
              onClick={() => setActiveTab('all')}
            >
              All
            </button>
          </div>
        </div>

        <div className="sessions-list">
          {getFilteredBookings().length > 0 ? (
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
                        <span className="detail-icon">📅</span>
                        <span>{formatDate(booking.date)}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-icon">⏱️</span>
                        <span>{booking.duration || 60} minutes</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-icon">📖</span>
                        <span>{booking.topic || 'Mathematics'}</span>
                      </div>
                    </div>
                    {booking.notes && (
                      <p className="session-notes">📝 {booking.notes}</p>
                    )}
                  </div>
                  <div className="session-card-actions">
                    {/* PENDING - Show Accept button */}
                    {booking.status === 'pending' && (
                      <>
                        <button 
                          className="btn-accept"
                          onClick={() => handleAcceptSession(booking.id)}
                        >
                          ✅ Accept Session
                        </button>
                        <button 
                          className="btn-cancel"
                          onClick={() => handleCancelSession(booking.id)}
                        >
                          Cancel
                        </button>
                        {/* GOOGLE CALENDAR BUTTON */}
                        <a 
                          href={calendarUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn-google-calendar"
                        >
                          📅 Add to Calendar
                        </a>
                      </>
                    )}
                    
                    {/* UPCOMING - Show Start button */}
                    {booking.status === 'upcoming' && (
                      <>
                        <button 
                          className="btn-start"
                          onClick={() => handleStartSession(booking)}
                        >
                          🎯 Start Session
                        </button>
                        <button 
                          className="btn-cancel"
                          onClick={() => handleCancelSession(booking.id)}
                        >
                          Cancel
                        </button>
                        {/* GOOGLE CALENDAR BUTTON */}
                        <a 
                          href={calendarUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn-google-calendar"
                        >
                          📅 Add to Calendar
                        </a>
                      </>
                    )}
                    
                    {/* IN PROGRESS - Show Resume button */}
                    {(booking.status === 'in-progress' || booking.status === 'started') && (
                      <>
                        <button 
                          className="btn-start"
                          onClick={() => handleStartSession(booking)}
                        >
                          ▶️ Resume Session
                        </button>
                        {/* GOOGLE CALENDAR BUTTON */}
                        <a 
                          href={calendarUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn-google-calendar"
                        >
                          📅 Add to Calendar
                        </a>
                      </>
                    )}
                    
                    {/* COMPLETED */}
                    {(booking.status === 'completed' || booking.status === 'ended') && (
                      <>
                        <span className="session-completed-badge">✅ Completed</span>
                        {/* GOOGLE CALENDAR BUTTON */}
                        <a 
                          href={calendarUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn-google-calendar"
                        >
                          📅 Add to Calendar
                        </a>
                      </>
                    )}
                    
                    {/* CANCELLED */}
                    {booking.status === 'cancelled' && (
                      <span className="session-cancelled-badge">❌ Cancelled</span>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="empty-sessions">
              <span className="empty-icon">📭</span>
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
          )}
        </div>
      </div>
    </div>
  );
};

export default TutorDashboard;