// src/hooks/useWebRTC.js - COMPLETE FULL VERSION
import { useState, useEffect, useRef, useCallback } from 'react';

const useWebRTC = (roomId, role, userId) => {
  // ===== STATE =====
  const [isConnected, setIsConnected] = useState(false);
  const [participants, setParticipants] = useState([]);
  const [error, setError] = useState(null);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');

  // ===== REFS =====
  const wsRef = useRef(null);
  const peerConnectionsRef = useRef(new Map());
  const localStreamRef = useRef(null);
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 5;
  const dataChannelsRef = useRef(new Map());
  const reconnectTimerRef = useRef(null);

  // ===== CONFIGURATION =====
  const WS_URL = process.env.REACT_APP_WS_URL || 
    'wss://eduspantech-backend.onrender.com/webrtc';

  // ============================================
  // WEBRTC CONFIGURATION
  // ============================================
  const getRTCConfiguration = () => ({
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      { urls: 'stun:stun2.l.google.com:19302' },
      { urls: 'stun:stun3.l.google.com:19302' },
      { urls: 'stun:stun4.l.google.com:19302' },
      {
        urls: 'turn:openrelay.metered.ca:80',
        username: 'openrelayproject',
        credential: 'openrelayproject'
      },
      {
        urls: 'turn:openrelay.metered.ca:443',
        username: 'openrelayproject',
        credential: 'openrelayproject'
      },
      {
        urls: 'turn:openrelay.metered.ca:443?transport=tcp',
        username: 'openrelayproject',
        credential: 'openrelayproject'
      }
    ],
    iceCandidatePoolSize: 10,
    iceTransportPolicy: 'all',
    bundlePolicy: 'max-bundle',
    rtcpMuxPolicy: 'require'
  });

  // ============================================
  // INIT WEBRTC - AUDIO OPTIONAL
  // ============================================
  const initWebRTC = useCallback(async () => {
    try {
      console.log('🎬 Initializing WebRTC...');
      
      // Try to get microphone, but don't fail if not available
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: false
        });
        localStreamRef.current = stream;
        setIsAudioEnabled(true);
        console.log('🎤 Microphone access granted');
      } catch (micError) {
        console.warn('⚠️ No microphone available, continuing without audio:', micError.message);
        setIsAudioEnabled(false);
        setError('⚠️ No microphone detected. Whiteboard will still work without audio.');
      }
      
      // Connect WebSocket for signaling
      connectWebSocket();

    } catch (err) {
      console.error('❌ Failed to initialize WebRTC:', err);
      setError('Failed to initialize. Please refresh and try again.');
    }
  }, []);

  // ============================================
  // WEBSOCKET CONNECTION
  // ============================================
  const connectWebSocket = useCallback(() => {
    try {
      console.log('🔗 Connecting to WebSocket:', WS_URL);
      
      // Close existing connection if any
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }

      wsRef.current = new WebSocket(WS_URL);

      wsRef.current.onopen = () => {
        console.log('✅ WebSocket connected successfully');
        setIsConnected(true);
        setConnectionStatus('connecting');
        reconnectAttemptsRef.current = 0;

        // Send join message
        const joinMessage = {
          type: 'join-room',
          roomId: roomId,
          role: role,
          userId: userId
        };
        console.log('📤 Sending join message:', joinMessage);
        wsRef.current.send(JSON.stringify(joinMessage));
      };

      wsRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('📨 Received WebSocket message:', data.type);
          handleSignalingMessage(data);
        } catch (err) {
          console.error('❌ WebSocket message parse error:', err);
        }
      };

      wsRef.current.onclose = (event) => {
        console.log('🔌 WebSocket closed:', event.code, event.reason || 'No reason');
        setIsConnected(false);
        setConnectionStatus('disconnected');
        
        // Clear reconnect timer if exists
        if (reconnectTimerRef.current) {
          clearTimeout(reconnectTimerRef.current);
          reconnectTimerRef.current = null;
        }
        
        handleReconnect();
      };

      wsRef.current.onerror = (error) => {
        console.error('❌ WebSocket error:', error);
        setError('WebSocket connection error. Reconnecting...');
      };

    } catch (err) {
      console.error('❌ WebSocket connection error:', err);
      setError('Failed to connect to signaling server');
      handleReconnect();
    }
  }, [roomId, role, userId]);

  // ============================================
  // HANDLE RECONNECT
  // ============================================
  const handleReconnect = useCallback(() => {
    if (reconnectAttemptsRef.current < maxReconnectAttempts) {
      reconnectAttemptsRef.current++;
      const delay = 3000 * reconnectAttemptsRef.current;
      console.log(`🔄 Reconnecting attempt ${reconnectAttemptsRef.current} in ${delay/1000}s...`);
      
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
      }
      
      reconnectTimerRef.current = setTimeout(() => {
        connectWebSocket();
      }, delay);
    } else {
      setError('❌ Connection lost. Please refresh the page.');
      console.error('❌ Max reconnect attempts reached');
    }
  }, [connectWebSocket]);

  // ============================================
  // HANDLE SIGNALING MESSAGES
  // ============================================
  const handleSignalingMessage = useCallback((data) => {
    switch (data.type) {
      case 'room-joined':
        setParticipants(data.participants || []);
        setConnectionStatus('connected');
        console.log('✅ Joined room:', data.roomId);
        console.log('👥 Participants:', data.participants?.length || 0);
        break;

      case 'participant-joined':
        console.log('👤 Participant joined:', data.userId, 'Role:', data.role);
        setParticipants(prev => {
          // Check if already exists
          if (prev.some(p => p.userId === data.userId)) return prev;
          return [...prev, {
            userId: data.userId,
            role: data.role,
            status: 'active',
            audioEnabled: true
          }];
        });
        
        // If a tutor joined and we're a student, create peer connection
        if (data.role === 'tutor' && role === 'student') {
          console.log('🎓 Tutor joined, creating peer connection...');
          createPeerConnection(data.userId, true);
        }
        break;

      case 'participant-left':
        console.log('👤 Participant left:', data.userId);
        setParticipants(prev => prev.filter(p => p.userId !== data.userId));
        
        // Close peer connection
        const pc = peerConnectionsRef.current.get(data.userId);
        if (pc) {
          pc.close();
          peerConnectionsRef.current.delete(data.userId);
        }
        // Close data channel
        const dc = dataChannelsRef.current.get(data.userId);
        if (dc) {
          dc.close();
          dataChannelsRef.current.delete(data.userId);
        }
        break;

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

      case 'whiteboard-update':
        console.log('🖍️ Whiteboard update received:', data.action);
        // Emit event for TutorSession component
        window.dispatchEvent(new CustomEvent('whiteboard-update', {
          detail: data
        }));
        break;

      case 'whiteboard-sync':
        console.log('🔄 Whiteboard sync received');
        window.dispatchEvent(new CustomEvent('whiteboard-sync', {
          detail: data
        }));
        break;

      case 'clear-whiteboard':
        console.log('🧹 Clear whiteboard received');
        window.dispatchEvent(new CustomEvent('clear-whiteboard'));
        break;

      case 'tutor-left':
        console.log('👨‍🏫 Tutor left the session');
        setError('Tutor has left the session.');
        setConnectionStatus('disconnected');
        break;

      case 'audio-toggle':
        console.log('🔊 Audio toggle:', data.userId, data.enabled);
        setParticipants(prev => prev.map(p => 
          p.userId === data.userId 
            ? { ...p, audioEnabled: data.enabled }
            : p
        ));
        break;

      case 'error':
        console.error('❌ Server error:', data.message);
        setError(data.message);
        break;

      default:
        console.log('⚠️ Unhandled message type:', data.type);
    }
  }, [role]);

  // ============================================
  // CREATE PEER CONNECTION
  // ============================================
  const createPeerConnection = useCallback((targetUserId, isInitiator = false) => {
    console.log('🔧 Creating peer connection to:', targetUserId, 'Initiator:', isInitiator);
    
    const configuration = getRTCConfiguration();
    const pc = new RTCPeerConnection(configuration);
    peerConnectionsRef.current.set(targetUserId, pc);

    // ===== ADD LOCAL AUDIO TRACK =====
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => {
        pc.addTrack(track, localStreamRef.current);
        console.log('🎵 Added track:', track.kind);
      });
    }

    // ===== HANDLE REMOTE TRACKS =====
    pc.ontrack = (event) => {
      console.log('📡 Remote track received:', event.track.kind);
      if (event.track.kind === 'audio') {
        const audioElement = document.createElement('audio');
        audioElement.srcObject = event.streams[0];
        audioElement.autoplay = true;
        audioElement.style.display = 'none';
        audioElement.id = `audio-${targetUserId}`;
        document.body.appendChild(audioElement);
        console.log('🔊 Audio element created for:', targetUserId);
      }
    };

    // ===== HANDLE ICE CANDIDATES =====
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        console.log('🧊 ICE candidate generated');
        sendSignalingMessage({
          type: 'ice-candidate',
          targetUserId: targetUserId,
          roomId: roomId,
          candidate: event.candidate
        });
      }
    };

    // ===== ICE CONNECTION STATE =====
    pc.oniceconnectionstatechange = () => {
      const state = pc.iceConnectionState;
      console.log(`🧊 ICE connection state: ${state}`);
      if (state === 'failed') {
        console.log('🔄 ICE failed, restarting...');
        pc.restartIce();
      }
      if (state === 'connected') {
        console.log('✅ ICE connected');
        setConnectionStatus('connected');
      }
    };

    // ===== CONNECTION STATE =====
    pc.onconnectionstatechange = () => {
      const state = pc.connectionState;
      console.log(`🔗 Connection state: ${state}`);
      if (state === 'connected') {
        console.log('✅ WebRTC connection established with:', targetUserId);
        setConnectionStatus('connected');
      }
      if (state === 'failed' || state === 'disconnected') {
        console.log('❌ Connection failed/disconnected');
        setConnectionStatus('disconnected');
      }
    };

    // ===== DATA CHANNEL FOR WHITEBOARD =====
    let dataChannel = null;
    
    if (isInitiator) {
      // Create data channel (tutor creates it)
      dataChannel = pc.createDataChannel('whiteboard', {
        ordered: true,
        reliable: true
      });
      dataChannelsRef.current.set(targetUserId, dataChannel);
      setupDataChannel(dataChannel, targetUserId);
      console.log('📡 Data channel created for:', targetUserId);
    }

    // Handle incoming data channel (student receives it)
    pc.ondatachannel = (event) => {
      console.log('📡 Incoming data channel from:', targetUserId);
      dataChannel = event.channel;
      dataChannelsRef.current.set(targetUserId, dataChannel);
      setupDataChannel(dataChannel, targetUserId);
    };

    // ===== CREATE OFFER IF INITIATOR =====
    if (isInitiator) {
      createOffer(pc, targetUserId);
    }

    return pc;
  }, [roomId]);

  // ============================================
  // SETUP DATA CHANNEL
  // ============================================
  const setupDataChannel = useCallback((channel, targetUserId) => {
    channel.onopen = () => {
      console.log('📡 Data channel open with:', targetUserId);
    };

    channel.onclose = () => {
      console.log('📡 Data channel closed with:', targetUserId);
    };

    channel.onerror = (error) => {
      console.error('📡 Data channel error:', error);
    };

    channel.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('📡 Data channel message:', data.type);
        
        // Forward to whiteboard component
        if (data.type === 'whiteboard-update' || data.type === 'whiteboard-sync' || data.type === 'clear-whiteboard') {
          window.dispatchEvent(new CustomEvent(data.type, {
            detail: data
          }));
        }
      } catch (err) {
        console.error('❌ Data channel message parse error:', err);
      }
    };
  }, []);

  // ============================================
  // CREATE OFFER
  // ============================================
  const createOffer = async (pc, targetUserId) => {
    try {
      console.log('📞 Creating offer for:', targetUserId);
      const offer = await pc.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: false
      });
      await pc.setLocalDescription(offer);
      
      sendSignalingMessage({
        type: 'offer',
        targetUserId: targetUserId,
        roomId: roomId,
        offer: offer
      });
      console.log('📞 Offer sent to:', targetUserId);
    } catch (err) {
      console.error('❌ Failed to create offer:', err);
    }
  };

  // ============================================
  // HANDLE OFFER
  // ============================================
  const handleOffer = async (data) => {
    try {
      const targetUserId = data.fromUserId;
      console.log('📞 Handling offer from:', targetUserId);
      
      let pc = peerConnectionsRef.current.get(targetUserId);
      if (!pc) {
        pc = await createPeerConnection(targetUserId, false);
      }

      await pc.setRemoteDescription(new RTCSessionDescription(data.offer));
      console.log('📞 Remote description set');
      
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      console.log('📞 Answer created');

      sendSignalingMessage({
        type: 'answer',
        targetUserId: targetUserId,
        roomId: roomId,
        answer: answer
      });
      console.log('📞 Answer sent to:', targetUserId);
    } catch (err) {
      console.error('❌ Failed to handle offer:', err);
    }
  };

  // ============================================
  // HANDLE ANSWER
  // ============================================
  const handleAnswer = async (data) => {
    try {
      const targetUserId = data.fromUserId;
      console.log('📞 Handling answer from:', targetUserId);
      
      const pc = peerConnectionsRef.current.get(targetUserId);
      if (pc) {
        await pc.setRemoteDescription(new RTCSessionDescription(data.answer));
        console.log('📞 Answer accepted from:', targetUserId);
      } else {
        console.warn('⚠️ No peer connection found for:', targetUserId);
      }
    } catch (err) {
      console.error('❌ Failed to handle answer:', err);
    }
  };

  // ============================================
  // HANDLE ICE CANDIDATE
  // ============================================
  const handleIceCandidate = async (data) => {
    try {
      const targetUserId = data.fromUserId;
      console.log('🧊 Adding ICE candidate from:', targetUserId);
      
      const pc = peerConnectionsRef.current.get(targetUserId);
      if (pc) {
        await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
        console.log('🧊 ICE candidate added');
      } else {
        console.warn('⚠️ No peer connection for ICE candidate from:', targetUserId);
      }
    } catch (err) {
      console.error('❌ Failed to add ICE candidate:', err);
    }
  };

  // ============================================
  // SEND SIGNALING MESSAGE
  // ============================================
  const sendSignalingMessage = useCallback((data) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(data));
      console.log('📤 Sent:', data.type);
    } else {
      console.warn('⚠️ WebSocket not open, message not sent:', data.type);
    }
  }, []);

  // ============================================
  // SEND WHITEBOARD DATA VIA DATA CHANNEL (PREFERRED)
  // ============================================
  const sendWhiteboardViaDataChannel = useCallback((targetUserId, data) => {
    const channel = dataChannelsRef.current.get(targetUserId);
    if (channel && channel.readyState === 'open') {
      channel.send(JSON.stringify(data));
      console.log('📡 Whiteboard data sent via data channel');
      return true;
    }
    return false;
  }, []);

  // ============================================
  // BROADCAST WHITEBOARD UPDATE
  // ============================================
  const broadcastWhiteboardUpdate = useCallback((action, data) => {
    if (role === 'tutor') {
      const message = {
        type: 'whiteboard-update',
        action: action,
        data: data,
        roomId: roomId,
        timestamp: Date.now()
      };

      // Try data channel first (P2P, faster)
      let sentViaDataChannel = false;
      const participantsList = participants.filter(p => p.role === 'student');
      
      for (const participant of participantsList) {
        if (sendWhiteboardViaDataChannel(participant.userId, message)) {
          sentViaDataChannel = true;
        }
      }

      // Fallback to WebSocket if data channel not available
      if (!sentViaDataChannel) {
        console.log('📤 Broadcasting via WebSocket (fallback)');
        sendSignalingMessage({
          type: 'whiteboard-update',
          action: action,
          data: data,
          roomId: roomId
        });
      }
    }
  }, [role, roomId, participants, sendWhiteboardViaDataChannel, sendSignalingMessage]);

  // ============================================
  // CLEAR WHITEBOARD
  // ============================================
  const clearWhiteboard = useCallback(() => {
    if (role === 'tutor') {
      const message = {
        type: 'clear-whiteboard',
        roomId: roomId,
        timestamp: Date.now()
      };

      // Try data channel first
      let sentViaDataChannel = false;
      const participantsList = participants.filter(p => p.role === 'student');
      
      for (const participant of participantsList) {
        if (sendWhiteboardViaDataChannel(participant.userId, message)) {
          sentViaDataChannel = true;
        }
      }

      // Fallback to WebSocket
      if (!sentViaDataChannel) {
        sendSignalingMessage({
          type: 'clear-whiteboard',
          roomId: roomId
        });
      }
    }
  }, [role, roomId, participants, sendWhiteboardViaDataChannel, sendSignalingMessage]);

  // ============================================
  // TOGGLE AUDIO
  // ============================================
  const toggleAudio = useCallback(() => {
    if (localStreamRef.current) {
      const audioTracks = localStreamRef.current.getAudioTracks();
      audioTracks.forEach(track => {
        track.enabled = !track.enabled;
      });
      const newState = !isAudioEnabled;
      setIsAudioEnabled(newState);

      sendSignalingMessage({
        type: 'audio-toggle',
        roomId: roomId,
        enabled: newState
      });
      console.log('🔊 Audio toggled:', newState ? 'ON' : 'OFF');
    } else {
      console.warn('⚠️ No audio stream to toggle');
    }
  }, [isAudioEnabled, roomId, sendSignalingMessage]);

  // ============================================
  // LEAVE SESSION
  // ============================================
  const leaveSession = useCallback(() => {
    console.log('👋 Leaving session...');
    
    // Clear reconnect timer
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }

    // Close peer connections
    peerConnectionsRef.current.forEach((pc, userId) => {
      console.log('🔒 Closing peer connection:', userId);
      pc.close();
    });
    peerConnectionsRef.current.clear();

    // Close data channels
    dataChannelsRef.current.forEach((dc, userId) => {
      console.log('🔒 Closing data channel:', userId);
      dc.close();
    });
    dataChannelsRef.current.clear();

    // Stop local stream
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => {
        track.stop();
        console.log('🎵 Track stopped:', track.kind);
      });
      localStreamRef.current = null;
    }

    // Close WebSocket
    if (wsRef.current) {
      try {
        wsRef.current.send(JSON.stringify({
          type: 'leave-room',
          roomId: roomId
        }));
      } catch (e) {
        // Ignore send errors on close
      }
      wsRef.current.close();
      wsRef.current = null;
    }

    setIsConnected(false);
    setConnectionStatus('disconnected');
    setParticipants([]);
    console.log('👋 Session left successfully');
  }, [roomId]);

  // ============================================
  // CLEANUP ON UNMOUNT
  // ============================================
  useEffect(() => {
    return () => {
      leaveSession();
    };
  }, [leaveSession]);

  // ============================================
  // AUTO-CONNECT ON MOUNT
  // ============================================
  useEffect(() => {
    if (roomId && role && userId) {
      console.log('🚀 Auto-connecting to room:', roomId, 'as:', role);
      initWebRTC();
    }
    
    // Cleanup on unmount
    return () => {
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }
    };
  }, [roomId, role, userId, initWebRTC]);

  // ============================================
  // RETURN API
  // ============================================
  return {
    isConnected,
    participants,
    error,
    isAudioEnabled,
    connectionStatus,
    toggleAudio,
    leaveSession,
    broadcastWhiteboardUpdate,
    clearWhiteboard,
    sendSignalingMessage,
    sendWhiteboardViaDataChannel
  };
};

export default useWebRTC;