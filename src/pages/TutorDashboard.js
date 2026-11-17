
// src/pages/TutorDashboard.js

import React, { useState, useEffect, useCallback } from 'react';
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
  Video,
  Users,
  AlertCircle,
  List,
  LayoutGrid,
  ExternalLink,
  LogOut,
  RefreshCw,
  User,
  X
} from 'lucide-react';
import './TutorDashboard.css';

const TutorDashboard = () => {
  const navigate = useNavigate();

  const [tutor, setTutor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState([]);
  const [students, setStudents] = useState({});

  const [viewMode, setViewMode] = useState('list');
  const [activeTab, setActiveTab] = useState('upcoming');

  const [stats, setStats] = useState({
    totalSessions: 0,
    pending: 0,
    upcoming: 0,
    inProgress: 0,
    completed: 0,
    cancelled: 0,
    students: 0
  });

  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [confirmMessage, setConfirmMessage] = useState('');
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');

  const getToken = () => localStorage.getItem('token');

  // --------------------------------------------------
  // SESSION STATUS HELPERS
  // --------------------------------------------------

  const getSessionStatus = (session) => {
    return String(session?.status || '').toLowerCase().trim();
  };

  const isPending = (session) => {
    return getSessionStatus(session) === 'pending';
  };

  const isUpcoming = (session) => {
    return getSessionStatus(session) === 'upcoming';
  };

  const isInProgress = (session) => {
    return ['in-progress', 'started'].includes(
      getSessionStatus(session)
    );
  };

  const isCompleted = (session) => {
    return ['completed', 'ended'].includes(
      getSessionStatus(session)
    );
  };

  const isCancelled = (session) => {
    return getSessionStatus(session) === 'cancelled';
  };

  // --------------------------------------------------
  // DASHBOARD STATISTICS
  // Status-based only. No date or time comparisons.
  // --------------------------------------------------

  const calculateStats = useCallback((sessions) => {
    const allSessions = Array.isArray(sessions) ? sessions : [];

    const pending = allSessions.filter(isPending).length;
    const upcoming = allSessions.filter(isUpcoming).length;
    const inProgress = allSessions.filter(isInProgress).length;
    const completed = allSessions.filter(isCompleted).length;
    const cancelled = allSessions.filter(isCancelled).length;

    const uniqueStudents = new Set(
      allSessions
        .map(session => session.user_id || session.student_id)
        .filter(Boolean)
    );

    return {
      totalSessions: allSessions.length,
      pending,
      upcoming,
      inProgress,
      completed,
      cancelled,
      students: uniqueStudents.size
    };
  }, []);

  // --------------------------------------------------
  // AUTHENTICATION
  // --------------------------------------------------

  const checkIsTutor = (userData) => {
    if (!userData) return false;

    const role = String(
      userData.role ||
      userData.user_type ||
      userData.account_type ||
      ''
    ).toLowerCase();

    if (role === 'tutor') return true;

    if (userData.is_tutor === true) return true;

    if (userData.tutor_profile) return true;

    if (userData.tutor_id || userData.tutorId) return true;

    if (
      Array.isArray(userData.roles) &&
      userData.roles.some(
        item => String(item).toLowerCase() === 'tutor'
      )
    ) {
      return true;
    }

    return false;
  };

  const checkAuth = useCallback(async () => {
    try {
      const token = getToken();

      if (!token) {
        navigate('/login');
        return null;
      }

      const userData = await authService.getCurrentUser();

      if (!userData) {
        navigate('/login');
        return null;
      }

      if (!checkIsTutor(userData)) {
        navigate('/dashboard');
        return null;
      }

      setTutor(userData);
      return userData;
    } catch (err) {
      console.error('Tutor authentication error:', err);
      navigate('/login');
      return null;
    }
  }, [navigate]);

  // --------------------------------------------------
  // STUDENT DETAILS
  // --------------------------------------------------

  const fetchStudentDetails = async (studentId) => {
    if (!studentId) return null;

    try {
      const response = await fetch(
        `${API_BASE_URL}/auth/user/${studentId}`,
        {
          headers: {
            Authorization: `Bearer ${getToken()}`
          }
        }
      );

      if (!response.ok) return null;

      const data = await response.json();

      return data.user || data.student || data;
    } catch (err) {
      console.error(
        `Error fetching student ${studentId}:`,
        err
      );

      return null;
    }
  };

  // --------------------------------------------------
  // FETCH TUTOR SESSIONS
  // --------------------------------------------------

  const fetchTutorData = async () => {
    try {
      setError('');

      const response = await fetch(
        `${API_BASE_URL}/sessions`,
        {
          headers: {
            Authorization: `Bearer ${getToken()}`
          }
        }
      );

      if (!response.ok) {
        throw new Error('Unable to load tutor sessions.');
      }

      const data = await response.json();
      const sessions = Array.isArray(data.sessions)
        ? data.sessions
        : [];

      setBookings(sessions);
      setStats(calculateStats(sessions));

      // Fetch student information for the session cards.
      const studentIds = [
        ...new Set(
          sessions
            .map(session => session.user_id || session.student_id)
            .filter(Boolean)
        )
      ];

      const studentResults = await Promise.all(
        studentIds.map(async studentId => ({
          studentId,
          student: await fetchStudentDetails(studentId)
        }))
      );

      const studentMap = {};

      studentResults.forEach(({ studentId, student }) => {
        if (student) {
          studentMap[studentId] = student;
        }
      });

      setStudents(studentMap);
    } catch (err) {
      console.error('Error fetching tutor sessions:', err);
      setError(err.message || 'Unable to load sessions.');
    }
  };

  // --------------------------------------------------
  // INITIAL LOAD
  // --------------------------------------------------

  useEffect(() => {
    let mounted = true;

    const initializeDashboard = async () => {
      setLoading(true);

      const authenticatedTutor = await checkAuth();

      if (!mounted) return;

      if (authenticatedTutor) {
        await fetchTutorData();
      }

      if (mounted) {
        setLoading(false);
      }
    };

    initializeDashboard();

    return () => {
      mounted = false;
    };
  }, [checkAuth, calculateStats]);

  // --------------------------------------------------
  // REFRESH
  // --------------------------------------------------

  const handleRefresh = async () => {
    setLoading(true);
    await fetchTutorData();
    setLoading(false);
  };

  // --------------------------------------------------
  // CONFIRMATION MODAL
  // --------------------------------------------------

  const openConfirmModal = (message, action) => {
    setConfirmMessage(message);
    setConfirmAction(() => action);
    setShowConfirmModal(true);
  };

  const closeConfirmModal = () => {
    if (processing) return;

    setShowConfirmModal(false);
    setConfirmAction(null);
    setConfirmMessage('');
  };

  const executeConfirmAction = async () => {
    if (!confirmAction) return;

    setProcessing(true);

    try {
      await confirmAction();
      setShowConfirmModal(false);
      setConfirmAction(null);
      setConfirmMessage('');
    } catch (err) {
      console.error('Confirmation action failed:', err);
      setError(err.message || 'The action could not be completed.');
    } finally {
      setProcessing(false);
    }
  };

  // --------------------------------------------------
  // ACCEPT SESSION
  // --------------------------------------------------

  const handleAcceptSession = (sessionId) => {
    openConfirmModal(
      'Are you sure you want to accept this session?',
      async () => {
        const response = await fetch(
          `${API_BASE_URL}/sessions/${sessionId}/accept`,
          {
            method: 'PUT',
            headers: {
              Authorization: `Bearer ${getToken()}`,
              'Content-Type': 'application/json'
            }
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || 'Unable to accept session.');
        }

        const updatedBookings = bookings.map(session =>
          session.id === sessionId
            ? { ...session, status: 'upcoming' }
            : session
        );

        setBookings(updatedBookings);
        setStats(calculateStats(updatedBookings));
      }
    );
  };

  // --------------------------------------------------
  // START SESSION
  // --------------------------------------------------

  const handleStartSession = (booking) => {
    navigate(`/session/${booking.id}`, {
      state: {
        session: booking,
        tutor
      }
    });
  };

  // --------------------------------------------------
  // CANCEL SESSION
  // --------------------------------------------------

  const handleCancelSession = (sessionId) => {
    openConfirmModal(
      'Are you sure you want to cancel this session?',
      async () => {
        const response = await fetch(
          `${API_BASE_URL}/sessions/${sessionId}/cancel`,
          {
            method: 'PUT',
            headers: {
              Authorization: `Bearer ${getToken()}`,
              'Content-Type': 'application/json'
            }
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || 'Unable to cancel session.');
        }

        const updatedBookings = bookings.map(session =>
          session.id === sessionId
            ? { ...session, status: 'cancelled' }
            : session
        );

        setBookings(updatedBookings);
        setStats(calculateStats(updatedBookings));
      }
    );
  };

  // --------------------------------------------------
  // FILTER SESSIONS
  // Status-based only. No date or time comparisons.
  // --------------------------------------------------

  const getFilteredBookings = () => {
    switch (activeTab) {
      case 'pending':
        return bookings.filter(isPending);

      case 'upcoming':
        return bookings.filter(isUpcoming);

      case 'in-progress':
        return bookings.filter(isInProgress);

      case 'completed':
        return bookings.filter(isCompleted);

      case 'cancelled':
        return bookings.filter(isCancelled);

      case 'all':
      default:
        return bookings;
    }
  };

  // --------------------------------------------------
  // DISPLAY HELPERS
  // --------------------------------------------------

  const getStudent = (booking) => {
    const studentId = booking.user_id || booking.student_id;

    return students[studentId] || {};
  };

  const getStudentName = (booking) => {
    const student = getStudent(booking);

    return (
      student.name ||
      student.full_name ||
      booking.student_name ||
      booking.user_name ||
      'Student'
    );
  };

  const getStudentEmail = (booking) => {
    const student = getStudent(booking);

    return (
      student.email ||
      booking.student_email ||
      ''
    );
  };

  const getStudentAvatar = (booking) => {
    const student = getStudent(booking);

    return (
      student.avatar_url ||
      student.profile_image ||
      student.profile_picture ||
      booking.student_avatar ||
      null
    );
  };

  const renderStudentAvatar = (booking) => {
    const avatar = getStudentAvatar(booking);
    const name = getStudentName(booking);

    if (avatar) {
      return (
        <img
          src={avatar}
          alt={name}
          className="student-avatar"
        />
      );
    }

    return (
      <div className="student-avatar student-avatar-placeholder">
        {name.charAt(0).toUpperCase()}
      </div>
    );
  };

  const formatSessionDate = (dateValue) => {
    if (!dateValue) return 'Date not provided';

    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) {
      return String(dateValue);
    }

    return date.toLocaleDateString('en-ZA', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const getStatusLabel = (status) => {
    const labels = {
      pending: 'Pending',
      upcoming: 'Upcoming',
      'in-progress': 'In Progress',
      started: 'In Progress',
      completed: 'Completed',
      ended: 'Completed',
      cancelled: 'Cancelled'
    };

    return labels[String(status || '').toLowerCase()] || status || 'Unknown';
  };

  const getStatusClass = (status) => {
    const normalized = String(status || '').toLowerCase();

    if (normalized === 'pending') return 'pending';
    if (normalized === 'upcoming') return 'upcoming';

    if (['in-progress', 'started'].includes(normalized)) {
      return 'in-progress';
    }

    if (['completed', 'ended'].includes(normalized)) {
      return 'completed';
    }

    if (normalized === 'cancelled') return 'cancelled';

    return 'default';
  };

  const getSessionTopic = (booking) => {
    return (
      booking.topic ||
      booking.subject ||
      booking.title ||
      'Tutoring Session'
    );
  };

  const getSessionDuration = (booking) => {
    return booking.duration
      ? `${booking.duration} minutes`
      : 'Duration not specified';
  };

  // --------------------------------------------------
  // GOOGLE CALENDAR
  // --------------------------------------------------

  const generateGoogleCalendarUrl = (session) => {
    const title = encodeURIComponent(
      `Tutoring Session - ${getStudentName(session)}`
    );

    const details = encodeURIComponent(
      `${getSessionTopic(session)}\n${session.notes || ''}`
    );

    const location = encodeURIComponent(
      session.location || 'Online'
    );

    const startDate = session.date
      ? String(session.date).replace(/[-:]/g, '').replace(/\.\d{3}/, '')
      : '';

    const params = new URLSearchParams({
      action: 'TEMPLATE',
      text: title,
      details,
      location
    });

    if (startDate) {
      params.set('dates', startDate);
    }

    return `https://calendar.google.com/calendar/render?${params.toString()}`;
  };

  // --------------------------------------------------
  // SESSION CARD
  // --------------------------------------------------

  const renderSessionCard = (booking) => {
    const status = getSessionStatus(booking);

    return (
      <div className="session-card" key={booking.id}>
        <div className="session-card-header">
          <div className="session-student-info">
            {renderStudentAvatar(booking)}

            <div className="student-details">
              <h3>{getStudentName(booking)}</h3>
              <p>{getStudentEmail(booking)}</p>
            </div>
          </div>

          <span className={`status-badge ${getStatusClass(status)}`}>
            {getStatusLabel(status)}
          </span>
        </div>

        <div className="session-card-body">
          <h4>{getSessionTopic(booking)}</h4>

          <div className="session-details-grid">
            <div className="session-detail">
              <Calendar size={16} />
              <span>{formatSessionDate(booking.date)}</span>
            </div>

            <div className="session-detail">
              <Clock size={16} />
              <span>{getSessionDuration(booking)}</span>
            </div>

            <div className="session-detail">
              <BookOpen size={16} />
              <span>
                {booking.subject || booking.topic || 'General tutoring'}
              </span>
            </div>
          </div>

          {booking.notes && (
            <div className="session-notes">
              <p>{booking.notes}</p>
            </div>
          )}
        </div>

        <div className="session-card-actions">
          {isPending(booking) && (
            <>
              <button
                className="btn btn-primary"
                onClick={() => handleAcceptSession(booking.id)}
              >
                <CheckCircle size={16} />
                Accept Session
              </button>

              <button
                className="btn btn-danger-outline"
                onClick={() => handleCancelSession(booking.id)}
              >
                <XCircle size={16} />
                Decline
              </button>
            </>
          )}

          {isUpcoming(booking) && (
            <>
              <button
                className="btn btn-primary"
                onClick={() => handleStartSession(booking)}
              >
                <Play size={16} />
                Start Session
              </button>

              <a
                className="btn btn-secondary"
                href={generateGoogleCalendarUrl(booking)}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Calendar size={16} />
                Add to Calendar
                <ExternalLink size={14} />
              </a>

              <button
                className="btn btn-danger-outline"
                onClick={() => handleCancelSession(booking.id)}
              >
                <XCircle size={16} />
                Cancel
              </button>
            </>
          )}

          {isInProgress(booking) && (
            <button
              className="btn btn-primary"
              onClick={() => handleStartSession(booking)}
            >
              <Video size={16} />
              Open Session
            </button>
          )}

          {isCompleted(booking) && (
            <span className="session-completed-label">
              <CheckCircle size={16} />
              Session completed
            </span>
          )}

          {isCancelled(booking) && (
            <span className="session-cancelled-label">
              <XCircle size={16} />
              Session cancelled
            </span>
          )}
        </div>
      </div>
    );
  };

  // --------------------------------------------------
  // CALENDAR VIEW
  // --------------------------------------------------

  const renderCalendarView = () => {
    const filteredBookings = getFilteredBookings();

    const groupedSessions = filteredBookings.reduce(
      (groups, booking) => {
        const dateKey = booking.date
          ? String(booking.date).split('T')[0]
          : 'Date not provided';

        if (!groups[dateKey]) {
          groups[dateKey] = [];
        }

        groups[dateKey].push(booking);

        return groups;
      },
      {}
    );

    const groupedDates = Object.keys(groupedSessions).sort();

    if (filteredBookings.length === 0) {
      return renderEmptyState();
    }

    return (
      <div className="calendar-view">
        {groupedDates.map(date => (
          <div className="calendar-date-group" key={date}>
            <div className="calendar-date-heading">
              <Calendar size={18} />
              <h3>
                {date === 'Date not provided'
                  ? date
                  : formatSessionDate(date)}
              </h3>
            </div>

            <div className="calendar-session-list">
              {groupedSessions[date].map(renderSessionCard)}
            </div>
          </div>
        ))}
      </div>
    );
  };

  // --------------------------------------------------
  // EMPTY STATE
  // --------------------------------------------------

  const renderEmptyState = () => {
    const emptyMessages = {
      pending: {
        title: 'No pending sessions',
        description: 'New session requests will appear here.'
      },
      upcoming: {
        title: 'No upcoming sessions',
        description: 'Accepted sessions will appear here.'
      },
      'in-progress': {
        title: 'No sessions in progress',
        description: 'Sessions currently in progress will appear here.'
      },
      completed: {
        title: 'No completed sessions',
        description: 'Your completed sessions will appear here.'
      },
      cancelled: {
        title: 'No cancelled sessions',
        description: 'Cancelled sessions will appear here.'
      },
      all: {
        title: 'No sessions yet',
        description: 'Your tutoring sessions will appear here.'
      }
    };

    const message = emptyMessages[activeTab] || emptyMessages.all;

    return (
      <div className="empty-state">
        <div className="empty-state-icon">
          <Calendar size={32} />
        </div>

        <h3>{message.title}</h3>
        <p>{message.description}</p>
      </div>
    );
  };

  // --------------------------------------------------
  // LOADING
  // --------------------------------------------------

  if (loading) {
    return (
      <div className="tutor-dashboard-loading">
        <div className="loading-spinner"></div>
        <p>Loading your dashboard...</p>
      </div>
    );
  }

  // --------------------------------------------------
  // DASHBOARD UI
  // --------------------------------------------------

  const filteredBookings = getFilteredBookings();

  return (
    <div className="tutor-dashboard">
      <div className="tutor-dashboard-container">

        {/* HEADER */}
        <header className="dashboard-header">
          <div className="dashboard-header-content">
            <div>
              <p className="dashboard-eyebrow">TUTOR WORKSPACE</p>
              <h1>
                {tutor?.name ||
                  tutor?.full_name ||
                  'Tutor Dashboard'}
              </h1>

              <p className="dashboard-subtitle">
                Welcome back,{' '}
                {tutor?.name || tutor?.full_name || 'Tutor'}!
                Manage your sessions and help students succeed.
              </p>
            </div>

            <div className="dashboard-header-actions">
              <button
                className="btn btn-secondary"
                onClick={handleRefresh}
                disabled={loading}
              >
                <RefreshCw size={16} />
                Refresh
              </button>

              <button
                className="btn btn-secondary"
                onClick={() => navigate('/calendar')}
              >
                <Calendar size={16} />
                View Calendar
              </button>

              <button
                className="btn btn-danger-outline"
                onClick={() => authService.logout()}
              >
                <LogOut size={16} />
                Sign Out
              </button>
            </div>
          </div>
        </header>

        {/* ERROR MESSAGE */}
        {error && (
          <div className="dashboard-error">
            <AlertCircle size={18} />
            <span>{error}</span>

            <button onClick={() => setError('')}>
              <X size={16} />
            </button>
          </div>
        )}

        {/* STATISTICS */}
        <section className="dashboard-stats">
          <div className="stat-card">
            <div className="stat-icon total">
              <BookOpen size={22} />
            </div>

            <div className="stat-content">
              <span>Total Sessions</span>
              <strong>{stats.totalSessions}</strong>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon pending">
              <AlertCircle size={22} />
            </div>

            <div className="stat-content">
              <span>Pending</span>
              <strong>{stats.pending}</strong>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon upcoming">
              <Calendar size={22} />
            </div>

            <div className="stat-content">
              <span>Upcoming</span>
              <strong>{stats.upcoming}</strong>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon in-progress">
              <Play size={22} />
            </div>

            <div className="stat-content">
              <span>In Progress</span>
              <strong>{stats.inProgress}</strong>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon completed">
              <CheckCircle size={22} />
            </div>

            <div className="stat-content">
              <span>Completed</span>
              <strong>{stats.completed}</strong>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon cancelled">
              <XCircle size={22} />
            </div>

            <div className="stat-content">
              <span>Cancelled</span>
              <strong>{stats.cancelled}</strong>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon students">
              <Users size={22} />
            </div>

            <div className="stat-content">
              <span>Students</span>
              <strong>{stats.students}</strong>
            </div>
          </div>
        </section>

        {/* SESSIONS */}
        <section className="sessions-section">
          <div className="sessions-section-header">
            <div>
              <h2>Your Sessions</h2>
              <p>Manage and track your tutoring sessions.</p>
            </div>

            <div className="view-mode-toggle">
              <button
                className={viewMode === 'list' ? 'active' : ''}
                onClick={() => setViewMode('list')}
                title="List view"
              >
                <List size={18} />
                List
              </button>

              <button
                className={viewMode === 'calendar' ? 'active' : ''}
                onClick={() => setViewMode('calendar')}
                title="Calendar view"
              >
                <LayoutGrid size={18} />
                Calendar
              </button>
            </div>
          </div>

          {/* TABS */}
          <div className="session-tabs">
            <button
              className={activeTab === 'pending' ? 'active' : ''}
              onClick={() => setActiveTab('pending')}
            >
              Pending
              <span>{stats.pending}</span>
            </button>

            <button
              className={activeTab === 'upcoming' ? 'active' : ''}
              onClick={() => setActiveTab('upcoming')}
            >
              Upcoming
              <span>{stats.upcoming}</span>
            </button>

            <button
              className={activeTab === 'in-progress' ? 'active' : ''}
              onClick={() => setActiveTab('in-progress')}
            >
              In Progress
              <span>{stats.inProgress}</span>
            </button>

            <button
              className={activeTab === 'completed' ? 'active' : ''}
              onClick={() => setActiveTab('completed')}
            >
              Completed
              <span>{stats.completed}</span>
            </button>

            <button
              className={activeTab === 'cancelled' ? 'active' : ''}
              onClick={() => setActiveTab('cancelled')}
            >
              Cancelled
              <span>{stats.cancelled}</span>
            </button>

            <button
              className={activeTab === 'all' ? 'active' : ''}
              onClick={() => setActiveTab('all')}
            >
              All
              <span>{stats.totalSessions}</span>
            </button>
          </div>

          {/* SESSION CONTENT */}
          <div className="sessions-content">
            {filteredBookings.length === 0 ? (
              renderEmptyState()
            ) : viewMode === 'list' ? (
              <div className="sessions-list">
                {filteredBookings.map(renderSessionCard)}
              </div>
            ) : (
              renderCalendarView()
            )}
          </div>
        </section>
      </div>

      {/* CONFIRMATION MODAL */}
      {showConfirmModal && (
        <div className="modal-overlay">
          <div className="confirmation-modal">
            <button
              className="modal-close"
              onClick={closeConfirmModal}
              disabled={processing}
            >
              <X size={20} />
            </button>

            <div className="modal-icon">
              <AlertCircle size={26} />
            </div>

            <h3>Confirm Action</h3>
            <p>{confirmMessage}</p>

            <div className="modal-actions">
              <button
                className="btn btn-secondary"
                onClick={closeConfirmModal}
                disabled={processing}
              >
                Go Back
              </button>

              <button
                className="btn btn-primary"
                onClick={executeConfirmAction}
                disabled={processing}
              >
                {processing ? 'Processing...' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TutorDashboard;
