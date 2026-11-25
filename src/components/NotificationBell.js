
// src/components/NotificationBell.js

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Bell } from 'lucide-react';
import { API_BASE_URL } from '../services/api';
import { authService } from '../services/authService';
import { supabase } from '../services/supabaseClient';
import './NotificationBell.css';

const NotificationBell = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [feedPath, setFeedPath] = useState(null);
  const [countPath, setCountPath] = useState(null);

  const dropdownRef = useRef(null);
  const pollingRef = useRef(null);

  const isActive =
    location.pathname === '/notifications' ||
    location.pathname === '/admin/notifications';

  // ==================================================
  // AUTHENTICATION AND ROLE
  // ==================================================

  useEffect(() => {
    const checkUser = async () => {
      try {
        const token = localStorage.getItem('accessToken');

        if (!token) {
          setIsAuthenticated(false);
          setIsAdmin(false);
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
          setFeedPath('/admin/notifications/feed');
          setCountPath('/admin/notifications/feed-unread-count');
        } else {
          setFeedPath('/notifications');
          setCountPath('/notifications/unread-count');
        }

      } catch (error) {
        console.error('Error checking user:', error);
        setIsAuthenticated(false);
      }
    };

    checkUser();
  }, []);

  // ==================================================
  // FETCH AND POLL NOTIFICATIONS
  // ==================================================

  useEffect(() => {
    if (!feedPath || !countPath) return;

    fetchUnreadCount();
    fetchNotifications();

    pollingRef.current = setInterval(() => {
      fetchUnreadCount();
    }, 30000);

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, [feedPath, countPath]);

  // ==================================================
  // SUPABASE REALTIME LISTENER
  // ==================================================

  useEffect(() => {
    let user = null;

    try {
      user = JSON.parse(localStorage.getItem('user') || 'null');
    } catch (error) {
      console.error('Could not read logged-in user:', error);
    }

    if (!user?.id) return;

    const channel = supabase
      .channel('public:notifications-bell')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          const newNotif = payload.new;

          setNotifications((prev) => [
            newNotif,
            ...prev.filter(item => item.id !== newNotif.id)
          ]);

          setUnreadCount((prev) => prev + 1);

          if (newNotif.type === 'session_reminder') {
            const goToSession = window.confirm(
              `${newNotif.title}\n\n${newNotif.message}\n\nClick OK to go to your sessions.`
            );

            if (goToSession) {
              navigate('/my-sessions');
            }

          } else if (newNotif.type === 'session_started') {
            const goToSession = window.confirm(
              `${newNotif.title}\n\n${newNotif.message}\n\nClick OK to join the session now.`
            );

            if (goToSession) {
              navigate('/my-sessions');
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [navigate]);

  // ==================================================
  // CLOSE DROPDOWN WHEN CLICKING OUTSIDE
  // ==================================================

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // ==================================================
  // AUTH HEADERS
  // ==================================================

  const authHeaders = () => {
    const token = localStorage.getItem('accessToken');

    return {
      Authorization: `Bearer ${token}`
    };
  };

  // ==================================================
  // FETCH UNREAD COUNT
  // ==================================================

  const fetchUnreadCount = async () => {
    if (!countPath) return;

    try {
      const token = localStorage.getItem('accessToken');

      if (!token) return;

      const response = await fetch(
        `${API_BASE_URL}${countPath}`,
        {
          headers: authHeaders()
        }
      );

      if (response.status === 403 || response.status === 401) {
        return;
      }

      if (response.ok) {
        const data = await response.json();
        setUnreadCount(data.count || 0);
      }

    } catch (error) {
      console.error('Failed to fetch unread count:', error);
    }
  };

  // ==================================================
  // FETCH NOTIFICATIONS
  // ==================================================

  const fetchNotifications = async () => {
    if (!feedPath) return;

    try {
      setLoading(true);

      const token = localStorage.getItem('accessToken');

      if (!token) return;

      const response = await fetch(
        `${API_BASE_URL}${feedPath}`,
        {
          headers: authHeaders()
        }
      );

      if (response.status === 403 || response.status === 401) {
        return;
      }

      if (response.ok) {
        const data = await response.json();

        setNotifications(
          Array.isArray(data.notifications)
            ? data.notifications
            : []
        );
      }

    } catch (error) {
      console.error('Failed to fetch notifications:', error);

    } finally {
      setLoading(false);
    }
  };

  // ==================================================
  // CLEAN NOTIFICATION TITLE
  // ==================================================

  const cleanNotificationTitle = (title) => {
    if (!title) return '';

    return String(title)
      .replace(/^[\s]*(?:✅|✔️?|☑️?|✓|📚|🔔|📣|▶️|⏰)+[\s]*/u, '');
  };

  // ==================================================
  // PERSON INITIALS
  // ==================================================

  const getInitials = (name) => {
    if (!name) return '?';

    return String(name)
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map(part => part.charAt(0).toUpperCase())
      .join('');
  };

  // ==================================================
  // ACTOR INFORMATION
  // ==================================================

  const getNotificationActor = (notification) => {
    const metadata = notification.metadata || {};

    if (notification.type === 'session_accepted') {
      return {
        name:
          notification.actor_name ||
          metadata.tutor_name ||
          'Tutor',
        avatar:
          notification.image_url ||
          notification.imageUrl ||
          metadata.tutor_avatar ||
          null
      };
    }

    if (notification.type === 'session_booked') {
      return {
        name:
          notification.actor_name ||
          metadata.student_name ||
          'Student',
        avatar:
          notification.image_url ||
          notification.imageUrl ||
          metadata.student_avatar ||
          null
      };
    }

    return {
      name:
        notification.actor_name ||
        metadata.actor_name ||
        metadata.student_name ||
        metadata.tutor_name ||
        'EduSpantech User',
      avatar:
        notification.image_url ||
        notification.imageUrl ||
        metadata.actor_avatar ||
        null
    };
  };

  // ==================================================
  // PROFILE AVATAR
  // NO EMOJI ICONS ARE USED HERE
  // ==================================================

  const renderNotificationAvatar = (notification) => {
    const actor = getNotificationActor(notification);

    const colors = [
      '#4f46e5',
      '#7c3aed',
      '#059669',
      '#10b981',
      '#dc2626',
      '#f59e0b',
      '#8b5cf6',
      '#ec4899'
    ];

    const hash = actor.name
      .split('')
      .reduce((acc, char) => acc + char.charCodeAt(0), 0);

    const backgroundColor = colors[hash % colors.length];

    return (
      <div
        className="dropdown-item-avatar"
        aria-label={actor.name}
        title={actor.name}
      >
        {actor.avatar ? (
          <>
            <img
              src={actor.avatar}
              alt={actor.name}
              className="dropdown-avatar-img"
              loading="lazy"
              onError={(event) => {
                event.currentTarget.style.display = 'none';

                const fallback =
                  event.currentTarget.parentElement?.querySelector(
                    '.dropdown-avatar-initial'
                  );

                if (fallback) {
                  fallback.style.display = 'flex';
                }
              }}
            />

            <div
              className="dropdown-avatar-initial"
              style={{
                display: 'none',
                backgroundColor
              }}
            >
              {getInitials(actor.name)}
            </div>
          </>
        ) : (
          <div
            className="dropdown-avatar-initial"
            style={{
              backgroundColor
            }}
          >
            {getInitials(actor.name)}
          </div>
        )}
      </div>
    );
  };

  // ==================================================
  // MARK ONE NOTIFICATION AS READ
  // ==================================================

  const markAsRead = async (notification) => {
    if (!feedPath) return;

    try {
      let url;

      if (isAdmin && notification.source) {
        url =
          `${API_BASE_URL}/admin/notifications/${notification.id}/read`;
      } else {
        url =
          `${API_BASE_URL}/notifications/${notification.id}/read`;
      }

      const response = await fetch(url, {
        method: 'PUT',
        headers: authHeaders()
      });

      if (response.ok) {
        setNotifications(prev =>
          prev.map(n =>
            n.id === notification.id
              ? { ...n, is_read: true }
              : n
          )
        );

        setUnreadCount(prev => Math.max(0, prev - 1));
      }

    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  // ==================================================
  // MARK ALL AS READ
  // ==================================================

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
        setNotifications(prev =>
          prev.map(n => ({
            ...n,
            is_read: true
          }))
        );

        setUnreadCount(0);
      }

    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  // ==================================================
  // TOGGLE DROPDOWN
  // ==================================================

  const handleToggle = () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    setIsOpen(prev => !prev);

    if (!isOpen) {
      fetchNotifications();
    }
  };

  // ==================================================
  // HANDLE NOTIFICATION CLICK
  // ==================================================

  const handleNotificationClick = (notification) => {
    if (!notification.is_read) {
      markAsRead(notification);
    }

    const link = notification.link;

    if (link) {
      if (/^https?:\/\//i.test(link)) {
        window.open(link, '_blank', 'noopener,noreferrer');
      } else {
        navigate(link);
      }

    } else if (notification.metadata?.session_id) {
      navigate(`/session/${notification.metadata.session_id}`);
    }

    setIsOpen(false);
  };

  // ==================================================
  // AUTHENTICATION CHECK
  // ==================================================

  if (!isAuthenticated) {
    return null;
  }

  // ==================================================
  // RENDER
  // ==================================================

  return (
    <div
      className="notification-bell-wrapper"
      ref={dropdownRef}
    >

      <button
        className={`notification-bell ${
          isOpen ? 'open' : ''
        } ${isActive ? 'active' : ''}`}
        onClick={handleToggle}
        aria-label="Notifications"
      >
        <Bell size={20} strokeWidth={2} />

        {unreadCount > 0 && (
          <span className="notification-badge">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="notification-dropdown">

          {/* HEADER */}

          <div className="dropdown-header">

            <span className="dropdown-title">
              {isAdmin ? 'Admin notifications' : 'Notifications'}
            </span>

            {unreadCount > 0 && (
              <button
                className="mark-all-read-btn"
                onClick={markAllAsRead}
                type="button"
              >
                Mark all read
              </button>
            )}

          </div>

          {/* NOTIFICATION BODY */}

          <div className="dropdown-body">

            {loading ? (

              <div className="dropdown-loading">
                Loading...
              </div>

            ) : notifications.length === 0 ? (

              <div className="dropdown-empty">
                <Bell
                  size={32}
                  style={{
                    opacity: 0.3,
                    marginBottom: 8
                  }}
                />
                <p>No notifications</p>
              </div>

            ) : (

              notifications.slice(0, 10).map((notification) => {

                return (
                  <div
                    key={notification.id}
                    className={`dropdown-item ${
                      !notification.is_read ? 'unread' : ''
                    }`}
                    onClick={() =>
                      handleNotificationClick(notification)
                    }
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

                    {/* REAL PROFILE PHOTO - NO TICK ICON */}

                    {renderNotificationAvatar(notification)}

                    {/* NOTIFICATION CONTENT */}

                    <div className="dropdown-item-content">

                      <div className="dropdown-item-title">

                        {cleanNotificationTitle(notification.title)}

                        {isAdmin &&
                          notification.source === 'platform' && (
                            <span className="dropdown-item-source">
                              {' '}· Platform
                            </span>
                          )}

                      </div>

                      <div className="dropdown-item-message">
                        {notification.message}
                      </div>

                      <div className="dropdown-item-time">
                        {new Date(
                          notification.created_at
                        ).toLocaleDateString()}
                      </div>

                    </div>

                    {!notification.is_read && (
                      <span className="dropdown-item-dot"></span>
                    )}

                  </div>
                );
              })

            )}

          </div>

          {/* FOOTER */}

          {notifications.length > 0 && (

            <div className="dropdown-footer">

              <button
                className="view-all-btn"
                type="button"
                onClick={() => {
                  setIsOpen(false);

                  navigate(
                    isAdmin
                      ? '/admin/notifications'
                      : '/notifications'
                  );
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
