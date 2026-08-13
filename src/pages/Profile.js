// src/pages/Profile.js - COMPLETE DARK THEME WITH INLINE STYLES
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';
import AvatarSelector from '../components/AvatarSelector';

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

  // ===== STYLES =====
  const darkStyles = {
    container: {
      maxWidth: '1200px',
      margin: '0 auto',
      padding: '32px 40px',
      minHeight: '100vh',
      background: '#0a0e1a',
      color: '#ffffff'
    },
    header: {
      display: 'flex',
      alignItems: 'center',
      gap: '24px',
      padding: '28px 32px',
      background: '#141b2d',
      borderRadius: '16px',
      border: '1px solid rgba(255,255,255,0.06)',
      marginBottom: '28px'
    },
    avatar: {
      width: '80px',
      height: '80px',
      borderRadius: '50%',
      background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      cursor: 'pointer',
      position: 'relative',
      flexShrink: 0
    },
    avatarImg: {
      width: '100%',
      height: '100%',
      borderRadius: '50%',
      objectFit: 'cover'
    },
    avatarEmoji: {
      fontSize: '40px'
    },
    avatarBadge: {
      position: 'absolute',
      bottom: '-4px',
      right: '-4px',
      background: '#4f46e5',
      color: 'white',
      width: '28px',
      height: '28px',
      borderRadius: '50%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '14px',
      border: '2px solid #141b2d'
    },
    headerInfo: { flex: 1 },
    headerName: { fontSize: '28px', fontWeight: 700, color: '#ffffff', margin: '0 0 4px 0' },
    headerSubtitle: { fontSize: '15px', color: '#94a3b8', margin: '0 0 8px 0' },
    headerStatus: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '8px',
      fontSize: '13px',
      color: '#6ee7b7',
      background: 'rgba(52,211,153,0.1)',
      padding: '4px 14px',
      borderRadius: '20px',
      border: '1px solid rgba(52,211,153,0.2)'
    },
    statusDot: { width: '8px', height: '8px', background: '#34d399', borderRadius: '50%', display: 'inline-block' },
    editBtn: {
      padding: '10px 24px',
      borderRadius: '10px',
      border: '1px solid rgba(255,255,255,0.1)',
      background: 'rgba(255,255,255,0.05)',
      color: '#ffffff',
      fontSize: '14px',
      fontWeight: 600,
      cursor: 'pointer'
    },
    error: {
      background: 'rgba(239,68,68,0.1)',
      color: '#fca5a5',
      padding: '12px 20px',
      borderRadius: '10px',
      marginBottom: '16px',
      border: '1px solid rgba(239,68,68,0.15)'
    },
    success: {
      background: 'rgba(52,211,153,0.1)',
      color: '#6ee7b7',
      padding: '12px 20px',
      borderRadius: '10px',
      marginBottom: '16px',
      border: '1px solid rgba(52,211,153,0.15)'
    },
    statsGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(4, 1fr)',
      gap: '16px',
      marginBottom: '28px'
    },
    statCard: {
      background: '#141b2d',
      borderRadius: '12px',
      padding: '20px 24px',
      border: '1px solid rgba(255,255,255,0.06)',
      textAlign: 'center'
    },
    statNumber: { display: 'block', fontSize: '32px', fontWeight: 700, color: '#ffffff' },
    statLabel: { display: 'block', fontSize: '14px', color: '#94a3b8', fontWeight: 500 },
    grid: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: '24px'
    },
    card: {
      background: '#141b2d',
      borderRadius: '16px',
      padding: '24px 28px',
      border: '1px solid rgba(255,255,255,0.06)'
    },
    cardFull: {
      gridColumn: '1 / -1',
      background: '#141b2d',
      borderRadius: '16px',
      padding: '24px 28px',
      border: '1px solid rgba(255,255,255,0.06)'
    },
    cardTitle: {
      fontSize: '18px',
      fontWeight: 600,
      color: '#ffffff',
      margin: '0 0 20px 0',
      paddingBottom: '12px',
      borderBottom: '1px solid rgba(255,255,255,0.06)'
    },
    infoRow: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '6px 0'
    },
    infoLabel: { fontSize: '13px', fontWeight: 500, color: '#94a3b8' },
    infoValue: { fontSize: '15px', color: '#ffffff', fontWeight: 500 },
    input: {
      padding: '8px 12px',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: '8px',
      fontSize: '14px',
      width: '60%',
      background: 'rgba(255,255,255,0.04)',
      color: '#ffffff'
    },
    saveBtn: {
      padding: '10px 28px',
      background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
      color: '#ffffff',
      border: 'none',
      borderRadius: '10px',
      fontSize: '14px',
      fontWeight: 600,
      cursor: 'pointer'
    },
    settingItem: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '14px 16px',
      borderRadius: '10px',
      border: '1px solid rgba(255,255,255,0.06)'
    },
    settingItemDanger: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '14px 16px',
      borderRadius: '10px',
      border: '1px solid rgba(239,68,68,0.2)'
    },
    settingLeft: { display: 'flex', alignItems: 'center', gap: '14px' },
    settingIcon: { fontSize: '20px' },
    settingTitle: { fontSize: '14px', fontWeight: 600, color: '#ffffff', margin: '0 0 2px 0' },
    settingDesc: { fontSize: '13px', color: '#94a3b8', margin: '0' },
    settingBtn: {
      padding: '6px 18px',
      borderRadius: '8px',
      border: '1px solid rgba(255,255,255,0.08)',
      background: 'rgba(255,255,255,0.04)',
      color: '#ffffff',
      fontSize: '13px',
      fontWeight: 500,
      cursor: 'pointer'
    },
    settingBtnDanger: {
      padding: '6px 18px',
      borderRadius: '8px',
      border: '1px solid rgba(239,68,68,0.2)',
      background: 'rgba(239,68,68,0.1)',
      color: '#fca5a5',
      fontSize: '13px',
      fontWeight: 500,
      cursor: 'pointer'
    },
    coursesGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
      gap: '12px'
    },
    courseCard: {
      display: 'flex',
      alignItems: 'center',
      gap: '14px',
      padding: '14px 18px',
      borderRadius: '10px',
      border: '1px solid rgba(255,255,255,0.06)',
      cursor: 'pointer'
    },
    courseIcon: { fontSize: '28px' },
    courseInfo: { flex: 1 },
    courseName: { fontSize: '14px', fontWeight: 600, color: '#ffffff', margin: '0 0 2px 0' },
    courseTier: { fontSize: '12px', color: '#94a3b8' },
    courseProgress: { display: 'flex', alignItems: 'center', gap: '10px', minWidth: '70px' },
    progressBar: { flex: 1, height: '6px', background: 'rgba(255,255,255,0.06)', borderRadius: '4px', overflow: 'hidden', minWidth: '40px' },
    progressFill: { height: '100%', background: 'linear-gradient(135deg, #4f46e5, #7c3aed)', borderRadius: '4px', width: '40%' },
    progressText: { fontSize: '12px', fontWeight: 600, color: '#ffffff', minWidth: '36px', textAlign: 'right' }
  };

  // ===== AUTO-DISMISS SUCCESS MESSAGE =====
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(''), 3000);
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

        const userData = await authService.getCurrentUserWithSubscription();
        if (userData) {
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
          navigate('/login');
        }
      } catch (err) {
        console.error('Failed to load profile data:', err);
        setError('Failed to load profile data');
        navigate('/login');
      } finally {
        setLoading(false);
      }
    };
    fetchUserData();
  }, [navigate]);

  const fetchUserStats = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) return;

      const enrollResponse = await fetch(`${API_URL}/api/v1/content/my/subjects`, {
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
      });

      if (enrollResponse.ok) {
        const data = await enrollResponse.json();
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
      console.error('Failed to fetch stats:', error);
    }
  };

  const handleAvatarSelect = async (avatar) => {
    setAvatarData(avatar);
    setAvatarImage(avatar.svg);
    setShowAvatarSelector(false);
    await saveAvatarToBackend(avatar);
  };

  const saveAvatarToBackend = async (avatar) => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) return;

      const response = await fetch(`${API_URL}/api/v1/auth/update-profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
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
          setUser(prev => ({ ...prev, avatar: avatar.svg, avatar_seed: avatar.seed, avatar_style: avatar.style || 'adventurer' }));
        }
      }
    } catch (error) {
      console.error('Failed to save avatar:', error);
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
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
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
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
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
        headers: { 'Authorization': `Bearer ${token}` }
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

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh', color: '#94a3b8' }}>Loading profile...</div>;

  return (
    <div style={darkStyles.container}>
      {/* Header */}
      <div style={darkStyles.header}>
        <div style={darkStyles.avatar} onClick={() => setShowAvatarSelector(true)}>
          {avatarImage ? (
            <img src={avatarImage} alt="Avatar" style={darkStyles.avatarImg} />
          ) : (
            <span style={darkStyles.avatarEmoji}>👤</span>
          )}
          <div style={darkStyles.avatarBadge}>✎</div>
        </div>
        <div style={darkStyles.headerInfo}>
          <h1 style={darkStyles.headerName}>{user?.name || 'User'}</h1>
          <p style={darkStyles.headerSubtitle}>
            {user?.cohort === 'HighSchool' ? 'High School Student' : 'University Student'} • {user?.country || 'South Africa'}
          </p>
          <div style={darkStyles.headerStatus}>
            <span style={darkStyles.statusDot}></span>
            Active Member
          </div>
        </div>
        <button style={darkStyles.editBtn} onClick={() => setIsEditing(!isEditing)}>
          {isEditing ? 'Cancel' : '✏️ Edit Profile'}
        </button>
      </div>

      {error && <div style={darkStyles.error}>{error}</div>}
      {success && <div style={darkStyles.success}>{success}</div>}

      {/* Stats */}
      <div style={darkStyles.statsGrid}>
        {[
          { number: stats.coursesEnrolled, label: 'Courses Enrolled' },
          { number: stats.hoursSpent, label: 'Hours Spent' },
          { number: stats.badgesEarned, label: 'Badges Earned' },
          { number: `${stats.completionRate}%`, label: 'Completion Rate' }
        ].map((stat, i) => (
          <div key={i} style={darkStyles.statCard}>
            <span style={darkStyles.statNumber}>{stat.number}</span>
            <span style={darkStyles.statLabel}>{stat.label}</span>
          </div>
        ))}
      </div>

      {/* Profile Grid */}
      <div style={darkStyles.grid}>
        {/* Personal Information */}
        <div style={darkStyles.card}>
          <h3 style={darkStyles.cardTitle}>📋 Personal Information</h3>
          <div>
            {[
              { label: 'Full Name', name: 'name', value: editForm.name },
              { label: 'Email Address', name: 'email', value: editForm.email },
              { label: 'Country', name: 'country', value: editForm.country },
              { label: 'Grade / Year', name: 'grade', value: editForm.grade },
              { label: 'Cohort', name: 'cohort', value: user?.cohort === 'HighSchool' ? 'High School' : 'University First Year' }
            ].map((field, i) => (
              <div key={i} style={darkStyles.infoRow}>
                <span style={darkStyles.infoLabel}>{field.label}</span>
                {isEditing && field.name !== 'cohort' ? (
                  <input
                    type="text"
                    name={field.name}
                    value={field.value}
                    onChange={handleInputChange}
                    style={darkStyles.input}
                  />
                ) : (
                  <span style={darkStyles.infoValue}>{field.value || 'Not set'}</span>
                )}
              </div>
            ))}
          </div>
          {isEditing && (
            <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              <button style={darkStyles.saveBtn} onClick={handleSaveProfile} disabled={loading}>
                {loading ? 'Saving...' : '💾 Save Changes'}
              </button>
            </div>
          )}
        </div>

        {/* Account Settings */}
        <div style={darkStyles.card}>
          <h3 style={darkStyles.cardTitle}>🔒 Account Settings</h3>
          <div>
            <div style={darkStyles.settingItem}>
              <div style={darkStyles.settingLeft}>
                <span style={darkStyles.settingIcon}>🔑</span>
                <div>
                  <h4 style={darkStyles.settingTitle}>Change Password</h4>
                  <p style={darkStyles.settingDesc}>Update your password regularly for security</p>
                </div>
              </div>
              <button style={darkStyles.settingBtn} onClick={() => setShowPasswordModal(true)}>Update</button>
            </div>
            <div style={darkStyles.settingItemDanger}>
              <div style={darkStyles.settingLeft}>
                <span style={darkStyles.settingIcon}>⚠️</span>
                <div>
                  <h4 style={darkStyles.settingTitle}>Delete Account</h4>
                  <p style={darkStyles.settingDesc}>Permanently delete your account and all data</p>
                </div>
              </div>
              <button style={darkStyles.settingBtnDanger} onClick={() => setShowDeleteModal(true)}>Delete</button>
            </div>
          </div>
        </div>

        {/* Enrolled Courses */}
        <div style={darkStyles.cardFull}>
          <h3 style={darkStyles.cardTitle}>📚 My Courses</h3>
          {enrollments.length > 0 ? (
            <div style={darkStyles.coursesGrid}>
              {enrollments.map((course) => (
                <div
                  key={course.id}
                  style={darkStyles.courseCard}
                  onClick={() => navigate(`/subjects/${course.name.toLowerCase()}`)}
                >
                  <span style={darkStyles.courseIcon}>{course.icon || '📘'}</span>
                  <div style={darkStyles.courseInfo}>
                    <h4 style={darkStyles.courseName}>{course.name}</h4>
                    <span style={darkStyles.courseTier}>{course.tier || 'Tier 1'}</span>
                  </div>
                  <div style={darkStyles.courseProgress}>
                    <div style={darkStyles.progressBar}>
                      <div style={{ ...darkStyles.progressFill, width: `${Math.floor(Math.random() * 60 + 20)}%` }}></div>
                    </div>
                    <span style={darkStyles.progressText}>{Math.floor(Math.random() * 60 + 20)}%</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '32px 0', color: '#94a3b8' }}>
              <p>No courses enrolled yet</p>
              <button
                style={{ marginTop: '12px', padding: '10px 28px', background: 'linear-gradient(135deg, #4f46e5, #7c3aed)', color: '#ffffff', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}
                onClick={() => navigate('/subjects')}
              >
                Browse Subjects →
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Modals - Keep your existing modal code */}
      {showPasswordModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={() => setShowPasswordModal(false)}>
          <div style={{ background: '#141b2d', borderRadius: '16px', maxWidth: '480px', width: '90%', maxHeight: '90vh', overflow: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.06)' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#ffffff', margin: 0 }}>🔑 Change Password</h3>
              <button onClick={() => setShowPasswordModal(false)} style={{ background: 'none', border: 'none', fontSize: '24px', color: '#94a3b8', cursor: 'pointer' }}>×</button>
            </div>
            <form onSubmit={handlePasswordChange}>
              <div style={{ padding: '24px' }}>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#94a3b8', marginBottom: '4px' }}>Current Password</label>
                  <input type="password" value={passwordData.currentPassword} onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))} required style={{ width: '100%', padding: '10px 14px', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', fontSize: '14px', background: 'rgba(255,255,255,0.04)', color: '#ffffff' }} />
                </div>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#94a3b8', marginBottom: '4px' }}>New Password</label>
                  <input type="password" value={passwordData.newPassword} onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))} required minLength="8" style={{ width: '100%', padding: '10px 14px', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', fontSize: '14px', background: 'rgba(255,255,255,0.04)', color: '#ffffff' }} />
                </div>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#94a3b8', marginBottom: '4px' }}>Confirm New Password</label>
                  <input type="password" value={passwordData.confirmPassword} onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))} required style={{ width: '100%', padding: '10px 14px', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', fontSize: '14px', background: 'rgba(255,255,255,0.04)', color: '#ffffff' }} />
                </div>
                {error && <div style={{ color: '#fca5a5', marginBottom: '16px' }}>{error}</div>}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                  <button type="button" onClick={() => setShowPasswordModal(false)} style={{ padding: '10px 24px', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', background: 'rgba(255,255,255,0.04)', color: '#ffffff', fontSize: '14px', fontWeight: 500, cursor: 'pointer' }}>Cancel</button>
                  <button type="submit" disabled={loading} style={{ padding: '10px 24px', border: 'none', borderRadius: '8px', background: 'linear-gradient(135deg, #4f46e5, #7c3aed)', color: '#ffffff', fontSize: '14px', fontWeight: 500, cursor: 'pointer' }}>{loading ? 'Changing...' : 'Change Password'}</button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {showDeleteModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={() => setShowDeleteModal(false)}>
          <div style={{ background: '#141b2d', borderRadius: '16px', maxWidth: '480px', width: '90%', maxHeight: '90vh', overflow: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.06)' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', borderBottom: '1px solid rgba(239,68,68,0.2)' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#ffffff', margin: 0 }}>⚠️ Delete Account</h3>
              <button onClick={() => setShowDeleteModal(false)} style={{ background: 'none', border: 'none', fontSize: '24px', color: '#94a3b8', cursor: 'pointer' }}>×</button>
            </div>
            <div style={{ padding: '24px' }}>
              <p style={{ fontSize: '15px', color: '#fca5a5', marginBottom: '12px' }}>Are you sure you want to delete your account? This action is <strong>permanent</strong> and cannot be undone.</p>
              <p>All your data, including enrolled courses and progress, will be permanently removed.</p>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', padding: '16px 24px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              <button onClick={() => setShowDeleteModal(false)} style={{ padding: '10px 24px', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', background: 'rgba(255,255,255,0.04)', color: '#ffffff', fontSize: '14px', fontWeight: 500, cursor: 'pointer' }}>Cancel</button>
              <button onClick={handleDeleteAccount} disabled={loading} style={{ padding: '10px 24px', border: 'none', borderRadius: '8px', background: '#dc2626', color: '#ffffff', fontSize: '14px', fontWeight: 500, cursor: 'pointer' }}>{loading ? 'Deleting...' : '🗑️ Delete Account'}</button>
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

export default Profile;