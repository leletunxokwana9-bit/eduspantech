// src/pages/Admin/AdminLayout.js - COMPLETE WITH PRICING (SUPER-ADMIN ONLY)
import React, { useState, useEffect, useRef } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { 
    LayoutDashboard, 
    Users, 
    FileText, 
    BookOpen, 
    CreditCard, 
    Gem, 
    TrendingUp, 
    Settings, 
    ClipboardList, 
    Bell, 
    User, 
    LogOut, 
    RefreshCw,
    ChevronLeft,
    ChevronRight,
    AlertTriangle,
    CheckCircle,
    PlayCircle,
    FileEdit,
    XCircle,
    Megaphone
} from 'lucide-react';
import './AdminLayout.css';

// Import your favicon
import EduSpantechFavicon from '../../assets/favicon-96x96.png';

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

    useEffect(() => {
        const onDoc = (e) => {
            if (bellRef.current && !bellRef.current.contains(e.target)) {
                setBellOpen(false);
            }
        };
        document.addEventListener('mousedown', onDoc);
        return () => document.removeEventListener('mousedown', onDoc);
    }, []);

    // Close bell on route change
    useEffect(() => {
        setBellOpen(false);
    }, [location.pathname]);

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

    // ============================================================
    // SIDEBAR MENU (Lucide Icons)
    // ============================================================
    const baseMenuItems = [
        { path: '/admin/dashboard', icon: <LayoutDashboard size={20} />, label: 'Dashboard', end: true },
        { path: '/admin/users', icon: <Users size={20} />, label: 'Members' },
        { path: '/admin/tutors', icon: <FileText size={20} />, label: 'Tutor Applications' },
        { path: '/admin/content', icon: <BookOpen size={20} />, label: 'Content' },
        { path: '/admin/payments', icon: <CreditCard size={20} />, label: 'Payments' }
    ];

    const superAdminItems = [
        { path: '/admin/pricing', icon: <Gem size={20} />, label: 'Pricing Plans' }
    ];

    const tailMenuItems = [
        { path: '/admin/analytics', icon: <TrendingUp size={20} />, label: 'Analytics' },
        { path: '/admin/settings', icon: <Settings size={20} />, label: 'Settings' },
        { path: '/admin/activity', icon: <ClipboardList size={20} />, label: 'Activity Log' },
        { path: '/admin/notifications', icon: <Bell size={20} />, label: 'Notifications' },
        { path: '/admin/profile', icon: <User size={20} />, label: 'My Profile' }
    ];

    const menuItems = [
        ...baseMenuItems,
        ...(admin?.is_super_admin ? superAdminItems : []),
        ...tailMenuItems
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

    // Notification Icon Helper
    const getIcon = (type, source) => {
        if (source === 'platform') return <Megaphone size={18} />;
        switch (type) {
            case 'warning': return <AlertTriangle size={18} />;
            case 'session_booked': return <BookOpen size={18} />;
            case 'session_accepted': return <CheckCircle size={18} />;
            case 'session_started': return <PlayCircle size={18} />;
            case 'session_ended': return <FileEdit size={18} />;
            case 'session_cancelled': return <XCircle size={18} />;
            case 'new_tutor': return <User size={18} />;
            case 'system': return <Megaphone size={18} />;
            default: return <Bell size={18} />;
        }
    };

    return (
        <div className={`admin-layout ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
            <aside className="admin-sidebar">
                <div className="sidebar-header">
                    <div className="logo">
                        {/* Using the favicon as the logo */}
                        <img src={EduSpantechFavicon} alt="EduSpantech" className="logo-img" />
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
                            {item.path === '/admin/notifications' && unreadCount > 0 && (
                                <span className="notification-badge">{unreadCount}</span>
                            )}
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
                        <LogOut size={16} style={{ marginRight: '8px' }} />
                        Logout
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
                        {sidebarOpen ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
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
                        <div className="admin-bell-wrapper" ref={bellRef}>
                            <button
                                className={`header-btn admin-bell-btn ${bellOpen ? 'is-open' : ''}`}
                                title="Notifications"
                                onClick={handleBellToggle}
                            >
                                <Bell size={20} />
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
                                                <Bell size={24} style={{ opacity: 0.5, marginBottom: '8px' }} />
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
                                                navigate('/admin/notifications');
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
                            <RefreshCw size={20} />
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