// src/pages/Profile.js - FULLY FIXED WITH VIDEO UPLOAD
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../services/authService';
import AvatarSelector from '../components/AvatarSelector';
import { API_BASE_URL } from '../services/api';
import { tutorService } from '../services/tutorService';
import './Profile.css';

const Profile = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [isTutor, setIsTutor] = useState(false);
  
  const [subjectOptions, setSubjectOptions] = useState([]);
  const [shiftOptions, setShiftOptions] = useState([]);
  
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
  
  const [enrollments, setEnrollments] = useState([]);
  const [studentStats, setStudentStats] = useState({
    coursesEnrolled: 0,
    hoursSpent: 0,
    badgesEarned: 0,
    completionRate: 0
  });
  
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
  
  const [profilePhoto, setProfilePhoto] = useState(null);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [photoError, setPhotoError] = useState('');
  const fileInputRef = useRef(null);

  // ===== VIDEO STATE =====
  const [videoFile, setVideoFile] = useState(null);
  const [videoPreview, setVideoPreview] = useState(null);
  const [videoUploading, setVideoUploading] = useState(false);
  const [videoProgress, setVideoProgress] = useState(0);
  const [videoUrl, setVideoUrl] = useState(null);
  const [videoDuration, setVideoDuration] = useState(0);
  const [videoThumbnail, setVideoThumbnail] = useState(null);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const videoFileInputRef = useRef(null);

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => {
        setSuccess('');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  // ===== FETCH SUBJECTS AND SHIFTS =====
  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const subjectsResponse = await fetch(`${API_BASE_URL}/content/subjects`);
        if (subjectsResponse.ok) {
          const data = await subjectsResponse.json();
          if (data.success && data.subjects) {
            setSubjectOptions(data.subjects.map(s => s.name));
          }
        }

        const shiftsResponse = await fetch(`${API_BASE_URL}/shifts`);
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
  }, []);

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
          
          const isTutorAccount = userData.is_tutor === true || userData.role === 'tutor';
          setIsTutor(isTutorAccount);
          
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

          // ✅ FIX: Set video data from userData
          setVideoUrl(userData.intro_video_url || null);
          setVideoThumbnail(userData.intro_video_thumbnail || null);
          setVideoDuration(userData.intro_video_duration || 0);

          if (userData.subscription || userData.subscriptionTier) {
            setSubscription({
              tier: userData.subscriptionTier || userData.subscription?.tier || 'SILVER',
              status: userData.subscriptionStatus || userData.subscription?.status || 'active',
              endDate: userData.subscriptionEnd || userData.subscription?.end_date
            });
          }
          
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
          
          if (isTutorAccount) {
            await fetchTutorStats(userData);
          } else {
            await fetchStudentStats();
          }
        } else {
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

    const fetchStudentStats = async () => {
      try {
        const token = localStorage.getItem('accessToken');
        if (!token) return;

        const enrollResponse = await fetch(`${API_BASE_URL}/content/my/subjects`, {
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

    const fetchTutorStats = async (userData) => {
      try {
        const token = localStorage.getItem('accessToken');
        if (!token) return;

        let rating = 4.5;
        let ratingCount = 0;

        try {
          const tutorsResponse = await fetch(`${API_BASE_URL}/tutors`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });

          if (tutorsResponse.ok) {
            const tutorsData = await tutorsResponse.json();
            for (const shift of (tutorsData.tutors || [])) {
              const tutor = shift.tutors?.find(t => t.id === userData?.id);
              if (tutor) {
                rating = tutor.rating || tutor.tutorRating || 4.5;
                ratingCount = tutor.ratingCount || 0;
                break;
              }
            }
          }
        } catch (error) {
          console.error('❌ Failed to fetch rating:', error);
          rating = userData?.tutor_rating || userData?.rating || 4.5;
        }

        let totalEarnings = 0;
        let sessionsCount = 0;
        let uniqueStudents = new Set();

        try {
          const earningsResponse = await fetch(`${API_BASE_URL}/earnings`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });

          if (earningsResponse.ok) {
            const data = await earningsResponse.json();
            if (data.success && data.earnings) {
              totalEarnings = data.earnings.total || 0;
              sessionsCount = data.earnings.sessionsCount || 0;
              uniqueStudents = new Set(data.earnings.history?.map(h => h.studentId) || []);
            }
          }
        } catch (error) {
          console.error('❌ Failed to fetch earnings:', error);
          const sessionsResponse = await fetch(`${API_BASE_URL}/sessions`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });

          if (sessionsResponse.ok) {
            const data = await sessionsResponse.json();
            const sessions = data.sessions || [];
            uniqueStudents = new Set(sessions.map(s => s.user_id));
            const completedSessions = sessions.filter(s => s.status === 'completed' || s.status === 'ended');
            sessionsCount = sessions.length;
            totalEarnings = completedSessions.length * 100;
          }
        }

        setTutorStats({
          totalSessions: sessionsCount || tutorStats.totalSessions || 0,
          studentsTaught: uniqueStudents.size || tutorStats.studentsTaught || 0,
          totalEarnings: totalEarnings || tutorStats.totalEarnings || 0,
          avgRating: rating,
          ratingCount: ratingCount
        });

      } catch (error) {
        console.error('❌ Failed to fetch tutor stats:', error);
        const rating = userData?.tutor_rating || userData?.rating || 4.5;
        setTutorStats({
          totalSessions: 0,
          studentsTaught: 0,
          totalEarnings: 0,
          avgRating: rating,
          ratingCount: 0
        });
      }
    };

    fetchUserData();
  }, [navigate]);

  // ============================================
  // VIDEO HANDLERS - FULLY FIXED
  // ============================================
  const handleVideoSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const validTypes = ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-matroska'];
    if (!validTypes.includes(file.type)) {
      setError('Please upload a valid video file (MP4, WebM, MOV, MKV)');
      return;
    }

    if (file.size > 100 * 1024 * 1024) {
      setError('Video file must be less than 100MB');
      return;
    }

    setVideoFile(file);
    setError('');

    const previewUrl = URL.createObjectURL(file);
    setVideoPreview(previewUrl);

    const video = document.createElement('video');
    video.src = previewUrl;
    video.onloadedmetadata = () => {
      setVideoDuration(Math.round(video.duration));
    };

    generateThumbnail(file);
  };

  const generateThumbnail = (file) => {
    const video = document.createElement('video');
    const url = URL.createObjectURL(file);
    video.src = url;
    video.currentTime = 1;

    video.onloadeddata = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 640;
      canvas.height = 360;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const thumbnailDataUrl = canvas.toDataURL('image/jpeg', 0.8);
      setVideoThumbnail(thumbnailDataUrl);
      URL.revokeObjectURL(url);
    };

    video.onerror = () => {
      setVideoThumbnail(null);
      URL.revokeObjectURL(url);
    };
  };

  // ✅ FIXED: Upload video using tutorService with proper error handling
  const handleUploadVideo = async () => {
    if (!videoFile) {
      setError('Please select a video first');
      return;
    }

    try {
      setVideoUploading(true);
      setVideoProgress(0);
      setError('');

      const reader = new FileReader();
      reader.readAsDataURL(videoFile);
      
      reader.onload = async () => {
        try {
          const base64Video = reader.result;
          setVideoProgress(50);

          // ✅ Use tutorService.uploadIntroVideo
          const result = await tutorService.uploadIntroVideo({
            videoUrl: base64Video,
            thumbnail: videoThumbnail || null,
            duration: videoDuration
          });

          if (result.success) {
            setVideoUrl(base64Video);
            setSuccess('✅ Video uploaded successfully!');
            
            // Update user state
            setUser(prev => ({
              ...prev,
              intro_video_url: base64Video,
              intro_video_thumbnail: videoThumbnail,
              intro_video_duration: videoDuration
            }));

            setVideoProgress(100);
            
            if (videoFileInputRef.current) {
              videoFileInputRef.current.value = '';
            }
            
            setTimeout(() => setSuccess(''), 3000);
          } else {
            setError(result.error || 'Failed to upload video');
          }
        } catch (err) {
          setError(err.message || 'Failed to upload video');
        } finally {
          setVideoUploading(false);
        }
      };

      reader.onerror = () => {
        setError('Failed to read video file');
        setVideoUploading(false);
      };

    } catch (err) {
      setError(err.message || 'Failed to upload video');
      setVideoUploading(false);
    }
  };

  // ✅ FIXED: Remove video using tutorService
  const handleRemoveVideo = async () => {
    if (!window.confirm('Are you sure you want to remove your intro video?')) {
      return;
    }

    try {
      setVideoUploading(true);
      
      // ✅ Use tutorService.removeIntroVideo
      const result = await tutorService.removeIntroVideo();
      
      if (result.success) {
        setVideoUrl(null);
        setVideoThumbnail(null);
        setVideoDuration(0);
        setVideoPreview(null);
        setVideoFile(null);
        setSuccess('✅ Video removed successfully');
        
        setUser(prev => ({
          ...prev,
          intro_video_url: null,
          intro_video_thumbnail: null,
          intro_video_duration: 0
        }));
        
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(result.error || 'Failed to remove video');
      }
    } catch (err) {
      setError(err.message || 'Failed to remove video');
    } finally {
      setVideoUploading(false);
    }
  };

  const formatDuration = (seconds) => {
    if (!seconds) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // ============================================
  // HANDLERS
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

      const response = await fetch(`${API_BASE_URL}/auth/profile`, {
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

  // ============================================
  // SAVE PROFILE - FIXED
  // ============================================
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

      const payload = {
        name: editForm.name,
        email: editForm.email,
        country: editForm.country,
        timezone: editForm.timezone,
        grade: editForm.grade ? parseInt(editForm.grade) : 0,
        bio: editForm.bio || '',
        phone: editForm.phone || '',
        education: editForm.education || '',
        yearsExperience: parseInt(editForm.yearsExperience) || 0,
        linkedin: editForm.linkedin || '',
        website: editForm.website || '',
        tier: editForm.tier || '',
        subjects: editForm.subjects || [],
        shiftId: editForm.shiftId || ''
      };

      console.log('📤 Saving profile with payload:', payload);

      const response = await fetch(`${API_BASE_URL}/auth/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      console.log('📥 Save response:', data);

      if (response.ok && data.success) {
        const updatedUser = { ...user, ...data.user };
        setUser(updatedUser);
        
        localStorage.setItem('user', JSON.stringify(updatedUser));
        
        setEditForm({
          name: data.user.name || '',
          email: data.user.email || '',
          country: data.user.country || '',
          timezone: data.user.timezone || '',
          grade: data.user.grade || '',
          bio: data.user.bio || '',
          tier: data.user.tutor_tier || data.user.tier || '',
          subjects: data.user.tutor_subjects || [],
          shiftId: data.user.tutor_shift_id || '',
          yearsExperience: data.user.years_experience || 0,
          education: data.user.education || '',
          phone: data.user.phone || '',
          linkedin: data.user.linkedin || '',
          website: data.user.website || ''
        });

        setSuccess('✅ Profile updated successfully!');
        setIsEditing(false);
      } else {
        setError(data.error || 'Failed to update profile');
      }
    } catch (error) {
      console.error('❌ Save error:', error);
      setError('Failed to update profile: ' + error.message);
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

      const response = await fetch(`${API_BASE_URL}/auth/change-password`, {
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

      const response = await fetch(`${API_BASE_URL}/auth/account`, {
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

  const sectionTitleStyle = {
    fontSize: '18px',
    fontWeight: 600,
    color: '#ffffff',
    margin: '0 0 20px 0',
    paddingBottom: '12px',
    borderBottom: '1px solid rgba(255,255,255,0.06)'
  };

  const labelStyle = {
    display: 'block',
    fontSize: '13px',
    fontWeight: 500,
    color: '#94a3b8',
    marginBottom: '4px'
  };

  const valueStyle = {
    fontSize: '15px',
    color: '#ffffff',
    fontWeight: 500
  };

  const inputStyle = {
    width: '100%',
    padding: '10px 14px',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '8px',
    fontSize: '14px',
    background: 'rgba(255,255,255,0.04)',
    color: '#ffffff'
  };

  const fieldRowStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '6px 0'
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh', color: '#94a3b8' }}>
        Loading profile...
      </div>
    );
  }

  const statsToShow = isTutor ? [
    { number: tutorStats.totalSessions, label: 'Total Sessions' },
    { number: tutorStats.studentsTaught, label: 'Students Taught' },
    { number: `R${tutorStats.totalEarnings.toFixed(2)}`, label: 'Earnings' },
    { number: `${tutorStats.avgRating.toFixed(1)}⭐`, label: 'Rating' }
  ] : [
    { number: studentStats.coursesEnrolled, label: 'Courses Enrolled' },
    { number: studentStats.hoursSpent, label: 'Hours Spent' },
    { number: studentStats.badgesEarned, label: 'Badges Earned' },
    { number: `${studentStats.completionRate}%`, label: 'Completion Rate' }
  ];

  return (
    <div style={containerStyle}>
      {/* ===== HEADER ===== */}
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

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handlePhotoUpload}
          style={{ display: 'none' }}
        />

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

      {/* ===== STATUS MESSAGES ===== */}
      {photoError && <div style={{ background: 'rgba(239,68,68,0.1)', color: '#fca5a5', padding: '12px 20px', borderRadius: '10px', marginBottom: '16px', border: '1px solid rgba(239,68,68,0.15)' }}>{photoError}</div>}
      {photoUploading && <div style={{ background: 'rgba(52,211,153,0.1)', color: '#6ee7b7', padding: '12px 20px', borderRadius: '10px', marginBottom: '16px', border: '1px solid rgba(52,211,153,0.15)' }}>📤 Uploading photo...</div>}
      {error && <div style={{ background: 'rgba(239,68,68,0.1)', color: '#fca5a5', padding: '12px 20px', borderRadius: '10px', marginBottom: '16px', border: '1px solid rgba(239,68,68,0.15)' }}>{error}</div>}
      {success && <div style={{ background: 'rgba(52,211,153,0.1)', color: '#6ee7b7', padding: '12px 20px', borderRadius: '10px', marginBottom: '16px', border: '1px solid rgba(52,211,153,0.15)' }}>{success}</div>}

      {/* ===== STATS ===== */}
      <div style={statsGridStyle}>
        {statsToShow.map((stat, i) => (
          <div key={i} style={statCardStyle}>
            <span style={{ display: 'block', fontSize: '32px', fontWeight: 700, color: '#ffffff' }}>{stat.number}</span>
            <span style={{ display: 'block', fontSize: '14px', color: '#94a3b8', fontWeight: 500 }}>{stat.label}</span>
          </div>
        ))}
      </div>

      {/* ===== PROFILE GRID ===== */}
      <div style={gridStyle}>
        {/* ===== PERSONAL INFORMATION ===== */}
        <div style={cardStyle}>
          <h3 style={sectionTitleStyle}>
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
              <div key={i} style={fieldRowStyle}>
                <span style={{ fontSize: '13px', fontWeight: 500, color: '#94a3b8' }}>{field.label}</span>
                {isEditing && field.name !== 'cohort' ? (
                  <input
                    type="text"
                    name={field.name}
                    value={field.value}
                    onChange={handleInputChange}
                    style={inputStyle}
                  />
                ) : (
                  <span style={valueStyle}>{field.value || 'Not set'}</span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* ===== ACCOUNT SETTINGS ===== */}
        <div style={cardStyle}>
          <h3 style={sectionTitleStyle}>🔒 Account Settings</h3>
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
            TUTOR PROFILE - WITH VIDEO UPLOAD
            ============================================ */}
        {isTutor && (
          <div style={cardFullStyle}>
            <h3 style={sectionTitleStyle}>👨‍🏫 Tutor Profile</h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              {/* Bio - Full Width */}
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={labelStyle}>📝 About Me</label>
                {isEditing ? (
                  <textarea
                    name="bio"
                    value={editForm.bio || ''}
                    onChange={handleInputChange}
                    placeholder="Tell students about yourself..."
                    rows="4"
                    style={{ 
                      ...inputStyle,
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

              {/* Tier */}
              <div>
                <label style={labelStyle}>🏅 Tier / Level</label>
                {isEditing ? (
                  <select
                    name="tier"
                    value={editForm.tier || ''}
                    onChange={handleInputChange}
                    style={inputStyle}
                  >
                    <option value="">Select Tier</option>
                    <option value="TIER_1">TIER_1 - Grades 8-9</option>
                    <option value="TIER_2">TIER_2 - Grades 10-11</option>
                    <option value="TIER_3">TIER_3 - Grade 12 & Tertiary</option>
                  </select>
                ) : (
                  <span style={valueStyle}>{editForm.tier || 'Not set'}</span>
                )}
              </div>

              {/* Shift */}
              <div>
                <label style={labelStyle}>⏰ Shift</label>
                {isEditing ? (
                  <select
                    name="shiftId"
                    value={editForm.shiftId || ''}
                    onChange={handleInputChange}
                    style={inputStyle}
                  >
                    <option value="">Select Shift</option>
                    {shiftOptions.map(shift => (
                      <option key={shift.id} value={shift.id}>
                        {shift.name} ({shift.sast_start} - {shift.sast_end})
                      </option>
                    ))}
                  </select>
                ) : (
                  <span style={valueStyle}>
                    {shiftOptions.find(s => s.id === editForm.shiftId)?.name || 'Not set'}
                  </span>
                )}
              </div>

              {/* Subjects - Full Width */}
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={labelStyle}>📖 Subjects Taught</label>
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
                <label style={labelStyle}>📅 Years of Experience</label>
                {isEditing ? (
                  <input
                    type="number"
                    name="yearsExperience"
                    value={editForm.yearsExperience || 0}
                    onChange={handleInputChange}
                    min="0"
                    max="50"
                    style={inputStyle}
                  />
                ) : (
                  <span style={valueStyle}>{editForm.yearsExperience || 0} years</span>
                )}
              </div>

              {/* Education */}
              <div>
                <label style={labelStyle}>🎓 Education</label>
                {isEditing ? (
                  <input
                    type="text"
                    name="education"
                    value={editForm.education || ''}
                    onChange={handleInputChange}
                    placeholder="e.g., BSc Mathematics, University of Cape Town"
                    style={inputStyle}
                  />
                ) : (
                  <span style={valueStyle}>{editForm.education || 'Not specified'}</span>
                )}
              </div>

              {/* Phone */}
              <div>
                <label style={labelStyle}>📞 Phone Number</label>
                {isEditing ? (
                  <input
                    type="tel"
                    name="phone"
                    value={editForm.phone || ''}
                    onChange={handleInputChange}
                    placeholder="+27 82 123 4567"
                    style={inputStyle}
                  />
                ) : (
                  <span style={valueStyle}>{editForm.phone || 'Not set'}</span>
                )}
              </div>

              {/* LinkedIn */}
              <div>
                <label style={labelStyle}>🔗 LinkedIn</label>
                {isEditing ? (
                  <input
                    type="url"
                    name="linkedin"
                    value={editForm.linkedin || ''}
                    onChange={handleInputChange}
                    placeholder="https://linkedin.com/in/your-profile"
                    style={inputStyle}
                  />
                ) : (
                  <span style={valueStyle}>{editForm.linkedin || 'Not set'}</span>
                )}
              </div>

              {/* Website */}
              <div>
                <label style={labelStyle}>🌐 Website</label>
                {isEditing ? (
                  <input
                    type="url"
                    name="website"
                    value={editForm.website || ''}
                    onChange={handleInputChange}
                    placeholder="https://yourwebsite.com"
                    style={inputStyle}
                  />
                ) : (
                  <span style={valueStyle}>{editForm.website || 'Not set'}</span>
                )}
              </div>

              {/* ============================================
                  VIDEO UPLOAD SECTION - FULLY FIXED
                  ============================================ */}
              <div style={{ gridColumn: '1 / -1', marginTop: '8px', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                <label style={labelStyle}>🎬 Intro Video</label>
                <p style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '12px' }}>
                  Upload a short introduction video (max 100MB, MP4/WebM/MOV)
                </p>

                {videoUrl ? (
                  // Video exists - show preview
                  <div>
                    <div style={{ position: 'relative', borderRadius: '12px', overflow: 'hidden', background: '#0a0e1a', maxWidth: '400px' }}>
                      <video
                        src={videoUrl}
                        controls
                        style={{ width: '100%', maxHeight: '300px', borderRadius: '12px', background: '#0a0e1a' }}
                        poster={videoThumbnail}
                      />
                      <div style={{ position: 'absolute', bottom: '12px', right: '12px', background: 'rgba(0,0,0,0.7)', padding: '4px 12px', borderRadius: '8px' }}>
                        <span style={{ fontSize: '13px', color: '#ffffff' }}>
                          ⏱️ {formatDuration(videoDuration)}
                        </span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '12px', marginTop: '12px', flexWrap: 'wrap' }}>
                      <button
                        onClick={() => setShowVideoModal(true)}
                        style={{ padding: '8px 20px', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', background: 'rgba(255,255,255,0.04)', color: '#ffffff', fontSize: '13px', fontWeight: 500, cursor: 'pointer' }}
                      >
                        👁️ Preview
                      </button>
                      <button
                        onClick={handleRemoveVideo}
                        disabled={videoUploading}
                        style={{ padding: '8px 20px', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '8px', background: 'rgba(239,68,68,0.1)', color: '#fca5a5', fontSize: '13px', fontWeight: 500, cursor: 'pointer', opacity: videoUploading ? 0.6 : 1 }}
                      >
                        🗑️ Remove
                      </button>
                    </div>
                  </div>
                ) : (
                  // No video - show upload UI
                  <div>
                    {videoPreview ? (
                      <div>
                        <div style={{ position: 'relative', borderRadius: '12px', overflow: 'hidden', background: '#0a0e1a', maxWidth: '400px' }}>
                          <video
                            src={videoPreview}
                            controls
                            style={{ width: '100%', maxHeight: '300px', borderRadius: '12px', background: '#0a0e1a' }}
                            poster={videoThumbnail}
                          />
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '8px 12px', background: 'rgba(255,255,255,0.04)', borderRadius: '8px', fontSize: '13px', color: '#94a3b8', marginTop: '8px', flexWrap: 'wrap' }}>
                          <span style={{ color: '#ffffff', fontWeight: 500 }}>📁 {videoFile?.name}</span>
                          <span>({(videoFile?.size / (1024 * 1024)).toFixed(1)} MB)</span>
                          {videoDuration > 0 && <span>⏱️ {formatDuration(videoDuration)}</span>}
                        </div>
                        <div style={{ display: 'flex', gap: '12px', marginTop: '12px', flexWrap: 'wrap' }}>
                          <button
                            onClick={handleUploadVideo}
                            disabled={videoUploading}
                            style={{ padding: '8px 24px', background: 'linear-gradient(135deg, #4f46e5, #7c3aed)', color: '#ffffff', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: 600, cursor: 'pointer', opacity: videoUploading ? 0.6 : 1 }}
                          >
                            {videoUploading ? (
                              <>
                                <span style={{ display: 'inline-block', width: '14px', height: '14px', border: '2px solid rgba(255,255,255,0.2)', borderTopColor: '#ffffff', borderRadius: '50%', animation: 'spin 0.8s linear infinite', marginRight: '8px', verticalAlign: 'middle' }}></span>
                                Uploading...
                              </>
                            ) : (
                              '✅ Upload Video'
                            )}
                          </button>
                          <button
                            onClick={() => {
                              setVideoPreview(null);
                              setVideoFile(null);
                              setVideoThumbnail(null);
                              setVideoDuration(0);
                              if (videoFileInputRef.current) {
                                videoFileInputRef.current.value = '';
                              }
                            }}
                            disabled={videoUploading}
                            style={{ padding: '8px 20px', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', background: 'rgba(255,255,255,0.04)', color: '#ffffff', fontSize: '13px', fontWeight: 500, cursor: 'pointer', opacity: videoUploading ? 0.6 : 1 }}
                          >
                            Cancel
                          </button>
                        </div>
                        {videoUploading && (
                          <div style={{ position: 'relative', width: '100%', maxWidth: '400px', height: '6px', background: 'rgba(255,255,255,0.06)', borderRadius: '4px', overflow: 'hidden', marginTop: '12px' }}>
                            <div style={{ width: `${videoProgress}%`, height: '100%', background: 'linear-gradient(135deg, #4f46e5, #7c3aed)', borderRadius: '4px', transition: 'width 0.3s ease' }} />
                            <span style={{ position: 'absolute', right: 0, top: '-20px', fontSize: '12px', color: '#94a3b8' }}>
                              {videoProgress}%
                            </span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div style={{ border: '2px dashed rgba(255,255,255,0.15)', borderRadius: '12px', padding: '30px 20px', textAlign: 'center', position: 'relative', transition: 'all 0.3s ease', cursor: 'pointer', background: 'rgba(255,255,255,0.02)', maxWidth: '400px' }}>
                        <input
                          type="file"
                          accept="video/mp4,video/webm,video/quicktime,video/x-matroska"
                          onChange={handleVideoSelect}
                          ref={videoFileInputRef}
                          disabled={videoUploading}
                          style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }}
                        />
                        <div>
                          <span style={{ fontSize: '40px' }}>🎥</span>
                          <p style={{ fontSize: '15px', color: '#e2e8f0', margin: '8px 0 4px 0' }}>Click to upload</p>
                          <small style={{ fontSize: '12px', color: '#94a3b8' }}>MP4, WebM, MOV • Max 100MB</small>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* ===== SAVE BUTTON ===== */}
            {isEditing && (
              <div style={{ 
                marginTop: '24px', 
                paddingTop: '20px', 
                borderTop: '1px solid rgba(255,255,255,0.06)',
                display: 'flex',
                justifyContent: 'flex-end'
              }}>
                <button 
                  onClick={handleSaveProfile} 
                  disabled={loading}
                  style={{ 
                    padding: '12px 40px', 
                    background: 'linear-gradient(135deg, #4f46e5, #7c3aed)', 
                    color: '#ffffff', 
                    border: 'none', 
                    borderRadius: '10px', 
                    fontSize: '16px', 
                    fontWeight: 600, 
                    cursor: 'pointer',
                    transition: 'all 0.3s ease'
                  }}
                >
                  {loading ? 'Saving...' : '💾 Save Changes'}
                </button>
              </div>
            )}
          </div>
        )}

        {/* ============================================
            STUDENT: ENROLLED COURSES
            ============================================ */}
        {!isTutor && (
          <div style={cardFullStyle}>
            <h3 style={sectionTitleStyle}>📚 My Courses</h3>
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
            TUTOR: RECENT SESSIONS
            ============================================ */}
        {isTutor && (
          <div style={cardFullStyle}>
            <h3 style={sectionTitleStyle}>📋 Recent Sessions</h3>
            {tutorStats.totalSessions > 0 ? (
              <div style={{ textAlign: 'center', padding: '20px', color: '#94a3b8' }}>
                <p style={{ fontSize: '14px' }}>You have taught {tutorStats.totalSessions} sessions</p>
                <p style={{ fontSize: '13px', color: '#64748b' }}>View all sessions in your dashboard</p>
                <button onClick={() => navigate('/tutor/dashboard')} style={{ marginTop: '12px', padding: '10px 28px', background: 'linear-gradient(135deg, #059669, #10b981)', color: '#ffffff', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}>Go to Dashboard →</button>
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

      {/* ============================================
          VIDEO PREVIEW MODAL
          ============================================ */}
      {showVideoModal && videoUrl && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={() => setShowVideoModal(false)}>
          <div style={{ background: '#141b2d', borderRadius: '16px', maxWidth: '640px', width: '90%', maxHeight: '90vh', overflow: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.06)' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#ffffff', margin: 0 }}>🎬 Intro Video Preview</h3>
              <button onClick={() => setShowVideoModal(false)} style={{ background: 'none', border: 'none', fontSize: '24px', color: '#94a3b8', cursor: 'pointer' }}>×</button>
            </div>
            <div style={{ padding: '20px' }}>
              <video
                src={videoUrl}
                controls
                autoPlay
                style={{ width: '100%', maxHeight: '70vh', borderRadius: '8px', background: '#0a0e1a' }}
                poster={videoThumbnail}
              />
              <div style={{ marginTop: '12px', padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px' }}>
                <p style={{ fontSize: '14px', color: '#94a3b8', margin: '0 0 8px 0' }}>
                  This video will be shown to students on your profile card.
                </p>
                {videoDuration > 0 && (
                  <span style={{ fontSize: '13px', color: '#64748b' }}>
                    ⏱️ Duration: {formatDuration(videoDuration)}
                  </span>
                )}
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '16px 24px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              <button onClick={() => setShowVideoModal(false)} style={{ padding: '10px 24px', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', background: 'rgba(255,255,255,0.04)', color: '#ffffff', fontSize: '14px', fontWeight: 500, cursor: 'pointer' }}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================
          MODALS
          ============================================ */}
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
                  <input type="password" value={passwordData.currentPassword} onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))} required style={inputStyle} />
                </div>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#94a3b8', marginBottom: '4px' }}>New Password</label>
                  <input type="password" value={passwordData.newPassword} onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))} required minLength="8" style={inputStyle} />
                </div>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#94a3b8', marginBottom: '4px' }}>Confirm New Password</label>
                  <input type="password" value={passwordData.confirmPassword} onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))} required style={inputStyle} />
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

      {/* ===== AVATAR SELECTOR ===== */}
      {!isTutor && showAvatarSelector && (
        <AvatarSelector
          onSelect={handleAvatarSelect}
          currentAvatar={avatarData}
          onClose={() => setShowAvatarSelector(false)}
        />
      )}

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default Profile;