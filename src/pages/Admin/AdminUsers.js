// src/pages/Admin/AdminUsers.js
import React, { useState, useEffect } from 'react';
import './AdminUsers.css';

const AdminUsers = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 });
    const [filters, setFilters] = useState({ search: '', role: '', status: '' });
    const [selectedUser, setSelectedUser] = useState(null);
    const [showUserModal, setShowUserModal] = useState(false);
    const [showBanModal, setShowBanModal] = useState(false);
    const [banData, setBanData] = useState({ days: 7, reason: '' });
    const [actionLoading, setActionLoading] = useState(false);

    useEffect(() => {
        fetchUsers();
    }, [pagination.page, filters]);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('accessToken');
            const params = new URLSearchParams({
                page: pagination.page,
                limit: pagination.limit,
                ...(filters.search && { search: filters.search }),
                ...(filters.role && { role: filters.role }),
                ...(filters.status && { status: filters.status })
            });

            const response = await fetch(`${process.env.REACT_APP_API_URL}/admin/users?${params}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            
            if (data.success) {
                setUsers(data.users);
                setPagination(prev => ({
                    ...prev,
                    total: data.pagination.total,
                    totalPages: data.pagination.totalPages
                }));
            }
        } catch (error) {
            console.error('Error fetching users:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleBanUser = async () => {
        if (!selectedUser) return;
        
        try {
            setActionLoading(true);
            const token = localStorage.getItem('accessToken');
            const response = await fetch(`${process.env.REACT_APP_API_URL}/admin/users/${selectedUser.id}/ban`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    days: banData.days,
                    reason: banData.reason
                })
            });
            const data = await response.json();
            
            if (data.success) {
                setShowBanModal(false);
                setSelectedUser(null);
                setBanData({ days: 7, reason: '' });
                fetchUsers();
            }
        } catch (error) {
            console.error('Error banning user:', error);
        } finally {
            setActionLoading(false);
        }
    };

    const handleUnbanUser = async (userId) => {
        if (!window.confirm('Are you sure you want to unban this user?')) return;
        
        try {
            const token = localStorage.getItem('accessToken');
            const response = await fetch(`${process.env.REACT_APP_API_URL}/admin/users/${userId}/unban`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            
            if (data.success) {
                fetchUsers();
            }
        } catch (error) {
            console.error('Error unbanning user:', error);
        }
    };

    const handleRoleChange = async (userId, isTutor, isAdmin) => {
        try {
            const token = localStorage.getItem('accessToken');
            const response = await fetch(`${process.env.REACT_APP_API_URL}/admin/users/${userId}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ is_tutor: isTutor, is_admin: isAdmin })
            });
            const data = await response.json();
            
            if (data.success) {
                fetchUsers();
            }
        } catch (error) {
            console.error('Error updating user role:', error);
        }
    };

    const getStatusBadge = (user) => {
        if (user.banned_until && new Date(user.banned_until) > new Date()) {
            return <span className="status-badge banned">Banned</span>;
        }
        if (user.is_admin) {
            return <span className="status-badge admin">Admin</span>;
        }
        if (user.is_tutor) {
            return <span className="status-badge tutor">Tutor</span>;
        }
        return <span className="status-badge student">Student</span>;
    };

    if (loading) {
        return <div className="admin-users-loading">Loading users...</div>;
    }

    return (
        <div className="admin-users">
            <div className="users-header">
                <h2>User Management</h2>
                <div className="users-controls">
                    <input
                        type="text"
                        placeholder="Search users..."
                        value={filters.search}
                        onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                        className="search-input"
                    />
                    <select
                        value={filters.role}
                        onChange={(e) => setFilters({ ...filters, role: e.target.value })}
                        className="filter-select"
                    >
                        <option value="">All Roles</option>
                        <option value="student">Students</option>
                        <option value="tutor">Tutors</option>
                        <option value="admin">Admins</option>
                    </select>
                    <select
                        value={filters.status}
                        onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                        className="filter-select"
                    >
                        <option value="">All Status</option>
                        <option value="active">Active</option>
                        <option value="banned">Banned</option>
                    </select>
                </div>
            </div>

            <div className="users-table-container">
                <table className="users-table">
                    <thead>
                        <tr>
                            <th>User</th>
                            <th>Email</th>
                            <th>Role</th>
                            <th>Status</th>
                            <th>Joined</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map((user) => (
                            <tr key={user.id}>
                                <td>
                                    <div className="user-cell">
                                        {user.avatar ? (
                                            <img src={user.avatar} alt={user.name} className="user-avatar" />
                                        ) : (
                                            <div className="user-avatar-placeholder">
                                                {user.name?.[0] || 'U'}
                                            </div>
                                        )}
                                        <span>{user.name}</span>
                                    </div>
                                </td>
                                <td>{user.email}</td>
                                <td>
                                    <select
                                        value={user.is_tutor ? 'tutor' : user.is_admin ? 'admin' : 'student'}
                                        onChange={(e) => {
                                            const role = e.target.value;
                                            handleRoleChange(
                                                user.id,
                                                role === 'tutor',
                                                role === 'admin'
                                            );
                                        }}
                                        className="role-select"
                                    >
                                        <option value="student">Student</option>
                                        <option value="tutor">Tutor</option>
                                        <option value="admin">Admin</option>
                                    </select>
                                </td>
                                <td>{getStatusBadge(user)}</td>
                                <td>{new Date(user.created_at).toLocaleDateString()}</td>
                                <td>
                                    <div className="action-buttons">
                                        <button 
                                            className="action-btn view"
                                            onClick={() => {
                                                setSelectedUser(user);
                                                setShowUserModal(true);
                                            }}
                                        >
                                            👁️
                                        </button>
                                        {user.banned_until && new Date(user.banned_until) > new Date() ? (
                                            <button 
                                                className="action-btn unban"
                                                onClick={() => handleUnbanUser(user.id)}
                                            >
                                                ✅
                                            </button>
                                        ) : (
                                            <button 
                                                className="action-btn ban"
                                                onClick={() => {
                                                    setSelectedUser(user);
                                                    setShowBanModal(true);
                                                }}
                                            >
                                                🚫
                                            </button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
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

            {/* Ban Modal */}
            {showBanModal && selectedUser && (
                <div className="modal-overlay" onClick={() => setShowBanModal(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <h3>Ban User: {selectedUser.name}</h3>
                        <div className="form-group">
                            <label>Duration (days)</label>
                            <input
                                type="number"
                                value={banData.days}
                                onChange={(e) => setBanData({ ...banData, days: parseInt(e.target.value) || 1 })}
                                min="1"
                            />
                        </div>
                        <div className="form-group">
                            <label>Reason</label>
                            <textarea
                                value={banData.reason}
                                onChange={(e) => setBanData({ ...banData, reason: e.target.value })}
                                placeholder="Enter reason for ban..."
                            />
                        </div>
                        <div className="modal-actions">
                            <button className="modal-btn cancel" onClick={() => setShowBanModal(false)}>
                                Cancel
                            </button>
                            <button className="modal-btn confirm" onClick={handleBanUser} disabled={actionLoading}>
                                {actionLoading ? 'Baning...' : 'Ban User'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* User Detail Modal */}
            {showUserModal && selectedUser && (
                <div className="modal-overlay" onClick={() => setShowUserModal(false)}>
                    <div className="modal-content user-detail" onClick={e => e.stopPropagation()}>
                        <h3>User Details</h3>
                        <div className="user-detail-grid">
                            <div className="detail-item">
                                <label>Name</label>
                                <span>{selectedUser.name}</span>
                            </div>
                            <div className="detail-item">
                                <label>Email</label>
                                <span>{selectedUser.email}</span>
                            </div>
                            <div className="detail-item">
                                <label>Role</label>
                                <span>{selectedUser.is_tutor ? 'Tutor' : selectedUser.is_admin ? 'Admin' : 'Student'}</span>
                            </div>
                            <div className="detail-item">
                                <label>Joined</label>
                                <span>{new Date(selectedUser.created_at).toLocaleDateString()}</span>
                            </div>
                            <div className="detail-item">
                                <label>Last Login</label>
                                <span>{selectedUser.last_login ? new Date(selectedUser.last_login).toLocaleDateString() : 'Never'}</span>
                            </div>
                            <div className="detail-item">
                                <label>Status</label>
                                <span>{selectedUser.banned_until ? 'Banned' : 'Active'}</span>
                            </div>
                        </div>
                        <button className="modal-btn close" onClick={() => setShowUserModal(false)}>
                            Close
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminUsers;