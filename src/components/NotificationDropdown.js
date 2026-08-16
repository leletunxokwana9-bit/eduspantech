// src/components/NotificationDropdown.js
import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../services/api';
import './NotificationDropdown.css';

const NotificationDropdown = ({ onClose, onRead, onNotificationClick, onMarkAllRead }) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('accessToken');
      if (!token) {
        setError('Please login to view notifications');
        setLoading(false);
        return;
      }

      const response = await fetch(`${API_BASE_URL}/notifications?limit=10`, {
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
      if (!token) return;

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
        if (onRead) onRead();
      }
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  const handleNotificationClick = (notification) => {
    markAsRead(notification.id);
    if (onNotificationClick) {
      onNotificationClick(notification);
    }
  };

  const getNotificationIcon = (type) => {
    const icons = {
      'session_reminder': '📅',
      'session_started': '🟢',
      'booking_confirmed': '✅',
      'session_cancelled': '❌',
      'new_rating': '⭐',
      'new_message': '💬',
      'subscription_alert': '🔔',
      'progress_update': '📈',
      'system_update': '🚀',
      'session_completed': '🎯'
    };
    return icons[type] || '📌';
  };

  const getNotificationColor = (type) => {
    const colors = {
      'session_reminder': '#4f46e5',
      'session_started': '#22c55e',
      'booking_confirmed': '#22c55e',
      'session_cancelled': '#ef4444',
      'new_rating': '#f59e0b',
      'new_message': '#8b5cf6',
      'subscription_alert': '#f59e0b',
      'progress_update': '#06b6d4',
      'system_update': '#6366f1',
      'session_completed': '#22c55e'
    };
    return colors[type] || '#6b7280';
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

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <div className="notification-dropdown">
      <div className="dropdown-header">
        <h3>Notifications</h3>
        {unreadCount > 0 && (
          <button className="mark-all-read" onClick={onMarkAllRead}>
            Mark all as read
          </button>
        )}
      </div>

      <div className="dropdown-body">
        {loading ? (
          <div className="notification-loading">
            <span className="loading-spinner"></span>
            <p>Loading notifications...</p>
          </div>
        ) : error ? (
          <div className="notification-error">
            <span>⚠️</span>
            <p>{error}</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="notification-empty">
            <span>🔔</span>
            <p>No notifications yet</p>
            <span className="empty-sub">We'll notify you when something happens</span>
          </div>
        ) : (
          <div className="notification-list">
            {notifications.slice(0, 10).map((notification) => (
              <div 
                key={notification.id} 
                className={`notification-item ${!notification.is_read ? 'unread' : ''}`}
                onClick={() => handleNotificationClick(notification)}
              >
                <div className="notification-icon" style={{ 
                  background: `${getNotificationColor(notification.type)}15`,
                  color: getNotificationColor(notification.type)
                }}>
                  {getNotificationIcon(notification.type)}
                </div>
                <div className="notification-content">
                  <div className="notification-title">{notification.title}</div>
                  <div className="notification-message">{notification.message}</div>
                  <div className="notification-time">{formatTime(notification.created_at)}</div>
                </div>
                {!notification.is_read && <span className="unread-dot"></span>}
              </div>
            ))}
          </div>
        )}
      </div>

      {notifications.length > 0 && (
        <div className="dropdown-footer">
          <button 
            className="view-all-btn"
            onClick={() => {
              onClose();
              window.location.href = '/notifications';
            }}
          >
            View All Notifications →
          </button>
        </div>
      )}
    </div>
  );
};

export default NotificationDropdown;