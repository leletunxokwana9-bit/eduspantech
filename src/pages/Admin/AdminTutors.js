// src/pages/Admin/AdminTutors.js
import React, { useState, useEffect } from 'react';
import './AdminTutors.css';

const AdminTutors = () => {
    const [tutors, setTutors] = useState([]);
    const [pendingTutors, setPendingTutors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('all');
    const [selectedTutor, setSelectedTutor] = useState(null);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [showApproveModal, setShowApproveModal] = useState(false);
    const [approveData, setApproveData] = useState({ tier: 'Gold', subjects: [], notes: '' });
    const [actionLoading, setActionLoading] = useState(false);

    useEffect(() => {
        fetchTutors();
        fetchPendingTutors();
    }, []);

    const fetchTutors = async () => {
        try {
            const token = localStorage.getItem('accessToken');
            const response = await fetch(`${process.env.REACT_APP_API_URL}/admin/tutors`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            if (data.success) {
                setTutors(data.tutors || []);
            }
        } catch (error) {
            console.error('Error fetching tutors:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchPendingTutors = async () => {
        try {
            const token = localStorage.getItem('accessToken');
            const response = await fetch(`${process.env.REACT_APP_API_URL}/admin/tutors/pending`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            if (data.success) {
                setPendingTutors(data.tutors || []);
            }
        } catch (error) {
            console.error('Error fetching pending tutors:', error);
        }
    };

    const handleApproveTutor = async (tutorId, approve) => {
        try {
            setActionLoading(true);
            const token = localStorage.getItem('accessToken');
            const response = await fetch(`${process.env.REACT_APP_API_URL}/admin/tutors/${tutorId}/approve`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    approve,
                    tier: approveData.tier,
                    subjects: approveData.subjects,
                    notes: approveData.notes
                })
            });
            const data = await response.json();
            
            if (data.success) {
                setShowApproveModal(false);
                setSelectedTutor(null);
                setApproveData({ tier: 'Gold', subjects: [], notes: '' });
                fetchPendingTutors();
                fetchTutors();
            }
        } catch (error) {
            console.error('Error approving tutor:', error);
        } finally {
            setActionLoading(false);
        }
    };

    const getTierBadge = (tier) => {
        const colors = {
            'Silver': '#94a3b8',
            'Gold': '#f59e0b',
            'Platinum': '#8b5cf6',
            'Diamond': '#06b6d4'
        };
        return <span className="tier-badge" style={{ background: colors[tier] || '#6b7280' }}>{tier || 'Silver'}</span>;
    };

    const displayTutors = activeTab === 'pending' ? pendingTutors : tutors;

    if (loading) {
        return <div className="admin-tutors-loading">Loading tutors...</div>;
    }

    return (
        <div className="admin-tutors">
            <div className="tutors-header">
                <h2>Tutor Management</h2>
                <div className="tabs">
                    <button 
                        className={`tab ${activeTab === 'all' ? 'active' : ''}`}
                        onClick={() => setActiveTab('all')}
                    >
                        All Tutors ({tutors.length})
                    </button>
                    <button 
                        className={`tab ${activeTab === 'pending' ? 'active' : ''}`}
                        onClick={() => setActiveTab('pending')}
                    >
                        Pending Approval ({pendingTutors.length})
                    </button>
                </div>
            </div>

            <div className="tutors-grid">
                {displayTutors.length === 0 ? (
                    <p className="no-tutors">No tutors found</p>
                ) : (
                    displayTutors.map((tutor) => (
                        <div key={tutor.id} className="tutor-card">
                            <div className="tutor-card-header">
                                {tutor.avatar ? (
                                    <img src={tutor.avatar} alt={tutor.name} className="tutor-avatar" />
                                ) : (
                                    <div className="tutor-avatar-placeholder">{tutor.name?.[0]}</div>
                                )}
                                <div className="tutor-info">
                                    <h4>{tutor.name}</h4>
                                    <span className="tutor-email">{tutor.email}</span>
                                </div>
                                {tutor.tutor_tier && getTierBadge(tutor.tutor_tier)}
                            </div>

                            <div className="tutor-details">
                                <div className="tutor-detail-item">
                                    <span className="label">Subjects</span>
                                    <span>{tutor.tutor_subjects?.join(', ') || 'Not specified'}</span>
                                </div>
                                <div className="tutor-detail-item">
                                    <span className="label">Experience</span>
                                    <span>{tutor.tutor_experience || 'Not specified'}</span>
                                </div>
                                <div className="tutor-detail-item">
                                    <span className="label">Status</span>
                                    <span className={tutor.tutor_approved ? 'approved' : 'pending'}>
                                        {tutor.tutor_approved ? '✅ Approved' : '⏳ Pending'}
                                    </span>
                                </div>
                            </div>

                            <div className="tutor-actions">
                                {!tutor.tutor_approved ? (
                                    <button 
                                        className="action-btn approve"
                                        onClick={() => {
                                            setSelectedTutor(tutor);
                                            setShowApproveModal(true);
                                        }}
                                    >
                                        Review & Approve
                                    </button>
                                ) : (
                                    <button 
                                        className="action-btn view"
                                        onClick={() => {
                                            setSelectedTutor(tutor);
                                            setShowDetailModal(true);
                                        }}
                                    >
                                        View Details
                                    </button>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Approve Modal */}
            {showApproveModal && selectedTutor && (
                <div className="modal-overlay" onClick={() => setShowApproveModal(false)}>
                    <div className="modal-content approve-modal" onClick={e => e.stopPropagation()}>
                        <h3>Review Tutor Application</h3>
                        <div className="tutor-preview">
                            <p><strong>Name:</strong> {selectedTutor.name}</p>
                            <p><strong>Email:</strong> {selectedTutor.email}</p>
                            <p><strong>Bio:</strong> {selectedTutor.tutor_bio || 'No bio provided'}</p>
                            <p><strong>Experience:</strong> {selectedTutor.tutor_experience || 'Not specified'}</p>
                            <p><strong>Subjects:</strong> {selectedTutor.tutor_subjects?.join(', ') || 'Not specified'}</p>
                        </div>

                        <div className="form-group">
                            <label>Tier</label>
                            <select
                                value={approveData.tier}
                                onChange={(e) => setApproveData({ ...approveData, tier: e.target.value })}
                            >
                                <option value="Silver">Silver</option>
                                <option value="Gold">Gold</option>
                                <option value="Platinum">Platinum</option>
                                <option value="Diamond">Diamond</option>
                            </select>
                        </div>

                        <div className="form-group">
                            <label>Notes (Optional)</label>
                            <textarea
                                value={approveData.notes}
                                onChange={(e) => setApproveData({ ...approveData, notes: e.target.value })}
                                placeholder="Add any notes about this approval..."
                            />
                        </div>

                        <div className="modal-actions">
                            <button 
                                className="modal-btn reject"
                                onClick={() => handleApproveTutor(selectedTutor.id, false)}
                                disabled={actionLoading}
                            >
                                Reject
                            </button>
                            <button 
                                className="modal-btn approve"
                                onClick={() => handleApproveTutor(selectedTutor.id, true)}
                                disabled={actionLoading}
                            >
                                {actionLoading ? 'Processing...' : 'Approve'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Detail Modal */}
            {showDetailModal && selectedTutor && (
                <div className="modal-overlay" onClick={() => setShowDetailModal(false)}>
                    <div className="modal-content user-detail" onClick={e => e.stopPropagation()}>
                        <h3>Tutor Details</h3>
                        <div className="user-detail-grid">
                            <div className="detail-item">
                                <label>Name</label>
                                <span>{selectedTutor.name}</span>
                            </div>
                            <div className="detail-item">
                                <label>Email</label>
                                <span>{selectedTutor.email}</span>
                            </div>
                            <div className="detail-item">
                                <label>Tier</label>
                                <span>{selectedTutor.tutor_tier || 'Silver'}</span>
                            </div>
                            <div className="detail-item">
                                <label>Rating</label>
                                <span>{selectedTutor.rating || 'No ratings'}</span>
                            </div>
                            <div className="detail-item">
                                <label>Subjects</label>
                                <span>{selectedTutor.tutor_subjects?.join(', ') || 'Not specified'}</span>
                            </div>
                            <div className="detail-item">
                                <label>Status</label>
                                <span>{selectedTutor.tutor_approved ? 'Approved' : 'Pending'}</span>
                            </div>
                        </div>
                        <button className="modal-btn close" onClick={() => setShowDetailModal(false)}>
                            Close
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminTutors;