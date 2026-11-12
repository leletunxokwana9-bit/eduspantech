// src/pages/Tutors.js
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import './Tutors.css';

// Safely handle imports so a missing file doesn't crash the app
let tutorService = {};
let sessionService = {};
try {
  const tMod = require('../services/tutorService');
  tutorService = tMod.tutorService || tMod.default || tMod;
  const sMod = require('../services/sessionService');
  sessionService = sMod.default || sMod;
} catch (e) {
  console.warn("Services missing:", e);
}

// ============================================
// HELPERS (outside component so they are stable)
// ============================================
const SHIFT_COLORS = {
  APAC: '#38bdf8',
  SOUTH_ASIA: '#fb923c',
  AFRICA_EUROPE: '#34d399',
  AMERICAS: '#f472b6'
};
const FALLBACK_COLORS = ['#38bdf8', '#fb923c', '#34d399', '#f472b6', '#a78bfa'];
const NEUTRAL_COLOR = '#b4bce0';

const SHIFT_LABELS = {
  APAC: 'APAC',
  SOUTH_ASIA: 'South Asia',
  AFRICA_EUROPE: 'Africa & Europe',
  AMERICAS: 'Americas'
};

const getShiftKey = (shift) => String(shift?.name || '').toUpperCase().replace(/\s+/g, '_');

const isFlexibleShift = (shift) => {
  const key = getShiftKey(shift);
  return key === 'UNASSIGNED' || !shift?.time || /24\s*\/\s*7/.test(shift.time);
};

const getShiftColor = (shift, index) => {
  if (isFlexibleShift(shift)) return NEUTRAL_COLOR;
  return SHIFT_COLORS[getShiftKey(shift)] || FALLBACK_COLORS[index % FALLBACK_COLORS.length];
};

const getShiftLabel = (shift) => {
  const key = getShiftKey(shift);
  if (key === 'UNASSIGNED') return 'Flexible · 24/7';
  if (SHIFT_LABELS[key]) return SHIFT_LABELS[key];
  return String(shift?.name || '')
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
};

// "08:00:00 - 15:00:00" -> "08:00 – 15:00"
const formatShiftTime = (time) => {
  if (!time) return 'Any time';
  const parts = String(time).match(/\d{1,2}:\d{2}/g);
  if (parts && parts.length >= 2) return `${parts[0]} – ${parts[1]}`;
  return time;
};

const getTierNumber = (tier) => {
  const m = String(tier || '').match(/\d/);
  return m ? m[0] : null;
};

const getTierLabel = (tier) => {
  if (!tier) return '';
  const n = getTierNumber(tier);
  return n ? `Tier ${n}` : String(tier).replace(/_/g, ' ');
};

const getInitials = (name) => {
  if (!name) return 'T';
  const words = name
    .replace(/\./g, '')
    .split(' ')
    .filter((w) => w && !['Mr', 'Ms', 'Mrs', 'Dr', 'Prof'].includes(w));
  const list = words.length ? words : name.split(' ');
  return ((list[0]?.[0] || '') + (list.length > 1 ? list[list.length - 1][0] : '')).toUpperCase() || 'T';
};

