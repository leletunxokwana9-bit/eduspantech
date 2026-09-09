// src/pages/Admin/AdminProfile.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../../services/authService';
import './AdminProfile.css';

const AdminProfile = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    bio: ''
  });

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = localStorage.getItem('accessToken');
        if (!token) {
          navigate('/admin/login');
          return;
        }
        const userData = await authService.getCurrentUser();
        if (!userData || !userData.is_admin) {
          navigate('/admin/login');
          return;
        }
        setUser(userData);
        setFormData({
          name: userData.name || '',
          email: userData.email || '',
          phone: userData.phone || '',
          bio: userData.bio || ''
        });
      } catch (err) {
        console.error('Error fetching user:', err);
        setError('Failed to load profile');
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, [navigate]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const updated = await authService.updateProfile(formData);
      setUser(updated.user);
      setSuccess('Profile updated successfully!');
      setIsEditing(false);
    } catch (err) {
      setError(err.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="admin-profile-loading">
        <div className="admin-profile-spinner"></div>
        <p>Loading profile...</p>
      </div>
    );
  }

  return (
    <div className="admin-profile-container">
      <div className="admin-profile-header">
        <div className="admin-profile-header-left">
          <h1>👑 Admin Profile</h1>
          <p>Manage your administrator account</p>
        </div>
        <button
          className="admin-profile-edit-btn"
          onClick={() => setIsEditing(!isEditing)}
        >
          {isEditing ? 'Cancel' : 'Edit Profile'}
        </button>
      </div>

      {error && (
        <div className="admin-profile-error">
          <span>⚠️</span> {error}
        </div>
      )}

      {success && (
        <div className="admin-profile-success">
          <span>✅</span> {success}
        </div>
      )}

      <div className="admin-profile-grid">
        <div className="admin-profile-card">
          <h3>Administrator Information</h3>
          <div className="admin-profile-info">
            <div className="admin-info-row">
              <span className="admin-info-label">Name</span>
              {isEditing ? (
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="admin-profile-input"
                />
              ) : (
                <span className="admin-info-value">{user?.name || 'N/A'}</span>
              )}
            </div>
            <div className="admin-info-row">
              <span className="admin-info-label">Email</span>
              {isEditing ? (
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="admin-profile-input"
                />
              ) : (
                <span className="admin-info-value">{user?.email || 'N/A'}</span>
              )}
            </div>
            <div className="admin-info-row">
              <span className="admin-info-label">Phone</span>
              {isEditing ? (
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="admin-profile-input"
                  placeholder="+27 00 000 0000"
                />
              ) : (
                <span className="admin-info-value">{user?.phone || 'Not set'}</span>
              )}
            </div>
            <div className="admin-info-row">
              <span className="admin-info-label">Role</span>
              <span className="admin-info-value admin-role-badge">
                {user?.is_super_admin ? 'Super Admin' : 'Admin'}
              </span>
            </div>
            <div className="admin-info-row">
              <span className="admin-info-label">Status</span>
              <span className="admin-info-value admin-status-badge active">
                ● Active
              </span>
            </div>
          </div>

          {isEditing && (
            <div className="admin-profile-actions">
              <button
                className="admin-profile-save-btn"
                onClick={handleSubmit}
                disabled={loading}
              >
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          )}
        </div>

        <div className="admin-profile-card">
          <h3>Account Information</h3>
          <div className="admin-profile-stats">
            <div className="admin-stat-item">
              <span className="admin-stat-number">1</span>
              <span className="admin-stat-label">Admin Role</span>
            </div>
            <div className="admin-stat-item">
              <span className="admin-stat-number">
                {user?.is_super_admin ? 'Super' : 'Admin'}
              </span>
              <span className="admin-stat-label">Access Level</span>
            </div>
            <div className="admin-stat-item">
              <span className="admin-stat-number">
                {new Date(user?.createdAt || Date.now()).toLocaleDateString()}
              </span>
              <span className="admin-stat-label">Joined</span>
            </div>
          </div>

          <div className="admin-profile-divider"></div>

          <div className="admin-security-section">
            <h4>Security</h4>
            <button
              className="admin-security-btn"
              onClick={() => navigate('/admin/settings')}
            >
              Change Password →
            </button>
          </div>
        </div>
      </div>

      <div className="admin-quick-actions">
        <h3>Quick Actions</h3>
        <div className="admin-quick-grid">
          <button
            className="admin-quick-btn"
            onClick={() => navigate('/admin/users')}
          >
            <span>👥</span>
            <span>Manage Users</span>
          </button>
          <button
            className="admin-quick-btn"
            onClick={() => navigate('/admin/tutors')}
          >
            <span>👨‍🏫</span>
            <span>Manage Tutors</span>
          </button>
          <button
            className="admin-quick-btn"
            onClick={() => navigate('/admin/content')}
          >
            <span>📚</span>
            <span>Content Management</span>
          </button>
          <button
            className="admin-quick-btn"
            onClick={() => navigate('/admin/payments')}
          >
            <span>💰</span>
            <span>Payments</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminProfile;