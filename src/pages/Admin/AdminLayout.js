// src/pages/Admin/AdminLayout.js
import React, { useState, useEffect, useRef } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import './AdminLayout.css';

const API = process.env.REACT_APP_API_URL || 'https://eduspantech-backend.onrender.com/api';

const AdminLayout = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [admin, setAdmin] = useState(null);
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [loading, setLoading] = useState(true);
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [bellOpen, setBellOpen] = useState(false);
    const bellRef = useRef(null);

    // ── Boot
    useEffect(() => {
        checkAdminStatus();
        fetchNotifications();
        fetchUnreadCount();

        const interval = setInterval(() => {
            fetchUnreadCount();
        }, 30000);
        return () => clearInterval(interval);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // ── Close bell on outside click
    useEffect(() => {
        const onDoc = (e) => {
            if (bellRef.current && !bellRef.current.contains(e.target)) {
                setBellOpen(false);
            }
        };
        document.addEventListener('mousedown', onDoc);
        return () => document.removeEventListener('mousedown', onDoc);
    }, []);

    const checkAdminStatus = async () => {
        try {
            await new Promise(resolve => setTimeout(resolve, 150));
            const token = localStorage.getItem('accessToken');
            if (!token) { navigate('/admin/login'); return; }

            const response = await fetch(`${API}/auth/me`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                localStorage.removeItem('accessToken');
                localStorage.removeItem('refreshToken');
                localStorage.removeItem('user');
                navigate('/admin/login');
                return;
            }

            const data = await response.json();
            if (data.user?.is_admin) {
                setAdmin({
                    id: data.user.id,
                    name: data.user.name,
                    email: data.user.email,
                    avatar: data.user.avatar || null,
                    bio: data.user.bio || '',
                    phone: data.user.phone || '',
                    is_admin: data.user.is_admin,
                    is_super_admin: data.user.is_super_admin,
                    admin_role: data.user.admin_role
                });
                setLoading(false);
            } else {
                navigate('/dashboard');
            }
        } catch (error) {
            console.error('Admin auth error:', error);
            navigate('/admin/login');
        }
    };

    const fetchNotifications = async () => {
        try {
            const token = localStorage.getItem('accessToken');
            if (!token) return;

            const response = await fetch(`${API}/admin/notifications/feed`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            if (data.success) {
                setNotifications(data.notifications || []);
            }
        } catch (error) {
            console.error('Error fetching notifications:', error);
        }
    };

    const fetchUnreadCount = async () => {
        try {
            const token = localStorage.getItem('accessToken');
            if (!token) return;

            const response = await fetch(`${API}/admin/notifications/feed-unread-count`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            if (data.success) {
                setUnreadCount(data.count || 0);
            }
        } catch (error) {
            console.error('Error fetching unread count:', error);
        }
    };

    const markAsRead = async (notification) => {
        try {
            const token = localStorage.getItem('accessToken');
            const res = await fetch(`${API}/admin/notifications/${notification.id}/read`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                setNotifications(prev =>
                    prev.map(n => n.id === notification.id ? { ...n, is_read: true } : n)
                );
                setUnreadCount(prev => Math.max(0, prev - 1));
            }
        } catch (error) {
            console.error('mark as read error:', error);
        }
    };

    const markAllAsRead = async () => {
        try {
            const token = localStorage.getItem('accessToken');
            const res = await fetch(`${API}/admin/notifications/read-all`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
                setUnreadCount(0);
            }
        } catch (error) {
            console.error('mark all error:', error);
        }
    };

    const handleBellToggle = () => {
        const next = !bellOpen;
        setBellOpen(next);
        if (next) fetchNotifications();
    };

    const handleNotificationClick = (notification) => {
        if (!notification.is_read) markAsRead(notification);
        if (notification.link) navigate(notification.link);
        setBellOpen(false);
    };

    const menuItems = [
        { path: '/admin', icon: '📊', label: 'Dashboard', end: true },
        { path: '/admin/users', icon: '👥', label: 'Members' },
        { path: '/admin/tutors', icon: '📝', label: 'Tutor Applications' },
        { path: '/admin/content', icon: '📚', label: 'Content' },
        { path: '/admin/payments', icon: '💰', label: 'Payments' },
        { path: '/admin/analytics', icon: '📈', label: 'Analytics' },
        { path: '/admin/settings', icon: '⚙️', label: 'Settings' },
        { path: '/admin/activity', icon: '📋', label: 'Activity Log' },
        { path: '/admin/profile', icon: '👤', label: 'My Profile' }
    ];

    const handleLogout = () => {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        localStorage.removeItem('userRole');
        navigate('/admin/login');
    };

    if (loading) {
        return (
            <div className="admin-loading">
                <div className="loading-spinner"></div>
                <p>Loading Admin Panel...</p>
            </div>
        );
    }

    if (!admin) return null;

    const avatarSrc = admin?.avatar;
    const avatarInitial = admin?.name?.[0]?.toUpperCase() || 'A';

    const getIcon = (type, source) => {
        if (source === 'platform') return '📣';
        switch (type) {
            case 'warning': return '⚠️';
            case 'session_booked': return '📚';
            case 'session_accepted': return '✅';
            case 'session_started': return '▶️';
            case 'session_ended': return '📝';
            case 'session_cancelled': return '❌';
            case 'new_tutor': return '👨‍🏫';
            case 'system': return '📣';
            default: return '🔔';
        }
    };

    return (
        <div className={`admin-layout ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
            <aside className="admin-sidebar">
                <div className="sidebar-header">
                    <div className="logo">
                        <span className="logo-icon">🎓</span>
                        <span className="logo-text">EduSpantech</span>
                    </div>
                    <span className="admin-badge">Admin</span>
                </div>

                <nav className="sidebar-nav">
                    {menuItems.map(item => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            end={item.end}
                            className={({ isActive }) =>
                                `nav-item ${isActive ? 'active' : ''}`
                            }
                            onClick={() => {
                                if (window.innerWidth <= 768) setSidebarOpen(false);
                            }}
                        >
                            <span className="nav-icon">{item.icon}</span>
                            <span className="nav-label">{item.label}</span>
                        </NavLink>
                    ))}
                </nav>

                <div className="sidebar-footer">
                    <div className="admin-info">
                        <div
                            style={{
                                width: '40px',
                                height: '40px',
                                borderRadius: '50%',
                                overflow: 'hidden',
                                flexShrink: 0,
                                background: '#4f46e5',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: '#ffffff',
                                fontWeight: '700',
                                fontSize: '18px'
                            }}
                        >
                            {avatarSrc ? (
                                <img
                                    src={avatarSrc}
                                    alt={admin.name}
                                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                                    onError={(e) => {
                                        e.target.style.display = 'none';
                                        if (e.target.parentElement) {
                                            e.target.parentElement.textContent = avatarInitial;
                                        }
                                    }}
                                />
                            ) : (
                                <span>{avatarInitial}</span>
                            )}
                        </div>
                        <div className="admin-details">
                            <span className="admin-name">{admin?.name || 'Admin'}</span>
                            <span className="admin-role">
                                {admin?.is_super_admin ? 'Super Admin' : 'Administrator'}
                            </span>
                        </div>
                    </div>
                    <button className="logout-btn" onClick={handleLogout}>
                        🚪 Logout
                    </button>
                </div>
            </aside>

            <main className="admin-main">
                <header className="admin-header">
                    <button
                        className="toggle-sidebar"
                        onClick={() => setSidebarOpen(!sidebarOpen)}
                        aria-label="Toggle sidebar"
                    >
                        {sidebarOpen ? '◀' : '▶'}
                    </button>
                    <div className="header-title">
                        <h1>Administration Panel</h1>
                        <span className="header-subtitle">
                            {new Date().toLocaleString('en-US', {
                                weekday: 'long',
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                            })}
                        </span>
                    </div>
                    <div className="header-actions">
                        {/* ===== NOTIFICATIONS BELL ===== */}
                        <div className="admin-bell-wrapper" ref={bellRef}>
                            <button
                                className={`header-btn admin-bell-btn ${bellOpen ? 'is-open' : ''}`}
                                title="Notifications"
                                onClick={handleBellToggle}
                            >
                                🔔
                                {unreadCount > 0 && (
                                    <span className="header-badge">{unreadCount}</span>
                                )}
                            </button>

                            {bellOpen && (
                                <div className="admin-bell-dropdown">
                                    <div className="admin-bell-header">
                                        <span>Notifications</span>
                                        {unreadCount > 0 && (
                                            <button
                                                className="admin-bell-mark-all"
                                                onClick={markAllAsRead}
                                            >
                                                Mark all read
                                            </button>
                                        )}
                                    </div>

                                    <div className="admin-bell-body">
                                        {notifications.length === 0 ? (
                                            <div className="admin-bell-empty">
                                                <span>🔔</span>
                                                <p>No notifications</p>
                                            </div>
                                        ) : (
                                            notifications.slice(0, 8).map(n => (
                                                <div
                                                    key={n.id}
                                                    className={`admin-bell-item ${!n.is_read ? 'unread' : ''}`}
                                                    onClick={() => handleNotificationClick(n)}
                                                >
                                                    <span className="admin-bell-item-icon">
                                                        {getIcon(n.type, n.source)}
                                                    </span>
                                                    <div className="admin-bell-item-content">
                                                        <div className="admin-bell-item-title">
                                                            {n.title}
                                                            {n.source === 'platform' && (
                                                                <span className="admin-bell-platform-tag"> · Platform</span>
                                                            )}
                                                        </div>
                                                        <div className="admin-bell-item-message">{n.message}</div>
                                                        <div className="admin-bell-item-time">
                                                            {new Date(n.created_at).toLocaleString('en-GB', {
                                                                day: 'numeric',
                                                                month: 'short',
                                                                hour: '2-digit',
                                                                minute: '2-digit'
                                                            })}
                                                        </div>
                                                    </div>
                                                    {!n.is_read && <span className="admin-bell-dot" />}
                                                </div>
                                            ))
                                        )}
                                    </div>

                                    <div className="admin-bell-footer">
                                        <button
                                            className="admin-bell-view-all"
                                            onClick={() => {
                                                setBellOpen(false);
                                                navigate('/notifications');
                                            }}
                                        >
                                            View all notifications →
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        <button
                            className="header-btn"
                            title="Refresh"
                            onClick={() => window.location.reload()}
                        >
                            🔄
                        </button>
                    </div>
                </header>

                <div className="admin-content">
                    <Outlet />
                </div>
            </main>
        </div>
    );
};

export default AdminLayout;