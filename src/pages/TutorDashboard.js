// src/pages/TutorDashboard.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';
import './TutorDashboard.css';

const TutorDashboard = () => {
  const navigate = useNavigate();
  const [tutor, setTutor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState([]);
  const [stats, setStats] = useState({
    totalSessions: 0,
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
        // ============================================
        // FIX: Use robust tutor check
        // ============================================
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

  const fetchTutorData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('accessToken');
      
      // Fetch tutor's bookings
      const response = await fetch('https://eduspantech-backend.onrender.com/api/sessions', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        const sessions = data.sessions || [];
        setBookings(sessions);
        
        // Calculate stats
        const upcoming = sessions.filter(s => s.status === 'upcoming').length;
        const inProgress = sessions.filter(s => s.status === 'in-progress').length;
        const completed = sessions.filter(s => s.status === 'completed').length;
        const students = new Set(sessions.map(s => s.user_id)).size;
        
        setStats({
          totalSessions: sessions.length,
          upcoming: upcoming,
          inProgress: inProgress,
          completed: completed,
          students: students
        });
      }
    } catch (error) {
      console.error('Failed to fetch tutor data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStartSession = (booking) => {
    navigate(`/session/${booking.id}`, { state: { tutor: tutor, session: booking } });
  };

  const handleCancelSession = async (bookingId) => {
    if (!window.confirm('Are you sure you want to cancel this session?')) return;
    
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`https://eduspantech-backend.onrender.com/api/sessions/${bookingId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        setBookings(prev => prev.filter(b => b.id !== bookingId));
        setStats(prev => ({
          ...prev,
          totalSessions: prev.totalSessions - 1,
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

  const getFilteredBookings = () => {
    if (activeTab === 'all') return bookings;
    if (activeTab === 'upcoming') {
      return bookings.filter(b => b.status === 'upcoming' || b.status === 'in-progress');
    }
    return bookings.filter(b => b.status === activeTab);
  };

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

  // Get avatar image (tutor photo > avatar > initial)
  const getAvatarImage = () => {
    if (tutor?.profile_photo) return tutor.profile_photo;
    if (tutor?.avatar) return tutor.avatar;
    return null;
  };

  const getAvatarInitial = () => {
    if (!tutor || !tutor.name) return 'T';
    return tutor.name.charAt(0).toUpperCase();
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
            {getAvatarImage() ? (
              <img src={getAvatarImage()} alt={tutor?.name || 'Tutor'} className="tutor-avatar-img" />
            ) : (
              <span className="tutor-avatar-initial">{getAvatarInitial()}</span>
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

        <div className="sessions-list">
          {getFilteredBookings().length > 0 ? (
            getFilteredBookings().map((booking) => (
              <div key={booking.id} className="session-card">
                <div className="session-card-header">
                  <div className="session-student">
                    <span className="student-avatar">👤</span>
                    <div>
                      <h4>Student Session</h4>
                      <p className="student-id">ID: {booking.user_id?.slice(0, 8)}...</p>
                    </div>
                  </div>
                  <span className={`session-status ${booking.status}`}>
                    {booking.status === 'upcoming' ? '📅 Upcoming' : 
                     booking.status === 'in-progress' ? '🔄 In Progress' : 
                     booking.status === 'completed' ? '✅ Completed' : 
                     booking.status === 'cancelled' ? '❌ Cancelled' : 
                     booking.status || 'Scheduled'}
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
                  {(booking.status === 'upcoming' || booking.status === 'in-progress') && (
                    <>
                      <button 
                        className="btn-start"
                        onClick={() => handleStartSession(booking)}
                      >
                        {booking.status === 'in-progress' ? '▶️ Resume Session' : '🎯 Start Session'}
                      </button>
                      {booking.status === 'upcoming' && (
                        <button 
                          className="btn-cancel"
                          onClick={() => handleCancelSession(booking.id)}
                        >
                          Cancel
                        </button>
                      )}
                    </>
                  )}
                  {booking.status === 'completed' && (
                    <span className="session-completed-badge">✅ Completed</span>
                  )}
                  {booking.status === 'cancelled' && (
                    <span className="session-cancelled-badge">❌ Cancelled</span>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="empty-sessions">
              <span className="empty-icon">📭</span>
              <h3>No {activeTab === 'all' ? '' : activeTab} sessions</h3>
              <p>Students haven't booked sessions with you yet.</p>
              <p className="empty-sub">Check back later for new bookings!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TutorDashboard;