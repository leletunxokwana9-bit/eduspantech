// src/hooks/useWebRTC.js - COMPLETE FIXED VERSION
import { useState, useEffect, useRef, useCallback } from 'react';

const useWebRTC = (sessionId, role, userId) => {
  const [ws, setWs] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [participants, setParticipants] = useState([]);
  const [error, setError] = useState(null);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [tutorJoined, setTutorJoined] = useState(false);
  
  const peerConnections = useRef({});
  const localStream = useRef(null);
  const remoteStreams = useRef({});
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;
  const audioElements = useRef({});

  const WS_URL = process.env.REACT_APP_WS_URL || 
    (process.env.REACT_APP_API_URL?.replace('http', 'ws') || 'ws://localhost:3000');

  const connectWebSocket = useCallback(() => {
    // ✅ Ensure userId and role are properly encoded
    const encodedUserId = encodeURIComponent(userId || 'unknown');
    const encodedRole = encodeURIComponent(role || 'student');
    const encodedRoomId = encodeURIComponent(sessionId || 'default');
    
    const wsUrl = `${WS_URL}/webrtc?userId=${encodedUserId}&roomId=${encodedRoomId}&role=${encodedRole}`;
    console.log(`🔗 Connecting to WebSocket: ${wsUrl}`);
    console.log(`👤 Role: ${role}, UserId: ${userId}`);
    
    const socket = new WebSocket(wsUrl);
    
    socket.onopen = () => {
      console.log('🔗 WebSocket connected');
      setIsConnected(true);
      setConnectionStatus('connected');
      setError(null);
      reconnectAttempts.current = 0;
      initializeAudio();
    };

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('📨 Received message:', data.type);
        handleWebSocketMessage(data);
      } catch (error) {
        console.error('❌ Failed to parse WebSocket message:', error);
      }
    };

    socket.onclose = (event) => {
      console.log(`🔌 WebSocket closed: ${event.code} ${event.reason || 'No reason'}`);
      setIsConnected(false);
      setConnectionStatus('disconnected');
      
      // Auto-reconnect
      if (reconnectAttempts.current < maxReconnectAttempts) {
        reconnectAttempts.current++;
        console.log(`🔄 Reconnecting attempt ${reconnectAttempts.current}/${maxReconnectAttempts}...`);
        setTimeout(() => connectWebSocket(), 2000 * reconnectAttempts.current);
      } else {
        console.log('❌ Max reconnect attempts reached');
        setError('Failed to connect to WebRTC server');
      }
    };

    socket.onerror = (error) => {
      console.error('❌ WebSocket error:', error);
      setError('WebSocket connection error');
    };

    setWs(socket);
    return socket;
  }, [WS_URL, userId, sessionId, role]);

  const handleWebSocketMessage = useCallback((data) => {
    switch (data.type) {
      case 'connected':
        console.log('✅ Connected to server:', data.userId);
        console.log('✅ Role:', data.role);
        break;

      case 'room-joined':
        console.log('✅ Joined room:', data.roomId);
        console.log('✅ Role in room:', data.role);
        setParticipants(data.participants || []);
        break;

      case 'participants-update':
        console.log('👥 Participants update:', data.participants);
        setParticipants(data.participants || []);
        break;

      // ✅ Tutor joined event
      case 'tutor-joined':
        console.log('👨‍🏫 TUTOR JOINED THE SESSION!');
        setTutorJoined(true);
        window.dispatchEvent(new CustomEvent('tutor-joined', {
          detail: { tutorId: data.tutorId }
        }));
        break;

      // ✅ Tutor left event
      case 'tutor-left':
        console.log('👨‍🏫 TUTOR LEFT THE SESSION');
        setTutorJoined(false);
        window.dispatchEvent(new CustomEvent('tutor-left'));
        break;

      // WebRTC Signaling
      case 'offer':
        console.log('📞 Received offer from:', data.fromUserId);
        handleOffer(data);
        break;

      case 'answer':
        console.log('📞 Received answer from:', data.fromUserId);
        handleAnswer(data);
        break;

      case 'ice-candidate':
        console.log('🧊 Received ICE candidate from:', data.fromUserId);
        handleIceCandidate(data);
        break;

      // Whiteboard events
      case 'whiteboard-update':
        window.dispatchEvent(new CustomEvent('whiteboard-update', {
          detail: { action: data.action, data: data.data, timestamp: data.timestamp }
        }));
        break;

      case 'whiteboard-sync':
        window.dispatchEvent(new CustomEvent('whiteboard-sync', {
          detail: { data: data.data, timestamp: data.timestamp }
        }));
        break;

      case 'whiteboard-clear':
        window.dispatchEvent(new CustomEvent('clear-whiteboard'));
        break;

      // Chat events
      case 'chat-message':
        window.dispatchEvent(new CustomEvent('chat-message', { detail: data }));
        break;

      case 'chat-history':
        window.dispatchEvent(new CustomEvent('chat-history', { detail: data.messages }));
        break;

      case 'typing-start':
        window.dispatchEvent(new CustomEvent('typing-start', { detail: data }));
        break;

      case 'typing-stop':
        window.dispatchEvent(new CustomEvent('typing-stop'));
        break;

      case 'hand-raise':
        window.dispatchEvent(new CustomEvent('hand-raise', { detail: data }));
        break;

      case 'audio-toggle':
        setParticipants(prev => prev.map(p => 
          p.userId === data.userId ? { ...p, audioEnabled: data.enabled } : p
        ));
        break;

      case 'session-ended':
        window.dispatchEvent(new CustomEvent('session-ended'));
        break;

      case 'error':
        console.error('Server error:', data.message);
        setError(data.message);
        break;

      default:
        console.log('Unknown message type:', data.type);
    }
  }, []);

  // ============================================
  // WEBRTC HANDLERS
  // ============================================

  const initializeAudio = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });
      localStream.current = stream;
      setIsAudioEnabled(true);
      console.log('🎤 Audio initialized');
    } catch (error) {
      console.warn('⚠️ No microphone available, continuing without audio:', error.message);
      setError('Microphone not available. Voice features disabled.');
    }
  }, []);

  const createPeerConnection = useCallback(async (targetUserId) => {
    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' }
      ]
    });

    if (localStream.current) {
      localStream.current.getTracks().forEach(track => {
        pc.addTrack(track, localStream.current);
      });
    }

    pc.ontrack = (event) => {
      remoteStreams.current[targetUserId] = event.streams[0];
      
      if (!audioElements.current[targetUserId]) {
        const audio = new Audio();
        audio.autoplay = true;
        audio.srcObject = event.streams[0];
        audio.play().catch(e => console.log('Audio play error:', e));
        audioElements.current[targetUserId] = audio;
      }
      
      window.dispatchEvent(new CustomEvent('remote-audio', {
        detail: { userId: targetUserId, stream: event.streams[0] }
      }));
    };

    pc.onicecandidate = (event) => {
      if (event.candidate && ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
          type: 'ice-candidate',
          targetUserId: targetUserId,
          candidate: event.candidate,
          roomId: sessionId
        }));
      }
    };

    peerConnections.current[targetUserId] = pc;
    return pc;
  }, [ws, sessionId]);

  const handleOffer = useCallback(async (data) => {
    const { fromUserId, offer } = data;
    try {
      let pc = peerConnections.current[fromUserId];
      if (!pc) {
        pc = await createPeerConnection(fromUserId);
      }
      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
          type: 'answer',
          targetUserId: fromUserId,
          answer: pc.localDescription,
          roomId: sessionId
        }));
      }
    } catch (error) {
      console.error('Error handling offer:', error);
    }
  }, [createPeerConnection, ws, sessionId]);

  const handleAnswer = useCallback(async (data) => {
    const { fromUserId, answer } = data;
    try {
      const pc = peerConnections.current[fromUserId];
      if (pc) {
        await pc.setRemoteDescription(new RTCSessionDescription(answer));
      }
    } catch (error) {
      console.error('Error handling answer:', error);
    }
  }, []);

  const handleIceCandidate = useCallback(async (data) => {
    const { fromUserId, candidate } = data;
    try {
      const pc = peerConnections.current[fromUserId];
      if (pc) {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      }
    } catch (error) {
      console.error('Error handling ICE candidate:', error);
    }
  }, []);

  // ============================================
  // PUBLIC METHODS
  // ============================================

  const toggleAudio = useCallback(() => {
    if (localStream.current) {
      const tracks = localStream.current.getTracks();
      tracks.forEach(track => {
        track.enabled = !isAudioEnabled;
      });
      setIsAudioEnabled(!isAudioEnabled);
      
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
          type: 'audio-toggle',
          enabled: !isAudioEnabled
        }));
      }
    }
  }, [isAudioEnabled, ws]);

  const broadcastWhiteboardUpdate = useCallback((action, data) => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        type: 'whiteboard-draw',
        action: action,
        paths: data,
        timestamp: Date.now()
      }));
    }
  }, [ws]);

  const clearWhiteboard = useCallback(() => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        type: 'whiteboard-clear'
      }));
    }
  }, [ws]);

  const sendChatMessage = useCallback((message, name) => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        type: 'chat-message',
        message: message,
        name: name || 'You',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }));
    }
  }, [ws]);

  const raiseHand = useCallback((raised) => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        type: 'hand-raise',
        raised: raised
      }));
    }
  }, [ws]);

  const sendTyping = useCallback((isTyping) => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        type: isTyping ? 'typing-start' : 'typing-stop'
      }));
    }
  }, [ws]);

  const leaveSession = useCallback(() => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'leave-room' }));
      ws.close();
    }
    if (localStream.current) {
      localStream.current.getTracks().forEach(track => track.stop());
    }
    Object.values(peerConnections.current).forEach(pc => pc.close());
    peerConnections.current = {};
    
    Object.values(audioElements.current).forEach(audio => {
      audio.pause();
      audio.srcObject = null;
    });
    audioElements.current = {};
  }, [ws]);

  return {
    isConnected,
    participants,
    error,
    isAudioEnabled,
    connectionStatus,
    tutorJoined,
    toggleAudio,
    leaveSession,
    broadcastWhiteboardUpdate,
    clearWhiteboard,
    sendChatMessage,
    raiseHand,
    sendTyping,
    ws
  };
};

export default useWebRTC;