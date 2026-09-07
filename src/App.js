// backend/src/app.js - COMPLETE WITH ALL ROUTES (VIDEO + SHIFTS + WEBRTC)
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const http = require('http');
const { errorHandler } = require('./middleware/errorHandler');
const routes = require('./routes');
const authenticateToken = require('./middleware/auth');
const { getEarnings, getEarningsSummary } = require('./controllers/earningsController');
const { supabase } = require('./config/database');
const WebRTCSignalingServer = require('./webrtc/webrtcServer');

// ===== GLOBAL ERROR HANDLERS =====
process.on('uncaughtException', (err) => {
  console.error('💥 UNCAUGHT EXCEPTION:', err);
  console.error('Stack:', err.stack);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 UNHANDLED REJECTION:', reason);
  console.error('Stack:', reason?.stack);
});

const app = express();

console.log('🚀 SERVER STARTUP - v3.0');

// ===== CORS CONFIGURATION - ALLOW ALL =====
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin', 'X-CSRF-Token'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  maxAge: 86400
}));

// ===== SECURITY & PERFORMANCE =====
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  crossOriginOpenerPolicy: { policy: "same-origin-allow-popups" },
  crossOriginEmbedderPolicy: false
}));

app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ===== REQUEST LOGGING =====
app.use((req, res, next) => {
  console.log(`📨 ${req.method} ${req.path}`);
  console.log(`📌 Origin: ${req.headers.origin}`);
  next();
});

// ===== ROOT ROUTE =====
app.get('/', (req, res) => {
  res.json({
    name: 'EduSpantech API',
    version: '1.0.0',
    status: 'healthy',
    environment: process.env.NODE_ENV || 'development',
    endpoints: {
      auth: '/api/auth',
      content: '/api/content',
      earnings: '/api/earnings',
      tutors: '/api/tutors',
      sessions: '/api/sessions',
      health: '/api/health',
      shifts: '/api/shifts',
      video: '/api/tutor/video',
      webrtc: 'ws://localhost:3000/webrtc',
      webrtcRooms: '/api/webrtc/rooms'
    }
  });
});

// ===== HEALTH CHECK =====
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    message: 'EduSpantech API is running',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0',
    endpoints: {
      earnings: '/api/earnings',
      earningsTest: '/api/earnings/test',
      earningsSummary: '/api/earnings/summary',
      shifts: '/api/shifts',
      video: '/api/tutor/video',
      webrtc: 'ws://localhost:3000/webrtc'
    }
  });
});

