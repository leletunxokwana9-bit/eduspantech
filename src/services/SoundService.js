// src/services/SoundService.js

class SoundService {
  constructor() {
    this.sounds = {};
    this.enabled = true;
    this.volume = 0.5;
    this.isInitialized = false;
    this.loadSettings();
    this.loadSounds();
  }

  loadSounds() {
    // ===== UI NAVIGATION SOUNDS =====
    this.sounds.click = this.createSound('/sounds/click.mp3', 0.25);
    this.sounds.tabSwitch = this.createSound('/sounds/tab-switch.mp3', 0.2);
    this.sounds.pageTransition = this.createSound('/sounds/page-transition.mp3', 0.2);
    this.sounds.dropdown = this.createSound('/sounds/dropdown.mp3', 0.2);
    this.sounds.hover = this.createSound('/sounds/hover.mp3', 0.1);
    this.sounds.notification = this.createSound('/sounds/notification.mp3', 0.35);

    // ===== SESSION SOUNDS =====
    this.sounds.sessionStart = this.createSound('/sounds/session-start.mp3', 0.4);
    this.sounds.sessionEnd = this.createSound('/sounds/session-end.mp3', 0.3);
    this.sounds.shiftWarning = this.createSound('/sounds/shift-warning.mp3', 0.5);
    this.sounds.sessionExtended = this.createSound('/sounds/session-extended.mp3', 0.4);
    this.sounds.joinSession = this.createSound('/sounds/join-session.mp3', 0.35);
    this.sounds.leaveSession = this.createSound('/sounds/leave-session.mp3', 0.3);
    this.sounds.tutorConnected = this.createSound('/sounds/tutor-connected.mp3', 0.4);
    this.sounds.tutorDisconnected = this.createSound('/sounds/tutor-disconnected.mp3', 0.3);

    // ===== CHAT SOUNDS =====
    this.sounds.messageReceived = this.createSound('/sounds/message-received.mp3', 0.3);
    this.sounds.messageSent = this.createSound('/sounds/message-sent.mp3', 0.2);
    this.sounds.typing = this.createSound('/sounds/typing.mp3', 0.1);
    this.sounds.raiseHand = this.createSound('/sounds/raise-hand.mp3', 0.4);
    this.sounds.handAcknowledged = this.createSound('/sounds/hand-acknowledged.mp3', 0.35);
    this.sounds.newParticipant = this.createSound('/sounds/new-participant.mp3', 0.3);
    this.sounds.participantLeft = this.createSound('/sounds/participant-left.mp3', 0.25);

    // ===== ENROLLMENT & PAYMENT SOUNDS =====
    // Enrollment
    this.sounds.enrollStart = this.createSound('/sounds/enroll-start.mp3', 0.3);
    this.sounds.enrollProgress = this.createSound('/sounds/enroll-progress.mp3', 0.2);
    this.sounds.enrollSuccess = this.createSound('/sounds/enroll-success.mp3', 0.5);
    this.sounds.enrollFail = this.createSound('/sounds/enroll-fail.mp3', 0.4);
    this.sounds.alreadyEnrolled = this.createSound('/sounds/already-enrolled.mp3', 0.35);
    this.sounds.enrollComplete = this.createSound('/sounds/enroll-complete.mp3', 0.5);
    
    // Subscription
    this.sounds.subscriptionCreated = this.createSound('/sounds/subscription-created.mp3', 0.5);
    this.sounds.subscriptionActivated = this.createSound('/sounds/subscription-activated.mp3', 0.5);
    this.sounds.subscriptionCancelled = this.createSound('/sounds/subscription-cancelled.mp3', 0.4);
    this.sounds.subscriptionExpired = this.createSound('/sounds/subscription-expired.mp3', 0.35);
    this.sounds.subscriptionRenewed = this.createSound('/sounds/subscription-renewed.mp3', 0.45);
    this.sounds.tierUpgraded = this.createSound('/sounds/tier-upgraded.mp3', 0.5);
    
    // Payment
    this.sounds.paymentProcessing = this.createSound('/sounds/payment-processing.mp3', 0.3);
    this.sounds.paymentSuccess = this.createSound('/sounds/payment-success.mp3', 0.6);
    this.sounds.paymentFail = this.createSound('/sounds/payment-fail.mp3', 0.4);
    this.sounds.refundInitiated = this.createSound('/sounds/refund-initiated.mp3', 0.35);
    this.sounds.refundApproved = this.createSound('/sounds/refund-approved.mp3', 0.4);
    this.sounds.refundDenied = this.createSound('/sounds/refund-denied.mp3', 0.35);

    // ===== WHITEBOARD SOUNDS =====
    this.sounds.penStroke = this.createSound('/sounds/pen-stroke.mp3', 0.08);
    this.sounds.eraserStroke = this.createSound('/sounds/eraser-stroke.mp3', 0.06);
    this.sounds.undo = this.createSound('/sounds/undo.mp3', 0.2);
    this.sounds.redo = this.createSound('/sounds/redo.mp3', 0.2);
    this.sounds.clearBoard = this.createSound('/sounds/clear-board.mp3', 0.25);

    // ===== SUCCESS / ERROR SOUNDS =====
    this.sounds.success = this.createSound('/sounds/success.mp3', 0.5);
    this.sounds.error = this.createSound('/sounds/error.mp3', 0.4);
    this.sounds.warning = this.createSound('/sounds/warning.mp3', 0.4);
    this.sounds.info = this.createSound('/sounds/info.mp3', 0.3);

    // ===== GAMIFICATION SOUNDS =====
    this.sounds.badgeEarned = this.createSound('/sounds/badge-earned.mp3', 0.5);
    this.sounds.levelUp = this.createSound('/sounds/level-up.mp3', 0.6);
    this.sounds.achievement = this.createSound('/sounds/achievement.mp3', 0.5);
    this.sounds.quizCorrect = this.createSound('/sounds/quiz-correct.mp3', 0.3);
    this.sounds.quizIncorrect = this.createSound('/sounds/quiz-incorrect.mp3', 0.25);
    this.sounds.taskComplete = this.createSound('/sounds/task-complete.mp3', 0.4);

    // ===== TUTOR SPECIFIC SOUNDS =====
    this.sounds.tutorAvailable = this.createSound('/sounds/tutor-available.mp3', 0.35);
    this.sounds.tutorBusy = this.createSound('/sounds/tutor-busy.mp3', 0.3);
    this.sounds.shiftChange = this.createSound('/sounds/shift-change.mp3', 0.4);

    // ===== COUNTDOWN / TIMER SOUNDS =====
    this.sounds.countdown = this.createSound('/sounds/countdown.mp3', 0.3);
    this.sounds.timeWarning = this.createSound('/sounds/time-warning.mp3', 0.4);
    this.sounds.timeUp = this.createSound('/sounds/time-up.mp3', 0.5);

    this.isInitialized = true;
  }

