// src/pages/Profile.js
// COMPLETE PROFILE PAGE
// Includes UUID-safe tutor shift handling, tutor weekly availability,
// profile editing, student/tutor statistics, avatar/photo uploads,
// intro video management, password changes and account deletion.

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../services/authService';
import AvatarSelector from '../components/AvatarSelector';
import { API_BASE_URL } from '../services/api';
import { tutorService } from '../services/tutorService';
import './Profile.css';

// PostgreSQL EXTRACT(DOW):
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

// Safely handles common API response formats.
const extractAvailabilitySlots = (result) => {
  if (Array.isArray(result)) return result;
  if (Array.isArray(result?.availability)) return result.availability;
  if (Array.isArray(result?.slots)) return result.slots;
  if (Array.isArray(result?.data?.availability)) {
    return result.data.availability;
  }
  if (Array.isArray(result?.data?.slots)) {
    return result.data.slots;
  }
  return null;
};

// Converts database/API slots into the format used by the UI.
const mapAvailabilitySlots = (slots) => {
  const safeSlots = Array.isArray(slots) ? slots : [];

  return TUTOR_WEEK_DAYS.map((day) => {
    const daySlots = safeSlots
      .filter((slot) => {
        const dayValue =
          slot.day_of_week ??
          slot.dayOfWeek ??
          slot.day;

        return Number(dayValue) === day.dayOfWeek;
      })
      .map((slot) => ({
        startTime: String(
          slot.start_time ??
          slot.startTime ??
          ''
        ).slice(0, 5),

        endTime: String(
          slot.end_time ??
          slot.endTime ??
          ''
        ).slice(0, 5)
      }))
      .filter((slot) => slot.startTime && slot.endTime);

    return {
      ...day,
      enabled: daySlots.length > 0,
      slots: daySlots
    };
  });
};

