// src/pages/Admin/AdminContent.js
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../services/supabaseClient';
import './AdminContent.css';
import '../Pricing.css';

const API_URL = process.env.REACT_APP_API_URL || 'https://eduspantech-backend.onrender.com/api';
const STORAGE_BUCKET = 'content';

const SECTIONS = [
  { id: 'basics',  label: 'Basic info' },
  { id: 'topics',  label: 'Topics' },
  { id: 'papers',  label: 'Past papers' },
  { id: 'mocks',   label: 'Mock exams' },
  { id: 'access',  label: 'Access & visibility' },
  { id: 'review',  label: 'Review and publish' },
];

const DEFAULT_COLORS = ['#4f46e5','#7c3aed','#06b6d4','#10b981','#f59e0b','#ef4444','#ec4899','#8b5cf6','#14b8a6','#f97316'];

const HIGHSCHOOL_GRADES = [
  { key: 'grade-8-9',   label: 'Grade 8 – 9',   tier: '8-9' },
  { key: 'grade-10-11', label: 'Grade 10 – 11', tier: '10-11' },
  { key: 'grade-12',    label: 'Grade 12',      tier: '12' },
];
const TERTIARY_GRADES = [
  { key: 'tertiary-year-1', label: 'Tertiary – Year 1', tier: 'tertiary' },
  { key: 'tertiary-year-2', label: 'Tertiary – Year 2', tier: 'tertiary' },
];
const ALL_FALLBACK_GRADES = [...HIGHSCHOOL_GRADES, ...TERTIARY_GRADES];
const isTertiaryKey = (key) => String(key || '').toLowerCase().includes('tertiary');

const getDefaultIcon = (name) => {
  if (!name) return '📚';
  const icons = { Mathematics: '🔢', Physics: '⚛️', Chemistry: '🧪', Biology: '🧬', Accounting: '📊', Economics: '📈', Business: '💼', Statistics: '📉', Engineering: '⚙️', Computer: '💻', Finance: '💰' };
  for (const [k, v] of Object.entries(icons)) if (name.toLowerCase().includes(k.toLowerCase())) return v;
  return '📚';
};
const getDefaultColor = (name) => {
  if (!name) return '#4f46e5';
  const m = { Mathematics:'#4f46e5', Physics:'#06b6d4', Chemistry:'#10b981', Biology:'#22c55e', Accounting:'#f59e0b', Economics:'#8b5cf6', Business:'#ec4899', Statistics:'#14b8a6', Engineering:'#f97316', Computer:'#3b82f6', Finance:'#10b981' };
  for (const [k, v] of Object.entries(m)) if (name.toLowerCase().includes(k.toLowerCase())) return v;
  return '#4f46e5';
};

const initialForm = () => ({
  name: '', slug: '', description: '', long_description: '',
  icon: '📚', color: '#4f46e5', grade_key: '', category_id: '',
  is_active: true, code: '', track: '', semester: '', institution: '',
  allowed_plans: [], soon: false, region: 'Global', year_level: '1ST_YEAR',
});

const initialResourceDraft = () => ({
  name: '', type: 'pdf', url: '', description: '', topicIndex: '',
  youtube_id: '', thumbnail_url: '', duration: '', difficulty: 'beginner', is_free: false,
});

