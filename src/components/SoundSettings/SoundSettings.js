import React from 'react';
import { useSound } from '../../context/SoundContext';
import './SoundSettings.css';

const SoundSettings = ({ onClose }) => {
  const { enabled, volume, toggleSound, setSoundVolume, playClick } = useSound();

  const handleToggle = () => {
    toggleSound();
    playClick();
  };

  const handleVolumeChange = (e) => {
    const newVolume = parseFloat(e.target.value);
    setSoundVolume(newVolume);
    // Test sound at new volume
    setTimeout(() => {
      const testSound = new Audio('/sounds/click.mp3');
      testSound.volume = newVolume;
      testSound.play().catch(() => {});
    }, 100);
  };

  return (
    <div className="sound-settings-overlay" onClick={onClose}>
      <div className="sound-settings-panel" onClick={(e) => e.stopPropagation()}>
        <div className="sound-settings-header">
          <h3>🔊 Sound Settings</h3>
          <button className="settings-close" onClick={onClose}>✕</button>
        </div>

        <div className="sound-settings-body">
          {/* Sound Toggle */}
          <div className="setting-item">
            <div className="setting-info">
              <span className="setting-icon">{enabled ? '🔊' : '🔇'}</span>
              <div>
                <div className="setting-label">Sound Effects</div>
                <div className="setting-description">
                  {enabled ? 'Sound effects are enabled' : 'Sound effects are muted'}
                </div>
              </div>
            </div>
            <button 
              className={`toggle-switch ${enabled ? 'on' : 'off'}`}
              onClick={handleToggle}
            >
              <span className="toggle-slider"></span>
            </button>
          </div>

          {/* Volume Slider */}
          <div className="setting-item">
            <div className="setting-info">
              <span className="setting-icon">🔊</span>
              <div>
                <div className="setting-label">Volume</div>
                <div className="setting-description">
                  {Math.round(volume * 100)}%
                </div>
              </div>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={volume}
              onChange={handleVolumeChange}
              className="volume-slider"
              disabled={!enabled}
            />
          </div>

          {/* Sound Preview */}
          <div className="setting-item preview-section">
            <div className="setting-info">
              <span className="setting-icon">🎵</span>
              <div>
                <div className="setting-label">Test Sound</div>
                <div className="setting-description">Click to preview sound effects</div>
              </div>
            </div>
            <div className="preview-buttons">
              <button 
                className="preview-btn" 
                onClick={() => {
                  playClick();
                  setTimeout(() => {
                    const testSound = new Audio('/sounds/notification.mp3');
                    testSound.volume = volume;
                    testSound.play().catch(() => {});
                  }, 200);
                }}
                disabled={!enabled}
              >
                🔊 Test
              </button>
            </div>
          </div>
        </div>

        <div className="sound-settings-footer">
          <button className="settings-done" onClick={onClose}>Done</button>
        </div>
      </div>
    </div>
  );
};

export default SoundSettings;