// ============================================================
// ✅ SHIFTS ROUTE
// ============================================================
app.get('/api/shifts', async (req, res) => {
  try {
    console.log('📋 Fetching shifts...');
    const { data: shifts, error } = await supabase
      .from('shifts')
      .select('*')
      .eq('is_active', true)
      .order('display_order', { ascending: true });
    
    if (error) {
      console.error('❌ Error fetching shifts:', error);
      return res.status(500).json({ success: false, error: error.message });
    }
    
    console.log(`✅ Found ${shifts?.length || 0} shifts`);
    res.json({
      success: true,
      shifts: shifts || []
    });
  } catch (error) {
    console.error('❌ Get shifts error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================================
// ✅ TUTOR INTRO VIDEO ROUTES
// ============================================================

// Upload tutor intro video (protected)
app.post('/api/tutor/video', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { videoUrl, thumbnail, duration, videoType, youtubeId, youtubeUrl } = req.body;
    
    console.log('📤 Video upload request for user:', userId);
    
    const { data: user, error } = await supabase
      .from('users')
      .select('is_tutor, email, name')
      .eq('id', userId)
      .single();
    
    if (error || !user?.is_tutor) {
      console.log('❌ User is not a tutor:', userId);
      return res.status(403).json({ error: 'Only tutors can upload intro videos' });
    }
    
    const isYouTube = videoType === 'youtube' || youtubeId || youtubeUrl;
    let videoData = {};
    
    if (isYouTube && youtubeUrl) {
      const extractYouTubeId = (url) => {
        const patterns = [
          /(?:youtube\.com\/watch\?v=)([a-zA-Z0-9_-]+)/,
          /(?:youtu\.be\/)([a-zA-Z0-9_-]+)/,
          /(?:youtube\.com\/embed\/)([a-zA-Z0-9_-]+)/
        ];
        for (const pattern of patterns) {
          const match = url.match(pattern);
          if (match) return match[1];
        }
        return null;
      };
      
      const extractedId = extractYouTubeId(youtubeUrl) || youtubeId;
      const thumbnailUrl = thumbnail || `https://img.youtube.com/vi/${extractedId}/maxresdefault.jpg`;
      
      videoData = {
        intro_video_type: 'youtube',
        intro_video_youtube_url: youtubeUrl,
        intro_video_youtube_id: extractedId,
        intro_video_url: `https://www.youtube.com/embed/${extractedId}`,
        intro_video_thumbnail: thumbnailUrl,
        intro_video_duration: duration || 0,
        intro_video_uploaded_at: new Date().toISOString(),
        intro_video_approved: true,
        intro_video_processed: true,
        intro_video_views: 0
      };
      console.log('✅ YouTube video processed:', extractedId);
    } else if (videoUrl) {
      videoData = {
        intro_video_type: 'upload',
        intro_video_url: videoUrl,
        intro_video_thumbnail: thumbnail || null,
        intro_video_duration: duration || 0,
        intro_video_uploaded_at: new Date().toISOString(),
        intro_video_approved: false,
        intro_video_processed: false,
        intro_video_views: 0
      };
      console.log('✅ Uploaded video processed');
    } else {
      return res.status(400).json({ error: 'No video URL or YouTube URL provided' });
    }
    
    const { error: updateError } = await supabase
      .from('users')
      .update(videoData)
      .eq('id', userId);
    
    if (updateError) {
      console.error('❌ Update error:', updateError);
      return res.status(500).json({ error: 'Failed to save video: ' + updateError.message });
    }
    
    console.log('✅ Video saved successfully for user:', userId);
    
    res.json({ 
      success: true, 
      message: isYouTube ? 'YouTube video added successfully' : 'Video uploaded successfully',
      type: isYouTube ? 'youtube' : 'upload',
      video: videoData
    });
  } catch (error) {
    console.error('❌ Video upload error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete tutor intro video (protected)
app.delete('/api/tutor/video', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('is_tutor')
      .eq('id', userId)
      .single();
    
    if (userError || !user?.is_tutor) {
      return res.status(403).json({ 
        success: false, 
        error: 'Only tutors can manage intro videos' 
      });
    }
    
    const { error: updateError } = await supabase
      .from('users')
      .update({
        intro_video_url: null,
        intro_video_thumbnail: null,
        intro_video_duration: null,
        intro_video_uploaded_at: null,
        intro_video_approved: false,
        intro_video_processed: false,
        intro_video_views: 0,
        intro_video_type: null,
        intro_video_youtube_id: null,
        intro_video_youtube_url: null
      })
      .eq('id', userId);
    
    if (updateError) {
      console.error('❌ Update error:', updateError);
      return res.status(500).json({ 
        success: false, 
        error: 'Failed to remove video' 
      });
    }
    
    res.json({ 
      success: true, 
      message: 'Video removed successfully' 
    });
  } catch (error) {
    console.error('❌ Video removal error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Get tutor intro video (public)
app.get('/api/tutor/:tutorId/video', async (req, res) => {
  try {
    const { tutorId } = req.params;
    console.log('🔍 Fetching video for tutor:', tutorId);
    
    const { data: user, error } = await supabase
      .from('users')
      .select(`
        intro_video_url,
        intro_video_thumbnail,
        intro_video_duration,
        intro_video_views,
        intro_video_approved,
        intro_video_type,
        intro_video_youtube_id,
        intro_video_youtube_url,
        name
      `)
      .eq('id', tutorId)
      .single();
    
    if (error || !user) {
      console.log('❌ Tutor not found:', tutorId);
      return res.status(404).json({ error: 'Tutor not found' });
    }
    
    res.json({
      success: true,
      video: {
        url: user.intro_video_url,
        thumbnail: user.intro_video_thumbnail,
        duration: user.intro_video_duration,
        views: user.intro_video_views || 0,
        approved: user.intro_video_approved || false,
        tutorName: user.name,
        type: user.intro_video_type || 'upload',
        youtubeId: user.intro_video_youtube_id,
        youtubeUrl: user.intro_video_youtube_url
      }
    });
  } catch (error) {
    console.error('❌ Get video error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Increment video views (public)
app.post('/api/tutor/:tutorId/video/views', async (req, res) => {
  try {
    const { tutorId } = req.params;
    console.log('👁️ Incrementing views for tutor:', tutorId);
    
    const { data: current, error: fetchError } = await supabase
      .from('users')
      .select('intro_video_views')
      .eq('id', tutorId)
      .single();
    
    if (fetchError) {
      console.error('❌ Fetch error:', fetchError);
      return res.status(404).json({ error: 'Tutor not found' });
    }
    
    const currentViews = current.intro_video_views || 0;
    const newViews = currentViews + 1;
    
    const { data, error } = await supabase
      .from('users')
      .update({ intro_video_views: newViews })
      .eq('id', tutorId)
      .select('intro_video_views')
      .single();
    
    if (error) {
      console.error('❌ Increment views error:', error);
      return res.status(500).json({ error: 'Failed to increment views' });
    }
    
    console.log('✅ Views updated:', newViews);
    res.json({
      success: true,
      views: data.intro_video_views
    });
  } catch (error) {
    console.error('❌ Increment views error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get all tutors with video info (public)
app.get('/api/tutors/videos', async (req, res) => {
  try {
    const { data: tutors, error } = await supabase
      .from('users')
      .select(`
        id,
        name,
        email,
        avatar,
        tutor_tier,
        tutor_subjects,
        intro_video_url,
        intro_video_thumbnail,
        intro_video_duration,
        intro_video_views,
        intro_video_type,
        intro_video_youtube_id,
        intro_video_approved
      `)
      .eq('is_tutor', true)
      .eq('tutor_approved', true)
      .not('intro_video_url', 'is', null);
    
    if (error) {
      console.error('❌ Error fetching tutors with videos:', error);
      return res.status(500).json({ success: false, error: error.message });
    }
    
    res.json({
      success: true,
      tutors: tutors || []
    });
  } catch (error) {
    console.error('❌ Get tutors with videos error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================================
// ✅ WEBRTC ROOM API ROUTES
// ============================================================

// Get room info (public)
app.get('/api/webrtc/rooms/:roomId', (req, res) => {
  const { roomId } = req.params;
  const roomInfo = global.webrtcServer?.getRoomInfo(roomId);
  if (roomInfo) {
    res.json({ success: true, data: roomInfo });
  } else {
    res.json({ success: false, data: null });
  }
});

// Get room participants (public)
app.get('/api/webrtc/rooms/:roomId/participants', (req, res) => {
  const { roomId } = req.params;
  const participants = global.webrtcServer?.getRoomParticipants(roomId) || [];
  res.json({ success: true, participants });
});

// End session (protected - tutor only)
app.post('/api/webrtc/rooms/:roomId/end', authenticateToken, async (req, res) => {
  const { roomId } = req.params;
  const userId = req.user.id;
  
  // Verify user is the tutor for this room
  try {
    const { data: session, error } = await supabase
      .from('sessions')
      .select('tutor_id')
      .eq('id', roomId)
      .single();
    
    if (error || session?.tutor_id !== userId) {
      return res.status(403).json({ 
        success: false, 
        error: 'Only the tutor can end this session' 
      });
    }
    
    global.webrtcServer?.endSession(roomId);
    res.json({ success: true, message: 'Session ended successfully' });
  } catch (error) {
    console.error('❌ End session error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================================
// ✅ DIRECT EARNINGS ROUTES REGISTRATION
// ============================================================
console.log('🔧 Registering earnings routes directly...');

app.get('/api/earnings/test', (req, res) => {
  console.log('✅ Earnings test route hit!');
  res.json({
    success: true,
    message: 'Earnings test route is working!',
    timestamp: new Date().toISOString()
  });
});

console.log('📌 Registering GET /api/earnings (protected)...');
app.get('/api/earnings', authenticateToken, getEarnings);

console.log('📌 Registering GET /api/earnings/summary (protected)...');
app.get('/api/earnings/summary', authenticateToken, getEarningsSummary);

console.log('✅ Earnings routes registered:');
console.log('  - GET /api/earnings/test (public)');
console.log('  - GET /api/earnings (protected)');
console.log('  - GET /api/earnings/summary (protected)');

// ============================================================
// API ROUTES - Mount the rest of the routes
// ============================================================
console.log('🔧 Mounting other API routes...');
app.use('/api', routes);
app.use('/api/v1', routes);
console.log('✅ Other API routes mounted');

// ===== 404 HANDLER =====
app.use((req, res) => {
  console.log(`❌ 404: ${req.method} ${req.path}`);
  res.status(404).json({
    success: false,
    error: 'Not Found',
    message: `Route ${req.method} ${req.path} not found`,
    path: req.path,
    method: req.method
  });
});

// ===== ERROR HANDLER =====
app.use(errorHandler);

// ===== START SERVER WITH WEBRTC =====
if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  
  // Create HTTP server from app
  const server = http.createServer(app);
  
  // Initialize WebRTC signaling server
  const webrtcServer = new WebRTCSignalingServer(server);
  global.webrtcServer = webrtcServer;
  
  server.listen(PORT, () => {
    console.log(`✅ Server started on port ${PORT}`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🔗 API URL: http://localhost:${PORT}/api/health`);
    console.log(`🔊 WebRTC Signaling: ws://localhost:${PORT}/webrtc`);
    console.log(`📋 Routes registered:`);
    console.log(`  GET  /api/shifts`);
    console.log(`  POST /api/tutor/video`);
    console.log(`  DELETE /api/tutor/video`);
    console.log(`  GET  /api/tutor/:tutorId/video`);
    console.log(`  GET  /api/webrtc/rooms/:roomId`);
    console.log(`  GET  /api/webrtc/rooms/:roomId/participants`);
    console.log(`  POST /api/webrtc/rooms/:roomId/end`);
    console.log(`  WS   /webrtc`);
  });

  process.on('SIGTERM', () => {
    console.log('🛑 SIGTERM received, closing server...');
    webrtcServer.shutdown();
    server.close(() => {
      console.log('✅ Server closed');
      process.exit(0);
    });
  });

  process.on('SIGINT', () => {
    console.log('🛑 SIGINT received, closing server...');
    webrtcServer.shutdown();
    server.close(() => {
      console.log('✅ Server closed');
      process.exit(0);
    });
  });
}

module.exports = app;