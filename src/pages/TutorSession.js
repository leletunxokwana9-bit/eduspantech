import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSessionSettings } from '../context/SessionSettingsContext';
import SessionSettings from '../components/SessionSettings/SessionSettings';
import { API_BASE_URL } from '../services/api';
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
    } catch (error) {}
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
    } catch (error) {}
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
    } catch (error) {}
  },
  generateTokenLowSound: () => {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      if (audioCtx.state === 'suspended') {
        audioCtx.resume();
      }
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      oscillator.frequency.value = 440;
      oscillator.type = 'sine';
      gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.1);
      oscillator.start(audioCtx.currentTime);
      oscillator.stop(audioCtx.currentTime + 0.1);
    } catch (error) {}
  }
};

// ===== EMOJI DATA =====
const EMOJIS = [
  '😀', '😁', '😂', '🤣', '😃', '😄', '😅', '😆', '😉', '😊', '😋', '😎', '😍', '🥰', '😘', '😗', '😙', '😚', '🙂', '🤗', '🤩', '🤔', '🤨', '😐', '😑', '😶', '🙄', '😏', '😣', '😥', '😮', '🤐', '😯', '😪', '😫', '😴', '😌', '😛', '😜', '😝', '🤤', '😒', '😓', '😔', '😕', '🙃', '🤑', '😲', '☹️', '🙁', '😖', '😞', '😟', '😤', '😢', '😭', '😦', '😧', '😨', '😩', '🤯', '😬', '😰', '😱', '🥵', '🥶', '😳', '🤪', '😵', '😡', '😠', '🤬',
  '👍', '👎', '👊', '✊', '🤛', '🤜', '👏', '🙌', '👐', '🤲', '🤝', '🙏', '✌️', '🤟', '🤘', '👌', '🤌', '🤞', '🖕', '🖐️', '✋', '👋', '🤙', '💪', '🦾', '🖖', '👆', '👇', '👉', '👈', '🙋', '🙇', '💁', '🙅', '🙆', '🙎', '🙍',
  '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❤️‍🔥', '❤️‍🩹', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟',
  '📚', '📖', '📕', '📗', '📘', '📙', '📓', '📒', '📃', '📜', '📄', '📰', '📑', '🔖', '🏷️', '💰', '💵', '💴', '💶', '💷', '🪙', '💳', '🧾', '💎', '⚖️', '🪝', '🔧', '🔩', '⚙️', '🗜️', '⚗️', '🧪', '🧫', '🧬', '🔬', '🔭', '📡', '💉', '🩸', '💊', '🩹', '🩺', '🧴', '🧵', '🧶', '🪡', '🧥', '🥼', '🦺', '👔', '👕', '👖', '🧣', '🧤', '🧦', '👗', '👘', '🥻', '🩱', '🩲', '🩳', '👙', '👚', '👛', '👜', '👝', '🎒', '👞', '👟', '🥾', '🥿', '👠', '👡', '🩰', '👢', '👑', '👒', '🎩', '🎓', '🧢', '⛑️', '📿', '💄', '💍'
];

// ============================================
// ✅ RENDER TUTOR AVATAR - SAFE VERSION
// ============================================
const renderTutorAvatar = (tutor) => {
  if (!tutor) {
    return (
      <div className="tutor-avatar-default" style={{ 
        width: '100%', 
        height: '100%', 
        borderRadius: '50%',
        background: '#4f46e5',
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '18px',
        fontWeight: 'bold'
      }}>T</div>
    );
  }

  const photoUrl = tutor.avatar || tutor.profileImage;
  
  if (photoUrl) {
    return (
      <img 
        src={photoUrl} 
        alt={tutor.name || 'Tutor'} 
        className="tutor-avatar-img"
        loading="lazy"
        style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
        onError={(e) => {
          e.target.style.display = 'none';
        }}
      />
    );
  }
  
  const name = tutor.name || 'Tutor';
  const initials = name
    .split(' ')
    .map(word => word[0] || '')
    .join('')
    .toUpperCase()
    .slice(0, 2);
  
  const colors = ['#1a73e8', '#e91e63', '#ff6f00', '#7b1fa2', '#0d47a1', '#00695c', '#bf360c', '#4a148c', '#1a237e', '#880e4f', '#004d40'];
  const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const color = colors[hash % colors.length] || '#4f46e5';
  
  return (
    <div 
      className="tutor-avatar-default"
      style={{
        width: '100%',
        height: '100%',
        borderRadius: '50%',
        background: color,
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '18px',
        fontWeight: 'bold',
        textTransform: 'uppercase'
      }}
    >
      {initials || 'T'}
    </div>
  );
};

