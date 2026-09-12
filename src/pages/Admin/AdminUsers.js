// src/pages/Admin/AdminUsers.js
import React, { useState, useEffect } from 'react';
import './AdminUsers.css';

const API = process.env.REACT_APP_API_URL || 'https://eduspantech-backend.onrender.com/api';

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [filters, setFilters] = useState({ search: '', role: '', status: '' });

  const [selectedUser, setSelectedUser] = useState(null);

  // Modal visibility
  const [showUserModal, setShowUserModal] = useState(false);
  const [showBanModal, setShowBanModal] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [showWarnModal, setShowWarnModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [openMenuId, setOpenMenuId] = useState(null);

  // Form state
  const [banData, setBanData] = useState({ days: 7, reason: '', permanent: false });
  const [roleData, setRoleData] = useState({ role: 'student' });
  const [warnData, setWarnData] = useState({ message: '' });
  const [deleteData, setDeleteData] = useState({ hard: false, confirmText: '' });

  const [actionLoading, setActionLoading] = useState(false);

  // ============================================
  // FEEDBACK MODAL
  // ============================================
  const [feedback, setFeedback] = useState(null);

  const showFeedback = (type, title, message) => {
    setFeedback({ type, title, message });
  };

  const closeFeedback = () => setFeedback(null);

  // ============================================
  // FETCH USERS
  // ============================================
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

      const response = await fetch(`${API}/admin/users?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();

      if (data.success) {
        setUsers(data.users || []);
        setPagination(prev => ({
          ...prev,
          total: data.pagination.total,
          totalPages: data.pagination.totalPages
        }));
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      showFeedback('error', 'Load failed', 'Could not load members.');
    } finally {
      setLoading(false);
    }
  };

  const patchLocalUser = (userId, patch) => {
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, ...patch } : u));
  };

  // Reset to page 1 whenever filters change
  useEffect(() => {
    setPagination(prev => (prev.page === 1 ? prev : { ...prev, page: 1 }));
  }, [filters.search, filters.role, filters.status]);

  // Fetch whenever page or any filter changes
  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagination.page, filters.search, filters.role, filters.status]);

  useEffect(() => {
    const handleClickOutside = () => setOpenMenuId(null);
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const authHeaders = () => {
    const token = localStorage.getItem('accessToken');
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  };

  // ============================================
  // ACTIONS
  // ============================================
  const handleBanUser = async () => {
    if (!selectedUser) return;
    const { days, reason, permanent } = banData;
    if (!permanent && (!days || days < 1)) {
      return showFeedback('error', 'Invalid duration', 'Enter a duration in days.');
    }
    if (!reason.trim()) {
      return showFeedback('error', 'Reason required', 'Please provide a reason for the ban.');
    }

    try {
      setActionLoading(true);
      const res = await fetch(`${API}/admin/users/${selectedUser.id}/ban`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          days: permanent ? -1 : Number(days),
          reason: reason.trim()
        })
      });
      const data = await res.json();
      if (data.success) {
        patchLocalUser(selectedUser.id, {
          banned_until: data.banned_until || new Date().toISOString()
        });
        setShowBanModal(false);
        setSelectedUser(null);
        setBanData({ days: 7, reason: '', permanent: false });
        showFeedback(
          'success',
          'Member banned',
          data.message || `${selectedUser.name} has been banned.`
        );
      } else {
        showFeedback('error', 'Ban failed', data.error || 'Something went wrong.');
      }
    } catch (error) {
      console.error('Ban error:', error);
      showFeedback('error', 'Network error', 'Could not reach the server.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUnbanUser = async (userId) => {
    const user = users.find(u => u.id === userId);
    try {
      const res = await fetch(`${API}/admin/users/${userId}/unban`, {
        method: 'POST',
        headers: authHeaders()
      });
      const data = await res.json();
      if (data.success) {
        patchLocalUser(userId, { banned_until: null, ban_reason: null });
        showFeedback('success', 'Member unbanned', `${user?.name || 'Member'} can sign in again.`);
      } else {
        showFeedback('error', 'Unban failed', data.error || 'Something went wrong.');
      }
    } catch (error) {
      console.error('Unban error:', error);
      showFeedback('error', 'Network error', 'Could not reach the server.');
    }
  };

  const handleChangeRole = async () => {
    if (!selectedUser || !roleData.role) return;
    try {
      setActionLoading(true);
      const res = await fetch(`${API}/admin/users/${selectedUser.id}/role`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify({ role: roleData.role })
      });
      const data = await res.json();
      if (data.success) {
        patchLocalUser(selectedUser.id, {
          is_tutor: roleData.role === 'tutor',
          is_admin: roleData.role === 'admin',
          role: roleData.role
        });
        setShowRoleModal(false);
        setSelectedUser(null);
        showFeedback('success', 'Role updated', `${selectedUser.name} is now a ${roleData.role}.`);
      } else {
        showFeedback('error', 'Role change failed', data.error || 'Something went wrong.');
      }
    } catch (error) {
      console.error('Role change error:', error);
      showFeedback('error', 'Network error', 'Could not reach the server.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeactivate = async (userId) => {
    const user = users.find(u => u.id === userId);
    try {
      const res = await fetch(`${API}/admin/users/${userId}/deactivate`, {
        method: 'POST',
        headers: authHeaders()
      });
      const data = await res.json();
      if (data.success) {
        patchLocalUser(userId, { is_active: false });
        showFeedback('success', 'Member deactivated', `${user?.name || 'Member'} can no longer sign in.`);
      } else {
        showFeedback('error', 'Deactivate failed', data.error || 'Something went wrong.');
      }
    } catch (error) {
      console.error('Deactivate error:', error);
      showFeedback('error', 'Network error', 'Could not reach the server.');
    }
  };

  const handleActivate = async (userId) => {
    const user = users.find(u => u.id === userId);
    try {
      const res = await fetch(`${API}/admin/users/${userId}/activate`, {
        method: 'POST',
        headers: authHeaders()
      });
      const data = await res.json();
      if (data.success) {
        patchLocalUser(userId, { is_active: true, deleted_at: null });
        showFeedback('success', 'Member activated', `${user?.name || 'Member'} can sign in again.`);
      } else {
        showFeedback('error', 'Activate failed', data.error || 'Something went wrong.');
      }
    } catch (error) {
      console.error('Activate error:', error);
      showFeedback('error', 'Network error', 'Could not reach the server.');
    }
  };

  const handleVerify = async (userId) => {
    const user = users.find(u => u.id === userId);
    try {
      const res = await fetch(`${API}/admin/users/${userId}/verify`, {
        method: 'POST',
        headers: authHeaders()
      });
      const data = await res.json();
      if (data.success) {
        patchLocalUser(userId, { is_verified: true });
        showFeedback('success', 'Email verified', `${user?.name || 'Member'} can now sign in.`);
      } else {
        showFeedback('error', 'Verify failed', data.error || 'Something went wrong.');
      }
    } catch (error) {
      console.error('Verify error:', error);
      showFeedback('error', 'Network error', 'Could not reach the server.');
    }
  };

  const handleForceLogout = async (userId) => {
    const user = users.find(u => u.id === userId);
    try {
      const res = await fetch(`${API}/admin/users/${userId}/force-logout`, {
        method: 'POST',
        headers: authHeaders()
      });
      const data = await res.json();
      if (data.success) {
        showFeedback('success', 'Sessions terminated', `All of ${user?.name || 'this member'}'s active sessions have been closed.`);
      } else {
        showFeedback('error', 'Force logout failed', data.error || 'Something went wrong.');
      }
    } catch (error) {
      console.error('Force logout error:', error);
      showFeedback('error', 'Network error', 'Could not reach the server.');
    }
  };

  const handleWarn = async () => {
    if (!selectedUser) return;
    if (!warnData.message.trim()) {
      return showFeedback('error', 'Message required', 'Please enter a warning message.');
    }
    try {
      setActionLoading(true);
      const res = await fetch(`${API}/admin/users/${selectedUser.id}/warn`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ message: warnData.message.trim() })
      });
      const data = await res.json();
      if (data.success) {
        const name = selectedUser.name;
        setShowWarnModal(false);
        setSelectedUser(null);
        setWarnData({ message: '' });
        showFeedback('success', 'Warning recorded', `${name} has been warned.`);
      } else {
        showFeedback('error', 'Warn failed', data.error || 'Something went wrong.');
      }
    } catch (error) {
      console.error('Warn error:', error);
      showFeedback('error', 'Network error', 'Could not reach the server.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedUser) return;
    const isHard = deleteData.hard;
    if (isHard && deleteData.confirmText !== 'DELETE') {
      return showFeedback('error', 'Confirm required', 'Type DELETE to confirm permanent deletion.');
    }

    try {
      setActionLoading(true);
      const url = `${API}/admin/users/${selectedUser.id}${isHard ? '?hard=true' : ''}`;
      const res = await fetch(url, {
        method: 'DELETE',
        headers: authHeaders()
      });
      const data = await res.json();
      if (data.success) {
        const name = selectedUser.name;
        if (isHard) {
          setUsers(prev => prev.filter(u => u.id !== selectedUser.id));
        } else {
          patchLocalUser(selectedUser.id, {
            is_active: false,
            deleted_at: new Date().toISOString()
          });
        }
        setShowDeleteModal(false);
        setSelectedUser(null);
        setDeleteData({ hard: false, confirmText: '' });
        showFeedback(
          'success',
          isHard ? 'Member permanently deleted' : 'Member moved to deleted',
          isHard
            ? `${name} has been removed permanently.`
            : `${name} can be recovered for 30 days.`
        );
      } else {
        showFeedback('error', 'Delete failed', data.error || 'Something went wrong.');
      }
    } catch (error) {
      console.error('Delete error:', error);
      showFeedback('error', 'Network error', 'Could not reach the server.');
    } finally {
      setActionLoading(false);
    }
  };

  // ============================================
  // UI HELPERS
  // ============================================
  const getStatusBadge = (user) => {
    if (user.banned_until && new Date(user.banned_until) > new Date()) {
      const isPermanent = new Date(user.banned_until).getFullYear() >= 2099;
      return <span className="status-badge banned">{isPermanent ? 'Permanently Banned' : 'Banned'}</span>;
    }
    if (user.deleted_at) {
      return <span className="status-badge deleted">Deleted</span>;
    }
    if (user.is_active === false) {
      return <span className="status-badge inactive">Inactive</span>;
    }
    if (user.is_admin) {
      return <span className="status-badge admin">Admin</span>;
    }
    if (user.is_tutor) {
      return <span className="status-badge tutor">Tutor</span>;
    }
    return <span className="status-badge student">Student</span>;
  };

  const isBanned = (user) =>
    user.banned_until && new Date(user.banned_until) > new Date();

  const isSelf = (user) => {
    try {
      const me = JSON.parse(localStorage.getItem('user') || '{}');
      return me.id === user.id;
    } catch {
      return false;
    }
  };

  return (
    <div className="admin-users">
      <div className="users-header">
        <h2>Member Management</h2>
        <div className="users-controls">
          <input
            type="text"
            placeholder="Search members..."
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
              <th>Member</th>
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
                  <span className={`role-pill role-${user.is_admin ? 'admin' : user.is_tutor ? 'tutor' : 'student'}`}>
                    {user.is_admin ? 'Admin' : user.is_tutor ? 'Tutor' : 'Student'}
                  </span>
                </td>
                <td>{getStatusBadge(user)}</td>
                <td>{new Date(user.created_at).toLocaleDateString()}</td>
                <td>
                  <div className="actions-cell">
                    <button
                      className="action-btn view"
                      onClick={() => {
                        setSelectedUser(user);
                        setShowUserModal(true);
                      }}
                      title="View details"
                    >
                      👁️
                    </button>

                    <div className="dropdown-wrap">
                      <button
                        className="action-btn menu"
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenMenuId(openMenuId === user.id ? null : user.id);
                        }}
                        title="More actions"
                      >
                        ⋯
                      </button>

                      {openMenuId === user.id && !isSelf(user) && (
                        <div className="dropdown-menu" onClick={e => e.stopPropagation()}>
                          {isBanned(user) ? (
                            <button onClick={() => { setOpenMenuId(null); handleUnbanUser(user.id); }}>
                              ✅ Unban
                            </button>
                          ) : (
                            <button onClick={() => {
                              setOpenMenuId(null);
                              setSelectedUser(user);
                              setBanData({ days: 7, reason: '', permanent: false });
                              setShowBanModal(true);
                            }}>
                              🚫 Ban
                            </button>
                          )}

                          <button onClick={() => {
                            setOpenMenuId(null);
                            setSelectedUser(user);
                            setRoleData({
                              role: user.is_admin ? 'admin' : user.is_tutor ? 'tutor' : 'student'
                            });
                            setShowRoleModal(true);
                          }}>
                            🔑 Change Role
                          </button>

                          <button onClick={() => {
                            setOpenMenuId(null);
                            setSelectedUser(user);
                            setWarnData({ message: '' });
                            setShowWarnModal(true);
                          }}>
                            ⚠️ Warn
                          </button>

                          <div className="dropdown-divider" />

                          {user.is_active === false ? (
                            <button onClick={() => { setOpenMenuId(null); handleActivate(user.id); }}>
                              ▶️ Activate
                            </button>
                          ) : (
                            <button onClick={() => { setOpenMenuId(null); handleDeactivate(user.id); }}>
                              ⏸️ Deactivate
                            </button>
                          )}

                          {!user.is_verified && (
                            <button onClick={() => { setOpenMenuId(null); handleVerify(user.id); }}>
                              ✔️ Verify Email
                            </button>
                          )}

                          <button onClick={() => { setOpenMenuId(null); handleForceLogout(user.id); }}>
                            🚪 Force Logout
                          </button>

                          <div className="dropdown-divider" />

                          <button
                            className="danger"
                            onClick={() => {
                              setOpenMenuId(null);
                              setSelectedUser(user);
                              setDeleteData({ hard: false, confirmText: '' });
                              setShowDeleteModal(true);
                            }}
                          >
                            🗑️ Delete
                          </button>
                        </div>
                      )}
                    </div>
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

      {/* ============ BAN MODAL ============ */}
      {showBanModal && selectedUser && (
        <div className="au-overlay" onClick={() => setShowBanModal(false)}>
          <div className="au-modal" onClick={e => e.stopPropagation()}>
            <button className="au-close" onClick={() => setShowBanModal(false)}>✕</button>

            <div className="au-icon-wrap au-icon-danger">
              <span className="au-icon">🚫</span>
            </div>

            <div className="au-header">
              <h3>Ban {selectedUser.name}?</h3>
              <p>The member will be blocked from signing in.</p>
            </div>

            <div className="au-body">
              <label className="au-toggle">
                <input
                  type="checkbox"
                  checked={banData.permanent}
                  onChange={(e) => setBanData({ ...banData, permanent: e.target.checked })}
                />
                <span className="au-toggle-track"><span className="au-toggle-thumb" /></span>
                <span className="au-toggle-label">Permanent ban</span>
              </label>

              {!banData.permanent && (
                <div className="au-field">
                  <label>Duration (days)</label>
                  <input
                    type="number"
                    value={banData.days}
                    onChange={(e) => setBanData({ ...banData, days: parseInt(e.target.value) || 1 })}
                    min="1"
                  />
                </div>
              )}

              <div className="au-field">
                <label>Reason *</label>
                <textarea
                  value={banData.reason}
                  onChange={(e) => setBanData({ ...banData, reason: e.target.value })}
                  placeholder="Explain why this member is being banned..."
                  rows={3}
                />
              </div>
            </div>

            <div className="au-footer">
              <button className="au-btn au-btn-ghost" onClick={() => setShowBanModal(false)}>Cancel</button>
              <button className="au-btn au-btn-danger" onClick={handleBanUser} disabled={actionLoading}>
                {actionLoading ? '⏳ Banning…' : '🚫 Ban Member'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============ ROLE MODAL ============ */}
      {showRoleModal && selectedUser && (
        <div className="au-overlay" onClick={() => setShowRoleModal(false)}>
          <div className="au-modal" onClick={e => e.stopPropagation()}>
            <button className="au-close" onClick={() => setShowRoleModal(false)}>✕</button>

            <div className="au-icon-wrap au-icon-primary">
              <span className="au-icon">🔑</span>
            </div>

            <div className="au-header">
              <h3>Change role</h3>
              <p>Update access level for <strong>{selectedUser.name}</strong>.</p>
            </div>

            <div className="au-body">
              <div className="au-field">
                <label>New Role</label>
                <select
                  value={roleData.role}
                  onChange={(e) => setRoleData({ role: e.target.value })}
                >
                  <option value="student">👨‍🎓 Student</option>
                  <option value="tutor">👨‍🏫 Tutor</option>
                  <option value="admin">🛡️ Admin</option>
                </select>
              </div>
            </div>

            <div className="au-footer">
              <button className="au-btn au-btn-ghost" onClick={() => setShowRoleModal(false)}>Cancel</button>
              <button className="au-btn au-btn-primary" onClick={handleChangeRole} disabled={actionLoading}>
                {actionLoading ? '⏳ Saving…' : '💾 Save Role'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============ WARN MODAL ============ */}
      {showWarnModal && selectedUser && (
        <div className="au-overlay" onClick={() => setShowWarnModal(false)}>
          <div className="au-modal" onClick={e => e.stopPropagation()}>
            <button className="au-close" onClick={() => setShowWarnModal(false)}>✕</button>

            <div className="au-icon-wrap au-icon-warning">
              <span className="au-icon">⚠️</span>
            </div>

            <div className="au-header">
              <h3>Warn member</h3>
              <p>Send a warning to <strong>{selectedUser.name}</strong>. This gets logged.</p>
            </div>

            <div className="au-body">
              <div className="au-field">
                <label>Warning message *</label>
                <textarea
                  value={warnData.message}
                  onChange={(e) => setWarnData({ message: e.target.value })}
                  placeholder="Explain the reason for the warning..."
                  rows={4}
                />
              </div>
            </div>

            <div className="au-footer">
              <button className="au-btn au-btn-ghost" onClick={() => setShowWarnModal(false)}>Cancel</button>
              <button className="au-btn au-btn-warning" onClick={handleWarn} disabled={actionLoading}>
                {actionLoading ? '⏳ Sending…' : '⚠️ Send Warning'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============ DELETE MODAL ============ */}
      {showDeleteModal && selectedUser && (
        <div className="au-overlay" onClick={() => setShowDeleteModal(false)}>
          <div className="au-modal" onClick={e => e.stopPropagation()}>
            <button className="au-close" onClick={() => setShowDeleteModal(false)}>✕</button>

            <div className="au-icon-wrap au-icon-danger">
              <span className="au-icon">🗑️</span>
            </div>

            <div className="au-header">
              <h3>Delete {selectedUser.name}?</h3>
              <p>Reversible for 30 days unless you choose permanent delete.</p>
            </div>

            <div className="au-body">
              <label className="au-toggle">
                <input
                  type="checkbox"
                  checked={deleteData.hard}
                  onChange={(e) => setDeleteData({ ...deleteData, hard: e.target.checked, confirmText: '' })}
                />
                <span className="au-toggle-track"><span className="au-toggle-thumb" /></span>
                <span className="au-toggle-label">Permanently delete (super-admin only)</span>
              </label>

              {deleteData.hard ? (
                <div className="au-field">
                  <label>Type <code>DELETE</code> to confirm</label>
                  <input
                    type="text"
                    value={deleteData.confirmText}
                    onChange={(e) => setDeleteData({ ...deleteData, confirmText: e.target.value })}
                    placeholder="DELETE"
                  />
                </div>
              ) : (
                <p className="au-note">The member will be hidden but recoverable for 30 days.</p>
              )}
            </div>

            <div className="au-footer">
              <button className="au-btn au-btn-ghost" onClick={() => setShowDeleteModal(false)}>Cancel</button>
              <button className="au-btn au-btn-danger" onClick={handleDelete} disabled={actionLoading}>
                {actionLoading ? '⏳ Deleting…' : (deleteData.hard ? '💀 Permanently Delete' : '🗑️ Delete')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============ VIEW MODAL ============ */}
      {showUserModal && selectedUser && (
        <div className="au-overlay" onClick={() => setShowUserModal(false)}>
          <div className="au-modal" onClick={e => e.stopPropagation()}>
            <button className="au-close" onClick={() => setShowUserModal(false)}>✕</button>

            <div className="au-icon-wrap au-icon-primary">
              <span className="au-icon">👤</span>
            </div>

            <div className="au-header">
              <h3>Member Details</h3>
              <p>{selectedUser.name}</p>
            </div>

            <div className="au-body">
              <div className="au-info-grid">
                <div className="au-info-item">
                  <span className="au-info-label">Email</span>
                  <span className="au-info-value">{selectedUser.email}</span>
                </div>
                <div className="au-info-item">
                  <span className="au-info-label">Role</span>
                  <span className="au-info-value">
                    {selectedUser.is_admin ? 'Admin' : selectedUser.is_tutor ? 'Tutor' : 'Student'}
                  </span>
                </div>
                <div className="au-info-item">
                  <span className="au-info-label">Joined</span>
                  <span className="au-info-value">{new Date(selectedUser.created_at).toLocaleDateString()}</span>
                </div>
                <div className="au-info-item">
                  <span className="au-info-label">Last Login</span>
                  <span className="au-info-value">
                    {selectedUser.last_login ? new Date(selectedUser.last_login).toLocaleDateString() : 'Never'}
                  </span>
                </div>
                <div className="au-info-item au-info-full">
                  <span className="au-info-label">Status</span>
                  <span className="au-info-value">
                    {isBanned(selectedUser)
                      ? `Banned${selectedUser.ban_reason ? ` — ${selectedUser.ban_reason}` : ''}`
                      : selectedUser.is_active === false
                        ? 'Inactive'
                        : selectedUser.deleted_at
                          ? 'Deleted'
                          : 'Active'}
                  </span>
                </div>
              </div>
            </div>

            <div className="au-footer">
              <button className="au-btn au-btn-primary" onClick={() => setShowUserModal(false)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* ============ FEEDBACK POPUP ============ */}
      {feedback && (
        <div className="au-overlay" onClick={closeFeedback}>
          <div
            className={`au-feedback au-feedback-${feedback.type}`}
            onClick={e => e.stopPropagation()}
          >
            <button className="au-close" onClick={closeFeedback}>✕</button>

            <div className={`au-icon-wrap au-icon-${feedback.type === 'success' ? 'success' : feedback.type === 'warning' ? 'warning' : feedback.type === 'info' ? 'primary' : 'danger'}`}>
              <span className="au-icon">
                {feedback.type === 'success' ? '✅'
                  : feedback.type === 'error' ? '⚠️'
                  : feedback.type === 'warning' ? '⚠️'
                  : 'ℹ️'}
              </span>
            </div>

            <div className="au-header">
              <h3>{feedback.title}</h3>
              <p>{feedback.message}</p>
            </div>

            <div className="au-footer au-footer-center">
              <button className="au-btn au-btn-primary" onClick={closeFeedback}>
                Continue
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUsers;