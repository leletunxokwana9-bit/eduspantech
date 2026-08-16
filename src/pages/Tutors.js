// src/pages/Tutors.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { tutorService } from '../services/tutorService';
import sessionService from '../services/sessionService';
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
  const [showTutorModal, setShowTutorModal] = useState(false);
  const [viewingTutor, setViewingTutor] = useState(null);
  const [showFullProfile, setShowFullProfile] = useState(false);

  useEffect(() => {
    checkAuth();
    fetchTutors();
  }, []);

  const checkAuth = () => {
    const token = localStorage.getItem('accessToken');
    setIsAuthenticated(!!token);
  };

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
  // RENDER AVATAR - SHOW REAL OR DEFAULT
  // ============================================
  const renderAvatar = (tutor) => {
    if (!tutor.avatar) {
      return '🧑‍🏫';
    }

    const isImage = tutor.avatar.startsWith('data:image') || 
                    tutor.avatar.startsWith('http://') || 
                    tutor.avatar.startsWith('https://');

    if (isImage) {
      let imageUrl = tutor.avatar;
      if (imageUrl.startsWith('http')) {
        const separator = imageUrl.includes('?') ? '&' : '?';
        imageUrl = `${imageUrl}${separator}t=${Date.now()}`;
      }

      return (
        <img 
          src={imageUrl} 
          alt={tutor.name} 
          className="tutor-avatar-img"
          loading="lazy"
          onError={(e) => {
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

  // ============================================
  // HANDLE TUTOR CARD CLICK - SHOW MODAL
  // ============================================
  const handleTutorCardClick = (tutor) => {
    setViewingTutor(tutor);
    setShowTutorModal(true);
    setShowFullProfile(false);
  };

  const handleViewFullProfile = () => {
    setShowFullProfile(true);
  };

  // ============================================
  // HANDLE BOOK FROM MODAL
  // ============================================
  const handleBookFromModal = () => {
    if (!isAuthenticated) {
      setShowTutorModal(false);
      setSelectedTutor(viewingTutor);
      setShowLoginPrompt(true);
      return;
    }

    setShowTutorModal(false);
    setSelectedTutor(viewingTutor);
    setBooking({
      tutorId: viewingTutor.id,
      date: '',
      duration: 60,
      topic: viewingTutor.subjects?.[0] || 'Mathematics'
    });
    setShowBookingModal(true);
  };

  // ============================================
  // HANDLE BOOK SESSION
  // ============================================
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

  // ============================================
  // HANDLE BOOKING SUBMIT
  // ============================================
  const handleBookingSubmit = async (e) => {
    e.preventDefault();
    if (!booking.date) {
      alert('Please select a date and time');
      return;
    }

    if (!booking.tutorId) {
      alert('Please select a tutor');
      return;
    }

    try {
      setBookingLoading(true);
      
      console.log('📤 Booking data:', {
        tutorId: booking.tutorId,
        date: booking.date,
        duration: booking.duration,
        topic: booking.topic
      });
      
      const result = await sessionService.bookSession(
        booking.tutorId,
        booking.date,
        booking.duration,
        booking.topic
      );

      console.log('📥 Booking result:', result);

      if (result.success) {
        setShowBookingModal(false);
        alert('✅ Session booked successfully!');
        navigate('/my-sessions');
      } else {
        alert('❌ Failed to book session: ' + (result.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('❌ Booking error:', error);
      alert('❌ Failed to book session: ' + error.message);
    } finally {
      setBookingLoading(false);
    }
  };

  const handleLoginRedirect = () => {
    navigate('/login', { state: { from: '/tutors' } });
  };

  // ============================================
  // TUTOR MODAL - FULL PROFILE WITH ALL FIELDS
  // ============================================
  const TutorModal = () => {
    if (!viewingTutor) return null;

    // Get shift display name
    const getShiftName = (shiftId) => {
      const shiftMap = {
        '594a3d55-4388-4dec-8dd7-73c30a2488f3': 'APAC',
        'b35b41e1-e05a-4cef-8ff9-9c67d80af6c1': 'SOUTH_ASIA',
        '07a371b1-6ec0-44ec-a55c-6ab396abb0b5': 'AFRICA_EUROPE',
        '28606515-8920-42de-ad88-da7531f4f273': 'AMERICAS'
      };
      return shiftMap[shiftId] || null;
    };

    const shiftName = getShiftName(viewingTutor.shiftId);

    return (
      <div className="tutor-modal-overlay" onClick={() => setShowTutorModal(false)}>
        <div className="tutor-modal" onClick={(e) => e.stopPropagation()}>
          <button className="tutor-modal-close" onClick={() => setShowTutorModal(false)}>×</button>
          
          {!showFullProfile ? (
            // ===== QUICK VIEW =====
            <div className="tutor-modal-content">
              <div className="tutor-modal-avatar">
                {renderAvatar(viewingTutor)}
              </div>
              <h2 className="tutor-modal-name">{viewingTutor.name}</h2>
              
              {viewingTutor.tier && (
                <span className="tutor-modal-tier">{viewingTutor.tier}</span>
              )}
              
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

              {shiftName && (
                <div className="tutor-modal-shift">
                  <span className="shift-label">⏰ {shiftName}</span>
                </div>
              )}

              <div className="tutor-modal-actions">
                <button className="modal-btn primary" onClick={handleBookFromModal}>
                  📚 Book Session
                </button>
                <button className="modal-btn secondary" onClick={handleViewFullProfile}>
                  👤 View Full Profile
                </button>
                <button className="modal-btn cancel" onClick={() => setShowTutorModal(false)}>
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            // ============================================
            // FULL PROFILE VIEW - ALL FIELDS
            // ============================================
            <div className="tutor-modal-full-profile">
              <button className="back-btn" onClick={() => setShowFullProfile(false)}>
                ← Back
              </button>
              
              <div className="full-profile-header">
                <div className="full-profile-avatar">
                  {renderAvatar(viewingTutor)}
                </div>
                <div className="full-profile-info">
                  <h2>{viewingTutor.name}</h2>
                  {viewingTutor.tier && (
                    <span className="full-profile-tier">{viewingTutor.tier}</span>
                  )}
                  {viewingTutor.email && (
                    <p className="full-profile-email">{viewingTutor.email}</p>
                  )}
                </div>
              </div>

              <div className="full-profile-body">
                {/* ===== BIO / ABOUT ME ===== */}
                {viewingTutor.bio && (
                  <div className="profile-section">
                    <h3>📝 About Me</h3>
                    <p>{viewingTutor.bio}</p>
                  </div>
                )}

                {/* ===== SUBJECTS ===== */}
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

                {/* ===== SHIFT / AVAILABILITY ===== */}
                {shiftName && (
                  <div className="profile-section">
                    <h3>⏰ Availability</h3>
                    <p>{shiftName}</p>
                    {viewingTutor.shiftTime && (
                      <p className="shift-time">{viewingTutor.shiftTime}</p>
                    )}
                  </div>
                )}

                {/* ===== EDUCATION ===== */}
                {viewingTutor.education && (
                  <div className="profile-section">
                    <h3>🎓 Education</h3>
                    <p>{viewingTutor.education}</p>
                  </div>
                )}

                {/* ===== YEARS OF EXPERIENCE ===== */}
                {viewingTutor.yearsExperience > 0 && (
                  <div className="profile-section">
                    <h3>📅 Experience</h3>
                    <p>{viewingTutor.yearsExperience} years</p>
                  </div>
                )}

                {/* ===== PHONE ===== */}
                {viewingTutor.phone && (
                  <div className="profile-section">
                    <h3>📞 Contact</h3>
                    <p>{viewingTutor.phone}</p>
                  </div>
                )}

                {/* ===== LINKEDIN ===== */}
                {viewingTutor.linkedin && (
                  <div className="profile-section">
                    <h3>🔗 Connect</h3>
                    <a href={viewingTutor.linkedin} target="_blank" rel="noopener noreferrer" className="profile-link">
                      LinkedIn Profile
                    </a>
                  </div>
                )}

                {/* ===== WEBSITE ===== */}
                {viewingTutor.website && (
                  <div className="profile-section">
                    <h3>🌐 Website</h3>
                    <a href={viewingTutor.website} target="_blank" rel="noopener noreferrer" className="profile-link">
                      {viewingTutor.website}
                    </a>
                  </div>
                )}

                <button className="modal-btn primary full-profile-book" onClick={handleBookFromModal}>
                  📚 Book Session
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  // ============================================
  // LOGIN PROMPT
  // ============================================
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

  // ============================================
  // BOOKING MODAL
  // ============================================
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
      {showTutorModal && <TutorModal />}

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
                    <div 
                      key={tutor.id} 
                      className="tutors-page-tutor-card"
                      onClick={() => handleTutorCardClick(tutor)}
                    >
                      <div className="tutors-page-tutor-avatar">
                        {renderAvatar(tutor)}
                      </div>
                      <div className="tutors-page-tutor-info">
                        <div className="tutors-page-tutor-name-row">
                          <h4>{tutor.name}</h4>
                          {tutor.tier && (
                            <span className="tutors-page-tutor-tier">{tutor.tier}</span>
                          )}
                        </div>
                        {tutor.subjects && tutor.subjects.length > 0 && (
                          <div className="tutors-page-tutor-subjects">
                            {tutor.subjects.slice(0, 3).map((subject, idx) => (
                              <span key={idx}>{subject}</span>
                            ))}
                            {tutor.subjects.length > 3 && (
                              <span>+{tutor.subjects.length - 3}</span>
                            )}
                          </div>
                        )}
                      </div>
                      <button 
                        className="book-session-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleBookSession(tutor);
                        }}
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