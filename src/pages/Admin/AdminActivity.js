// src/pages/Admin/AdminActivity.js
import React, { useState, useEffect } from 'react';
import './AdminActivity.css';

const AdminActivity = () => {
    const [activities, setActivities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [pagination, setPagination] = useState({ page: 1, limit: 50, total: 0, totalPages: 0 });
    const [filters, setFilters] = useState({ action: '', adminId: '' });
    const [adminUsers, setAdminUsers] = useState([]);

    useEffect(() => {
        fetchActivities();
        fetchAdminUsers();
    }, [pagination.page, filters]);

    const fetchActivities = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('accessToken');
            const params = new URLSearchParams({
                page: pagination.page,
                limit: pagination.limit,
                ...(filters.action && { action: filters.action }),
                ...(filters.adminId && { adminId: filters.adminId })
            });

            const response = await fetch(`${process.env.REACT_APP_API_URL}/admin/activity?${params}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            
            if (data.success) {
                setActivities(data.activities || []);
                setPagination(prev => ({
                    ...prev,
                    total: data.pagination.total,
                    totalPages: data.pagination.totalPages
                }));
            }
        } catch (error) {
            console.error('Error fetching activities:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchAdminUsers = async () => {
        try {
            const token = localStorage.getItem('accessToken');
            const response = await fetch(`${process.env.REACT_APP_API_URL}/admin/users?role=admin&limit=100`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            if (data.success) {
                setAdminUsers(data.users || []);
            }
        } catch (error) {
            console.error('Error fetching admin users:', error);
        }
    };

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

    const getActionColor = (action) => {
        const colors = {
            'admin_access': '#4f46e5',
            'update_user': '#3b82f6',
            'ban_user': '#ef4444',
            'unban_user': '#10b981',
            'delete_user': '#ef4444',
            'approve_tutor': '#10b981',
            'reject_tutor': '#ef4444',
            'create_subject': '#8b5cf6',
            'update_subject': '#f59e0b',
            'delete_subject': '#ef4444',
            'update_settings': '#06b6d4',
            'create_shift': '#8b5cf6',
            'update_shift': '#f59e0b'
        };
        return colors[action] || '#6b7280';
    };

    if (loading) {
        return <div className="admin-activity-loading">Loading activity log...</div>;
    }

    return (
        <div className="admin-activity">
            <div className="activity-header">
                <h2>Admin Activity Log</h2>
            </div>

            <div className="filters-bar">
                <select
                    value={filters.action}
                    onChange={(e) => setFilters({ ...filters, action: e.target.value })}
                    className="filter-select"
                >
                    <option value="">All Actions</option>
                    <option value="admin_access">Admin Access</option>
                    <option value="update_user">Update User</option>
                    <option value="ban_user">Ban User</option>
                    <option value="unban_user">Unban User</option>
                    <option value="delete_user">Delete User</option>
                    <option value="approve_tutor">Approve Tutor</option>
                    <option value="reject_tutor">Reject Tutor</option>
                    <option value="create_subject">Create Subject</option>
                    <option value="update_subject">Update Subject</option>
                    <option value="delete_subject">Delete Subject</option>
                    <option value="update_settings">Update Settings</option>
                    <option value="create_shift">Create Shift</option>
                    <option value="update_shift">Update Shift</option>
                </select>

                <select
                    value={filters.adminId}
                    onChange={(e) => setFilters({ ...filters, adminId: e.target.value })}
                    className="filter-select"
                >
                    <option value="">All Admins</option>
                    {adminUsers.map((admin) => (
                        <option key={admin.id} value={admin.id}>
                            {admin.name} ({admin.email})
                        </option>
                    ))}
                </select>

                <button className="filter-btn" onClick={() => fetchActivities()}>Apply</button>
            </div>

            <div className="activity-table-container">
                <table className="activity-table">
                    <thead>
                        <tr>
                            <th>Action</th>
                            <th>Admin</th>
                            <th>Target</th>
                            <th>Details</th>
                            <th>Time</th>
                        </tr>
                    </thead>
                    <tbody>
                        {activities.length === 0 ? (
                            <tr>
                                <td colSpan="5" className="no-data">No activity found</td>
                            </tr>
                        ) : (
                            activities.map((activity) => (
                                <tr key={activity.id}>
                                    <td>
                                        <span className="action-badge" style={{ background: getActionColor(activity.action) }}>
                                            {getActionIcon(activity.action)} {activity.action.replace(/_/g, ' ')}
                                        </span>
                                    </td>
                                    <td>
                                        <div className="admin-cell">
                                            <span className="admin-name">{activity.admin_email || 'System'}</span>
                                        </div>
                                    </td>
                                    <td>
                                        <span className="target-type">
                                            {activity.target_type || 'N/A'}
                                            {activity.target_id && (
                                                <span className="target-id"> ({activity.target_id.slice(0, 8)})</span>
                                            )}
                                        </span>
                                    </td>
                                    <td>
                                        <div className="details-cell">
                                            {activity.details ? (
                                                <pre className="details-preview">
                                                    {JSON.stringify(activity.details, null, 2).slice(0, 100)}
                                                    {JSON.stringify(activity.details, null, 2).length > 100 ? '...' : ''}
                                                </pre>
                                            ) : (
                                                '—'
                                            )}
                                        </div>
                                    </td>
                                    <td>
                                        <span className="time-cell">
                                            {new Date(activity.created_at).toLocaleString()}
                                        </span>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            <div className="pagination">
                <button
                    onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
                    disabled={pagination.page === 1}
                >
                    Previous
                </button>
                <span>Page {pagination.page} of {pagination.totalPages}</span>
                <button
                    onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
                    disabled={pagination.page === pagination.totalPages}
                >
                    Next
                </button>
            </div>
        </div>
    );
};

export default AdminActivity;