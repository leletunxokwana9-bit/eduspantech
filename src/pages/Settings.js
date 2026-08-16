// src/pages/Settings.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';
import { useTheme } from '../context/ThemeContext';
import { API_BASE_URL } from '../services/api';
import './Settings.css';

const Settings = () => {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [isTutor, setIsTutor] = useState(false);
  const [user, setUser] = useState(null);

  // Dynamic data from API
  const [subjectOptions, setSubjectOptions] = useState([]);
  const [shiftOptions, setShiftOptions] = useState([]);
  const [tierOptions, setTierOptions] = useState([]);
  const [curriculumOptions, setCurriculumOptions] = useState([]);

  // Settings state
  const [settings, setSettings] = useState({
    // Appearance - Both Student & Tutor
    theme: theme || 'dark',
    fontSize: 'medium',
    reduceAnimations: false,
    
    // Language & Region - Both
    language: 'en',
    dateFormat: 'DD/MM/YYYY',
    currency: 'ZAR',
    
    // Notifications - Both (but different categories)
    notifications: {
      sessionReminders: true,
      tutorMessages: true,
      paymentAlerts: true,
      marketingEmails: false,
      weeklyProgress: true,
      achievements: true
    },
    
    // Privacy & Security - Both
    twoFactorAuth: false,
    shareUsageData: true,
    
    // Accessibility - Both
    highContrast: false,
    screenReaderOptimized: false,
    textToSpeech: false,

    // ============================================
    // STUDENT-ONLY SETTINGS
    // ============================================
    student: {
      // Learning Preferences
      defaultCurriculum: '',
      defaultGrade: '',
      autoPlayTutorials: true,
      showHints: true,
      difficultyLevel: 'intermediate',
      showSolutions: 'after_attempt',
      
      // Session Preferences
      preferredSessionTime: 'evening',
      sessionDuration: 60,
      autoSaveWhiteboard: true,
      breakReminders: true
    },

    // ============================================
    // TUTOR-ONLY SETTINGS
    // ============================================
    tutor: {
      // Profile
      bio: '',
      tier: '',
      subjects: [],
      shiftId: '',
      yearsExperience: 0,
      education: '',
      phone: '',
      linkedin: '',
      website: '',
      
      // Availability
      availability: {
        days: [],
        sessionDuration: 60,
        bufferTime: 15,
        rate: 0
      },
      
      // Tutor Notifications
      notifications: {
        newBookings: true,
        studentMessages: true,
        ratings: true,
        earnings: true,
        systemUpdates: true
      },
      
      // Payment
      paymentInfo: {
        method: 'bank_transfer',
        bankName: '',
        accountNumber: '',
        accountHolder: '',
        taxId: ''
      }
    }
  });

  // Auto-dismiss success message
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(''), 3000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  // Fetch all dynamic data
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch subjects
        const subjectsRes = await fetch(`${API_BASE_URL}/content/subjects`);
        const subjectsData = await subjectsRes.json();
        if (subjectsData.success) {
          setSubjectOptions(subjectsData.subjects || []);
        }

        // Fetch shifts
        const shiftsRes = await fetch(`${API_BASE_URL}/shifts`);
        const shiftsData = await shiftsRes.json();
        if (shiftsData.success) {
          setShiftOptions(shiftsData.shifts || []);
        }

        // Fetch curricula
        const currRes = await fetch(`${API_BASE_URL}/content/curricula`);
        const currData = await currRes.json();
        if (currData.success) {
          setCurriculumOptions(currData.curricula || []);
        }

        // Tiers - fallback if API not available
        setTierOptions([
          { value: 'TIER_1', label: 'TIER_1 - Grades 8-9' },
          { value: 'TIER_2', label: 'TIER_2 - Grades 10-11' },
          { value: 'TIER_3', label: 'TIER_3 - Grade 12 & Tertiary' }
        ]);
      } catch (error) {
        console.error('Failed to fetch dynamic data:', error);
        setSubjectOptions([]);
        setShiftOptions([]);
        setCurriculumOptions([]);
        setTierOptions([
          { value: 'TIER_1', label: 'TIER_1 - Grades 8-9' },
          { value: 'TIER_2', label: 'TIER_2 - Grades 10-11' },
          { value: 'TIER_3', label: 'TIER_3 - Grade 12 & Tertiary' }
        ]);
      }
    };

    fetchData();
  }, []);

  // Fetch user data and saved settings
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
          
          // Load saved settings from localStorage
          const savedSettings = localStorage.getItem('eduspantech_settings');
          if (savedSettings) {
            try {
              const parsed = JSON.parse(savedSettings);
              if (parsed.theme) {
                setTheme(parsed.theme);
              }
              setSettings(prev => ({ ...prev, ...parsed }));
            } catch (e) {}
          }

          // Get user profile
          const userProfileRes = await fetch(`${API_BASE_URL}/auth/me`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          const profileData = await userProfileRes.json();
          const userProfile = profileData.user || profileData || {};

          if (isTutorAccount) {
            // Load tutor data
            setSettings(prev => ({
              ...prev,
              tutor: {
                ...prev.tutor,
                bio: userData.bio || userProfile.bio || userProfile.tutor_bio || '',
                tier: userData.tutor_tier || userProfile.tutor_tier || userData.tier || '',
                subjects: userData.tutor_subjects || userProfile.tutor_subjects || [],
                shiftId: userData.tutor_shift_id || userProfile.tutor_shift_id || '',
                yearsExperience: userData.years_experience || userProfile.years_experience || 0,
                education: userData.education || userProfile.education || '',
                phone: userData.phone || userProfile.phone || '',
                linkedin: userData.linkedin || userProfile.linkedin || '',
                website: userData.website || userProfile.website || '',
                availability: {
                  ...prev.tutor.availability,
                  days: userData.availability?.days || userProfile.availability?.days || [],
                  sessionDuration: userData.availability?.sessionDuration || userProfile.availability?.sessionDuration || 60,
                  bufferTime: userData.availability?.bufferTime || userProfile.availability?.bufferTime || 15,
                  rate: userData.availability?.rate || userProfile.availability?.rate || 0
                },
                paymentInfo: {
                  ...prev.tutor.paymentInfo,
                  ...(userData.paymentInfo || userProfile.paymentInfo || {})
                }
              }
            }));
          } else {
            // Load student data
            setSettings(prev => ({
              ...prev,
              student: {
                ...prev.student,
                defaultCurriculum: userData.curriculum || userProfile.curriculum || '',
                defaultGrade: userData.grade || userProfile.grade || '',
                preferredSessionTime: userData.preferredSessionTime || userProfile.preferredSessionTime || 'evening',
                sessionDuration: userData.sessionDuration || userProfile.sessionDuration || 60,
                autoSaveWhiteboard: userData.autoSaveWhiteboard !== undefined ? userData.autoSaveWhiteboard : true,
                breakReminders: userData.breakReminders !== undefined ? userData.breakReminders : true
              }
            }));
          }
        } else {
          navigate('/login');
        }
      } catch (err) {
        setError('Failed to load settings');
      } finally {
        setLoading(false);
      }
    };
    fetchUserData();
  }, [navigate, setTheme]);

  // Apply theme on change
  useEffect(() => {
    setSettings(prev => ({ ...prev, theme: theme }));
  }, [theme]);

  // Handle general setting changes
  const handleSettingChange = (category, key, value) => {
    setSettings(prev => {
      const newSettings = category 
        ? { ...prev, [category]: { ...prev[category], [key]: value } }
        : { ...prev, [key]: value };
      
      if (key === 'theme' && !category) {
        setTheme(value);
      }
      
      return newSettings;
    });
  };

  // Handle student setting changes
  const handleStudentSettingChange = (category, key, value) => {
    setSettings(prev => ({
      ...prev,
      student: {
        ...prev.student,
        [category]: typeof prev.student[category] === 'object' 
          ? { ...prev.student[category], [key]: value }
          : { ...prev.student, [category]: value }
      }
    }));
  };

  // Handle tutor setting changes
  const handleTutorSettingChange = (category, key, value) => {
    setSettings(prev => ({
      ...prev,
      tutor: {
        ...prev.tutor,
        [category]: typeof prev.tutor[category] === 'object' && !Array.isArray(prev.tutor[category])
          ? { ...prev.tutor[category], [key]: value }
          : { ...prev.tutor, [category]: value }
      }
    }));
  };

  // Handle tutor subject toggle
  const handleSubjectToggle = (subjectId) => {
    setSettings(prev => {
      const subjects = prev.tutor.subjects || [];
      if (subjects.includes(subjectId)) {
        return {
          ...prev,
          tutor: { ...prev.tutor, subjects: subjects.filter(s => s !== subjectId) }
        };
      } else {
        return {
          ...prev,
          tutor: { ...prev.tutor, subjects: [...subjects, subjectId] }
        };
      }
    });
  };

  // Handle tutor availability toggle
  const handleAvailabilityToggle = (day) => {
    setSettings(prev => {
      const days = prev.tutor.availability.days || [];
      if (days.includes(day)) {
        return {
          ...prev,
          tutor: {
            ...prev.tutor,
            availability: {
              ...prev.tutor.availability,
              days: days.filter(d => d !== day)
            }
          }
        };
      } else {
        return {
          ...prev,
          tutor: {
            ...prev.tutor,
            availability: {
              ...prev.tutor.availability,
              days: [...days, day]
            }
          }
        };
      }
    });
  };

  // Save all settings
  const handleSave = async () => {
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      localStorage.setItem('eduspantech_settings', JSON.stringify(settings));

      const token = localStorage.getItem('accessToken');
      if (token) {
        const payload = {
          timezone: settings.timezone || 'Africa/Johannesburg',
          settings: settings,
          // Common fields
          theme: settings.theme,
          fontSize: settings.fontSize,
          language: settings.language,
          dateFormat: settings.dateFormat,
          currency: settings.currency,
          twoFactorAuth: settings.twoFactorAuth,
          shareUsageData: settings.shareUsageData
        };

        if (isTutor) {
          // Tutor payload
          payload.bio = settings.tutor.bio;
          payload.tier = settings.tutor.tier;
          payload.subjects = settings.tutor.subjects;
          payload.shiftId = settings.tutor.shiftId;
          payload.yearsExperience = settings.tutor.yearsExperience;
          payload.education = settings.tutor.education;
          payload.phone = settings.tutor.phone;
          payload.linkedin = settings.tutor.linkedin;
          payload.website = settings.tutor.website;
          payload.availability = settings.tutor.availability;
          payload.paymentInfo = settings.tutor.paymentInfo;
        } else {
          // Student payload
          payload.curriculum = settings.student.defaultCurriculum;
          payload.grade = settings.student.defaultGrade;
          payload.preferredSessionTime = settings.student.preferredSessionTime;
          payload.sessionDuration = settings.student.sessionDuration;
          payload.autoSaveWhiteboard = settings.student.autoSaveWhiteboard;
          payload.breakReminders = settings.student.breakReminders;
        }

        const response = await fetch(`${API_BASE_URL}/auth/update-profile`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(payload)
        });

        if (response.ok) {
          setSuccess('Settings saved successfully! ✅');
        } else {
          const errorData = await response.json();
          setError(errorData.error || 'Failed to save settings to server');
        }
      }
    } catch (err) {
      setError('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  // Reset to defaults
  const handleReset = () => {
    if (window.confirm('Reset all settings to default?')) {
      localStorage.removeItem('eduspantech_settings');
      setTheme('dark');
      window.location.reload();
    }
  };

  // Toggle helper
  const Toggle = ({ enabled, onChange, label }) => (
    <label className="toggle-item">
      <span>{label}</span>
      <div className="toggle-track" onClick={() => onChange(!enabled)}>
        <div className={`toggle-thumb ${enabled ? 'active' : ''}`}></div>
      </div>
    </label>
  );

  if (loading) {
    return (
      <div className="settings-loading">
        <div className="loader">Loading settings...</div>
      </div>
    );
  }

  return (
    <div className="settings-page">
      <div className="settings-container">
        <div className="settings-header">
          <div className="settings-header-left">
            <h1>⚙️ Settings</h1>
            <p>Customize your {isTutor ? 'tutoring' : 'learning'} experience</p>
            {isTutor && (
              <span className="tutor-badge">👨‍🏫 Tutor Account</span>
            )}
          </div>
          <div className="settings-header-actions">
            <button className="settings-reset-btn" onClick={handleReset}>
              Reset to Defaults
            </button>
          </div>
        </div>

        {error && <div className="settings-error">{error}</div>}
        {success && <div className="settings-success">{success}</div>}

        <div className="settings-sections">

          {/* ============================================
              COMMON SETTINGS - Both Student & Tutor
              ============================================ */}

          {/* Appearance */}
          <div className="settings-card">
            <div className="settings-card-header">
              <span className="settings-card-icon">🌙</span>
              <h3>Appearance</h3>
            </div>
            <div className="settings-card-body">
              <div className="settings-group">
                <label>Theme</label>
                <div className="theme-options">
                  <button 
                    className={`theme-option ${settings.theme === 'light' ? 'active' : ''}`}
                    onClick={() => handleSettingChange(null, 'theme', 'light')}
                  >
                    ☀️ Light
                  </button>
                  <button 
                    className={`theme-option ${settings.theme === 'dark' ? 'active' : ''}`}
                    onClick={() => handleSettingChange(null, 'theme', 'dark')}
                  >
                    🌙 Dark
                  </button>
                  <button 
                    className={`theme-option ${settings.theme === 'system' ? 'active' : ''}`}
                    onClick={() => handleSettingChange(null, 'theme', 'system')}
                  >
                    💻 System
                  </button>
                </div>
              </div>

              <div className="settings-group">
                <label>Font Size</label>
                <div className="font-options">
                  <button 
                    className={`font-option ${settings.fontSize === 'small' ? 'active' : ''}`}
                    onClick={() => handleSettingChange(null, 'fontSize', 'small')}
                  >
                    A
                  </button>
                  <button 
                    className={`font-option ${settings.fontSize === 'medium' ? 'active' : ''}`}
                    onClick={() => handleSettingChange(null, 'fontSize', 'medium')}
                  >
                    A
                  </button>
                  <button 
                    className={`font-option ${settings.fontSize === 'large' ? 'active' : ''}`}
                    onClick={() => handleSettingChange(null, 'fontSize', 'large')}
                  >
                    A
                  </button>
                </div>
              </div>

              <Toggle
                enabled={settings.reduceAnimations}
                onChange={(val) => handleSettingChange(null, 'reduceAnimations', val)}
                label="Reduce animations"
              />
            </div>
          </div>

          {/* Language & Region */}
          <div className="settings-card">
            <div className="settings-card-header">
              <span className="settings-card-icon">🌐</span>
              <h3>Language & Region</h3>
            </div>
            <div className="settings-card-body">
              <div className="settings-group">
                <label>App Language</label>
                <select 
                  className="settings-select"
                  value={settings.language}
                  onChange={(e) => handleSettingChange(null, 'language', e.target.value)}
                >
                  <option value="en">English</option>
                  <option value="af">Afrikaans</option>
                  <option value="zu">Zulu</option>
                  <option value="xh">Xhosa</option>
                  <option value="pt">Português</option>
                </select>
              </div>

              <div className="settings-group">
                <label>Date Format</label>
                <select 
                  className="settings-select"
                  value={settings.dateFormat}
                  onChange={(e) => handleSettingChange(null, 'dateFormat', e.target.value)}
                >
                  <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                  <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                  <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                </select>
              </div>

              <div className="settings-group">
                <label>Currency</label>
                <select 
                  className="settings-select"
                  value={settings.currency}
                  onChange={(e) => handleSettingChange(null, 'currency', e.target.value)}
                >
                  <option value="ZAR">ZAR (R)</option>
                  <option value="USD">USD ($)</option>
                  <option value="GBP">GBP (£)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="BRL">BRL (R$)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Notifications - Common */}
          <div className="settings-card">
            <div className="settings-card-header">
              <span className="settings-card-icon">🔔</span>
              <h3>Notifications</h3>
            </div>
            <div className="settings-card-body">
              <Toggle
                enabled={settings.notifications.sessionReminders}
                onChange={(val) => handleSettingChange('notifications', 'sessionReminders', val)}
                label="Session reminders"
              />
              <Toggle
                enabled={settings.notifications.tutorMessages}
                onChange={(val) => handleSettingChange('notifications', 'tutorMessages', val)}
                label="Tutor messages"
              />
              <Toggle
                enabled={settings.notifications.paymentAlerts}
                onChange={(val) => handleSettingChange('notifications', 'paymentAlerts', val)}
                label="Payment alerts"
              />
              <Toggle
                enabled={settings.notifications.marketingEmails}
                onChange={(val) => handleSettingChange('notifications', 'marketingEmails', val)}
                label="Marketing emails"
              />
              <Toggle
                enabled={settings.notifications.weeklyProgress}
                onChange={(val) => handleSettingChange('notifications', 'weeklyProgress', val)}
                label="Weekly progress reports"
              />
              <Toggle
                enabled={settings.notifications.achievements}
                onChange={(val) => handleSettingChange('notifications', 'achievements', val)}
                label="Achievement notifications"
              />
            </div>
          </div>

          {/* Privacy & Security */}
          <div className="settings-card">
            <div className="settings-card-header">
              <span className="settings-card-icon">🔒</span>
              <h3>Privacy & Security</h3>
            </div>
            <div className="settings-card-body">
              <Toggle
                enabled={settings.twoFactorAuth}
                onChange={(val) => handleSettingChange(null, 'twoFactorAuth', val)}
                label="Two-factor authentication"
              />
              <Toggle
                enabled={settings.shareUsageData}
                onChange={(val) => handleSettingChange(null, 'shareUsageData', val)}
                label="Share usage data to improve the platform"
              />
              
              <div className="settings-group security-actions">
                <button className="security-btn export-btn">
                  📥 Download My Data
                </button>
                <button className="security-btn sessions-btn">
                  🖥️ Manage Active Sessions
                </button>
              </div>
            </div>
          </div>

          {/* Accessibility */}
          <div className="settings-card">
            <div className="settings-card-header">
              <span className="settings-card-icon">♿</span>
              <h3>Accessibility</h3>
            </div>
            <div className="settings-card-body">
              <Toggle
                enabled={settings.highContrast}
                onChange={(val) => handleSettingChange(null, 'highContrast', val)}
                label="High contrast mode"
              />
              <Toggle
                enabled={settings.screenReaderOptimized}
                onChange={(val) => handleSettingChange(null, 'screenReaderOptimized', val)}
                label="Screen reader optimized"
              />
              <Toggle
                enabled={settings.textToSpeech}
                onChange={(val) => handleSettingChange(null, 'textToSpeech', val)}
                label="Text-to-speech"
              />
            </div>
          </div>

          {/* ============================================
              STUDENT-ONLY SETTINGS
              ============================================ */}
          {!isTutor && (
            <>
              {/* Learning Preferences */}
              <div className="settings-card student-settings">
                <div className="settings-card-header">
                  <span className="settings-card-icon">📚</span>
                  <h3>Learning Preferences</h3>
                </div>
                <div className="settings-card-body">
                  <div className="settings-group">
                    <label>Default Curriculum</label>
                    <select 
                      className="settings-select"
                      value={settings.student.defaultCurriculum}
                      onChange={(e) => handleStudentSettingChange('defaultCurriculum', e.target.value)}
                    >
                      <option value="">Select curriculum...</option>
                      {curriculumOptions.map(curr => (
                        <option key={curr.id || curr.code} value={curr.id || curr.code}>
                          {curr.name} {curr.country ? `(${curr.country})` : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="settings-group">
                    <label>Default Grade</label>
                    <select 
                      className="settings-select"
                      value={settings.student.defaultGrade}
                      onChange={(e) => handleStudentSettingChange('defaultGrade', e.target.value)}
                    >
                      <option value="">Select grade...</option>
                      <option value="Grade 8">Grade 8</option>
                      <option value="Grade 9">Grade 9</option>
                      <option value="Grade 10">Grade 10</option>
                      <option value="Grade 11">Grade 11</option>
                      <option value="Grade 12">Grade 12</option>
                      <option value="1st Year">1st Year</option>
                      <option value="2nd Year">2nd Year</option>
                    </select>
                  </div>

                  <div className="settings-group">
                    <label>Difficulty Level</label>
                    <div className="difficulty-options">
                      <button 
                        className={`difficulty-option ${settings.student.difficultyLevel === 'beginner' ? 'active' : ''}`}
                        onClick={() => handleStudentSettingChange('difficultyLevel', 'beginner')}
                      >
                        🌱 Beginner
                      </button>
                      <button 
                        className={`difficulty-option ${settings.student.difficultyLevel === 'intermediate' ? 'active' : ''}`}
                        onClick={() => handleStudentSettingChange('difficultyLevel', 'intermediate')}
                      >
                        📈 Intermediate
                      </button>
                      <button 
                        className={`difficulty-option ${settings.student.difficultyLevel === 'advanced' ? 'active' : ''}`}
                        onClick={() => handleStudentSettingChange('difficultyLevel', 'advanced')}
                      >
                        🚀 Advanced
                      </button>
                    </div>
                  </div>

                  <Toggle
                    enabled={settings.student.autoPlayTutorials}
                    onChange={(val) => handleStudentSettingChange('autoPlayTutorials', val)}
                    label="Auto-play whiteboard tutorials"
                  />
                  <Toggle
                    enabled={settings.student.showHints}
                    onChange={(val) => handleStudentSettingChange('showHints', val)}
                    label="Show hints"
                  />

                  <div className="settings-group">
                    <label>Show Solutions</label>
                    <select 
                      className="settings-select"
                      value={settings.student.showSolutions}
                      onChange={(e) => handleStudentSettingChange('showSolutions', e.target.value)}
                    >
                      <option value="immediately">Immediately</option>
                      <option value="after_attempt">After attempt</option>
                      <option value="never">Never</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Session Preferences - Student */}
              <div className="settings-card student-settings">
                <div className="settings-card-header">
                  <span className="settings-card-icon">🕐</span>
                  <h3>Session Preferences</h3>
                </div>
                <div className="settings-card-body">
                  <div className="settings-group">
                    <label>Preferred Session Time</label>
                    <select 
                      className="settings-select"
                      value={settings.student.preferredSessionTime}
                      onChange={(e) => handleStudentSettingChange('preferredSessionTime', e.target.value)}
                    >
                      <option value="morning">Morning (6am - 12pm)</option>
                      <option value="afternoon">Afternoon (12pm - 5pm)</option>
                      <option value="evening">Evening (5pm - 9pm)</option>
                      <option value="night">Night (9pm - 12am)</option>
                    </select>
                  </div>

                  <div className="settings-group">
                    <label>Session Duration</label>
                    <select 
                      className="settings-select"
                      value={settings.student.sessionDuration}
                      onChange={(e) => handleStudentSettingChange('sessionDuration', Number(e.target.value))}
                    >
                      <option value="30">30 minutes</option>
                      <option value="45">45 minutes</option>
                      <option value="60">60 minutes</option>
                      <option value="90">90 minutes</option>
                    </select>
                  </div>

                  <Toggle
                    enabled={settings.student.autoSaveWhiteboard}
                    onChange={(val) => handleStudentSettingChange('autoSaveWhiteboard', val)}
                    label="Auto-save whiteboard"
                  />
                  <Toggle
                    enabled={settings.student.breakReminders}
                    onChange={(val) => handleStudentSettingChange('breakReminders', val)}
                    label="Break reminders"
                  />
                </div>
              </div>
            </>
          )}

          {/* ============================================
              TUTOR-ONLY SETTINGS
              ============================================ */}
          {isTutor && (
            <>
              {/* Tutor Profile */}
              <div className="settings-card tutor-settings">
                <div className="settings-card-header">
                  <span className="settings-card-icon">👨‍🏫</span>
                  <h3>Tutor Profile</h3>
                </div>
                <div className="settings-card-body">
                  <div className="settings-group">
                    <label>Bio / About Me</label>
                    <textarea
                      className="settings-textarea"
                      value={settings.tutor.bio}
                      onChange={(e) => handleTutorSettingChange('bio', e.target.value)}
                      placeholder="Tell students about yourself, your teaching style, and experience..."
                      rows="4"
                    />
                  </div>

                  <div className="settings-group">
                    <label>Tier</label>
                    <select
                      className="settings-select"
                      value={settings.tutor.tier}
                      onChange={(e) => handleTutorSettingChange('tier', e.target.value)}
                    >
                      <option value="">Select tier...</option>
                      {tierOptions.map(option => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  </div>

                  <div className="settings-group">
                    <label>Shift</label>
                    <select
                      className="settings-select"
                      value={settings.tutor.shiftId}
                      onChange={(e) => handleTutorSettingChange('shiftId', e.target.value)}
                    >
                      <option value="">Select a shift...</option>
                      {shiftOptions.map(shift => (
                        <option key={shift.id} value={shift.id}>
                          {shift.name} ({shift.time || `${shift.sast_start} - ${shift.sast_end}`})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="settings-group">
                    <label>Subjects Taught</label>
                    <div className="subjects-grid">
                      {subjectOptions.map(subject => (
                        <label key={subject.id} className="subject-checkbox">
                          <input
                            type="checkbox"
                            checked={(settings.tutor.subjects || []).includes(subject.id)}
                            onChange={() => handleSubjectToggle(subject.id)}
                          />
                          {subject.icon || '📐'} {subject.name}
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="settings-group">
                    <label>Years of Experience</label>
                    <input
                      type="number"
                      className="settings-input"
                      value={settings.tutor.yearsExperience}
                      onChange={(e) => handleTutorSettingChange('yearsExperience', Number(e.target.value))}
                      min="0"
                      max="50"
                    />
                  </div>

                  <div className="settings-group">
                    <label>Education</label>
                    <input
                      type="text"
                      className="settings-input"
                      value={settings.tutor.education}
                      onChange={(e) => handleTutorSettingChange('education', e.target.value)}
                      placeholder="e.g., BSc Mathematics, University of Cape Town"
                    />
                  </div>

                  <div className="settings-group">
                    <label>Phone Number</label>
                    <input
                      type="tel"
                      className="settings-input"
                      value={settings.tutor.phone}
                      onChange={(e) => handleTutorSettingChange('phone', e.target.value)}
                      placeholder="+27 82 123 4567"
                    />
                  </div>

                  <div className="settings-group">
                    <label>LinkedIn Profile</label>
                    <input
                      type="url"
                      className="settings-input"
                      value={settings.tutor.linkedin}
                      onChange={(e) => handleTutorSettingChange('linkedin', e.target.value)}
                      placeholder="https://linkedin.com/in/your-profile"
                    />
                  </div>

                  <div className="settings-group">
                    <label>Website</label>
                    <input
                      type="url"
                      className="settings-input"
                      value={settings.tutor.website}
                      onChange={(e) => handleTutorSettingChange('website', e.target.value)}
                      placeholder="https://yourwebsite.com"
                    />
                  </div>
                </div>
              </div>

              {/* Tutor Availability */}
              <div className="settings-card tutor-settings">
                <div className="settings-card-header">
                  <span className="settings-card-icon">⏰</span>
                  <h3>Availability</h3>
                </div>
                <div className="settings-card-body">
                  <div className="settings-group">
                    <label>Available Days</label>
                    <div className="days-grid">
                      {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map(day => (
                        <label key={day} className="day-checkbox">
                          <input
                            type="checkbox"
                            checked={(settings.tutor.availability.days || []).includes(day)}
                            onChange={() => handleAvailabilityToggle(day)}
                          />
                          {day.charAt(0).toUpperCase() + day.slice(1)}
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="settings-group">
                    <label>Session Duration (minutes)</label>
                    <select
                      className="settings-select"
                      value={settings.tutor.availability.sessionDuration}
                      onChange={(e) => handleTutorSettingChange('availability', 'sessionDuration', Number(e.target.value))}
                    >
                      <option value="30">30 minutes</option>
                      <option value="45">45 minutes</option>
                      <option value="60">60 minutes</option>
                      <option value="90">90 minutes</option>
                      <option value="120">120 minutes</option>
                    </select>
                  </div>

                  <div className="settings-group">
                    <label>Buffer Time Between Sessions (minutes)</label>
                    <select
                      className="settings-select"
                      value={settings.tutor.availability.bufferTime}
                      onChange={(e) => handleTutorSettingChange('availability', 'bufferTime', Number(e.target.value))}
                    >
                      <option value="0">0 minutes</option>
                      <option value="5">5 minutes</option>
                      <option value="10">10 minutes</option>
                      <option value="15">15 minutes</option>
                      <option value="30">30 minutes</option>
                    </select>
                  </div>

                  <div className="settings-group">
                    <label>Rate (R/hour)</label>
                    <input
                      type="number"
                      className="settings-input"
                      value={settings.tutor.availability.rate}
                      onChange={(e) => handleTutorSettingChange('availability', 'rate', Number(e.target.value))}
                      min="0"
                      step="50"
                      placeholder="200"
                    />
                  </div>
                </div>
              </div>

              {/* Tutor Notifications */}
              <div className="settings-card tutor-settings">
                <div className="settings-card-header">
                  <span className="settings-card-icon">🔔</span>
                  <h3>Tutor Notifications</h3>
                </div>
                <div className="settings-card-body">
                  <Toggle
                    enabled={settings.tutor.notifications.newBookings}
                    onChange={(val) => handleTutorSettingChange('notifications', 'newBookings', val)}
                    label="New booking requests"
                  />
                  <Toggle
                    enabled={settings.tutor.notifications.studentMessages}
                    onChange={(val) => handleTutorSettingChange('notifications', 'studentMessages', val)}
                    label="Student messages"
                  />
                  <Toggle
                    enabled={settings.tutor.notifications.ratings}
                    onChange={(val) => handleTutorSettingChange('notifications', 'ratings', val)}
                    label="Ratings received"
                  />
                  <Toggle
                    enabled={settings.tutor.notifications.earnings}
                    onChange={(val) => handleTutorSettingChange('notifications', 'earnings', val)}
                    label="Earnings updates"
                  />
                  <Toggle
                    enabled={settings.tutor.notifications.systemUpdates}
                    onChange={(val) => handleTutorSettingChange('notifications', 'systemUpdates', val)}
                    label="System updates"
                  />
                </div>
              </div>

              {/* Payment Information */}
              <div className="settings-card tutor-settings">
                <div className="settings-card-header">
                  <span className="settings-card-icon">💳</span>
                  <h3>Payment Information</h3>
                </div>
                <div className="settings-card-body">
                  <div className="settings-group">
                    <label>Payout Method</label>
                    <select
                      className="settings-select"
                      value={settings.tutor.paymentInfo.method}
                      onChange={(e) => handleTutorSettingChange('paymentInfo', 'method', e.target.value)}
                    >
                      <option value="bank_transfer">Bank Transfer</option>
                      <option value="paypal">PayPal</option>
                      <option value="stripe">Stripe</option>
                    </select>
                  </div>

                  <div className="settings-group">
                    <label>Bank Name</label>
                    <input
                      type="text"
                      className="settings-input"
                      value={settings.tutor.paymentInfo.bankName}
                      onChange={(e) => handleTutorSettingChange('paymentInfo', 'bankName', e.target.value)}
                      placeholder="e.g., First National Bank"
                    />
                  </div>

                  <div className="settings-group">
                    <label>Account Number</label>
                    <input
                      type="text"
                      className="settings-input"
                      value={settings.tutor.paymentInfo.accountNumber}
                      onChange={(e) => handleTutorSettingChange('paymentInfo', 'accountNumber', e.target.value)}
                      placeholder="123456789"
                    />
                  </div>

                  <div className="settings-group">
                    <label>Account Holder Name</label>
                    <input
                      type="text"
                      className="settings-input"
                      value={settings.tutor.paymentInfo.accountHolder}
                      onChange={(e) => handleTutorSettingChange('paymentInfo', 'accountHolder', e.target.value)}
                      placeholder="Full name on account"
                    />
                  </div>

                  <div className="settings-group">
                    <label>Tax ID / ID Number</label>
                    <input
                      type="text"
                      className="settings-input"
                      value={settings.tutor.paymentInfo.taxId}
                      onChange={(e) => handleTutorSettingChange('paymentInfo', 'taxId', e.target.value)}
                      placeholder="ID number or tax reference"
                    />
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Save Button */}
          <div className="settings-actions">
            <button 
              className="settings-save-btn" 
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? (
                <>
                  <span className="spinner"></span>
                  Saving...
                </>
              ) : (
                '💾 Save All Settings'
              )}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Settings;