const AdminContent = () => {
  const navigate = useNavigate();

  const [viewMode, setViewMode] = useState('list');
  const [contentTab, setContentTab] = useState('highschool');

  const [subjects, setSubjects] = useState([]);
  const [filteredSubjects, setFilteredSubjects] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const [grades, setGrades] = useState([]);
  const [categories, setCategories] = useState([]);
  const [plans, setPlans] = useState([]);

  const [activeSection, setActiveSection] = useState('basics');
  const [formData, setFormData] = useState(initialForm());
  const [builderTopics, setBuilderTopics] = useState([]);
  const [builderResources, setBuilderResources] = useState([]);
  const [builderPapers, setBuilderPapers] = useState([]);
  const [builderMocks, setBuilderMocks] = useState([]);

  const [uploading, setUploading] = useState(false);
  const [previewMode, setPreviewMode] = useState('open');
  const [editingSubject, setEditingSubject] = useState(null);

  // -------- POPUP STATE --------
  const [modal, setModal] = useState(null);
  // modal = { icon, title, body, buttons: [{label, variant, onClick, disabled}] }

  const showModal = (icon, title, body, buttons) => {
    setModal({ icon, title, body, buttons });
  };
  const closeModal = () => setModal(null);

  const [showDeletePopup, setShowDeletePopup] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [showTogglePopup, setShowTogglePopup] = useState(false);
  const [toggleTarget, setToggleTarget] = useState(null);
  const [toggleLoading, setToggleLoading] = useState(false);

  const [showResourceDraftPopup, setShowResourceDraftPopup] = useState(false);
  const [resourceDraft, setResourceDraft] = useState(initialResourceDraft());
  const [resourceUploading, setResourceUploading] = useState(false);
  const [resourceFileName, setResourceFileName] = useState('');
  const resourceFileRef = useRef(null);

  const [newTopicName, setNewTopicName] = useState('');
  const [newTopicDesc, setNewTopicDesc] = useState('');

  const token = () => localStorage.getItem('accessToken');

  // -------- Feedback helpers (all use the modal) --------
  const showSuccess = (msg) => showModal('✅', 'Success', msg, [{ label: 'Continue', variant: 'primary', onClick: closeModal }]);
  const showError = (msg) => showModal('⚠️', 'Something needs fixing', msg, [{ label: 'OK', variant: 'primary', onClick: closeModal }]);
  const showInfo = (msg) => showModal('ℹ️', 'Notice', msg, [{ label: 'OK', variant: 'primary', onClick: closeModal }]);

  // -------- Inline Modal Component using Pricing's login-prompt styles --------
  const Modal = () => {
    if (!modal) return null;
    return (
      <div className="login-prompt-overlay" onClick={closeModal}>
        <div className="login-prompt-modal" onClick={(e) => e.stopPropagation()}>
          <button className="login-prompt-close" onClick={closeModal}>×</button>
          <div className="login-prompt-icon">{modal.icon || 'ℹ️'}</div>
          <h3>{modal.title}</h3>
          <p style={{ whiteSpace: 'pre-line' }}>{modal.body}</p>
          <div className="login-prompt-actions">
            {modal.buttons.map((btn, i) => (
              <button
                key={i}
                className={btn.variant === 'ghost' ? 'login-prompt-cancel' : 'login-prompt-btn'}
                onClick={btn.onClick}
                disabled={btn.disabled}
              >
                {btn.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // -------- Auth fetch --------
  const authFetch = useCallback(async (url, options = {}, retry = true) => {
    const headers = {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
      Authorization: `Bearer ${token()}`,
    };
    let res;
    try {
      res = await fetch(url, { ...options, headers });
    } catch (err) {
      throw new Error("We couldn't reach the server. Please check your connection.");
    }

    if (res.status === 401 && retry) {
      const rt = localStorage.getItem('refreshToken');
      if (rt) {
        try {
          const r = await fetch(`${API_URL}/auth/refresh`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refreshToken: rt }),
          });
          if (r.ok) {
            const d = await r.json();
            localStorage.setItem('accessToken', d.accessToken);
            if (d.refreshToken) localStorage.setItem('refreshToken', d.refreshToken);
            return authFetch(url, options, false);
          }
        } catch { /* ignore */ }
      }
      throw new Error('SESSION_EXPIRED');
    }
    return res;
  }, []);

  // -------- Fetch initial data --------
  const fetchInitialData = async () => {
    try {
      setLoading(true);

      if (!token()) {
        showError('Please log in again to continue.');
        setTimeout(() => { window.location.href = '/admin/login'; }, 1500);
        setLoading(false);
        return;
      }

      try {
        const subRes = await authFetch(`${API_URL}/admin/content/subjects`);
        if (subRes.ok) {
          const subData = await subRes.json();
          const mapped = (subData.subjects || []).map((s) => ({
            ...s,
            icon: s.icon || getDefaultIcon(s.name),
            color: s.color || getDefaultColor(s.name),
            grade_key: s.grade_key || '',
            category_id: s.category_id || '',
            allowed_plans: s.allowed_plans || [],
          }));
          setSubjects(mapped);
          setFilteredSubjects(mapped);
        }
      } catch (e) {
        if (e.message === 'SESSION_EXPIRED') {
          showError('Your session expired. Please log in again.');
          setTimeout(() => { window.location.href = '/admin/login'; }, 1500);
          setLoading(false);
          return;
        }
      }

      let resolvedGrades = [];
      try {
        const gRes = await authFetch(`${API_URL}/admin/grades`);
        if (gRes.ok) {
          const gData = await gRes.json();
          const fromApi = gData.grades || gData.data || [];
          if (Array.isArray(fromApi) && fromApi.length) resolvedGrades = fromApi;
        }
      } catch { /* silent */ }

      if (resolvedGrades.length === 0) {
        try {
          const { data: gRows, error: gErr } = await supabase.from('subject_grades').select('*');
          if (!gErr && Array.isArray(gRows) && gRows.length) {
            resolvedGrades = gRows.map((g) => ({ key: g.key, label: g.label, tier: g.tier, sort_order: g.sort_order || 0 }))
              .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
          }
        } catch { /* silent */ }
      }
      if (resolvedGrades.length === 0) resolvedGrades = ALL_FALLBACK_GRADES;
      setGrades(resolvedGrades);

      let resolvedCategories = [];
      try {
        const cRes = await authFetch(`${API_URL}/admin/categories`);
        if (cRes.ok) {
          const cData = await cRes.json();
          const fromApi = cData.categories || cData.data || [];
          if (Array.isArray(fromApi) && fromApi.length) {
            resolvedCategories = fromApi.map((c) => ({ id: c.id, name: c.name, key: c.key || c.slug || c.id, icon: c.icon, color: c.color }));
          }
        }
      } catch { /* silent */ }

      if (resolvedCategories.length === 0) {
        try {
          const { data: cRows } = await supabase.from('subject_categories').select('*').order('name');
          if (Array.isArray(cRows) && cRows.length) {
            resolvedCategories = cRows.map((c) => ({ id: c.id, name: c.name, key: c.key || c.slug || c.id, icon: c.icon, color: c.color }));
          }
        } catch { /* silent */ }
      }
      setCategories(resolvedCategories);

      try {
        const pRes = await authFetch(`${API_URL}/admin/pricing/plans`);
        if (pRes.ok) {
          const pData = await pRes.json();
          const fromApi = pData.plans || pData.data || [];
          if (Array.isArray(fromApi)) setPlans(fromApi);
        }
      } catch { /* optional */ }

    } catch (err) {
      showError(err.message || 'We could not load the admin page.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchInitialData(); /* eslint-disable-next-line */ }, []);

  useEffect(() => {
    if (viewMode === 'builder' && formData.name && !editingSubject) {
      const base = formData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
      const gs = formData.grade_key ? `-${formData.grade_key}` : '';
      setFormData((p) => ({ ...p, slug: `${base}${gs}` }));
    }
    // eslint-disable-next-line
  }, [formData.name, formData.grade_key, viewMode, editingSubject]);

  useEffect(() => {
    let list = subjects.filter((s) => {
      const tertiary = isTertiaryKey(s.grade_key);
      return contentTab === 'tertiary' ? tertiary : !tertiary;
    });
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      list = list.filter((s) =>
        (s.name || '').toLowerCase().includes(q) ||
        (s.code || '').toLowerCase().includes(q) ||
        (s.description || '').toLowerCase().includes(q) ||
        (s.track || '').toLowerCase().includes(q) ||
        (s.institution || '').toLowerCase().includes(q)
      );
    }
    setFilteredSubjects(list);
  }, [searchTerm, subjects, contentTab]);

  const gradeOptions = useMemo(() => {
    return grades.filter((g) => {
      const tertiary = isTertiaryKey(g.key) || String(g.tier || '').toLowerCase() === 'tertiary';
      return contentTab === 'tertiary' ? tertiary : !tertiary;
    });
  }, [grades, contentTab]);

  const missingFields = useMemo(() => {
    const missing = [];
    if (!formData.name.trim()) missing.push('Subject name');
    if (!formData.grade_key) missing.push('Grade');
    if (!formData.category_id) missing.push('Category');
    if (formData.is_active && formData.allowed_plans.length === 0) missing.push('At least one access plan');
    return missing;
  }, [formData]);

  const otherIssues = useMemo(() => {
    const issues = [];
    const blankTopics = builderTopics.filter((t) => !t.name?.trim()).length;
    if (blankTopics) issues.push({ sec: 'topics', level: 'error', msg: `${blankTopics} topic${blankTopics > 1 ? 's have' : ' has'} no title` });
    const papersMissing = builderPapers.filter((p) => !p.paper_url).length;
    if (builderPapers.length > 0 && papersMissing) issues.push({ sec: 'papers', level: 'error', msg: `${papersMissing} paper${papersMissing > 1 ? 's need' : ' needs'} a PDF file` });
    const noMemos = builderPapers.filter((p) => p.paper_url && !p.memo_url).length;
    if (noMemos) issues.push({ sec: 'papers', level: 'warn', msg: `${noMemos} paper${noMemos > 1 ? 's have' : ' has'} no memo yet` });
    if (builderPapers.length === 0) issues.push({ sec: 'papers', level: 'warn', msg: 'no past papers added yet' });
    return issues;
  }, [builderTopics, builderPapers]);

  const errorCount = missingFields.length + otherIssues.filter((i) => i.level === 'error').length;
  const completeness = Math.max(0, 5 - errorCount) * 20;

  // -------- Upload --------
  const uploadFile = async (file, folder = 'subjects') => {
    const ext = file.name.split('.').pop();
    const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const { error } = await supabase.storage.from(STORAGE_BUCKET).upload(fileName, file, { cacheControl: '3600', upsert: false });
    if (error) {
      if (String(error.message).toLowerCase().includes('bucket')) {
        throw new Error("The storage bucket isn't set up yet.");
      }
      throw new Error('The file could not be uploaded. Please try again.');
    }
    const { data } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(fileName);
    return data.publicUrl;
  };

  const handleFileUpload = async (e, type, index) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== 'application/pdf') { showError('Please choose a PDF file.'); return; }
    try {
      setUploading(true);
      const publicUrl = await uploadFile(file);
      const update = (setter) => setter((prev) => {
        const copy = [...prev];
        if (!copy[index]) return copy;
        const field = type.endsWith('_memo') ? 'memo_url' : 'paper_url';
        const nameField = type.endsWith('_memo') ? 'memo_name' : 'paper_name';
        copy[index] = { ...copy[index], [field]: publicUrl, [nameField]: file.name };
        return copy;
      });
      if (type === 'paper_qp') update(setBuilderPapers);
      if (type === 'paper_memo') update(setBuilderPapers);
      if (type === 'mock_qp') update(setBuilderMocks);
      if (type === 'mock_memo') update(setBuilderMocks);
      showSuccess(`${file.name} uploaded.`);
    } catch (err) {
      showError(err.message);
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleResourceFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== 'application/pdf') { showError('Please choose a PDF file.'); return; }
    if (file.size > 50 * 1024 * 1024) { showError('The PDF must be smaller than 50MB.'); return; }
    try {
      setResourceUploading(true);
      const publicUrl = await uploadFile(file, 'resources');
      setResourceDraft((prev) => ({ ...prev, url: publicUrl, name: prev.name || file.name.replace(/\.pdf$/i, '') }));
      setResourceFileName(file.name);
      showSuccess(`${file.name} uploaded.`);
    } catch (err) {
      showError(err.message);
    } finally {
      setResourceUploading(false);
      e.target.value = '';
    }
  };

  const updateArrayItem = (setter, index, field, value) =>
    setter((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });

  const addTopicToBuilder = () => {
    if (!newTopicName.trim()) return;
    setBuilderTopics((prev) => [...prev, { id: `local-${Date.now()}`, name: newTopicName.trim(), description: newTopicDesc.trim(), display_order: prev.length, is_active: true }]);
    setNewTopicName(''); setNewTopicDesc('');
  };
  const removeTopicFromBuilder = (id) => {
    setBuilderTopics((prev) => prev.filter((t) => t.id !== id));
    setBuilderResources((prev) => prev.map((r) => (r.topicLocalId === id ? { ...r, topicLocalId: null } : r)));
  };

  const parseYouTubeId = (url) => {
    if (!url) return null;
    const pats = [/(?:youtube\.com\/watch\?v=)([\w-]+)/, /(?:youtu\.be\/)([\w-]+)/, /(?:youtube\.com\/embed\/)([\w-]+)/, /(?:youtube\.com\/shorts\/)([\w-]+)/];
    for (const p of pats) { const m = url.match(p); if (m) return m[1]; }
    return null;
  };
  const handleResourceUrlChange = (url) => {
    setResourceDraft((prev) => {
      const next = { ...prev, url };
      if (url && (url.includes('youtube.com') || url.includes('youtu.be'))) {
        const yt = parseYouTubeId(url);
        if (yt) { next.youtube_id = yt; next.thumbnail_url = `https://img.youtube.com/vi/${yt}/maxresdefault.jpg`; }
      }
      return next;
    });
  };

  const openResourcePopup = () => {
    setResourceDraft(initialResourceDraft());
    setResourceFileName('');
    setShowResourceDraftPopup(true);
  };

  const confirmAddResourceDraft = () => {
    if (!resourceDraft.name.trim()) { showError('Please give the resource a name.'); return; }
    if (resourceDraft.type !== 'practice' && !resourceDraft.url.trim()) {
      showError(resourceDraft.type === 'pdf' ? 'Please upload a PDF file first.' : 'Please paste the video link.');
      return;
    }
    const topicLocalId = resourceDraft.topicIndex !== '' ? builderTopics[Number(resourceDraft.topicIndex)]?.id || null : null;
    setBuilderResources((prev) => [...prev, {
      id: `local-res-${Date.now()}`, name: resourceDraft.name.trim(), type: resourceDraft.type,
      url: resourceDraft.url.trim(), description: resourceDraft.description.trim(), topicLocalId,
      youtube_id: resourceDraft.youtube_id, thumbnail_url: resourceDraft.thumbnail_url,
      duration: resourceDraft.duration, difficulty: resourceDraft.difficulty,
      is_free: resourceDraft.is_free, display_order: prev.length, is_active: true,
    }]);
    setResourceDraft(initialResourceDraft());
    setResourceFileName('');
    setShowResourceDraftPopup(false);
    showSuccess('Resource added.');
  };

  const getResourceIcon = (t) => ({ video: '🎬', pdf: '📄', practice: '✏️', guide: '📖', quiz: '📝', link: '🔗' }[t] || '📎');

  const loadExistingContent = async (subjectId) => {
    try {
      const [tRes, rRes, pRes] = await Promise.all([
        authFetch(`${API_URL}/admin/content/subjects/${subjectId}/topics`),
        authFetch(`${API_URL}/admin/content/subjects/${subjectId}/resources`),
        authFetch(`${API_URL}/admin/content/subjects/${subjectId}/papers`),
      ]);
      if (tRes.ok) {
        const d = await tRes.json();
        const topics = d.topics || d.data || [];
        setBuilderTopics(topics.map((t) => ({ id: t.id, name: t.name, description: t.description || '', display_order: t.display_order || 0, is_active: t.is_active !== false })));
      }
      if (rRes.ok) {
        const d = await rRes.json();
        const resources = d.resources || d.data || [];
        setBuilderResources(resources.map((r) => ({
          id: r.id, name: r.name, type: r.type || 'pdf', url: r.url || '',
          description: r.description || '', topicLocalId: r.topic_id || null,
          youtube_id: r.youtube_id || '', thumbnail_url: r.thumbnail_url || '',
          duration: r.duration || '', difficulty: r.difficulty || 'beginner',
          is_free: r.is_free || false, display_order: r.display_order || 0, is_active: r.is_active !== false,
        })));
      }
      if (pRes.ok) {
        const d = await pRes.json();
        const papers = d.papers || d.data || [];
        const regular = papers.filter((p) => !p.is_mock);
        const mocks = papers.filter((p) => p.is_mock);
        setBuilderPapers(regular.map((p) => ({
          id: p.id, year: p.year || '2024', session: p.session || 'Nov', paper: p.paper_number || 'P1',
          paper_url: p.paper_url || '', memo_url: p.memo_url || '',
          paper_name: p.paper_url ? 'Uploaded' : '', memo_name: p.memo_url ? 'Uploaded' : '',
        })));
        setBuilderMocks(mocks.map((m) => ({
          id: m.id, title: m.title || '', duration: m.duration_minutes || 150, marks: m.total_marks || 150,
          paper_url: m.paper_url || '', memo_url: m.memo_url || '',
          paper_name: m.paper_url ? 'Uploaded' : '', memo_name: m.memo_url ? 'Uploaded' : '',
        })));
      }
    } catch (err) {
      showError('Could not load existing content.');
    }
  };

  const handleSaveSubject = async (opts = {}) => {
    const isDraft = opts.draft === true;

    if (!isDraft && missingFields.length > 0) {
      const list = missingFields.map((m) => `• ${m}`).join('\n');
      showError(`Please fill in these required fields:\n\n${list}`);
      return;
    }
    if (!isDraft && otherIssues.some((i) => i.level === 'error')) {
      const list = otherIssues.filter((i) => i.level === 'error').map((i) => `• ${i.msg}`).join('\n');
      showError(`A few things need attention:\n\n${list}`);
      return;
    }

    try {
      setActionLoading(true);
      const url = editingSubject ? `${API_URL}/admin/content/subjects/${editingSubject.id}` : `${API_URL}/admin/content/subjects`;
      const method = editingSubject ? 'PUT' : 'POST';

      const payload = {
        name: formData.name.trim(), slug: formData.slug,
        description: formData.description || '', long_description: formData.long_description || '',
        icon: formData.icon || getDefaultIcon(formData.name),
        color: formData.color || getDefaultColor(formData.name),
        grade_key: formData.grade_key, category_id: formData.category_id,
        is_active: isDraft ? false : formData.is_active,
        ...(formData.code ? { code: formData.code } : {}),
        track: formData.track || '',
        semester: formData.semester || '', institution: formData.institution || '',
        allowed_plans: formData.allowed_plans,
      };

      const res = await authFetch(url, { method, body: JSON.stringify(payload) });
      const data = await res.json();
      if (!res.ok || !data.success) {
        showError(data.error || 'Could not save. Please try again.');
        return;
      }

      const newId = data.subject?.id || data.data?.id || data.id || editingSubject?.id;
      if (!newId) { showError('Saved but ID missing.'); return; }

      if (editingSubject) {
        const { data: oldTopics } = await supabase.from('topics').select('id').eq('subject_id', newId);
        if (Array.isArray(oldTopics) && oldTopics.length) {
          await supabase.from('topics').delete().in('id', oldTopics.map((t) => t.id));
        }
      }
      const topicIdMap = {};
      for (const t of builderTopics) {
        if (!t.name?.trim()) continue;
        const r = await authFetch(`${API_URL}/admin/content/topics`, {
          method: 'POST',
          body: JSON.stringify({ subject_id: newId, name: t.name, description: t.description || '', display_order: t.display_order || 0, is_active: true }),
        });
        if (r.ok) {
          const d = await r.json();
          const tid = d.topic?.id || d.data?.id || d.id;
          if (tid) topicIdMap[t.id] = tid;
        }
      }

      for (const res2 of builderResources) {
        await authFetch(`${API_URL}/admin/content/resources`, {
          method: 'POST',
          body: JSON.stringify({
            subject_id: newId, topic_id: res2.topicLocalId ? (topicIdMap[res2.topicLocalId] || null) : null,
            subtopic_id: null, name: res2.name, description: res2.description || '',
            type: res2.type, url: res2.url || '',
            youtube_id: res2.youtube_id || '', thumbnail_url: res2.thumbnail_url || '',
            duration: res2.duration || '', difficulty: res2.difficulty || 'beginner',
            content: { problems: [] }, is_free: !!res2.is_free, is_featured: false,
            display_order: res2.display_order || 0, is_active: true,
          }),
        });
      }

      for (const p of builderPapers) {
        if (!p.paper_url && !isDraft) continue;
        await authFetch(`${API_URL}/admin/content/papers`, {
          method: 'POST',
          body: JSON.stringify({
            subject_id: newId, year: p.year, session: p.session, paper_number: p.paper,
            is_mock: false, paper_url: p.paper_url || null, memo_url: p.memo_url || null,
          }),
        });
      }
      for (const m of builderMocks) {
        if (!m.paper_url && !isDraft) continue;
        await authFetch(`${API_URL}/admin/content/papers`, {
          method: 'POST',
          body: JSON.stringify({
            subject_id: newId, is_mock: true, title: m.title,
            duration_minutes: m.duration, total_marks: m.marks,
            paper_url: m.paper_url || null, memo_url: m.memo_url || null,
          }),
        });
      }

      showSuccess(isDraft ? 'Draft saved.' : editingSubject ? 'Subject updated.' : 'Subject published.');
      setViewMode('list');
      resetForm();
      fetchInitialData();
    } catch (err) {
      if (err.message === 'SESSION_EXPIRED') {
        showError('Session expired. Please log in again.');
        setTimeout(() => { window.location.href = '/admin/login'; }, 1500);
      } else {
        showError(err.message || 'Could not save.');
      }
    } finally {
      setActionLoading(false);
    }
  };

  const openAddModal = () => {
    setEditingSubject(null);
    resetForm();
    const defaultGrade = contentTab === 'tertiary' ? 'tertiary-year-1' : 'grade-8-9';
    setFormData((prev) => ({ ...prev, grade_key: defaultGrade }));
    setViewMode('builder');
    setActiveSection('basics');
  };
  const openEditModal = async (subject) => {
    setContentTab(isTertiaryKey(subject.grade_key) ? 'tertiary' : 'highschool');
    setEditingSubject(subject);
    setFormData({
      name: subject.name || '', slug: subject.slug || '',
      description: subject.description || '', long_description: subject.long_description || '',
      icon: subject.icon || getDefaultIcon(subject.name),
      color: subject.color || getDefaultColor(subject.name),
      grade_key: subject.grade_key || '', category_id: subject.category_id || '',
      is_active: subject.is_active !== undefined ? subject.is_active : true,
      code: subject.code || '', track: subject.track || '',
      semester: subject.semester || '', institution: subject.institution || '',
      allowed_plans: subject.allowed_plans || [],
      soon: false, region: 'Global', year_level: '1ST_YEAR',
    });
    setViewMode('builder');
    setActiveSection('basics');
    await loadExistingContent(subject.id);
  };
  const resetForm = () => {
    setFormData(initialForm());
    setBuilderTopics([]); setBuilderResources([]); setBuilderPapers([]); setBuilderMocks([]);
  };

  const handleDeleteClick = (subject) => { setDeleteTarget(subject); setShowDeletePopup(true); };
  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      setDeleteLoading(true);
      const res = await authFetch(`${API_URL}/admin/content/subjects/${deleteTarget.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) { setShowDeletePopup(false); fetchInitialData(); showSuccess('Subject deleted.'); }
      else { setShowDeletePopup(false); showError(data.error || 'Could not delete.'); }
    } catch { showError('Could not reach the server.'); } finally { setDeleteLoading(false); }
  };
  const handleToggleClick = (subject) => { setToggleTarget(subject); setShowTogglePopup(true); };
  const confirmToggle = async () => {
    if (!toggleTarget) return;
    try {
      setToggleLoading(true);
      const res = await authFetch(`${API_URL}/admin/content/subjects/${toggleTarget.id}`, {
        method: 'PUT',
        body: JSON.stringify({ is_active: !toggleTarget.is_active }),
      });
      const data = await res.json();
      if (data.success) { setShowTogglePopup(false); fetchInitialData(); showSuccess('Status updated.'); }
      else { setShowTogglePopup(false); showError(data.error || 'Could not change status.'); }
    } catch { showError('Could not reach the server.'); } finally { setToggleLoading(false); }
  };

  const getGradeBadge = (grade_key) => {
    const g = grades.find((x) => x.key === grade_key);
    if (!g) return <span className="tier-badge" style={{ background: '#6b7280' }}>No Grade</span>;
    let color = '#10b981';
    if (g.tier === '10-11') color = '#f59e0b';
    if (g.tier === '12') color = '#ef4444';
    if (g.tier === 'tertiary') color = '#4f46e5';
    return <span className="tier-badge" style={{ background: color }}>{g.label}</span>;
  };

  // -------- Loading --------
  if (loading) return <div className="admin-content-loading"><div className="loading-spinner" /><p>Loading content...</p></div>;

  // -------- LIST VIEW --------
  if (viewMode === 'list') {
    const highschoolCount = subjects.filter((s) => !isTertiaryKey(s.grade_key)).length;
    const tertiaryCount = subjects.filter((s) => isTertiaryKey(s.grade_key)).length;

    return (
      <div className="admin-content">
        <Modal />

        <div className="content-header">
          <div className="header-left">
            <h2>📚 Content Management</h2>
            <p className="header-subtitle">Manage subjects, resources, and learning materials</p>
          </div>
          <div className="header-actions">
            <button className="refresh-btn" onClick={fetchInitialData} title="Refresh">🔄</button>
            <button className="add-btn" onClick={openAddModal}>➕ Add Subject</button>
          </div>
        </div>

        <div className="content-type-toggle" role="tablist" aria-label="Content type">
          <button type="button" role="tab" aria-selected={contentTab === 'highschool'} className={`content-type-btn ${contentTab === 'highschool' ? 'active' : ''}`} onClick={() => setContentTab('highschool')}>
            🏫 Highschool <span className="content-type-count">{highschoolCount}</span>
          </button>
          <button type="button" role="tab" aria-selected={contentTab === 'tertiary'} className={`content-type-btn ${contentTab === 'tertiary' ? 'active' : ''}`} onClick={() => setContentTab('tertiary')}>
            🎓 Tertiary <span className="content-type-count">{tertiaryCount}</span>
          </button>
        </div>

        <div className="content-stats">
          <div className="stat-item">
            <span className="stat-number">{contentTab === 'highschool' ? highschoolCount : tertiaryCount}</span>
            <span className="stat-label">{contentTab === 'highschool' ? 'Highschool Subjects' : 'Tertiary Subjects'}</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">{subjects.filter((s) => (contentTab === 'highschool' ? !isTertiaryKey(s.grade_key) : isTertiaryKey(s.grade_key)) && s.is_active).length}</span>
            <span className="stat-label">Active</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">{subjects.filter((s) => (contentTab === 'highschool' ? !isTertiaryKey(s.grade_key) : isTertiaryKey(s.grade_key)) && !s.is_active).length}</span>
            <span className="stat-label">Inactive</span>
          </div>
        </div>

        <div className="content-search">
          <div className="search-wrapper">
            <span className="search-icon">🔍</span>
            <input type="text" className="search-input" placeholder="Search..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
        </div>

        {filteredSubjects.length === 0 ? (
          <div className="content-empty">
            <p>No {contentTab === 'highschool' ? 'highschool' : 'tertiary'} subjects yet.</p>
            <button className="add-btn" onClick={openAddModal}>➕ Add your first subject</button>
          </div>
        ) : (
          <div className="subjects-grid">
            {filteredSubjects.map((subject) => (
              <div key={subject.id} className="subject-card" style={{ borderColor: subject.color }}>
                <div className="subject-card-header">
                  <div className="subject-icon" style={{ background: subject.color }}>{subject.icon}</div>
                  <div className="subject-info">
                    <h4>{subject.name}</h4>
                    <p>{subject.description}</p>
                    <div className="subject-meta">
                      {getGradeBadge(subject.grade_key)}
                      <span className={`status-badge ${subject.is_active ? 'active' : 'inactive'}`}>{subject.is_active ? '✅ Active' : '❌ Inactive'}</span>
                    </div>
                  </div>
                </div>
                <div className="subject-actions">
                  <button className="action-btn content" onClick={() => navigate(`/admin/content/${subject.id}`)}>📖 Manage</button>
                  <button className="action-btn toggle" onClick={() => handleToggleClick(subject)}>{subject.is_active ? '🔴 Deactivate' : '🟢 Activate'}</button>
                  <button className="action-btn edit" onClick={() => openEditModal(subject)}>✏️ Edit</button>
                  <button className="action-btn delete" onClick={() => handleDeleteClick(subject)}>🗑️ Delete</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {showDeletePopup && deleteTarget && (
          <div className="login-prompt-overlay" onClick={() => !deleteLoading && setShowDeletePopup(false)}>
            <div className="login-prompt-modal" onClick={(e) => e.stopPropagation()}>
              <button className="login-prompt-close" onClick={() => !deleteLoading && setShowDeletePopup(false)}>×</button>
              <div className="login-prompt-icon">🗑️</div>
              <h3>Delete this subject?</h3>
              <p><strong>{deleteTarget.name}</strong> will be removed permanently. This can't be undone.</p>
              <div className="login-prompt-actions">
                <button className="login-prompt-cancel" onClick={() => setShowDeletePopup(false)} disabled={deleteLoading}>Cancel</button>
                <button className="login-prompt-btn" onClick={confirmDelete} disabled={deleteLoading}>{deleteLoading ? 'Deleting…' : 'Delete'}</button>
              </div>
            </div>
          </div>
        )}

        {showTogglePopup && toggleTarget && (
          <div className="login-prompt-overlay" onClick={() => !toggleLoading && setShowTogglePopup(false)}>
            <div className="login-prompt-modal" onClick={(e) => e.stopPropagation()}>
              <button className="login-prompt-close" onClick={() => !toggleLoading && setShowTogglePopup(false)}>×</button>
              <div className="login-prompt-icon">{toggleTarget.is_active ? '⚠️' : '✅'}</div>
              <h3>{toggleTarget.is_active ? 'Deactivate this subject?' : 'Activate this subject?'}</h3>
              <p>{toggleTarget.is_active ? "Students won't be able to see it." : 'Students will be able to see it again.'}</p>
              <div className="login-prompt-actions">
                <button className="login-prompt-cancel" onClick={() => setShowTogglePopup(false)} disabled={toggleLoading}>Cancel</button>
                <button className="login-prompt-btn" onClick={confirmToggle} disabled={toggleLoading}>{toggleLoading ? 'Saving…' : (toggleTarget.is_active ? 'Deactivate' : 'Activate')}</button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // -------- BUILDER VIEW --------
  return (
    <div className="ac-builder-page">
      <Modal />

      <header className="ac-builder-header">
        <div>
          <div className="ac-breadcrumb">Admin / {contentTab === 'tertiary' ? 'Tertiary' : 'Highschool'} / <span>{editingSubject ? 'Edit subject' : 'Add subject'}</span></div>
          <h1>{editingSubject ? 'Edit subject' : 'Add subject content'} {editingSubject && <span className="ac-status-badge published">Published</span>}</h1>
          <p>Everything here feeds the student Subjects page.</p>
        </div>
        <div className="ac-header-actions">
          <button className="ac-btn-secondary" onClick={() => setViewMode('list')}>Cancel</button>
          <button className="ac-btn-secondary" onClick={() => handleSaveSubject({ draft: true })} disabled={actionLoading || uploading}>Save draft</button>
          <button className="ac-btn-primary" onClick={() => handleSaveSubject()} disabled={actionLoading || uploading}>
            {actionLoading ? 'Saving…' : editingSubject ? 'Update live subject' : 'Publish subject'}
          </button>
        </div>
      </header>

      <div className="ac-layout">
        <nav className="ac-nav">
          {SECTIONS.map((sec, idx) => {
            const issues = otherIssues.filter((i) => i.sec === sec.id);
            const hasErr = (sec.id === 'basics' && missingFields.length > 0) || issues.some((i) => i.level === 'error');
            const hasWarn = issues.some((i) => i.level === 'warn');
            let badgeCls = 'ok'; let badgeText = 'Done';
            if (hasErr) { badgeCls = 'error'; badgeText = 'Needs attention'; }
            else if (hasWarn) { badgeCls = 'warn'; badgeText = 'Note'; }
            else if (sec.id === 'topics') badgeText = builderTopics.length;
            else if (sec.id === 'papers') badgeText = builderPapers.length;
            else if (sec.id === 'mocks') badgeText = builderMocks.length;
            else if (sec.id === 'review') { badgeCls = errorCount ? 'error' : 'ok'; badgeText = errorCount ? 'To fix' : 'Ready'; }
            return (
              <button key={sec.id} className={`ac-nav-btn ${activeSection === sec.id ? 'active' : ''}`} onClick={() => setActiveSection(sec.id)}>
                <span className="ac-nav-num">{idx + 1}</span>
                <span style={{ flex: 1 }}>{sec.label}</span>
                <span className={`ac-nav-badge ${badgeCls}`}>{badgeText}</span>
              </button>
            );
          })}
          <div className="ac-progress-card">
            <h4>Completeness</h4>
            <div className="ac-progress-track"><div className="ac-progress-fill" style={{ width: `${completeness}%` }} /></div>
            <div className="ac-progress-text">{errorCount === 0 ? 'Ready to publish.' : `${errorCount} thing${errorCount > 1 ? 's' : ''} to fix.`}</div>
          </div>
        </nav>

        <main className="ac-form-area">
          {activeSection === 'basics' && (
            <div className="ac-section-panel">
              <h2>Basic info</h2>
              <p className="ac-subtitle">What students see on the subject card.</p>
              <div className="ac-form-grid">
                <div className="ac-field"><label>Subject name *</label><input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="e.g. Physical Sciences" /></div>
                <div className="ac-field"><label>URL slug *</label><input value={formData.slug} readOnly className="ac-readonly" /></div>
              </div>
              <div className="ac-field"><label>Short description *</label><textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="Shown on the card." rows={3} /></div>
              <div className="ac-form-grid">
                <div className="ac-field">
                  <label>Grade *</label>
                  <select value={formData.grade_key} onChange={(e) => setFormData({ ...formData, grade_key: e.target.value })}>
                    <option value="" disabled>Select a grade…</option>
                    {gradeOptions.map((g) => <option key={g.key} value={g.key}>{g.label}</option>)}
                  </select>
                </div>
                <div className="ac-field">
                  <label>Category *</label>
                  <select value={formData.category_id} onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}>
                    <option value="" disabled>Select a category…</option>
                    {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="ac-form-grid">
                <div className="ac-field"><label>Icon (emoji)</label><input value={formData.icon} onChange={(e) => setFormData({ ...formData, icon: e.target.value })} placeholder="e.g. ⚗️" maxLength={2} /></div>
                <div className="ac-field">
                  <label>Accent colour</label>
                  <div className="ac-colors">
                    {DEFAULT_COLORS.map((c) => (
                      <button key={c} className={`ac-color-swatch ${formData.color === c ? 'active' : ''}`} style={{ background: c }} onClick={() => setFormData({ ...formData, color: c })} />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'topics' && (
            <div className="ac-section-panel">
              <h2>Topics</h2>
              <p className="ac-subtitle">Students open these from View topics.</p>
              <div className="ac-inline-add">
                <input value={newTopicName} onChange={(e) => setNewTopicName(e.target.value)} placeholder="Topic name" />
                <input value={newTopicDesc} onChange={(e) => setNewTopicDesc(e.target.value)} placeholder="Description (optional)" />
                <button className="ac-btn-primary" onClick={addTopicToBuilder} style={{ padding: '0 16px' }}>➕ Add</button>
              </div>
              <div className="ac-list">
                {builderTopics.map((t, i) => (
                  <div key={t.id} className="ac-list-row">
                    <span className="ac-row-num">{i + 1}</span>
                    <span>{t.name} {t.description && <small style={{ color: '#9a9ab8' }}>— {t.description}</small>}</span>
                    <button className="ac-btn-icon" onClick={() => removeTopicFromBuilder(t.id)}>✕</button>
                  </div>
                ))}
                {builderTopics.length === 0 && <p className="ac-muted-text">No topics yet.</p>}
              </div>
              <button className="ac-btn-dashed" onClick={openResourcePopup}>➕ Add resource (PDF / Video)</button>
              <div className="ac-list" style={{ marginTop: 12 }}>
                {builderResources.map((r) => (
                  <div key={r.id} className="ac-list-row">
                    <span>{getResourceIcon(r.type)}</span>
                    <span>{r.name}</span>
                    <span className="ac-builder-tag">{r.type}</span>
                    <button className="ac-btn-icon" onClick={() => setBuilderResources((prev) => prev.filter((x) => x.id !== r.id))}>✕</button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeSection === 'papers' && (
            <div className="ac-section-panel">
              <h2>Past papers</h2>
              <p className="ac-subtitle">Official question papers and memos.</p>
              <div className="ac-list">
                {builderPapers.map((p, i) => (
                  <div key={i} className="ac-list-row ac-paper-row">
                    <div className="ac-paper-meta">
                      <input type="number" value={p.year} onChange={(e) => updateArrayItem(setBuilderPapers, i, 'year', e.target.value)} placeholder="Year" />
                      <select value={p.session} onChange={(e) => updateArrayItem(setBuilderPapers, i, 'session', e.target.value)}><option value="Nov">Nov</option><option value="Jun">June</option></select>
                      <select value={p.paper} onChange={(e) => updateArrayItem(setBuilderPapers, i, 'paper', e.target.value)}><option value="P1">P1</option><option value="P2">P2</option></select>
                    </div>
                    <div className="ac-upload-group">
                      <label className={`ac-upload-btn ${p.paper_url ? 'uploaded' : ''}`}>
                        {p.paper_url ? `✅ ${p.paper_name || 'QP uploaded'}` : (uploading ? '⏳ Uploading…' : '📤 Upload QP')}
                        <input type="file" accept="application/pdf" onChange={(e) => handleFileUpload(e, 'paper_qp', i)} hidden />
                      </label>
                      <label className={`ac-upload-btn ${p.memo_url ? 'uploaded' : ''}`}>
                        {p.memo_url ? `✅ ${p.memo_name || 'Memo uploaded'}` : (uploading ? '⏳ Uploading…' : '📤 Upload Memo')}
                        <input type="file" accept="application/pdf" onChange={(e) => handleFileUpload(e, 'paper_memo', i)} hidden />
                      </label>
                      {(p.paper_url || p.memo_url) && (
                        <button className="ac-btn-icon" title="Clear files" onClick={() => {
                          updateArrayItem(setBuilderPapers, i, 'paper_url', '');
                          updateArrayItem(setBuilderPapers, i, 'memo_url', '');
                          updateArrayItem(setBuilderPapers, i, 'paper_name', '');
                          updateArrayItem(setBuilderPapers, i, 'memo_name', '');
                        }}>🗑️</button>
                      )}
                    </div>
                    <button className="ac-btn-icon danger" onClick={() => setBuilderPapers(builderPapers.filter((_, idx) => idx !== i))}>✕</button>
                  </div>
                ))}
              </div>
              <button className="ac-btn-dashed" onClick={() => setBuilderPapers([...builderPapers, { year: '2024', session: 'Nov', paper: 'P1', paper_url: '', memo_url: '', paper_name: '', memo_name: '' }])}>➕ Add past paper</button>
            </div>
          )}

          {activeSection === 'mocks' && (
            <div className="ac-section-panel">
              <h2>Mock exams</h2>
              <p className="ac-subtitle">EduSpantech generated practice exams.</p>
              <div className="ac-list">
                {builderMocks.map((m, i) => (
                  <div key={i} className="ac-list-row ac-mock-row">
                    <div className="ac-mock-top">
                      <input value={m.title} onChange={(e) => updateArrayItem(setBuilderMocks, i, 'title', e.target.value)} placeholder="Mock Title" style={{ flex: 1 }} />
                      <input type="number" value={m.duration} onChange={(e) => updateArrayItem(setBuilderMocks, i, 'duration', e.target.value)} placeholder="Mins" style={{ maxWidth: '80px' }} />
                      <input type="number" value={m.marks} onChange={(e) => updateArrayItem(setBuilderMocks, i, 'marks', e.target.value)} placeholder="Marks" style={{ maxWidth: '80px' }} />
                      <button className="ac-btn-icon danger" onClick={() => setBuilderMocks(builderMocks.filter((_, idx) => idx !== i))}>✕</button>
                    </div>
                    <div className="ac-upload-group" style={{ marginTop: '10px' }}>
                      <label className={`ac-upload-btn ${m.paper_url ? 'uploaded' : ''}`}>
                        {m.paper_url ? `✅ ${m.paper_name || 'Paper uploaded'}` : (uploading ? '⏳ Uploading…' : '📤 Upload Paper')}
                        <input type="file" accept="application/pdf" onChange={(e) => handleFileUpload(e, 'mock_qp', i)} hidden />
                      </label>
                      <label className={`ac-upload-btn ${m.memo_url ? 'uploaded' : ''}`}>
                        {m.memo_url ? `✅ ${m.memo_name || 'Memo uploaded'}` : (uploading ? '⏳ Uploading…' : '📤 Upload Memo')}
                        <input type="file" accept="application/pdf" onChange={(e) => handleFileUpload(e, 'mock_memo', i)} hidden />
                      </label>
                      {(m.paper_url || m.memo_url) && (
                        <button className="ac-btn-icon" title="Clear files" onClick={() => {
                          updateArrayItem(setBuilderMocks, i, 'paper_url', '');
                          updateArrayItem(setBuilderMocks, i, 'memo_url', '');
                          updateArrayItem(setBuilderMocks, i, 'paper_name', '');
                          updateArrayItem(setBuilderMocks, i, 'memo_name', '');
                        }}>🗑️</button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <button className="ac-btn-dashed" onClick={() => setBuilderMocks([...builderMocks, { title: '', duration: 150, marks: 150, paper_url: '', memo_url: '', paper_name: '', memo_name: '' }])}>➕ Add mock exam</button>
            </div>
          )}

          {activeSection === 'access' && (
            <div className="ac-section-panel">
              <h2>Access and visibility</h2>
              <p className="ac-subtitle">Who can open this subject, and when it goes live.</p>
              <span className="ac-field-label">Plans that can open it</span>
              <div className="ac-plan-list">
                {plans.length === 0 ? (
                  <p className="ac-muted-text">No plans configured yet.</p>
                ) : plans.map((plan) => {
                  const key = plan.tier || plan.key || plan.id;
                  const checked = formData.allowed_plans.includes(key);
                  return (
                    <label key={plan.id} className="ac-checkbox-card">
                      <input type="checkbox" checked={checked} onChange={(e) => {
                        const next = e.target.checked ? [...formData.allowed_plans, key] : formData.allowed_plans.filter((t) => t !== key);
                        setFormData({ ...formData, allowed_plans: next });
                      }} />
                      <div><b>{plan.name}</b>{plan.price != null && <small> R{plan.price}/month</small>}</div>
                    </label>
                  );
                })}
              </div>
              <div style={{ marginTop: 24, display: 'flex', flexDirection: 'column', gap: 12 }}>
                <label className="ac-checkbox"><input type="checkbox" checked={formData.is_active} onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })} /> <span>Active, visible to students</span></label>
                <label className="ac-checkbox"><input type="checkbox" checked={formData.soon} onChange={(e) => setFormData({ ...formData, soon: e.target.checked })} /> <span>Past papers coming soon</span></label>
              </div>
            </div>
          )}

          {activeSection === 'review' && (
            <div className="ac-section-panel">
              <h2>Review and publish</h2>
              <p className="ac-subtitle">A last look at what will go live.</p>
              <div className="ac-review-grid">
                <div className="ac-review-item"><dt>Type</dt><dd>{contentTab === 'tertiary' ? 'Tertiary' : 'Highschool'}</dd></div>
                <div className="ac-review-item"><dt>Subject</dt><dd>{formData.name || 'Untitled'} {grades.find((g) => g.key === formData.grade_key)?.label ? `— ${grades.find((g) => g.key === formData.grade_key).label}` : ''}</dd></div>
                <div className="ac-review-item"><dt>Category</dt><dd>{categories.find((c) => c.id === formData.category_id)?.name || '—'}</dd></div>
                <div className="ac-review-item"><dt>Topics</dt><dd>{builderTopics.length}</dd></div>
                <div className="ac-review-item"><dt>Past papers</dt><dd>{builderPapers.length}</dd></div>
                <div className="ac-review-item"><dt>Mock exams</dt><dd>{builderMocks.length}</dd></div>
                <div className="ac-review-item"><dt>Available on</dt><dd>{formData.allowed_plans.length} plans</dd></div>
                <div className="ac-review-item"><dt>Visibility</dt><dd>{formData.is_active ? 'Active' : 'Draft'}</dd></div>
                <div className="ac-review-item"><dt>URL</dt><dd>/subjects/{formData.slug}</dd></div>
              </div>
              <h3 style={{ fontSize: 14, color: '#fff', marginBottom: 12 }}>Things to fix or check</h3>
              <div className="ac-issue-list">
                {missingFields.length === 0 && otherIssues.length === 0 && (
                  <p style={{ color: '#22c55e', fontWeight: 600 }}>All checks passed. Ready to publish.</p>
                )}
                {missingFields.map((m, i) => (
                  <div key={`mf-${i}`} className="ac-issue-item" onClick={() => setActiveSection('basics')}>
                    <span className="ac-tag error">Fix</span>
                    <span className="ac-issue-msg">Please add a {m}.</span>
                    <span className="ac-issue-where">Basic info</span>
                  </div>
                ))}
                {otherIssues.map((iss, i) => (
                  <div key={`oi-${i}`} className="ac-issue-item" onClick={() => setActiveSection(iss.sec)}>
                    <span className={`ac-tag ${iss.level}`}>{iss.level === 'error' ? 'Fix' : 'Check'}</span>
                    <span className="ac-issue-msg">{iss.msg}</span>
                    <span className="ac-issue-where">{SECTIONS.find((s) => s.id === iss.sec)?.label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="ac-pager">
            <button className="ac-btn-secondary" disabled={activeSection === 'basics'} onClick={() => setActiveSection(SECTIONS[SECTIONS.findIndex((s) => s.id === activeSection) - 1].id)}>Back</button>
            <button className="ac-btn-secondary" disabled={activeSection === 'review'} onClick={() => setActiveSection(SECTIONS[SECTIONS.findIndex((s) => s.id === activeSection) + 1].id)}>Next</button>
          </div>
        </main>

        <aside className="ac-preview">
          <div className="ac-preview-header">
            <h3>Live preview</h3>
            <div className="ac-toggle-group">
              <button className={`ac-toggle-btn ${previewMode === 'open' ? 'active' : ''}`} onClick={() => setPreviewMode('open')}>Plan includes it</button>
              <button className={`ac-toggle-btn ${previewMode === 'locked' ? 'active' : ''}`} onClick={() => setPreviewMode('locked')}>Locked view</button>
            </div>
          </div>

          <div className="ac-pv-card" style={{ '--c': formData.color || '#a78bfa', opacity: previewMode === 'locked' ? 0.7 : 1 }}>
            <div className="ac-pv-top">
              <span className="ac-pv-icon">{formData.icon || '📚'}</span>
              <span className="ac-pv-grade">{grades.find((g) => g.key === formData.grade_key)?.label || 'Grade ?'}</span>
            </div>
            <h4>{formData.name || 'Subject name'}</h4>
            <p>{formData.description || 'Description…'}</p>
            <dl className="ac-pv-stats">
              <div><dt>Past papers</dt><dd>{builderPapers.length}</dd></div>
              <div><dt>Topics</dt><dd>{builderTopics.length}</dd></div>
              <div><dt>Memos</dt><dd>{builderPapers.filter((p) => p.memo_url).length}</dd></div>
            </dl>
            <div className="ac-pv-footer">
              {previewMode === 'locked' ? <span style={{ color: '#fbbf24' }}>🔒 Upgrade to open</span> : <span>View topics →</span>}
            </div>
          </div>

          <div className="ac-panel" style={{ padding: 16, marginTop: 16 }}>
            <h3 style={{ fontSize: 13, color: '#fff', marginBottom: 8 }}>Past papers hub</h3>
            <p style={{ fontSize: 11, color: '#9a9ab8', marginBottom: 12 }}>Newest papers. Greyed links are missing.</p>
            <div className="ac-hub-list">
              {builderPapers.slice(0, 4).map((p, i) => (
                <div key={i} className="ac-hub-item">
                  <span><span className="ac-hub-year">{p.year}</span> <span className="ac-hub-paper">{p.paper}</span> <span className="ac-tag sm">{p.session}</span></span>
                  <span className="ac-hub-links">
                    <span className={p.paper_url ? '' : 'grey'}>Question paper</span> | <span className={p.memo_url ? '' : 'grey'}>Memo</span>
                  </span>
                </div>
              ))}
              {builderPapers.length === 0 && <p style={{ fontSize: 11, color: '#5b5b8f' }}>Nothing to show yet.</p>}
            </div>
          </div>

          <div className="ac-panel" style={{ padding: 16, marginTop: 16 }}>
            <h3 style={{ fontSize: 13, color: '#fff', marginBottom: 12 }}>Readiness</h3>
            {missingFields.length === 0 && otherIssues.length === 0 ? (
              <p style={{ color: '#22c55e', fontWeight: 600, fontSize: 12 }}>No blocking issues.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {missingFields.map((m, i) => (
                  <div key={`rm-${i}`} style={{ display: 'flex', gap: 8, fontSize: 12 }}>
                    <span className="ac-tag error" style={{ height: 'fit-content' }}>Fix</span>
                    <span style={{ color: '#e5e7eb' }}>Add a {m}.</span>
                  </div>
                ))}
                {otherIssues.map((iss, i) => (
                  <div key={`ro-${i}`} style={{ display: 'flex', gap: 8, fontSize: 12 }}>
                    <span className={`ac-tag ${iss.level}`} style={{ height: 'fit-content' }}>{iss.level === 'error' ? 'Fix' : 'Check'}</span>
                    <span style={{ color: '#e5e7eb' }}>{iss.msg}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </aside>
      </div>

      {showResourceDraftPopup && (
        <div className="login-prompt-overlay" onClick={() => !resourceUploading && setShowResourceDraftPopup(false)}>
          <div className="login-prompt-modal" onClick={(e) => e.stopPropagation()}>
            <button className="login-prompt-close" onClick={() => !resourceUploading && setShowResourceDraftPopup(false)}>×</button>
            <div className="login-prompt-icon">📚</div>
            <h3>Add resource</h3>
            <p>Upload a PDF or paste a video link.</p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, textAlign: 'left', marginBottom: 20 }}>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.7)' }}>Resource type</span>
                <select
                  value={resourceDraft.type}
                  onChange={(e) => setResourceDraft({ ...resourceDraft, type: e.target.value, url: '' })}
                  style={{ padding: '10px 12px', borderRadius: 10, background: '#0f0f24', border: '1px solid #5b5b8f', color: '#fff' }}
                >
                  <option value="pdf">📄 PDF document</option>
                  <option value="video">🎬 Video (YouTube)</option>
                </select>
              </label>

              <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.7)' }}>Name *</span>
                <input
                  value={resourceDraft.name}
                  onChange={(e) => setResourceDraft({ ...resourceDraft, name: e.target.value })}
                  placeholder="e.g. Intro to Algebra"
                  style={{ padding: '10px 12px', borderRadius: 10, background: '#0f0f24', border: '1px solid #5b5b8f', color: '#fff' }}
                />
              </label>

              {resourceDraft.type === 'pdf' && (
                <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.7)' }}>PDF file *</span>
                  <div
                    className={`resource-upload-zone ${resourceDraft.url ? 'has-file' : ''}`}
                    onClick={() => !resourceUploading && resourceFileRef.current?.click()}
                  >
                    <input
                      ref={resourceFileRef}
                      type="file"
                      accept="application/pdf"
                      onChange={handleResourceFileUpload}
                      disabled={resourceUploading}
                      style={{ display: 'none' }}
                    />
                    {resourceUploading ? <span>⏳ Uploading…</span>
                      : resourceDraft.url ? <span>✅ {resourceFileName || 'PDF'} uploaded — click to replace</span>
                      : <span>📤 Click to upload a PDF (max 50MB)</span>}
                  </div>
                </label>
              )}

              {resourceDraft.type === 'video' && (
                <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.7)' }}>YouTube URL *</span>
                  <input
                    value={resourceDraft.url}
                    onChange={(e) => handleResourceUrlChange(e.target.value)}
                    placeholder="https://youtube.com/watch?v=…"
                    style={{ padding: '10px 12px', borderRadius: 10, background: '#0f0f24', border: '1px solid #5b5b8f', color: '#fff' }}
                  />
                </label>
              )}
            </div>

            <div className="login-prompt-actions">
              <button className="login-prompt-cancel" onClick={() => setShowResourceDraftPopup(false)} disabled={resourceUploading}>Cancel</button>
              <button className="login-prompt-btn" onClick={confirmAddResourceDraft} disabled={resourceUploading}>Add to list</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminContent;