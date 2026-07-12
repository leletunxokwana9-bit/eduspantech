// src/pages/Settings.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';
import './Settings.css';

const Settings = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  // Settings state
  const [settings, setSettings] = useState({
    // Appearance
    theme: 'dark',
    fontSize: 'medium',
    reduceAnimations: false,
    
    // Language & Region
    language: 'en',
    dateFormat: 'DD/MM/YYYY',
    currency: 'ZAR',
    
    // Notifications
    notifications: {
      sessionReminders: true,
      tutorMessages: true,
      paymentAlerts: true,
      marketingEmails: false,
      weeklyProgress: true,
      achievements: true
    },
    
    // Learning Preferences
    defaultCurriculum: 'ZA',
    defaultGrade: '',
    autoPlayTutorials: true,
    showHints: true,
    difficultyLevel: 'intermediate',
    showSolutions: 'after_attempt',
    
    // Session Preferences
    preferredSessionTime: 'evening',
    sessionDuration: 60,
    autoSaveWhiteboard: true,
    breakReminders: true,
    
    // Privacy & Security
    twoFactorAuth: false,
    shareUsageData: true,
    
    // Accessibility
    highContrast: false,
    screenReaderOptimized: false,
    textToSpeech: false
  });

  const API_URL = 'https://eduspantech-backend.onrender.com';

  // Auto-dismiss success message
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(''), 3000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  // Fetch user data and saved settings
  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('accessToken');
        if (!token) {
          navigate('/login');
          return;
        }

        const userData = await authService.getCurrentUserWithSubscription();
        if (userData) {
          // Load saved settings from localStorage
          const savedSettings = localStorage.getItem('eduspantech_settings');
          if (savedSettings) {
            try {
              const parsed = JSON.parse(savedSettings);
              setSettings(prev => ({ ...prev, ...parsed }));
            } catch (e) {}
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
    fetchData();
  }, [navigate]);

  // Apply theme on change
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', settings.theme);
  }, [settings.theme]);

  // Handle setting changes
  const handleSettingChange = (category, key, value) => {
    setSettings(prev => {
      if (category) {
        return {
          ...prev,
          [category]: {
            ...prev[category],
            [key]: value
          }
        };
      }
      return {
        ...prev,
        [key]: value
      };
    });
  };

  // Save all settings
  const handleSave = async () => {
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      // Save to localStorage
      localStorage.setItem('eduspantech_settings', JSON.stringify(settings));

      // Save to backend if needed
      const token = localStorage.getItem('accessToken');
      if (token) {
        const response = await fetch(`${API_URL}/api/v1/auth/update-profile`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            timezone: settings.timezone || 'Africa/Johannesburg',
            settings: settings
          })
        });

        if (response.ok) {
          setSuccess('Settings saved successfully! ✅');
        } else {
          setError('Failed to save settings to server');
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
        {/* Header */}
        <div className="settings-header">
          <div className="settings-header-left">
            <h1>⚙️ Settings</h1>
            <p>Customize your learning experience</p>
          </div>
          <div className="settings-header-actions">
            <button className="settings-reset-btn" onClick={handleReset}>
              Reset to Defaults
            </button>
          </div>
        </div>

        {error && <div className="settings-error">{error}</div>}
        {success && <div className="settings-success">{success}</div>}

        {/* Settings Sections */}
        <div className="settings-sections">

          {/* ===== APPEARANCE ===== */}
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

          {/* ===== LANGUAGE & REGION ===== */}
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

          {/* ===== NOTIFICATIONS ===== */}
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

          {/* ===== LEARNING PREFERENCES ===== */}
          <div className="settings-card">
            <div className="settings-card-header">
              <span className="settings-card-icon">📚</span>
              <h3>Learning Preferences</h3>
            </div>
            <div className="settings-card-body">
              <div className="settings-group">
                <label>Default Curriculum</label>
                <select 
                  className="settings-select"
                  value={settings.defaultCurriculum}
                  onChange={(e) => handleSettingChange(null, 'defaultCurriculum', e.target.value)}
                >
                  <option value="ZA">South Africa (CAPS/IEB)</option>
                  <option value="US">United States</option>
                  <option value="GB">United Kingdom</option>
                  <option value="AU">Australia</option>
                  <option value="SG">Singapore</option>
                  <option value="JP">Japan</option>
                </select>
              </div>

              <div className="settings-group">
                <label>Default Grade</label>
                <select 
                  className="settings-select"
                  value={settings.defaultGrade}
                  onChange={(e) => handleSettingChange(null, 'defaultGrade', e.target.value)}
                >
                  <option value="">Select grade</option>
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
                    className={`difficulty-option ${settings.difficultyLevel === 'beginner' ? 'active' : ''}`}
                    onClick={() => handleSettingChange(null, 'difficultyLevel', 'beginner')}
                  >
                    🌱 Beginner
                  </button>
                  <button 
                    className={`difficulty-option ${settings.difficultyLevel === 'intermediate' ? 'active' : ''}`}
                    onClick={() => handleSettingChange(null, 'difficultyLevel', 'intermediate')}
                  >
                    📈 Intermediate
                  </button>
                  <button 
                    className={`difficulty-option ${settings.difficultyLevel === 'advanced' ? 'active' : ''}`}
                    onClick={() => handleSettingChange(null, 'difficultyLevel', 'advanced')}
                  >
                    🚀 Advanced
                  </button>
                </div>
              </div>

              <Toggle
                enabled={settings.autoPlayTutorials}
                onChange={(val) => handleSettingChange(null, 'autoPlayTutorials', val)}
                label="Auto-play whiteboard tutorials"
              />
              <Toggle
                enabled={settings.showHints}
                onChange={(val) => handleSettingChange(null, 'showHints', val)}
                label="Show hints"
              />

              <div className="settings-group">
                <label>Show Solutions</label>
                <select 
                  className="settings-select"
                  value={settings.showSolutions}
                  onChange={(e) => handleSettingChange(null, 'showSolutions', e.target.value)}
                >
                  <option value="immediately">Immediately</option>
                  <option value="after_attempt">After attempt</option>
                  <option value="never">Never</option>
                </select>
              </div>
            </div>
          </div>

          {/* ===== SESSION PREFERENCES ===== */}
          <div className="settings-card">
            <div className="settings-card-header">
              <span className="settings-card-icon">🕐</span>
              <h3>Session Preferences</h3>
            </div>
            <div className="settings-card-body">
              <div className="settings-group">
                <label>Preferred Session Time</label>
                <select 
                  className="settings-select"
                  value={settings.preferredSessionTime}
                  onChange={(e) => handleSettingChange(null, 'preferredSessionTime', e.target.value)}
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
                  value={settings.sessionDuration}
                  onChange={(e) => handleSettingChange(null, 'sessionDuration', Number(e.target.value))}
                >
                  <option value="30">30 minutes</option>
                  <option value="45">45 minutes</option>
                  <option value="60">60 minutes</option>
                  <option value="90">90 minutes</option>
                </select>
              </div>

              <Toggle
                enabled={settings.autoSaveWhiteboard}
                onChange={(val) => handleSettingChange(null, 'autoSaveWhiteboard', val)}
                label="Auto-save whiteboard"
              />
              <Toggle
                enabled={settings.breakReminders}
                onChange={(val) => handleSettingChange(null, 'breakReminders', val)}
                label="Break reminders"
              />
            </div>
          </div>

          {/* ===== PRIVACY & SECURITY ===== */}
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

          {/* ===== ACCESSIBILITY ===== */}
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