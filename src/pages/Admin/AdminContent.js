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
        icon: '',
        color: '#4f46e5',
        display_order: 0,
        is_active: true
    });
    const [actionLoading, setActionLoading] = useState(false);

    const colors = ['#4f46e5', '#7c3aed', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#8b5cf6'];

    useEffect(() => {
        fetchSubjects();
    }, []);

    const fetchSubjects = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('accessToken');
            const response = await fetch(`${process.env.REACT_APP_API_URL}/admin/content/subjects`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            if (data.success) {
                setSubjects(data.subjects || []);
            }
        } catch (error) {
            console.error('Error fetching subjects:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveSubject = async () => {
        if (!formData.name.trim()) {
            alert('Subject name is required');
            return;
        }

        try {
            setActionLoading(true);
            const token = localStorage.getItem('accessToken');
            const url = editingSubject 
                ? `${process.env.REACT_APP_API_URL}/admin/content/subjects/${editingSubject.id}`
                : `${process.env.REACT_APP_API_URL}/admin/content/subjects`;
            const method = editingSubject ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method,
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });
            const data = await response.json();
            
            if (data.success) {
                setShowModal(false);
                setEditingSubject(null);
                setFormData({ name: '', description: '', icon: '', color: '#4f46e5', display_order: 0, is_active: true });
                fetchSubjects();
            }
        } catch (error) {
            console.error('Error saving subject:', error);
        } finally {
            setActionLoading(false);
        }
    };

    const handleDeleteSubject = async (subjectId) => {
        if (!window.confirm('Are you sure you want to delete this subject?')) return;

        try {
            const token = localStorage.getItem('accessToken');
            const response = await fetch(`${process.env.REACT_APP_API_URL}/admin/content/subjects/${subjectId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            
            if (data.success) {
                fetchSubjects();
            }
        } catch (error) {
            console.error('Error deleting subject:', error);
        }
    };

    const openEditModal = (subject) => {
        setEditingSubject(subject);
        setFormData({
            name: subject.name,
            description: subject.description || '',
            icon: subject.icon || '📚',
            color: subject.color || '#4f46e5',
            display_order: subject.display_order || 0,
            is_active: subject.is_active !== undefined ? subject.is_active : true
        });
        setShowModal(true);
    };

    const openAddModal = () => {
        setEditingSubject(null);
        setFormData({
            name: '',
            description: '',
            icon: '📚',
            color: '#4f46e5',
            display_order: subjects.length,
            is_active: true
        });
        setShowModal(true);
    };

    if (loading) {
        return <div className="admin-content-loading">Loading content...</div>;
    }

    return (
        <div className="admin-content">
            <div className="content-header">
                <h2>Content Management</h2>
                <button className="add-btn" onClick={openAddModal}>
                    ➕ Add Subject
                </button>
            </div>

            <div className="subjects-grid">
                {subjects.map((subject) => (
                    <div key={subject.id} className="subject-card" style={{ borderColor: subject.color }}>
                        <div className="subject-icon" style={{ background: subject.color }}>
                            {subject.icon || '📚'}
                        </div>
                        <div className="subject-info">
                            <h4>{subject.name}</h4>
                            <p>{subject.description || 'No description'}</p>
                            <span className="subject-status">
                                {subject.is_active ? '✅ Active' : '❌ Inactive'}
                            </span>
                        </div>
                        <div className="subject-actions">
                            <button className="action-btn edit" onClick={() => openEditModal(subject)}>
                                ✏️ Edit
                            </button>
                            <button className="action-btn delete" onClick={() => handleDeleteSubject(subject.id)}>
                                🗑️ Delete
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal-content subject-modal" onClick={e => e.stopPropagation()}>
                        <h3>{editingSubject ? 'Edit Subject' : 'Add New Subject'}</h3>
                        
                        <div className="form-group">
                            <label>Subject Name *</label>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                placeholder="Enter subject name"
                            />
                        </div>

                        <div className="form-group">
                            <label>Description</label>
                            <textarea
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                placeholder="Enter description"
                                rows="3"
                            />
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label>Icon</label>
                                <input
                                    type="text"
                                    value={formData.icon}
                                    onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                                    placeholder="e.g., 📚, 🔢"
                                />
                            </div>
                            <div className="form-group">
                                <label>Display Order</label>
                                <input
                                    type="number"
                                    value={formData.display_order}
                                    onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) || 0 })}
                                    min="0"
                                />
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
                            </div>
                        </div>

                        <div className="form-group">
                            <label>
                                <input
                                    type="checkbox"
                                    checked={formData.is_active}
                                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                                />
                                Active
                            </label>
                        </div>

                        <div className="modal-actions">
                            <button className="modal-btn cancel" onClick={() => setShowModal(false)}>
                                Cancel
                            </button>
                            <button className="modal-btn save" onClick={handleSaveSubject} disabled={actionLoading}>
                                {actionLoading ? 'Saving...' : (editingSubject ? 'Update' : 'Create')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminContent;