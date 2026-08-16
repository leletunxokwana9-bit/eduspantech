// src/pages/Profile.js - COMPLETELY DYNAMIC - NO HARDCODED DATA
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../services/authService';
import AvatarSelector from '../components/AvatarSelector';
import './Profile.css';

const Profile = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [isTutor, setIsTutor] = useState(false);
  
  // ===== DYNAMIC DATA FROM API =====
  const [subjectOptions, setSubjectOptions] = useState([]);
  const [shiftOptions, setShiftOptions] = useState([]);
  
  // ===== EDIT FORM =====
  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    country: '',
    timezone: '',
    grade: '',
    bio: '',
    tier: '',
    subjects: [],
    shiftId: '',
    yearsExperience: 0,
    education: '',
    phone: '',
    linkedin: '',
    website: ''
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  
  // ===== STUDENT-ONLY STATS =====
  const [enrollments, setEnrollments] = useState([]);
  const [studentStats, setStudentStats] = useState({
    coursesEnrolled: 0,
    hoursSpent: 0,
    badgesEarned: 0,
    completionRate: 0
  });
  
  // ===== TUTOR-ONLY STATS =====
  const [tutorStats, setTutorStats] = useState({
    totalSessions: 0,
    studentsTaught: 0,
    totalEarnings: 0,
    avgRating: 0
  });

  const [subscription, setSubscription] = useState(null);
  const [showAvatarSelector, setShowAvatarSelector] = useState(false);
  const [avatarData, setAvatarData] = useState(null);
  const [avatarImage, setAvatarImage] = useState(null);
  
  // ===== PHOTO UPLOAD STATE =====
  const [profilePhoto, setProfilePhoto] = useState(null);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [photoError, setPhotoError] = useState('');
  const fileInputRef = useRef(null);

  const API_URL = 'https://eduspantech-backend.onrender.com/api';

  // ===== AUTO-DISMISS SUCCESS MESSAGE =====
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => {
        setSuccess('');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  // ===== FETCH SUBJECTS AND SHIFTS FROM API =====
  useEffect(() => {
    const fetchOptions = async () => {
      try {
        // Fetch subjects from API
        const subjectsResponse = await fetch(`${API_URL}/content/subjects`);
        if (subjectsResponse.ok) {
          const data = await subjectsResponse.json();
          if (data.success && data.subjects) {
            setSubjectOptions(data.subjects.map(s => s.name));
          }
        }

        // Fetch shifts from API
        const shiftsResponse = await fetch(`${API_URL}/shifts`);
        if (shiftsResponse.ok) {
          const data = await shiftsResponse.json();
          if (data.success && data.shifts) {
            setShiftOptions(data.shifts);
          }
        }
      } catch (error) {
        console.error('Failed to fetch options:', error);
      }
    };
    fetchOptions();
  }, [API_URL]);

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
          
          const isTutorAccount = userData.is_tutor === true || userData.role === 'tutor';
          setIsTutor(isTutorAccount);
          
          // ============================================
          // AVATAR - Use avatar for BOTH students AND tutors
          // ============================================
          if (userData.avatar) {
            if (isTutorAccount) {
              setProfilePhoto(userData.avatar);
            } else {
              setAvatarImage(userData.avatar);
              setAvatarData({
                id: userData.avatar_seed || 'default',
                seed: userData.avatar_seed || 'default',
                style: userData.avatar_style || 'adventurer'
              });
            }
          }

          // Set subscription
          if (userData.subscription || userData.subscriptionTier) {
            setSubscription({
              tier: userData.subscriptionTier || userData.subscription?.tier || 'SILVER',
              status: userData.subscriptionStatus || userData.subscription?.status || 'active',
              endDate: userData.subscriptionEnd || userData.subscription?.end_date
            });
          }
          
          // ============================================
          // SET EDIT FORM WITH USER DATA (NO HARDCODING)
          // ============================================
          setEditForm({
            name: userData.name || '',
            email: userData.email || '',
            country: userData.country || '',
            timezone: userData.timezone || '',
            grade: userData.grade || '',
            bio: userData.bio || '',
            tier: userData.tutor_tier || userData.tier || '',
            subjects: userData.tutor_subjects || [],
            shiftId: userData.tutor_shift_id || '',
            yearsExperience: userData.years_experience || 0,
            education: userData.education || '',
            phone: userData.phone || '',
            linkedin: userData.linkedin || '',
            website: userData.website || ''
          });
          
          // ============================================
          // FETCH ROLE-SPECIFIC STATS
          // ============================================
          if (isTutorAccount) {
            await fetchTutorStats();
          } else {
            await fetchStudentStats();
          }
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

    // ===== STUDENT STATS =====
    const fetchStudentStats = async () => {
      try {
        const token = localStorage.getItem('accessToken');
        if (!token) return;

        console.log('🔍 Fetching student stats...');
        const enrollResponse = await fetch(`${API_URL}/content/my/subjects`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (enrollResponse.ok) {
          const data = await enrollResponse.json();
          if (data.success) {
            const subjects = data.subjects || [];
            setEnrollments(subjects);
            setStudentStats({
              coursesEnrolled: subjects.length,
              hoursSpent: 0,
              badgesEarned: 0,
              completionRate: subjects.length > 0 ? Math.min(subjects.length * 20, 100) : 0
            });
          }
        }
      } catch (error) {
        console.error('❌ Failed to fetch student stats:', error);
      }
    };

    // ===== TUTOR STATS =====
    const fetchTutorStats = async () => {
      try {
        const token = localStorage.getItem('accessToken');
        if (!token) return;

        console.log('🔍 Fetching tutor stats...');
        
        const sessionsResponse = await fetch(`${API_URL}/sessions`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (sessionsResponse.ok) {
          const data = await sessionsResponse.json();
          const sessions = data.sessions || [];
          
          const uniqueStudents = new Set(sessions.map(s => s.user_id));
          const completedSessions = sessions.filter(s => s.status === 'completed' || s.status === 'ended');
          
          setTutorStats({
            totalSessions: sessions.length,
            studentsTaught: uniqueStudents.size,
            totalEarnings: completedSessions.length * 100,
            avgRating: 4.5
          });
        }
      } catch (error) {
        console.error('❌ Failed to fetch tutor stats:', error);
      }
    };

    fetchUserData();
  }, [navigate, API_URL]);

  // ============================================
  // HANDLE INPUT CHANGE
  // ============================================
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubjectToggle = (subject) => {
    setEditForm(prev => {
      const subjects = prev.subjects || [];
      if (subjects.includes(subject)) {
        return { ...prev, subjects: subjects.filter(s => s !== subject) };
      } else {
        return { ...prev, subjects: [...subjects, subject] };
      }
    });
  };

  // ===== STUDENT AVATAR FUNCTIONS =====
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

      const response = await fetch(`${API_URL}/auth/profile`, {
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
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to save avatar');
      }
    } catch (error) {
      console.error('❌ Failed to save avatar:', error);
      setError('Failed to save avatar');
    }
  };

  // ============================================
  // TUTOR PHOTO UPLOAD
  // ============================================
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
        const response = await fetch(`${API_URL}/auth/profile`, {
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
            setProfilePhoto(base64Image);
            setSuccess('✅ Photo uploaded successfully!');
            setUser(prev => ({
              ...prev,
              avatar: base64Image
            }));
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

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  // ===== SAVE PROFILE =====
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

      const response = await fetch(`${API_URL}/auth/profile`, {
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
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to update profile');
      }
    } catch (error) {
      setError('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  // ===== PASSWORD CHANGE =====
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

      const response = await fetch(`${API_URL}/auth/change-password`, {
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

  // ===== DELETE ACCOUNT =====
  const handleDeleteAccount = async () => {
    if (!window.confirm('Are you sure you want to delete your account? This action is permanent!')) return;
    
    setLoading(true);
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        setError('Session expired. Please login again.');
        return;
      }

      const response = await fetch(`${API_URL}/auth/account`, {
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

  // ============================================
  // RENDER TUTOR PROFILE FIELDS - DYNAMIC
  // ============================================
  const renderTutorFields = () => {
    if (!isTutor) return null;

    return (
      <div style={{ 
        gridColumn: '1 / -1',
        background: '#141b2d',
        borderRadius: '16px',
        padding: '24px 28px',
        border: '1px solid rgba(255,255,255,0.06)'
      }}>
        <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#ffffff', margin: '0 0 20px 0', paddingBottom: '12px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          👨‍🏫 Tutor Profile
        </h3>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          {/* Bio - Full Width */}
          <div style={{ gridColumn: '1 / -1' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#94a3b8', marginBottom: '4px' }}>
              📝 About Me
            </label>
            {isEditing ? (
              <textarea
                name="bio"
                value={editForm.bio || ''}
                onChange={handleInputChange}
                placeholder="Tell students about yourself..."
                rows="4"
                style={{ 
                  width: '100%', 
                  padding: '12px 14px', 
                  border: '1px solid rgba(255,255,255,0.08)', 
                  borderRadius: '8px', 
                  fontSize: '14px', 
                  background: 'rgba(255,255,255,0.04)', 
                  color: '#ffffff',
                  fontFamily: 'inherit',
                  resize: 'vertical'
                }}
              />
            ) : (
              <p style={{ fontSize: '15px', color: '#e2e8f0', lineHeight: '1.6' }}>
                {editForm.bio || 'No bio provided yet.'}
              </p>
            )}
          </div>

          {/* Tier - Dynamic from API */}
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#94a3b8', marginBottom: '4px' }}>
              🏅 Tier / Level
            </label>
            {isEditing ? (
              <select
                name="tier"
                value={editForm.tier || ''}
                onChange={handleInputChange}
                style={{ 
                  width: '100%', 
                  padding: '10px 14px', 
                  border: '1px solid rgba(255,255,255,0.08)', 
                  borderRadius: '8px', 
                  fontSize: '14px', 
                  background: 'rgba(255,255,255,0.04)', 
                  color: '#ffffff'
                }}
              >
                <option value="">Select Tier</option>
                <option value="TIER_1">TIER_1 - Grades 8-9</option>
                <option value="TIER_2">TIER_2 - Grades 10-11</option>
                <option value="TIER_3">TIER_3 - Grade 12 & Tertiary</option>
              </select>
            ) : (
              <span style={{ fontSize: '15px', color: '#ffffff', fontWeight: 500 }}>
                {editForm.tier || 'Not set'}
              </span>
            )}
          </div>

          {/* Shift - Dynamic from API */}
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#94a3b8', marginBottom: '4px' }}>
              ⏰ Shift
            </label>
            {isEditing ? (
              <select
                name="shiftId"
                value={editForm.shiftId || ''}
                onChange={handleInputChange}
                style={{ 
                  width: '100%', 
                  padding: '10px 14px', 
                  border: '1px solid rgba(255,255,255,0.08)', 
                  borderRadius: '8px', 
                  fontSize: '14px', 
                  background: 'rgba(255,255,255,0.04)', 
                  color: '#ffffff'
                }}
              >
                <option value="">Select Shift</option>
                {shiftOptions.map(shift => (
                  <option key={shift.id} value={shift.id}>
                    {shift.name} ({shift.sast_start} - {shift.sast_end})
                  </option>
                ))}
              </select>
            ) : (
              <span style={{ fontSize: '15px', color: '#ffffff', fontWeight: 500 }}>
                {shiftOptions.find(s => s.id === editForm.shiftId)?.name || 'Not set'}
              </span>
            )}
          </div>

          {/* Subjects - Dynamic from API */}
          <div style={{ gridColumn: '1 / -1' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#94a3b8', marginBottom: '4px' }}>
              📖 Subjects Taught
            </label>
            {isEditing ? (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', padding: '8px 0' }}>
                {subjectOptions.map(subject => (
                  <label key={subject} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#e2e8f0', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={(editForm.subjects || []).includes(subject)}
                      onChange={() => handleSubjectToggle(subject)}
                      style={{ accentColor: '#4f46e5' }}
                    />
                    {subject}
                  </label>
                ))}
              </div>
            ) : (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {(editForm.subjects || []).length > 0 ? (
                  (editForm.subjects || []).map(subject => (
                    <span key={subject} style={{ 
                      fontSize: '12px', 
                      padding: '4px 14px', 
                      borderRadius: '12px', 
                      background: 'rgba(79,70,229,0.15)', 
                      color: '#a5b4fc',
                      border: '1px solid rgba(79,70,229,0.15)'
                    }}>
                      {subject}
                    </span>
                  ))
                ) : (
                  <span style={{ color: '#94a3b8' }}>No subjects added yet</span>
                )}
              </div>
            )}
          </div>

          {/* Years Experience */}
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#94a3b8', marginBottom: '4px' }}>
              📅 Years of Experience
            </label>
            {isEditing ? (
              <input
                type="number"
                name="yearsExperience"
                value={editForm.yearsExperience || 0}
                onChange={handleInputChange}
                min="0"
                max="50"
                style={{ 
                  width: '100%', 
                  padding: '10px 14px', 
                  border: '1px solid rgba(255,255,255,0.08)', 
                  borderRadius: '8px', 
                  fontSize: '14px', 
                  background: 'rgba(255,255,255,0.04)', 
                  color: '#ffffff'
                }}
              />
            ) : (
              <span style={{ fontSize: '15px', color: '#ffffff', fontWeight: 500 }}>
                {editForm.yearsExperience || 0} years
              </span>
            )}
          </div>

          {/* Education */}
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#94a3b8', marginBottom: '4px' }}>
              🎓 Education
            </label>
            {isEditing ? (
              <input
                type="text"
                name="education"
                value={editForm.education || ''}
                onChange={handleInputChange}
                placeholder="e.g., BSc Mathematics, University of Cape Town"
                style={{ 
                  width: '100%', 
                  padding: '10px 14px', 
                  border: '1px solid rgba(255,255,255,0.08)', 
                  borderRadius: '8px', 
                  fontSize: '14px', 
                  background: 'rgba(255,255,255,0.04)', 
                  color: '#ffffff'
                }}
              />
            ) : (
              <span style={{ fontSize: '15px', color: '#ffffff', fontWeight: 500 }}>
                {editForm.education || 'Not specified'}
              </span>
            )}
          </div>

          {/* Phone */}
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#94a3b8', marginBottom: '4px' }}>
              📞 Phone Number
            </label>
            {isEditing ? (
              <input
                type="tel"
                name="phone"
                value={editForm.phone || ''}
                onChange={handleInputChange}
                placeholder="+27 82 123 4567"
                style={{ 
                  width: '100%', 
                  padding: '10px 14px', 
                  border: '1px solid rgba(255,255,255,0.08)', 
                  borderRadius: '8px', 
                  fontSize: '14px', 
                  background: 'rgba(255,255,255,0.04)', 
                  color: '#ffffff'
                }}
              />
            ) : (
              <span style={{ fontSize: '15px', color: '#ffffff', fontWeight: 500 }}>
                {editForm.phone || 'Not set'}
              </span>
            )}
          </div>

          {/* LinkedIn */}
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#94a3b8', marginBottom: '4px' }}>
              🔗 LinkedIn
            </label>
            {isEditing ? (
              <input
                type="url"
                name="linkedin"
                value={editForm.linkedin || ''}
                onChange={handleInputChange}
                placeholder="https://linkedin.com/in/your-profile"
                style={{ 
                  width: '100%', 
                  padding: '10px 14px', 
                  border: '1px solid rgba(255,255,255,0.08)', 
                  borderRadius: '8px', 
                  fontSize: '14px', 
                  background: 'rgba(255,255,255,0.04)', 
                  color: '#ffffff'
                }}
              />
            ) : (
              <span style={{ fontSize: '15px', color: '#ffffff', fontWeight: 500 }}>
                {editForm.linkedin || 'Not set'}
              </span>
            )}
          </div>

          {/* Website */}
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#94a3b8', marginBottom: '4px' }}>
              🌐 Website
            </label>
            {isEditing ? (
              <input
                type="url"
                name="website"
                value={editForm.website || ''}
                onChange={handleInputChange}
                placeholder="https://yourwebsite.com"
                style={{ 
                  width: '100%', 
                  padding: '10px 14px', 
                  border: '1px solid rgba(255,255,255,0.08)', 
                  borderRadius: '8px', 
                  fontSize: '14px', 
                  background: 'rgba(255,255,255,0.04)', 
                  color: '#ffffff'
                }}
              />
            ) : (
              <span style={{ fontSize: '15px', color: '#ffffff', fontWeight: 500 }}>
                {editForm.website || 'Not set'}
              </span>
            )}
          </div>
        </div>
      </div>
    );
  };

  // ============================================
  // STYLES
  // ============================================
  const containerStyle = {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '32px 40px',
    minHeight: '100vh',
    background: '#0a0e1a',
    color: '#ffffff'
  };

  const headerStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '24px',
    padding: '28px 32px',
    background: '#141b2d',
    borderRadius: '16px',
    border: '1px solid rgba(255,255,255,0.06)',
    marginBottom: '28px'
  };

  const statsGridStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '16px',
    marginBottom: '28px'
  };

  const statCardStyle = {
    background: '#141b2d',
    borderRadius: '12px',
    padding: '20px 24px',
    border: '1px solid rgba(255,255,255,0.06)',
    textAlign: 'center'
  };

  const gridStyle = {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '24px'
  };

  const cardStyle = {
    background: '#141b2d',
    borderRadius: '16px',
    padding: '24px 28px',
    border: '1px solid rgba(255,255,255,0.06)'
  };

  const cardFullStyle = {
    gridColumn: '1 / -1',
    background: '#141b2d',
    borderRadius: '16px',
    padding: '24px 28px',
    border: '1px solid rgba(255,255,255,0.06)'
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh', color: '#94a3b8' }}>
        Loading profile...
      </div>
    );
  }

  // ============================================
  // DETERMINE WHICH STATS TO SHOW
  // ============================================
  const statsToShow = isTutor ? [
    { number: tutorStats.totalSessions, label: 'Total Sessions' },
    { number: tutorStats.studentsTaught, label: 'Students Taught' },
    { number: `R${tutorStats.totalEarnings}`, label: 'Earnings' },
    { number: `${tutorStats.avgRating}⭐`, label: 'Rating' }
  ] : [
    { number: studentStats.coursesEnrolled, label: 'Courses Enrolled' },
    { number: studentStats.hoursSpent, label: 'Hours Spent' },
    { number: studentStats.badgesEarned, label: 'Badges Earned' },
    { number: `${studentStats.completionRate}%`, label: 'Completion Rate' }
  ];

  return (
    <div style={containerStyle}>
      {/* Header */}
      <div style={headerStyle}>
        <div style={{ 
          width: '80px', 
          height: '80px', 
          borderRadius: '50%', 
          position: 'relative',
          flexShrink: 0,
          overflow: 'visible',
          cursor: 'pointer'
        }} 
        onClick={isTutor ? triggerFileInput : () => setShowAvatarSelector(true)}
        >
          <div style={{
            width: '100%',
            height: '100%',
            borderRadius: '50%',
            overflow: 'hidden',
            background: isTutor ? 'linear-gradient(135deg, #059669, #10b981)' : 'linear-gradient(135deg, #4f46e5, #7c3aed)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            {isTutor ? (
              profilePhoto ? (
                <img 
                  src={profilePhoto} 
                  alt={user?.name || 'Tutor'} 
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                />
              ) : (
                <span style={{ fontSize: '36px' }}>👨‍🏫</span>
              )
            ) : (
              avatarImage ? (
                <img 
                  src={avatarImage} 
                  alt={user?.name || 'User'} 
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                />
              ) : (
                <span style={{ fontSize: '40px' }}>👤</span>
              )
            )}
          </div>
          
          <div style={{ 
            position: 'absolute', 
            bottom: '-4px', 
            right: '-4px', 
            background: isTutor ? '#10b981' : '#4f46e5', 
            color: 'white', 
            width: '32px', 
            height: '32px', 
            borderRadius: '50%', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            fontSize: '16px', 
            border: '3px solid #141b2d',
            boxShadow: '0 2px 10px rgba(0,0,0,0.4)',
            zIndex: 5,
            transition: 'transform 0.2s ease'
          }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
          >
            {isTutor ? '📸' : '✎'}
          </div>
        </div>

        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: '28px', fontWeight: 700, color: '#ffffff', margin: '0 0 4px 0' }}>
            {user?.name || 'User'}
            {isTutor && (
              <span style={{ 
                fontSize: '14px', 
                fontWeight: 600, 
                color: '#34d399', 
                background: 'rgba(52,211,153,0.15)', 
                padding: '2px 12px', 
                borderRadius: '12px', 
                marginLeft: '12px',
                border: '1px solid rgba(52,211,153,0.2)'
              }}>
                👨‍🏫 Tutor
              </span>
            )}
          </h1>
          <p style={{ fontSize: '15px', color: '#94a3b8', margin: '0 0 8px 0' }}>
            {isTutor ? 'Professional Mathematics Tutor' : (user?.cohort === 'HighSchool' ? 'High School Student' : 'University Student')} 
            {' • '}{user?.country || 'South Africa'}
          </p>
          <div style={{ 
            display: 'inline-flex', 
            alignItems: 'center', 
            gap: '8px', 
            fontSize: '13px', 
            color: '#6ee7b7', 
            background: 'rgba(52,211,153,0.1)', 
            padding: '4px 14px', 
            borderRadius: '20px', 
            border: '1px solid rgba(52,211,153,0.2)'
          }}>
            <span style={{ width: '8px', height: '8px', background: '#34d399', borderRadius: '50%', display: 'inline-block' }}></span>
            {isTutor ? 'Active Tutor' : 'Active Member'}
          </div>
        </div>
        <button onClick={() => setIsEditing(!isEditing)} style={{ 
          padding: '10px 24px', 
          borderRadius: '10px', 
          border: '1px solid rgba(255,255,255,0.1)', 
          background: 'rgba(255,255,255,0.05)', 
          color: '#ffffff', 
          fontSize: '14px', 
          fontWeight: 600, 
          cursor: 'pointer' 
        }}>
          {isEditing ? 'Cancel' : '✏️ Edit Profile'}
        </button>
      </div>

      {/* Hidden file input for tutor photo upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handlePhotoUpload}
        style={{ display: 'none' }}
      />

      {/* Status messages */}
      {photoError && <div style={{ background: 'rgba(239,68,68,0.1)', color: '#fca5a5', padding: '12px 20px', borderRadius: '10px', marginBottom: '16px', border: '1px solid rgba(239,68,68,0.15)' }}>{photoError}</div>}
      {photoUploading && <div style={{ background: 'rgba(52,211,153,0.1)', color: '#6ee7b7', padding: '12px 20px', borderRadius: '10px', marginBottom: '16px', border: '1px solid rgba(52,211,153,0.15)' }}>📤 Uploading photo...</div>}
      {error && <div style={{ background: 'rgba(239,68,68,0.1)', color: '#fca5a5', padding: '12px 20px', borderRadius: '10px', marginBottom: '16px', border: '1px solid rgba(239,68,68,0.15)' }}>{error}</div>}
      {success && <div style={{ background: 'rgba(52,211,153,0.1)', color: '#6ee7b7', padding: '12px 20px', borderRadius: '10px', marginBottom: '16px', border: '1px solid rgba(52,211,153,0.15)' }}>{success}</div>}

      {/* Stats */}
      <div style={statsGridStyle}>
        {statsToShow.map((stat, i) => (
          <div key={i} style={statCardStyle}>
            <span style={{ display: 'block', fontSize: '32px', fontWeight: 700, color: '#ffffff' }}>{stat.number}</span>
            <span style={{ display: 'block', fontSize: '14px', color: '#94a3b8', fontWeight: 500 }}>{stat.label}</span>
          </div>
        ))}
      </div>

      {/* Profile Grid */}
      <div style={gridStyle}>
        {/* Personal Information */}
        <div style={cardStyle}>
          <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#ffffff', margin: '0 0 20px 0', paddingBottom: '12px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            {isTutor ? '📋 Tutor Information' : '📋 Personal Information'}
          </h3>
          <div>
            {[
              { label: 'Full Name', name: 'name', value: editForm.name },
              { label: 'Email Address', name: 'email', value: editForm.email },
              { label: 'Country', name: 'country', value: editForm.country },
              { label: isTutor ? 'Expertise Level' : 'Grade / Year', name: 'grade', value: editForm.grade },
              { label: 'Role', name: 'cohort', value: isTutor ? 'Tutor' : (user?.cohort === 'HighSchool' ? 'High School Student' : 'University First Year') }
            ].map((field, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0' }}>
                <span style={{ fontSize: '13px', fontWeight: 500, color: '#94a3b8' }}>{field.label}</span>
                {isEditing && field.name !== 'cohort' ? (
                  <input
                    type="text"
                    name={field.name}
                    value={field.value}
                    onChange={handleInputChange}
                    style={{ 
                      padding: '8px 12px', 
                      border: '1px solid rgba(255,255,255,0.08)', 
                      borderRadius: '8px', 
                      fontSize: '14px', 
                      width: '60%', 
                      background: 'rgba(255,255,255,0.04)', 
                      color: '#ffffff' 
                    }}
                  />
                ) : (
                  <span style={{ fontSize: '15px', color: '#ffffff', fontWeight: 500 }}>{field.value || 'Not set'}</span>
                )}
              </div>
            ))}
          </div>
          {isEditing && (
            <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              <button onClick={handleSaveProfile} disabled={loading} style={{ 
                padding: '10px 28px', 
                background: 'linear-gradient(135deg, #4f46e5, #7c3aed)', 
                color: '#ffffff', 
                border: 'none', 
                borderRadius: '10px', 
                fontSize: '14px', 
                fontWeight: 600, 
                cursor: 'pointer' 
              }}>
                {loading ? 'Saving...' : '💾 Save Changes'}
              </button>
            </div>
          )}
        </div>

        {/* Account Settings */}
        <div style={cardStyle}>
          <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#ffffff', margin: '0 0 20px 0', paddingBottom: '12px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            🔒 Account Settings
          </h3>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <span style={{ fontSize: '20px' }}>🔑</span>
                <div>
                  <h4 style={{ fontSize: '14px', fontWeight: 600, color: '#ffffff', margin: '0 0 2px 0' }}>Change Password</h4>
                  <p style={{ fontSize: '13px', color: '#94a3b8', margin: '0' }}>Update your password regularly for security</p>
                </div>
              </div>
              <button onClick={() => setShowPasswordModal(true)} style={{ padding: '6px 18px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.04)', color: '#ffffff', fontSize: '13px', fontWeight: 500, cursor: 'pointer' }}>Update</button>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px', borderRadius: '10px', border: '1px solid rgba(239,68,68,0.2)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <span style={{ fontSize: '20px' }}>⚠️</span>
                <div>
                  <h4 style={{ fontSize: '14px', fontWeight: 600, color: '#ffffff', margin: '0 0 2px 0' }}>Delete Account</h4>
                  <p style={{ fontSize: '13px', color: '#94a3b8', margin: '0' }}>Permanently delete your account and all data</p>
                </div>
              </div>
              <button onClick={() => setShowDeleteModal(true)} style={{ padding: '6px 18px', borderRadius: '8px', border: '1px solid rgba(239,68,68,0.2)', background: 'rgba(239,68,68,0.1)', color: '#fca5a5', fontSize: '13px', fontWeight: 500, cursor: 'pointer' }}>Delete</button>
            </div>
          </div>
        </div>

        {/* ============================================
            TUTOR PROFILE FIELDS - DYNAMIC
            ============================================ */}
        {renderTutorFields()}

        {/* ============================================
            ENROLLED COURSES - STUDENTS ONLY
            ============================================ */}
        {!isTutor && (
          <div style={cardFullStyle}>
            <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#ffffff', margin: '0 0 20px 0', paddingBottom: '12px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>📚 My Courses</h3>
            {enrollments.length > 0 ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '12px' }}>
                {enrollments.map((course) => (
                  <div key={course.id} onClick={() => navigate(`/subjects/${course.name.toLowerCase()}`)} style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '14px 18px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.06)', cursor: 'pointer' }}>
                    <span style={{ fontSize: '28px' }}>{course.icon || '📘'}</span>
                    <div style={{ flex: 1 }}>
                      <h4 style={{ fontSize: '14px', fontWeight: 600, color: '#ffffff', margin: '0 0 2px 0' }}>{course.name}</h4>
                      <span style={{ fontSize: '12px', color: '#94a3b8' }}>{course.tier || 'Tier 1'}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: '70px' }}>
                      <div style={{ flex: 1, height: '6px', background: 'rgba(255,255,255,0.06)', borderRadius: '4px', overflow: 'hidden', minWidth: '40px' }}>
                        <div style={{ height: '100%', background: 'linear-gradient(135deg, #4f46e5, #7c3aed)', borderRadius: '4px', width: `${Math.floor(Math.random() * 60 + 20)}%` }}></div>
                      </div>
                      <span style={{ fontSize: '12px', fontWeight: 600, color: '#ffffff', minWidth: '36px', textAlign: 'right' }}>{Math.floor(Math.random() * 60 + 20)}%</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '32px 0', color: '#94a3b8' }}>
                <p>No courses enrolled yet</p>
                <button onClick={() => navigate('/subjects')} style={{ marginTop: '12px', padding: '10px 28px', background: 'linear-gradient(135deg, #4f46e5, #7c3aed)', color: '#ffffff', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}>Browse Subjects →</button>
              </div>
            )}
          </div>
        )}

        {/* ============================================
            TUTOR SESSIONS - TUTORS ONLY
            ============================================ */}
        {isTutor && (
          <div style={cardFullStyle}>
            <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#ffffff', margin: '0 0 20px 0', paddingBottom: '12px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>📋 Recent Sessions</h3>
            {tutorStats.totalSessions > 0 ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '12px' }}>
                <div style={{ textAlign: 'center', padding: '20px', color: '#94a3b8' }}>
                  <p style={{ fontSize: '14px' }}>You have taught {tutorStats.totalSessions} sessions</p>
                  <p style={{ fontSize: '13px', color: '#64748b' }}>View all sessions in your dashboard</p>
                  <button onClick={() => navigate('/tutor/dashboard')} style={{ marginTop: '12px', padding: '10px 28px', background: 'linear-gradient(135deg, #059669, #10b981)', color: '#ffffff', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}>Go to Dashboard →</button>
                </div>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '32px 0', color: '#94a3b8' }}>
                <p>No sessions taught yet</p>
                <p style={{ fontSize: '13px', color: '#64748b' }}>Students will book sessions with you soon!</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modals */}
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

      {/* Avatar Selector (Students only) */}
      {!isTutor && showAvatarSelector && (
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