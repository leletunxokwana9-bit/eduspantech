import React, { createContext, useContext, useState, useEffect } from 'react';
import SoundService from '../services/SoundService';

const SoundContext = createContext();

export const SoundProvider = ({ children }) => {
  const [enabled, setEnabled] = useState(() => {
    try {
      return SoundService.enabled;
    } catch {
      return true;
    }
  });
  const [volume, setVolume] = useState(() => {
    try {
      return SoundService.volume;
    } catch {
      return 0.5;
    }
  });

  useEffect(() => {
    const handleSettingsChange = () => {
      try {
        setEnabled(SoundService.enabled);
        setVolume(SoundService.volume);
      } catch {
        // Silently fail
      }
    };
    
    window.addEventListener('soundSettingsChanged', handleSettingsChange);
    return () => {
      window.removeEventListener('soundSettingsChanged', handleSettingsChange);
    };
  }, []);

  const toggleSound = () => {
    try {
      const newState = SoundService.toggleEnabled();
      setEnabled(newState);
      window.dispatchEvent(new Event('soundSettingsChanged'));
    } catch {
      // Silently fail
    }
  };

  const setSoundVolume = (newVolume) => {
    try {
      SoundService.setVolume(newVolume);
      setVolume(newVolume);
      window.dispatchEvent(new Event('soundSettingsChanged'));
    } catch {
      // Silently fail
    }
  };

  // Safe play wrapper
  const play = (soundName) => {
    try {
      SoundService.play(soundName);
    } catch {
      // Silently fail
    }
  };

  const playClick = () => { try { SoundService.playClick(); } catch {} };
  const playTabSwitch = () => { try { SoundService.playTabSwitch(); } catch {} };
  const playPageTransition = () => { try { SoundService.playPageTransition(); } catch {} };
  const playDropdown = () => { try { SoundService.playDropdown(); } catch {} };
  const playHover = () => { try { SoundService.playHover(); } catch {} };
  const playNotification = () => { try { SoundService.playNotification(); } catch {} };
  const playSessionStart = () => { try { SoundService.playSessionStart(); } catch {} };
  const playSessionEnd = () => { try { SoundService.playSessionEnd(); } catch {} };
  const playShiftWarning = () => { try { SoundService.playShiftWarning(); } catch {} };
  const playSessionExtended = () => { try { SoundService.playSessionExtended(); } catch {} };
  const playJoinSession = () => { try { SoundService.playJoinSession(); } catch {} };
  const playLeaveSession = () => { try { SoundService.playLeaveSession(); } catch {} };
  const playTutorConnected = () => { try { SoundService.playTutorConnected(); } catch {} };
  const playTutorDisconnected = () => { try { SoundService.playTutorDisconnected(); } catch {} };
  const playMessageReceived = () => { try { SoundService.playMessageReceived(); } catch {} };
  const playMessageSent = () => { try { SoundService.playMessageSent(); } catch {} };
  const playTyping = () => { try { SoundService.playTyping(); } catch {} };
  const playRaiseHand = () => { try { SoundService.playRaiseHand(); } catch {} };
  const playHandAcknowledged = () => { try { SoundService.playHandAcknowledged(); } catch {} };
  const playNewParticipant = () => { try { SoundService.playNewParticipant(); } catch {} };
  const playParticipantLeft = () => { try { SoundService.playParticipantLeft(); } catch {} };
  const playEnrollSuccess = () => { try { SoundService.playEnrollSuccess(); } catch {} };
  const playEnrollFail = () => { try { SoundService.playEnrollFail(); } catch {} };
  const playAlreadyEnrolled = () => { try { SoundService.playAlreadyEnrolled(); } catch {} };
  const playEnrollComplete = () => { try { SoundService.playEnrollComplete(); } catch {} };
  const playPaymentSuccess = () => { try { SoundService.playPaymentSuccess(); } catch {} };
  const playPaymentFail = () => { try { SoundService.playPaymentFail(); } catch {} };
  const playSubscriptionCreated = () => { try { SoundService.playSubscriptionCreated(); } catch {} };
  const playSubscriptionCancelled = () => { try { SoundService.playSubscriptionCancelled(); } catch {} };
  const playRefundInitiated = () => { try { SoundService.playRefundInitiated(); } catch {} };
  const playPenStroke = () => { try { SoundService.playPenStroke(); } catch {} };
  const playEraserStroke = () => { try { SoundService.playEraserStroke(); } catch {} };
  const playUndo = () => { try { SoundService.playUndo(); } catch {} };
  const playRedo = () => { try { SoundService.playRedo(); } catch {} };
  const playClearBoard = () => { try { SoundService.playClearBoard(); } catch {} };
  const playSuccess = () => { try { SoundService.playSuccess(); } catch {} };
  const playError = () => { try { SoundService.playError(); } catch {} };
  const playWarning = () => { try { SoundService.playWarning(); } catch {} };
  const playInfo = () => { try { SoundService.playInfo(); } catch {} };
  const playBadgeEarned = () => { try { SoundService.playBadgeEarned(); } catch {} };
  const playLevelUp = () => { try { SoundService.playLevelUp(); } catch {} };
  const playAchievement = () => { try { SoundService.playAchievement(); } catch {} };
  const playQuizCorrect = () => { try { SoundService.playQuizCorrect(); } catch {} };
  const playQuizIncorrect = () => { try { SoundService.playQuizIncorrect(); } catch {} };
  const playTaskComplete = () => { try { SoundService.playTaskComplete(); } catch {} };
  const playTutorAvailable = () => { try { SoundService.playTutorAvailable(); } catch {} };
  const playTutorBusy = () => { try { SoundService.playTutorBusy(); } catch {} };
  const playShiftChange = () => { try { SoundService.playShiftChange(); } catch {} };
  const playCountdown = () => { try { SoundService.playCountdown(); } catch {} };
  const playTimeWarning = () => { try { SoundService.playTimeWarning(); } catch {} };
  const playTimeUp = () => { try { SoundService.playTimeUp(); } catch {} };

  const value = {
    enabled,
    volume,
    toggleSound,
    setSoundVolume,
    play,
    playClick,
    playTabSwitch,
    playPageTransition,
    playDropdown,
    playHover,
    playNotification,
    playSessionStart,
    playSessionEnd,
    playShiftWarning,
    playSessionExtended,
    playJoinSession,
    playLeaveSession,
    playTutorConnected,
    playTutorDisconnected,
    playMessageReceived,
    playMessageSent,
    playTyping,
    playRaiseHand,
    playHandAcknowledged,
    playNewParticipant,
    playParticipantLeft,
    playEnrollSuccess,
    playEnrollFail,
    playAlreadyEnrolled,
    playEnrollComplete,
    playPaymentSuccess,
    playPaymentFail,
    playSubscriptionCreated,
    playSubscriptionCancelled,
    playRefundInitiated,
    playPenStroke,
    playEraserStroke,
    playUndo,
    playRedo,
    playClearBoard,
    playSuccess,
    playError,
    playWarning,
    playInfo,
    playBadgeEarned,
    playLevelUp,
    playAchievement,
    playQuizCorrect,
    playQuizIncorrect,
    playTaskComplete,
    playTutorAvailable,
    playTutorBusy,
    playShiftChange,
    playCountdown,
    playTimeWarning,
    playTimeUp
  };

  return (
    <SoundContext.Provider value={value}>
      {children}
    </SoundContext.Provider>
  );
};

export const useSound = () => {
  const context = useContext(SoundContext);
  if (!context) {
    // Return a dummy object instead of throwing error
    console.warn('useSound must be used within a SoundProvider - using dummy fallback');
    return {
      enabled: true,
      volume: 0.5,
      toggleSound: () => {},
      setSoundVolume: () => {},
      play: () => {},
      playClick: () => {},
      playTabSwitch: () => {},
      playPageTransition: () => {},
      playDropdown: () => {},
      playHover: () => {},
      playNotification: () => {},
      playSessionStart: () => {},
      playSessionEnd: () => {},
      playShiftWarning: () => {},
      playSessionExtended: () => {},
      playJoinSession: () => {},
      playLeaveSession: () => {},
      playTutorConnected: () => {},
      playTutorDisconnected: () => {},
      playMessageReceived: () => {},
      playMessageSent: () => {},
      playTyping: () => {},
      playRaiseHand: () => {},
      playHandAcknowledged: () => {},
      playNewParticipant: () => {},
      playParticipantLeft: () => {},
      playEnrollSuccess: () => {},
      playEnrollFail: () => {},
      playAlreadyEnrolled: () => {},
      playEnrollComplete: () => {},
      playPaymentSuccess: () => {},
      playPaymentFail: () => {},
      playSubscriptionCreated: () => {},
      playSubscriptionCancelled: () => {},
      playRefundInitiated: () => {},
      playPenStroke: () => {},
      playEraserStroke: () => {},
      playUndo: () => {},
      playRedo: () => {},
      playClearBoard: () => {},
      playSuccess: () => {},
      playError: () => {},
      playWarning: () => {},
      playInfo: () => {},
      playBadgeEarned: () => {},
      playLevelUp: () => {},
      playAchievement: () => {},
      playQuizCorrect: () => {},
      playQuizIncorrect: () => {},
      playTaskComplete: () => {},
      playTutorAvailable: () => {},
      playTutorBusy: () => {},
      playShiftChange: () => {},
      playCountdown: () => {},
      playTimeWarning: () => {},
      playTimeUp: () => {}
    };
  }
  return context;
};

export default SoundContext;