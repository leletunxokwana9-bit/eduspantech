// src/components/NotificationBell.js
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Bell } from 'lucide-react';
import { API_BASE_URL } from '../services/api';
import { authService } from '../services/authService';
import { supabase } from '../services/supabaseClient'; // ✅ Import Supabase
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

  const isActive = location.pathname === '/notifications' || location.pathname === '/admin/notifications';

  // ── Determine auth + role, then set endpoints
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
  }, [feedPath, countPath]);

  // ✅ SUPABASE REALTIME LISTENER FOR INSTANT POPUPS
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user?.id) return;

    const channel = supabase
      .channel('public:notifications-bell')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` },
        (payload) => {
          const newNotif = payload.new;

          // 1. Add to the dropdown list
          setNotifications((prev) => [newNotif, ...prev]);
          
          // 2. Increment the unread count
          setUnreadCount((prev) => prev + 1);

          // 3. Show popup for session reminders
          if (newNotif.type === 'session_reminder') {
            const goToSession = window.confirm(`⏰ ${newNotif.title}\n\n${newNotif.message}\n\nClick OK to go to your sessions.`);
            if (goToSession) navigate('/my-sessions');
          } else if (newNotif.type === 'session_started') {
            const goToSession = window.confirm(`🚀 ${newNotif.title}\n\n${newNotif.message}\n\nClick OK to join the session now.`);
            if (goToSession) navigate('/my-sessions');
          }
        }
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [navigate]);

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
          style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover', border: '2px solid rgba(255,255,255,0.1)' }}
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
      <div className="dropdown-avatar-initial" style={{ width: '32px', height: '32px', borderRadius: '50%', background: color, color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 'bold', textTransform: 'uppercase' }}>
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
    if (!notification.is_read) markAsRead(notification);

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

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="notification-bell-wrapper" ref={dropdownRef}>
      <button
        className={`notification-bell ${isOpen ? 'open' : ''} ${isActive ? 'active' : ''}`}
        onClick={handleToggle}
        aria-label="Notifications"
      >
        <Bell size={20} strokeWidth={2} />
        {unreadCount > 0 && (
          <span className="notification-badge">{unreadCount}</span>
        )}
      </button>

      {isOpen && (
        <div className="notification-dropdown">
          <div className="dropdown-header">
            <span className="dropdown-title">
              {isAdmin ? 'Admin notifications' : 'Notifications'}
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
                <Bell size={32} style={{ opacity: 0.3, marginBottom: 8 }} />
                <p>No notifications</p>
              </div>
            ) : (
              notifications.slice(0, 10).map((notification) => {
                const isSessionBooked = notification.type === 'session_booked';
                const thumbnail = notification.image_url || notification.imageUrl || null;

                return (
                  <div
                    key={notification.id}
                    className={`dropdown-item ${!notification.is_read ? 'unread' : ''}`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    {thumbnail && (
                      <img src={thumbnail} alt="" className="dropdown-item-thumb" loading="lazy" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                    )}

                    <div className="dropdown-item-avatar">
                      {isSessionBooked && notification.metadata?.student_name ? (
                        renderStudentAvatar(notification)
                      ) : (
                        <span className="dropdown-item-icon">
                          {notification.type === 'session_booked' ? '📚' :
                           notification.type === 'session_accepted' ? '✅' :
                           notification.type === 'session_started' ? '▶️' :
                           notification.type === 'session_reminder' ? '⏰' :
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