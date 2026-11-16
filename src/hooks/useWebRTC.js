// src/hooks/useWebRTC.js
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
  const socketRef = useRef(null);

  const WS_URL =
    process.env.REACT_APP_WS_URL ||
    (process.env.REACT_APP_API_URL?.replace('http', 'ws') || 'ws://localhost:3000');

  const handleWebSocketMessage = useCallback((data) => {
    switch (data.type) {
      case 'connected':
        console.log('✅ Connected to server:', data.userId, '| role:', data.role);
        break;

      case 'room-joined':
        console.log('✅ Joined room:', data.roomId, '| role:', data.role);
        setParticipants(data.participants || []);
        break;

      case 'participants-update':
        console.log('👥 Participants update:', data.participants);
        setParticipants(data.participants || []);
        break;

      case 'tutor-joined':
        console.log('👨‍🏫 TUTOR JOINED THE SESSION!');
        setTutorJoined(true);
        window.dispatchEvent(new CustomEvent('tutor-joined', {
          detail: { tutorId: data.tutorId, name: data.name }
        }));
        break;

      case 'student-joined':
        window.dispatchEvent(new CustomEvent('student-joined', { detail: data }));
        break;

      case 'tutor-left':
        console.log('👨‍🏫 TUTOR LEFT THE SESSION');
        setTutorJoined(false);
        window.dispatchEvent(new CustomEvent('tutor-left'));
        break;

      case 'student-left':
        window.dispatchEvent(new CustomEvent('student-left', { detail: data }));
        break;

      // ✅ FIX: ignore signaling messages echoed back to the sender
      case 'offer':
        if (data.fromUserId === userId) break;
        console.log('📞 Received offer from:', data.fromUserId);
        handleOffer(data);
        break;

      case 'answer':
        if (data.fromUserId === userId) break;
        console.log('📞 Received answer from:', data.fromUserId);
        handleAnswer(data);
        break;

      case 'ice-candidate':
        if (data.fromUserId === userId) break;
        console.log('🧊 Received ICE candidate from:', data.fromUserId);
        handleIceCandidate(data);
        break;

      case 'whiteboard-update':
        window.dispatchEvent(new CustomEvent('whiteboard-update', {
          detail: {
            action: data.action || 'sync',
            data: Array.isArray(data.data) ? data.data : [],
            pathCount: data.pathCount,
            timestamp: data.timestamp
          }
        }));
        break;

      case 'whiteboard-sync':
        window.dispatchEvent(new CustomEvent('whiteboard-sync', {
          detail: {
            data: Array.isArray(data.data) ? data.data : [],
            timestamp: data.timestamp
          }
        }));
        break;

      case 'whiteboard-clear':
        window.dispatchEvent(new CustomEvent('clear-whiteboard'));
        break;

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const connectWebSocket = useCallback(() => {
    const encodedUserId = encodeURIComponent(userId || 'unknown');
    const encodedRole = encodeURIComponent(role || 'student');
    const encodedRoomId = encodeURIComponent(sessionId || 'default');

    const wsUrl = `${WS_URL}/webrtc?userId=${encodedUserId}&roomId=${encodedRoomId}&role=${encodedRole}`;
    console.log(`🔗 Connecting to WebSocket: ${wsUrl}`);

    const socket = new WebSocket(wsUrl);
    socketRef.current = socket;

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

      if (event.code !== 1000 && reconnectAttempts.current < maxReconnectAttempts) {
        reconnectAttempts.current++;
        const delay = 2000 * reconnectAttempts.current;
        console.log(`🔄 Reconnecting attempt ${reconnectAttempts.current}/${maxReconnectAttempts} in ${delay}ms...`);
        setTimeout(() => connectWebSocket(), delay);
      } else if (reconnectAttempts.current >= maxReconnectAttempts) {
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [WS_URL, userId, sessionId, role, handleWebSocketMessage]);

  useEffect(() => {
    if (!sessionId || !userId) {
      console.log('⏸️ useWebRTC: waiting for sessionId/userId', { sessionId, userId });
      return;
    }

    console.log('🚀 useWebRTC: initializing connection', { sessionId, role, userId });
    const socket = connectWebSocket();

    return () => {
      console.log('🧹 useWebRTC: cleaning up connection');
      try {
        if (socket && socket.readyState === WebSocket.OPEN) {
          socket.send(JSON.stringify({ type: 'leave-room' }));
          socket.close(1000, 'component-unmount');
        }
      } catch (e) {}
      if (localStream.current) {
        localStream.current.getTracks().forEach(t => t.stop());
        localStream.current = null;
      }
      Object.values(peerConnections.current).forEach(pc => pc.close());
      peerConnections.current = {};
      Object.values(audioElements.current).forEach(audio => {
        try { audio.pause(); audio.srcObject = null; } catch (e) {}
      });
      audioElements.current = {};
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId, userId, role]);

  const initializeAudio = useCallback(async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      console.warn('⚠️ getUserMedia not available on this device');
      setError('Microphone not available. Voice features disabled.');
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true }
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
      localStream.current.getTracks().forEach(track => pc.addTrack(track, localStream.current));
    }

    pc.onconnectionstatechange = () => {
      const state = pc.connectionState;
      console.log('🔗 Peer connection state:', targetUserId, state);
      if (state === 'connected') setConnectionStatus('connected');
      else if (state === 'failed' || state === 'disconnected' || state === 'closed') setConnectionStatus('connecting');
      else if (state === 'connecting') setConnectionStatus('connecting');
    };

    // ✅ FIXED: Strict Echo Prevention
    pc.ontrack = (event) => {
      console.log(`🎧 Received remote track from ${targetUserId}:`, event.track.kind);

      // 1. Block playback of our own local microphone track
      if (localStream.current) {
        const localTrackIds = localStream.current.getTracks().map(t => t.id);
        if (localTrackIds.includes(event.track.id)) {
          console.warn('⚠️ Blocked attempt to play local microphone track (echo prevention)');
          return;
        }
      }

      // 2. Only play the remote stream
      if (event.streams && event.streams[0]) {
        remoteStreams.current[targetUserId] = event.streams[0];
        
        if (!audioElements.current[targetUserId]) {
          const audio = new Audio();
          audio.autoplay = true;
          audio.srcObject = event.streams[0];
          
          audio.play().catch(e => {
            console.warn('🔇 Autoplay blocked. Waiting for user interaction...', e);
            const enableAudio = () => {
              audio.play();
              document.removeEventListener('click', enableAudio);
            };
            document.addEventListener('click', enableAudio);
          });
          
          audioElements.current[targetUserId] = audio;
        }
        
        window.dispatchEvent(new CustomEvent('remote-audio', {
          detail: { userId: targetUserId, stream: event.streams[0] }
        }));
      }
    };

    pc.onicecandidate = (event) => {
      if (event.candidate && socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
        socketRef.current.send(JSON.stringify({
          type: 'ice-candidate',
          targetUserId,
          candidate: event.candidate,
          roomId: sessionId
        }));
      }
    };

    peerConnections.current[targetUserId] = pc;
    return pc;
  }, [sessionId]);

  const handleOffer = useCallback(async (data) => {
    const { fromUserId, offer } = data;
    try {
      let pc = peerConnections.current[fromUserId];
      if (!pc) pc = await createPeerConnection(fromUserId);
      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
        socketRef.current.send(JSON.stringify({
          type: 'answer',
          targetUserId: fromUserId,
          answer: pc.localDescription,
          roomId: sessionId
        }));
      }
    } catch (error) {
      console.error('Error handling offer:', error);
    }
  }, [createPeerConnection, sessionId]);

  const handleAnswer = useCallback(async (data) => {
    const { fromUserId, answer } = data;
    try {
      const pc = peerConnections.current[fromUserId];
      if (pc) await pc.setRemoteDescription(new RTCSessionDescription(answer));
    } catch (error) {
      console.error('Error handling answer:', error);
    }
  }, []);

  const handleIceCandidate = useCallback(async (data) => {
    const { fromUserId, candidate } = data;
    try {
      const pc = peerConnections.current[fromUserId];
      if (pc) await pc.addIceCandidate(new RTCIceCandidate(candidate));
    } catch (error) {
      console.error('Error handling ICE candidate:', error);
    }
  }, []);

  useEffect(() => {
    const handleRequestOffer = async (e) => {
      const { targetUserId } = e.detail || {};
      if (!targetUserId) return;
      if (peerConnections.current[targetUserId]) return;
      try {
        console.log('📞 Creating offer for:', targetUserId);
        const pc = await createPeerConnection(targetUserId);
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        if (socketRef.current?.readyState === WebSocket.OPEN) {
          socketRef.current.send(JSON.stringify({
            type: 'offer',
            targetUserId,
            offer: pc.localDescription,
            roomId: sessionId
          }));
        }
      } catch (err) {
        console.error('Offer creation failed:', err);
      }
    };
    window.addEventListener('request-offer', handleRequestOffer);
    return () => window.removeEventListener('request-offer', handleRequestOffer);
  }, [createPeerConnection, sessionId]);

  const toggleAudio = useCallback(() => {
    if (localStream.current) {
      localStream.current.getTracks().forEach(track => { track.enabled = !isAudioEnabled; });
      setIsAudioEnabled(!isAudioEnabled);
      if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
        socketRef.current.send(JSON.stringify({ type: 'audio-toggle', enabled: !isAudioEnabled }));
      }
    } else {
      setError('No microphone to toggle');
    }
  }, [isAudioEnabled]);

  const broadcastWhiteboardUpdate = useCallback((action, data) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({
        type: 'whiteboard-update',
        action: action || 'draw',
        data: Array.isArray(data) ? data : [],
        timestamp: Date.now()
      }));
    }
  }, []);

  const clearWhiteboard = useCallback(() => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({ type: 'whiteboard-clear' }));
    }
  }, []);

  const sendChatMessage = useCallback((message, name) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({
        type: 'chat-message',
        message,
        name: name || 'You',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }));
    }
  }, []);

  const raiseHand = useCallback((raised) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({ type: 'hand-raise', raised }));
    }
  }, []);

  const sendTyping = useCallback((isTyping) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({ type: isTyping ? 'typing-start' : 'typing-stop' }));
    }
  }, []);

  const leaveSession = useCallback(() => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({ type: 'leave-room' }));
      socketRef.current.close(1000, 'user-left');
    }
    if (localStream.current) {
      localStream.current.getTracks().forEach(track => track.stop());
      localStream.current = null;
    }
    Object.values(peerConnections.current).forEach(pc => pc.close());
    peerConnections.current = {};
    Object.values(audioElements.current).forEach(audio => {
      try { audio.pause(); audio.srcObject = null; } catch (e) {}
    });
    audioElements.current = {};
  }, []);

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
