// src/pages/Notifications.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../services/api';
import './Notifications.css';

const Notifications = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('accessToken');
      if (!token) {
        navigate('/login');
        return;
      }

      const response = await fetch(`${API_BASE_URL}/notifications`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications || []);
      } else if (response.status === 404) {
        setNotifications([]);
      } else {
        setError('Failed to load notifications');
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
      setError('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`${API_BASE_URL}/notifications/${notificationId}/read`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        setNotifications(prev => 
          prev.map(n => 
            n.id === notificationId ? { ...n, is_read: true } : n
          )
        );
      }
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`${API_BASE_URL}/notifications/read-all`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      }
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  // ===== GET NOTIFICATION ICON BY TYPE =====
  const getNotificationIcon = (type) => {
    const icons = {
      'session_booked': '📚',
      'session_accepted': '✅',
      'session_started': '▶️',
      'session_ended': '📝',
      'session_cancelled': '❌',
      'payment_received': '💰',
      'subscription_renewed': '🔄',
      'subscription_expired': '⚠️',
      'student_joined': '👤',
      'tutor_assigned': '👨‍🏫',
      'new_tutor': '👨‍🏫',
      'warning': '⚠️',
      'system': '🔔',
      'default': '📌'
    };
    return icons[type] || icons.default;
  };

  // ===== RENDER STUDENT AVATAR OR INITIALS =====
  const renderStudentAvatar = (notification) => {
    const metadata = notification.metadata || {};
    const studentName = metadata.student_name || 'Student';
    const studentAvatar = metadata.student_avatar || null;
    
    if (studentAvatar) {
      return (
        <img 
          src={studentAvatar} 
          alt={studentName} 
          className="notification-avatar-img"
          style={{ 
            width: '44px', 
            height: '44px', 
            borderRadius: '50%', 
            objectFit: 'cover',
            border: '2px solid rgba(255,255,255,0.1)'
          }}
          onError={(e) => {
            e.target.style.display = 'none';
            const parent = e.target.parentElement;
            if (parent) {
              const initial = studentName.charAt(0).toUpperCase();
              parent.textContent = initial;
              parent.style.display = 'flex';
              parent.style.alignItems = 'center';
              parent.style.justifyContent = 'center';
              parent.style.background = '#4f46e5';
              parent.style.color = 'white';
              parent.style.fontSize = '18px';
              parent.style.fontWeight = 'bold';
              parent.style.borderRadius = '50%';
              parent.style.width = '44px';
              parent.style.height = '44px';
            }
          }}
        />
      );
    }
    
    // Fallback to initials
    const initial = studentName.charAt(0).toUpperCase();
    const colors = ['#4f46e5', '#7c3aed', '#059669', '#10b981', '#dc2626', '#f59e0b', '#8b5cf6', '#ec4899'];
    const hash = studentName.split('').reduce((acc, char) => acc + (char.charCodeAt(0) || 0), 0);
    const color = colors[Math.abs(hash) % colors.length];
    
    return (
      <div 
        className="notification-avatar-initial"
        style={{
          width: '44px',
          height: '44px',
          borderRadius: '50%',
          background: color,
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '18px',
          fontWeight: 'bold',
          textTransform: 'uppercase',
          border: '2px solid rgba(255,255,255,0.1)'
        }}
      >
        {initial}
      </div>
    );
  };

  // ===== RENDER SESSION DETAILS IN NOTIFICATION =====
  const renderNotificationDetails = (notification) => {
    const { type, metadata } = notification;
    
    if (type === 'session_booked' && metadata) {
      return (
        <div className="notification-details">
          <div className="detail-row">
            <span className="detail-label">👤 Student:</span>
            <span className="detail-value">{metadata.student_name || 'Student'}</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">📅 Date:</span>
            <span className="detail-value">
              {new Date(metadata.date).toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </span>
          </div>
          <div className="detail-row">
            <span className="detail-label">⏱️ Duration:</span>
            <span className="detail-value">{metadata.duration || 60} minutes</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">📖 Topic:</span>
            <span className="detail-value">{metadata.topic || 'Mathematics'}</span>
          </div>
          <div className="detail-actions">
            <button 
              className="detail-action-btn accept"
              onClick={() => handleAcceptSession(notification.metadata?.session_id)}
            >
              ✅ Accept Session
            </button>
            <button 
              className="detail-action-btn view"
              onClick={() => handleViewSession(notification.metadata?.session_id)}
            >
              👁️ View Details
            </button>
          </div>
        </div>
      );
    }

    if (type === 'session_accepted' && metadata) {
      return (
        <div className="notification-details">
          <div className="detail-row">
            <span className="detail-label">📅 Date:</span>
            <span className="detail-value">
              {new Date(metadata.date).toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </span>
          </div>
          <div className="detail-row">
            <span className="detail-label">📖 Topic:</span>
            <span className="detail-value">{metadata.topic || 'Mathematics'}</span>
          </div>
          <div className="detail-actions">
            <button 
              className="detail-action-btn view"
              onClick={() => handleViewSession(metadata.session_id)}
            >
              👁️ View Session
            </button>
          </div>
        </div>
      );
    }

    if (type === 'session_cancelled' && metadata) {
      return (
        <div className="notification-details">
          <div className="detail-row">
            <span className="detail-label">📅 Date:</span>
            <span className="detail-value">
              {new Date(metadata.date).toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </span>
          </div>
          <div className="detail-row">
            <span className="detail-label">📖 Topic:</span>
            <span className="detail-value">{metadata.topic || 'Mathematics'}</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">🔄 Cancelled by:</span>
            <span className="detail-value">{metadata.cancelled_by || 'Unknown'}</span>
          </div>
        </div>
      );
    }

    return null;
  };

  // ===== HANDLE ACCEPT SESSION FROM NOTIFICATION =====
  const handleAcceptSession = async (sessionId) => {
    if (!sessionId) return;
    
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`${API_BASE_URL}/sessions/${sessionId}/accept`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        alert('✅ Session accepted successfully!');
        fetchNotifications();
      } else {
        alert('❌ Failed to accept session');
      }
    } catch (error) {
      console.error('Accept session error:', error);
      alert('❌ Failed to accept session');
    }
  };

  // ===== HANDLE VIEW SESSION =====
  const handleViewSession = (sessionId) => {
    if (sessionId) {
      navigate(`/session/${sessionId}`);
    }
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const filteredNotifications = filter === 'all' 
    ? notifications 
    : filter === 'unread' 
      ? notifications.filter(n => !n.is_read)
      : notifications.filter(n => n.is_read);

  const unreadCount = notifications.filter(n => !n.is_read).length;

  if (loading) {
    return (
      <div className="notifications-loading">
        <div className="loading-spinner"></div>
        <p>Loading notifications...</p>
      </div>
    );
  }

  return (
    <div className="notifications-page">
      <div className="notifications-header">
        <div className="header-content">
          <h1>🔔 Notifications</h1>
          <div className="header-actions">
            {unreadCount > 0 && (
              <button className="mark-all-btn" onClick={markAllAsRead}>
                Mark all as read
              </button>
            )}
            <div className="filter-buttons">
              <button 
                className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
                onClick={() => setFilter('all')}
              >
                All ({notifications.length})
              </button>
              <button 
                className={`filter-btn ${filter === 'unread' ? 'active' : ''}`}
                onClick={() => setFilter('unread')}
              >
                Unread ({unreadCount})
              </button>
              <button 
                className={`filter-btn ${filter === 'read' ? 'active' : ''}`}
                onClick={() => setFilter('read')}
              >
                Read
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="notifications-list">
        {filteredNotifications.length === 0 ? (
          <div className="notifications-empty">
            <span>🔔</span>
            <h3>No notifications</h3>
            <p>You're all caught up!</p>
          </div>
        ) : (
          filteredNotifications.map((notification) => {
            const isSessionBooked = notification.type === 'session_booked';
            
            return (
              <div 
                key={notification.id} 
                className={`notification-card ${!notification.is_read ? 'unread' : ''}`}
                onClick={() => markAsRead(notification.id)}
              >
                <div className="notification-icon-wrapper">
                  {isSessionBooked && notification.metadata?.student_name ? (
                    renderStudentAvatar(notification)
                  ) : (
                    <span className="notification-icon-emoji">
                      {getNotificationIcon(notification.type)}
                    </span>
                  )}
                </div>
                <div className="notification-body">
                  <div className="notification-title">{notification.title}</div>
                  <div className="notification-message">{notification.message}</div>
                  {renderNotificationDetails(notification)}
                  <div className="notification-time">{formatTime(notification.created_at)}</div>
                </div>
                {!notification.is_read && <span className="unread-badge">New</span>}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default Notifications;