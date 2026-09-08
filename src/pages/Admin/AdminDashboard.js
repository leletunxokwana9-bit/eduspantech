// src/pages/Admin/AdminDashboard.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './AdminDashboard.css';

const AdminDashboard = () => {
    const navigate = useNavigate();
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [recentActivity, setRecentActivity] = useState([]);
    const [revenueData, setRevenueData] = useState([]);
    const [userGrowth, setUserGrowth] = useState([]);

    useEffect(() => {
        fetchStats();
        fetchRecentActivity();
        fetchRevenueData();
        fetchUserGrowth();
    }, []);

    const fetchStats = async () => {
        try {
            const token = localStorage.getItem('accessToken');
            const response = await fetch(`${process.env.REACT_APP_API_URL}/admin/dashboard/stats`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            if (data.success) {
                setStats(data.stats);
            }
        } catch (error) {
            console.error('Error fetching stats:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchRecentActivity = async () => {
        try {
            const token = localStorage.getItem('accessToken');
            const response = await fetch(`${process.env.REACT_APP_API_URL}/admin/activity?limit=10`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            if (data.success) {
                setRecentActivity(data.activities || []);
            }
        } catch (error) {
            console.error('Error fetching activity:', error);
        }
    };

    const fetchRevenueData = async () => {
        try {
            const token = localStorage.getItem('accessToken');
            const response = await fetch(`${process.env.REACT_APP_API_URL}/admin/analytics/revenue?period=daily`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            if (data.success) {
                setRevenueData(data.data || []);
            }
        } catch (error) {
            console.error('Error fetching revenue:', error);
        }
    };

    const fetchUserGrowth = async () => {
        try {
            const token = localStorage.getItem('accessToken');
            const response = await fetch(`${process.env.REACT_APP_API_URL}/admin/analytics/users?period=7d`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            if (data.success) {
                setUserGrowth(data.data || []);
            }
        } catch (error) {
            console.error('Error fetching user growth:', error);
        }
    };

    const StatCard = ({ title, value, icon, color, subtitle, onClick }) => (
        <div className={`stat-card ${color}`} onClick={onClick} style={{ cursor: onClick ? 'pointer' : 'default' }}>
            <div className="stat-icon">{icon}</div>
            <div className="stat-content">
                <h3>{title}</h3>
                <p className="stat-value">{value ?? '...'}</p>
                {subtitle && <span className="stat-subtitle">{subtitle}</span>}
            </div>
        </div>
    );

    const getActionIcon = (action) => {
        const icons = {
            'admin_access': '🔐',
            'update_user': '✏️',
            'ban_user': '🚫',
            'unban_user': '✅',
            'delete_user': '🗑️',
            'approve_tutor': '✅',
            'reject_tutor': '❌',
            'create_subject': '📚',
            'update_subject': '✏️',
            'delete_subject': '🗑️',
            'update_settings': '⚙️',
            'create_shift': '🕐',
            'update_shift': '✏️'
        };
        return icons[action] || '📝';
    };

    if (loading) {
        return <div className="admin-dashboard-loading">Loading dashboard...</div>;
    }

    return (
        <div className="admin-dashboard">
            <div className="dashboard-header">
                <h2>Dashboard Overview</h2>
                <p className="dashboard-subtitle">Real-time platform statistics and insights</p>
            </div>

            <div className="stats-grid">
                <StatCard 
                    title="Total Users" 
                    value={stats?.users?.total?.toLocaleString()} 
                    icon="👥" 
                    color="blue"
                    onClick={() => navigate('/admin/users')}
                />
                <StatCard 
                    title="Total Tutors" 
                    value={stats?.users?.tutors?.toLocaleString()} 
                    icon="👨‍🏫" 
                    color="green"
                    onClick={() => navigate('/admin/tutors')}
                />
                <StatCard 
                    title="Pending Tutors" 
                    value={stats?.users?.pendingTutors} 
                    icon="⏳" 
                    color="yellow"
                    subtitle="Awaiting approval"
                    onClick={() => navigate('/admin/tutors?status=pending')}
                />
                <StatCard 
                    title="Active Sessions" 
                    value={stats?.sessions?.active} 
                    icon="📚" 
                    color="purple"
                    subtitle={`${stats?.sessions?.today || 0} today`}
                />
                <StatCard 
                    title="Total Revenue" 
                    value={`R${stats?.revenue?.total?.toLocaleString() || 0}`} 
                    icon="💰" 
                    color="emerald"
                    onClick={() => navigate('/admin/payments')}
                />
                <StatCard 
                    title="Monthly Revenue" 
                    value={`R${stats?.revenue?.monthly?.toLocaleString() || 0}`} 
                    icon="📈" 
                    color="indigo"
                    subtitle={`Weekly: R${stats?.revenue?.weekly?.toLocaleString() || 0}`}
                />
            </div>

            <div className="charts-grid">
                <div className="chart-card">
                    <h3>Revenue (Last 30 Days)</h3>
                    <div className="chart-container">
                        {revenueData.length > 0 ? (
                            <div className="revenue-chart">
                                {revenueData.slice(-30).map((item, index) => (
                                    <div key={index} className="chart-bar-wrapper">
                                        <div 
                                            className="chart-bar" 
                                            style={{ 
                                                height: `${(item.amount / Math.max(...revenueData.map(d => d.amount), 1)) * 200}px` 
                                            }}
                                        ></div>
                                        <span className="chart-label">{item.date?.slice(5)}</span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="no-data">No revenue data available</p>
                        )}
                    </div>
                </div>

                <div className="chart-card">
                    <h3>User Growth (Last 7 Days)</h3>
                    <div className="chart-container">
                        {userGrowth.length > 0 ? (
                            <div className="user-growth-chart">
                                {userGrowth.map((item, index) => (
                                    <div key={index} className="chart-bar-wrapper">
                                        <div 
                                            className="chart-bar user-bar" 
                                            style={{ 
                                                height: `${(item.count / Math.max(...userGrowth.map(d => d.count), 1)) * 200}px` 
                                            }}
                                        ></div>
                                        <span className="chart-label">{item.date?.slice(5)}</span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="no-data">No user growth data available</p>
                        )}
                    </div>
                </div>
            </div>

            <div className="recent-activity">
                <h3>Recent Admin Activity</h3>
                {recentActivity.length === 0 ? (
                    <p className="no-activity">No recent activity</p>
                ) : (
                    <div className="activity-list">
                        {recentActivity.map((activity, index) => (
                            <div key={index} className="activity-item">
                                <span className="activity-icon">{getActionIcon(activity.action)}</span>
                                <div className="activity-details">
                                    <p className="activity-action">
                                        <strong>{activity.admin_email || 'System'}</strong> {activity.action.replace(/_/g, ' ')}
                                        {activity.target_type && ` (${activity.target_type})`}
                                    </p>
                                    <span className="activity-time">
                                        {new Date(activity.created_at).toLocaleString()}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminDashboard;