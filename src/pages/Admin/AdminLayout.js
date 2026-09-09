// src/pages/Admin/AdminLayout.js - COMPLETE WITH ADMIN LOGIN REDIRECT
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

    const checkAdminStatus = async () => {
        try {
            const token = localStorage.getItem('accessToken');
            
            // ✅ Redirect to admin login if no token
            if (!token) {
                navigate('/admin/login');
                return;
            }

            const response = await fetch(`${process.env.REACT_APP_API_URL || 'https://eduspantech-backend.onrender.com/api'}/auth/me`, {
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
                setAdmin(data.user);
                setLoading(false);
            } else {
                // User is logged in but not an admin - go to dashboard
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
            
            const response = await fetch(`${process.env.REACT_APP_API_URL || 'https://eduspantech-backend.onrender.com/api'}/admin/notifications`, {
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
            
            const response = await fetch(`${process.env.REACT_APP_API_URL || 'https://eduspantech-backend.onrender.com/api'}/admin/notifications/unread-count`, {
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

    if (!admin) {
        return null;
    }

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
                                // Close mobile sidebar if needed
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

                <div className="sidebar-footer">
                    <div className="admin-info">
                        <div className="admin-avatar">
                            {admin?.avatar ? (
                                <img src={admin.avatar} alt={admin.name} />
                            ) : (
                                <span>{admin?.name?.[0] || 'A'}</span>
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
                        <button className="header-btn" title="Notifications" onClick={fetchNotifications}>
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