// ============================================
// HELPERS
// ============================================
const getCurrentTime = () => {
  return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const generateUUID = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : ((r & 0x3) | 0x8);
    return v.toString(16);
  });
};

const getPublicIP = async () => {
  const cachedIP = localStorage.getItem('public_ip');
  if (cachedIP) {
    return cachedIP;
  }
  try {
    const response = await fetch('https://api.ipify.org?format=json', {
      signal: AbortSignal.timeout(3000)
    });
    if (response.ok) {
      const data = await response.json();
      const ip = data.ip || '127.0.0.1';
      localStorage.setItem('public_ip', ip);
      return ip;
    }
  } catch (error) {
    console.log('⚠️ Could not fetch public IP:', error.message);
  }
  return '127.0.0.1';
};

const getShiftInfo = () => {
  const now = new Date();
  const sastTime = new Date(now.toLocaleString('en-US', { timeZone: 'Africa/Johannesburg' }));
  const hours = sastTime.getHours();
  
  const shifts = [
    { name: 'Asia-Pacific Axis', start: 8, end: 15, hubs: ['Sydney', 'Tokyo'] },
    { name: 'South Asian / Indian Corridor', start: 12, end: 19.5, hubs: ['Singapore', 'Mumbai'] },
    { name: 'Africa / Europe Core', start: 16, end: 23, hubs: ['Cape Town', 'Ireland'] },
    { name: 'Pan-American Axis', start: 21, end: 28, hubs: ['São Paulo', 'N. Virginia', 'Oregon'] }
  ];
  
  for (const shift of shifts) {
    if (hours >= shift.start && hours < shift.end) {
      return { ...shift, active: true };
    }
  }
  return { name: 'Off-Peak', active: false, hubs: ['Global'] };
};

const getRegionFromIP = (ip) => {
  const regions = [
    { code: 'af-south-1', name: 'Cape Town', lat: -33.9249, lng: 18.4241 },
    { code: 'us-east-1', name: 'N. Virginia', lat: 39.0438, lng: -77.4874 },
    { code: 'eu-west-1', name: 'Ireland', lat: 53.3498, lng: -6.2603 },
    { code: 'ap-southeast-1', name: 'Singapore', lat: 1.3521, lng: 103.8198 },
    { code: 'ap-southeast-2', name: 'Sydney', lat: -33.8688, lng: 151.2093 },
    { code: 'ap-northeast-1', name: 'Tokyo', lat: 35.6762, lng: 139.6503 },
    { code: 'ap-south-1', name: 'Mumbai', lat: 19.0760, lng: 72.8777 },
    { code: 'sa-east-1', name: 'São Paulo', lat: -23.5505, lng: -46.6333 },
    { code: 'us-west-2', name: 'Oregon', lat: 45.5152, lng: -122.6784 }
  ];
  
  const hash = ip.split('.').reduce((acc, num) => acc + parseInt(num), 0);
  return regions[hash % regions.length];
};

