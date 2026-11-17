
import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../services/api';
import './NotificationDropdown.css';

const NotificationDropdown = ({
  onClose,
  onRead,
  onNotificationClick,
  onMarkAllRead
}) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem('accessToken');

      if (!token) {
        setError('Please login to view notifications');
        return;
      }

      const response = await fetch(
        `${API_BASE_URL}/notifications?limit=10`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications || []);
      } else if (response.status === 404) {
        setNotifications([]);
      } else {
        setError('Failed to load notifications');
      }
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
      setError('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  // --------------------------------------------------
  // DYNAMIC PROFILE AVATARS
  // --------------------------------------------------

  const getPersonName = (notification) => {
    return (
      notification.actor_name ||
      notification.metadata?.tutor_name ||
      notification.metadata?.student_name ||
      'EduSpantech'
    );
  };

  const getInitials = (name) => {
    if (!name) return '?';

    return name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map(part => part.charAt(0).toUpperCase())
      .join('');
  };

  const renderNotificationAvatar = (notification) => {
    const avatarUrl = notification.image_url;
    const personName = getPersonName(notification);

    if (!notification.actor_id) {
      return (
        <div className="notification-avatar notification-system-avatar">
          {getNotificationIcon(notification.type)}
        </div>
      );
    }

    return (
      <div className="notification-avatar">
        {avatarUrl && (
          <img
            src={avatarUrl}
            alt={personName}
            onError={(event) => {
              event.currentTarget.style.display = 'none';
              const fallback = event.currentTarget.parentElement
                .querySelector('.notification-avatar-fallback');

              if (fallback) {
                fallback.style.display = 'flex';
              }
            }}
          />
        )}

        <div
          className="notification-avatar-fallback"
          style={{ display: avatarUrl ? 'none' : 'flex' }}
        >
          {getInitials(personName)}
        </div>
      </div>
    );
  };

  // --------------------------------------------------
  // MARK AS READ
  // --------------------------------------------------

  const markAsRead = async (notificationId) => {
    try {
      const token = localStorage.getItem('accessToken');

      if (!token) return;

      const response = await fetch(
        `${API_BASE_URL}/notifications/${notificationId}/read`,
        {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.ok) {
        setNotifications(prev =>
          prev.map(notification =>
            notification.id === notificationId
              ? { ...notification, is_read: true }
              : notification
          )
        );

        if (onRead) onRead();
      }
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  };

  const handleNotificationClick = (notification) => {
    markAsRead(notification.id);

    if (onNotificationClick) {
      onNotificationClick(notification);
    }
  };

  // --------------------------------------------------
  // NOTIFICATION DISPLAY
  // --------------------------------------------------

  const getNotificationIcon = (type) => {
    const icons = {
      session_reminder: '📅',
      session_started: '🟢',
      booking_confirmed: '✅',
      session_accepted: '✅',
      session_booked: '📚',
      session_cancelled: '❌',
      new_rating: '⭐',
      new_message: '💬',
      subscription_alert: '🔔',
      payment_received: '💳',
      progress_update: '📈',
      system_update: '🚀',
      system: '🔔',
      new_tutor: '🎓',
      warning: '⚠️',
      session_completed: '🎯'
    };

    return icons[type] || '📌';
  };

  const formatTime = (dateString) => {
    if (!dateString) return '';

    const date = new Date(dateString);

    if (Number.isNaN(date.getTime())) return '';

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

  const unreadCount = notifications.filter(
    notification => !notification.is_read
  ).length;

  // --------------------------------------------------
  // RENDER
  // --------------------------------------------------

  return (
    <div className="notification-dropdown">

      <div className="dropdown-header">
        <div>
          <h3>Notifications</h3>

          {unreadCount > 0 && (
            <span className="notification-unread-count">
              {unreadCount} unread
            </span>
          )}
        </div>

        {unreadCount > 0 && (
          <button
            className="mark-all-read"
            onClick={onMarkAllRead}
          >
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
            <span className="empty-sub">
              We'll notify you when something happens
            </span>
          </div>
        ) : (
          <div className="notification-list">

            {notifications.slice(0, 10).map(notification => (
              <div
                key={notification.id}
                className={`notification-item ${
                  !notification.is_read ? 'unread' : ''
                }`}
                onClick={() => handleNotificationClick(notification)}
                role="button"
                tabIndex={0}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    handleNotificationClick(notification);
                  }
                }}
              >

                {renderNotificationAvatar(notification)}

                <div className="notification-content">
                  <div className="notification-title">
                    {notification.title}
                  </div>

                  <div className="notification-message">
                    {notification.message}
                  </div>

                  <div className="notification-time">
                    {formatTime(notification.created_at)}
                  </div>
                </div>

                {!notification.is_read && (
                  <span className="unread-dot"></span>
                )}

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
              if (onClose) onClose();
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
