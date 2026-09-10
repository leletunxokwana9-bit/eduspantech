// src/pages/Admin/AdminLayout.js - COMPLETE WITH AVATAR FIX
import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import './AdminLayout.css';

const AdminLayout = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [admin, setAdmin] = useState(null);
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [loading, setLoading] = useState(true);
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        checkAdminStatus();
        fetchNotifications();
        fetchUnreadCount();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // ============================================
    // CHECK ADMIN STATUS — ALWAYS FETCHES FULL PROFILE
    // ============================================
    const checkAdminStatus = async () => {
        try {
            await new Promise(resolve => setTimeout(resolve, 150));

            const token = localStorage.getItem('accessToken');

            if (!token) {
                console.log('❌ No token found, redirecting to login');
                navigate('/admin/login');
                return;
            }

            console.log('🔍 Token found, fetching admin profile...');

            const response = await fetch(
                `${process.env.REACT_APP_API_URL || 'https://eduspantech-backend.onrender.com/api'}/auth/me`,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            console.log('📡 /auth/me response status:', response.status);

            if (!response.ok) {
                console.log('❌ /auth/me failed, clearing token');
                localStorage.removeItem('accessToken');
                localStorage.removeItem('refreshToken');
                localStorage.removeItem('user');
                navigate('/admin/login');
                return;
            }

            const data = await response.json();
            console.log('✅ /auth/me success — avatar:', data.user?.avatar);

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
                console.log('❌ User is not admin, redirecting to dashboard');
                navigate('/dashboard');
            }
        } catch (error) {
            console.error('❌ Admin auth error:', error);
            navigate('/admin/login');
        }
    };

    // ============================================
    // FETCH NOTIFICATIONS
    // ============================================
    const fetchNotifications = async () => {
        try {
            const token = localStorage.getItem('accessToken');
            if (!token) return;

            const response = await fetch(
                `${process.env.REACT_APP_API_URL || 'https://eduspantech-backend.onrender.com/api'}/admin/notifications`,
                { headers: { 'Authorization': `Bearer ${token}` } }
            );
            const data = await response.json();
            if (data.success) {
                setNotifications(data.notifications || []);
            }
        } catch (error) {
            console.error('Error fetching notifications:', error);
        }
    };

    // ============================================
    // FETCH UNREAD COUNT
    // ============================================
    const fetchUnreadCount = async () => {
        try {
            const token = localStorage.getItem('accessToken');
            if (!token) return;

            const response = await fetch(
                `${process.env.REACT_APP_API_URL || 'https://eduspantech-backend.onrender.com/api'}/admin/notifications/unread-count`,
                { headers: { 'Authorization': `Bearer ${token}` } }
            );
            const data = await response.json();
            if (data.success) {
                setUnreadCount(data.count || 0);
            }
        } catch (error) {
            console.error('Error fetching unread count:', error);
        }
    };

    // ============================================
    // SIDEBAR MENU
    // ============================================
    const menuItems = [
        { path: '/admin', icon: '📊', label: 'Dashboard' },
        { path: '/admin/users', icon: '👥', label: 'Users' },
        { path: '/admin/tutors', icon: '👨‍🏫', label: 'Tutors' },
        { path: '/admin/content', icon: '📚', label: 'Content' },
        { path: '/admin/payments', icon: '💰', label: 'Payments' },
        { path: '/admin/analytics', icon: '📈', label: 'Analytics' },
        { path: '/admin/settings', icon: '⚙️', label: 'Settings' },
        { path: '/admin/activity', icon: '📋', label: 'Activity Log' },
        { path: '/admin/profile', icon: '👤', label: 'My Profile' }
    ];

    // ============================================
    // LOGOUT
    // ============================================
    const handleLogout = () => {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        localStorage.removeItem('userRole');
        navigate('/admin/login');
    };

    // ============================================
    // LOADING STATE
    // ============================================
    if (loading) {
        return (
            <div className="admin-loading">
                <div className="loading-spinner"></div>
                <p>Loading Admin Panel...</p>
            </div>
        );
    }

    if (!admin) {
        return null;
    }

    // ============================================
    // AVATAR RENDER — INLINE STYLES TO AVOID CSS CONFLICTS
    // ============================================
    const avatarSrc = admin?.avatar;
    const avatarInitial = admin?.name?.[0]?.toUpperCase() || 'A';

    // ============================================
    // MAIN RENDER
    // ============================================
    return (
        <div className={`admin-layout ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
            {/* Sidebar */}
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
                            className={({ isActive }) =>
                                `nav-item ${isActive ? 'active' : ''}`
                            }
                            onClick={() => {
                                if (window.innerWidth <= 768) {
                                    setSidebarOpen(false);
                                }
                            }}
                        >
                            <span className="nav-icon">{item.icon}</span>
                            <span className="nav-label">{item.label}</span>
                            {item.path === '/admin/activity' && unreadCount > 0 && (
                                <span className="notification-badge">{unreadCount}</span>
                            )}
                        </NavLink>
                    ))}
                </nav>

                {/* ============================================
                    ADMIN PROFILE WITH AVATAR — INLINE STYLES
                    ============================================ */}
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
                                    style={{
                                        width: '100%',
                                        height: '100%',
                                        objectFit: 'cover',
                                        display: 'block'
                                    }}
                                    onError={(e) => {
                                        console.log('❌ Avatar image failed to load:', avatarSrc);
                                        e.target.style.display = 'none';
                                        if (e.target.parentElement) {
                                            e.target.parentElement.textContent = avatarInitial;
                                        }
                                    }}
                                    onLoad={() => {
                                        console.log('✅ Avatar image loaded successfully:', avatarSrc);
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

            {/* Main Content */}
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
                        <button
                            className="header-btn"
                            title="Notifications"
                            onClick={fetchNotifications}
                        >
                            🔔
                            {unreadCount > 0 && (
                                <span className="header-badge">{unreadCount}</span>
                            )}
                        </button>
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