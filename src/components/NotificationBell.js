// src/components/NotificationBell.js
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../services/api';
import { authService } from '../services/authService';
import './NotificationBell.css';

const NotificationBell = () => {
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [feedPath, setFeedPath] = useState(null);      // list endpoint
  const [countPath, setCountPath] = useState(null);    // unread-count endpoint
  const dropdownRef = useRef(null);
  const pollingRef = useRef(null);

  // ── Determine auth + role, then set endpoints
  useEffect(() => {
    const checkUser = async () => {
      try {
        const token = localStorage.getItem('accessToken');
        if (!token) {
          setIsAuthenticated(false);
          setIsAdmin(false);
          setFeedPath(null);
          setCountPath(null);
          return;
        }

        setIsAuthenticated(true);

        let user = null;
        try {
          user = await authService.getCurrentUser();
        } catch (err) {
          console.error('getCurrentUser failed:', err);
        }

        const adminUser =
          user?.is_admin === true ||
          user?.is_super_admin === true ||
          user?.role === 'admin' ||
          user?.role === 'ADMIN';

        setIsAdmin(adminUser);

        if (adminUser) {
          // Admin: merged feed (platform broadcasts + personal)
          setFeedPath('/admin/notifications/feed');
          setCountPath('/admin/notifications/feed-unread-count');
        } else {
          // Student/tutor: their own notifications
          setFeedPath('/notifications');
          setCountPath('/notifications/unread-count');
        }
      } catch (error) {
        console.error('Error checking user:', error);
        setIsAuthenticated(false);
        setIsAdmin(false);
        setFeedPath(null);
        setCountPath(null);
      }
    };
    checkUser();
  }, []);

  // ── Fetch + poll once paths are known
  useEffect(() => {
    if (!feedPath || !countPath) return;

    fetchUnreadCount();
    fetchNotifications();

    pollingRef.current = setInterval(() => {
      fetchUnreadCount();
    }, 30000);

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [feedPath, countPath]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const authHeaders = () => {
    const token = localStorage.getItem('accessToken');
    return { 'Authorization': `Bearer ${token}` };
  };

  const fetchUnreadCount = async () => {
    if (!countPath) return;
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) return;

      const response = await fetch(`${API_BASE_URL}${countPath}`, {
        headers: authHeaders()
      });

      if (response.status === 403 || response.status === 401) return;

      if (response.ok) {
        const data = await response.json();
        setUnreadCount(data.count || 0);
      }
    } catch (error) {
      console.error('Failed to fetch unread count:', error);
    }
  };

  const fetchNotifications = async () => {
    if (!feedPath) return;
    try {
      setLoading(true);
      const token = localStorage.getItem('accessToken');
      if (!token) return;

      const response = await fetch(`${API_BASE_URL}${feedPath}`, {
        headers: authHeaders()
      });

      if (response.status === 403 || response.status === 401) return;

      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications || []);
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notification) => {
    if (!feedPath) return;
    try {
      let url;
      if (isAdmin && notification.source) {
        // Admin feed: both platform + personal go through the same admin route
        url = `${API_BASE_URL}/admin/notifications/${notification.id}/read`;
      } else {
        url = `${API_BASE_URL}/notifications/${notification.id}/read`;
      }

      const response = await fetch(url, {
        method: 'PUT',
        headers: authHeaders()
      });

      if (response.ok) {
        setNotifications(prev =>
          prev.map(n => n.id === notification.id ? { ...n, is_read: true } : n)
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  const markAllAsRead = async () => {
    if (!feedPath) return;
    try {
      const url = isAdmin
        ? `${API_BASE_URL}/admin/notifications/read-all`
        : `${API_BASE_URL}/notifications/read-all`;

      const response = await fetch(url, {
        method: 'PUT',
        headers: authHeaders()
      });

      if (response.ok) {
        setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
        setUnreadCount(0);
      }
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  // ── Student avatar for session_booked
  const renderStudentAvatar = (notification) => {
    const metadata = notification.metadata || {};
    const studentName = metadata.student_name || 'Student';
    const studentAvatar = metadata.student_avatar || null;

    if (studentAvatar) {
      return (
        <img
          src={studentAvatar}
          alt={studentName}
          className="dropdown-avatar-img"
          style={{
            width: '32px',
            height: '32px',
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
              parent.style.fontSize = '14px';
              parent.style.fontWeight = 'bold';
              parent.style.borderRadius = '50%';
              parent.style.width = '32px';
              parent.style.height = '32px';
            }
          }}
        />
      );
    }

    const initial = studentName.charAt(0).toUpperCase();
    const colors = ['#4f46e5', '#7c3aed', '#059669', '#10b981', '#dc2626', '#f59e0b', '#8b5cf6', '#ec4899'];
    const hash = studentName.split('').reduce((acc, char) => acc + (char.charCodeAt(0) || 0), 0);
    const color = colors[Math.abs(hash) % colors.length];

    return (
      <div
        className="dropdown-avatar-initial"
        style={{
          width: '32px',
          height: '32px',
          borderRadius: '50%',
          background: color,
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '14px',
          fontWeight: 'bold',
          textTransform: 'uppercase'
        }}
      >
        {initial}
      </div>
    );
  };

  const handleToggle = () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    setIsOpen(!isOpen);
    if (!isOpen) {
      fetchNotifications();
    }
  };

  // ✅ ADDED: handle links that are external (http/https) vs internal (router paths)
  const handleNotificationClick = (notification) => {
    if (!notification.is_read) markAsRead(notification);

    const link = notification.link;

    if (link) {
      if (/^https?:\/\//i.test(link)) {
        // External meeting link (Zoom, Meet, Teams, etc.)
        window.open(link, '_blank', 'noopener,noreferrer');
      } else {
        // Internal app route
        navigate(link);
      }
    } else if (notification.metadata?.session_id) {
      navigate(`/session/${notification.metadata.session_id}`);
    }
    setIsOpen(false);
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="notification-bell-wrapper" ref={dropdownRef}>
      <button
        className={`notification-bell ${isOpen ? 'open' : ''}`}
        onClick={handleToggle}
        aria-label="Notifications"
      >
        🔔
        {unreadCount > 0 && (
          <span className="notification-badge">{unreadCount}</span>
        )}
      </button>

      {isOpen && (
        <div className="notification-dropdown">
          <div className="dropdown-header">
            <span className="dropdown-title">
              {isAdmin ? '🔔 Admin notifications' : '🔔 Notifications'}
            </span>
            {unreadCount > 0 && (
              <button className="mark-all-read-btn" onClick={markAllAsRead}>
                Mark all read
              </button>
            )}
          </div>

          <div className="dropdown-body">
            {loading ? (
              <div className="dropdown-loading">Loading...</div>
            ) : notifications.length === 0 ? (
              <div className="dropdown-empty">
                <span>🔔</span>
                <p>No notifications</p>
              </div>
            ) : (
              notifications.slice(0, 10).map((notification) => {
                const isSessionBooked = notification.type === 'session_booked';
                // ✅ ADDED: pick up image_url under either key the backend might use
                const thumbnail =
                  notification.image_url ||
                  notification.imageUrl ||
                  null;

                return (
                  <div
                    key={notification.id}
                    className={`dropdown-item ${!notification.is_read ? 'unread' : ''}`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    {/* ✅ ADDED: thumbnail banner when the notification has one */}
                    {thumbnail && (
                      <img
                        src={thumbnail}
                        alt=""
                        className="dropdown-item-thumb"
                        loading="lazy"
                        onError={(e) => { e.currentTarget.style.display = 'none'; }}
                      />
                    )}

                    <div className="dropdown-item-avatar">
                      {isSessionBooked && notification.metadata?.student_name ? (
                        renderStudentAvatar(notification)
                      ) : (
                        <span className="dropdown-item-icon">
                          {notification.type === 'session_booked' ? '📚' :
                           notification.type === 'session_accepted' ? '✅' :
                           notification.type === 'session_started' ? '▶️' :
                           notification.type === 'session_ended' ? '📝' :
                           notification.type === 'session_cancelled' ? '❌' :
                           notification.type === 'new_tutor' ? '👨‍🏫' :
                           notification.type === 'warning' ? '⚠️' :
                           notification.type === 'system' ? '📣' : '🔔'}
                        </span>
                      )}
                    </div>
                    <div className="dropdown-item-content">
                      <div className="dropdown-item-title">
                        {notification.title}
                        {isAdmin && notification.source === 'platform' && (
                          <span className="dropdown-item-source"> · Platform</span>
                        )}
                      </div>
                      <div className="dropdown-item-message">{notification.message}</div>
                      <div className="dropdown-item-time">
                        {new Date(notification.created_at).toLocaleDateString()}
                      </div>
                    </div>
                    {!notification.is_read && <span className="dropdown-item-dot"></span>}
                  </div>
                );
              })
            )}
          </div>

          {notifications.length > 0 && (
            <div className="dropdown-footer">
              <button
                className="view-all-btn"
                onClick={() => {
                  setIsOpen(false);
                  navigate(isAdmin ? '/admin/notifications' : '/notifications');
                }}
              >
                View All Notifications →
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationBell;