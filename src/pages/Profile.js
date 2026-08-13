// src/pages/Profile.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';
import AvatarSelector from '../components/AvatarSelector';
import './Profile.css';

const Profile = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    country: '',
    timezone: '',
    grade: ''
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [enrollments, setEnrollments] = useState([]);
  const [stats, setStats] = useState({
    coursesEnrolled: 0,
    hoursSpent: 0,
    badgesEarned: 0,
    completionRate: 0
  });
  const [subscription, setSubscription] = useState(null);
  const [showAvatarSelector, setShowAvatarSelector] = useState(false);
  const [avatarData, setAvatarData] = useState(null);
  const [avatarImage, setAvatarImage] = useState(null);

  const API_URL = 'https://eduspantech-backend.onrender.com';

  // ===== AUTO-DISMISS SUCCESS MESSAGE =====
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => {
        setSuccess('');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  // ===== FETCH USER DATA =====
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const token = localStorage.getItem('accessToken');
        if (!token) {
          navigate('/login');
          return;
        }

        console.log('🔍 Fetching user data...');
        
        const userData = await authService.getCurrentUserWithSubscription();
        
        if (userData) {
          console.log('✅ User data loaded:', userData.name);
          setUser(userData);
          
          if (userData.avatar) {
            setAvatarImage(userData.avatar);
            setAvatarData({
              id: userData.avatar_seed || 'default',
              seed: userData.avatar_seed || 'default',
              style: userData.avatar_style || 'adventurer'
            });
          }

          if (userData.subscription || userData.tier) {
            setSubscription({
              tier: userData.tier || userData.subscription?.tier || 'Silver',
              status: userData.subscriptionStatus || userData.subscription?.status || 'active',
              endDate: userData.subscriptionEnd || userData.subscription?.end_date
            });
          }
          
          setEditForm({
            name: userData.name || '',
            email: userData.email || '',
            country: userData.country || 'ZA',
            timezone: userData.timezone || 'Africa/Johannesburg',
            grade: userData.grade || ''
          });
          
          await fetchUserStats();
        } else {
          console.log('❌ No user data, redirecting to login');
          navigate('/login');
        }
      } catch (err) {
        console.error('❌ Failed to load profile data:', err);
        setError('Failed to load profile data');
        navigate('/login');
      } finally {
        setLoading(false);
      }
    };

    const fetchUserStats = async () => {
      try {
        const token = localStorage.getItem('accessToken');
        if (!token) return;

        console.log('🔍 Fetching enrollments...');
        const enrollResponse = await fetch(`${API_URL}/api/v1/content/my/subjects`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        console.log('📊 Enrollments status:', enrollResponse.status);
        
        if (enrollResponse.ok) {
          const data = await enrollResponse.json();
          console.log('✅ Enrollments data:', data);
          if (data.success) {
            const subjects = data.subjects || [];
            setEnrollments(subjects);
            setStats({
              coursesEnrolled: subjects.length,
              hoursSpent: 0,
              badgesEarned: 0,
              completionRate: subjects.length > 0 ? Math.min(subjects.length * 20, 100) : 0
            });
          }
        }
      } catch (error) {
        console.error('❌ Failed to fetch stats:', error);
      }
    };

    fetchUserData();
  }, [navigate]);

  // ===== AVATAR FUNCTIONS =====
  const handleAvatarSelect = async (avatar) => {
    setAvatarData(avatar);
    setAvatarImage(avatar.svg);
    setShowAvatarSelector(false);
    await saveAvatarToBackend(avatar);
  };

  const saveAvatarToBackend = async (avatar) => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        setError('Please login again to save avatar');
        return;
      }

      const response = await fetch(`${API_URL}/api/v1/auth/update-profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          avatar: avatar.svg,
          avatar_seed: avatar.seed,
          avatar_style: avatar.style || 'adventurer'
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setSuccess('Avatar updated successfully! ✅');
          setUser(prev => ({
            ...prev,
            avatar: avatar.svg,
            avatar_seed: avatar.seed,
            avatar_style: avatar.style || 'adventurer'
          }));
        }
      }
    } catch (error) {
      console.error('❌ Failed to save avatar:', error);
      setError('Failed to save avatar');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        setError('Session expired. Please login again.');
        navigate('/login');
        return;
      }

      const response = await fetch(`${API_URL}/api/v1/auth/update-profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(editForm)
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          const updatedUser = { ...user, ...editForm };
          setUser(updatedUser);
          localStorage.setItem('user', JSON.stringify(updatedUser));
          setSuccess('Profile updated successfully! ✅');
          setIsEditing(false);
        }
      }
    } catch (error) {
      setError('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError('New passwords do not match');
      setLoading(false);
      return;
    }

    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        setError('Session expired. Please login again.');
        return;
      }

      const response = await fetch(`${API_URL}/api/v1/auth/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword
        })
      });

      const data = await response.json();
      if (response.ok && data.success) {
        setSuccess('✅ Password changed successfully!');
        setShowPasswordModal(false);
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      } else {
        setError(data.error || 'Failed to change password');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm('Are you sure you want to delete your account? This action is permanent!')) return;
    
    setLoading(true);
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        setError('Session expired. Please login again.');
        return;
      }

      const response = await fetch(`${API_URL}/api/v1/auth/delete-account`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        authService.logout();
        navigate('/login');
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to delete account');
      }
    } catch (error) {
      setError('Failed to delete account');
    } finally {
      setLoading(false);
      setShowDeleteModal(false);
    }
  };

  if (loading) return <div className="profile-loading">Loading profile...</div>;

  return (
    <div className="profile-container">
      {/* Header */}
      <div className="profile-header">
        <div 
          className="profile-avatar" 
          style={{ cursor: 'pointer' }} 
          onClick={() => setShowAvatarSelector(true)}
          title="Click to change avatar"
        >
          {avatarImage ? (
            <img src={avatarImage} alt="Avatar" className="profile-avatar-img" />
          ) : (
            <span className="profile-avatar-emoji">👤</span>
          )}
          <div className="avatar-edit-badge">✎</div>
        </div>
        <div className="profile-header-info">
          <h1>{user?.name || 'User'}</h1>
          <p className="profile-header-subtitle">
            {user?.cohort === 'HighSchool' ? 'High School Student' : 'University Student'} • {user?.country || 'South Africa'}
          </p>
          <div className="profile-status">
            <span className="status-dot"></span>
            Active Member
          </div>
        </div>
        <button className="profile-edit-btn" onClick={() => setIsEditing(!isEditing)}>
          {isEditing ? 'Cancel' : '✏️ Edit Profile'}
        </button>
      </div>

      {error && <div className="profile-error">{error}</div>}
      {success && <div className="profile-success">{success}</div>}

      {/* Stats */}
      <div className="profile-stats">
        <div className="profile-stat-card">
          <span className="stat-number">{stats.coursesEnrolled}</span>
          <span className="stat-label">Courses Enrolled</span>
        </div>
        <div className="profile-stat-card">
          <span className="stat-number">{stats.hoursSpent}</span>
          <span className="stat-label">Hours Spent</span>
        </div>
        <div className="profile-stat-card">
          <span className="stat-number">{stats.badgesEarned}</span>
          <span className="stat-label">Badges Earned</span>
        </div>
        <div className="profile-stat-card">
          <span className="stat-number">{stats.completionRate}%</span>
          <span className="stat-label">Completion Rate</span>
        </div>
      </div>

      {/* Profile Grid */}
      <div className="profile-grid">
        {/* Personal Information */}
        <div className="profile-card">
          <h3>📋 Personal Information</h3>
          <div className="profile-info-group">
            {[
              { label: 'Full Name', name: 'name', value: editForm.name },
              { label: 'Email Address', name: 'email', value: editForm.email },
              { label: 'Country', name: 'country', value: editForm.country },
              { label: 'Grade / Year', name: 'grade', value: editForm.grade },
              { label: 'Cohort', name: 'cohort', value: user?.cohort === 'HighSchool' ? 'High School' : 'University First Year' }
            ].map((field, i) => (
              <div key={i} className="profile-info-item">
                <span className="info-label">{field.label}</span>
                {isEditing && field.name !== 'cohort' ? (
                  <input
                    type="text"
                    name={field.name}
                    value={field.value}
                    onChange={handleInputChange}
                    className="profile-input"
                  />
                ) : (
                  <span className="info-value">{field.value || 'Not set'}</span>
                )}
              </div>
            ))}
          </div>
          {isEditing && (
            <div className="profile-actions">
              <button 
                className="profile-save-btn" 
                onClick={handleSaveProfile}
                disabled={loading}
              >
                {loading ? 'Saving...' : '💾 Save Changes'}
              </button>
            </div>
          )}
        </div>

        {/* Account Settings */}
        <div className="profile-card">
          <h3>🔒 Account Settings</h3>
          <div className="profile-settings-list">
            <div className="profile-setting-item">
              <div className="setting-info">
                <span className="setting-icon">🔑</span>
                <div>
                  <h4>Change Password</h4>
                  <p>Update your password regularly for security</p>
                </div>
              </div>
              <button 
                className="setting-action-btn"
                onClick={() => setShowPasswordModal(true)}
              >
                Update
              </button>
            </div>

            <div className="profile-setting-item danger">
              <div className="setting-info">
                <span className="setting-icon">⚠️</span>
                <div>
                  <h4>Delete Account</h4>
                  <p>Permanently delete your account and all data</p>
                </div>
              </div>
              <button 
                className="setting-action-btn danger"
                onClick={() => setShowDeleteModal(true)}
              >
                Delete
              </button>
            </div>
          </div>
        </div>

        {/* Enrolled Courses */}
        <div className="profile-card full-width">
          <h3>📚 My Courses</h3>
          {enrollments.length > 0 ? (
            <div className="profile-courses-grid">
              {enrollments.map((course) => (
                <div 
                  key={course.id} 
                  className="profile-course-card"
                  onClick={() => navigate(`/subjects/${course.name.toLowerCase()}`)}
                >
                  <span className="course-icon">{course.icon || '📘'}</span>
                  <div className="course-info">
                    <h4>{course.name}</h4>
                    <span className="course-tier">{course.tier || 'Tier 1'}</span>
                  </div>
                  <div className="course-progress">
                    <div className="progress-bar">
                      <div 
                        className="progress-fill" 
                        style={{ width: `${Math.floor(Math.random() * 60 + 20)}%` }}
                      ></div>
                    </div>
                    <span className="progress-text">
                      {Math.floor(Math.random() * 60 + 20)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="profile-empty-state">
              <p>No courses enrolled yet</p>
              <button 
                className="profile-empty-btn"
                onClick={() => navigate('/subjects')}
              >
                Browse Subjects →
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {showPasswordModal && (
        <div className="profile-modal-overlay" onClick={() => setShowPasswordModal(false)}>
          <div className="profile-modal" onClick={(e) => e.stopPropagation()}>
            <div className="profile-modal-header">
              <h3>🔑 Change Password</h3>
              <button className="modal-close" onClick={() => setShowPasswordModal(false)}>×</button>
            </div>
            <form onSubmit={handlePasswordChange}>
              <div className="profile-modal-body">
                <div className="form-group">
                  <label>Current Password</label>
                  <input
                    type="password"
                    value={passwordData.currentPassword}
                    onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>New Password</label>
                  <input
                    type="password"
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                    required
                    minLength="8"
                  />
                </div>
                <div className="form-group">
                  <label>Confirm New Password</label>
                  <input
                    type="password"
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                    required
                  />
                </div>
                {error && <div className="profile-error">{error}</div>}
              </div>
              <div className="profile-modal-actions">
                <button type="button" className="modal-cancel" onClick={() => setShowPasswordModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="modal-submit" disabled={loading}>
                  {loading ? 'Changing...' : 'Change Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showDeleteModal && (
        <div className="profile-modal-overlay" onClick={() => setShowDeleteModal(false)}>
          <div className="profile-modal" onClick={(e) => e.stopPropagation()}>
            <div className="profile-modal-header danger">
              <h3>⚠️ Delete Account</h3>
              <button className="modal-close" onClick={() => setShowDeleteModal(false)}>×</button>
            </div>
            <div className="profile-modal-body">
              <p className="delete-warning">
                Are you sure you want to delete your account? This action is <strong>permanent</strong> and cannot be undone.
              </p>
              <p>All your data, including enrolled courses and progress, will be permanently removed.</p>
            </div>
            <div className="profile-modal-actions">
              <button type="button" className="modal-cancel" onClick={() => setShowDeleteModal(false)}>
                Cancel
              </button>
              <button 
                type="button" 
                className="modal-delete" 
                onClick={handleDeleteAccount}
                disabled={loading}
              >
                {loading ? 'Deleting...' : '🗑️ Delete Account'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showAvatarSelector && (
        <AvatarSelector
          onSelect={handleAvatarSelect}
          currentAvatar={avatarData}
          onClose={() => setShowAvatarSelector(false)}
        />
      )}
    </div>
  );
};

export default Profile;// Force new deployment $(date) 
