// src/pages/Tutors.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { tutorService } from '../services/tutorService';
import sessionService from '../services/sessionService';
import { authService } from '../services/authService';
import './Tutors.css';

const Tutors = () => {
  const navigate = useNavigate();
  const [tutors, setTutors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [booking, setBooking] = useState({ 
    tutorId: null, 
    date: '', 
    duration: 60, 
    topic: 'Mathematics' 
  });
  const [bookingLoading, setBookingLoading] = useState(false);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedTutor, setSelectedTutor] = useState(null);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [totalTutors, setTotalTutors] = useState(0);

  useEffect(() => {
    checkAuth();
    fetchTutors();
  }, []);

  const checkAuth = () => {
    const token = localStorage.getItem('accessToken');
    setIsAuthenticated(!!token);
  };

  // ============================================
  // FETCH REAL TUTORS FROM API
  // ============================================
  const fetchTutors = async () => {
    try {
      setLoading(true);
      setError('');
      
      console.log('📚 Fetching tutors from API...');
      const result = await tutorService.getTutors();
      console.log('📚 API Response:', result);
      
      if (result.success && result.tutors) {
        setTutors(result.tutors);
        setTotalTutors(result.totalTutors || 0);
        console.log('✅ Loaded', result.tutors.length, 'shifts with tutors');
      } else {
        setError(result.error || 'Failed to load tutors');
        setTutors([]);
      }
    } catch (err) {
      console.error('❌ Error fetching tutors:', err);
      setError(err.message || 'Failed to load tutors');
      setTutors([]);
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // RENDER AVATAR - SUPPORTS REAL PHOTOS
  // ============================================
  const renderAvatar = (tutor) => {
    if (!tutor.avatar) {
      return '🧑‍🏫';
    }
    
    // Check if it's an image (base64 or URL)
    const isImage = tutor.avatar.startsWith('data:image') || 
                    tutor.avatar.startsWith('http') ||
                    tutor.avatar.startsWith('https');
    
    if (isImage) {
      return (
        <img 
          src={tutor.avatar} 
          alt={tutor.name} 
          className="tutor-avatar-img"
          onError={(e) => {
            // If image fails to load, show emoji fallback
            e.target.style.display = 'none';
            const parent = e.target.parentElement;
            if (parent) {
              parent.textContent = '🧑‍🏫';
              parent.style.fontSize = '28px';
              parent.style.display = 'flex';
              parent.style.alignItems = 'center';
              parent.style.justifyContent = 'center';
            }
          }}
        />
      );
    }
    
    return '🧑‍🏫';
  };

  const handleBookSession = (tutor) => {
    if (!isAuthenticated) {
      setSelectedTutor(tutor);
      setShowLoginPrompt(true);
      return;
    }

    setSelectedTutor(tutor);
    setBooking({
      tutorId: tutor.id,
      date: '',
      duration: 60,
      topic: tutor.subjects?.[0] || 'Mathematics'
    });
    setShowBookingModal(true);
  };

  const handleBookingSubmit = async (e) => {
    e.preventDefault();
    if (!booking.date) {
      alert('Please select a date and time');
      return;
    }

    try {
      setBookingLoading(true);
      
      const result = await sessionService.bookSession(
        booking.tutorId,
        booking.date,
        booking.duration,
        booking.topic
      );

      if (result.success) {
        setShowBookingModal(false);
        navigate(`/session/${result.session.id}`);
      } else {
        alert('❌ Failed to book session: ' + (result.error || 'Unknown error'));
      }
    } catch (error) {
      alert('❌ Failed to book session: ' + error.message);
    } finally {
      setBookingLoading(false);
    }
  };

  const handleLoginRedirect = () => {
    navigate('/login', { state: { from: '/tutors' } });
  };

  const LoginPrompt = () => (
    <div className="login-prompt-overlay" onClick={() => setShowLoginPrompt(false)}>
      <div className="login-prompt-modal" onClick={(e) => e.stopPropagation()}>
        <button className="login-prompt-close" onClick={() => setShowLoginPrompt(false)}>×</button>
        <div className="login-prompt-icon">🔒</div>
        <h3>Login Required</h3>
        <p>Please log in to book a session with <strong>{selectedTutor?.name}</strong>.</p>
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

  const BookingModal = () => (
    <div className="booking-modal-overlay" onClick={() => setShowBookingModal(false)}>
      <div className="booking-modal" onClick={(e) => e.stopPropagation()}>
        <button className="booking-modal-close" onClick={() => setShowBookingModal(false)}>×</button>
        <h3>📚 Book Session with {selectedTutor?.name}</h3>
        
        <form onSubmit={handleBookingSubmit}>
          <div className="form-group">
            <label>📅 Date & Time</label>
            <input
              type="datetime-local"
              value={booking.date}
              onChange={(e) => setBooking({ ...booking, date: e.target.value })}
              required
              min={new Date(Date.now() + 3600000).toISOString().slice(0, 16)}
            />
          </div>

          <div className="form-group">
            <label>⏱️ Duration</label>
            <select
              value={booking.duration}
              onChange={(e) => setBooking({ ...booking, duration: parseInt(e.target.value) })}
            >
              <option value={30}>30 minutes</option>
              <option value={60}>60 minutes</option>
              <option value={90}>90 minutes</option>
              <option value={120}>120 minutes</option>
            </select>
          </div>

          <div className="form-group">
            <label>📖 Topic</label>
            <div className="topic-input-group">
              <select
                value={booking.topic}
                onChange={(e) => setBooking({ ...booking, topic: e.target.value })}
                className="topic-select"
              >
                <option value="Mathematics">📐 Mathematics</option>
                <option value="Algebra">📐 Algebra</option>
                <option value="Geometry">📐 Geometry</option>
                <option value="Trigonometry">📐 Trigonometry</option>
                <option value="Calculus">∫ Calculus</option>
                <option value="Statistics">📊 Statistics</option>
                <option value="Linear Algebra">📊 Linear Algebra</option>
                <option value="Differential Equations">📈 Differential Equations</option>
                <option value="Matrices">🔢 Matrices</option>
                <option value="Functions">📈 Functions</option>
                <option value="Financial Mathematics">💰 Financial Mathematics</option>
                <option value="Other">📝 Other (type below)</option>
              </select>
            </div>
            {booking.topic === 'Other' && (
              <input
                type="text"
                placeholder="Enter your topic..."
                value={booking.customTopic || ''}
                onChange={(e) => setBooking({ ...booking, customTopic: e.target.value, topic: e.target.value })}
                className="topic-custom-input"
              />
            )}
          </div>

          <button 
            type="submit" 
            className="btn-primary" 
            disabled={bookingLoading}
          >
            {bookingLoading ? '⏳ Booking...' : '✅ Confirm Booking'}
          </button>
        </form>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="page-loading">
        <div className="loading-spinner"></div>
        <p>Loading tutors...</p>
      </div>
    );
  }

  if (error) {
    return <div className="page-error">Error: {error}</div>;
  }

  return (
    <div className="tutors-page">
      {showLoginPrompt && <LoginPrompt />}
      {showBookingModal && <BookingModal />}

      <div className="tutors-page-header">
        <h1>👨‍🏫 Our Expert Tutors</h1>
        <p>{totalTutors} Centralised Tutors • 24/7 Global Coverage</p>
        {!isAuthenticated && (
          <div className="tutors-auth-banner">
            <span>🔐 Please <button onClick={() => navigate('/login', { state: { from: '/tutors' } })}>login</button> to book sessions</span>
          </div>
        )}
      </div>

      <div className="tutors-page-grid">
        {tutors && tutors.length > 0 ? (
          tutors.map((shift) => (
            <div key={shift.id || shift.name} className="tutors-page-shift">
              <div className="tutors-page-shift-header">
                <h3>{shift.name}</h3>
                <span className="tutors-page-shift-time">{shift.time}</span>
              </div>
              <div className="tutors-page-hubs">
                {shift.hubs?.map((hub, idx) => (
                  <span key={idx}>{hub}</span>
                ))}
              </div>
              <div className="tutors-page-tutor-list">
                {shift.tutors && shift.tutors.length > 0 ? (
                  shift.tutors.map((tutor) => (
                    <div key={tutor.id} className="tutors-page-tutor-card">
                      <div className="tutors-page-tutor-avatar">
                        {renderAvatar(tutor)}
                      </div>
                      <div className="tutors-page-tutor-info">
                        <div className="tutors-page-tutor-name-row">
                          <h4>{tutor.name}</h4>
                          <span className="tutors-page-tutor-tier">{tutor.tier}</span>
                        </div>
                        <div className="tutors-page-tutor-subjects">
                          {tutor.subjects?.map((subject, idx) => (
                            <span key={idx}>{subject}</span>
                          ))}
                        </div>
                      </div>
                      <button 
                        className="book-session-btn"
                        onClick={() => handleBookSession(tutor)}
                      >
                        📚 Book Session
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="tutors-page-empty">
                    <p>No tutors available for this shift.</p>
                    <p className="empty-sub">Check back during shift hours.</p>
                  </div>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="tutors-page-empty-state">
            <p>No tutors available at the moment.</p>
            <p className="empty-sub">Please check back later.</p>
          </div>
        )}
      </div>

      <div className="tutors-page-total">
        {tutors.length} Shifts × {tutors.reduce((acc, s) => acc + (s.tutors?.length || 0), 0)} Tutors = {totalTutors} Centralised Tutors Total
      </div>
    </div>
  );
};

export default Tutors;