// src/pages/Admin/AdminContent.js
import React, { useState, useEffect } from 'react';
import './AdminContent.css';

const AdminContent = () => {
    const [subjects, setSubjects] = useState([]);
    const [filteredSubjects, setFilteredSubjects] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingSubject, setEditingSubject] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        long_description: '',
        icon: '📚',
        color: '#4f46e5',
        tier: 'TIER_1',
        region: 'Global',
        is_active: true,
        code: '',
        track: '',
        year_level: '1ST_YEAR',
        semester: '',
        institution: ''
    });
    const [actionLoading, setActionLoading] = useState(false);

    // ============================================
    // DEDICATED POPUP STATES
    // ============================================
    const [showSuccessPopup, setShowSuccessPopup] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    
    const [showErrorPopup, setShowErrorPopup] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    
    const [showDeletePopup, setShowDeletePopup] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [deleteLoading, setDeleteLoading] = useState(false);
    
    const [showTogglePopup, setShowTogglePopup] = useState(false);
    const [toggleTarget, setToggleTarget] = useState(null);
    const [toggleLoading, setToggleLoading] = useState(false);

    const colors = ['#4f46e5', '#7c3aed', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#8b5cf6', '#14b8a6', '#f97316'];
    const regions = ['Global', 'Africa', 'Americas', 'Asia-Pacific', 'Europe', 'Middle East'];
    const tracks = ['BCom', 'BSc', 'ECP_Commerce', 'ECP_Science', 'Engineering', 'Arts'];

    const API_URL = process.env.REACT_APP_API_URL || 'https://eduspantech-backend.onrender.com/api';

    // Helper functions
    const getDefaultIcon = (name) => {
        if (!name) return '📚';
        const icons = {
            'Mathematics': '🔢', 'Physics': '⚛️', 'Chemistry': '🧪', 'Biology': '🧬',
            'Accounting': '📊', 'Economics': '📈', 'Business': '💼', 'Statistics': '📉',
            'Engineering': '⚙️', 'Computer': '💻', 'Finance': '💰'
        };
        for (const [key, icon] of Object.entries(icons)) {
            if (name.toLowerCase().includes(key.toLowerCase())) return icon;
        }
        return '📚';
    };

    const getDefaultColor = (name) => {
        if (!name) return '#4f46e5';
        const colorMap = {
            'Mathematics': '#4f46e5', 'Physics': '#06b6d4', 'Chemistry': '#10b981',
            'Biology': '#22c55e', 'Accounting': '#f59e0b', 'Economics': '#8b5cf6',
            'Business': '#ec4899', 'Statistics': '#14b8a6', 'Engineering': '#f97316',
            'Computer': '#3b82f6', 'Finance': '#10b981'
        };
        for (const [key, color] of Object.entries(colorMap)) {
            if (name.toLowerCase().includes(key.toLowerCase())) return color;
        }
        return '#4f46e5';
    };

    useEffect(() => {
        fetchSubjects();
    }, []);

    useEffect(() => {
        if (searchTerm.trim() === '') {
            setFilteredSubjects(subjects);
        } else {
            const term = searchTerm.toLowerCase().trim();
            const filtered = subjects.filter(subject =>
                subject.name.toLowerCase().includes(term) ||
                (subject.code && subject.code.toLowerCase().includes(term)) ||
                (subject.description && subject.description.toLowerCase().includes(term)) ||
                (subject.track && subject.track.toLowerCase().includes(term)) ||
                (subject.institution && subject.institution.toLowerCase().includes(term))
            );
            setFilteredSubjects(filtered);
        }
    }, [searchTerm, subjects]);

    // ============================================
    // TOKEN REFRESH
    // ============================================
    const refreshToken = async () => {
        try {
            const refreshToken = localStorage.getItem('refreshToken');
            if (!refreshToken) return false;
            const response = await fetch(`${API_URL}/auth/refresh`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ refreshToken })
            });
            if (response.ok) {
                const data = await response.json();
                localStorage.setItem('accessToken', data.accessToken);
                if (data.refreshToken) localStorage.setItem('refreshToken', data.refreshToken);
                return true;
            }
            return false;
        } catch (error) {
            console.error('Refresh token error:', error);
            return false;
        }
    };

    // ============================================
    // FETCH SUBJECTS
    // ============================================
    const fetchSubjects = async (retryCount = 0) => {
        try {
            setLoading(true);
            const token = localStorage.getItem('accessToken');
            if (!token) {
                setErrorMessage('No authentication token found. Please login again.');
                setShowErrorPopup(true);
                setTimeout(() => { window.location.href = '/admin/login'; }, 2000);
                setLoading(false);
                return;
            }

            const response = await fetch(`${API_URL}/admin/content/subjects`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.status === 401 && retryCount === 0) {
                const refreshed = await refreshToken();
                if (refreshed) return fetchSubjects(retryCount + 1);
                setErrorMessage('Session expired. Please login again.');
                setShowErrorPopup(true);
                localStorage.removeItem('accessToken');
                localStorage.removeItem('refreshToken');
                setTimeout(() => { window.location.href = '/admin/login'; }, 2000);
                setLoading(false);
                return;
            }

            if (response.status === 401) {
                setErrorMessage('Session expired. Please login again.');
                setShowErrorPopup(true);
                localStorage.removeItem('accessToken');
                localStorage.removeItem('refreshToken');
                setTimeout(() => { window.location.href = '/admin/login'; }, 2000);
                setLoading(false);
                return;
            }

            const data = await response.json();
            if (data.success) {
                const mappedSubjects = (data.subjects || []).map(subject => ({
                    id: subject.id,
                    name: subject.name || 'Untitled',
                    description: subject.description || subject.code || 'No description',
                    long_description: subject.long_description || subject.description || '',
                    icon: subject.icon || getDefaultIcon(subject.name),
                    color: subject.color || getDefaultColor(subject.name),
                    tier: subject.tier || subject.year_level || 'TIER_1',
                    region: subject.region || 'Global',
                    is_active: subject.is_active !== undefined ? subject.is_active : true,
                    code: subject.code || '',
                    track: subject.track || '',
                    year_level: subject.year_level || '1ST_YEAR',
                    semester: subject.semester || '',
                    institution: subject.institution || ''
                }));
                setSubjects(mappedSubjects);
                setFilteredSubjects(mappedSubjects);
            } else {
                setErrorMessage(data.error || 'Failed to load subjects');
                setShowErrorPopup(true);
            }
        } catch (error) {
            setErrorMessage('Network error. Please try again.');
            setShowErrorPopup(true);
        } finally {
            setLoading(false);
        }
    };

    // ============================================
    // SAVE SUBJECT
    // ============================================
    const handleSaveSubject = async () => {
        if (!formData.name.trim()) {
            setErrorMessage('Subject name is required');
            setShowErrorPopup(true);
            return;
        }

        try {
            setActionLoading(true);
            let token = localStorage.getItem('accessToken');
            if (!token) {
                setErrorMessage('No authentication token found.');
                setShowErrorPopup(true);
                setActionLoading(false);
                return;
            }

            const url = editingSubject
                ? `${API_URL}/admin/content/subjects/${editingSubject.id}`
                : `${API_URL}/admin/content/subjects`;
            const method = editingSubject ? 'PUT' : 'POST';

            const payload = {
                name: formData.name.trim(),
                description: formData.description || '',
                long_description: formData.long_description || '',
                icon: formData.icon || getDefaultIcon(formData.name),
                color: formData.color || getDefaultColor(formData.name),
                tier: formData.tier || 'TIER_1',
                region: formData.region || 'Global',
                is_active: formData.is_active,
                code: formData.code || '',
                track: formData.track || '',
                year_level: formData.year_level || '1ST_YEAR',
                semester: formData.semester || '',
                institution: formData.institution || ''
            };

            const response = await fetch(url, {
                method,
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            if (response.status === 401) {
                const refreshed = await refreshToken();
                if (refreshed) {
                    token = localStorage.getItem('accessToken');
                    const retryResponse = await fetch(url, {
                        method,
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(payload)
                    });
                    const retryData = await retryResponse.json();
                    if (retryData.success) {
                        setShowModal(false);
                        setEditingSubject(null);
                        resetForm();
                        fetchSubjects();
                        setSuccessMessage(editingSubject ? 'Subject updated successfully!' : 'Subject created successfully!');
                        setShowSuccessPopup(true);
                        setActionLoading(false);
                        return;
                    }
                }
                setErrorMessage('Session expired. Please login again.');
                setShowErrorPopup(true);
                localStorage.removeItem('accessToken');
                localStorage.removeItem('refreshToken');
                setTimeout(() => { window.location.href = '/admin/login'; }, 2000);
                setActionLoading(false);
                return;
            }

            const data = await response.json();
            if (data.success) {
                setShowModal(false);
                setEditingSubject(null);
                resetForm();
                fetchSubjects();
                setSuccessMessage(editingSubject ? 'Subject updated successfully!' : 'Subject created successfully!');
                setShowSuccessPopup(true);
            } else {
                setErrorMessage(data.error || 'Failed to save subject');
                setShowErrorPopup(true);
            }
        } catch (error) {
            setErrorMessage('Network error. Please try again.');
            setShowErrorPopup(true);
        } finally {
            setActionLoading(false);
        }
    };

    // ============================================
    // DELETE SUBJECT - SHOW POPUP FIRST
    // ============================================
    const handleDeleteClick = (subject) => {
        setDeleteTarget(subject);
        setShowDeletePopup(true);
    };

    const confirmDelete = async () => {
        if (!deleteTarget) return;

        try {
            setDeleteLoading(true);
            const token = localStorage.getItem('accessToken');
            if (!token) {
                setErrorMessage('No authentication token found.');
                setShowErrorPopup(true);
                setShowDeletePopup(false);
                setDeleteLoading(false);
                return;
            }

            const response = await fetch(`${API_URL}/admin/content/subjects/${deleteTarget.id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.status === 401) {
                const refreshed = await refreshToken();
                if (refreshed) {
                    const newToken = localStorage.getItem('accessToken');
                    const retryResponse = await fetch(`${API_URL}/admin/content/subjects/${deleteTarget.id}`, {
                        method: 'DELETE',
                        headers: { 'Authorization': `Bearer ${newToken}` }
                    });
                    if (retryResponse.ok) {
                        const data = await retryResponse.json();
                        if (data.success) {
                            setShowDeletePopup(false);
                            setDeleteTarget(null);
                            fetchSubjects();
                            setSuccessMessage('Subject deleted successfully!');
                            setShowSuccessPopup(true);
                            setDeleteLoading(false);
                            return;
                        }
                    }
                }
                setErrorMessage('Session expired. Please login again.');
                setShowErrorPopup(true);
                setShowDeletePopup(false);
                localStorage.removeItem('accessToken');
                localStorage.removeItem('refreshToken');
                setTimeout(() => { window.location.href = '/admin/login'; }, 2000);
                setDeleteLoading(false);
                return;
            }

            const data = await response.json();
            if (data.success) {
                setShowDeletePopup(false);
                setDeleteTarget(null);
                fetchSubjects();
                setSuccessMessage('Subject deleted successfully!');
                setShowSuccessPopup(true);
            } else {
                setShowDeletePopup(false);
                setErrorMessage(data.error || 'Failed to delete subject');
                setShowErrorPopup(true);
            }
        } catch (error) {
            setShowDeletePopup(false);
            setErrorMessage('Network error. Please try again.');
            setShowErrorPopup(true);
        } finally {
            setDeleteLoading(false);
        }
    };

    // ============================================
    // TOGGLE STATUS - SHOW POPUP FIRST
    // ============================================
    const handleToggleClick = (subject) => {
        setToggleTarget(subject);
        setShowTogglePopup(true);
    };

    const confirmToggle = async () => {
        if (!toggleTarget) return;

        try {
            setToggleLoading(true);
            const token = localStorage.getItem('accessToken');
            if (!token) {
                setErrorMessage('No authentication token found.');
                setShowErrorPopup(true);
                setShowTogglePopup(false);
                setToggleLoading(false);
                return;
            }

            const response = await fetch(`${API_URL}/admin/content/subjects/${toggleTarget.id}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ is_active: !toggleTarget.is_active })
            });

            if (response.status === 401) {
                const refreshed = await refreshToken();
                if (refreshed) {
                    const newToken = localStorage.getItem('accessToken');
                    const retryResponse = await fetch(`${API_URL}/admin/content/subjects/${toggleTarget.id}`, {
                        method: 'PUT',
                        headers: {
                            'Authorization': `Bearer ${newToken}`,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ is_active: !toggleTarget.is_active })
                    });
                    if (retryResponse.ok) {
                        const data = await retryResponse.json();
                        if (data.success) {
                            setShowTogglePopup(false);
                            setToggleTarget(null);
                            fetchSubjects();
                            setSuccessMessage(`Subject ${toggleTarget.is_active ? 'deactivated' : 'activated'} successfully!`);
                            setShowSuccessPopup(true);
                            setToggleLoading(false);
                            return;
                        }
                    }
                }
                setErrorMessage('Session expired. Please login again.');
                setShowErrorPopup(true);
                setShowTogglePopup(false);
                localStorage.removeItem('accessToken');
                localStorage.removeItem('refreshToken');
                setTimeout(() => { window.location.href = '/admin/login'; }, 2000);
                setToggleLoading(false);
                return;
            }

            const data = await response.json();
            if (data.success) {
                setShowTogglePopup(false);
                setToggleTarget(null);
                fetchSubjects();
                setSuccessMessage(`Subject ${toggleTarget.is_active ? 'deactivated' : 'activated'} successfully!`);
                setShowSuccessPopup(true);
            } else {
                setShowTogglePopup(false);
                setErrorMessage(data.error || 'Failed to update subject');
                setShowErrorPopup(true);
            }
        } catch (error) {
            setShowTogglePopup(false);
            setErrorMessage('Network error. Please try again.');
            setShowErrorPopup(true);
        } finally {
            setToggleLoading(false);
        }
    };

    // ============================================
    // MODAL HELPERS
    // ============================================
    const openEditModal = (subject) => {
        setEditingSubject(subject);
        setFormData({
            name: subject.name || '',
            description: subject.description || '',
            long_description: subject.long_description || '',
            icon: subject.icon || getDefaultIcon(subject.name),
            color: subject.color || getDefaultColor(subject.name),
            tier: subject.tier || 'TIER_1',
            region: subject.region || 'Global',
            is_active: subject.is_active !== undefined ? subject.is_active : true,
            code: subject.code || '',
            track: subject.track || '',
            year_level: subject.year_level || '1ST_YEAR',
            semester: subject.semester || '',
            institution: subject.institution || ''
        });
        setShowModal(true);
    };

    const openAddModal = () => {
        setEditingSubject(null);
        resetForm();
        setShowModal(true);
    };

    const resetForm = () => {
        setFormData({
            name: '',
            description: '',
            long_description: '',
            icon: '📚',
            color: '#4f46e5',
            tier: 'TIER_1',
            region: 'Global',
            is_active: true,
            code: '',
            track: '',
            year_level: '1ST_YEAR',
            semester: '',
            institution: ''
        });
    };

    const getTierBadge = (tier) => {
        const tierMap = {
            'TIER_1': { label: 'Grade 8-9', color: '#10b981' },
            'TIER_2': { label: 'Grade 10-11', color: '#f59e0b' },
            'TIER_3': { label: 'Grade 12+', color: '#ef4444' },
            '1ST_YEAR': { label: '1st Year', color: '#4f46e5' },
            '2ND_YEAR': { label: '2nd Year', color: '#7c3aed' },
            '3RD_YEAR': { label: '3rd Year', color: '#ec4899' },
            '4TH_YEAR': { label: '4th Year', color: '#14b8a6' }
        };
        const info = tierMap[tier] || { label: tier || 'Tier 1', color: '#6b7280' };
        return <span className="tier-badge" style={{ background: info.color }}>{info.label}</span>;
    };

    if (loading) {
        return (
            <div className="admin-content-loading">
                <div className="loading-spinner"></div>
                <p>Loading content...</p>
            </div>
        );
    }

    return (
        <div className="admin-content">
            {/* ============================================
                PAGE HEADER
                ============================================ */}
            <div className="content-header">
                <div className="header-left">
                    <h2>📚 Content Management</h2>
                    <p className="header-subtitle">Manage subjects, resources, and learning materials</p>
                </div>
                <div className="header-actions">
                    <button className="refresh-btn" onClick={fetchSubjects} title="Refresh subjects">🔄</button>
                    <button className="add-btn" onClick={openAddModal}>➕ Add Subject</button>
                </div>
            </div>

            {/* ============================================
                STATS CARDS
                ============================================ */}
            <div className="content-stats">
                <div className="stat-item">
                    <span className="stat-number">{subjects.length}</span>
                    <span className="stat-label">Total Subjects</span>
                </div>
                <div className="stat-item">
                    <span className="stat-number">{subjects.filter(s => s.is_active).length}</span>
                    <span className="stat-label">Active</span>
                </div>
                <div className="stat-item">
                    <span className="stat-number">{subjects.filter(s => !s.is_active).length}</span>
                    <span className="stat-label">Inactive</span>
                </div>
            </div>

            {/* ============================================
                SEARCH BAR
                ============================================ */}
            <div className="content-search">
                <div className="search-wrapper">
                    <span className="search-icon">🔍</span>
                    <input
                        type="text"
                        className="search-input"
                        placeholder="Search by name, code, track, institution..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    {searchTerm && (
                        <button className="clear-search" onClick={() => setSearchTerm('')}>✕</button>
                    )}
                </div>
                <div className="search-results-info">
                    {searchTerm ? (
                        <span>Showing {filteredSubjects.length} of {subjects.length} subjects</span>
                    ) : (
                        <span>{subjects.length} subjects total</span>
                    )}
                </div>
            </div>

            {/* ============================================
                SUBJECTS GRID
                ============================================ */}
            <div className="subjects-grid">
                {filteredSubjects.length === 0 ? (
                    <div className="empty-state">
                        <span className="empty-icon">📚</span>
                        <h3>{searchTerm ? 'No matching subjects found' : 'No subjects yet'}</h3>
                        <p>
                            {searchTerm
                                ? `No subjects match "${searchTerm}". Try a different search term.`
                                : 'Click "Add Subject" to create your first subject'}
                        </p>
                    </div>
                ) : (
                    filteredSubjects.map((subject) => (
                        <div key={subject.id} className="subject-card" style={{ borderColor: subject.color || '#4f46e5' }}>
                            <div className="subject-card-header">
                                <div className="subject-icon" style={{ background: subject.color || '#4f46e5' }}>
                                    {subject.icon || '📚'}
                                </div>
                                <div className="subject-info">
                                    <h4>{subject.name}</h4>
                                    <p>{subject.description || 'No description'}</p>
                                    <div className="subject-meta">
                                        {getTierBadge(subject.tier)}
                                        {subject.code && <span className="code-badge">📋 {subject.code}</span>}
                                        {subject.track && <span className="track-badge">🎯 {subject.track}</span>}
                                        {subject.semester && <span className="semester-badge">📅 {subject.semester}</span>}
                                        <span className={`status-badge ${subject.is_active ? 'active' : 'inactive'}`}>
                                            {subject.is_active ? '✅ Active' : '❌ Inactive'}
                                        </span>
                                    </div>
                                    {subject.institution && (
                                        <div className="subject-institution">🏛️ {subject.institution}</div>
                                    )}
                                </div>
                            </div>
                            {subject.long_description && (
                                <div className="subject-long-desc">{subject.long_description}</div>
                            )}
                            <div className="subject-actions">
                                <button className="action-btn toggle" onClick={() => handleToggleClick(subject)}>
                                    {subject.is_active ? '🔴 Deactivate' : '🟢 Activate'}
                                </button>
                                <button className="action-btn edit" onClick={() => openEditModal(subject)}>
                                    ✏️ Edit
                                </button>
                                <button className="action-btn delete" onClick={() => handleDeleteClick(subject)}>
                                    🗑️ Delete
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* ============================================
                EDIT/ADD SUBJECT MODAL
                ============================================ */}
            {showModal && (
                <div className="ac-popup-overlay" onClick={() => setShowModal(false)}>
                    <div className="ac-popup ac-popup-large" onClick={e => e.stopPropagation()}>
                        <button className="ac-popup-close" onClick={() => setShowModal(false)}>✕</button>
                        <div className="ac-popup-header">
                            <div className="ac-popup-icon">📚</div>
                            <h3>{editingSubject ? 'Edit Subject' : 'Add New Subject'}</h3>
                            <p>{editingSubject ? 'Update the subject details below' : 'Fill in the details to create a new subject'}</p>
                        </div>

                        <div className="ac-popup-body">
                            <div className="ac-form-group">
                                <label>Subject Name *</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="e.g., Algebra, Geometry, Calculus"
                                />
                            </div>

                            <div className="ac-form-group">
                                <label>Short Description</label>
                                <input
                                    type="text"
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="Brief description shown on cards"
                                />
                            </div>

                            <div className="ac-form-group">
                                <label>Full Description</label>
                                <textarea
                                    value={formData.long_description}
                                    onChange={(e) => setFormData({ ...formData, long_description: e.target.value })}
                                    placeholder="Detailed description for the subject page"
                                    rows="3"
                                />
                            </div>

                            <div className="ac-form-row">
                                <div className="ac-form-group ac-half">
                                    <label>Icon</label>
                                    <input
                                        type="text"
                                        value={formData.icon}
                                        onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                                        placeholder="📚"
                                    />
                                </div>
                                <div className="ac-form-group ac-half">
                                    <label>Tier / Year Level</label>
                                    <select
                                        value={formData.tier}
                                        onChange={(e) => setFormData({ ...formData, tier: e.target.value })}
                                    >
                                        <option value="TIER_1">TIER_1 - Grade 8-9</option>
                                        <option value="TIER_2">TIER_2 - Grade 10-11</option>
                                        <option value="TIER_3">TIER_3 - Grade 12+</option>
                                        <option value="1ST_YEAR">1ST_YEAR - University</option>
                                        <option value="2ND_YEAR">2ND_YEAR - University</option>
                                        <option value="3RD_YEAR">3RD_YEAR - University</option>
                                        <option value="4TH_YEAR">4TH_YEAR - University</option>
                                    </select>
                                </div>
                            </div>

                            <div className="ac-form-row">
                                <div className="ac-form-group ac-half">
                                    <label>Region</label>
                                    <select
                                        value={formData.region}
                                        onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                                    >
                                        {regions.map(region => (
                                            <option key={region} value={region}>{region}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="ac-form-group ac-half">
                                    <label>Track / Program</label>
                                    <select
                                        value={formData.track}
                                        onChange={(e) => setFormData({ ...formData, track: e.target.value })}
                                    >
                                        <option value="">Select Track</option>
                                        {tracks.map(track => (
                                            <option key={track} value={track}>{track}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="ac-form-row">
                                <div className="ac-form-group ac-half">
                                    <label>Course Code</label>
                                    <input
                                        type="text"
                                        value={formData.code}
                                        onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                                        placeholder="e.g., MATH101"
                                    />
                                </div>
                                <div className="ac-form-group ac-half">
                                    <label>Semester</label>
                                    <input
                                        type="text"
                                        value={formData.semester}
                                        onChange={(e) => setFormData({ ...formData, semester: e.target.value })}
                                        placeholder="e.g., S1, S2"
                                    />
                                </div>
                            </div>

                            <div className="ac-form-group">
                                <label>Institution</label>
                                <input
                                    type="text"
                                    value={formData.institution}
                                    onChange={(e) => setFormData({ ...formData, institution: e.target.value })}
                                    placeholder="e.g., Wits, UP, UCT"
                                />
                            </div>

                            <div className="ac-form-group">
                                <label>Color</label>
                                <div className="ac-color-grid">
                                    {colors.map((color) => (
                                        <div
                                            key={color}
                                            className={`ac-color-option ${formData.color === color ? 'selected' : ''}`}
                                            style={{ background: color }}
                                            onClick={() => setFormData({ ...formData, color })}
                                        />
                                    ))}
                                    <input
                                        type="color"
                                        value={formData.color}
                                        onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                                        className="ac-color-input"
                                    />
                                </div>
                            </div>

                            <div className="ac-form-group ac-checkbox">
                                <label>
                                    <input
                                        type="checkbox"
                                        checked={formData.is_active}
                                        onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                                    />
                                    <span>Active (visible to users)</span>
                                </label>
                            </div>
                        </div>

                        <div className="ac-popup-footer">
                            <button className="ac-btn ac-btn-secondary" onClick={() => setShowModal(false)}>
                                Cancel
                            </button>
                            <button className="ac-btn ac-btn-primary" onClick={handleSaveSubject} disabled={actionLoading}>
                                {actionLoading ? '⏳ Saving...' : (editingSubject ? '💾 Update Subject' : '➕ Create Subject')}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ============================================
                DELETE CONFIRMATION POPUP
                ============================================ */}
            {showDeletePopup && deleteTarget && (
                <div className="ac-popup-overlay" onClick={() => !deleteLoading && setShowDeletePopup(false)}>
                    <div className="ac-popup ac-popup-small" onClick={e => e.stopPropagation()}>
                        <div className="ac-popup-icon-wrapper danger">
                            <span className="ac-popup-big-icon">🗑️</span>
                        </div>
                        <div className="ac-popup-header centered">
                            <h3>Delete Subject?</h3>
                            <p>You're about to delete <strong>{deleteTarget.name}</strong>. This action cannot be undone.</p>
                        </div>
                        <div className="ac-popup-footer centered">
                            <button
                                className="ac-btn ac-btn-secondary"
                                onClick={() => setShowDeletePopup(false)}
                                disabled={deleteLoading}
                            >
                                Cancel
                            </button>
                            <button
                                className="ac-btn ac-btn-danger"
                                onClick={confirmDelete}
                                disabled={deleteLoading}
                            >
                                {deleteLoading ? '⏳ Deleting...' : '🗑️ Delete'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ============================================
                TOGGLE STATUS CONFIRMATION POPUP
                ============================================ */}
            {showTogglePopup && toggleTarget && (
                <div className="ac-popup-overlay" onClick={() => !toggleLoading && setShowTogglePopup(false)}>
                    <div className="ac-popup ac-popup-small" onClick={e => e.stopPropagation()}>
                        <div className={`ac-popup-icon-wrapper ${toggleTarget.is_active ? 'warning' : 'success'}`}>
                            <span className="ac-popup-big-icon">{toggleTarget.is_active ? '⚠️' : '✅'}</span>
                        </div>
                        <div className="ac-popup-header centered">
                            <h3>{toggleTarget.is_active ? 'Deactivate Subject?' : 'Activate Subject?'}</h3>
                            <p>
                                {toggleTarget.is_active
                                    ? `"${toggleTarget.name}" will be hidden from students.`
                                    : `"${toggleTarget.name}" will be visible to students.`}
                            </p>
                        </div>
                        <div className="ac-popup-footer centered">
                            <button
                                className="ac-btn ac-btn-secondary"
                                onClick={() => setShowTogglePopup(false)}
                                disabled={toggleLoading}
                            >
                                Cancel
                            </button>
                            <button
                                className={`ac-btn ${toggleTarget.is_active ? 'ac-btn-warning' : 'ac-btn-primary'}`}
                                onClick={confirmToggle}
                                disabled={toggleLoading}
                            >
                                {toggleLoading ? '⏳ Processing...' : (toggleTarget.is_active ? '🔴 Deactivate' : '🟢 Activate')}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ============================================
                SUCCESS POPUP
                ============================================ */}
            {showSuccessPopup && (
                <div className="ac-popup-overlay" onClick={() => setShowSuccessPopup(false)}>
                    <div className="ac-popup ac-popup-small" onClick={e => e.stopPropagation()}>
                        <div className="ac-popup-icon-wrapper success">
                            <span className="ac-popup-big-icon">✅</span>
                        </div>
                        <div className="ac-popup-header centered">
                            <h3>Success!</h3>
                            <p>{successMessage}</p>
                        </div>
                        <div className="ac-popup-footer centered">
                            <button className="ac-btn ac-btn-primary" onClick={() => setShowSuccessPopup(false)}>
                                Continue
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ============================================
                ERROR POPUP
                ============================================ */}
            {showErrorPopup && (
                <div className="ac-popup-overlay" onClick={() => setShowErrorPopup(false)}>
                    <div className="ac-popup ac-popup-small" onClick={e => e.stopPropagation()}>
                        <div className="ac-popup-icon-wrapper danger">
                            <span className="ac-popup-big-icon">⚠️</span>
                        </div>
                        <div className="ac-popup-header centered">
                            <h3>Something went wrong</h3>
                            <p>{errorMessage}</p>
                        </div>
                        <div className="ac-popup-footer centered">
                            <button className="ac-btn ac-btn-secondary" onClick={() => setShowErrorPopup(false)}>
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminContent;