// src/pages/Tutors.js - COMPLETE WITH FULL PAGE BACKGROUND + BECOME A TUTOR + TRACK APPLICATION BANNER
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
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
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [bookingResult, setBookingResult] = useState(null);
  
  // ===== VIDEO MODAL STATE =====
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [videoTutor, setVideoTutor] = useState(null);

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

  // ===== VIDEO FUNCTIONS =====
  const handleWatchIntro = (tutor, e) => {
    e.stopPropagation();
    setVideoTutor(tutor);
    setShowVideoModal(true);
  };

  const hasVideo = (tutor) => {
    return tutor.intro_video_url && tutor.intro_video_thumbnail;
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
  // GET AVATAR COLOR FOR FALLBACK
  // ============================================
  const getAvatarColor = (name) => {
    const colors = ['#4f46e5', '#7c3aed', '#059669', '#10b981', '#dc2626', '#f59e0b', '#8b5cf6', '#ec4899'];
    if (!name) return colors[0];
    const index = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[index % colors.length];
  };

  const getInitials = (name) => {
    if (!name) return 'T';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  // ============================================
  // RENDER VIDEO THUMBNAIL - WITH IMPROVED NO-VIDEO PLACEHOLDER
  // ============================================
  const renderVideoThumbnail = (tutor) => {
    const hasVideoFile = hasVideo(tutor);
    const duration = tutor.intro_video_duration || 0;
    const views = tutor.intro_video_views || 0;

    if (!hasVideoFile) {
      const avatarColor = getAvatarColor(tutor.name);
      const initials = getInitials(tutor.name);
      
      return (
        <div className="video-placeholder-no-video">
          <div className="no-video-avatar-wrapper">
            {tutor.avatar ? (
              <img 
                src={tutor.avatar} 
                alt={tutor.name}
                className="no-video-blurred-avatar"
                loading="lazy"
              />
            ) : (
              <div 
                className="no-video-blurred-initial"
                style={{ background: avatarColor }}
              >
                {initials}
              </div>
            )}
            <div className="no-video-overlay">
              <span className="no-video-icon">📹</span>
              <span className="no-video-text">Get to know me</span>
              <span className="no-video-subtext">Click to learn more</span>
            </div>
          </div>
        </div>
      );
    }

    const formatDuration = (seconds) => {
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const formatViews = (count) => {
      if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
      if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
      return count;
    };

    return (
      <div className="video-thumbnail-container" onClick={(e) => handleWatchIntro(tutor, e)}>
        <img 
          src={tutor.intro_video_thumbnail || '/images/video-placeholder.jpg'} 
          alt={`${tutor.name} intro video`}
          className="video-thumbnail"
          loading="lazy"
          onError={(e) => {
            e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="300" height="169" viewBox="0 0 300 169"%3E%3Crect width="300" height="169" fill="%23141b2d"/%3E%3Ctext x="150" y="85" text-anchor="middle" fill="%234f46e5" font-size="48"%3E🎬%3C/text%3E%3Ctext x="150" y="115" text-anchor="middle" fill="%2394a3b8" font-size="14"%3ENo thumbnail%3C/text%3E%3C/svg%3E';
          }}
        />
        <div className="video-play-overlay">
          <div className="play-button">
            <span className="play-icon">▶</span>
          </div>
        </div>
        <div className="video-duration-badge">
          ⏱️ {formatDuration(duration)}
        </div>
        {views > 0 && (
          <div className="video-views-badge">
            👁️ {formatViews(views)} views
          </div>
        )}
      </div>
    );
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
        setBookingResult(result);
        setSuccessMessage(`✅ Session booked successfully with ${selectedTutor?.name}!`);
        setShowSuccessModal(true);
        setTimeout(() => {
          setShowSuccessModal(false);
          navigate('/my-sessions');
        }, 3000);
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
  // VIDEO MODAL
  // ============================================
  const VideoModal = () => {
    if (!showVideoModal || !videoTutor) return null;

    const formatDuration = (seconds) => {
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
      <div className="video-modal-overlay" onClick={() => setShowVideoModal(false)}>
        <div className="video-modal-content" onClick={(e) => e.stopPropagation()}>
          <button className="video-modal-close" onClick={() => setShowVideoModal(false)}>×</button>
          <div className="video-wrapper">
            {videoTutor.intro_video_url ? (
              <video
                src={videoTutor.intro_video_url}
                controls
                autoPlay
                className="video-modal-player"
                poster={videoTutor.intro_video_thumbnail}
              />
            ) : (
              <div className="video-not-available">
                <span>🎬</span>
                <p>Video not available</p>
              </div>
            )}
          </div>
          <div className="video-modal-info">
            <h4>{videoTutor.name} - Introduction</h4>
            <p className="video-modal-description">
              Meet your potential tutor and learn about their teaching style!
            </p>
            {videoTutor.intro_video_duration > 0 && (
              <span className="video-modal-duration">⏱️ {formatDuration(videoTutor.intro_video_duration)}</span>
            )}
            {videoTutor.intro_video_views > 0 && (
              <span className="video-modal-views">👁️ {videoTutor.intro_video_views} views</span>
            )}
          </div>
        </div>
      </div>
    );
  };

  // ============================================
  // SUCCESS MODAL
  // ============================================
  const SuccessModal = () => {
    if (!showSuccessModal) return null;

    return (
      <div className="success-modal-overlay">
        <div className="success-modal">
          <div className="success-modal-icon">✅</div>
          <h3>Session Booked!</h3>
          <p>{successMessage}</p>
          <div className="success-modal-details">
            <div className="success-detail-item">
              <span>Tutor</span>
              <strong>{selectedTutor?.name}</strong>
            </div>
            <div className="success-detail-item">
              <span>Date</span>
              <strong>{new Date(booking.date).toLocaleString()}</strong>
            </div>
            <div className="success-detail-item">
              <span>Duration</span>
              <strong>{booking.duration} minutes</strong>
            </div>
            <div className="success-detail-item">
              <span>Topic</span>
              <strong>{booking.topic}</strong>
            </div>
          </div>
          <p className="success-modal-note">Redirecting to your sessions...</p>
        </div>
      </div>
    );
  };

  // ============================================
  // TUTOR MODAL - FULL PROFILE
  // ============================================
  const TutorModal = () => {
    if (!viewingTutor) return null;

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
                {shiftName && (
                  <div className="profile-section">
                    <h3>⏰ Availability</h3>
                    <p>{shiftName}</p>
                    {viewingTutor.shiftTime && (
                      <p className="shift-time">{viewingTutor.shiftTime}</p>
                    )}
                  </div>
                )}
                {viewingTutor.education && (
                  <div className="profile-section">
                    <h3>🎓 Education</h3>
                    <p>{viewingTutor.education}</p>
                  </div>
                )}
                {viewingTutor.yearsExperience > 0 && (
                  <div className="profile-section">
                    <h3>📅 Experience</h3>
                    <p>{viewingTutor.yearsExperience} years</p>
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

  // ============================================
  // MAIN RENDER WITH WRAPPER FOR FULL BACKGROUND
  // ============================================
  return (
    <div className="tutors-page-wrapper">
      {showLoginPrompt && <LoginPrompt />}
      {showBookingModal && <BookingModal />}
      {showTutorModal && <TutorModal />}
      {showVideoModal && <VideoModal />}
      <SuccessModal />

      <div className="tutors-page">

        {/* ============================================
            BECOME A TUTOR + TRACK APPLICATION CTA BANNER
           ============================================ */}
        <section className="become-tutor-banner">
          <div className="btb-inner">
            <div className="btb-left">
              <span className="btb-icon">👨‍🏫</span>
              <div>
                <h2>Are you a mathematics tutor?</h2>
                <p>Join our network. Teach students across 9 global regions. Earn on your terms.</p>
              </div>
            </div>
            <div className="btb-right">
              <div className="btb-buttons">
                <Link to="/become-a-tutor" className="btb-btn-primary">
                  Become a Tutor
                </Link>
                <Link to="/track-application" className="btb-btn-secondary">
                  📄 Track Application
                </Link>
              </div>
              <div className="btb-stats">
                <span>💰 R250–600/hr</span>
                <span>🌍 24/7 shifts</span>
                <span>📄 No signup fee</span>
              </div>
            </div>
          </div>
        </section>

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
                        <div className="tutor-card-video-section">
                          {renderVideoThumbnail(tutor)}
                        </div>

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
                        <div className="tutor-card-actions">
                          <button 
                            className="book-session-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleBookSession(tutor);
                            }}
                          >
                            📚 Book Session
                          </button>
                          {hasVideo(tutor) && (
                            <button 
                              className="watch-intro-btn"
                              onClick={(e) => handleWatchIntro(tutor, e)}
                            >
                              ▶ Watch Intro
                            </button>
                          )}
                        </div>
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
    </div>
  );
};

export default Tutors;