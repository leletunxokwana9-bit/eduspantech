// src/pages/ParentDashboard.js
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';
import { API_BASE_URL } from '../services/api';
import { 
  Users, Calendar, Clock, BookOpen, TrendingUp, CheckCircle, AlertCircle,
  MessageSquare, ChevronDown, FileText, Video, Camera, LogOut, Upload, Trash2, X, Image as ImageIcon
} from 'lucide-react';
import './ParentDashboard.css';
import './Tutors.css'; // ✅ Reuse tutor modal styles

// ============================================
// TUTOR HELPERS (ported verbatim from Tutors.js)
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
// PARENT DASHBOARD
// ============================================
const ParentDashboard = () => {
  const navigate = useNavigate();
  const [parent, setParent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tagline, setTagline] = useState('Welcome back');
  
  // Avatar State
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [photoError, setPhotoError] = useState('');
  
  // File Inputs
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);
  
  // Modal States
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [showViewPhotoModal, setShowViewPhotoModal] = useState(false);

  // Children State
  const [children, setChildren] = useState([]);
  const [activeChildId, setActiveChildId] = useState(null);
  const [showChildDropdown, setShowChildDropdown] = useState(false);

  // Sessions State
  const [sessions, setSessions] = useState([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);

  // Link Child Modal State
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [studentEmail, setStudentEmail] = useState('');
  const [linkError, setLinkError] = useState('');
  const [linkSuccess, setLinkSuccess] = useState('');
  const [linkLoading, setLinkLoading] = useState(false);

  // ✅ Tutor Profile Modal State
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
        setSessions(data.sessions || []);
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

  // ✅ Tutor profile modal openers
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

  // ✅ Photo Management Handlers
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

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const triggerCameraInput = () => {
    cameraInputRef.current?.click();
  };

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

  const getAvatarInitial = (name) => name ? name.charAt(0).toUpperCase() : 'S';

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

      {/* Error Message */}
      {photoError && (
        <div className="profile-error" style={{ margin: '0 auto 20px', maxWidth: '1200px', padding: '0 32px' }}>
          {photoError}
        </div>
      )}

      {/* Child Selector Section */}
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
                <span className="stat-value">{activeChild.attendance || 'N/A'}</span>
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

      {/* Main Content Grid */}
      {activeChild ? (
        <div className="parent-content-grid">
          <div className="parent-main-column">
            
            <div className="dashboard-card">
              <div className="card-header">
                <div className="card-title">
                  <Calendar size={20} className="text-indigo" />
                  <h3>Upcoming Sessions</h3>
                </div>
                <button className="btn-link" onClick={() => navigate('/my-sessions')}>View All</button>
              </div>
              <div className="card-body">
                {sessionsLoading ? (
                  <div style={{ textAlign: 'center', padding: '20px', color: '#94a3b8' }}>Loading sessions...</div>
                ) : sessions.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '30px 20px', color: '#94a3b8' }}>
                    <Calendar size={40} style={{ margin: '0 auto 12px', color: '#4f46e5' }} />
                    <p style={{ margin: 0, fontSize: '14px' }}>No upcoming sessions scheduled</p>
                    {/* ✅ Personalized message with child's first name */}
                    <p style={{ margin: '4px 0 0', fontSize: '12px', opacity: 0.7 }}>
                      Book a session for {activeChild?.name?.split(' ')[0] || 'your child'}
                    </p>
                  </div>
                ) : (
                  <div className="schedule-list">
                    {sessions.map((session) => (
                      <div key={session.id} className="schedule-item">
                        <div className="schedule-date">
                          <span className="day">{session.day}</span>
                          <span className="month">{session.month}</span>
                        </div>
                        <div className="schedule-details">
                          <h4>{session.topic}</h4>
                          {/* ✅ Clickable tutor name — looks like a link, opens tutor modal */}
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
                            With {session.tutorName}
                          </span>
                          <div className="schedule-time"><Clock size={14} /> {session.timeRange}</div>
                        </div>
                        <div className="schedule-actions">
                          <button className="btn-icon" title="Message Tutor"><MessageSquare size={16} /></button>
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
                <div className="report-item">
                  <div className="report-icon"><BookOpen size={20} /></div>
                  <div className="report-details">
                    <h4>{activeChild.recentReport || 'No reports yet'}</h4>
                    <p>Issued recently</p>
                  </div>
                  <div className="report-grade">
                    <span className="grade-badge">{activeChild.recentReportGrade || 'N/A'}</span>
                    <button className="btn-link-sm">View</button>
                  </div>
                </div>
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

      {/* ✅ LINK CHILD MODAL */}
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
                <input type="email" value={studentEmail} onChange={e => setStudentEmail(e.target.value)} placeholder="student@example.com" required />
              </div>
              <div className="modal-footer">
                <button type="button" onClick={() => setShowLinkModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={linkLoading}>{linkLoading ? 'Linking...' : 'Link Child'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ✅ PROFESSIONAL PHOTO MANAGEMENT MODAL */}
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
                  <div className="photo-large-initial">{parent?.name?.charAt(0).toUpperCase() || 'P'}</div>
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

            {/* Hidden File Inputs */}
            <input type="file" ref={fileInputRef} onChange={handlePhotoUpload} accept="image/*" style={{ display: 'none' }} />
            <input type="file" ref={cameraInputRef} onChange={handlePhotoUpload} accept="image/*" capture="user" style={{ display: 'none' }} />
          </div>
        </div>
      )}

      {/* ✅ VIEW FULL PHOTO MODAL */}
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

      {/* ✅ TUTOR PROFILE MODAL — identical to Tutors.js */}
      {showTutorModal && viewingTutor && (
        <div className="tutor-modal-overlay" onClick={handleCloseTutorModal}>
          <div className="tutor-modal" onClick={(e) => e.stopPropagation()}>
            <button className="tutor-modal-close" onClick={handleCloseTutorModal} aria-label="Close">
              ×
            </button>

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
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// Helper component for Eye Icon
const EyeIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

export default ParentDashboard;