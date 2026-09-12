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
  const [basePath, setBasePath] = useState(null); // always '/notifications'
  const dropdownRef = useRef(null);
  const pollingRef = useRef(null);

  // ✅ Determine auth + role, then set the endpoint prefix
  useEffect(() => {
    const checkUser = async () => {
      try {
        const token = localStorage.getItem('accessToken');
        if (!token) {
          setIsAuthenticated(false);
          setIsAdmin(false);
          setBasePath(null);
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
        // Same endpoint for every role — the backend scopes by req.user.id
        setBasePath('/notifications');
      } catch (error) {
        console.error('Error checking user:', error);
        setIsAuthenticated(false);
        setIsAdmin(false);
        setBasePath(null);
      }
    };
    checkUser();
  }, []);

  // ✅ Once basePath is known, fetch and start polling
  useEffect(() => {
    if (!basePath) return;

    fetchUnreadCount();
    fetchNotifications();

    pollingRef.current = setInterval(() => {
      fetchUnreadCount();
    }, 30000);

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [basePath]);

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
    return {
      'Authorization': `Bearer ${token}`
    };
  };

  const fetchUnreadCount = async () => {
    if (!basePath) return;

    try {
      const token = localStorage.getItem('accessToken');
      if (!token) return;

      const response = await fetch(`${API_BASE_URL}${basePath}/unread-count`, {
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
    if (!basePath) return;

    try {
      setLoading(true);
      const token = localStorage.getItem('accessToken');
      if (!token) return;

      const response = await fetch(`${API_BASE_URL}${basePath}`, {
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

  const markAsRead = async (notificationId) => {
    if (!basePath) return;

    try {
      const response = await fetch(`${API_BASE_URL}${basePath}/${notificationId}/read`, {
        method: 'PUT',
        headers: authHeaders()
      });

      if (response.ok) {
        setNotifications(prev =>
          prev.map(n =>
            n.id === notificationId ? { ...n, is_read: true } : n
          )
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  const markAllAsRead = async () => {
    if (!basePath) return;

    try {
      const response = await fetch(`${API_BASE_URL}${basePath}/read-all`, {
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

  const handleNotificationClick = (notification) => {
    markAsRead(notification.id);
    if (notification.link) {
      navigate(notification.link);
    } else if (notification.metadata?.session_id) {
      navigate(`/session/${notification.metadata.session_id}`);
    }
    setIsOpen(false);
  };

  // ✅ Don't render if not authenticated
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
            <span className="dropdown-title">🔔 Notifications</span>
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

                return (
                  <div
                    key={notification.id}
                    className={`dropdown-item ${!notification.is_read ? 'unread' : ''}`}
                    onClick={() => handleNotificationClick(notification)}
                  >
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
                           notification.type === 'warning' ? '⚠️' : '🔔'}
                        </span>
                      )}
                    </div>
                    <div className="dropdown-item-content">
                      <div className="dropdown-item-title">{notification.title}</div>
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
                  navigate('/notifications');
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