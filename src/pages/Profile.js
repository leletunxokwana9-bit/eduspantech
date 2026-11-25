
// src/pages/Profile.js - COMPLETE WITH UUID FIX + TUTOR WEEKLY AVAILABILITY
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../services/authService';
import AvatarSelector from '../components/AvatarSelector';
import { API_BASE_URL } from '../services/api';
import { tutorService } from '../services/tutorService';
import './Profile.css';

// PostgreSQL EXTRACT(DOW) convention:
// Sunday = 0, Monday = 1, ... Saturday = 6.
const TUTOR_WEEK_DAYS = [
  { dayOfWeek: 1, name: 'Monday' },
  { dayOfWeek: 2, name: 'Tuesday' },
  { dayOfWeek: 3, name: 'Wednesday' },
  { dayOfWeek: 4, name: 'Thursday' },
  { dayOfWeek: 5, name: 'Friday' },
  { dayOfWeek: 6, name: 'Saturday' },
  { dayOfWeek: 0, name: 'Sunday' }
];

const createEmptyAvailability = () =>
  TUTOR_WEEK_DAYS.map((day) => ({
    ...day,
    enabled: false,
    slots: []
  }));

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

  // ============================================
  // VIDEO STATE
  // ============================================

  const [videoFile, setVideoFile] = useState(null);
  const [videoPreview, setVideoPreview] = useState(null);
  const [videoUploading, setVideoUploading] = useState(false);
  const [videoProgress, setVideoProgress] = useState(0);
  const [videoUrl, setVideoUrl] = useState(null);
  const [videoDuration, setVideoDuration] = useState(0);
  const [videoThumbnail, setVideoThumbnail] = useState(null);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [videoViews, setVideoViews] = useState(0);

  const videoFileInputRef = useRef(null);

  // ===== VIDEO MANAGEMENT MODAL =====
  const [showVideoManager, setShowVideoManager] = useState(false);

  // ============================================
  // TUTOR WEEKLY AVAILABILITY STATE
  // ============================================

  const [availabilityDays, setAvailabilityDays] = useState(
    createEmptyAvailability
  );

  const [availabilityLoading, setAvailabilityLoading] = useState(false);
  const [availabilitySaving, setAvailabilitySaving] = useState(false);
  const [availabilityMessage, setAvailabilityMessage] = useState('');
  const [availabilityError, setAvailabilityError] = useState(false);

  // ============================================
  // SUCCESS MESSAGE TIMER
  // ============================================

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  // ============================================
  // FETCH SUBJECTS AND SHIFTS
  // ============================================

  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const subjectsResponse = await fetch(
          `${API_BASE_URL}/content/subjects`
        );

        if (subjectsResponse.ok) {
          const data = await subjectsResponse.json();

          if (data.success && data.subjects) {
            setSubjectOptions(data.subjects.map((s) => s.name));
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

  // ============================================
  // FETCH USER DATA
  // ============================================

  const fetchUserData = async () => {
    try {
      const token = localStorage.getItem('accessToken');

      if (!token) {
        navigate('/login');
        return;
      }

      const userData =
        await authService.getCurrentUserWithSubscription();

      if (userData) {
        setUser(userData);

        const isTutorAccount =
          userData.is_tutor === true ||
          userData.role === 'tutor';

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

        if (userData.intro_video_url) {
          setVideoUrl(userData.intro_video_url);
          setVideoThumbnail(
            userData.intro_video_thumbnail || null
          );
          setVideoDuration(
            userData.intro_video_duration || 0
          );
          setVideoViews(
            userData.intro_video_views || 0
          );
        } else {
          setVideoUrl(null);
          setVideoThumbnail(null);
          setVideoDuration(0);
          setVideoViews(0);
        }

        if (
          userData.subscription ||
          userData.subscriptionTier
        ) {
          setSubscription({
            tier:
              userData.subscriptionTier ||
              userData.subscription?.tier ||
              'SILVER',

            status:
              userData.subscriptionStatus ||
              userData.subscription?.status ||
              'active',

            endDate:
              userData.subscriptionEnd ||
              userData.subscription?.end_date
          });
        }

        setEditForm({
          name: userData.name || '',
          email: userData.email || '',
          country: userData.country || '',
          timezone: userData.timezone || '',
          grade: userData.grade || '',
          bio: userData.bio || '',

          tier:
            userData.tutor_tier ||
            userData.tier ||
            '',

          subjects: userData.tutor_subjects || [],

          shiftId: userData.tutor_shift_id || '',

          yearsExperience:
            userData.years_experience || 0,

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

  // ============================================
  // STUDENT STATISTICS
  // ============================================

  const fetchStudentStats = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) return;

      const enrollResponse = await fetch(
        `${API_BASE_URL}/content/my/subjects`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (enrollResponse.ok) {
        const data = await enrollResponse.json();

        if (data.success) {
          const subjects = data.subjects || [];

          setEnrollments(subjects);

          setStudentStats({
            coursesEnrolled: subjects.length,
            hoursSpent: 0,
            badgesEarned: 0,

            completionRate:
              subjects.length > 0
                ? Math.min(subjects.length * 20, 100)
                : 0
          });
        }
      }
    } catch (error) {
      console.error('❌ Failed to fetch student stats:', error);
    }
  };

  // ============================================
  // TUTOR STATISTICS
  // ============================================

  const fetchTutorStats = async (userData) => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) return;

      let rating = 4.5;
      let ratingCount = 0;

      try {
        const tutorsResponse = await fetch(
          `${API_BASE_URL}/tutors`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );

        if (tutorsResponse.ok) {
          const tutorsData = await tutorsResponse.json();

          for (const shift of (tutorsData.tutors || [])) {
            const tutor = shift.tutors?.find(
              (t) => t.id === userData?.id
            );

            if (tutor) {
              rating =
                tutor.rating ||
                tutor.tutorRating ||
                4.5;

              ratingCount = tutor.ratingCount || 0;
              break;
            }
          }
        }
      } catch (error) {
        console.error('❌ Failed to fetch rating:', error);

        rating =
          userData?.tutor_rating ||
          userData?.rating ||
          4.5;
      }

      let totalEarnings = 0;
      let sessionsCount = 0;
      let uniqueStudents = new Set();

      try {
        const earningsResponse = await fetch(
          `${API_BASE_URL}/earnings`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );

        if (earningsResponse.ok) {
          const data = await earningsResponse.json();

          if (data.success && data.earnings) {
            totalEarnings = data.earnings.total || 0;

            sessionsCount =
              data.earnings.sessionsCount || 0;

            uniqueStudents = new Set(
              data.earnings.history?.map(
                (h) => h.studentId
              ) || []
            );
          }
        }
      } catch (error) {
        console.error('❌ Failed to fetch earnings:', error);

        const sessionsResponse = await fetch(
          `${API_BASE_URL}/sessions`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );

        if (sessionsResponse.ok) {
          const data = await sessionsResponse.json();
          const sessions = data.sessions || [];

          uniqueStudents = new Set(
            sessions.map((s) => s.user_id)
          );

          const completedSessions = sessions.filter(
            (s) =>
              s.status === 'completed' ||
              s.status === 'ended'
          );

          sessionsCount = sessions.length;
          totalEarnings = completedSessions.length * 100;
        }
      }

      setTutorStats({
        totalSessions:
          sessionsCount || tutorStats.totalSessions || 0,

        studentsTaught:
          uniqueStudents.size ||
          tutorStats.studentsTaught ||
          0,

        totalEarnings:
          totalEarnings ||
          tutorStats.totalEarnings ||
          0,

        avgRating: rating,
        ratingCount: ratingCount
      });
    } catch (error) {
      console.error('❌ Failed to fetch tutor stats:', error);

      const rating =
        userData?.tutor_rating ||
        userData?.rating ||
        4.5;

      setTutorStats({
        totalSessions: 0,
        studentsTaught: 0,
        totalEarnings: 0,
        avgRating: rating,
        ratingCount: 0
      });
    }
  };

  useEffect(() => {
    fetchUserData();
  }, []);

  // ============================================
  // LOAD TUTOR WEEKLY AVAILABILITY
  // ============================================

  useEffect(() => {
    if (!isTutor) return;

    let cancelled = false;

    const loadAvailability = async () => {
      setAvailabilityLoading(true);
      setAvailabilityError(false);
      setAvailabilityMessage('');

      try {
        const token = localStorage.getItem('accessToken');

        if (!token) {
          throw new Error(
            'Your session has expired. Please sign in again.'
          );
        }

        const response = await fetch(
          `${API_BASE_URL}/tutors/availability/me`,
          {
            method: 'GET',
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );

        const result = await response.json();

        if (!response.ok) {
          throw new Error(
            result.error ||
            'Could not load your weekly availability.'
          );
        }

        if (cancelled) return;

        const savedSlots = result.availability || [];

        const mappedDays = TUTOR_WEEK_DAYS.map((day) => {
          const daySlots = savedSlots
            .filter(
              (slot) =>
                Number(slot.day_of_week) === day.dayOfWeek
            )
            .map((slot) => ({
              startTime: String(
                slot.start_time || ''
              ).slice(0, 5),

              endTime: String(
                slot.end_time || ''
              ).slice(0, 5)
            }));

          return {
            ...day,
            enabled: daySlots.length > 0,
            slots: daySlots
          };
        });

        setAvailabilityDays(mappedDays);
      } catch (error) {
        if (!cancelled) {
          console.error(
            'Availability loading error:',
            error
          );

          setAvailabilityError(true);
          setAvailabilityMessage(error.message);
        }
      } finally {
        if (!cancelled) {
          setAvailabilityLoading(false);
        }
      }
    };

    loadAvailability();

    return () => {
      cancelled = true;
    };
  }, [isTutor]);

  // ============================================
  // AVAILABILITY: TOGGLE DAY
  // ============================================

  const toggleAvailabilityDay = (dayOfWeek, enabled) => {
    setAvailabilityDays((current) =>
      current.map((day) => {
        if (day.dayOfWeek !== dayOfWeek) {
          return day;
        }

        return {
          ...day,
          enabled,

          slots: enabled
            ? (
                day.slots.length > 0
                  ? day.slots
                  : [
                      {
                        startTime: '09:00',
                        endTime: '17:00'
                      }
                    ]
              )
            : day.slots
        };
      })
    );
  };

  // ============================================
  // AVAILABILITY: UPDATE TIME
  // ============================================

  const updateAvailabilityTime = (
    dayOfWeek,
    slotIndex,
    field,
    value
  ) => {
    setAvailabilityDays((current) =>
      current.map((day) => {
        if (day.dayOfWeek !== dayOfWeek) {
          return day;
        }

        return {
          ...day,

          slots: day.slots.map((slot, index) =>
            index === slotIndex
              ? {
                  ...slot,
                  [field]: value
                }
              : slot
          )
        };
      })
    );
  };

  // ============================================
  // AVAILABILITY: ADD TIME RANGE
  // ============================================

  const addAvailabilitySlot = (dayOfWeek) => {
    setAvailabilityDays((current) =>
      current.map((day) => {
        if (day.dayOfWeek !== dayOfWeek) {
          return day;
        }

        const previousSlot =
          day.slots[day.slots.length - 1];

        const nextStart =
          previousSlot?.endTime || '09:00';

        // Default the next range to one hour.
        const [hours, minutes] = nextStart
          .split(':')
          .map(Number);

        const nextEndMinutes = Math.min(
          hours * 60 + minutes + 60,
          23 * 60 + 59
        );

        const nextEnd =
          `${String(Math.floor(nextEndMinutes / 60)).padStart(2, '0')}:` +
          `${String(nextEndMinutes % 60).padStart(2, '0')}`;

        return {
          ...day,

          slots: [
            ...day.slots,
            {
              startTime: nextStart,
              endTime: nextEnd
            }
          ]
        };
      })
    );
  };

  // ============================================
  // AVAILABILITY: REMOVE TIME RANGE
  // ============================================

  const removeAvailabilitySlot = (
    dayOfWeek,
    slotIndex
  ) => {
    setAvailabilityDays((current) =>
      current.map((day) => {
        if (day.dayOfWeek !== dayOfWeek) {
          return day;
        }

        return {
          ...day,

          slots: day.slots.filter(
            (_, index) => index !== slotIndex
          )
        };
      })
    );
  };

  // ============================================
  // AVAILABILITY: VALIDATE
  // ============================================

  const validateAvailability = () => {
    const enabledDays = availabilityDays.filter(
      (day) => day.enabled
    );

    for (const day of enabledDays) {
      if (day.slots.length === 0) {
        return `Please add at least one time range for ${day.name}.`;
      }

      const sortedSlots = [...day.slots].sort(
        (a, b) =>
          a.startTime.localeCompare(b.startTime)
      );

      for (const slot of sortedSlots) {
        if (!slot.startTime || !slot.endTime) {
          return `Complete all time ranges for ${day.name}.`;
        }

        if (slot.startTime >= slot.endTime) {
          return `The end time must be later than the start time on ${day.name}.`;
        }
      }

      // Prevent overlapping time ranges on the same day.
      for (let i = 1; i < sortedSlots.length; i++) {
        if (
          sortedSlots[i].startTime <
          sortedSlots[i - 1].endTime
        ) {
          return `Your time ranges overlap on ${day.name}. Please adjust them.`;
        }
      }
    }

    return null;
  };

  // ============================================
  // AVAILABILITY: SAVE
  // ============================================

  const saveAvailability = async () => {
    setAvailabilitySaving(true);
    setAvailabilityError(false);
    setAvailabilityMessage('');

    try {
      const token = localStorage.getItem('accessToken');

      if (!token) {
        throw new Error(
          'Your session has expired. Please sign in again.'
        );
      }

      const validationError = validateAvailability();

      if (validationError) {
        throw new Error(validationError);
      }

      const slots = availabilityDays
        .filter((day) => day.enabled)
        .flatMap((day) =>
          day.slots.map((slot) => ({
            day_of_week: day.dayOfWeek,
            start_time: slot.startTime,
            end_time: slot.endTime
          }))
        );

      const response = await fetch(
        `${API_BASE_URL}/tutors/availability/me`,
        {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ slots })
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error ||
          'Could not save your weekly availability.'
        );
      }

      const savedSlots = result.availability || [];

      const mappedDays = TUTOR_WEEK_DAYS.map((day) => {
        const daySlots = savedSlots
          .filter(
            (slot) =>
              Number(slot.day_of_week) === day.dayOfWeek
          )
          .map((slot) => ({
            startTime: String(
              slot.start_time || ''
            ).slice(0, 5),

            endTime: String(
              slot.end_time || ''
            ).slice(0, 5)
          }));

        return {
          ...day,
          enabled: daySlots.length > 0,
          slots: daySlots
        };
      });

      setAvailabilityDays(mappedDays);

      setAvailabilityMessage(
        result.message ||
        'Weekly availability saved successfully.'
      );

      setAvailabilityError(false);
    } catch (error) {
      console.error(
        'Availability saving error:',
        error
      );

      setAvailabilityError(true);
      setAvailabilityMessage(error.message);
    } finally {
      setAvailabilitySaving(false);
    }
  };

  // ============================================
  // REFRESH USER DATA
  // ============================================

  const refreshUserData = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) return;

      const response = await fetch(
        `${API_BASE_URL}/auth/profile`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.ok) {
        const data = await response.json();

        if (data.success && data.user) {
          const userData = data.user;

          setUser(userData);

          if (userData.intro_video_url) {
            setVideoUrl(userData.intro_video_url);

            setVideoThumbnail(
              userData.intro_video_thumbnail || null
            );

            setVideoDuration(
              userData.intro_video_duration || 0
            );

            setVideoViews(
              userData.intro_video_views || 0
            );
          } else {
            setVideoUrl(null);
            setVideoThumbnail(null);
            setVideoDuration(0);
            setVideoViews(0);
          }

          localStorage.setItem(
            'user',
            JSON.stringify(userData)
          );
        }
      }
    } catch (error) {
      console.error(
        '❌ Failed to refresh user data:',
        error
      );
    }
  };

  // ============================================
  // VIDEO HANDLERS
  // ============================================

  const handleVideoSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const validTypes = [
      'video/mp4',
      'video/webm',
      'video/quicktime',
      'video/x-matroska'
    ];

    if (!validTypes.includes(file.type)) {
      setError(
        'Please upload a valid video file (MP4, WebM, MOV, MKV)'
      );
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
      setVideoDuration(
        Math.round(video.duration)
      );
    };

    generateThumbnail(file);
    setShowVideoManager(true);
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

      ctx.drawImage(
        video,
        0,
        0,
        canvas.width,
        canvas.height
      );

      const thumbnailDataUrl = canvas.toDataURL(
        'image/jpeg',
        0.8
      );

      setVideoThumbnail(thumbnailDataUrl);
      URL.revokeObjectURL(url);
    };

    video.onerror = () => {
      setVideoThumbnail(null);
      URL.revokeObjectURL(url);
    };
  };

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

          const result =
            await tutorService.uploadIntroVideo({
              videoUrl: base64Video,
              thumbnail: videoThumbnail || null,
              duration: videoDuration
            });

          if (result.success) {
            setSuccess(
              '✅ Video uploaded successfully!'
            );

            await refreshUserData();

            if (videoFileInputRef.current) {
              videoFileInputRef.current.value = '';
            }

            setVideoPreview(null);
            setVideoFile(null);
            setVideoProgress(100);
            setShowVideoManager(false);

            setTimeout(
              () => setSuccess(''),
              5000
            );
          } else {
            setError(
              result.error || 'Failed to upload video'
            );
          }
        } catch (err) {
          setError(
            err.message || 'Failed to upload video'
          );
        } finally {
          setVideoUploading(false);
        }
      };

      reader.onerror = () => {
        setError('Failed to read video file');
        setVideoUploading(false);
      };
    } catch (err) {
      setError(
        err.message || 'Failed to upload video'
      );

      setVideoUploading(false);
    }
  };

  const handleRemoveVideo = async () => {
    if (
      !window.confirm(
        'Are you sure you want to remove your intro video?'
      )
    ) {
      return;
    }

    try {
      setVideoUploading(true);

      const result =
        await tutorService.removeIntroVideo();

      if (result.success) {
        setSuccess('✅ Video removed successfully');

        await refreshUserData();

        setVideoPreview(null);
        setVideoFile(null);
        setVideoProgress(0);
        setShowVideoManager(false);

        setTimeout(
          () => setSuccess(''),
          5000
        );
      } else {
        setError(
          result.error || 'Failed to remove video'
        );
      }
    } catch (err) {
      setError(
        err.message || 'Failed to remove video'
      );
    } finally {
      setVideoUploading(false);
    }
  };

  const handleReplaceVideo = () => {
    videoFileInputRef.current?.click();
  };

  const formatDuration = (seconds) => {
    if (!seconds) return '0:00';

    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;

    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // ============================================
  // GENERAL HANDLERS
  // ============================================

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    setEditForm((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubjectToggle = (subject) => {
    setEditForm((prev) => {
      const subjects = prev.subjects || [];

      if (subjects.includes(subject)) {
        return {
          ...prev,
          subjects: subjects.filter(
            (s) => s !== subject
          )
        };
      }

      return {
        ...prev,
        subjects: [...subjects, subject]
      };
    });
  };

  // ============================================
  // AVATAR HANDLERS
  // ============================================

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
        setError(
          'Please login again to save avatar'
        );
        return;
      }

      const response = await fetch(
        `${API_BASE_URL}/auth/profile`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },

          body: JSON.stringify({
            avatar: avatar.svg,
            avatar_seed: avatar.seed,
            avatar_style: avatar.style || 'adventurer'
          })
        }
      );

      if (response.ok) {
        const data = await response.json();

        if (data.success) {
          setSuccess(
            'Avatar updated successfully! ✅'
          );

          setUser((prev) => ({
            ...prev,
            avatar: avatar.svg,
            avatar_seed: avatar.seed,
            avatar_style:
              avatar.style || 'adventurer'
          }));
        }
      } else {
        const errorData = await response.json();

        setError(
          errorData.error || 'Failed to save avatar'
        );
      }
    } catch (error) {
      console.error(
        '❌ Failed to save avatar:',
        error
      );

      setError('Failed to save avatar');
    }
  };

  // ============================================
  // PROFILE PHOTO UPLOAD
  // ============================================

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setPhotoError(
        '❌ Please upload an image file (JPG, PNG, WEBP)'
      );
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setPhotoError(
        '❌ Image must be under 5MB'
      );
      return;
    }

    setPhotoUploading(true);
    setPhotoError('');

    try {
      const reader = new FileReader();

      reader.readAsDataURL(file);

      reader.onload = async () => {
        try {
          const base64Image = reader.result;

          const token =
            localStorage.getItem('accessToken');

          const response = await fetch(
            `${API_BASE_URL}/auth/profile`,
            {
              method: 'PUT',

              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
              },

              body: JSON.stringify({
                avatar: base64Image
              })
            }
          );

          if (response.ok) {
            const data = await response.json();

            if (data.success) {
              setProfilePhoto(base64Image);

              setSuccess(
                '✅ Photo uploaded successfully!'
              );

              setUser((prev) => ({
                ...prev,
                avatar: base64Image
              }));

              const storedUser = JSON.parse(
                localStorage.getItem('user') || '{}'
              );

              storedUser.avatar = base64Image;

              localStorage.setItem(
                'user',
                JSON.stringify(storedUser)
              );
            }
          } else {
            const errorData = await response.json();

            setPhotoError(
              errorData.error ||
              '❌ Failed to upload photo'
            );
          }
        } catch (error) {
          console.error(
            '❌ Photo upload error:',
            error
          );

          setPhotoError(
            '❌ Error uploading photo'
          );
        } finally {
          setPhotoUploading(false);
        }
      };

      reader.onerror = () => {
        setPhotoError(
          '❌ Failed to read image file'
        );

        setPhotoUploading(false);
      };
    } catch (error) {
      console.error(
        '❌ Photo upload error:',
        error
      );

      setPhotoError(
        '❌ Error uploading photo'
      );

      setPhotoUploading(false);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  // ============================================
  // SAVE PROFILE - UUID HANDLING PRESERVED
  // ============================================

  const handleSaveProfile = async (e) => {
    e.preventDefault();

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const token =
        localStorage.getItem('accessToken');

      if (!token) {
        setError(
          'Session expired. Please login again.'
        );

        navigate('/login');
        return;
      }

      const payload = {
        name: editForm.name,
        email: editForm.email,
        country: editForm.country,
        timezone: editForm.timezone,

        grade: editForm.grade
          ? parseInt(editForm.grade, 10)
          : 0,

        bio: editForm.bio || '',
        phone: editForm.phone || '',
        education: editForm.education || '',

        yearsExperience:
          parseInt(editForm.yearsExperience, 10) || 0,

        linkedin: editForm.linkedin || '',
        website: editForm.website || '',
        tier: editForm.tier || '',
        subjects: editForm.subjects || [],

        shiftId:
          editForm.shiftId &&
          editForm.shiftId.trim() !== ''
            ? editForm.shiftId
            : null
      };

      console.log(
        '📤 Saving profile with payload:',
        payload
      );

      const response = await fetch(
        `${API_BASE_URL}/auth/profile`,
        {
          method: 'PUT',

          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },

          body: JSON.stringify(payload)
        }
      );

      const data = await response.json();

      if (response.ok && data.success) {
        const updatedUser = {
          ...user,
          ...data.user
        };

        setUser(updatedUser);

        localStorage.setItem(
          'user',
          JSON.stringify(updatedUser)
        );

        if (updatedUser.intro_video_url) {
          setVideoUrl(
            updatedUser.intro_video_url
          );

          setVideoThumbnail(
            updatedUser.intro_video_thumbnail || null
          );

          setVideoDuration(
            updatedUser.intro_video_duration || 0
          );

          setVideoViews(
            updatedUser.intro_video_views || 0
          );
        }

        setEditForm({
          name: data.user.name || '',
          email: data.user.email || '',
          country: data.user.country || '',
          timezone: data.user.timezone || '',
          grade: data.user.grade || '',
          bio: data.user.bio || '',

          tier:
            data.user.tutor_tier ||
            data.user.tier ||
            '',

          subjects:
            data.user.tutor_subjects || [],

          shiftId:
            data.user.tutor_shift_id || '',

          yearsExperience:
            data.user.years_experience || 0,

          education:
            data.user.education || '',

          phone: data.user.phone || '',
          linkedin: data.user.linkedin || '',
          website: data.user.website || ''
        });

        setSuccess(
          '✅ Profile updated successfully!'
        );

        setIsEditing(false);
      } else {
        setError(
          data.error || 'Failed to update profile'
        );
      }
    } catch (error) {
      console.error('❌ Save error:', error);

      setError(
        'Failed to update profile: ' + error.message
      );
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // PASSWORD CHANGE
  // ============================================

  const handlePasswordChange = async (e) => {
    e.preventDefault();

    setLoading(true);
    setError('');
    setSuccess('');

    if (
      passwordData.newPassword !==
      passwordData.confirmPassword
    ) {
      setError('New passwords do not match');
      setLoading(false);
      return;
    }

    try {
      const token =
        localStorage.getItem('accessToken');

      if (!token) {
        setError(
          'Session expired. Please login again.'
        );
        return;
      }

      const response = await fetch(
        `${API_BASE_URL}/auth/change-password`,
        {
          method: 'POST',

          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },

          body: JSON.stringify({
            currentPassword:
              passwordData.currentPassword,

            newPassword:
              passwordData.newPassword
          })
        }
      );

      const data = await response.json();

      if (response.ok && data.success) {
        setSuccess(
          '✅ Password changed successfully!'
        );

        setShowPasswordModal(false);

        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
      } else {
        setError(
          data.error || 'Failed to change password'
        );
      }
    } catch (error) {
      setError(
        'Network error. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // DELETE ACCOUNT
  // ============================================

  const handleDeleteAccount = async () => {
    if (
      !window.confirm(
        'Are you sure you want to delete your account? This action is permanent!'
      )
    ) {
      return;
    }

    setLoading(true);

    try {
      const token =
        localStorage.getItem('accessToken');

      if (!token) {
        setError(
          'Session expired. Please login again.'
        );
        return;
      }

      const response = await fetch(
        `${API_BASE_URL}/auth/account`,
        {
          method: 'DELETE',

          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (response.ok) {
        authService.logout();
        navigate('/login');
      } else {
        const data = await response.json();

        setError(
          data.error || 'Failed to delete account'
        );
      }
    } catch (error) {
      setError('Failed to delete account');
    } finally {
      setLoading(false);
      setShowDeleteModal(false);
    }
  };

  // ============================================
  // VIDEO MANAGER MODAL
  // ============================================

  const VideoManagerModal = () => {
    if (!showVideoManager) return null;

    const closeVideoManager = () => {
      if (videoUploading) return;

      setShowVideoManager(false);
      setVideoPreview(null);
      setVideoFile(null);
      setVideoThumbnail(null);
      setVideoDuration(0);
      setVideoProgress(0);

      if (videoFileInputRef.current) {
        videoFileInputRef.current.value = '';
      }
    };

    return (
      <div
        className="profile-modal-overlay"
        onClick={closeVideoManager}
      >
        <div
          className="profile-modal video-manager-modal"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="profile-modal-header">
            <h3>🎬 Video Manager</h3>

            <button
              className="modal-close"
              onClick={closeVideoManager}
              disabled={videoUploading}
            >
              ×
            </button>
          </div>

          <div className="profile-modal-body video-manager-body">
            {videoUrl && !videoPreview && (
              <div className="video-current-display">
                <div
                  className="video-preview-container"
                  style={{ cursor: 'pointer' }}
                  onClick={() => {
                    setShowVideoModal(true);
                    setShowVideoManager(false);
                  }}
                >
                  <video
                    src={videoUrl}
                    style={{
                      width: '100%',
                      maxHeight: '300px',
                      borderRadius: '8px',
                      background: '#0a0e1a'
                    }}
                    poster={videoThumbnail || undefined}
                  />

                  <div className="video-play-overlay">
                    <div className="play-button">
                      <span className="play-icon">▶</span>
                    </div>
                  </div>

                  <div className="video-info-badge">
                    <span>
                      ⏱️ {formatDuration(videoDuration)}
                    </span>

                    {videoViews > 0 && (
                      <span>👁️ {videoViews} views</span>
                    )}
                  </div>
                </div>

                <p className="video-status-text">
                  ✅ Video uploaded successfully
                </p>
              </div>
            )}

            {videoPreview && (
              <div className="video-preview-section">
                <div className="video-preview-container">
                  <video
                    src={videoPreview}
                    controls
                    style={{
                      width: '100%',
                      maxHeight: '300px',
                      borderRadius: '8px',
                      background: '#0a0e1a'
                    }}
                    poster={videoThumbnail || undefined}
                  />
                </div>

                <div className="video-file-info">
                  <span>📁 {videoFile?.name}</span>

                  <span>
                    ({(videoFile?.size / (1024 * 1024)).toFixed(1)} MB)
                  </span>

                  {videoDuration > 0 && (
                    <span>
                      ⏱️ {formatDuration(videoDuration)}
                    </span>
                  )}
                </div>

                {videoUploading && (
                  <div className="video-progress-container">
                    <div className="video-progress-bar">
                      <div
                        className="video-progress-fill"
                        style={{
                          width: `${videoProgress}%`
                        }}
                      />
                    </div>

                    <span className="video-progress-text">
                      {videoProgress}%
                    </span>
                  </div>
                )}
              </div>
            )}

            {!videoUrl && !videoPreview && (
              <div
                className="video-upload-zone"
                onClick={() =>
                  videoFileInputRef.current?.click()
                }
              >
                <input
                  type="file"
                  accept="video/mp4,video/webm,video/quicktime,video/x-matroska"
                  onChange={handleVideoSelect}
                  ref={videoFileInputRef}
                  disabled={videoUploading}
                  style={{ display: 'none' }}
                />

                <span className="upload-icon">🎥</span>

                <p>Click to upload your intro video</p>

                <small>
                  MP4, WebM, MOV • Max 100MB
                </small>
              </div>
            )}

            <div className="video-actions">
              {!videoPreview && !videoUrl && (
                <button
                  className="video-action-btn primary"
                  onClick={() =>
                    videoFileInputRef.current?.click()
                  }
                  disabled={videoUploading}
                >
                  📤 Upload Video
                </button>
              )}

              {videoPreview && !videoUploading && (
                <>
                  <button
                    className="video-action-btn primary"
                    onClick={handleUploadVideo}
                  >
                    ✅ Confirm Upload
                  </button>

                  <button
                    className="video-action-btn cancel"
                    onClick={() => {
                      setVideoPreview(null);
                      setVideoFile(null);
                      setVideoThumbnail(null);
                      setVideoDuration(0);
                      setVideoProgress(0);

                      if (videoFileInputRef.current) {
                        videoFileInputRef.current.value = '';
                      }
                    }}
                  >
                    Cancel
                  </button>
                </>
              )}

              {videoUrl && !videoPreview && (
                <>
                  <button
                    className="video-action-btn secondary"
                    onClick={() => {
                      setShowVideoModal(true);
                      setShowVideoManager(false);
                    }}
                  >
                    👁️ Preview
                  </button>

                  <button
                    className="video-action-btn primary"
                    onClick={handleReplaceVideo}
                    disabled={videoUploading}
                  >
                    🔄 Replace Video
                  </button>

                  <button
                    className="video-action-btn danger"
                    onClick={handleRemoveVideo}
                    disabled={videoUploading}
                  >
                    🗑️ Remove Video
                  </button>
                </>
              )}

              {videoUploading && (
                <div className="uploading-status">
                  <span className="spinner"></span>
                  Uploading... {videoProgress}%
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ============================================
  // VIDEO PREVIEW MODAL
  // ============================================

  const VideoPreviewModal = () => {
    if (!showVideoModal || !videoUrl) return null;

    return (
      <div
        className="profile-modal-overlay"
        onClick={() => setShowVideoModal(false)}
      >
        <div
          className="profile-modal video-preview-modal"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="profile-modal-header">
            <h3>🎬 Your Intro Video</h3>

            <button
              className="modal-close"
              onClick={() => setShowVideoModal(false)}
            >
              ×
            </button>
          </div>

          <div className="profile-modal-body">
            <div className="video-preview-container">
              <video
                src={videoUrl}
                controls
                autoPlay
                style={{
                  width: '100%',
                  maxHeight: '70vh',
                  borderRadius: '8px',
                  background: '#0a0e1a'
                }}
                poster={videoThumbnail || undefined}
              />
            </div>

            <div className="video-preview-info">
              <p>
                This video is shown to students on your tutor card.
              </p>

              <div
                style={{
                  display: 'flex',
                  gap: '16px',
                  flexWrap: 'wrap'
                }}
              >
                {videoDuration > 0 && (
                  <span>
                    ⏱️ Duration: {formatDuration(videoDuration)}
                  </span>
                )}

                {videoViews > 0 && (
                  <span>👁️ {videoViews} views</span>
                )}
              </div>
            </div>

            <button
              className="video-action-btn primary full-width"
              onClick={() => setShowVideoModal(false)}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  };

  // ============================================
  // RENDER
  // ============================================

  if (loading) {
    return (
      <div className="profile-loading">
        Loading profile...
      </div>
    );
  }

  const statsToShow = isTutor
    ? [
        {
          number: tutorStats.totalSessions,
          label: 'Total Sessions'
        },
        {
          number: tutorStats.studentsTaught,
          label: 'Students Taught'
        },
        {
          number: `R${tutorStats.totalEarnings.toFixed(2)}`,
          label: 'Earnings'
        },
        {
          number: `${tutorStats.avgRating.toFixed(1)}⭐`,
          label: 'Rating'
        }
      ]
    : [
        {
          number: studentStats.coursesEnrolled,
          label: 'Courses Enrolled'
        },
        {
          number: studentStats.hoursSpent,
          label: 'Hours Spent'
        },
        {
          number: studentStats.badgesEarned,
          label: 'Badges Earned'
        },
        {
          number: `${studentStats.completionRate}%`,
          label: 'Completion Rate'
        }
      ];

  return (
    <div className="profile-container">

      {/* ============================================
          MODALS
          ============================================ */}

      <VideoManagerModal />
      <VideoPreviewModal />

      {/* ============================================
          HEADER
          ============================================ */}

      <div className="profile-header">
        <div
          className="profile-avatar"
          onClick={
            isTutor
              ? triggerFileInput
              : () => setShowAvatarSelector(true)
          }
        >
          {isTutor ? (
            profilePhoto ? (
              <img
                src={profilePhoto}
                alt={user?.name}
                className="profile-avatar-img"
              />
            ) : (
              <span className="profile-avatar-emoji">
                👨‍🏫
              </span>
            )
          ) : (
            avatarImage ? (
              <img
                src={avatarImage}
                alt={user?.name}
                className="profile-avatar-img"
              />
            ) : (
              <span className="profile-avatar-emoji">
                👤
              </span>
            )
          )}

          <div className="avatar-edit-badge">
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

        <div className="profile-header-info">
          <h1>
            {user?.name || 'User'}

            {isTutor && (
              <span
                style={{
                  fontSize: '14px',
                  fontWeight: 600,
                  color: '#34d399',
                  background: 'rgba(52,211,153,0.15)',
                  padding: '2px 12px',
                  borderRadius: '12px',
                  marginLeft: '12px',
                  border: '1px solid rgba(52,211,153,0.2)'
                }}
              >
                👨‍🏫 Tutor
              </span>
            )}
          </h1>

          <p className="profile-header-subtitle">
            {isTutor
              ? 'Professional Mathematics Tutor'
              : (
                  user?.cohort === 'HighSchool'
                    ? 'High School Student'
                    : 'University Student'
                )}

            {' • '}

            {user?.country || 'South Africa'}
          </p>

          <div className="profile-status">
            <span className="status-dot"></span>

            <span>
              {isTutor ? 'Active Tutor' : 'Active Member'}
            </span>
          </div>
        </div>

        <button
          className="profile-edit-btn"
          onClick={() => setIsEditing(!isEditing)}
        >
          {isEditing ? 'Cancel' : '✏️ Edit Profile'}
        </button>
      </div>

      {/* ============================================
          MESSAGES
          ============================================ */}

      {photoError && (
        <div className="profile-error">
          {photoError}
        </div>
      )}

      {photoUploading && (
        <div className="profile-success">
          📤 Uploading photo...
        </div>
      )}

      {error && (
        <div className="profile-error">
          {error}
        </div>
      )}

      {success && (
        <div className="profile-success">
          {success}
        </div>
      )}

      {/* ============================================
          STATS
          ============================================ */}

      <div className="profile-stats">
        {statsToShow.map((stat, i) => (
          <div
            key={i}
            className="profile-stat-card"
          >
            <span className="stat-number">
              {stat.number}
            </span>

            <span className="stat-label">
              {stat.label}
            </span>
          </div>
        ))}
      </div>

      {/* ============================================
          PROFILE GRID
          ============================================ */}

      <div className="profile-grid">

        {/* ============================================
            PERSONAL INFORMATION
            ============================================ */}

        <div className="profile-card">
          <h3>
            {isTutor
              ? '📋 Tutor Information'
              : '📋 Personal Information'}
          </h3>

          <div className="profile-info-group">
            {[
              {
                label: 'Full Name',
                name: 'name',
                value: editForm.name
              },
              {
                label: 'Email Address',
                name: 'email',
                value: editForm.email
              },
              {
                label: 'Country',
                name: 'country',
                value: editForm.country
              },
              {
                label: isTutor
                  ? 'Expertise Level'
                  : 'Grade / Year',
                name: 'grade',
                value: editForm.grade
              },
              {
                label: 'Role',
                name: 'cohort',
                value: isTutor
                  ? 'Tutor'
                  : (
                      user?.cohort === 'HighSchool'
                        ? 'High School Student'
                        : 'University First Year'
                    )
              }
            ].map((field, i) => (
              <div
                key={i}
                className="profile-info-item"
              >
                <span className="info-label">
                  {field.label}
                </span>

                {isEditing && field.name !== 'cohort' ? (
                  <input
                    type="text"
                    name={field.name}
                    value={field.value}
                    onChange={handleInputChange}
                    className="profile-input"
                  />
                ) : (
                  <span className="info-value">
                    {field.value || 'Not set'}
                  </span>
                )}
              </div>
            ))}
          </div>

          {isEditing && !isTutor && (
            <div className="profile-actions">
              <button
                className="profile-save-btn"
                onClick={handleSaveProfile}
                disabled={loading}
              >
                {loading
                  ? 'Saving...'
                  : '💾 Save Changes'}
              </button>
            </div>
          )}
        </div>

        {/* ============================================
            ACCOUNT SETTINGS
            ============================================ */}

        <div className="profile-card">
          <h3>🔒 Account Settings</h3>

          <div className="profile-settings-list">
            <div className="profile-setting-item">
              <div className="setting-info">
                <span className="setting-icon">
                  🔑
                </span>

                <div>
                  <h4>Change Password</h4>
                  <p>
                    Update your password regularly for security
                  </p>
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
                <span className="setting-icon">
                  ⚠️
                </span>

                <div>
                  <h4>Delete Account</h4>
                  <p>
                    Permanently delete your account and all data
                  </p>
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

        {/* ============================================
            TUTOR PROFILE
            ============================================ */}

        {isTutor && (
          <div className="profile-card full-width">
            <h3>👨‍🏫 Tutor Profile</h3>

            <div className="tutor-profile-grid">

              {/* BIO */}

              <div className="tutor-field tutor-field-full">
                <label className="tutor-field-label">
                  📝 About Me
                </label>

                {isEditing ? (
                  <textarea
                    name="bio"
                    value={editForm.bio || ''}
                    onChange={handleInputChange}
                    placeholder="Tell students about yourself..."
                    rows="4"
                    className="profile-input tutor-textarea"
                  />
                ) : (
                  <p className="tutor-field-value tutor-field-bio">
                    {editForm.bio || 'No bio provided yet.'}
                  </p>
                )}
              </div>

              {/* TIER */}

              <div className="tutor-field">
                <label className="tutor-field-label">
                  🏅 Tier / Level
                </label>

                {isEditing ? (
                  <select
                    name="tier"
                    value={editForm.tier || ''}
                    onChange={handleInputChange}
                    className="profile-select tutor-select"
                  >
                    <option value="">Select Tier</option>

                    <option value="TIER_1">
                      TIER_1 - Grades 8-9
                    </option>

                    <option value="TIER_2">
                      TIER_2 - Grades 10-11
                    </option>

                    <option value="TIER_3">
                      TIER_3 - Grade 12 &amp; Tertiary
                    </option>
                  </select>
                ) : (
                  <span className="tutor-field-value">
                    {editForm.tier || 'Not set'}
                  </span>
                )}
              </div>

              {/* SHIFT */}

              <div className="tutor-field">
                <label className="tutor-field-label">
                  ⏰ Shift
                </label>

                {isEditing ? (
                  <select
                    name="shiftId"
                    value={editForm.shiftId || ''}
                    onChange={handleInputChange}
                    className="profile-select tutor-select"
                  >
                    <option value="">Select Shift</option>

                    {shiftOptions.map((shift) => (
                      <option
                        key={shift.id}
                        value={shift.id}
                      >
                        {shift.name} ({shift.sast_start} - {shift.sast_end})
                      </option>
                    ))}
                  </select>
                ) : (
                  <span className="tutor-field-value">
                    {
                      shiftOptions.find(
                        (s) => s.id === editForm.shiftId
                      )?.name || 'Not set'
                    }
                  </span>
                )}
              </div>

              {/* YEARS EXPERIENCE */}

              <div className="tutor-field">
                <label className="tutor-field-label">
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
                    className="profile-input tutor-input"
                  />
                ) : (
                  <span className="tutor-field-value">
                    {editForm.yearsExperience || 0}{' '}
                    {editForm.yearsExperience === 1
                      ? 'year'
                      : 'years'}
                  </span>
                )}
              </div>

              {/* EDUCATION */}

              <div className="tutor-field">
                <label className="tutor-field-label">
                  🎓 Education
                </label>

                {isEditing ? (
                  <input
                    type="text"
                    name="education"
                    value={editForm.education || ''}
                    onChange={handleInputChange}
                    placeholder="e.g., BSc Mathematics, University of Cape Town"
                    className="profile-input tutor-input"
                  />
                ) : (
                  <span className="tutor-field-value">
                    {editForm.education || 'Not specified'}
                  </span>
                )}
              </div>

              {/* PHONE */}

              <div className="tutor-field">
                <label className="tutor-field-label">
                  📞 Phone Number
                </label>

                {isEditing ? (
                  <input
                    type="tel"
                    name="phone"
                    value={editForm.phone || ''}
                    onChange={handleInputChange}
                    placeholder="+27 82 123 4567"
                    className="profile-input tutor-input"
                  />
                ) : (
                  <span className="tutor-field-value">
                    {editForm.phone || 'Not set'}
                  </span>
                )}
              </div>

              {/* LINKEDIN */}

              <div className="tutor-field">
                <label className="tutor-field-label">
                  🔗 LinkedIn
                </label>

                {isEditing ? (
                  <input
                    type="url"
                    name="linkedin"
                    value={editForm.linkedin || ''}
                    onChange={handleInputChange}
                    placeholder="https://linkedin.com/in/your-profile"
                    className="profile-input tutor-input"
                  />
                ) : (
                  <span className="tutor-field-value">
                    {editForm.linkedin ? (
                      <a
                        href={editForm.linkedin}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="tutor-field-link"
                      >
                        {editForm.linkedin}
                      </a>
                    ) : (
                      'Not set'
                    )}
                  </span>
                )}
              </div>

              {/* WEBSITE */}

              <div className="tutor-field">
                <label className="tutor-field-label">
                  🌐 Website
                </label>

                {isEditing ? (
                  <input
                    type="url"
                    name="website"
                    value={editForm.website || ''}
                    onChange={handleInputChange}
                    placeholder="https://yourwebsite.com"
                    className="profile-input tutor-input"
                  />
                ) : (
                  <span className="tutor-field-value">
                    {editForm.website ? (
                      <a
                        href={editForm.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="tutor-field-link"
                      >
                        {editForm.website}
                      </a>
                    ) : (
                      'Not set'
                    )}
                  </span>
                )}
              </div>

              {/* SUBJECTS */}

              <div className="tutor-field tutor-field-full">
                <label className="tutor-field-label">
                  📖 Subjects Taught
                </label>

                {isEditing ? (
                  <div className="tutor-subjects-edit">
                    {subjectOptions.map((subject) => (
                      <label
                        key={subject}
                        className="tutor-subject-checkbox-label"
                      >
                        <input
                          type="checkbox"
                          checked={
                            (editForm.subjects || []).includes(subject)
                          }
                          onChange={() =>
                            handleSubjectToggle(subject)
                          }
                          style={{
                            accentColor: '#4f46e5'
                          }}
                        />

                        {subject}
                      </label>
                    ))}
                  </div>
                ) : (
                  <div className="tutor-subjects-display">
                    {(editForm.subjects || []).length > 0 ? (
                      (editForm.subjects || []).map((subject) => (
                        <span
                          key={subject}
                          className="tutor-subject-tag"
                        >
                          {subject}
                        </span>
                      ))
                    ) : (
                      <span className="tutor-field-empty">
                        No subjects added yet
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* ============================================
                  VIDEO SECTION
                  ============================================ */}

              <div className="tutor-field tutor-field-full tutor-video-field">
                <div className="tutor-video-header">
                  <label
                    className="tutor-field-label"
                    style={{ marginBottom: 0 }}
                  >
                    🎬 Intro Video
                  </label>

                  <button
                    type="button"
                    className="setting-action-btn"
                    onClick={() =>
                      setShowVideoManager(true)
                    }
                    style={{
                      background: videoUrl
                        ? 'rgba(255,255,255,0.04)'
                        : 'rgba(79,70,229,0.15)',

                      borderColor: videoUrl
                        ? 'rgba(255,255,255,0.06)'
                        : 'rgba(79,70,229,0.2)',

                      color: videoUrl
                        ? '#ffffff'
                        : '#818cf8',

                      fontWeight: 600
                    }}
                  >
                    {videoUrl
                      ? '⚙️ Manage Video'
                      : '📤 Upload Video'}
                  </button>
                </div>

                <p className="tutor-video-hint">
                  {videoUrl
                    ? '✅ Video uploaded and visible to students'
                    : 'No video uploaded yet. Upload a short introduction video (max 100MB)'}
                </p>

                {videoUrl ? (
                  <div
                    className="video-preview-container"
                    style={{
                      maxWidth: '400px',
                      cursor: 'pointer'
                    }}
                    onClick={() =>
                      setShowVideoModal(true)
                    }
                  >
                    <video
                      src={videoUrl}
                      style={{
                        width: '100%',
                        maxHeight: '225px',
                        display: 'block',
                        background: '#0a0e1a'
                      }}
                      poster={videoThumbnail || undefined}
                    />

                    <div className="video-play-overlay">
                      <div className="play-button">
                        <span className="play-icon">▶</span>
                      </div>
                    </div>

                    <div className="video-info-badge">
                      <span>
                        ⏱️ {formatDuration(videoDuration)}
                      </span>

                      {videoViews > 0 && (
                        <span>👁️ {videoViews} views</span>
                      )}
                    </div>
                  </div>
                ) : (
                  <div
                    className="video-upload-zone"
                    style={{
                      maxWidth: '400px',
                      cursor: 'pointer'
                    }}
                    onClick={() =>
                      setShowVideoManager(true)
                    }
                  >
                    <span className="upload-icon">
                      🎥
                    </span>

                    <p>No intro video yet</p>

                    <small>
                      Click to upload your introduction video
                    </small>
                  </div>
                )}
              </div>
            </div>

            {/* ============================================
                WEEKLY AVAILABILITY EDITOR
                ============================================ */}

            <div className="tutor-availability">
              <div className="tutor-availability-intro">
                <div>
                  <h3>Weekly Availability</h3>

                  <p>
                    Set the days and times when students can
                    book sessions with you. You can add
                    multiple time ranges for each day.
                  </p>
                </div>
              </div>

              {availabilityLoading ? (
                <div className="tutor-availability-disabled">
                  Loading your saved availability...
                </div>
              ) : (
                <>
                  {availabilityDays.map((day) => (
                    <div
                      className="tutor-availability-day"
                      key={day.dayOfWeek}
                    >
                      <div className="tutor-availability-day-header">
                        <div className="tutor-availability-day-name">
                          {day.name}
                        </div>

                        <label className="tutor-availability-toggle">
                          <input
                            type="checkbox"
                            checked={day.enabled}
                            onChange={(event) =>
                              toggleAvailabilityDay(
                                day.dayOfWeek,
                                event.target.checked
                              )
                            }
                          />

                          <span>
                            {day.enabled
                              ? 'Available'
                              : 'Unavailable'}
                          </span>
                        </label>
                      </div>

                      {day.enabled ? (
                        <div className="tutor-availability-slots">
                          {day.slots.map((slot, index) => (
                            <div
                              className="tutor-availability-slot"
                              key={`${day.dayOfWeek}-${index}`}
                            >
                              <div className="tutor-availability-time-field">
                                <label>
                                  Start time
                                </label>

                                <input
                                  type="time"
                                  value={slot.startTime}
                                  onChange={(event) =>
                                    updateAvailabilityTime(
                                      day.dayOfWeek,
                                      index,
                                      'startTime',
                                      event.target.value
                                    )
                                  }
                                />
                              </div>

                              <div className="tutor-availability-time-field">
                                <label>
                                  End time
                                </label>

                                <input
                                  type="time"
                                  value={slot.endTime}
                                  onChange={(event) =>
                                    updateAvailabilityTime(
                                      day.dayOfWeek,
                                      index,
                                      'endTime',
                                      event.target.value
                                    )
                                  }
                                />
                              </div>

                              <button
                                type="button"
                                className="tutor-availability-remove"
                                onClick={() =>
                                  removeAvailabilitySlot(
                                    day.dayOfWeek,
                                    index
                                  )
                                }
                                aria-label={`Remove ${day.name} time range`}
                                title="Remove time range"
                              >
                                ×
                              </button>
                            </div>
                          ))}

                          <button
                            type="button"
                            className="tutor-availability-add"
                            onClick={() =>
                              addAvailabilitySlot(
                                day.dayOfWeek
                              )
                            }
                          >
                            + Add another time range
                          </button>
                        </div>
                      ) : (
                        <div className="tutor-availability-disabled">
                          You are not available on this day.
                        </div>
                      )}
                    </div>
                  ))}

                  {availabilityMessage && (
                    <div
                      className={`tutor-availability-message ${
                        availabilityError
                          ? 'error'
                          : 'success'
                      }`}
                      role="status"
                    >
                      {availabilityMessage}
                    </div>
                  )}

                  <div className="tutor-availability-actions">
                    <button
                      type="button"
                      className="tutor-availability-save"
                      onClick={saveAvailability}
                      disabled={
                        availabilitySaving ||
                        availabilityLoading
                      }
                    >
                      {availabilitySaving
                        ? 'Saving availability...'
                        : '💾 Save Weekly Availability'}
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* ============================================
                SAVE TUTOR PROFILE
                ============================================ */}

            {isEditing && (
              <div className="profile-actions">
                <button
                  className="profile-save-btn"
                  onClick={handleSaveProfile}
                  disabled={loading}
                >
                  {loading
                    ? 'Saving...'
                    : '💾 Save Changes'}
                </button>
              </div>
            )}
          </div>
        )}

        {/* ============================================
            STUDENT COURSES
            ============================================ */}

        {!isTutor && (
          <div className="profile-card full-width">
            <h3>📚 My Courses</h3>

            {enrollments.length > 0 ? (
              <div className="profile-courses-grid">
                {enrollments.map((course) => {
                  const progress = Math.floor(
                    Math.random() * 60 + 20
                  );

                  return (
                    <div
                      key={course.id}
                      className="profile-course-card"
                      onClick={() =>
                        navigate(
                          `/subjects/${course.name.toLowerCase()}`
                        )
                      }
                    >
                      <span className="course-icon">
                        {course.icon || '📘'}
                      </span>

                      <div className="course-info">
                        <h4>{course.name}</h4>

                        <span className="course-tier">
                          {course.tier || 'Tier 1'}
                        </span>
                      </div>

                      <div className="course-progress">
                        <div className="progress-bar">
                          <div
                            className="progress-fill"
                            style={{
                              width: `${progress}%`
                            }}
                          />
                        </div>

                        <span className="progress-text">
                          {progress}%
                        </span>
                      </div>
                    </div>
                  );
                })}
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
        )}
      </div>

      {/* ============================================
          PASSWORD MODAL
          ============================================ */}

      {showPasswordModal && (
        <div
          className="profile-modal-overlay"
          onClick={() => setShowPasswordModal(false)}
        >
          <div
            className="profile-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="profile-modal-header">
              <h3>🔑 Change Password</h3>

              <button
                className="modal-close"
                onClick={() =>
                  setShowPasswordModal(false)
                }
              >
                ×
              </button>
            </div>

            <form onSubmit={handlePasswordChange}>
              <div className="profile-modal-body">
                <div className="form-group">
                  <label>Current Password</label>

                  <input
                    type="password"
                    value={passwordData.currentPassword}
                    onChange={(e) =>
                      setPasswordData((prev) => ({
                        ...prev,
                        currentPassword: e.target.value
                      }))
                    }
                    required
                  />
                </div>

                <div className="form-group">
                  <label>New Password</label>

                  <input
                    type="password"
                    value={passwordData.newPassword}
                    onChange={(e) =>
                      setPasswordData((prev) => ({
                        ...prev,
                        newPassword: e.target.value
                      }))
                    }
                    required
                    minLength="8"
                  />
                </div>

                <div className="form-group">
                  <label>Confirm New Password</label>

                  <input
                    type="password"
                    value={passwordData.confirmPassword}
                    onChange={(e) =>
                      setPasswordData((prev) => ({
                        ...prev,
                        confirmPassword: e.target.value
                      }))
                    }
                    required
                  />
                </div>
              </div>

              <div className="profile-modal-actions">
                <button
                  type="button"
                  className="modal-cancel"
                  onClick={() =>
                    setShowPasswordModal(false)
                  }
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="modal-submit"
                  disabled={loading}
                >
                  {loading
                    ? 'Changing...'
                    : 'Change Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================
          DELETE ACCOUNT MODAL
          ============================================ */}

      {showDeleteModal && (
        <div
          className="profile-modal-overlay"
          onClick={() => setShowDeleteModal(false)}
        >
          <div
            className="profile-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="profile-modal-header danger">
              <h3>⚠️ Delete Account</h3>

              <button
                className="modal-close"
                onClick={() => setShowDeleteModal(false)}
              >
                ×
              </button>
            </div>

            <div className="profile-modal-body">
              <p className="delete-warning">
                Are you sure you want to delete your account?
                This action is <strong>permanent</strong> and
                cannot be undone.
              </p>

              <p style={{ color: '#94a3b8' }}>
                All your data, including enrolled courses
                and progress, will be permanently removed.
              </p>
            </div>

            <div className="profile-modal-actions">
              <button
                className="modal-cancel"
                onClick={() => setShowDeleteModal(false)}
              >
                Cancel
              </button>

              <button
                className="modal-delete"
                onClick={handleDeleteAccount}
                disabled={loading}
              >
                {loading
                  ? 'Deleting...'
                  : '🗑️ Delete Account'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================
          AVATAR SELECTOR
          ============================================ */}

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