const formatDuration = (seconds) => {
  const total = Math.max(0, Math.floor(seconds || 0));
  const mins = Math.floor(total / 60);
  const secs = total % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const formatViews = (count) => {
  if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
  if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
  return count;
};

const hasVideo = (tutor) => !!(tutor.intro_video_url && tutor.intro_video_thumbnail);

const isImageSrc = (src) =>
  !!src && (src.startsWith('data:image') || src.startsWith('http://') || src.startsWith('https://'));

// Avatar: real photo if available, otherwise initials
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
// COMPONENT
// ============================================
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

      if (!tutorService || !tutorService.getTutors) {
         throw new Error("Tutor service not available");
      }

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

  // ============================================
  // VIDEO THUMBNAIL
  // ============================================
  const renderVideoThumbnail = (tutor) => {
    if (!hasVideo(tutor)) {
      return (
        <div className="video-placeholder-no-video">
          <div className="no-video-bg">
            {isImageSrc(tutor.avatar) ? (
              <img src={tutor.avatar} alt="" className="no-video-blurred-avatar" loading="lazy" />
            ) : (
              <span className="no-video-blurred-initial">{getInitials(tutor.name)}</span>
            )}
          </div>
          <div className="no-video-overlay">
            <span className="no-video-text">Get to know me</span>
            <span className="no-video-subtext">Click to view profile</span>
          </div>
        </div>
      );
    }

    const duration = tutor.intro_video_duration || 0;
    const views = tutor.intro_video_views || 0;

    return (
      <div
        className="video-thumbnail-container"
        role="button"
        tabIndex={0}
        aria-label={`Play intro video from ${tutor.name}`}
        onClick={(e) => handleWatchIntro(tutor, e)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleWatchIntro(tutor, e);
          }
        }}
      >
        <img
          src={tutor.intro_video_thumbnail || '/images/video-placeholder.jpg'}
          alt={`${tutor.name} intro video`}
          className="video-thumbnail"
          loading="lazy"
          onError={(e) => {
            e.target.style.visibility = 'hidden';
          }}
        />
        <div className="video-play-overlay">
          <div className="play-button">
            <span className="play-icon">▶</span>
          </div>
        </div>
        <div className="video-duration-badge">{formatDuration(duration)}</div>
        {views > 0 && <div className="video-views-badge">{formatViews(views)} views</div>}
      </div>
    );
  };

  // ============================================
  // HANDLE TUTOR CARD CLICK
  // ============================================
  const handleTutorCardClick = (tutor) => {
    setViewingTutor(tutor);
    setShowTutorModal(true);
    setShowFullProfile(false);
  };

  const handleViewFullProfile = () => {
    setShowFullProfile(true);
  };

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

    if (!booking.tutorId) {
      alert('Please select a tutor');
      return;
    }

    try {
      setBookingLoading(true);
      
      if (!sessionService || !sessionService.bookSession) {
        throw new Error("Session service not available");
      }

      const result = await sessionService.bookSession(
        booking.tutorId,
        booking.date,
        booking.duration,
        booking.topic
      );

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

    return (
      <div className="video-modal-overlay" onClick={() => setShowVideoModal(false)}>
        <div className="video-modal-content" onClick={(e) => e.stopPropagation()}>
          <button className="video-modal-close" onClick={() => setShowVideoModal(false)} aria-label="Close video">×</button>
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
          </div>
          <p className="success-modal-note">Redirecting to your sessions...</p>
        </div>
      </div>
    );
  };

  // ============================================
  // TUTOR MODAL
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
          <button className="tutor-modal-close" onClick={() => setShowTutorModal(false)} aria-label="Close">×</button>

          {!showFullProfile ? (
            <div className="tutor-modal-content">
              <div className="tutor-modal-avatar">
                <TutorAvatar tutor={viewingTutor} />
              </div>
              <h2 className="tutor-modal-name">{viewingTutor.name}</h2>
              {viewingTutor.tier && (
                <span className="tutor-modal-tier">{getTierLabel(viewingTutor.tier)}</span>
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
                  <span className="shift-label">⏰ {SHIFT_LABELS[shiftName] || shiftName}</span>
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
                {shiftName && (
                  <div className="profile-section">
                    <h3>⏰ Availability</h3>
                    <p>{SHIFT_LABELS[shiftName] || shiftName}</p>
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
        <button className="login-prompt-close" onClick={() => setShowLoginPrompt(false)} aria-label="Close">×</button>
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
      </div>
    </div>
  );

  // ============================================
  // BOOKING MODAL
  // ============================================
  const BookingModal = () => (
    <div className="booking-modal-overlay" onClick={() => setShowBookingModal(false)}>
      <div className="booking-modal" onClick={(e) => e.stopPropagation()}>
        <button className="booking-modal-close" onClick={() => setShowBookingModal(false)} aria-label="Close">×</button>
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
          <button type="submit" className="btn-primary" disabled={bookingLoading}>
            {bookingLoading ? '⏳ Booking...' : '✅ Confirm Booking'}
          </button>
        </form>
      </div>
    </div>
  );

  // ============================================
  // TUTOR CARD
  // ============================================
  const renderTutorCard = (tutor) => {
    const tierNum = getTierNumber(tutor.tier);
    const videoAvailable = hasVideo(tutor);

    return (
      <article key={tutor.id} className="tutor-card" onClick={() => handleTutorCardClick(tutor)}>
        <div className="tutor-card-video-section">{renderVideoThumbnail(tutor)}</div>

        <div className="tutor-card-body">
          <div className="tutor-card-head">
            <div className="tutor-card-avatar">
              <TutorAvatar tutor={tutor} />
            </div>
            <div className="tutor-card-id">
              <h4>{tutor.name}</h4>
              {tutor.tier && (
                <span className={`tier-badge tier-${tierNum || 'x'}`}>{getTierLabel(tutor.tier)}</span>
              )}
            </div>
          </div>

          {tutor.subjects && tutor.subjects.length > 0 && (
            <div className="tutor-card-subjects">
              {tutor.subjects.slice(0, 3).map((subject, idx) => (
                <span key={idx}>{subject}</span>
              ))}
              {tutor.subjects.length > 3 && <span>+{tutor.subjects.length - 3}</span>}
            </div>
          )}

          <div className="tutor-card-actions">
            <button
              className="book-session-btn"
              onClick={(e) => {
                e.stopPropagation();
                handleBookSession(tutor);
              }}
            >
              Book Session
            </button>
            {videoAvailable ? (
              <button className="watch-intro-btn" onClick={(e) => handleWatchIntro(tutor, e)}>
                ▶ Watch Intro
              </button>
            ) : (
              <button
                className="watch-intro-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  handleTutorCardClick(tutor);
                }}
              >
                View Profile
              </button>
            )}
          </div>
        </div>
      </article>
    );
  };

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

  const tutorCountTotal = (tutors || []).reduce((acc, s) => acc + (s.tutors?.length || 0), 0);

  // ============================================
  // MAIN RENDER
  // ============================================
  return (
    <div className="tutors-page-wrapper">
      {showLoginPrompt && LoginPrompt()}
      {showBookingModal && BookingModal()}
      {showTutorModal && TutorModal()}
      {showVideoModal && VideoModal()}
      {SuccessModal()}

      <div className="tutors-page">

        {/* ===== BECOME A TUTOR BANNER ===== */}
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
            </div>
          </div>
        </section>

        {/* ===== HEADER ===== */}
        <div className="tutors-page-header">
          <h1>Our Expert Tutors</h1>
          <p>{totalTutors} Centralised Tutors • 24/7 Global Coverage</p>
          {!isAuthenticated && (
            <div className="tutors-auth-banner">
              <span>🔐 Please <button onClick={() => navigate('/login', { state: { from: '/tutors' } })}>login</button> to book sessions</span>
            </div>
          )}
        </div>

        {/* ===== CLEAN AVAILABILITY BANNER ===== */}
        <div className="availability-banner">
          <h3>🌍 Global Coverage</h3>
          <p>Tutors are strategically grouped by shift to ensure continuous, 24/7 academic support.</p>
        </div>

        {/* ===== SHIFT SECTIONS ===== */}
        <div className="tutors-page-sections">
          {tutors && tutors.length > 0 ? (
            tutors.map((shift, idx) => {
              const color = getShiftColor(shift, idx);
              const list = shift.tutors || [];
              return (
                <section
                  key={shift.id || shift.name}
                  className="shift-section"
                  style={{ '--accent': color }}
                >
                  <div className="shift-header">
                    <span className="shift-dot" />
                    <h2>{getShiftLabel(shift)}</h2>
                    <span className="shift-time-pill">{formatShiftTime(shift.time)}</span>
                    <span className="shift-count">
                      {list.length} {list.length === 1 ? 'tutor' : 'tutors'}
                    </span>
                  </div>

                  {list.length > 0 ? (
                    <div className="tutor-grid">{list.map(renderTutorCard)}</div>
                  ) : (
                    <div className="tutors-page-empty">
                      <p>No tutors available for this shift.</p>
                    </div>
                  )}
                </section>
              );
            })
          ) : (
            <div className="tutors-page-empty-state">
              <p>No tutors available at the moment.</p>
            </div>
          )}
        </div>

        <div className="tutors-page-total">
          {tutors.length} shifts · {totalTutors || tutorCountTotal} centralised tutors in total
        </div>
      </div>
    </div>
  );
};

export default Tutors;