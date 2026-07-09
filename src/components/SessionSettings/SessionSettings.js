import React, { useState } from 'react';
import { useSessionSettings } from '../../context/SessionSettingsContext';
import './SessionSettings.css';

const SessionSettings = ({ onClose }) => {
  const { theme, toggleTheme, isDark } = useSessionSettings();
  const [settings, setSettings] = useState({
    theme: theme,
    showCaptions: false,
    mirrorVideo: false,
    lowBandwidth: false
  });

  const handleToggle = (setting) => {
    if (setting === 'theme') {
      toggleTheme();
      setSettings(prev => ({ ...prev, theme: theme === 'dark' ? 'light' : 'dark' }));
    } else {
      setSettings(prev => ({ ...prev, [setting]: !prev[setting] }));
    }
  };

  return (
    <div className="session-settings-overlay" onClick={onClose}>
      <div className="session-settings-panel" onClick={(e) => e.stopPropagation()}>
        <div className="session-settings-header">
          <h3>⚙️ Settings</h3>
          <button className="settings-close" onClick={onClose}>✕</button>
        </div>

        <div className="session-settings-body">
          {/* Theme Toggle */}
          <div className="setting-item">
            <div className="setting-info">
              <span className="setting-icon">{isDark ? '🌙' : '☀️'}</span>
              <div>
                <div className="setting-label">Theme</div>
                <div className="setting-description">
                  {isDark ? 'Dark mode (reduces eye strain)' : 'Light mode (easier in bright rooms)'}
                </div>
              </div>
            </div>
            <button 
              className={`toggle-switch ${isDark ? 'dark' : 'light'}`}
              onClick={() => handleToggle('theme')}
            >
              <span className="toggle-slider"></span>
            </button>
          </div>

          {/* Show Captions */}
          <div className="setting-item">
            <div className="setting-info">
              <span className="setting-icon">📝</span>
              <div>
                <div className="setting-label">Show Captions</div>
                <div className="setting-description">Display live captions during session</div>
              </div>
            </div>
            <button 
              className={`toggle-switch ${settings.showCaptions ? 'on' : 'off'}`}
              onClick={() => handleToggle('showCaptions')}
            >
              <span className="toggle-slider"></span>
            </button>
          </div>

          {/* Mirror Video */}
          <div className="setting-item">
            <div className="setting-info">
              <span className="setting-icon">🪞</span>
              <div>
                <div className="setting-label">Mirror Video</div>
                <div className="setting-description">Mirror your own video preview</div>
              </div>
            </div>
            <button 
              className={`toggle-switch ${settings.mirrorVideo ? 'on' : 'off'}`}
              onClick={() => handleToggle('mirrorVideo')}
            >
              <span className="toggle-slider"></span>
            </button>
          </div>

          {/* Low Bandwidth Mode */}
          <div className="setting-item">
            <div className="setting-info">
              <span className="setting-icon">📶</span>
              <div>
                <div className="setting-label">Low Bandwidth Mode</div>
                <div className="setting-description">Reduce data usage for slow connections</div>
              </div>
            </div>
            <button 
              className={`toggle-switch ${settings.lowBandwidth ? 'on' : 'off'}`}
              onClick={() => handleToggle('lowBandwidth')}
            >
              <span className="toggle-slider"></span>
            </button>
          </div>
        </div>

        <div className="session-settings-footer">
          <span className="settings-version">v1.0</span>
          <button className="settings-done" onClick={onClose}>Done</button>
        </div>
      </div>
    </div>
  );
};

// THIS IS THE IMPORTANT LINE - MUST BE HERE
export default SessionSettings;