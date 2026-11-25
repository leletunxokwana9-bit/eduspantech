
import React, { useState, useEffect, useCallback } from 'react';
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

  // ==================================================
  // FETCH NOTIFICATIONS
  // ==================================================

  const fetchNotifications = useCallback(async () => {
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

        setNotifications(
          Array.isArray(data.notifications)
            ? data.notifications.slice(0, 10)
            : []
        );
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
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // ==================================================
  // PERSON INFORMATION
  // ==================================================

  const getPersonName = (notification) => {
    return (
      notification.actor_name ||
      notification.metadata?.tutor_name ||
      notification.metadata?.student_name ||
      'EduSpantech User'
    );
  };

  const getInitials = (name) => {
    if (!name) return '?';

    return name
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map(part => part.charAt(0).toUpperCase())
      .join('');
  };

  // ==================================================
  // PROFILE PHOTO
  // ==================================================

  const getAvatarUrl = (notification) => {
    const metadata = notification.metadata || {};

    return (
      notification.image_url ||
      notification.actor_avatar ||
      metadata.actor_avatar ||
      metadata.tutor_avatar ||
      metadata.student_avatar ||
      metadata.image_url ||
      null
    );
  };

  // ==================================================
  // CLEAN NOTIFICATION TEXT
  // ==================================================

  const cleanNotificationText = (value) => {
    if (!value) return '';

    return String(value)
      .replace(
        /^[\s]*(?:✅|✔️?|☑️?|✓|📚|🔔|📣|▶️|⏰|❌)+[\s]*/u,
        ''
      )
      .trim();
  };

  // ==================================================
  // RENDER PROFILE AVATAR
  // NO TICKS OR EMOJI INSIDE THE CIRCLE
  // ==================================================

  const renderNotificationAvatar = (notification) => {
    const avatarUrl = getAvatarUrl(notification);
    const personName = getPersonName(notification);

    if (!notification.actor_id && !avatarUrl) {
      return (
        <div
          className="notification-avatar notification-system-avatar"
          aria-label="System notification"
        >
          <span className="notification-system-dot"></span>
        </div>
      );
    }

    return (
      <div className="notification-avatar">
        {avatarUrl && (
          <img
            src={avatarUrl}
            alt={personName}
            className="notification-avatar-image"
            loading="lazy"
            onError={(event) => {
              event.currentTarget.style.display = 'none';

              const fallback =
                event.currentTarget.parentElement?.querySelector(
                  '.notification-avatar-fallback'
                );

              if (fallback) {
                fallback.style.display = 'flex';
              }
            }}
          />
        )}

        <div
          className="notification-avatar-fallback"
          style={{
            display: avatarUrl ? 'none' : 'flex'
          }}
        >
          {getInitials(personName)}
        </div>
      </div>
    );
  };

  // ==================================================
  // MARK ONE NOTIFICATION AS READ
  // ==================================================

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

        if (onRead) {
          onRead();
        }
      }
    } catch (err) {
      console.error(
        'Failed to mark notification as read:',
        err
      );
    }
  };

  // ==================================================
  // HANDLE NOTIFICATION CLICK
  // ==================================================

  const handleNotificationClick = (notification) => {
    if (!notification.is_read) {
      markAsRead(notification.id);
    }

    if (onNotificationClick) {
      onNotificationClick(notification);
    }
  };

  // ==================================================
  // FORMAT TIME
  // ==================================================

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

  // ==================================================
  // UNREAD COUNT
  // ==================================================

  const unreadCount = notifications.filter(
    notification => !notification.is_read
  ).length;

  // ==================================================
  // MARK ALL AS READ
  // ==================================================

  const handleMarkAllRead = async () => {
    try {
      const token = localStorage.getItem('accessToken');

      if (!token) return;

      const response = await fetch(
        `${API_BASE_URL}/notifications/read-all`,
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
          prev.map(notification => ({
            ...notification,
            is_read: true
          }))
        );

        if (onRead) {
          onRead();
        }

        if (onMarkAllRead) {
          onMarkAllRead();
        }
      }
    } catch (err) {
      console.error(
        'Failed to mark all notifications as read:',
        err
      );
    }
  };

  // ==================================================
  // OPEN ALL NOTIFICATIONS
  // ==================================================

  const handleViewAll = () => {
    if (onClose) {
      onClose();
    }

    window.location.href = '/notifications';
  };

  // ==================================================
  // RENDER
  // ==================================================

  return (
    <div className="notification-dropdown">

      {/* HEADER */}

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
            type="button"
            className="mark-all-read"
            onClick={handleMarkAllRead}
          >
            Mark all as read
          </button>
        )}
      </div>

      {/* BODY */}

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

            <button
              type="button"
              onClick={fetchNotifications}
              className="notification-retry-btn"
            >
              Try again
            </button>
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

            {notifications.map(notification => (

              <div
                key={notification.id}
                className={`notification-item ${
                  !notification.is_read ? 'unread' : ''
                }`}
                onClick={() => handleNotificationClick(notification)}
                role="button"
                tabIndex={0}
                onKeyDown={(event) => {
                  if (
                    event.key === 'Enter' ||
                    event.key === ' '
                  ) {
                    event.preventDefault();
                    handleNotificationClick(notification);
                  }
                }}
              >

                {/* ROUND PROFILE PHOTO */}

                {renderNotificationAvatar(notification)}

                {/* NOTIFICATION CONTENT */}

                <div className="notification-content">

                  <div className="notification-title">
                    {cleanNotificationText(notification.title)}
                  </div>

                  <div className="notification-message">
                    {cleanNotificationText(notification.message)}
                  </div>

                  <div className="notification-time">
                    {formatTime(notification.created_at)}
                  </div>

                </div>

                {/* UNREAD INDICATOR */}

                {!notification.is_read && (
                  <span className="unread-dot"></span>
                )}

              </div>

            ))}

          </div>

        )}

      </div>

      {/* FOOTER */}

      {notifications.length > 0 && (
        <div className="dropdown-footer">
          <button
            type="button"
            className="view-all-btn"
            onClick={handleViewAll}
          >
            View All Notifications →
          </button>
        </div>
      )}

    </div>
  );
};

export default NotificationDropdown;
