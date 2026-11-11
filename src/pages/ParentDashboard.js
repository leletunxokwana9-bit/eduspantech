// src/pages/ParentDashboard.js
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';
import { API_BASE_URL } from '../services/api';
import { 
  Users, 
  Calendar, 
  Clock, 
  BookOpen, 
  TrendingUp, 
  CheckCircle, 
  AlertCircle,
  MessageSquare,
  ChevronDown,
  FileText,
  Video,
  Camera,
  LogOut
} from 'lucide-react';
import './ParentDashboard.css';

const ParentDashboard = () => {
  const navigate = useNavigate();
  const [parent, setParent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tagline, setTagline] = useState('Welcome back');
  
  // Avatar State
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [photoError, setPhotoError] = useState('');
  const fileInputRef = useRef(null);
  
  // Children State
  const [children, setChildren] = useState([]);
  const [activeChildId, setActiveChildId] = useState(null);
  const [showChildDropdown, setShowChildDropdown] = useState(false);

  // Link Child Modal State
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [studentEmail, setStudentEmail] = useState('');
  const [linkError, setLinkError] = useState('');
  const [linkSuccess, setLinkSuccess] = useState('');
  const [linkLoading, setLinkLoading] = useState(false);

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

        // 1. Fetch Taglines
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

        // 2. Fetch Linked Children
        await fetchLinkedChildren();

      } catch (error) {
        navigate('/parent-login');
      } finally {
        setLoading(false);
      }
    };
    
    initDashboard();
  }, [navigate]);

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

  const handleSignOut = () => {
    authService.logout();
    navigate('/parent-login');
  };

  // Avatar Upload (Profile.js logic)
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
          body: JSON.stringify({
            avatar: base64Image
          })
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
        await fetchLinkedChildren(); // Refresh list
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

  const triggerFileInput = () => {
    fileInputRef.current?.click();
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
              onClick={triggerFileInput}
              title="Update Profile Photo"
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
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handlePhotoUpload} 
              accept="image/*" 
              style={{ display: 'none' }} 
            />
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

        {/* Child Quick Stats - Only show if a child is selected */}
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

      {/* Main Content Grid - Only show if child is selected */}
      {activeChild ? (
        <div className="parent-content-grid">
          <div className="parent-main-column">
            <div className="dashboard-card">
              <div className="card-header">
                <div className="card-title">
                  <Calendar size={20} className="text-indigo" />
                  <h3>Upcoming Sessions</h3>
                </div>
                <button className="btn-link">View All</button>
              </div>
              <div className="card-body">
                <div className="schedule-list">
                  <div className="schedule-item">
                    <div className="schedule-date"><span className="day">24</span><span className="month">Oct</span></div>
                    <div className="schedule-details">
                      <h4>Algebra & Functions</h4>
                      <p>With {activeChild.tutorName || 'Tutor'}</p>
                      <div className="schedule-time"><Clock size={14} /> 16:00 - 17:00</div>
                    </div>
                    <div className="schedule-actions">
                      <button className="btn-icon" title="Message Tutor"><MessageSquare size={16} /></button>
                    </div>
                  </div>
                  <div className="schedule-item">
                    <div className="schedule-date"><span className="day">26</span><span className="month">Oct</span></div>
                    <div className="schedule-details">
                      <h4>Trigonometry Review</h4>
                      <p>With {activeChild.tutorName || 'Tutor'}</p>
                      <div className="schedule-time"><Clock size={14} /> 15:00 - 16:00</div>
                    </div>
                    <div className="schedule-actions">
                      <button className="btn-icon" title="Message Tutor"><MessageSquare size={16} /></button>
                    </div>
                  </div>
                </div>
                <button className="btn-primary w-full mt-4"><Calendar size={16} /> Book New Session</button>
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
                    <h4>{activeChild.recentReport || 'Report'}</h4>
                    <p>Issued on 15 Oct 2026</p>
                  </div>
                  <div className="report-grade">
                    <span className="grade-badge">{activeChild.recentReportGrade || 'N/A'}</span>
                    <button className="btn-link-sm">View</button>
                  </div>
                </div>
                <div className="report-item">
                  <div className="report-icon"><BookOpen size={20} /></div>
                  <div className="report-details">
                    <h4>Term 2 Mathematics</h4>
                    <p>Issued on 28 Jun 2026</p>
                  </div>
                  <div className="report-grade">
                    <span className="grade-badge">C (65%)</span>
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
                <input
                  type="email"
                  value={studentEmail}
                  onChange={e => setStudentEmail(e.target.value)}
                  placeholder="student@example.com"
                  required
                />
              </div>
              <div className="modal-footer">
                <button type="button" onClick={() => setShowLinkModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={linkLoading}>
                  {linkLoading ? 'Linking...' : 'Link Child'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ParentDashboard;