  createSound(src, volume = 0.3) {
    try {
      const audio = new Audio(src);
      audio.volume = volume;
      audio.preload = 'auto';
      return audio;
    } catch (error) {
      console.warn('Failed to load sound:', src);
      return null;
    }
  }

  play(soundName) {
    if (!this.enabled) return;
    const sound = this.sounds[soundName];
    if (sound) {
      try {
        sound.currentTime = 0;
        sound.play().catch(() => {});
      } catch (error) {
        // Silently fail
      }
    }
  }

  // ===== UI NAVIGATION =====
  playClick() { this.play('click'); }
  playTabSwitch() { this.play('tabSwitch'); }
  playPageTransition() { this.play('pageTransition'); }
  playDropdown() { this.play('dropdown'); }
  playHover() { this.play('hover'); }
  playNotification() { this.play('notification'); }

  // ===== SESSION =====
  playSessionStart() { this.play('sessionStart'); }
  playSessionEnd() { this.play('sessionEnd'); }
  playShiftWarning() { this.play('shiftWarning'); }
  playSessionExtended() { this.play('sessionExtended'); }
  playJoinSession() { this.play('joinSession'); }
  playLeaveSession() { this.play('leaveSession'); }
  playTutorConnected() { this.play('tutorConnected'); }
  playTutorDisconnected() { this.play('tutorDisconnected'); }

  // ===== CHAT =====
  playMessageReceived() { this.play('messageReceived'); }
  playMessageSent() { this.play('messageSent'); }
  playTyping() { this.play('typing'); }
  playRaiseHand() { this.play('raiseHand'); }
  playHandAcknowledged() { this.play('handAcknowledged'); }
  playNewParticipant() { this.play('newParticipant'); }
  playParticipantLeft() { this.play('participantLeft'); }

  // ===== ENROLLMENT =====
  playEnrollStart() { this.play('enrollStart'); }
  playEnrollProgress() { this.play('enrollProgress'); }
  playEnrollSuccess() { this.play('enrollSuccess'); }
  playEnrollFail() { this.play('enrollFail'); }
  playAlreadyEnrolled() { this.play('alreadyEnrolled'); }
  playEnrollComplete() { this.play('enrollComplete'); }

  // ===== SUBSCRIPTION =====
  playSubscriptionCreated() { this.play('subscriptionCreated'); }
  playSubscriptionActivated() { this.play('subscriptionActivated'); }
  playSubscriptionCancelled() { this.play('subscriptionCancelled'); }
  playSubscriptionExpired() { this.play('subscriptionExpired'); }
  playSubscriptionRenewed() { this.play('subscriptionRenewed'); }
  playTierUpgraded() { this.play('tierUpgraded'); }

  // ===== PAYMENT =====
  playPaymentProcessing() { this.play('paymentProcessing'); }
  playPaymentSuccess() { this.play('paymentSuccess'); }
  playPaymentFail() { this.play('paymentFail'); }
  playRefundInitiated() { this.play('refundInitiated'); }
  playRefundApproved() { this.play('refundApproved'); }
  playRefundDenied() { this.play('refundDenied'); }

  // ===== WHITEBOARD =====
  playPenStroke() { this.play('penStroke'); }
  playEraserStroke() { this.play('eraserStroke'); }
  playUndo() { this.play('undo'); }
  playRedo() { this.play('redo'); }
  playClearBoard() { this.play('clearBoard'); }

  // ===== SUCCESS / ERROR =====
  playSuccess() { this.play('success'); }
  playError() { this.play('error'); }
  playWarning() { this.play('warning'); }
  playInfo() { this.play('info'); }

  // ===== GAMIFICATION =====
  playBadgeEarned() { this.play('badgeEarned'); }
  playLevelUp() { this.play('levelUp'); }
  playAchievement() { this.play('achievement'); }
  playQuizCorrect() { this.play('quizCorrect'); }
  playQuizIncorrect() { this.play('quizIncorrect'); }
  playTaskComplete() { this.play('taskComplete'); }

  // ===== TUTOR =====
  playTutorAvailable() { this.play('tutorAvailable'); }
  playTutorBusy() { this.play('tutorBusy'); }
  playShiftChange() { this.play('shiftChange'); }

  // ===== TIMER =====
  playCountdown() { this.play('countdown'); }
  playTimeWarning() { this.play('timeWarning'); }
  playTimeUp() { this.play('timeUp'); }

  // ===== SETTINGS =====
  setEnabled(enabled) {
    this.enabled = enabled;
    localStorage.setItem('soundEnabled', JSON.stringify(enabled));
  }

  setVolume(volume) {
    this.volume = Math.max(0, Math.min(1, volume));
    localStorage.setItem('soundVolume', JSON.stringify(this.volume));
    Object.values(this.sounds).forEach(sound => {
      if (sound) sound.volume = this.volume;
    });
  }

  toggleEnabled() {
    this.setEnabled(!this.enabled);
    return this.enabled;
  }

  loadSettings() {
    const enabled = localStorage.getItem('soundEnabled');
    if (enabled !== null) {
      this.enabled = JSON.parse(enabled);
    }
    const volume = localStorage.getItem('soundVolume');
    if (volume !== null) {
      this.setVolume(JSON.parse(volume));
    }
  }

  getStatus() {
    return {
      enabled: this.enabled,
      volume: this.volume,
      soundsLoaded: this.isInitialized
    };
  }
}

export default new SoundService();