const readJsonResponse = async (response) => {
  const text = await response.text();

  if (!text) return {};

  try {
    return JSON.parse(text);
  } catch {
    throw new Error('The server returned an invalid response.');
  }
};

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
    avgRating: 0,
    ratingCount: 0
  });

  const [subscription, setSubscription] = useState(null);

  const [showAvatarSelector, setShowAvatarSelector] = useState(false);
  const [avatarData, setAvatarData] = useState(null);
  const [avatarImage, setAvatarImage] = useState(null);

  const [profilePhoto, setProfilePhoto] = useState(null);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [photoError, setPhotoError] = useState('');

  const fileInputRef = useRef(null);

  // VIDEO STATE
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

  const [showVideoManager, setShowVideoManager] = useState(false);

  // TUTOR WEEKLY AVAILABILITY
  const [availabilityDays, setAvailabilityDays] = useState(
    createEmptyAvailability
  );
  const [availabilityLoading, setAvailabilityLoading] = useState(false);
  const [availabilitySaving, setAvailabilitySaving] = useState(false);
  const [availabilityMessage, setAvailabilityMessage] = useState('');
  const [availabilityError, setAvailabilityError] = useState(false);
  // ✅ NEW: tracks whether the availability form has unsaved edits.
  const [availabilityDirty, setAvailabilityDirty] = useState(false);

  // SUCCESS MESSAGE TIMER
  useEffect(() => {
    if (!success) return undefined;

    const timer = setTimeout(() => setSuccess(''), 5000);
    return () => clearTimeout(timer);
  }, [success]);

  // FETCH SUBJECTS AND SHIFTS
  useEffect(() => {
    let cancelled = false;

    const fetchOptions = async () => {
      try {
        const [subjectsResponse, shiftsResponse] = await Promise.all([
          fetch(`${API_BASE_URL}/content/subjects`),
          fetch(`${API_BASE_URL}/shifts`)
        ]);

        if (subjectsResponse.ok) {
          const data = await readJsonResponse(subjectsResponse);

          if (!cancelled && data.success && Array.isArray(data.subjects)) {
            setSubjectOptions(
              data.subjects
                .map((subject) => subject.name)
                .filter(Boolean)
            );
          }
        }

        if (shiftsResponse.ok) {
          const data = await readJsonResponse(shiftsResponse);

          if (!cancelled && data.success && Array.isArray(data.shifts)) {
            setShiftOptions(data.shifts);
          }
        }
      } catch (err) {
        console.error('Failed to fetch profile options:', err);
      }
    };

    fetchOptions();

    return () => {
      cancelled = true;
    };
  }, []);

  // FETCH USER DATA
  const fetchUserData = async () => {
    try {
      const token = localStorage.getItem('accessToken');

      if (!token) {
        navigate('/login');
        return;
      }

      const userData =
        await authService.getCurrentUserWithSubscription();

      if (!userData) {
        navigate('/login');
        return;
      }

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
        setVideoThumbnail(userData.intro_video_thumbnail || null);
        setVideoDuration(Number(userData.intro_video_duration) || 0);
        setVideoViews(Number(userData.intro_video_views) || 0);
      } else {
        setVideoUrl(null);
        setVideoThumbnail(null);
        setVideoDuration(0);
        setVideoViews(0);
      }

      if (userData.subscription || userData.subscriptionTier) {
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
        tier: userData.tutor_tier || userData.tier || '',
        subjects: Array.isArray(userData.tutor_subjects)
          ? userData.tutor_subjects
          : [],
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
    } catch (err) {
      console.error('Failed to load profile data:', err);
      setError('Failed to load profile data.');
      navigate('/login');
    } finally {
      setLoading(false);
    }
  };

  // STUDENT STATISTICS
  const fetchStudentStats = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) return;

      const response = await fetch(
        `${API_BASE_URL}/content/my/subjects`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) return;

      const data = await readJsonResponse(response);

      if (data.success) {
        const subjects = Array.isArray(data.subjects)
          ? data.subjects
          : [];

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
    } catch (err) {
      console.error('Failed to fetch student stats:', err);
    }
  };

  // TUTOR STATISTICS
  const fetchTutorStats = async (userData) => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) return;

      let rating = Number(
        userData?.tutor_rating ??
        userData?.rating ??
        4.5
      );
      let ratingCount = 0;

      try {
        const tutorsResponse = await fetch(`${API_BASE_URL}/tutors`, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (tutorsResponse.ok) {
          const tutorsData = await readJsonResponse(tutorsResponse);

          for (const shift of (tutorsData.tutors || [])) {
            const tutor = shift.tutors?.find(
              (item) => String(item.id) === String(userData?.id)
            );

            if (tutor) {
              rating = Number(
                tutor.rating ??
                tutor.tutorRating ??
                rating
              );
              ratingCount = Number(tutor.ratingCount) || 0;
              break;
            }
          }
        }
      } catch (err) {
        console.error('Failed to fetch tutor rating:', err);
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
          const data = await readJsonResponse(earningsResponse);

          if (data.success && data.earnings) {
            totalEarnings = Number(data.earnings.total) || 0;
            sessionsCount = Number(data.earnings.sessionsCount) || 0;

            uniqueStudents = new Set(
              (data.earnings.history || [])
                .map((item) => item.studentId)
                .filter(Boolean)
            );
          }
        } else {
          throw new Error('Earnings endpoint unavailable');
        }
      } catch (err) {
        console.error('Failed to fetch earnings:', err);

        try {
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
            const data = await readJsonResponse(sessionsResponse);
            const sessions = data.sessions || [];

            uniqueStudents = new Set(
              sessions
                .map((session) => session.user_id)
                .filter(Boolean)
            );

            const completedSessions = sessions.filter(
              (session) =>
                session.status === 'completed' ||
                session.status === 'ended'
            );

            sessionsCount = sessions.length;
            totalEarnings = completedSessions.length * 100;
          }
        } catch (sessionsError) {
          console.error('Failed to fetch tutor sessions:', sessionsError);
        }
      }

      setTutorStats({
        totalSessions: sessionsCount,
        studentsTaught: uniqueStudents.size,
        totalEarnings,
        avgRating: Number.isFinite(rating) ? rating : 4.5,
        ratingCount
      });
    } catch (err) {
      console.error('Failed to fetch tutor statistics:', err);

      setTutorStats({
        totalSessions: 0,
        studentsTaught: 0,
        totalEarnings: 0,
        avgRating: Number(userData?.tutor_rating || userData?.rating || 4.5),
        ratingCount: 0
      });
    }
  };

  useEffect(() => {
    fetchUserData();
    // Load the current account once when the profile page mounts.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // LOAD TUTOR WEEKLY AVAILABILITY
  useEffect(() => {
    if (!isTutor) return undefined;

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

        const result = await readJsonResponse(response);

        if (!response.ok) {
          throw new Error(
            result.error ||
            result.message ||
            'Could not load your weekly availability.'
          );
        }

        if (cancelled) return;

        const slots = extractAvailabilitySlots(result);

        if (slots === null) {
          throw new Error(
            'The availability response did not contain a valid slots list.'
          );
        }

        setAvailabilityDays(mapAvailabilitySlots(slots));
        // ✅ Reset dirty flag after a fresh load.
        setAvailabilityDirty(false);
      } catch (err) {
        if (!cancelled) {
          console.error('Availability loading error:', err);
          setAvailabilityError(true);
          setAvailabilityMessage(err.message);
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

  // ✅ NEW: mark availability as dirty whenever the user edits it.
  const markAvailabilityDirty = () => {
    setAvailabilityDirty(true);
    setAvailabilityMessage('');
  };

  // ✅ REPLACED: two explicit checkboxes — Unavailable / Available.
  // Selecting "Available" enables slot editing; selecting "Unavailable"
  // disables the day and clears its slots.
  const setAvailabilityDayMode = (dayOfWeek, mode) => {
    setAvailabilityDays((current) =>
      current.map((day) => {
        if (day.dayOfWeek !== dayOfWeek) return day;

        if (mode === 'available') {
          return {
            ...day,
            enabled: true,
            slots:
              day.slots.length > 0
                ? day.slots
                : [{ startTime: '09:00', endTime: '17:00' }]
          };
        }

        // mode === 'unavailable'
        return {
          ...day,
          enabled: false,
          slots: []
        };
      })
    );

    markAvailabilityDirty();
  };

  // UPDATE TIME RANGE
  const updateAvailabilityTime = (
    dayOfWeek,
    slotIndex,
    field,
    value
  ) => {
    setAvailabilityDays((current) =>
      current.map((day) => {
        if (day.dayOfWeek !== dayOfWeek) return day;

        return {
          ...day,
          slots: day.slots.map((slot, index) =>
            index === slotIndex
              ? { ...slot, [field]: value }
              : slot
          )
        };
      })
    );

    markAvailabilityDirty();
  };

  // ADD TIME RANGE
  const addAvailabilitySlot = (dayOfWeek) => {
    setAvailabilityDays((current) =>
      current.map((day) => {
        if (day.dayOfWeek !== dayOfWeek) return day;

        const previousSlot = day.slots[day.slots.length - 1];
        const nextStart = previousSlot?.endTime || '09:00';

        const [hours, minutes] = nextStart.split(':').map(Number);
        const startMinutes = hours * 60 + minutes;

        if (
          !Number.isFinite(startMinutes) ||
          startMinutes >= 23 * 60 + 59
        ) {
          return day;
        }

        const nextEndMinutes = Math.min(
          startMinutes + 60,
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

    markAvailabilityDirty();
  };

  // REMOVE TIME RANGE
  const removeAvailabilitySlot = (dayOfWeek, slotIndex) => {
    setAvailabilityDays((current) =>
      current.map((day) => {
        if (day.dayOfWeek !== dayOfWeek) return day;

        return {
          ...day,
          slots: day.slots.filter(
            (_, index) => index !== slotIndex
          )
        };
      })
    );

    markAvailabilityDirty();
  };

  // VALIDATE AVAILABILITY
  const validateAvailability = () => {
    const enabledDays = availabilityDays.filter(
      (day) => day.enabled
    );

    for (const day of enabledDays) {
      if (!day.slots.length) {
        return `Please add at least one time range for ${day.name}.`;
      }

      const sortedSlots = [...day.slots].sort(
        (a, b) => a.startTime.localeCompare(b.startTime)
      );

      for (const slot of sortedSlots) {
        if (!slot.startTime || !slot.endTime) {
          return `Complete all time ranges for ${day.name}.`;
        }

        if (
          !/^\d{2}:\d{2}$/.test(slot.startTime) ||
          !/^\d{2}:\d{2}$/.test(slot.endTime)
        ) {
          return `Enter valid start and end times for ${day.name}.`;
        }

        if (slot.startTime >= slot.endTime) {
          return `The end time must be later than the start time on ${day.name}.`;
        }
      }

      for (let index = 1; index < sortedSlots.length; index += 1) {
        if (
          sortedSlots[index].startTime <
          sortedSlots[index - 1].endTime
        ) {
          return `Your time ranges overlap on ${day.name}. Please adjust them.`;
        }
      }
    }

    if (!enabledDays.length) {
      return 'Please make at least one day available before saving.';
    }

    return null;
  };

  // SAVE AVAILABILITY
  const saveAvailability = async () => {
    if (availabilitySaving || availabilityLoading) return;

    setAvailabilityError(false);
    setAvailabilityMessage('');

    const validationError = validateAvailability();

    if (validationError) {
      setAvailabilityError(true);
      setAvailabilityMessage(validationError);
      return;
    }

    setAvailabilitySaving(true);

    try {
      const token = localStorage.getItem('accessToken');

      if (!token) {
        throw new Error(
          'Your session has expired. Please sign in again.'
        );
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

      const result = await readJsonResponse(response);

      if (!response.ok) {
        throw new Error(
          result.error ||
          result.message ||
          'Could not save your weekly availability.'
        );
      }

      // Some APIs return the saved slots; others return only success/message.
      // Do not clear the user's schedule when the response omits the slots.
      const returnedSlots = extractAvailabilitySlots(result);
      const slotsToDisplay = returnedSlots ?? slots;

      setAvailabilityDays(mapAvailabilitySlots(slotsToDisplay));
      // ✅ Saving resets the dirty flag — button becomes inactive again.
      setAvailabilityDirty(false);

      setAvailabilityMessage(
        result.message ||
        'Weekly availability saved successfully.'
      );

      setAvailabilityError(false);
    } catch (err) {
      console.error('Availability saving error:', err);
      setAvailabilityError(true);
      setAvailabilityMessage(err.message);
    } finally {
      setAvailabilitySaving(false);
    }
  };

  // REFRESH USER DATA
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

      if (!response.ok) return;

      const data = await readJsonResponse(response);

      if (data.success && data.user) {
        const userData = data.user;

        setUser(userData);

        if (userData.avatar && isTutor) {
          setProfilePhoto(userData.avatar);
        }

        if (userData.intro_video_url) {
          setVideoUrl(userData.intro_video_url);
          setVideoThumbnail(userData.intro_video_thumbnail || null);
          setVideoDuration(Number(userData.intro_video_duration) || 0);
          setVideoViews(Number(userData.intro_video_views) || 0);
        } else {
          setVideoUrl(null);
          setVideoThumbnail(null);
          setVideoDuration(0);
          setVideoViews(0);
        }

        localStorage.setItem('user', JSON.stringify(userData));
      }
    } catch (err) {
      console.error('Failed to refresh user data:', err);
    }
  };

  // VIDEO SELECTION
  const handleVideoSelect = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const validTypes = [
      'video/mp4',
      'video/webm',
      'video/quicktime',
      'video/x-matroska'
    ];

    const validExtension = /\.(mp4|webm|mov|mkv)$/i.test(file.name);

    if (!validTypes.includes(file.type) && !validExtension) {
      setError('Please upload a valid video file (MP4, WebM, MOV, MKV).');
      event.target.value = '';
      return;
    }

    if (file.size > 100 * 1024 * 1024) {
      setError('Video file must be less than 100MB.');
      event.target.value = '';
      return;
    }

    setVideoFile(file);
    setError('');

    if (videoPreview) {
      URL.revokeObjectURL(videoPreview);
    }

    const previewUrl = URL.createObjectURL(file);
    setVideoPreview(previewUrl);

    const video = document.createElement('video');
    video.preload = 'metadata';
    video.src = previewUrl;

    video.onloadedmetadata = () => {
      setVideoDuration(
        Number.isFinite(video.duration)
          ? Math.round(video.duration)
          : 0
      );
    };

    generateThumbnail(file);
    setShowVideoManager(true);
  };

  // GENERATE VIDEO THUMBNAIL
  const generateThumbnail = (file) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement('video');

    video.preload = 'metadata';
    video.muted = true;
    video.src = url;

    video.onloadedmetadata = () => {
      video.currentTime = Math.min(1, video.duration || 1);
    };

    video.onloadeddata = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = 640;
        canvas.height = 360;

        const context = canvas.getContext('2d');

        if (context) {
          context.drawImage(
            video,
            0,
            0,
            canvas.width,
            canvas.height
          );

          setVideoThumbnail(
            canvas.toDataURL('image/jpeg', 0.8)
          );
        }
      } catch (err) {
        console.error('Could not generate video thumbnail:', err);
        setVideoThumbnail(null);
      } finally {
        URL.revokeObjectURL(url);
      }
    };

    video.onerror = () => {
      setVideoThumbnail(null);
      URL.revokeObjectURL(url);
    };
  };

  // UPLOAD VIDEO
  const handleUploadVideo = async () => {
    if (!videoFile) {
      setError('Please select a video first.');
      return;
    }

    try {
      setVideoUploading(true);
      setVideoProgress(0);
      setError('');

      const base64Video = await new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(
          new Error('Failed to read video file.')
        );

        reader.readAsDataURL(videoFile);
      });

      setVideoProgress(50);

      const result = await tutorService.uploadIntroVideo({
        videoUrl: base64Video,
        thumbnail: videoThumbnail || null,
        duration: videoDuration
      });

      if (!result?.success) {
        throw new Error(result?.error || 'Failed to upload video.');
      }

      setVideoProgress(100);
      await refreshUserData();

      setSuccess('Video uploaded successfully!');

      if (videoPreview) {
        URL.revokeObjectURL(videoPreview);
      }

      setVideoPreview(null);
      setVideoFile(null);
      setShowVideoManager(false);

      if (videoFileInputRef.current) {
        videoFileInputRef.current.value = '';
      }
    } catch (err) {
      console.error('Video upload error:', err);
      setError(err.message || 'Failed to upload video.');
    } finally {
      setVideoUploading(false);
    }
  };

  // REMOVE VIDEO
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

      const result = await tutorService.removeIntroVideo();

      if (!result?.success) {
        throw new Error(result?.error || 'Failed to remove video.');
      }

      await refreshUserData();

      setVideoPreview(null);
      setVideoFile(null);
      setVideoProgress(0);
      setShowVideoManager(false);
      setSuccess('Video removed successfully.');
    } catch (err) {
      setError(err.message || 'Failed to remove video.');
    } finally {
      setVideoUploading(false);
    }
  };

  const handleReplaceVideo = () => {
    videoFileInputRef.current?.click();
  };

  const formatDuration = (seconds) => {
    const value = Number(seconds) || 0;
    const mins = Math.floor(value / 60);
    const secs = value % 60;

    return `${mins}:${String(secs).padStart(2, '0')}`;
  };

  // GENERAL FORM HANDLERS
  const handleInputChange = (event) => {
    const { name, value } = event.target;

    setEditForm((previous) => ({
      ...previous,
      [name]: value
    }));
  };

  const handleSubjectToggle = (subject) => {
    setEditForm((previous) => {
      const subjects = previous.subjects || [];

      return {
        ...previous,
        subjects: subjects.includes(subject)
          ? subjects.filter((item) => item !== subject)
          : [...subjects, subject]
      };
    });
  };

  // AVATAR HANDLERS
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
        setError('Please log in again to save your avatar.');
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

      const data = await readJsonResponse(response);

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to save avatar.');
      }

      setSuccess('Avatar updated successfully!');

      setUser((previous) => ({
        ...previous,
        avatar: avatar.svg,
        avatar_seed: avatar.seed,
        avatar_style: avatar.style || 'adventurer'
      }));
    } catch (err) {
      console.error('Failed to save avatar:', err);
      setError(err.message || 'Failed to save avatar.');
    }
  };

  // PROFILE PHOTO UPLOAD
  const handlePhotoUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setPhotoError('Please upload an image file (JPG, PNG, WEBP).');
      event.target.value = '';
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setPhotoError('Image must be under 5MB.');
      event.target.value = '';
      return;
    }

    setPhotoUploading(true);
    setPhotoError('');

    try {
      const base64Image = await new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(
          new Error('Failed to read image file.')
        );

        reader.readAsDataURL(file);
      });

      const token = localStorage.getItem('accessToken');

      if (!token) {
        throw new Error('Your session has expired. Please sign in again.');
      }

      const response = await fetch(
        `${API_BASE_URL}/auth/profile`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ avatar: base64Image })
        }
      );

      const data = await readJsonResponse(response);

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to upload photo.');
      }

      setProfilePhoto(base64Image);
      setSuccess('Photo uploaded successfully!');

      setUser((previous) => ({
        ...previous,
        avatar: base64Image
      }));

      const storedUser = JSON.parse(
        localStorage.getItem('user') || '{}'
      );

      storedUser.avatar = base64Image;
      localStorage.setItem('user', JSON.stringify(storedUser));
    } catch (err) {
      console.error('Photo upload error:', err);
      setPhotoError(err.message || 'Error uploading photo.');
    } finally {
      setPhotoUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  // SAVE PROFILE - UUID-SAFE SHIFT HANDLING
  const handleSaveProfile = async (event) => {
    event.preventDefault();

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('accessToken');

      if (!token) {
        setError('Session expired. Please log in again.');
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

        // An empty string must never be sent as a UUID.
        shiftId:
          editForm.shiftId &&
          String(editForm.shiftId).trim() !== ''
            ? editForm.shiftId
            : null
      };

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

      const data = await readJsonResponse(response);

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to update profile.');
      }

      const returnedUser = data.user || {};
      const updatedUser = {
        ...user,
        ...returnedUser
      };

      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));

      setEditForm((previous) => ({
        ...previous,
        name: returnedUser.name ?? previous.name,
        email: returnedUser.email ?? previous.email,
        country: returnedUser.country ?? previous.country,
        timezone: returnedUser.timezone ?? previous.timezone,
        grade: returnedUser.grade ?? previous.grade,
        bio: returnedUser.bio ?? previous.bio,
        tier:
          returnedUser.tutor_tier ??
          returnedUser.tier ??
          previous.tier,
        subjects:
          returnedUser.tutor_subjects ??
          previous.subjects,
        shiftId:
          returnedUser.tutor_shift_id ??
          (payload.shiftId || ''),
        yearsExperience:
          returnedUser.years_experience ??
          previous.yearsExperience,
        education: returnedUser.education ?? previous.education,
        phone: returnedUser.phone ?? previous.phone,
        linkedin: returnedUser.linkedin ?? previous.linkedin,
        website: returnedUser.website ?? previous.website
      }));

      if (updatedUser.intro_video_url) {
        setVideoUrl(updatedUser.intro_video_url);
        setVideoThumbnail(updatedUser.intro_video_thumbnail || null);
        setVideoDuration(Number(updatedUser.intro_video_duration) || 0);
        setVideoViews(Number(updatedUser.intro_video_views) || 0);
      }

      setSuccess('Profile updated successfully!');
      setIsEditing(false);
    } catch (err) {
      console.error('Profile save error:', err);
      setError(err.message || 'Failed to update profile.');
    } finally {
      setLoading(false);
    }
  };

  // CHANGE PASSWORD
  const handlePasswordChange = async (event) => {
    event.preventDefault();

    setError('');
    setSuccess('');

    if (
      passwordData.newPassword !==
      passwordData.confirmPassword
    ) {
      setError('New passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem('accessToken');

      if (!token) {
        throw new Error('Session expired. Please log in again.');
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
            currentPassword: passwordData.currentPassword,
            newPassword: passwordData.newPassword
          })
        }
      );

      const data = await readJsonResponse(response);

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to change password.');
      }

      setSuccess('Password changed successfully!');
      setShowPasswordModal(false);

      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (err) {
      setError(err.message || 'Failed to change password.');
    } finally {
      setLoading(false);
    }
  };

  // DELETE ACCOUNT
  const handleDeleteAccount = async () => {
    if (
      !window.confirm(
        'Are you sure you want to delete your account? This action is permanent!'
      )
    ) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('accessToken');

      if (!token) {
        throw new Error('Session expired. Please log in again.');
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

      const data = await readJsonResponse(response);

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete account.');
      }

      await authService.logout();
      navigate('/login');
    } catch (err) {
      setError(err.message || 'Failed to delete account.');
    } finally {
      setLoading(false);
      setShowDeleteModal(false);
    }
  };

  // VIDEO MANAGER MODAL
  const VideoManagerModal = () => {
    if (!showVideoManager) return null;

    const closeVideoManager = () => {
      if (videoUploading) return;

      if (videoPreview) {
        URL.revokeObjectURL(videoPreview);
      }

      setShowVideoManager(false);
      setVideoPreview(null);
      setVideoFile(null);
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
          onClick={(event) => event.stopPropagation()}
        >
          <div className="profile-modal-header">
            <h3>🎬 Video Manager</h3>
            <button
              type="button"
              className="modal-close"
              onClick={closeVideoManager}
              disabled={videoUploading}
            >
              ×
            </button>
          </div>

          <div className="profile-modal-body video-manager-body">
            {/* Keep this input mounted whether a video exists or not.
                This ensures Replace Video can always open the picker. */}
            <input
              ref={videoFileInputRef}
              type="file"
              accept="video/mp4,video/webm,video/quicktime,video/x-matroska,.mkv"
              onChange={handleVideoSelect}
              disabled={videoUploading}
              style={{ display: 'none' }}
            />

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
                    <span>⏱️ {formatDuration(videoDuration)}</span>
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
                    ({((videoFile?.size || 0) / (1024 * 1024)).toFixed(1)} MB)
                  </span>
                  {videoDuration > 0 && (
                    <span>⏱️ {formatDuration(videoDuration)}</span>
                  )}
                </div>

                {videoUploading && (
                  <div className="video-progress-container">
                    <div className="video-progress-bar">
                      <div
                        className="video-progress-fill"
                        style={{ width: `${videoProgress}%` }}
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
                onClick={() => videoFileInputRef.current?.click()}
              >
                <span className="upload-icon">🎥</span>
                <p>Click to upload your intro video</p>
                <small>MP4, WebM, MOV, MKV • Max 100MB</small>
              </div>
            )}

            <div className="video-actions">
              {!videoPreview && !videoUrl && (
                <button
                  type="button"
                  className="video-action-btn primary"
                  onClick={() => videoFileInputRef.current?.click()}
                  disabled={videoUploading}
                >
                  📤 Upload Video
                </button>
              )}

              {videoPreview && !videoUploading && (
                <>
                  <button
                    type="button"
                    className="video-action-btn primary"
                    onClick={handleUploadVideo}
                  >
                    ✅ Confirm Upload
                  </button>

                  <button
                    type="button"
                    className="video-action-btn cancel"
                    onClick={() => {
                      URL.revokeObjectURL(videoPreview);
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
                    type="button"
                    className="video-action-btn secondary"
                    onClick={() => {
                      setShowVideoModal(true);
                      setShowVideoManager(false);
                    }}
                  >
                    👁️ Preview
                  </button>

                  <button
                    type="button"
                    className="video-action-btn primary"
                    onClick={handleReplaceVideo}
                    disabled={videoUploading}
                  >
                    🔄 Replace Video
                  </button>

                  <button
                    type="button"
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

  // VIDEO PREVIEW MODAL
  const VideoPreviewModal = () => {
    if (!showVideoModal || !videoUrl) return null;

    return (
      <div
        className="profile-modal-overlay"
        onClick={() => setShowVideoModal(false)}
      >
        <div
          className="profile-modal video-preview-modal"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="profile-modal-header">
            <h3>🎬 Your Intro Video</h3>
            <button
              type="button"
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
              type="button"
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

  // RENDER
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
          number: `R${Number(tutorStats.totalEarnings || 0).toFixed(2)}`,
          label: 'Earnings'
        },
        {
          number: `${Number(tutorStats.avgRating || 0).toFixed(1)}⭐`,
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
      <VideoManagerModal />
      <VideoPreviewModal />

      {/* PROFILE HEADER */}
      <div className="profile-header">
        <div
          className="profile-avatar"
          onClick={
            isTutor
              ? triggerFileInput
              : () => setShowAvatarSelector(true)
          }
          role="button"
          tabIndex={0}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              isTutor
                ? triggerFileInput()
                : setShowAvatarSelector(true);
            }
          }}
        >
          {isTutor ? (
            profilePhoto ? (
              <img
                src={profilePhoto}
                alt={user?.name || 'Tutor profile'}
                className="profile-avatar-img"
              />
            ) : (
              <span className="profile-avatar-emoji">👨‍🏫</span>
            )
          ) : avatarImage ? (
            <img
              src={avatarImage}
              alt={user?.name || 'User avatar'}
              className="profile-avatar-img"
            />
          ) : (
            <span className="profile-avatar-emoji">👤</span>
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
              : user?.cohort === 'HighSchool'
                ? 'High School Student'
                : 'University Student'}
            {' • '}
            {user?.country || 'South Africa'}
          </p>

          <div className="profile-status">
            <span className="status-dot"></span>
            <span>{isTutor ? 'Active Tutor' : 'Active Member'}</span>
          </div>
        </div>

        <button
          type="button"
          className="profile-edit-btn"
          onClick={() => setIsEditing((previous) => !previous)}
        >
          {isEditing ? 'Cancel' : '✏️ Edit Profile'}
        </button>
      </div>

      {/* MESSAGES */}
      {photoError && (
        <div className="profile-error">{photoError}</div>
      )}

      {photoUploading && (
        <div className="profile-success">📤 Uploading photo...</div>
      )}

      {error && (
        <div className="profile-error">{error}</div>
      )}

      {success && (
        <div className="profile-success">{success}</div>
      )}

      {/* PROFILE STATISTICS */}
      <div className="profile-stats">
        {statsToShow.map((stat, index) => (
          <div key={index} className="profile-stat-card">
            <span className="stat-number">{stat.number}</span>
            <span className="stat-label">{stat.label}</span>
          </div>
        ))}
      </div>

      {/* PROFILE GRID */}
      <div className="profile-grid">
        {/* PERSONAL INFORMATION */}
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
                label: isTutor ? 'Expertise Level' : 'Grade / Year',
                name: 'grade',
                value: editForm.grade
              },
              {
                label: 'Role',
                name: 'cohort',
                value: isTutor
                  ? 'Tutor'
                  : user?.cohort === 'HighSchool'
                    ? 'High School Student'
                    : 'University First Year'
              }
            ].map((field) => (
              <div
                key={field.name}
                className="profile-info-item"
              >
                <span className="info-label">{field.label}</span>

                {isEditing && field.name !== 'cohort' ? (
                  <input
                    type="text"
                    name={field.name}
                    value={field.value ?? ''}
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
                type="button"
                className="profile-save-btn"
                onClick={handleSaveProfile}
                disabled={loading}
              >
                {loading ? 'Saving...' : '💾 Save Changes'}
              </button>
            </div>
          )}
        </div>

        {/* ACCOUNT SETTINGS */}
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
                type="button"
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
                type="button"
                className="setting-action-btn danger"
                onClick={() => setShowDeleteModal(true)}
              >
                Delete
              </button>
            </div>
          </div>
        </div>

        {/* TUTOR PROFILE */}
        {isTutor && (
          <div className="profile-card full-width">
            <h3>👨‍🏫 Tutor Profile</h3>

            <div className="tutor-profile-grid">
              {/* BIO */}
              <div className="tutor-field tutor-field-full">
                <label className="tutor-field-label">📝 About Me</label>

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
                <label className="tutor-field-label">🏅 Tier / Level</label>

                {isEditing ? (
                  <select
                    name="tier"
                    value={editForm.tier || ''}
                    onChange={handleInputChange}
                    className="profile-select tutor-select"
                  >
                    <option value="">Select Tier</option>
                    <option value="TIER_1">TIER_1 - Grades 8-9</option>
                    <option value="TIER_2">TIER_2 - Grades 10-11</option>
                    <option value="TIER_3">TIER_3 - Grade 12 &amp; Tertiary</option>
                  </select>
                ) : (
                  <span className="tutor-field-value">
                    {editForm.tier || 'Not set'}
                  </span>
                )}
              </div>

              {/* SHIFT */}
              <div className="tutor-field">
                <label className="tutor-field-label">⏰ Shift</label>

                {isEditing ? (
                  <select
                    name="shiftId"
                    value={editForm.shiftId || ''}
                    onChange={handleInputChange}
                    className="profile-select tutor-select"
                  >
                    <option value="">Select Shift</option>
                    {shiftOptions.map((shift) => (
                      <option key={shift.id} value={shift.id}>
                        {shift.name} ({shift.sast_start} - {shift.sast_end})
                      </option>
                    ))}
                  </select>
                ) : (
                  <span className="tutor-field-value">
                    {
                      shiftOptions.find(
                        (shift) =>
                          String(shift.id) === String(editForm.shiftId)
                      )?.name || 'Not set'
                    }
                  </span>
                )}
              </div>

              {/* EXPERIENCE */}
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
                    {Number(editForm.yearsExperience) === 1 ? 'year' : 'years'}
                  </span>
                )}
              </div>

              {/* EDUCATION */}
              <div className="tutor-field">
                <label className="tutor-field-label">🎓 Education</label>

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
                <label className="tutor-field-label">📞 Phone Number</label>

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
                <label className="tutor-field-label">🔗 LinkedIn</label>

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
                    ) : 'Not set'}
                  </span>
                )}
              </div>

              {/* WEBSITE */}
              <div className="tutor-field">
                <label className="tutor-field-label">🌐 Website</label>

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
                    ) : 'Not set'}
                  </span>
                )}
              </div>

              {/* SUBJECTS */}
              <div className="tutor-field tutor-field-full">
                <label className="tutor-field-label">📖 Subjects Taught</label>

                {isEditing ? (
                  <div className="tutor-subjects-edit">
                    {subjectOptions.map((subject) => (
                      <label
                        key={subject}
                        className="tutor-subject-checkbox-label"
                      >
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
                  <div className="tutor-subjects-display">
                    {(editForm.subjects || []).length > 0 ? (
                      editForm.subjects.map((subject) => (
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

              {/* INTRO VIDEO — now a standalone visual block, no longer
                  directly above the Weekly Availability card. The
                  availability card is moved outside this grid entirely. */}
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
                    onClick={() => setShowVideoManager(true)}
                    style={{
                      background: videoUrl
                        ? 'rgba(255,255,255,0.04)'
                        : 'rgba(79,70,229,0.15)',
                      borderColor: videoUrl
                        ? 'rgba(255,255,255,0.06)'
                        : 'rgba(79,70,229,0.2)',
                      color: videoUrl ? '#ffffff' : '#818cf8',
                      fontWeight: 600
                    }}
                  >
                    {videoUrl ? '⚙️ Manage Video' : '📤 Upload Video'}
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
                    style={{ maxWidth: '400px', cursor: 'pointer' }}
                    onClick={() => setShowVideoModal(true)}
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
                      <span>⏱️ {formatDuration(videoDuration)}</span>
                      {videoViews > 0 && (
                        <span>👁️ {videoViews} views</span>
                      )}
                    </div>
                  </div>
                ) : (
                  <div
                    className="video-upload-zone"
                    style={{ maxWidth: '400px', cursor: 'pointer' }}
                    onClick={() => setShowVideoManager(true)}
                  >
                    <span className="upload-icon">🎥</span>
                    <p>No intro video yet</p>
                    <small>Click to upload your introduction video</small>
                  </div>
                )}
              </div>
            </div>

            {/* SAVE TUTOR PROFILE */}
            {isEditing && (
              <div className="profile-actions">
                <button
                  type="button"
                  className="profile-save-btn"
                  onClick={handleSaveProfile}
                  disabled={loading}
                >
                  {loading ? 'Saving...' : '💾 Save Changes'}
                </button>
              </div>
            )}
          </div>
        )}

        {/* ===== WEEKLY AVAILABILITY — SEPARATED SECTION ===== */}
        {isTutor && (
          <div className="profile-card full-width tutor-availability-card">
            <h3>📅 Weekly Availability</h3>
            <p className="tutor-availability-subtitle">
              Set the days and times when students can book sessions with you.
              You can add multiple time ranges for each day.
            </p>

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

                      {/* ✅ TWO EXPLICIT CHECKBOXES */}
                      <div className="tutor-availability-mode">
                        <label className="tutor-availability-mode-label">
                          <input
                            type="checkbox"
                            checked={!day.enabled}
                            onChange={() =>
                              setAvailabilityDayMode(
                                day.dayOfWeek,
                                'unavailable'
                              )
                            }
                          />
                          <span>Unavailable</span>
                        </label>

                        <label className="tutor-availability-mode-label">
                          <input
                            type="checkbox"
                            checked={day.enabled}
                            onChange={() =>
                              setAvailabilityDayMode(
                                day.dayOfWeek,
                                'available'
                              )
                            }
                          />
                          <span>Available</span>
                        </label>
                      </div>
                    </div>

                    {day.enabled ? (
                      <div className="tutor-availability-slots">
                        {day.slots.map((slot, index) => (
                          <div
                            className="tutor-availability-slot"
                            key={`${day.dayOfWeek}-${index}`}
                          >
                            <div className="tutor-availability-time-field">
                              <label>Start time</label>
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
                              <label>End time</label>
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
                            addAvailabilitySlot(day.dayOfWeek)
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
                      availabilityError ? 'error' : 'success'
                    }`}
                    role="status"
                  >
                    {availabilityMessage}
                  </div>
                )}

                <div className="tutor-availability-actions">
                  {/* ✅ DISABLED UNTIL DIRTY */}
                  <button
                    type="button"
                    className="tutor-availability-save"
                    onClick={saveAvailability}
                    disabled={
                      availabilitySaving ||
                      availabilityLoading ||
                      !availabilityDirty
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
        )}

        {/* STUDENT COURSES */}
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
                          `/subjects/${String(course.name || '').toLowerCase()}`
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
                            style={{ width: `${progress}%` }}
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
                  type="button"
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

      {/* CHANGE PASSWORD MODAL */}
      {showPasswordModal && (
        <div
          className="profile-modal-overlay"
          onClick={() => setShowPasswordModal(false)}
        >
          <div
            className="profile-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="profile-modal-header">
              <h3>🔑 Change Password</h3>
              <button
                type="button"
                className="modal-close"
                onClick={() => setShowPasswordModal(false)}
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
                    onChange={(event) =>
                      setPasswordData((previous) => ({
                        ...previous,
                        currentPassword: event.target.value
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
                    onChange={(event) =>
                      setPasswordData((previous) => ({
                        ...previous,
                        newPassword: event.target.value
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
                    onChange={(event) =>
                      setPasswordData((previous) => ({
                        ...previous,
                        confirmPassword: event.target.value
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
                  onClick={() => setShowPasswordModal(false)}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="modal-submit"
                  disabled={loading}
                >
                  {loading ? 'Changing...' : 'Change Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE ACCOUNT MODAL */}
      {showDeleteModal && (
        <div
          className="profile-modal-overlay"
          onClick={() => setShowDeleteModal(false)}
        >
          <div
            className="profile-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="profile-modal-header danger">
              <h3>⚠️ Delete Account</h3>
              <button
                type="button"
                className="modal-close"
                onClick={() => setShowDeleteModal(false)}
              >
                ×
              </button>
            </div>

            <div className="profile-modal-body">
              <p className="delete-warning">
                Are you sure you want to delete your account?
                This action is <strong>permanent</strong> and cannot be undone.
              </p>

              <p style={{ color: '#94a3b8' }}>
                All your data, including enrolled courses and progress,
                will be permanently removed.
              </p>
            </div>

            <div className="profile-modal-actions">
              <button
                type="button"
                className="modal-cancel"
                onClick={() => setShowDeleteModal(false)}
              >
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

      {/* STUDENT AVATAR SELECTOR */}
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
