import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './TutorSession.css';

// ===== SOUND GENERATOR =====
const SoundGenerator = {
  generateTypingSound: () => {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      if (audioCtx.state === 'suspended') {
        audioCtx.resume();
      }
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      oscillator.frequency.value = 800;
      oscillator.type = 'sine';
      gainNode.gain.setValueAtTime(0.08, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.04);
      oscillator.start(audioCtx.currentTime);
      oscillator.stop(audioCtx.currentTime + 0.04);
    } catch (error) {
      // Silently fail
    }
  },

  generateMessageSound: () => {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      if (audioCtx.state === 'suspended') {
        audioCtx.resume();
      }
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      oscillator.frequency.value = 523;
      oscillator.type = 'sine';
      gainNode.gain.setValueAtTime(0.12, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.15);
      oscillator.start(audioCtx.currentTime);
      oscillator.stop(audioCtx.currentTime + 0.12);
      setTimeout(() => {
        try {
          const osc2 = audioCtx.createOscillator();
          const gain2 = audioCtx.createGain();
          osc2.connect(gain2);
          gain2.connect(audioCtx.destination);
          osc2.frequency.value = 659;
          osc2.type = 'sine';
          gain2.gain.setValueAtTime(0.1, audioCtx.currentTime);
          gain2.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
          osc2.start(audioCtx.currentTime);
          osc2.stop(audioCtx.currentTime + 0.1);
        } catch (e) {}
      }, 120);
    } catch (error) {
      // Silently fail
    }
  },

  generateRaiseHandSound: () => {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      if (audioCtx.state === 'suspended') {
        audioCtx.resume();
      }
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      oscillator.frequency.value = 880;
      oscillator.type = 'sine';
      gainNode.gain.setValueAtTime(0.15, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.3);
      oscillator.start(audioCtx.currentTime);
      oscillator.stop(audioCtx.currentTime + 0.3);
      
      setTimeout(() => {
        try {
          const osc2 = audioCtx.createOscillator();
          const gain2 = audioCtx.createGain();
          osc2.connect(gain2);
          gain2.connect(audioCtx.destination);
          osc2.frequency.value = 1108;
          osc2.type = 'sine';
          gain2.gain.setValueAtTime(0.12, audioCtx.currentTime);
          gain2.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.25);
          osc2.start(audioCtx.currentTime);
          osc2.stop(audioCtx.currentTime + 0.25);
        } catch (e) {}
      }, 150);
    } catch (error) {
      // Silently fail
    }
  }
};

// ===== EMOJI DATA =====
const EMOJIS = ['😀', '😁', '😂', '🤣', '😃', '😄', '😅', '😆', '😉', '😊', '😋', '😎', '😍', '🥰', '😘', '😗', '😙', '😚', '🙂', '🤗', '🤩', '🤔', '🤨', '😐', '😑', '😶', '🙄', '😏', '😣', '😥', '😮', '🤐', '😯', '😪', '😫', '😴', '😌', '😛', '😜', '😝', '🤤', '😒', '😓', '😔', '😕', '🙃', '🤑', '😲', '☹️', '🙁', '😖', '😞', '😟', '😤', '😢', '😭', '😦', '😧', '😨', '😩', '🤯', '😬', '😰', '😱', '🥵', '🥶', '😳', '🤪', '😵', '😡', '😠', '🤬', '👍', '👎', '👊', '✊', '🤛', '🤜', '👏', '🙌', '👐', '🤲', '🤝', '🙏', '✌️', '🤟', '🤘', '👌', '🤌', '🤞', '🖕', '🖐️', '✋', '👋', '🤙', '💪', '🦾', '🖖', '👆', '👇', '👉', '👈', '🙋', '🙇', '💁', '🙅', '🙆', '🙎', '🙍', '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❤️‍🔥', '❤️‍🩹', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟', '📚', '📖', '📕', '📗', '📘', '📙', '📓', '📒', '📃', '📜', '📄', '📰', '📑', '🔖', '🏷️', '💰', '💵', '💴', '💶', '💷', '🪙', '💳', '🧾', '💎', '⚖️', '🪝', '🔧', '🔩', '⚙️', '🗜️', '⚗️', '🧪', '🧫', '🧬', '🔬', '🔭', '📡', '💉', '🩸', '💊', '🩹', '🩺', '🧴', '🧵', '🧶', '🪡', '🧥', '🥼', '🦺', '👔', '👕', '👖', '🧣', '🧤', '🧥', '🧦', '👗', '👘', '🥻', '🩱', '🩲', '🩳', '👙', '👚', '👛', '👜', '👝', '🎒', '👞', '👟', '🥾', '🥿', '👠', '👡', '🩰', '👢', '👑', '👒', '🎩', '🎓', '🧢', '⛑️', '📿', '💄', '💍', '💎'];

// ===== HELPER: GET CURRENT TIME =====
const getCurrentTime = () => {
  return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const TutorSession = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const tutor = location.state?.tutor;

  // ===== STATE =====
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isHandRaised, setIsHandRaised] = useState(false);
  const [participants] = useState([
    { id: 'tutor', name: tutor?.name || 'Tutor', role: 'tutor', online: true },
    { id: 'student', name: 'You', role: 'student', online: true },
  ]);
  const [currentTool, setCurrentTool] = useState('pen');
  const [selectedColor, setSelectedColor] = useState('#1a1a2e');
  const [strokeWidth, setStrokeWidth] = useState(3);

  // ===== REFS =====
  const messagesEndRef = useRef(null);
  const canvasRef = useRef(null);
  const isDrawingRef = useRef(false);
  const lastPosRef = useRef(null);
  const chatInputRef = useRef(null);
  const emojiPickerRef = useRef(null);

  // ===== MOCK CHAT MESSAGES WITH REAL TIME =====
  const getMockMessages = () => {
    const currentTime = getCurrentTime();
    return [
      { id: 1, sender: 'tutor', name: tutor?.name || 'Tutor', message: 'Welcome to the session! How can I help you today?', time: currentTime, type: 'text' },
      { id: 2, sender: 'system', name: 'System', message: 'Session started', time: currentTime, type: 'system' },
    ];
  };

  // ===== EFFECTS =====
  useEffect(() => {
    setMessages(getMockMessages());
    const interval = setInterval(() => {
      setTimeElapsed(prev => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tutor]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (chatInputRef.current) {
      chatInputRef.current.focus();
    }
  }, []);

  // Close emoji picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target)) {
        setShowEmojiPicker(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Canvas setup
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.lineWidth = strokeWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = selectedColor;

    const resizeCanvas = () => {
      const rect = canvas.parentElement.getBoundingClientRect();
      canvas.width = rect.width - 32;
      canvas.height = 200;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    return () => window.removeEventListener('resize', resizeCanvas);
  }, [strokeWidth, selectedColor]);

  // ===== CHAT FUNCTIONS =====
  const sendMessage = (e) => {
    e?.preventDefault();
    if (!newMessage.trim()) return;

    const message = {
      id: Date.now(),
      sender: 'student',
      name: 'You',
      message: newMessage,
      time: getCurrentTime(),
      type: 'text',
    };

    setMessages(prev => [...prev, message]);
    setNewMessage('');
    setShowEmojiPicker(false);

    // Typing indicator with sound
    setIsTyping(true);
    SoundGenerator.generateTypingSound();
    
    let typingCount = 0;
    const typingInterval = setInterval(() => {
      SoundGenerator.generateTypingSound();
      typingCount++;
      if (typingCount >= 3) {
        clearInterval(typingInterval);
      }
    }, 400);

    setTimeout(() => {
      setIsTyping(false);
      clearInterval(typingInterval);
      
      const responses = [
        "That's a great question! Let me explain...",
        "I see what you mean. Let me help you with that.",
        "Excellent observation! Here's how it works...",
        "I understand your confusion. Let me clarify.",
        "That's exactly right! Well done!",
        "Let me show you an example.",
        "Here's a tip that might help.",
        "Great work! Keep going."
      ];
      
      const reply = {
        id: Date.now() + 1,
        sender: 'tutor',
        name: tutor?.name || 'Tutor',
        message: responses[Math.floor(Math.random() * responses.length)],
        time: getCurrentTime(),
        type: 'text',
      };
      
      setMessages(prev => [...prev, reply]);
      SoundGenerator.generateMessageSound();
    }, 2500);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(e);
    }
  };

  const insertEmoji = (emoji) => {
    setNewMessage(prev => prev + emoji);
    setShowEmojiPicker(false);
    chatInputRef.current?.focus();
  };

  // ===== RAISE HAND =====
  const toggleRaiseHand = () => {
    const newState = !isHandRaised;
    setIsHandRaised(newState);
    
    if (newState) {
      SoundGenerator.generateRaiseHandSound();
      const message = {
        id: Date.now(),
        sender: 'system',
        name: 'System',
        message: '🙋 You raised your hand',
        time: getCurrentTime(),
        type: 'system',
      };
      setMessages(prev => [...prev, message]);
      
      // Auto-lower hand after 15 seconds
      setTimeout(() => {
        setIsHandRaised(false);
        const lowerMessage = {
          id: Date.now() + 1,
          sender: 'system',
          name: 'System',
          message: 'Hand lowered',
          time: getCurrentTime(),
          type: 'system',
        };
        setMessages(prev => [...prev, lowerMessage]);
      }, 15000);
    } else {
      const message = {
        id: Date.now(),
        sender: 'system',
        name: 'System',
        message: 'Hand lowered',
        time: getCurrentTime(),
        type: 'system',
      };
      setMessages(prev => [...prev, message]);
    }
  };

  // ===== WHITEBOARD FUNCTIONS =====
  const startDrawing = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const clientX = e.clientX || e.touches?.[0]?.clientX || 0;
    const clientY = e.clientY || e.touches?.[0]?.clientY || 0;
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    isDrawingRef.current = true;
    lastPosRef.current = { x, y };
  };

  const draw = (e) => {
    if (!isDrawingRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const clientX = e.clientX || e.touches?.[0]?.clientX || 0;
    const clientY = e.clientY || e.touches?.[0]?.clientY || 0;
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(lastPosRef.current.x, lastPosRef.current.y);
    ctx.lineTo(x, y);
    ctx.stroke();
    lastPosRef.current = { x, y };
  };

  const stopDrawing = () => {
    isDrawingRef.current = false;
  };

  const clearWhiteboard = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  // ===== CONTROLS =====
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const endSession = () => {
    if (window.confirm('Are you sure you want to end this session?')) {
      navigate('/dashboard');
    }
  };

  // ===== RENDER =====
  if (!tutor) {
    return (
      <div className="session-loading">
        <h2>⏳ Loading session...</h2>
        <button onClick={() => navigate('/tutors')}>Back to Tutors</button>
      </div>
    );
  }

  return (
    <div className="session-container">
      {/* Header */}
      <header className="session-header">
        <div className="session-header-left">
          <button className="btn-back" onClick={() => navigate('/tutors')}>← Back</button>
          <div className="session-info">
            <h2>Session with {tutor.name}</h2>
            <div className="session-meta">
              <span className="session-status connected">● Live</span>
              <span className="session-timer">⏱ {formatTime(timeElapsed)}</span>
              <span className="session-participants">👥 {participants.filter(p => p.online).length}</span>
              {isHandRaised && <span className="hand-raised-badge">🙋 Hand Raised</span>}
            </div>
          </div>
        </div>
        <div className="session-header-right">
          <button className="btn-end" onClick={endSession}>End Session</button>
        </div>
      </header>

      {/* Main Grid */}
      <div className="session-grid">
        {/* Main Content */}
        <div className="session-main">
          {/* Video Area */}
          <div className="video-area">
            <div className="video-container">
              <div className="video-placeholder">
                {tutor.image ? (
                  <img src={tutor.image} alt={tutor.name} className="tutor-avatar-large" />
                ) : (
                  <span className="tutor-emoji">🧑‍🏫</span>
                )}
                <div className="tutor-name-badge">{tutor.name}</div>
                <div className="tutor-name-label">{tutor.bio || 'Expert Tutor'}</div>
                <div className="video-controls-overlay">
                  <button 
                    className={`control-btn ${isHandRaised ? 'hand-raised' : ''}`} 
                    onClick={toggleRaiseHand}
                    title="Raise Hand"
                  >
                    {isHandRaised ? '🙋' : '🤚'}
                  </button>
                  <button 
                    className={`control-btn ${isMuted ? 'active' : ''}`} 
                    onClick={() => setIsMuted(!isMuted)}
                    title={isMuted ? 'Unmute' : 'Mute'}
                  >
                    {isMuted ? '🔇' : '🔊'}
                  </button>
                  <button 
                    className={`control-btn ${isVideoOff ? 'active' : ''}`} 
                    onClick={() => setIsVideoOff(!isVideoOff)}
                    title={isVideoOff ? 'Turn Video On' : 'Turn Video Off'}
                  >
                    {isVideoOff ? '📷' : '📹'}
                  </button>
                  <button 
                    className={`control-btn ${isScreenSharing ? 'active' : ''}`} 
                    onClick={() => setIsScreenSharing(!isScreenSharing)}
                    title={isScreenSharing ? 'Stop Sharing' : 'Share Screen'}
                  >
                    {isScreenSharing ? '🖥️' : '🖥️'}
                  </button>
                  <button 
                    className={`control-btn ${isRecording ? 'active' : ''}`} 
                    onClick={() => setIsRecording(!isRecording)}
                    title={isRecording ? 'Stop Recording' : 'Start Recording'}
                  >
                    {isRecording ? '⏹' : '⏺'}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Whiteboard */}
          <div className="whiteboard-area">
            <div className="whiteboard-header">
              <h4>✏️ Interactive Whiteboard</h4>
              <div className="whiteboard-tools">
                <button 
                  className={`tool-btn ${currentTool === 'pen' ? 'active' : ''}`}
                  onClick={() => setCurrentTool('pen')}
                  title="Pen"
                >✏️</button>
                <button 
                  className={`tool-btn ${currentTool === 'eraser' ? 'active' : ''}`}
                  onClick={() => setCurrentTool('eraser')}
                  title="Eraser"
                >🧹</button>
                <input 
                  type="color" 
                  value={selectedColor} 
                  onChange={(e) => setSelectedColor(e.target.value)}
                  className="color-picker"
                  title="Color"
                />
                <select 
                  value={strokeWidth} 
                  onChange={(e) => setStrokeWidth(Number(e.target.value))}
                  className="stroke-select"
                >
                  <option value={2}>Thin</option>
                  <option value={4}>Medium</option>
                  <option value={6}>Thick</option>
                </select>
                <button className="tool-btn clear" onClick={clearWhiteboard} title="Clear">🗑️</button>
              </div>
            </div>
            <div className="whiteboard-wrapper">
              <canvas
                ref={canvasRef}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
              />
            </div>
          </div>
        </div>

        {/* Sidebar - Chat */}
        <div className="session-sidebar">
          {/* Participants */}
          <div className="participants-list">
            <h4>👥 Participants</h4>
            {participants.map(p => (
              <div key={p.id} className="participant-item">
                <span className={`status-dot ${p.online ? 'online' : 'offline'}`}></span>
                <span>{p.name}</span>
                {p.role === 'tutor' && <span className="role-badge">Tutor</span>}
              </div>
            ))}
          </div>

          {/* Chat */}
          <div className="chat-container">
            <div className="chat-header">
              <h4>💬 Live Chat</h4>
              <span className="chat-count">{messages.filter(m => m.type !== 'system').length} messages</span>
            </div>

            <div className="chat-messages">
              {messages.map((msg) => (
                <div key={msg.id} className={`chat-message ${msg.sender}`}>
                  {msg.type === 'system' ? (
                    <div className="system-message">{msg.message}</div>
                  ) : (
                    <>
                      <div className="message-avatar">
                        {msg.sender === 'tutor' ? (
                          tutor?.image ? (
                            <img 
                              src={tutor.image} 
                              alt={tutor.name} 
                              className="message-avatar-img"
                            />
                          ) : (
                            <span className="message-avatar-emoji">🧑‍🏫</span>
                          )
                        ) : (
                          <span className="message-avatar-emoji">👤</span>
                        )}
                      </div>
                      <div className="message-bubble">
                        <div className="message-header">
                          <strong>{msg.name}</strong>
                          <span>{msg.time}</span>
                        </div>
                        <p>{msg.message}</p>
                      </div>
                    </>
                  )}
                </div>
              ))}
              {isTyping && (
                <div className="typing-indicator">
                  {tutor?.image ? (
                    <img 
                      src={tutor.image} 
                      alt={tutor.name} 
                      className="typing-avatar-img"
                    />
                  ) : (
                    <span>🧑‍🏫</span>
                  )}
                  <span className="typing-dots">
                    <span>.</span><span>.</span><span>.</span>
                  </span>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <form onSubmit={sendMessage} className="chat-input-area">
              <button 
                type="button" 
                className="emoji-btn"
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              >
                😊
              </button>
              
              {showEmojiPicker && (
                <div className="emoji-picker" ref={emojiPickerRef}>
                  <div className="emoji-grid">
                    {EMOJIS.map((emoji) => (
                      <button 
                        key={emoji} 
                        onClick={() => insertEmoji(emoji)}
                        type="button"
                        className="emoji-item"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <input
                ref={chatInputRef}
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Type your message..."
                className="chat-input"
              />

              <button type="submit" className="send-btn" disabled={!newMessage.trim()}>
                Send
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TutorSession;