// ============================================
// MAIN COMPONENT
// ============================================
const TutorSession = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const tutor = location.state?.tutor;
  const { isDark } = useSessionSettings();
  const [showSettings, setShowSettings] = useState(false);

  // ===== FEATURE: Watermark =====
  const [watermark, setWatermark] = useState({ text: '', position: { x: 10, y: 30 } });
  const [publicIP, setPublicIP] = useState('127.0.0.1');
  const [watermarkVisible] = useState(true);

  // ===== FEATURE: Token Bucket =====
  const [tokens, setTokens] = useState(15);
  const [maxTokens] = useState(15);
  const [tokenFillRate] = useState(0.166);
  const [lastTokenUpdate, setLastTokenUpdate] = useState(Date.now());

  // ===== FEATURE: Shift Overlap =====
  const [shiftInfo, setShiftInfo] = useState(getShiftInfo());
  const [isShiftOverlapping, setIsShiftOverlapping] = useState(false);

  // ===== FEATURE: Connection Quality =====
  const [latency, setLatency] = useState(12);
  const [connectionQuality, setConnectionQuality] = useState('excellent');
  const [regionInfo, setRegionInfo] = useState(null);

  // ===== FEATURE: Raise Hand Queue =====
  const [handRaiseQueue, setHandRaiseQueue] = useState([]);
  const [handRaisePosition, setHandRaisePosition] = useState(null);

  // ===== FEATURE: Session Summary =====
  const [sessionStats, setSessionStats] = useState({
    whiteboardActions: 0,
    messagesSent: 0,
    handRaises: 0,
    startTime: Date.now()
  });
  const [showSummary, setShowSummary] = useState(false);

  // ===== FEATURE: Whiteboard Undo/Redo =====
  const [canvasHistory, setCanvasHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [maxHistory] = useState(50);

  // ===== FEATURE: Whiteboard Tools =====
  const [currentTool, setCurrentTool] = useState('pen');
  const [selectedColor, setSelectedColor] = useState('#1a1a2e');
  const [strokeWidth, setStrokeWidth] = useState(3);
  const [showGrid, setShowGrid] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);

  // ===== FEATURE: Recording =====
  const [isRecording, setIsRecording] = useState(false);

  // ============================================
  // RATING FEATURE
  // ============================================
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [ratingData, setRatingData] = useState({
    overall: 0,
    communication: 0,
    knowledge: 0,
    teaching: 0,
    punctuality: 0,
    review: ''
  });
  const [ratingSubmitted, setRatingSubmitted] = useState(false);
  const [ratingLoading, setRatingLoading] = useState(false);
  const [hoveredStar, setHoveredStar] = useState(0);
  const [sessionEnded, setSessionEnded] = useState(false);

  // ============================================
  // CHECK IF USER IS TUTOR OR STUDENT
  // ============================================
  const [isTutorUser, setIsTutorUser] = useState(false);

  useEffect(() => {
    const checkUserRole = async () => {
      try {
        const token = localStorage.getItem('accessToken');
        if (token) {
          const response = await fetch(`${API_BASE_URL}/auth/me`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          if (response.ok) {
            const data = await response.json();
            const user = data.user || data;
            const isTutor = user.is_tutor === true || user.role === 'tutor';
            setIsTutorUser(isTutor);
            console.log('👤 User role:', isTutor ? 'Tutor' : 'Student');
          }
        }
      } catch (error) {
        console.error('Failed to check user role:', error);
      }
    };
    checkUserRole();
  }, []);

  // ===== STATE =====
  const [isMuted, setIsMuted] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isHandRaised, setIsHandRaised] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [participants] = useState([
    { id: 'tutor', name: tutor?.name || 'Tutor', role: 'tutor', online: true },
    { id: 'student', name: 'You', role: 'student', online: true },
  ]);

  // ===== REFS =====
  const messagesEndRef = useRef(null);
  const canvasRef = useRef(null);
  const isDrawingRef = useRef(false);
  const lastPosRef = useRef(null);
  const chatInputRef = useRef(null);
  const emojiPickerRef = useRef(null);
  const watermarkIntervalRef = useRef(null);
  const tokenIntervalRef = useRef(null);
  const recordingIntervalRef = useRef(null);
  const shiftIntervalRef = useRef(null);
  const canvasDataRef = useRef(null);
  const resizeTimeoutRef = useRef(null);

  // ===== DRAW WATERMARK =====
  const drawWatermark = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    if (watermarkVisible) {
      ctx.save();
      ctx.globalAlpha = 0.25;
      ctx.font = '13px monospace';
      ctx.fillStyle = '#888888';
      ctx.shadowColor = 'rgba(255,255,255,0.5)';
      ctx.shadowBlur = 2;
      const { x, y } = watermark.position;
      ctx.fillText(watermark.text, x, y);
      ctx.restore();
    }
    
    canvasDataRef.current = ctx.getImageData(0, 0, canvas.width, canvas.height);
  }, [watermark, watermarkVisible]);

  const restoreCanvasWithWatermark = useCallback((dataUrl) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      if (watermarkVisible) {
        ctx.save();
        ctx.globalAlpha = 0.25;
        ctx.font = '13px monospace';
        ctx.fillStyle = '#888888';
        ctx.shadowColor = 'rgba(255,255,255,0.5)';
        ctx.shadowBlur = 2;
        const { x, y } = watermark.position;
        ctx.fillText(watermark.text, x, y);
        ctx.restore();
      }
      canvasDataRef.current = ctx.getImageData(0, 0, canvas.width, canvas.height);
    };
    img.src = dataUrl;
  }, [watermark, watermarkVisible]);

  // ===== INIT =====
  useEffect(() => {
    let uuid = localStorage.getItem('eduspantech_uuid');
    if (!uuid) {
      uuid = generateUUID();
      localStorage.setItem('eduspantech_uuid', uuid);
    }

    getPublicIP().then(ip => {
      setPublicIP(ip);
      const region = getRegionFromIP(ip);
      setRegionInfo(region);
    });

    setWatermark({
      text: `${uuid} | ${publicIP}`,
      position: { x: 10 + Math.random() * 20, y: 30 + Math.random() * 20 }
    });

    watermarkIntervalRef.current = setInterval(() => {
      const canvas = canvasRef.current;
      if (canvas) {
        const rect = canvas.getBoundingClientRect();
        const maxX = Math.max(10, rect.width - 200);
        const maxY = Math.max(30, rect.height - 40);
        setWatermark(prev => {
          const newPos = {
            x: 10 + Math.random() * maxX,
            y: 30 + Math.random() * maxY
          };
          return {
            ...prev,
            position: newPos
          };
        });
        setTimeout(() => drawWatermark(), 50);
      }
    }, 60000);

    return () => {
      if (watermarkIntervalRef.current) {
        clearInterval(watermarkIntervalRef.current);
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [drawWatermark]);

  // ===== TOKEN BUCKET =====
  useEffect(() => {
    const updateTokens = () => {
      const now = Date.now();
      const delta = (now - lastTokenUpdate) / 1000;
      const newTokens = Math.min(maxTokens, tokens + (delta * tokenFillRate));
      setTokens(Math.floor(newTokens));
      setLastTokenUpdate(now);
      
      if (newTokens < 3 && newTokens > 0) {
        SoundGenerator.generateTokenLowSound();
      }
    };

    tokenIntervalRef.current = setInterval(updateTokens, 1000);
    return () => {
      if (tokenIntervalRef.current) {
        clearInterval(tokenIntervalRef.current);
      }
    };
  }, [tokens, lastTokenUpdate, maxTokens, tokenFillRate]);

  // ===== SHIFT TIMER =====
  useEffect(() => {
    const updateShift = () => {
      const shift = getShiftInfo();
      setShiftInfo(shift);
      
      if (shift.active) {
        const now = new Date();
        const sastTime = new Date(now.toLocaleString('en-US', { timeZone: 'Africa/Johannesburg' }));
        const hours = sastTime.getHours() + sastTime.getMinutes() / 60;
        const end = shift.end;
        const remaining = Math.max(0, (end - hours) * 60);
        
        if (remaining < 30 && remaining > 0) {
          setIsShiftOverlapping(true);
        } else {
          setIsShiftOverlapping(false);
        }
      } else {
        setIsShiftOverlapping(false);
      }
    };

    updateShift();
    shiftIntervalRef.current = setInterval(updateShift, 30000);
    return () => {
      if (shiftIntervalRef.current) {
        clearInterval(shiftIntervalRef.current);
      }
    };
  }, []);

  // ===== CONNECTION QUALITY =====
  useEffect(() => {
    const updateLatency = () => {
      const newLatency = 5 + Math.random() * 55;
      setLatency(Math.round(newLatency));
      
      if (newLatency < 30) {
        setConnectionQuality('excellent');
      } else if (newLatency < 50) {
        setConnectionQuality('good');
      } else {
        setConnectionQuality('poor');
      }
    };

    const interval = setInterval(updateLatency, 5000);
    return () => clearInterval(interval);
  }, []);

  // ===== RECORDING =====
  useEffect(() => {
    if (isRecording) {
      recordingIntervalRef.current = setInterval(() => {}, 1000);
    } else {
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
        recordingIntervalRef.current = null;
      }
    }
    return () => {
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
    };
  }, [isRecording]);

  // ===== MOCK CHAT =====
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

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (chatInputRef.current) {
      chatInputRef.current.focus();
    }
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target)) {
        setShowEmojiPicker(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // ===== CANVAS SETUP =====
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    ctx.lineWidth = strokeWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = selectedColor;

    const resizeCanvas = () => {
      const rect = canvas.parentElement?.getBoundingClientRect();
      if (!rect) return;
      const dpr = window.devicePixelRatio || 1;
      const newWidth = rect.width;
      const newHeight = rect.height;
      
      if (canvas.width !== newWidth * dpr || canvas.height !== newHeight * dpr) {
        canvas.width = newWidth * dpr;
        canvas.height = newHeight * dpr;
        canvas.style.width = newWidth + 'px';
        canvas.style.height = newHeight + 'px';
        ctx.scale(dpr, dpr);
        
        if (canvasDataRef.current) {
          ctx.putImageData(canvasDataRef.current, 0, 0);
        } else {
          drawWatermark();
        }
      }
    };
    
    const handleResize = () => {
      if (resizeTimeoutRef.current) {
        cancelAnimationFrame(resizeTimeoutRef.current);
      }
      resizeTimeoutRef.current = requestAnimationFrame(resizeCanvas);
    };
    
    resizeCanvas();
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      if (resizeTimeoutRef.current) {
        cancelAnimationFrame(resizeTimeoutRef.current);
        resizeTimeoutRef.current = null;
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [strokeWidth, selectedColor, drawWatermark]);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (!isMobile) {
      setShowChat(false);
    }
  }, [isMobile]);

  // ===== SAVE CANVAS STATE =====
  const saveCanvasState = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const dataUrl = canvas.toDataURL();
    const newHistory = canvasHistory.slice(0, historyIndex + 1);
    newHistory.push(dataUrl);
    
    if (newHistory.length > maxHistory) {
      newHistory.shift();
    }
    
    setCanvasHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  }, [canvasHistory, historyIndex, maxHistory]);

  // ============================================
  // WHITEBOARD - DISABLED FOR STUDENTS
  // ============================================
  const startDrawing = (e) => {
    if (!isTutorUser) return;
    if (tokens < 1) {
      alert('Rate limit exceeded. Please wait a moment.');
      return;
    }
    
    setTokens(prev => prev - 1);
    
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const clientX = e.clientX || e.touches?.[0]?.clientX || 0;
    const clientY = e.clientY || e.touches?.[0]?.clientY || 0;
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    isDrawingRef.current = true;
    lastPosRef.current = { x, y };
    
    setSessionStats(prev => ({ ...prev, whiteboardActions: prev.whiteboardActions + 1 }));
  };

  const draw = (e) => {
    if (!isDrawingRef.current || !isTutorUser) return;
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
    saveCanvasState();
  };

  const clearWhiteboard = () => {
    if (!isTutorUser) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawWatermark();
    saveCanvasState();
  };

  // ===== UNDO/REDO =====
  const undo = () => {
    if (!isTutorUser) return;
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      restoreCanvasWithWatermark(canvasHistory[newIndex]);
    }
  };

  const redo = () => {
    if (!isTutorUser) return;
    if (historyIndex < canvasHistory.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      restoreCanvasWithWatermark(canvasHistory[newIndex]);
    }
  };

  // ===== KEYBOARD SHORTCUTS =====
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.ctrlKey && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
      }
      if (e.ctrlKey && e.key === 'y') {
        e.preventDefault();
        redo();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [historyIndex, canvasHistory]);

  // ===== CHAT =====
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
    
    setSessionStats(prev => ({ ...prev, messagesSent: prev.messagesSent + 1 }));

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
      
      const newQueue = [...handRaiseQueue, { id: Date.now(), name: 'You', time: getCurrentTime() }];
      setHandRaiseQueue(newQueue);
      setHandRaisePosition(newQueue.length);
      
      setSessionStats(prev => ({ ...prev, handRaises: prev.handRaises + 1 }));
      
      const message = {
        id: Date.now(),
        sender: 'system',
        name: 'System',
        message: `🙋 You raised your hand (Position: #${newQueue.length})`,
        time: getCurrentTime(),
        type: 'system',
      };
      setMessages(prev => [...prev, message]);
      
      setTimeout(() => {
        setIsHandRaised(false);
        setHandRaiseQueue(prev => prev.filter(item => item.id !== Date.now() - 1));
        setHandRaisePosition(null);
        
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
      setHandRaiseQueue(prev => prev.filter(item => item.name !== 'You'));
      setHandRaisePosition(null);
      
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

  // ===== FORMAT TIME =====
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // ============================================
  // RATING FUNCTIONS
  // ============================================
  const handleRatingChange = (category, value) => {
    setRatingData(prev => ({
      ...prev,
      [category]: value
    }));
  };

  const handleReviewChange = (e) => {
    setRatingData(prev => ({
      ...prev,
      review: e.target.value
    }));
  };

  const submitRating = async () => {
    if (ratingData.overall === 0) {
      alert('Please rate the overall experience');
      return;
    }

    setRatingLoading(true);

    try {
      const token = localStorage.getItem('accessToken');
      const sessionId = location.state?.sessionId || 'temp_session';

      const response = await fetch(`${API_BASE_URL}/ratings`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          sessionId: sessionId,
          tutorId: tutor?.id || 'unknown',
          rating: ratingData.overall,
          review: ratingData.review,
          communication: ratingData.communication || 0,
          knowledge: ratingData.knowledge || 0,
          teaching: ratingData.teaching || 0,
          punctuality: ratingData.punctuality || 0
        })
      });

      if (response.ok) {
        setRatingSubmitted(true);
        setRatingLoading(false);
        
        await updateTutorRating(tutor?.id, ratingData.overall);
        
        setTimeout(() => {
          setShowRatingModal(false);
          navigate('/dashboard');
        }, 2000);
      } else {
        const error = await response.json();
        alert('Failed to submit rating: ' + (error.message || 'Please try again'));
        setRatingLoading(false);
      }
    } catch (error) {
      console.error('Rating submission error:', error);
      alert('Failed to submit rating. Please try again.');
      setRatingLoading(false);
    }
  };

  const updateTutorRating = async (tutorId, newRating) => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`${API_BASE_URL}/tutors/${tutorId}/rating`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          rating: newRating
        })
      });
      
      if (response.ok) {
        console.log('✅ Tutor rating updated successfully');
      }
    } catch (error) {
      console.error('Failed to update tutor rating:', error);
    }
  };

  const renderStars = (rating, category) => {
    const stars = [];
    const hover = category === 'overall' ? hoveredStar : 0;
    const value = category === 'overall' ? (hover || rating) : rating;

    for (let i = 1; i <= 5; i++) {
      stars.push(
        <span
          key={i}
          className={`star ${i <= value ? 'filled' : ''}`}
          onMouseEnter={() => category === 'overall' && setHoveredStar(i)}
          onMouseLeave={() => category === 'overall' && setHoveredStar(0)}
          onClick={() => handleRatingChange(category, i)}
          style={{
            cursor: 'pointer',
            fontSize: '28px',
            color: i <= value ? '#f59e0b' : '#4b5563',
            transition: 'color 0.2s ease'
          }}
        >
          ★
        </span>
      );
    }
    return stars;
  };

  // ===== SKIP RATING =====
  const skipRating = () => {
    setShowRatingModal(false);
    navigate('/dashboard');
  };

  // ============================================
  // END SESSION - FIXED
  // ============================================
  const endSession = async () => {
    if (sessionEnded) return;
    
    const duration = Math.floor((Date.now() - sessionStats.startTime) / 1000);
    setSessionStats(prev => ({ ...prev, duration }));
    setSessionEnded(true);
    
    // Always show rating modal immediately
    setShowRatingModal(true);
    setShowSummary(false);
    
    // Try to end the session in the backend (don't wait for it)
    try {
      const token = localStorage.getItem('accessToken');
      const sessionId = location.state?.sessionId || 'temp_session';
      
      const pathParts = window.location.pathname.split('/');
      const urlSessionId = pathParts[pathParts.length - 1];
      const finalSessionId = sessionId !== 'temp_session' ? sessionId : urlSessionId;
      
      if (finalSessionId && finalSessionId !== 'temp_session' && finalSessionId !== 'TutorSession') {
        const response = await fetch(`${API_BASE_URL}/sessions/end`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            sessionId: finalSessionId,
            duration: duration
          })
        });
        
        if (response.ok) {
          console.log('✅ Session ended successfully');
        } else {
          console.log('⚠️ Session end API returned error, but session is closed locally');
        }
      }
    } catch (error) {
      console.error('Error ending session:', error);
      // Continue - session is already ended locally
    }
  };

  // ============================================
  // RATING MODAL
  // ============================================
  const RatingModal = () => (
    <div className="rating-modal-overlay">
      <div className="rating-modal">
        <div className="rating-modal-header">
          <h2>⭐ Rate Your Session</h2>
          <p>How was your session with {tutor?.name}?</p>
        </div>

        <div className="rating-modal-body">
          {!ratingSubmitted ? (
            <>
              <div className="rating-category">
                <label>Overall Experience</label>
                <div className="stars-container">
                  {renderStars(ratingData.overall, 'overall')}
                  <span className="rating-label">
                    {ratingData.overall > 0 ? `${ratingData.overall}.0` : 'Select'}
                  </span>
                </div>
              </div>

              <div className="rating-category">
                <label>💬 Communication</label>
                <div className="stars-container">
                  {renderStars(ratingData.communication, 'communication')}
                </div>
              </div>

              <div className="rating-category">
                <label>📚 Subject Knowledge</label>
                <div className="stars-container">
                  {renderStars(ratingData.knowledge, 'knowledge')}
                </div>
              </div>

              <div className="rating-category">
                <label>📖 Teaching Style</label>
                <div className="stars-container">
                  {renderStars(ratingData.teaching, 'teaching')}
                </div>
              </div>

              <div className="rating-category">
                <label>⏰ Punctuality</label>
                <div className="stars-container">
                  {renderStars(ratingData.punctuality, 'punctuality')}
                </div>
              </div>

              <div className="rating-review">
                <label>Write a Review (Optional)</label>
                <textarea
                  placeholder="Share your experience with this tutor..."
                  value={ratingData.review}
                  onChange={handleReviewChange}
                  rows="3"
                />
              </div>
            </>
          ) : (
            <div className="rating-success">
              <div className="success-icon">✅</div>
              <h3>Thank You for Your Rating!</h3>
              <p>Your feedback helps other students find the right tutor.</p>
            </div>
          )}
        </div>

        <div className="rating-modal-footer">
          {!ratingSubmitted ? (
            <>
              <button className="btn-skip" onClick={skipRating} disabled={ratingLoading}>
                Skip
              </button>
              <button 
                className="btn-submit-rating" 
                onClick={submitRating} 
                disabled={ratingLoading || ratingData.overall === 0}
              >
                {ratingLoading ? 'Submitting...' : 'Submit Rating'}
              </button>
            </>
          ) : (
            <button className="btn-done" onClick={() => navigate('/dashboard')}>
              Go to Dashboard
            </button>
          )}
        </div>
      </div>
    </div>
  );

  // ============================================
  // RENDER
  // ============================================
  if (!tutor) {
    return (
      <div className="session-loading">
        <h2>⏳ Loading session...</h2>
        <button onClick={() => navigate('/tutors')}>Back to Tutors</button>
      </div>
    );
  }

  const qualityColor = connectionQuality === 'excellent' ? '#27ae60' : connectionQuality === 'good' ? '#f59e0b' : '#ef4444';

  return (
    <div className={`session-container ${isDark ? 'dark' : 'light'}`}>
      {showRatingModal && <RatingModal />}

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
              {handRaisePosition && <span className="queue-position-badge">Queue: #{handRaisePosition}</span>}
            </div>
          </div>
        </div>
        <div className="session-header-right">
          <span className="video-free-badge" title="Video is permanently disabled for optimal performance (15MB/hr)">
            🎧 Audio + Whiteboard
          </span>
          {shiftInfo.active && (
            <span className={`shift-timer ${isShiftOverlapping ? 'overlapping' : ''}`}>
              {shiftInfo.name} {isShiftOverlapping && '⏰ Overlap'}
            </span>
          )}
          <span className="connection-quality" style={{ color: qualityColor }}>
            <span className="quality-dot" style={{ background: qualityColor }}></span>
            {latency}ms
          </span>
          <button className="btn-settings" onClick={() => setShowSettings(true)} title="Settings">⚙️</button>
          {isMobile && (
            <button className="mobile-chat-toggle" onClick={() => setShowChat(!showChat)} aria-label="Toggle chat">
              💬 <span className="chat-badge">{messages.filter(m => m.type !== 'system').length}</span>
            </button>
          )}
          <button className="btn-end" onClick={endSession} disabled={sessionEnded}>End Session</button>
        </div>
      </header>

      <div className={`session-grid ${showChat ? 'chat-open' : ''}`}>
        <div className="session-main" style={{ position: 'relative' }}>
          <div className="floating-tutor-card">
            <div className="tutor-avatar-small">
              {renderTutorAvatar(tutor)}
              <span className="tutor-status-dot-small"></span>
            </div>
            <div className="tutor-card-info">
              <span className="tutor-card-name">{tutor.name}</span>
              <span className="tutor-card-role">{isTutorUser ? 'Tutor' : 'Student'}</span>
            </div>
            <div className="tutor-card-controls">
              <button className={`tutor-control-btn ${isMuted ? 'muted' : ''}`} onClick={() => setIsMuted(!isMuted)} title="Mute">
                {isMuted ? '🔇' : '🔊'}
              </button>
              {!isTutorUser && (
                <button className={`tutor-control-btn ${isHandRaised ? 'raised' : ''}`} onClick={toggleRaiseHand} title="Raise Hand">
                  {isHandRaised ? '🙋' : '🤚'}
                </button>
              )}
            </div>
          </div>

          <div className="video-free-overlay">
            <span>🎧 Audio Only</span>
            <span className="video-free-sub">15MB/hr • Ultra-Low Bandwidth</span>
          </div>

          <div className="token-indicator-float" title={`${tokens} tokens remaining`}>
            <span className={`token-dot ${tokens < 3 ? 'low' : tokens < 8 ? 'medium' : 'high'}`}></span>
            <span className="token-count">{tokens}</span>
          </div>

          <div className="whiteboard-area" style={{ height: '100%' }}>
            <div className="whiteboard-header">
              <h4>✏️ Interactive Whiteboard {!isTutorUser && <span style={{ fontSize: '11px', color: '#ef4444' }}>(View Only)</span>}</h4>
              <div className="whiteboard-tools">
                {isTutorUser ? (
                  <>
                    <button className={`tool-btn ${currentTool === 'pen' ? 'active' : ''}`} onClick={() => setCurrentTool('pen')} title="Pen">✏️</button>
                    <button className={`tool-btn ${currentTool === 'eraser' ? 'active' : ''}`} onClick={() => setCurrentTool('eraser')} title="Eraser">🧹</button>
                    <button className={`tool-btn ${currentTool === 'shape' ? 'active' : ''}`} onClick={() => setCurrentTool('shape')} title="Shape">⬛</button>
                    <button className={`tool-btn ${currentTool === 'text' ? 'active' : ''}`} onClick={() => setCurrentTool('text')} title="Text">T</button>
                    <button className={`tool-btn ${showGrid ? 'active' : ''}`} onClick={() => setShowGrid(!showGrid)} title="Grid">⊞</button>
                    <button className="tool-btn" onClick={() => setZoomLevel(Math.min(2, zoomLevel + 0.1))} title="Zoom In">➕</button>
                    <button className="tool-btn" onClick={() => setZoomLevel(Math.max(0.5, zoomLevel - 0.1))} title="Zoom Out">➖</button>
                    <input type="color" value={selectedColor} onChange={(e) => setSelectedColor(e.target.value)} className="color-picker" title="Color" />
                    <select value={strokeWidth} onChange={(e) => setStrokeWidth(Number(e.target.value))} className="stroke-select">
                      <option value={2}>Thin</option>
                      <option value={4}>Medium</option>
                      <option value={6}>Thick</option>
                    </select>
                    <button className="tool-btn" onClick={undo} title="Undo (Ctrl+Z)">↩️</button>
                    <button className="tool-btn" onClick={redo} title="Redo (Ctrl+Y)">↪️</button>
                    <button className="tool-btn clear" onClick={clearWhiteboard} title="Clear">🗑️</button>
                  </>
                ) : (
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>👀 View Only</span>
                )}
              </div>
            </div>
            <div className="whiteboard-wrapper" style={{ transform: `scale(${zoomLevel})`, height: 'calc(100% - 40px)' }}>
              <canvas
                ref={canvasRef}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
                style={{ cursor: isTutorUser ? 'crosshair' : 'default' }}
              />
            </div>
          </div>

          <div className="bottom-control-dock">
            <button className={`dock-btn ${isMuted ? 'active' : ''}`} onClick={() => setIsMuted(!isMuted)} title="Mute">
              {isMuted ? '🔇' : '🔊'}
            </button>
            {!isTutorUser && (
              <button className={`dock-btn ${isHandRaised ? 'raised' : ''}`} onClick={toggleRaiseHand} title="Raise Hand">
                {isHandRaised ? '🙋' : '🤚'}
              </button>
            )}
            <button className={`dock-btn ${isScreenSharing ? 'active' : ''}`} onClick={() => setIsScreenSharing(!isScreenSharing)} title="Share Screen">
              {isScreenSharing ? '🖥️' : '🖥️'}
            </button>
            <button className={`dock-btn ${isRecording ? 'active recording' : ''}`} onClick={() => setIsRecording(!isRecording)} title="Recording">
              {isRecording ? '⏹' : '⏺'}
            </button>
            <button className="dock-btn leave-btn" onClick={endSession} disabled={sessionEnded} title="Leave Session">Leave</button>
          </div>
        </div>

        <div className={`session-sidebar ${isMobile ? 'mobile-sidebar' : ''} ${showChat ? 'mobile-open' : ''}`}>
          <div className="participants-list">
            <h4>👥 Participants</h4>
            {participants.map(p => (
              <div key={p.id} className="participant-item">
                <span className={`status-dot ${p.online ? 'online' : 'offline'}`}></span>
                <span>{p.name}</span>
                {p.role === 'tutor' && <span className="role-badge">Tutor</span>}
                {handRaiseQueue.some(item => item.name === p.name) && (
                  <span className="hand-raised-indicator">🙋</span>
                )}
              </div>
            ))}
            {handRaiseQueue.length > 0 && (
              <div className="hand-raise-queue">
                <div className="queue-header">🙋 Hand Raise Queue</div>
                {handRaiseQueue.map((item, index) => (
                  <div key={item.id} className="queue-item">
                    <span className="queue-position">#{index + 1}</span>
                    <span className="queue-name">{item.name}</span>
                    <span className="queue-time">{item.time}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="chat-container">
            <div className="chat-header">
              <h4>💬 Live Chat</h4>
              <span className="chat-count">{messages.filter(m => m.type !== 'system').length} messages</span>
              {isMobile && <button className="close-chat-btn" onClick={() => setShowChat(false)}>✕</button>}
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
                          renderTutorAvatar(tutor)
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
                  {renderTutorAvatar(tutor)}
                  <span className="typing-dots"><span>.</span><span>.</span><span>.</span></span>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <form onSubmit={sendMessage} className="chat-input-area">
              <button type="button" className="emoji-btn" onClick={() => setShowEmojiPicker(!showEmojiPicker)}>😊</button>
              {showEmojiPicker && (
                <div className="emoji-picker" ref={emojiPickerRef}>
                  <div className="emoji-grid">
                    {EMOJIS.map((emoji) => (
                      <button key={emoji} onClick={() => insertEmoji(emoji)} type="button" className="emoji-item">
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <input ref={chatInputRef} type="text" value={newMessage} onChange={(e) => setNewMessage(e.target.value)} onKeyDown={handleKeyPress} placeholder="Type your message..." className="chat-input" />
              <button type="submit" className="send-btn" disabled={!newMessage.trim()}>Send</button>
            </form>
          </div>
        </div>
      </div>

      {showSettings && <SessionSettings onClose={() => setShowSettings(false)} />}
    </div>
  );
};

export default TutorSession;