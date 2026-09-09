// src/pages/Admin/AdminContent.js
import React, { useState, useEffect } from 'react';
import './AdminContent.css';

const AdminContent = () => {
    const [subjects, setSubjects] = useState([]);
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
        display_order: 0,
        is_active: true,
        code: '',
        track: '',
        year_level: '',
        semester: '',
        institution: ''
    });
    const [actionLoading, setActionLoading] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [errorMessage, setErrorMessage] = useState('');

    const colors = ['#4f46e5', '#7c3aed', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#8b5cf6', '#14b8a6', '#f97316'];
    const tiers = ['TIER_1', 'TIER_2', 'TIER_3'];
    const regions = ['Global', 'Africa', 'Americas', 'Asia-Pacific', 'Europe', 'Middle East'];
    const yearLevels = ['1ST_YEAR', '2ND_YEAR', '3RD_YEAR', '4TH_YEAR'];
    const semesters = ['S1', 'S2', 'S3'];

    // Helper: Get default icon based on subject name
    const getDefaultIcon = (name) => {
        if (!name) return '📚';
        const icons = {
            'Mathematics': '🔢',
            'Math': '🔢',
            'Physics': '⚛️',
            'Chemistry': '🧪',
            'Biology': '🧬',
            'Life Sci': '🧬',
            'Accounting': '📊',
            'Economics': '📈',
            'Business': '💼',
            'Statistics': '📉',
            'ECP': '📘'
        };
        for (const [key, icon] of Object.entries(icons)) {
            if (name.toLowerCase().includes(key.toLowerCase())) {
                return icon;
            }
        }
        return '📚';
    };

    // Helper: Get default color based on subject name
    const getDefaultColor = (name) => {
        if (!name) return '#4f46e5';
        const colors = {
            'Mathematics': '#4f46e5',
            'Math': '#4f46e5',
            'Physics': '#06b6d4',
            'Chemistry': '#10b981',
            'Biology': '#22c55e',
            'Life Sci': '#22c55e',
            'Accounting': '#f59e0b',
            'Economics': '#8b5cf6',
            'Business': '#ec4899',
            'Statistics': '#14b8a6',
            'ECP': '#f97316'
        };
        for (const [key, color] of Object.entries(colors)) {
            if (name.toLowerCase().includes(key.toLowerCase())) {
                return color;
            }
        }
        return '#4f46e5';
    };

    useEffect(() => {
        fetchSubjects();
    }, []);

    const fetchSubjects = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('accessToken');
            const response = await fetch(`${process.env.REACT_APP_API_URL || 'https://eduspantech-backend.onrender.com/api'}/content/subjects`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            if (data.success) {
                // ✅ Map database fields to display fields
                const mappedSubjects = (data.subjects || []).map(subject => ({
                    id: subject.id,
                    name: subject.name,
                    description: subject.description || subject.code || 'No description',
                    long_description: subject.long_description || subject.description || `${subject.name} - ${subject.track || ''}`,
                    icon: subject.icon || getDefaultIcon(subject.name),
                    color: subject.color || getDefaultColor(subject.name),
                    tier: subject.tier || subject.year_level || 'TIER_1',
                    display_order: subject.display_order || 0,
                    is_active: subject.is_active !== undefined ? subject.is_active : true,
                    code: subject.code || '',
                    track: subject.track || '',
                    year_level: subject.year_level || '',
                    semester: subject.semester || '',
                    institution: subject.institution || ''
                }));
                setSubjects(mappedSubjects);
            }
        } catch (error) {
            console.error('Error fetching subjects:', error);
            setErrorMessage('Failed to load subjects');
        } finally {
            setLoading(false);
        }
    };

    const handleSaveSubject = async () => {
        if (!formData.name.trim()) {
            setErrorMessage('Subject name is required');
            return;
        }

        try {
            setActionLoading(true);
            setErrorMessage('');
            setSuccessMessage('');
            
            const token = localStorage.getItem('accessToken');
            const url = editingSubject 
                ? `${process.env.REACT_APP_API_URL || 'https://eduspantech-backend.onrender.com/api'}/admin/content/subjects/${editingSubject.id}`
                : `${process.env.REACT_APP_API_URL || 'https://eduspantech-backend.onrender.com/api'}/admin/content/subjects`;
            const method = editingSubject ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method,
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    name: formData.name.trim(),
                    description: formData.description,
                    long_description: formData.long_description,
                    icon: formData.icon,
                    color: formData.color,
                    tier: formData.tier,
                    region: formData.region,
                    display_order: parseInt(formData.display_order) || 0,
                    is_active: formData.is_active,
                    code: formData.code,
                    track: formData.track,
                    year_level: formData.year_level,
                    semester: formData.semester,
                    institution: formData.institution
                })
            });
            
            const data = await response.json();
            
            if (data.success) {
                setSuccessMessage(editingSubject ? 'Subject updated successfully!' : 'Subject created successfully!');
                setShowModal(false);
                setEditingSubject(null);
                resetForm();
                fetchSubjects();
                
                setTimeout(() => setSuccessMessage(''), 3000);
            } else {
                setErrorMessage(data.error || 'Failed to save subject');
            }
        } catch (error) {
            console.error('Error saving subject:', error);
            setErrorMessage('Network error. Please try again.');
        } finally {
            setActionLoading(false);
        }
    };

    const handleDeleteSubject = async (subjectId) => {
        if (!window.confirm('⚠️ Are you sure you want to delete this subject? This action cannot be undone.')) return;

        try {
            setActionLoading(true);
            const token = localStorage.getItem('accessToken');
            const response = await fetch(`${process.env.REACT_APP_API_URL || 'https://eduspantech-backend.onrender.com/api'}/admin/content/subjects/${subjectId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            
            if (data.success) {
                setSuccessMessage('Subject deleted successfully!');
                fetchSubjects();
                setTimeout(() => setSuccessMessage(''), 3000);
            } else {
                setErrorMessage(data.error || 'Failed to delete subject');
            }
        } catch (error) {
            console.error('Error deleting subject:', error);
            setErrorMessage('Network error. Please try again.');
        } finally {
            setActionLoading(false);
        }
    };

    const handleToggleStatus = async (subject) => {
        try {
            const token = localStorage.getItem('accessToken');
            const response = await fetch(`${process.env.REACT_APP_API_URL || 'https://eduspantech-backend.onrender.com/api'}/admin/content/subjects/${subject.id}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    ...subject,
                    is_active: !subject.is_active
                })
            });
            const data = await response.json();
            if (data.success) {
                fetchSubjects();
                setSuccessMessage(`Subject ${subject.is_active ? 'deactivated' : 'activated'} successfully!`);
                setTimeout(() => setSuccessMessage(''), 3000);
            }
        } catch (error) {
            console.error('Error toggling subject status:', error);
            setErrorMessage('Failed to update subject status');
        }
    };

    const openEditModal = (subject) => {
        setEditingSubject(subject);
        setFormData({
            name: subject.name || '',
            description: subject.description || '',
            long_description: subject.long_description || subject.description || '',
            icon: subject.icon || '📚',
            color: subject.color || '#4f46e5',
            tier: subject.tier || 'TIER_1',
            region: subject.region || 'Global',
            display_order: subject.display_order || 0,
            is_active: subject.is_active !== undefined ? subject.is_active : true,
            code: subject.code || '',
            track: subject.track || '',
            year_level: subject.year_level || '',
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
            display_order: subjects.length,
            is_active: true,
            code: '',
            track: '',
            year_level: '',
            semester: '',
            institution: ''
        });
    };

    const getTierBadge = (tier) => {
        const tierMap = {
            'TIER_1': { label: 'Grade 8-9', color: '#10b981' },
            'TIER_2': { label: 'Grade 10-11', color: '#f59e0b' },
            'TIER_3': { label: 'Grade 12+', color: '#ef4444' }
        };
        const info = tierMap[tier] || { label: tier || 'TIER_1', color: '#6b7280' };
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
            <div className="content-header">
                <div className="header-left">
                    <h2>📚 Content Management</h2>
                    <p className="header-subtitle">Manage subjects, resources, and learning materials</p>
                </div>
                <div className="header-actions">
                    <button className="add-btn" onClick={openAddModal}>
                        ➕ Add Subject
                    </button>
                </div>
            </div>

            {successMessage && (
                <div className="admin-content-success">
                    ✅ {successMessage}
                </div>
            )}

            {errorMessage && (
                <div className="admin-content-error">
                    ❌ {errorMessage}
                </div>
            )}

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

            <div className="subjects-grid">
                {subjects.length === 0 ? (
                    <div className="empty-state">
                        <span className="empty-icon">📚</span>
                        <h3>No subjects yet</h3>
                        <p>Click "Add Subject" to create your first subject</p>
                    </div>
                ) : (
                    subjects.map((subject) => (
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
                                        <span className="region-badge">🌍 {subject.region || 'Global'}</span>
                                        <span className={`status-badge ${subject.is_active ? 'active' : 'inactive'}`}>
                                            {subject.is_active ? '✅ Active' : '❌ Inactive'}
                                        </span>
                                    </div>
                                    {subject.code && (
                                        <div className="subject-code-badge">📌 {subject.code}</div>
                                    )}
                                    {subject.track && (
                                        <div className="subject-track-badge">🎯 {subject.track}</div>
                                    )}
                                    {subject.institution && (
                                        <div className="subject-institution-badge">🏛️ {subject.institution}</div>
                                    )}
                                </div>
                            </div>
                            {subject.long_description && subject.long_description !== subject.description && (
                                <div className="subject-long-desc">
                                    {subject.long_description}
                                </div>
                            )}
                            <div className="subject-actions">
                                <button className="action-btn toggle" onClick={() => handleToggleStatus(subject)}>
                                    {subject.is_active ? '🔴 Deactivate' : '🟢 Activate'}
                                </button>
                                <button className="action-btn edit" onClick={() => openEditModal(subject)}>
                                    ✏️ Edit
                                </button>
                                <button className="action-btn delete" onClick={() => handleDeleteSubject(subject.id)}>
                                    🗑️ Delete
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Add/Edit Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal-content subject-modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>{editingSubject ? '✏️ Edit Subject' : '📚 Add New Subject'}</h3>
                            <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
                        </div>

                        <div className="modal-body">
                            <div className="form-group">
                                <label>Subject Name *</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="e.g., Algebra, Geometry, Calculus"
                                />
                            </div>

                            <div className="form-group">
                                <label>Short Description</label>
                                <input
                                    type="text"
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="Brief description shown on cards"
                                />
                            </div>

                            <div className="form-group">
                                <label>Full Description</label>
                                <textarea
                                    value={formData.long_description}
                                    onChange={(e) => setFormData({ ...formData, long_description: e.target.value })}
                                    placeholder="Detailed description for the subject page"
                                    rows="3"
                                />
                            </div>

                            <div className="form-row">
                                <div className="form-group half">
                                    <label>Code</label>
                                    <input
                                        type="text"
                                        value={formData.code}
                                        onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                                        placeholder="e.g., MATH101, ACCN1014A"
                                    />
                                </div>
                                <div className="form-group half">
                                    <label>Track</label>
                                    <input
                                        type="text"
                                        value={formData.track}
                                        onChange={(e) => setFormData({ ...formData, track: e.target.value })}
                                        placeholder="e.g., BSc, BCom, ECP_Commerce"
                                    />
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="form-group half">
                                    <label>Year Level</label>
                                    <select
                                        value={formData.year_level}
                                        onChange={(e) => setFormData({ ...formData, year_level: e.target.value })}
                                    >
                                        <option value="">Select year level</option>
                                        {yearLevels.map(level => (
                                            <option key={level} value={level}>{level.replace('_', ' ')}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="form-group half">
                                    <label>Semester</label>
                                    <select
                                        value={formData.semester}
                                        onChange={(e) => setFormData({ ...formData, semester: e.target.value })}
                                    >
                                        <option value="">Select semester</option>
                                        {semesters.map(sem => (
                                            <option key={sem} value={sem}>{sem}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="form-group">
                                <label>Institution</label>
                                <input
                                    type="text"
                                    value={formData.institution}
                                    onChange={(e) => setFormData({ ...formData, institution: e.target.value })}
                                    placeholder="e.g., Wits: ACCN1014A, UP: FRK111"
                                />
                            </div>

                            <div className="form-row">
                                <div className="form-group half">
                                    <label>Icon</label>
                                    <input
                                        type="text"
                                        value={formData.icon}
                                        onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                                        placeholder="e.g., 📚, 🔢, ∫"
                                    />
                                </div>
                                <div className="form-group half">
                                    <label>Display Order</label>
                                    <input
                                        type="number"
                                        value={formData.display_order}
                                        onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) || 0 })}
                                        min="0"
                                    />
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="form-group half">
                                    <label>Tier</label>
                                    <select
                                        value={formData.tier}
                                        onChange={(e) => setFormData({ ...formData, tier: e.target.value })}
                                    >
                                        {tiers.map(tier => (
                                            <option key={tier} value={tier}>
                                                {tier} - {tier === 'TIER_1' ? 'Grade 8-9' : tier === 'TIER_2' ? 'Grade 10-11' : 'Grade 12+'}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="form-group half">
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
                            </div>

                            <div className="form-group">
                                <label>Color</label>
                                <div className="color-picker-grid">
                                    {colors.map((color) => (
                                        <div
                                            key={color}
                                            className={`color-option ${formData.color === color ? 'selected' : ''}`}
                                            style={{ background: color }}
                                            onClick={() => setFormData({ ...formData, color })}
                                        />
                                    ))}
                                    <input
                                        type="color"
                                        value={formData.color}
                                        onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                                        className="color-input"
                                    />
                                </div>
                            </div>

                            <div className="form-group checkbox">
                                <label>
                                    <input
                                        type="checkbox"
                                        checked={formData.is_active}
                                        onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                                    />
                                    Active (visible to users)
                                </label>
                            </div>
                        </div>

                        <div className="modal-footer">
                            <button className="modal-btn cancel" onClick={() => setShowModal(false)}>
                                Cancel
                            </button>
                            <button className="modal-btn save" onClick={handleSaveSubject} disabled={actionLoading}>
                                {actionLoading ? '⏳ Saving...' : (editingSubject ? '💾 Update Subject' : '➕ Create Subject')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminContent;