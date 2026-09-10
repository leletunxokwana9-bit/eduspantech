// src/pages/Admin/AdminSubjectContent.js
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './AdminSubjectContent.css';

const AdminSubjectContent = () => {
    const { subjectId } = useParams();
    const navigate = useNavigate();

    const [subject, setSubject] = useState(null);
    const [topics, setTopics] = useState([]);
    const [subtopics, setSubtopics] = useState({});
    const [resources, setResources] = useState([]);
    const [loading, setLoading] = useState(true);

    const [showTopicPopup, setShowTopicPopup] = useState(false);
    const [showSubtopicPopup, setShowSubtopicPopup] = useState(false);
    const [showResourcePopup, setShowResourcePopup] = useState(false);
    const [showDeletePopup, setShowDeletePopup] = useState(false);
    const [showSuccessPopup, setShowSuccessPopup] = useState(false);
    const [showErrorPopup, setShowErrorPopup] = useState(false);

    const [editingTopic, setEditingTopic] = useState(null);
    const [editingResource, setEditingResource] = useState(null);
    const [parentTopic, setParentTopic] = useState(null);
    const [parentSubtopic, setParentSubtopic] = useState(null);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [successMessage, setSuccessMessage] = useState('');
    const [errorMessage, setErrorMessage] = useState('');

    const [topicForm, setTopicForm] = useState({ name: '', description: '', display_order: 0, is_active: true });
    const [subtopicForm, setSubtopicForm] = useState({ name: '', description: '', display_order: 0, is_active: true });

    const [resourceForm, setResourceForm] = useState({
        name: '', description: '', type: 'video',
        url: '', duration: '', difficulty: 'beginner',
        youtube_id: '', thumbnail_url: '',
        content: { problems: [] },
        is_free: false, is_featured: false,
        display_order: 0, is_active: true
    });

    const API_URL = process.env.REACT_APP_API_URL || 'https://eduspantech-backend.onrender.com/api';

    const refreshToken = async () => {
        try {
            const rt = localStorage.getItem('refreshToken');
            if (!rt) return false;
            const r = await fetch(`${API_URL}/auth/refresh`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ refreshToken: rt })
            });
            if (r.ok) {
                const d = await r.json();
                localStorage.setItem('accessToken', d.accessToken);
                if (d.refreshToken) localStorage.setItem('refreshToken', d.refreshToken);
                return true;
            }
            return false;
        } catch { return false; }
    };

    const apiCall = async (url, options = {}, retry = 0) => {
        const token = localStorage.getItem('accessToken');
        const response = await fetch(url, {
            ...options,
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
                ...(options.headers || {})
            }
        });
        if (response.status === 401 && retry === 0) {
            const ok = await refreshToken();
            if (ok) return apiCall(url, options, retry + 1);
            throw new Error('Session expired');
        }
        return response;
    };

    const fetchAll = async () => {
        try {
            setLoading(true);

            const sRes = await apiCall(`${API_URL}/admin/content/subjects`);
            const sData = await sRes.json();
            setSubject((sData.subjects || []).find(s => s.id === subjectId));

            const tRes = await apiCall(`${API_URL}/admin/content/subjects/${subjectId}/topics`);
            const tData = await tRes.json();
            const topicsList = tData.topics || [];
            setTopics(topicsList);

            const stMap = {};
            for (const t of topicsList) {
                const r = await apiCall(`${API_URL}/admin/content/topics/${t.id}/subtopics`);
                const d = await r.json();
                stMap[t.id] = d.subtopics || [];
            }
            setSubtopics(stMap);

            const rRes = await apiCall(`${API_URL}/admin/content/subjects/${subjectId}/resources`);
            const rData = await rRes.json();
            setResources(rData.resources || []);
        } catch (err) {
            setErrorMessage(err.message);
            setShowErrorPopup(true);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (subjectId) fetchAll();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [subjectId]);

    const parseYouTube = (url) => {
        if (!url) return null;
        const patterns = [
            /(?:youtube\.com\/watch\?v=)([a-zA-Z0-9_-]+)/,
            /(?:youtu\.be\/)([a-zA-Z0-9_-]+)/,
            /(?:youtube\.com\/embed\/)([a-zA-Z0-9_-]+)/,
            /(?:youtube\.com\/shorts\/)([a-zA-Z0-9_-]+)/
        ];
        for (const p of patterns) {
            const m = url.match(p);
            if (m) return m[1];
        }
        return null;
    };

    const handleUrlChange = (url) => {
        setResourceForm(prev => ({ ...prev, url }));
        if (url && (url.includes('youtube.com') || url.includes('youtu.be'))) {
            const yt = parseYouTube(url);
            if (yt) {
                setResourceForm(prev => ({
                    ...prev, url,
                    youtube_id: yt,
                    thumbnail_url: `https://img.youtube.com/vi/${yt}/maxresdefault.jpg`
                }));
            }
        }
    };

    const openAddTopic = () => {
        setEditingTopic(null);
        setTopicForm({ name: '', description: '', display_order: topics.length, is_active: true });
        setShowTopicPopup(true);
    };

    const openEditTopic = (t) => {
        setEditingTopic(t);
        setTopicForm({
            name: t.name,
            description: t.description || '',
            display_order: t.display_order || 0,
            is_active: t.is_active !== undefined ? t.is_active : true
        });
        setShowTopicPopup(true);
    };

    const saveTopic = async () => {
        if (!topicForm.name.trim()) {
            setErrorMessage('Topic name is required');
            setShowErrorPopup(true);
            return;
        }
        try {
            const url = editingTopic
                ? `${API_URL}/admin/content/topics/${editingTopic.id}`
                : `${API_URL}/admin/content/topics`;
            const payload = editingTopic ? topicForm : { ...topicForm, subject_id: subjectId };
            const r = await apiCall(url, {
                method: editingTopic ? 'PUT' : 'POST',
                body: JSON.stringify(payload)
            });
            const d = await r.json();
            if (d.success) {
                setShowTopicPopup(false);
                setSuccessMessage(editingTopic ? 'Topic updated!' : 'Topic created!');
                setShowSuccessPopup(true);
                fetchAll();
            } else {
                setErrorMessage(d.error || 'Failed');
                setShowErrorPopup(true);
            }
        } catch (e) {
            setErrorMessage(e.message);
            setShowErrorPopup(true);
        }
    };

    const openAddSubtopic = (t) => {
        setParentTopic(t);
        setSubtopicForm({
            name: '', description: '',
            display_order: (subtopics[t.id] || []).length,
            is_active: true
        });
        setShowSubtopicPopup(true);
    };

    const saveSubtopic = async () => {
        if (!subtopicForm.name.trim()) {
            setErrorMessage('Subtopic name required');
            setShowErrorPopup(true);
            return;
        }
        try {
            const r = await apiCall(`${API_URL}/admin/content/subtopics`, {
                method: 'POST',
                body: JSON.stringify({ ...subtopicForm, topic_id: parentTopic.id })
            });
            const d = await r.json();
            if (d.success) {
                setShowSubtopicPopup(false);
                setSuccessMessage('Subtopic created!');
                setShowSuccessPopup(true);
                fetchAll();
            } else {
                setErrorMessage(d.error || 'Failed');
                setShowErrorPopup(true);
            }
        } catch (e) {
            setErrorMessage(e.message);
            setShowErrorPopup(true);
        }
    };

    const openAddResource = (topic = null, subtopic = null) => {
        setEditingResource(null);
        setParentTopic(topic);
        setParentSubtopic(subtopic);
        setResourceForm({
            name: '', description: '', type: 'video',
            url: '', duration: '', difficulty: 'beginner',
            youtube_id: '', thumbnail_url: '',
            content: { problems: [] },
            is_free: false, is_featured: false,
            display_order: 0, is_active: true
        });
        setShowResourcePopup(true);
    };

    const openEditResource = (r, topic = null, subtopic = null) => {
        setEditingResource(r);
        setParentTopic(topic);
        setParentSubtopic(subtopic);
        setResourceForm({
            name: r.name || '',
            description: r.description || '',
            type: r.type || 'video',
            url: r.url || '',
            duration: r.duration || '',
            difficulty: r.difficulty || 'beginner',
            youtube_id: r.youtube_id || '',
            thumbnail_url: r.thumbnail_url || '',
            content: r.content || { problems: [] },
            is_free: r.is_free || false,
            is_featured: r.is_featured || false,
            display_order: r.display_order || 0,
            is_active: r.is_active !== undefined ? r.is_active : true
        });
        setShowResourcePopup(true);
    };

    const saveResource = async () => {
        if (!resourceForm.name.trim()) {
            setErrorMessage('Resource name required');
            setShowErrorPopup(true);
            return;
        }
        if (resourceForm.type !== 'practice' && !resourceForm.url.trim()) {
            setErrorMessage('URL required for this type');
            setShowErrorPopup(true);
            return;
        }
        try {
            const url = editingResource
                ? `${API_URL}/admin/content/resources/${editingResource.id}`
                : `${API_URL}/admin/content/resources`;
            const payload = {
                ...resourceForm,
                subject_id: subjectId,
                topic_id: parentTopic?.id || null,
                subtopic_id: parentSubtopic?.id || null
            };
            const r = await apiCall(url, {
                method: editingResource ? 'PUT' : 'POST',
                body: JSON.stringify(payload)
            });
            const d = await r.json();
            if (d.success) {
                setShowResourcePopup(false);
                setSuccessMessage(editingResource ? 'Resource updated!' : 'Resource added!');
                setShowSuccessPopup(true);
                fetchAll();
            } else {
                setErrorMessage(d.error || 'Failed');
                setShowErrorPopup(true);
            }
        } catch (e) {
            setErrorMessage(e.message);
            setShowErrorPopup(true);
        }
    };

    const confirmDelete = async () => {
        if (!deleteTarget) return;
        try {
            const map = {
                topic: `${API_URL}/admin/content/topics/${deleteTarget.id}`,
                subtopic: `${API_URL}/admin/content/subtopics/${deleteTarget.id}`,
                resource: `${API_URL}/admin/content/resources/${deleteTarget.id}`
            };
            const r = await apiCall(map[deleteTarget.type], { method: 'DELETE' });
            const d = await r.json();
            if (d.success) {
                setShowDeletePopup(false);
                setDeleteTarget(null);
                setSuccessMessage(`${deleteTarget.type} deleted!`);
                setShowSuccessPopup(true);
                fetchAll();
            } else {
                setErrorMessage(d.error || 'Failed');
                setShowErrorPopup(true);
                setShowDeletePopup(false);
            }
        } catch (e) {
            setErrorMessage(e.message);
            setShowErrorPopup(true);
            setShowDeletePopup(false);
        }
    };

    const getResourceIcon = (type) => ({
        video: '🎬',
        pdf: '📄',
        practice: '✏️',
        guide: '📖',
        quiz: '📝',
        link: '🔗'
    }[type] || '📎');

    if (loading) {
        return (
            <div className="asc-loading">
                <div className="asc-spinner"></div>
                <p>Loading content...</p>
            </div>
        );
    }

    return (
        <div className="asc-container">
            <div className="asc-header">
                <div>
                    <button className="asc-back-btn" onClick={() => navigate('/admin/content')}>
                        ← Back to Subjects
                    </button>
                    <h1>{subject?.icon || '📚'} {subject?.name || 'Subject'}</h1>
                    <p>{topics.length} topics • {resources.length} resources</p>
                </div>
                <button className="asc-add-topic-btn" onClick={openAddTopic}>
                    ➕ Add Topic
                </button>
            </div>

            <div className="asc-topics">
                {topics.length === 0 ? (
                    <div className="asc-empty">
                        <span>📖</span>
                        <h3>No topics yet</h3>
                        <p>Click "Add Topic" to start building this subject.</p>
                    </div>
                ) : (
                    topics.map(topic => {
                        const tResources = resources.filter(r => r.topic_id === topic.id && !r.subtopic_id);
                        const tSubs = subtopics[topic.id] || [];
                        const totalRes = tResources.length + tSubs.reduce(
                            (a, s) => a + resources.filter(r => r.subtopic_id === s.id).length, 0
                        );

                        return (
                            <div key={topic.id} className="asc-topic-card">
                                <div className="asc-topic-header">
                                    <div>
                                        <h3>📖 {topic.name}</h3>
                                        {topic.description && <p>{topic.description}</p>}
                                        <span className="asc-topic-meta">
                                            {tSubs.length} subtopics • {totalRes} resources
                                        </span>
                                    </div>
                                    <div className="asc-topic-actions">
                                        <button onClick={() => openAddSubtopic(topic)}>➕ Subtopic</button>
                                        <button onClick={() => openAddResource(topic)}>➕ Resource</button>
                                        <button onClick={() => openEditTopic(topic)}>✏️</button>
                                        <button onClick={() => {
                                            setDeleteTarget({ type: 'topic', id: topic.id, name: topic.name });
                                            setShowDeletePopup(true);
                                        }}>🗑️</button>
                                    </div>
                                </div>

                                {tResources.length > 0 && (
                                    <div className="asc-resource-list">
                                        {tResources.map(r => (
                                            <div key={r.id} className="asc-resource-item">
                                                <span className="asc-resource-icon">{getResourceIcon(r.type)}</span>
                                                <div className="asc-resource-info">
                                                    <span className="asc-resource-name">{r.name}</span>
                                                    <span className="asc-resource-type">{r.type}</span>
                                                </div>
                                                <div className="asc-resource-actions">
                                                    <button onClick={() => openEditResource(r, topic)}>✏️</button>
                                                    <button onClick={() => {
                                                        setDeleteTarget({ type: 'resource', id: r.id, name: r.name });
                                                        setShowDeletePopup(true);
                                                    }}>🗑️</button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {tSubs.length > 0 && (
                                    <div className="asc-subtopics">
                                        {tSubs.map(sub => {
                                            const subRes = resources.filter(r => r.subtopic_id === sub.id);
                                            return (
                                                <div key={sub.id} className="asc-subtopic-card">
                                                    <div className="asc-subtopic-header">
                                                        <div>
                                                            <h4>↳ {sub.name}</h4>
                                                            {sub.description && <p>{sub.description}</p>}
                                                        </div>
                                                        <div className="asc-subtopic-actions">
                                                            <button onClick={() => openAddResource(topic, sub)}>➕ Resource</button>
                                                            <button onClick={() => {
                                                                setDeleteTarget({ type: 'subtopic', id: sub.id, name: sub.name });
                                                                setShowDeletePopup(true);
                                                            }}>🗑️</button>
                                                        </div>
                                                    </div>
                                                    {subRes.length > 0 && (
                                                        <div className="asc-resource-list">
                                                            {subRes.map(r => (
                                                                <div key={r.id} className="asc-resource-item">
                                                                    <span className="asc-resource-icon">{getResourceIcon(r.type)}</span>
                                                                    <div className="asc-resource-info">
                                                                        <span className="asc-resource-name">{r.name}</span>
                                                                        <span className="asc-resource-type">{r.type}</span>
                                                                    </div>
                                                                    <div className="asc-resource-actions">
                                                                        <button onClick={() => openEditResource(r, topic, sub)}>✏️</button>
                                                                        <button onClick={() => {
                                                                            setDeleteTarget({ type: 'resource', id: r.id, name: r.name });
                                                                            setShowDeletePopup(true);
                                                                        }}>🗑️</button>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        );
                    })
                )}
            </div>

            {/* TOPIC POPUP */}
            {showTopicPopup && (
                <div className="asc-popup-overlay" onClick={() => setShowTopicPopup(false)}>
                    <div className="asc-popup" onClick={e => e.stopPropagation()}>
                        <button className="asc-popup-close" onClick={() => setShowTopicPopup(false)}>✕</button>
                        <div className="asc-popup-header">
                            <h3>{editingTopic ? '✏️ Edit Topic' : '📖 Add Topic'}</h3>
                        </div>
                        <div className="asc-popup-body">
                            <div className="asc-form-group">
                                <label>Topic Name *</label>
                                <input value={topicForm.name} onChange={e => setTopicForm({ ...topicForm, name: e.target.value })} placeholder="e.g., Linear Equations" />
                            </div>
                            <div className="asc-form-group">
                                <label>Description</label>
                                <textarea value={topicForm.description} onChange={e => setTopicForm({ ...topicForm, description: e.target.value })} rows="3" />
                            </div>
                            <div className="asc-form-group">
                                <label>Display Order</label>
                                <input type="number" value={topicForm.display_order} onChange={e => setTopicForm({ ...topicForm, display_order: parseInt(e.target.value) || 0 })} min="0" />
                            </div>
                            <div className="asc-checkbox-row">
                                <label>
                                    <input type="checkbox" checked={topicForm.is_active} onChange={e => setTopicForm({ ...topicForm, is_active: e.target.checked })} />
                                    <span>Active</span>
                                </label>
                            </div>
                        </div>
                        <div className="asc-popup-footer">
                            <button className="asc-btn asc-btn-secondary" onClick={() => setShowTopicPopup(false)}>Cancel</button>
                            <button className="asc-btn asc-btn-primary" onClick={saveTopic}>{editingTopic ? 'Save' : 'Create'}</button>
                        </div>
                    </div>
                </div>
            )}

            {/* SUBTOPIC POPUP */}
            {showSubtopicPopup && parentTopic && (
                <div className="asc-popup-overlay" onClick={() => setShowSubtopicPopup(false)}>
                    <div className="asc-popup" onClick={e => e.stopPropagation()}>
                        <button className="asc-popup-close" onClick={() => setShowSubtopicPopup(false)}>✕</button>
                        <div className="asc-popup-header">
                            <h3>➕ Add Subtopic to "{parentTopic.name}"</h3>
                        </div>
                        <div className="asc-popup-body">
                            <div className="asc-form-group">
                                <label>Subtopic Name *</label>
                                <input value={subtopicForm.name} onChange={e => setSubtopicForm({ ...subtopicForm, name: e.target.value })} placeholder="e.g., One-Step Equations" />
                            </div>
                            <div className="asc-form-group">
                                <label>Description</label>
                                <textarea value={subtopicForm.description} onChange={e => setSubtopicForm({ ...subtopicForm, description: e.target.value })} rows="3" />
                            </div>
                            <div className="asc-form-group">
                                <label>Display Order</label>
                                <input type="number" value={subtopicForm.display_order} onChange={e => setSubtopicForm({ ...subtopicForm, display_order: parseInt(e.target.value) || 0 })} min="0" />
                            </div>
                        </div>
                        <div className="asc-popup-footer">
                            <button className="asc-btn asc-btn-secondary" onClick={() => setShowSubtopicPopup(false)}>Cancel</button>
                            <button className="asc-btn asc-btn-primary" onClick={saveSubtopic}>Create Subtopic</button>
                        </div>
                    </div>
                </div>
            )}

            {/* RESOURCE POPUP */}
            {showResourcePopup && (
                <div className="asc-popup-overlay" onClick={() => setShowResourcePopup(false)}>
                    <div className="asc-popup asc-popup-large" onClick={e => e.stopPropagation()}>
                        <button className="asc-popup-close" onClick={() => setShowResourcePopup(false)}>✕</button>
                        <div className="asc-popup-header">
                            <h3>{editingResource ? '✏️ Edit Resource' : '➕ Add Resource'}</h3>
                            {parentTopic && (
                                <p>in {parentTopic.name}{parentSubtopic ? ` → ${parentSubtopic.name}` : ''}</p>
                            )}
                        </div>
                        <div className="asc-popup-body">
                            <div className="asc-form-group">
                                <label>Resource Type *</label>
                                <select value={resourceForm.type} onChange={e => setResourceForm({ ...resourceForm, type: e.target.value })}>
                                    <option value="video">🎬 Video (YouTube/Vimeo)</option>
                                    <option value="pdf">📄 PDF Document</option>
                                    <option value="practice">✏️ Practice Problems</option>
                                    <option value="guide">📖 Study Guide</option>
                                    <option value="quiz">📝 Quiz</option>
                                    <option value="link">🔗 External Link</option>
                                </select>
                            </div>

                            <div className="asc-form-group">
                                <label>Resource Name *</label>
                                <input value={resourceForm.name} onChange={e => setResourceForm({ ...resourceForm, name: e.target.value })} placeholder="e.g., Introduction to Algebra" />
                            </div>

                            <div className="asc-form-group">
                                <label>Description</label>
                                <textarea value={resourceForm.description} onChange={e => setResourceForm({ ...resourceForm, description: e.target.value })} rows="2" />
                            </div>

                            {(resourceForm.type === 'video' || resourceForm.type === 'pdf' || resourceForm.type === 'guide' || resourceForm.type === 'link') && (
                                <div className="asc-form-group">
                                    <label>
                                        {resourceForm.type === 'video' && 'YouTube / Video URL *'}
                                        {resourceForm.type === 'pdf' && 'PDF URL (Google Drive / Dropbox / direct link) *'}
                                        {resourceForm.type === 'guide' && 'Guide URL *'}
                                        {resourceForm.type === 'link' && 'External URL *'}
                                    </label>
                                    <input
                                        value={resourceForm.url}
                                        onChange={e => handleUrlChange(e.target.value)}
                                        placeholder="https://..."
                                    />
                                </div>
                            )}

                            {resourceForm.type === 'video' && (
                                <div className="asc-form-row">
                                    <div className="asc-form-group asc-half">
                                        <label>Duration</label>
                                        <input value={resourceForm.duration} onChange={e => setResourceForm({ ...resourceForm, duration: e.target.value })} placeholder="e.g., 12:34" />
                                    </div>
                                    <div className="asc-form-group asc-half">
                                        <label>Difficulty</label>
                                        <select value={resourceForm.difficulty} onChange={e => setResourceForm({ ...resourceForm, difficulty: e.target.value })}>
                                            <option value="beginner">Beginner</option>
                                            <option value="intermediate">Intermediate</option>
                                            <option value="advanced">Advanced</option>
                                        </select>
                                    </div>
                                </div>
                            )}

                            {resourceForm.youtube_id && (
                                <div className="asc-youtube-preview">
                                    <img src={`https://img.youtube.com/vi/${resourceForm.youtube_id}/mqdefault.jpg`} alt="preview" />
                                    <span>✅ YouTube detected: {resourceForm.youtube_id}</span>
                                </div>
                            )}

                            <div className="asc-form-row">
                                <div className="asc-form-group asc-half">
                                    <label>Display Order</label>
                                    <input type="number" value={resourceForm.display_order} onChange={e => setResourceForm({ ...resourceForm, display_order: parseInt(e.target.value) || 0 })} min="0" />
                                </div>
                                <div className="asc-form-group asc-half asc-checkbox-inline">
                                    <label>
                                        <input type="checkbox" checked={resourceForm.is_free} onChange={e => setResourceForm({ ...resourceForm, is_free: e.target.checked })} />
                                        <span>Free preview</span>
                                    </label>
                                    <label>
                                        <input type="checkbox" checked={resourceForm.is_active} onChange={e => setResourceForm({ ...resourceForm, is_active: e.target.checked })} />
                                        <span>Active</span>
                                    </label>
                                </div>
                            </div>
                        </div>
                        <div className="asc-popup-footer">
                            <button className="asc-btn asc-btn-secondary" onClick={() => setShowResourcePopup(false)}>Cancel</button>
                            <button className="asc-btn asc-btn-primary" onClick={saveResource}>{editingResource ? 'Save' : 'Add Resource'}</button>
                        </div>
                    </div>
                </div>
            )}

            {/* DELETE POPUP */}
            {showDeletePopup && deleteTarget && (
                <div className="asc-popup-overlay" onClick={() => setShowDeletePopup(false)}>
                    <div className="asc-popup asc-popup-small" onClick={e => e.stopPropagation()}>
                        <div className="asc-popup-icon-wrapper danger">
                            <span className="asc-popup-big-icon">🗑️</span>
                        </div>
                        <div className="asc-popup-header centered">
                            <h3>Delete {deleteTarget.type}?</h3>
                            <p>Delete <strong>{deleteTarget.name}</strong>? This cannot be undone.</p>
                        </div>
                        <div className="asc-popup-footer centered">
                            <button className="asc-btn asc-btn-secondary" onClick={() => setShowDeletePopup(false)}>Cancel</button>
                            <button className="asc-btn asc-btn-danger" onClick={confirmDelete}>🗑️ Delete</button>
                        </div>
                    </div>
                </div>
            )}

            {/* SUCCESS POPUP */}
            {showSuccessPopup && (
                <div className="asc-popup-overlay" onClick={() => setShowSuccessPopup(false)}>
                    <div className="asc-popup asc-popup-small" onClick={e => e.stopPropagation()}>
                        <div className="asc-popup-icon-wrapper success">
                            <span className="asc-popup-big-icon">✅</span>
                        </div>
                        <div className="asc-popup-header centered">
                            <h3>Success!</h3>
                            <p>{successMessage}</p>
                        </div>
                        <div className="asc-popup-footer centered">
                            <button className="asc-btn asc-btn-primary" onClick={() => setShowSuccessPopup(false)}>Continue</button>
                        </div>
                    </div>
                </div>
            )}

            {/* ERROR POPUP */}
            {showErrorPopup && (
                <div className="asc-popup-overlay" onClick={() => setShowErrorPopup(false)}>
                    <div className="asc-popup asc-popup-small" onClick={e => e.stopPropagation()}>
                        <div className="asc-popup-icon-wrapper danger">
                            <span className="asc-popup-big-icon">⚠️</span>
                        </div>
                        <div className="asc-popup-header centered">
                            <h3>Something went wrong</h3>
                            <p>{errorMessage}</p>
                        </div>
                        <div className="asc-popup-footer centered">
                            <button className="asc-btn asc-btn-secondary" onClick={() => setShowErrorPopup(false)}>Close</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminSubjectContent;