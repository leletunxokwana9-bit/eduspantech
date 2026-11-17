// src/pages/TutorSession.js
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import useWebRTC from '../hooks/useWebRTC';
import { supabase } from '../services/supabaseClient';
import './TutorSession.css';

const SoundGenerator = {
  generateTypingSound: () => {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      if (audioCtx.state === 'suspended') audioCtx.resume();
      const o = audioCtx.createOscillator(); const g = audioCtx.createGain();
      o.connect(g); g.connect(audioCtx.destination);
      o.frequency.value = 800; o.type = 'sine';
      g.gain.setValueAtTime(0.08, audioCtx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.04);
      o.start(audioCtx.currentTime); o.stop(audioCtx.currentTime + 0.04);
    } catch (e) {}
  },
  generateMessageSound: () => {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      if (audioCtx.state === 'suspended') audioCtx.resume();
      const o = audioCtx.createOscillator(); const g = audioCtx.createGain();
      o.connect(g); g.connect(audioCtx.destination);
      o.frequency.value = 523; o.type = 'sine';
      g.gain.setValueAtTime(0.12, audioCtx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.15);
      o.start(audioCtx.currentTime); o.stop(audioCtx.currentTime + 0.12);
    } catch (e) {}
  },
  generateRaiseHandSound: () => {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      if (audioCtx.state === 'suspended') audioCtx.resume();
      const o = audioCtx.createOscillator(); const g = audioCtx.createGain();
      o.connect(g); g.connect(audioCtx.destination);
      o.frequency.value = 880; o.type = 'sine';
      g.gain.setValueAtTime(0.15, audioCtx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.3);
      o.start(audioCtx.currentTime); o.stop(audioCtx.currentTime + 0.3);
    } catch (e) {}
  },
  // ✅ Soft, gentle two-tone beep for the waiting room (Zoom/Meet style)
  playWaitingBeep: () => {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      if (audioCtx.state === 'suspended') audioCtx.resume();

      const osc1 = audioCtx.createOscillator();
      const gain1 = audioCtx.createGain();
      osc1.connect(gain1); gain1.connect(audioCtx.destination);
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
      gain1.gain.setValueAtTime(0, audioCtx.currentTime);
      gain1.gain.linearRampToValueAtTime(0.05, audioCtx.currentTime + 0.06);
      gain1.gain.setValueAtTime(0.05, audioCtx.currentTime + 0.16);
      gain1.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.26);
      osc1.start(audioCtx.currentTime);
      osc1.stop(audioCtx.currentTime + 0.26);

      setTimeout(() => {
        try {
          const ctx2 = new (window.AudioContext || window.webkitAudioContext)();
          if (ctx2.state === 'suspended') ctx2.resume();
          const osc2 = ctx2.createOscillator();
          const gain2 = ctx2.createGain();
          osc2.connect(gain2); gain2.connect(ctx2.destination);
          osc2.type = 'sine';
          osc2.frequency.setValueAtTime(783.99, ctx2.currentTime); // G5
          gain2.gain.setValueAtTime(0, ctx2.currentTime);
          gain2.gain.linearRampToValueAtTime(0.035, ctx2.currentTime + 0.05);
          gain2.gain.setValueAtTime(0.035, ctx2.currentTime + 0.12);
          gain2.gain.linearRampToValueAtTime(0, ctx2.currentTime + 0.2);
          osc2.start(ctx2.currentTime);
          osc2.stop(ctx2.currentTime + 0.2);
        } catch (e) {}
      }, 180);
    } catch (e) {}
  }
};

const EMOJIS = ['😀','😁','😂','🤣','😃','😄','😅','😆','😉','😊','😋','😎','😍','🥰','😘','😗','😙','😚','🙂','🤗','🤩','🤔','🤨','😐','😑','😶','🙄','😏','😣','😥','😮','🤐','😯','😪','😫','😴','😌','😛','😜','😝','🤤','😒','😓','😔','😕','🙃','🤑','😲','☹️','🙁','😖','😞','😟','😤','😢','😭','😦','😧','😨','😩','🤯','😬','😰','😱','🥵','🥶','😳','🤪','😵','😡','😠','🤬','👍','👎','👊','✊','🤛','🤜','👏','🙌','👐','🤲','🤝','🙏','✌️','🤟','🤘','👌','🤌','🤞','🖕','🖐️','✋','👋','🤙','💪','🦾','🖖','👆','👇','👉','👈','🙋','🙇','💁','🙅','🙆','🙎','🙍','❤️','🧡','💛','💚','💙','💜','🖤','🤍','🤎','💔','❤️‍🔥','❤️‍🩹','💕','💞','💓','💗','💖','💘','💝','💟','📚','📖','📕','📗','📘','📙','📓','📒','📃','📜','📄','📰','📑','🔖','🏷️','💰','💵','💴','💶','💷','🪙','💳','🧾','💎','⚖️','🪝','🔧','🔩','⚙️','🗜️','⚗️','🧪','🧫','🧬','🔬','🔭','📡','💉','🩸','💊','🩹','🩺','🧴','🧵','🧶','🪡','🧥','🥼','🦺','👔','👕','👖','🧣','🧤','🧦','👗','👘','🥻','🩱','🩲','🩳','👙','👚','👛','👜','👝','🎒','👞','👟','🥾','🥿','👠','👡','🩰','👢','👑','👒','🎩','🎓','🧢','⛑️','📿','💄','💍'];

// ============================================
// ✅ PROFESSIONAL WAITING ROOM (Zoom/Meet style)
// ============================================
const WaitingForTutor = ({ onLeave, tutorName, sessionTopic }) => {
  const [dotCount, setDotCount] = useState(1);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const beepIntervalRef = useRef(null);
  const dotIntervalRef = useRef(null);
  const timerIntervalRef = useRef(null);

  // Animated dots for "Waiting for tutor..."
  useEffect(() => {
    dotIntervalRef.current = setInterval(() => {
      setDotCount(prev => (prev % 3) + 1);
    }, 500);
    return () => clearInterval(dotIntervalRef.current);
  }, []);

  // Elapsed time counter
  useEffect(() => {
    timerIntervalRef.current = setInterval(() => {
      setElapsedSeconds(prev => prev + 1);
    }, 1000);
    return () => clearInterval(timerIntervalRef.current);
  }, []);

  // Soft periodic beeping (every 3 seconds) - like a call waiting
  useEffect(() => {
    if (isMuted) return;

    const initialDelay = setTimeout(() => {
      SoundGenerator.playWaitingBeep();
    }, 1000);

    beepIntervalRef.current = setInterval(() => {
      SoundGenerator.playWaitingBeep();
    }, 3000);

    return () => {
      clearTimeout(initialDelay);
      clearInterval(beepIntervalRef.current);
    };
  }, [isMuted]);

  const formatElapsed = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  return (
    <div className="waiting-room">
      {/* Animated background orbs */}
      <div className="waiting-bg">
        <div className="waiting-orb orb-a"></div>
        <div className="waiting-orb orb-b"></div>
        <div className="waiting-orb orb-c"></div>
      </div>

      <div className="waiting-card">
        {/* Top bar with session info */}
        <div className="waiting-topbar">
          <div className="waiting-session-info">
            <span className="waiting-live-badge">
              <span className="live-dot"></span>
              Live Session
            </span>
            {sessionTopic && (
              <span className="waiting-topic">📖 {sessionTopic}</span>
            )}
          </div>
          <button
            className={`waiting-mute-btn ${isMuted ? 'muted' : ''}`}
            onClick={() => setIsMuted(!isMuted)}
            title={isMuted ? 'Unmute waiting sound' : 'Mute waiting sound'}
          >
            {isMuted ? '🔇' : '🔔'}
          </button>
        </div>

        {/* Main content */}
        <div className="waiting-main">
          <div className="waiting-avatar-container">
            <div className="waiting-ring ring-1"></div>
            <div className="waiting-ring ring-2"></div>
            <div className="waiting-ring ring-3"></div>
            <div className="waiting-avatar">
              <span className="waiting-avatar-emoji">⏳</span>
            </div>
            <div className="waiting-pulse-dot"></div>
          </div>

          <h1 className="waiting-title">
            Waiting for tutor{'.'.repeat(dotCount)}
          </h1>

          {tutorName && (
            <p className="waiting-tutor-name">
              <span className="tutor-name-label">Tutor:</span>
              <strong>{tutorName}</strong>
            </p>
          )}

          <p className="waiting-description">
            Your tutor will join the session shortly.
            <br />
            Please stay connected — you'll be notified the moment they arrive.
          </p>

          <div className="waiting-status-pill">
            <span className="status-pulse"></span>
            <span>Connecting to session</span>
            <span className="waiting-timer">{formatElapsed(elapsedSeconds)}</span>
          </div>

          <div className="waiting-tips">
            <div className="waiting-tip">
              <span className="tip-icon">🎧</span>
              <span>Check your audio is on</span>
            </div>
            <div className="waiting-tip">
              <span className="tip-icon">📶</span>
              <span>Keep this tab open</span>
            </div>
            <div className="waiting-tip">
              <span className="tip-icon">💬</span>
              <span>Chat will be available once they join</span>
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="waiting-footer">
          <button className="waiting-leave-btn" onClick={onLeave}>
            Leave Waiting Room
          </button>
          <p className="waiting-footer-note">
            You won't be charged until the session starts
          </p>
        </div>
      </div>
    </div>
  );
};

const TutorSession = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { sessionId: routeSessionId } = useParams();
  const tutor = location.state?.tutor;
  const sessionId = routeSessionId || location.state?.sessionId || `session-${Date.now()}`;

  const [userRole, setUserRole] = useState('student');
  const [userId, setUserId] = useState(null);
  const [userName, setUserName] = useState('You');
  const [isTutorUser, setIsTutorUser] = useState(false);
  const [roleLoaded, setRoleLoaded] = useState(false);

  // ============================================
  // ROLE DETECTION
  // ============================================
  useEffect(() => {
    const checkRole = async () => {
      let token = localStorage.getItem('accessToken');
      if (!token) {
        setUserRole('student'); setUserId(`user-${Date.now()}`);
        setUserName('You'); setIsTutorUser(false); setRoleLoaded(true);
        return;
      }
      try {
        const API_URL = process.env.REACT_APP_API_URL || 'https://eduspantech-backend.onrender.com/api';
        let response = await fetch(`${API_URL}/auth/me`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.status === 401) {
          const refreshToken = localStorage.getItem('refreshToken');
          if (refreshToken) {
            const refreshRes = await fetch(`${API_URL}/auth/refresh`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ refreshToken })
            });
            if (refreshRes.ok) {
              const refreshData = await refreshRes.json();
              localStorage.setItem('accessToken', refreshData.accessToken);
              token = refreshData.accessToken;
              response = await fetch(`${API_URL}/auth/me`, {
                headers: { 'Authorization': `Bearer ${token}` }
              });
            }
          }
        }

        if (response.ok) {
          const data = await response.json();
          const user = data.user || data;
          const isTutor = user.is_tutor === true || user.role === 'tutor';
          const id = user.id || user.userId || `user-${Date.now()}`;
          const name = user.name || user.fullName || 'You';
          setUserRole(isTutor ? 'tutor' : 'student');
          setUserId(id); setUserName(name);
          setIsTutorUser(isTutor); setRoleLoaded(true);
        } else { throw new Error('Backend rejected token'); }
      } catch (error) {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user) {
            const { data: profile } = await supabase.from('users').select('*').eq('id', session.user.id).single();
            if (profile) {
              const isTutor = profile.is_tutor === true || profile.role === 'tutor';
              setUserRole(isTutor ? 'tutor' : 'student');
              setUserId(profile.id); setUserName(profile.name || 'You');
              setIsTutorUser(isTutor);
            }
          }
        } catch (supaErr) {}
        setRoleLoaded(true);
      }
    };
    checkRole();
  }, []);

  // ============================================
  // WEBRTC
  // ============================================
  const {
    isConnected, participants, error: webrtcError, isAudioEnabled, connectionStatus,
    tutorJoined, toggleAudio, leaveSession: leaveWebRTCSession,
    broadcastWhiteboardUpdate, clearWhiteboard: clearWhiteboardRemote, sendChatMessage
  } = useWebRTC(
    roleLoaded ? sessionId : null,
    roleLoaded ? userRole : 'student',
    roleLoaded ? userId : null
  );

  const [showWaitingScreen, setShowWaitingScreen] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activePopup, setActivePopup] = useState(null);

  const prevParticipantsRef = useRef([]);

  useEffect(() => {
    if (!roleLoaded) return;
    if (userRole === 'tutor') { setShowWaitingScreen(false); setSessionReady(true); return; }
    if (userRole === 'student') {
      const hasTutor = participants.some(p => p.role === 'tutor');
      if (hasTutor || tutorJoined) { setShowWaitingScreen(false); setSessionReady(true); }
      else { setShowWaitingScreen(true); setSessionReady(false); }
    }
  }, [roleLoaded, userRole, participants, tutorJoined]);

  // ============================================
  // TRIGGER WEBRTC OFFER (Only Tutor initiates)
  // ============================================
  useEffect(() => {
    if (!isConnected || !roleLoaded) return;
    if (userRole !== 'tutor') return;

    const target = participants.find(p => p.role !== userRole);
    if (!target) return;
    window.dispatchEvent(new CustomEvent('request-offer', {
      detail: { targetUserId: target.userId }
    }));
  }, [isConnected, roleLoaded, participants, userRole]);

  // ============================================
  // JOIN / LEAVE POPUPS & SYSTEM MESSAGES
  // ============================================
  useEffect(() => {
    if (!sessionReady || !userId) return;

    const currentIds = participants.map(p => p.userId);
    const prevIds = prevParticipantsRef.current.map(p => p.userId);

    participants.forEach(p => {
      if (!prevIds.includes(p.userId) && p.userId !== userId) {
        setActivePopup({ type: 'join', name: p.name || 'A participant' });
        setTimeout(() => setActivePopup(null), 4000);

        supabase.from('messages').insert([{
          session_id: sessionId,
          sender_id: 'system',
          sender_name: 'System',
          sender_role: 'system',
          message: `${p.name || 'A participant'} joined the session`,
          type: 'system'
        }]);
      }
    });

    prevParticipantsRef.current.forEach(p => {
      if (!currentIds.includes(p.userId) && p.userId !== userId) {
        setActivePopup({ type: 'leave', name: p.name || 'A participant' });
        setTimeout(() => setActivePopup(null), 4000);

        supabase.from('messages').insert([{
          session_id: sessionId,
          sender_id: 'system',
          sender_name: 'System',
          sender_role: 'system',
          message: `${p.name || 'A participant'} left the session`,
          type: 'system'
        }]);
      }
    });

    prevParticipantsRef.current = participants;
  }, [participants, sessionId, userId, sessionReady]);

  // ============================================
  // WHITEBOARD STATE
  // ============================================
  const [drawingData, setDrawingData] = useState([]);
  const [currentTool, setCurrentTool] = useState('pen');
  const [selectedColor, setSelectedColor] = useState('#1a1a2e');
  const [strokeWidth, setStrokeWidth] = useState(3);
  const [isDrawing, setIsDrawing] = useState(false);
  const [lastPos, setLastPos] = useState(null);

  // ============================================
  // CHAT & UI
  // ============================================
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [typingUsers, setTypingUsers] = useState([]);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isHandRaised, setIsHandRaised] = useState(false);
  const [handRaiseNotification, setHandRaiseNotification] = useState(null);
  const [showChat, setShowChat] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [sessionEnded, setSessionEnded] = useState(false);
  const [sessionStats, setSessionStats] = useState({ whiteboardActions: 0, messagesSent: 0, handRaises: 0, startTime: Date.now() });

  const canvasRef = useRef(null);
  const ctxRef = useRef(null);
  const messagesEndRef = useRef(null);
  const chatInputRef = useRef(null);
  const emojiPickerRef = useRef(null);
  const timerRef = useRef(null);
  const drawingDataRef = useRef([]);
  const typingTimeoutRef = useRef(null);
  const channelRef = useRef(null);

  const getSenderColor = (name) => {
    const colors = ['#ef4444', '#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899'];
    const hash = (name || '').split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[Math.abs(hash) % colors.length];
  };

  // ============================================
  // CANVAS SETUP
  // ============================================
  useEffect(() => {
    const timer = setTimeout(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.lineWidth = strokeWidth; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      ctx.strokeStyle = selectedColor; ctxRef.current = ctx;

      const resizeCanvas = () => {
        const rect = canvas.parentElement?.getBoundingClientRect();
        if (!rect) return;
        const dpr = window.devicePixelRatio || 1;
        canvas.width = rect.width * dpr; canvas.height = rect.height * dpr;
        canvas.style.width = rect.width + 'px'; canvas.style.height = rect.height + 'px';
        ctx.scale(dpr, dpr);
        if (drawingData.length > 0) redrawCanvas();
      };
      resizeCanvas();
      window.addEventListener('resize', resizeCanvas);

      const preventScroll = (e) => { if (userRole === 'tutor') e.preventDefault(); };
      canvas.addEventListener('touchstart', preventScroll, { passive: false });
      canvas.addEventListener('touchmove', preventScroll, { passive: false });

      return () => {
        window.removeEventListener('resize', resizeCanvas);
        canvas.removeEventListener('touchstart', preventScroll);
        canvas.removeEventListener('touchmove', preventScroll);
      };
    }, 100);
    return () => clearTimeout(timer);
  }, [strokeWidth, selectedColor, sessionReady, userRole, isFullscreen]);

  const redrawCanvas = useCallback(() => {
    const ctx = ctxRef.current; const canvas = canvasRef.current;
    if (!ctx || !canvas) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawingData.forEach(path => {
      if (!path || !path.points || path.points.length < 2) return;
      ctx.beginPath();
      ctx.moveTo(path.points[0].x, path.points[0].y);
      for (let i = 1; i < path.points.length; i++) ctx.lineTo(path.points[i].x, path.points[i].y);
      ctx.strokeStyle = path.color || '#1a1a2e'; ctx.lineWidth = path.width || 3;
      ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.stroke();
    });
  }, [drawingData]);

  useEffect(() => { drawingDataRef.current = drawingData; }, [drawingData]);

  const startDrawing = (e) => {
    if (userRole !== 'tutor' || !ctxRef.current) return;
    e.preventDefault();
    const canvas = canvasRef.current; const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const clientX = e.clientX || e.touches?.[0]?.clientX || 0;
    const clientY = e.clientY || e.touches?.[0]?.clientY || 0;
    const x = (clientX - rect.left) * (canvas.width / rect.width / dpr);
    const y = (clientY - rect.top) * (canvas.height / rect.height / dpr);
    setIsDrawing(true); setLastPos({ x, y });
    setSessionStats(prev => ({ ...prev, whiteboardActions: prev.whiteboardActions + 1 }));
  };

  const draw = (e) => {
    if (!isDrawing || userRole !== 'tutor' || !ctxRef.current) return;
    e.preventDefault();
    const canvas = canvasRef.current; const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const clientX = e.clientX || e.touches?.[0]?.clientX || 0;
    const clientY = e.clientY || e.touches?.[0]?.clientY || 0;
    const x = (clientX - rect.left) * (canvas.width / rect.width / dpr);
    const y = (clientY - rect.top) * (canvas.height / rect.height / dpr);
    const ctx = ctxRef.current;
    ctx.beginPath(); ctx.moveTo(lastPos.x, lastPos.y); ctx.lineTo(x, y);
    ctx.strokeStyle = selectedColor; ctx.lineWidth = strokeWidth;
    ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.stroke();
    setDrawingData(prev => {
      const nd = [...prev];
      if (nd.length > 0) {
        const lp = nd[nd.length - 1];
        if (lp.color === selectedColor && lp.width === strokeWidth) { lp.points.push({ x, y }); return nd; }
      }
      nd.push({ points: [{ x, y }], color: selectedColor, width: strokeWidth });
      return nd;
    });
    setLastPos({ x, y });
  };

  const stopDrawing = () => {
    if (isDrawing && userRole === 'tutor') {
      broadcastWhiteboardUpdate('draw', drawingDataRef.current);
    }
    setIsDrawing(false); setLastPos(null);
  };

  const clearWhiteboard = () => {
    if (userRole !== 'tutor' || !ctxRef.current) return;
    const canvas = canvasRef.current; const ctx = ctxRef.current;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setDrawingData([]); clearWhiteboardRemote();
  };

  const undo = () => {
    if (userRole !== 'tutor' || !ctxRef.current) return;
    setDrawingData(prev => {
      const next = prev.slice(0, -1);
      setTimeout(() => { redrawCanvas(); broadcastWhiteboardUpdate('draw', next); }, 0);
      return next;
    });
  };

  const redo = () => {};

  // ============================================
  // WHITEBOARD MESSAGE HANDLERS
  // ============================================
  useEffect(() => {
    const handleWhiteboardUpdate = (event) => {
      const { action, data } = event.detail || {};
      if (Array.isArray(data)) { setDrawingData(data); setTimeout(() => redrawCanvas(), 20); }
      else if (action === 'clear') { setDrawingData([]); setTimeout(() => redrawCanvas(), 20); }
    };
    const handleWhiteboardSync = (event) => {
      const { data } = event.detail || {};
      if (Array.isArray(data)) { setDrawingData(data); setTimeout(() => redrawCanvas(), 20); }
    };
    const handleClearWhiteboard = () => { setDrawingData([]); setTimeout(() => redrawCanvas(), 20); };
    window.addEventListener('whiteboard-update', handleWhiteboardUpdate);
    window.addEventListener('whiteboard-sync', handleWhiteboardSync);
    window.addEventListener('clear-whiteboard', handleClearWhiteboard);
    return () => {
      window.removeEventListener('whiteboard-update', handleWhiteboardUpdate);
      window.removeEventListener('whiteboard-sync', handleWhiteboardSync);
      window.removeEventListener('clear-whiteboard', handleClearWhiteboard);
    };
  }, [redrawCanvas]);

  // ============================================
  // CHAT MESSAGE HANDLERS (SUPABASE REALTIME)
  // ============================================
  useEffect(() => {
    if (!sessionId || !userId) return;

    const fetchMessages = async () => {
      const { data } = await supabase
        .from('messages')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true });
      if (data) setMessages(data);
    };
    fetchMessages();

    const channel = supabase.channel(`chat-${sessionId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `session_id=eq.${sessionId}` }, (payload) => {
        const newMsg = payload.new;
        setMessages(prev => {
          if (prev.find(m => m.id === newMsg.id)) return prev;
          return [...prev, newMsg];
        });
        if (newMsg.sender_id !== userId && newMsg.type !== 'system') {
          SoundGenerator.generateMessageSound();
        }
        if (newMsg.type === 'raise_hand' && userRole === 'tutor') {
          SoundGenerator.generateRaiseHandSound();
          setHandRaiseNotification(`${newMsg.sender_name} raised their hand!`);
          setTimeout(() => setHandRaiseNotification(null), 5000);
        }
      })
      .on('broadcast', { event: 'typing' }, (payload) => {
        if (payload.payload.userId !== userId) {
          setTypingUsers([payload.payload.name]);
        }
      })
      .on('broadcast', { event: 'stopped_typing' }, (payload) => {
        if (payload.payload.userId !== userId) {
          setTypingUsers([]);
        }
      })
      .subscribe();

    channelRef.current = channel;

    return () => supabase.removeChannel(channel);
  }, [sessionId, userId, userRole]);

  // ============================================
  // TIMERS, EFFECTS
  // ============================================
  useEffect(() => {
    timerRef.current = setInterval(() => setTimeElapsed(prev => prev + 1), 1000);
    return () => clearInterval(timerRef.current);
  }, []);

  // ✅ Scroll only the inner chat box, NOT the page
  useEffect(() => {
    const chatBox = document.querySelector('.chat-messages');
    if (chatBox) {
      chatBox.scrollTop = chatBox.scrollHeight;
    }
  }, [messages, typingUsers]);

  useEffect(() => { chatInputRef.current?.focus(); }, []);
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target)) setShowEmojiPicker(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  useEffect(() => { if (!isMobile) setShowChat(false); }, [isMobile]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60); const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const renderTutorAvatar = (tutorData) => {
    if (!tutorData) return <div className="tutor-avatar-default" style={{ width: '100%', height: '100%', borderRadius: '50%', background: '#4f46e5', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', fontWeight: 'bold' }}>T</div>;
    const photoUrl = tutorData.avatar || tutorData.profileImage;
    if (photoUrl && typeof photoUrl === 'string') {
      return <img src={photoUrl} alt={tutorData.name || 'Tutor'} className="tutor-avatar-img" loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} onError={(e) => { e.target.style.display = 'none'; }} />;
    }
    const name = tutorData.name || 'Tutor';
    const initials = name.split(' ').map(w => (w && w[0]) || '').join('').toUpperCase().slice(0, 2);
    const colors = ['#1a73e8', '#e91e63', '#ff6f00', '#7b1fa2', '#0d47a1', '#00695c', '#bf360c', '#4a148c', '#1a237e', '#880e4f', '#004d40'];
    const hash = name.split('').reduce((acc, char) => acc + (char.charCodeAt(0) || 0), 0);
    const color = colors[Math.abs(hash) % colors.length] || '#4f46e5';
    return <div className="tutor-avatar-default" style={{ width: '100%', height: '100%', borderRadius: '50%', background: color, color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', fontWeight: 'bold', textTransform: 'uppercase' }}>{initials || 'T'}</div>;
  };

  const sendMessage = async (e) => {
    e?.preventDefault();
    if (!newMessage.trim()) return;

    const messageText = newMessage;
    setNewMessage('');
    setShowEmojiPicker(false);
    setSessionStats(prev => ({ ...prev, messagesSent: prev.messagesSent + 1 }));

    setTypingUsers([]);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    if (channelRef.current) {
      channelRef.current.send({
        type: 'broadcast',
        event: 'stopped_typing',
        payload: { userId: userId }
      });
    }

    await supabase.from('messages').insert([{
      session_id: sessionId,
      sender_id: userId,
      sender_name: userName || 'You',
      sender_role: userRole,
      message: messageText,
      type: 'text'
    }]);
  };

  const handleTyping = (e) => {
    setNewMessage(e.target.value);

    if (channelRef.current) {
      channelRef.current.send({
        type: 'broadcast',
        event: 'typing',
        payload: { name: userName || 'You', userId: userId }
      });
    }

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      if (channelRef.current) {
        channelRef.current.send({
          type: 'broadcast',
          event: 'stopped_typing',
          payload: { userId: userId }
        });
      }
    }, 1500);
  };

  const toggleRaiseHand = async () => {
    const newState = !isHandRaised;
    setIsHandRaised(newState);

    if (newState) {
      SoundGenerator.generateRaiseHandSound();
      setSessionStats(prev => ({ ...prev, handRaises: prev.handRaises + 1 }));

      await supabase.from('messages').insert([{
        session_id: sessionId,
        sender_id: userId,
        sender_name: userName || 'You',
        sender_role: userRole,
        message: `${userName} raised their hand!`,
        type: 'raise_hand'
      }]);
    }
  };

  const insertEmoji = (emoji) => { setNewMessage(prev => prev + emoji); setShowEmojiPicker(false); chatInputRef.current?.focus(); };

  const endSession = async () => {
    if (sessionEnded) return;
    const duration = Math.floor((Date.now() - sessionStats.startTime) / 1000);
    setSessionStats(prev => ({ ...prev, duration }));
    setSessionEnded(true);

    leaveWebRTCSession();

    try {
      const token = localStorage.getItem('accessToken');
      if (sessionId && sessionId !== 'temp_session') {
        const API_URL = process.env.REACT_APP_API_URL || 'https://eduspantech-backend.onrender.com/api';
        await fetch(`${API_URL}/sessions/end`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId, duration })
        });
      }
    } catch (error) { console.error('Error ending session:', error); }

    if (userRole === 'tutor') {
      navigate('/tutor/dashboard');
    } else {
      navigate('/my-sessions');
    }
  };

  const handleLeaveWaitingRoom = () => { leaveWebRTCSession(); navigate('/my-sessions'); };

  if (!roleLoaded) return <div className="session-loading"><div className="loading-spinner"></div><p>Loading session...</p></div>;
  if (!tutor) return <div className="session-loading"><h2>⏳ Loading session...</h2><button onClick={() => navigate('/tutors')}>Back to Tutors</button></div>;
  if (showWaitingScreen && userRole === 'student') {
    return (
      <WaitingForTutor
        onLeave={handleLeaveWaitingRoom}
        tutorName={tutor?.name}
        sessionTopic={tutor?.topic || tutor?.subjects?.[0] || 'Tutoring Session'}
      />
    );
  }

  return (
    <div className="session-container dark">

      {activePopup && (
        <div className={`session-popup ${activePopup.type}`}>
          {activePopup.name} {activePopup.type === 'join' ? 'joined the session' : 'left the session'}
        </div>
      )}

      {handRaiseNotification && (
        <div className="hand-raise-popup">
          ✋ {handRaiseNotification}
        </div>
      )}

      <header className="session-header">
        <div className="session-header-left">
          <button className="btn-back" onClick={() => navigate('/tutors')}>← Back</button>
          <div className="session-info">
            <h2>Session with {tutor.name}</h2>
            <div className="session-meta">
              <span className={`session-status ${isConnected ? 'connected' : 'disconnected'}`}>{isConnected ? '● Live' : '○ Connecting...'}</span>
              <span className="session-timer">⏱ {formatTime(timeElapsed)}</span>
              <span className="session-participants">👥 {participants.length}</span>
              <span className="session-stats">✏️ {sessionStats.whiteboardActions} | 💬 {sessionStats.messagesSent}</span>
              {isHandRaised && <span className="hand-raised-badge">🙋 Hand Raised</span>}
              {webrtcError && <span className="error-badge">⚠️ {webrtcError}</span>}
            </div>
          </div>
        </div>
        <div className="session-header-right">
          <span className="video-free-badge">🎧 Audio + Whiteboard</span>
          <span className="connection-quality" style={{ color: connectionStatus === 'connected' ? '#27ae60' : connectionStatus === 'connecting' ? '#f59e0b' : '#ef4444' }}>
            <span className="quality-dot" style={{ background: connectionStatus === 'connected' ? '#27ae60' : connectionStatus === 'connecting' ? '#f59e0b' : '#ef4444' }}></span>
            {connectionStatus === 'connected' ? 'Connected' : connectionStatus === 'connecting' ? 'Connecting...' : 'Disconnected'}
          </span>
          <button className="btn-settings" onClick={() => setShowSettings(true)} title="Settings">⚙️</button>
          {isMobile && <button className="mobile-chat-toggle" onClick={() => setShowChat(!showChat)} aria-label="Toggle chat">💬 <span className="chat-badge">{messages.length}</span></button>}
          <button className="btn-end" onClick={endSession} disabled={sessionEnded}>End Session</button>
        </div>
      </header>

      <div className={`session-grid ${showChat ? 'chat-open' : ''} ${isFullscreen ? 'fullscreen-mode' : ''}`}>
        <div className="session-main" style={{ position: 'relative' }}>
          <div className="floating-tutor-card">
            <div className="tutor-avatar-small">{renderTutorAvatar(tutor)}<span className="tutor-status-dot-small"></span></div>
            <div className="tutor-card-info">
              <span className="tutor-card-name">{tutor.name}</span>
              <span className="tutor-card-role">{isTutorUser ? '👨‍🏫 Tutor' : '👨‍🎓 Student'}</span>
            </div>
            <div className="tutor-card-controls">
              <button className={`tutor-control-btn ${isMuted ? 'muted' : ''}`} onClick={() => { setIsMuted(!isMuted); toggleAudio(); }} title="Mute Audio">{isMuted ? '🔇' : '🔊'}</button>
              {!isTutorUser && <button className={`tutor-control-btn ${isHandRaised ? 'raised' : ''}`} onClick={toggleRaiseHand} title="Raise Hand">{isHandRaised ? '🙋' : '🤚'}</button>}
            </div>
          </div>

          {!isFullscreen && <div className="video-free-overlay"><span>🎧 Audio Only</span><span className="video-free-sub">Real-time Voice + Whiteboard</span></div>}

          <div className="whiteboard-area" style={{ height: '100%' }}>
            <div className="whiteboard-header">
              <h4>✏️ Interactive Whiteboard {!isTutorUser && <span style={{ fontSize: '11px', color: '#ef4444' }}>(View Only)</span>}</h4>
              <div className="whiteboard-tools">
                {isTutorUser ? (
                  <>
                    <button className={`tool-btn ${currentTool === 'pen' ? 'active' : ''}`} onClick={() => setCurrentTool('pen')} title="Pen">✏️</button>
                    <button className={`tool-btn ${currentTool === 'eraser' ? 'active' : ''}`} onClick={() => setCurrentTool('eraser')} title="Eraser">🧹</button>
                    <input type="color" value={selectedColor} onChange={(e) => setSelectedColor(e.target.value)} className="color-picker" title="Color" />
                    <select value={strokeWidth} onChange={(e) => setStrokeWidth(Number(e.target.value))} className="stroke-select">
                      <option value={2}>Thin</option><option value={4}>Medium</option><option value={6}>Thick</option>
                    </select>
                    <button className="tool-btn" onClick={undo} title="Undo">↩️</button>
                    <button className="tool-btn" onClick={redo} title="Redo">↪️</button>
                    <button className="tool-btn clear" onClick={clearWhiteboard} title="Clear">🗑️</button>
                    <button className="tool-btn" onClick={() => setIsFullscreen(!isFullscreen)} title="Toggle Fullscreen">
                      {isFullscreen ? '🗗' : '⛶'}
                    </button>
                  </>
                ) : (
                  <button className="tool-btn" onClick={() => setIsFullscreen(!isFullscreen)} title="Toggle Fullscreen">
                    {isFullscreen ? '🗗' : '⛶'}
                  </button>
                )}
              </div>
            </div>
            <div className="whiteboard-wrapper">
              <canvas ref={canvasRef} onMouseDown={startDrawing} onMouseMove={draw} onMouseUp={stopDrawing} onMouseLeave={stopDrawing} onTouchStart={startDrawing} onTouchMove={draw} onTouchEnd={stopDrawing} style={{ cursor: isTutorUser ? 'crosshair' : 'default' }} />
            </div>
          </div>

          <div className="bottom-control-dock">
            <button className={`dock-btn ${isMuted ? 'active' : ''}`} onClick={() => { setIsMuted(!isMuted); toggleAudio(); }} title="Toggle Audio">{isMuted ? '🔇' : '🔊'}</button>
            {!isTutorUser && <button className={`dock-btn ${isHandRaised ? 'raised' : ''}`} onClick={toggleRaiseHand} title="Raise Hand">{isHandRaised ? '🙋' : '🤚'}</button>}
            <button className="dock-btn leave-btn" onClick={endSession} disabled={sessionEnded} title="Leave Session">Leave</button>
          </div>
        </div>

        {!isFullscreen && (
          <div className={`session-sidebar ${isMobile ? 'mobile-sidebar' : ''} ${showChat ? 'mobile-open' : ''}`}>
            <div className="participants-list">
              <h4>👥 Participants</h4>
              {participants.length === 0 ? (
                <div className="participant-item">
                  <span className="status-dot online"></span>
                  <span>{userName || 'You'}</span>
                  <span className="role-badge">{userRole === 'tutor' ? 'Tutor' : 'Student'}</span>
                </div>
              ) : (
                participants.map(p => (
                  <div key={p.userId} className="participant-item">
                    <span className="status-dot online"></span>
                    <span>{p.name || (p.userId ? p.userId.slice(0, 8) : 'User')}</span>
                    <span className="role-badge">{p.role === 'tutor' ? 'Tutor' : 'Student'}</span>
                    {!p.audioEnabled && <span>🔇</span>}
                  </div>
                ))
              )}
            </div>

            <div className="chat-container">
              <div className="chat-header">
                <h4>💬 Live Chat</h4>
                <span className="chat-count">{messages.length} messages</span>
                {isMobile && <button className="close-chat-btn" onClick={() => setShowChat(false)}>✕</button>}
              </div>

              <div className="chat-messages">
                {messages.map((msg) => {
                  const isMe = msg.sender_id === userId;

                  if (msg.type === 'system') {
                    return (
                      <div key={msg.id} className="system-message">
                        {msg.message}
                      </div>
                    );
                  }

                  if (msg.type === 'raise_hand') {
                    return (
                      <div key={msg.id} className="system-message hand-raise-msg">
                        ✋ {msg.message}
                      </div>
                    );
                  }

                  return (
                    <div key={msg.id} className={`msg-wrapper ${isMe ? 'outgoing' : 'incoming'}`}>
                      {!isMe && participants.length > 2 && (
                        <div className="sender-name">
                          <span className="color-dot" style={{ background: getSenderColor(msg.sender_name) }}></span>
                          {msg.sender_name}
                        </div>
                      )}

                      <div className="bubble">
                        {msg.message}
                      </div>

                      <div className="time">
                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  );
                })}

                {typingUsers.length > 0 && (
                  <div className="typing-indicator">
                    {typingUsers.join(', ')} is typing<span className="typing-dots"><span>.</span><span>.</span><span>.</span></span>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              <form onSubmit={sendMessage} className="chat-input-area">
                <button type="button" className="emoji-btn" onClick={() => setShowEmojiPicker(!showEmojiPicker)}>😊</button>
                {showEmojiPicker && (
                  <div className="emoji-picker" ref={emojiPickerRef}>
                    <div className="emoji-grid">
                      {EMOJIS.map((emoji) => <button key={emoji} onClick={() => insertEmoji(emoji)} type="button" className="emoji-item">{emoji}</button>)}
                    </div>
                  </div>
                )}
                <input
                  ref={chatInputRef}
                  type="text"
                  value={newMessage}
                  onChange={handleTyping}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(e); }
                  }}
                  placeholder="Type your message..."
                  className="chat-input"
                />
                <button type="submit" className="send-btn" disabled={!newMessage.trim()}>Send</button>
              </form>
            </div>
          </div>
        )}
      </div>

      {showSettings && <div className="settings-modal">Settings Modal</div>}
    </div>
  );
};

export default TutorSession;
