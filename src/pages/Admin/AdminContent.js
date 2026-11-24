// src/pages/Admin/AdminContent.js
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../services/supabaseClient';
import './AdminContent.css';
import '../Pricing.css';

const API_URL = process.env.REACT_APP_API_URL || 'https://eduspantech-backend.onrender.com/api';

// Steps follow the order an admin naturally works in:
// who is it for -> what is in it -> who can open it -> publish.
const SECTIONS = [
  { id: 'basics',    label: 'Basic info' },
  { id: 'topics',    label: 'Topics' },
  { id: 'resources', label: 'Lesson resources' },
  { id: 'papers',    label: 'Past papers' },
  { id: 'mocks',     label: 'Mock exams' },
  { id: 'access',    label: 'Access & visibility' },
  { id: 'review',    label: 'Review and publish' },
];

const DEFAULT_COLORS = ['#4f46e5','#7c3aed','#06b6d4','#10b981','#f59e0b','#ef4444','#ec4899','#8b5cf6','#14b8a6','#f97316'];

const MAX_UPLOAD_BYTES = 50 * 1024 * 1024; // 50MB

// The 11 official languages. The code is what gets stored on the subject.
const LANGUAGES = [
  { code: 'en',  label: 'English' },
  { code: 'af',  label: 'Afrikaans' },
  { code: 'zu',  label: 'isiZulu' },
  { code: 'xh',  label: 'isiXhosa' },
  { code: 'nso', label: 'Sepedi' },
  { code: 'st',  label: 'Sesotho' },
  { code: 'tn',  label: 'Setswana' },
  { code: 'ss',  label: 'siSwati' },
  { code: 've',  label: 'Tshivenda' },
  { code: 'ts',  label: 'Xitsonga' },
  { code: 'nr',  label: 'isiNdebele' },
];
const getLanguageLabel = (code) => LANGUAGES.find((l) => l.code === (code || 'en'))?.label || 'English';

// Individual grades instead of buckets
const HIGHSCHOOL_GRADES = [
  { key: 'grade-8',   label: 'Grade 8',   tier: '8' },
  { key: 'grade-9',   label: 'Grade 9',   tier: '9' },
  { key: 'grade-10',  label: 'Grade 10',  tier: '10' },
  { key: 'grade-11',  label: 'Grade 11',  tier: '11' },
  { key: 'grade-12',  label: 'Grade 12',  tier: '12' },
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
  language: 'en',
  name: '', slug: '', description: '', long_description: '',
  icon: '📚', color: '#4f46e5', grade_key: '', category_id: '',
  is_active: true, code: '', track: '', semester: '', institution: '',
  allowed_plans: [], soon: false, region: 'Global', year_level: '1ST_YEAR',
});

const initialResourceDraft = () => ({
  name: '', type: 'pdf', url: '', description: '', topicIndex: '',
  youtube_id: '', thumbnail_url: '', duration: '', difficulty: 'beginner', is_free: false,
});

const newPaper = () => ({
  year: String(new Date().getFullYear()), session: 'Nov', paper: 'P1',
  paper_url: '', memo_url: '', paper_name: '', memo_name: '',
});

const newMock = () => ({
  title: '', paper: 'P1', duration: '', marks: '',
  paper_url: '', memo_url: '', paper_name: '', memo_name: '',
});

const normGrade = (k) => String(k || '').toLowerCase().replace(/[^a-z0-9]/g, '');

const getToken = () => localStorage.getItem('accessToken');

const isPdfFile = (file) =>
  file && (file.type === 'application/pdf' || /\.pdf$/i.test(file.name || ''));

// Refresh the access token. Returns true on success.
const refreshAccessToken = async () => {
  const rt = localStorage.getItem('refreshToken');
  if (!rt) return false;
  try {
    const r = await fetch(`${API_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: rt }),
    });
    if (!r.ok) return false;
    const d = await r.json();
    if (!d.accessToken) return false;
    localStorage.setItem('accessToken', d.accessToken);
    if (d.refreshToken) localStorage.setItem('refreshToken', d.refreshToken);
    return true;
  } catch {
    return false;
  }
};

// ============================================================
// Upload a file to the backend.
// Uses the same working route as the tutor application form:
//   POST /tutors/upload  { filename, contentType, data (base64 data URL), folder }
// and reads { success, url, error } from the reply.
// ============================================================
const fileToDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('Could not read the file from your device.'));
    reader.readAsDataURL(file);
  });

const uploadFileToBackend = async (file, folder = 'content') => {
  const data = await fileToDataUrl(file);

  let res;
  try {
    res = await fetch(`${API_URL}/tutors/upload`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        filename: file.name,
        contentType: file.type || 'application/pdf',
        data,
        folder,
      }),
    });
  } catch (err) {
    throw new Error("We couldn't reach the server. Check your connection (the server may also be waking up — wait 30 seconds and try again).");
  }

  let json = {};
  try { json = await res.json(); } catch { /* non-JSON response */ }

  if (res.status === 413) {
    throw new Error('The file is too large for the server. Try a smaller PDF.');
  }
  if (!res.ok || json.success === false) {
    throw new Error(json.error || json.message || `Upload failed (server error ${res.status}).`);
  }

  const url = json.url || json.publicUrl || json.public_url || json.data?.url || json.file?.url;
  if (!url) {
    throw new Error('The upload finished but the server did not return a file link.');
  }
  return url;
};

// ============================================================
// Modal — defined OUTSIDE the component so it is not re-created
// on every render (that was remounting inputs and the file picker).
// ============================================================
const PromptModal = ({ open, icon, title, children, buttons, onClose }) => {
  if (!open) return null;
  return (
    <div className="login-prompt-overlay" onClick={onClose}>
      <div className="login-prompt-modal" onClick={(e) => e.stopPropagation()}>
        {onClose && <button className="login-prompt-close" onClick={onClose}>×</button>}
        <div className="login-prompt-icon">{icon}</div>
        <h3>{title}</h3>
        <div style={{ marginBottom: 20, whiteSpace: 'pre-line' }}>{children}</div>
        <div className="login-prompt-actions">
          {buttons.map((btn, i) => (
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

const AdminContent = () => {
  const navigate = useNavigate();

  const [viewMode, setViewMode] = useState('list');
  const [contentTab, setContentTab] = useState('highschool');

  const [subjects, setSubjects] = useState([]);
  const [filteredSubjects, setFilteredSubjects] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [languageFilter, setLanguageFilter] = useState('all');
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

  // Tracks whether existing content loaded when editing, so a failed load
  // can never cause the save to delete topics the admin never saw.
  const [topicsLoaded, setTopicsLoaded] = useState(true);
  const [contentLoading, setContentLoading] = useState(false);
  const [loadFailures, setLoadFailures] = useState([]);

  const [uploading, setUploading] = useState(false);
  const [previewMode, setPreviewMode] = useState('open');
  const [editingSubject, setEditingSubject] = useState(null);

  const [feedback, setFeedback] = useState(null);
  const showFeedback = (type, title, message) => setFeedback({ type, title, message });
  const showSuccess = (msg) => showFeedback('success', 'Success', msg);
  const showError = (msg) => showFeedback('error', 'Something needs fixing', msg);
  const closeFeedback = () => setFeedback(null);

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

  // Same wording on the header button and on the last step.
  const publishLabel = editingSubject ? 'Publish live subject' : 'Publish';

  const authFetch = useCallback(async (url, options = {}, retry = true) => {
    const headers = {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
      Authorization: `Bearer ${getToken()}`,
    };
    let res;
    try {
      res = await fetch(url, { ...options, headers });
    } catch (err) {
      throw new Error("We couldn't reach the server. Please check your connection.");
    }

    if (res.status === 401) {
      if (retry && (await refreshAccessToken())) return authFetch(url, options, false);
      throw new Error('SESSION_EXPIRED');
    }
    return res;
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);

      if (!getToken()) {
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
            language: s.language || 'en',
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

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { fetchInitialData(); }, []);

  // Slug = name + grade (+ language when it is not English, so existing English slugs stay the same).
  useEffect(() => {
    if (viewMode === 'builder' && formData.name && !editingSubject) {
      const base = formData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
      const gs = formData.grade_key ? `-${formData.grade_key}` : '';
      const ls = formData.language && formData.language !== 'en' ? `-${formData.language}` : '';
      setFormData((p) => ({ ...p, slug: `${base}${gs}${ls}` }));
    }
  }, [formData.name, formData.grade_key, formData.language, viewMode, editingSubject]);

  useEffect(() => {
    let list = subjects.filter((s) => {
      const tertiary = isTertiaryKey(s.grade_key);
      return contentTab === 'tertiary' ? tertiary : !tertiary;
    });
    if (languageFilter !== 'all') {
      list = list.filter((s) => (s.language || 'en') === languageFilter);
    }
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
  }, [searchTerm, subjects, contentTab, languageFilter]);

  const gradeOptions = useMemo(() => {
    return grades.filter((g) => {
      const tertiary = isTertiaryKey(g.key) || String(g.tier || '').toLowerCase() === 'tertiary';
      return contentTab === 'tertiary' ? tertiary : !tertiary;
    });
  }, [grades, contentTab]);

  const missingFields = useMemo(() => {
    const missing = [];
    if (!formData.language) missing.push('Content language');
    if (!formData.grade_key) missing.push('Grade');
    if (!formData.category_id) missing.push('Category');
    if (!formData.name.trim()) missing.push('Subject name');
    if (formData.is_active && formData.allowed_plans.length === 0) missing.push('At least one access plan');
    return missing;
  }, [formData]);

  const otherIssues = useMemo(() => {
    const issues = [];

    const blankTopics = builderTopics.filter((t) => !t.name?.trim()).length;
    if (blankTopics) issues.push({ sec: 'topics', level: 'error', msg: `${blankTopics} topic${blankTopics > 1 ? 's have' : ' has'} no title` });

    // Past papers
    const papersMissing = builderPapers.filter((p) => !p.paper_url).length;
    if (builderPapers.length > 0 && papersMissing) issues.push({ sec: 'papers', level: 'error', msg: `${papersMissing} past paper${papersMissing > 1 ? 's need' : ' needs'} a question paper PDF` });

    const seen = new Set();
    let dupes = 0;
    builderPapers.forEach((p) => {
      const key = `${p.year}-${p.session}-${p.paper}`;
      if (seen.has(key)) dupes += 1; else seen.add(key);
    });
    if (dupes) issues.push({ sec: 'papers', level: 'error', msg: `${dupes} past paper${dupes > 1 ? 's repeat' : ' repeats'} another one (same year, session and paper)` });

    const noMemos = builderPapers.filter((p) => p.paper_url && !p.memo_url).length;
    if (noMemos) issues.push({ sec: 'papers', level: 'warn', msg: `${noMemos} past paper${noMemos > 1 ? 's have' : ' has'} no memo yet` });
    if (builderPapers.length === 0) issues.push({ sec: 'papers', level: 'warn', msg: 'no past papers added yet' });

    // Mock exams
    const mockNoTitle = builderMocks.filter((m) => !String(m.title || '').trim()).length;
    if (mockNoTitle) issues.push({ sec: 'mocks', level: 'error', msg: `${mockNoTitle} mock exam${mockNoTitle > 1 ? 's need' : ' needs'} a title` });

    const mockBadNumbers = builderMocks.filter((m) => !(Number(m.duration) > 0) || !(Number(m.marks) > 0)).length;
    if (mockBadNumbers) issues.push({ sec: 'mocks', level: 'error', msg: `${mockBadNumbers} mock exam${mockBadNumbers > 1 ? 's need' : ' needs'} the time allowed and total marks` });

    const mockNoPaper = builderMocks.filter((m) => !m.paper_url).length;
    if (mockNoPaper) issues.push({ sec: 'mocks', level: 'error', msg: `${mockNoPaper} mock exam${mockNoPaper > 1 ? 's need' : ' needs'} a question paper PDF` });

    const mockNoMemo = builderMocks.filter((m) => m.paper_url && !m.memo_url).length;
    if (mockNoMemo) issues.push({ sec: 'mocks', level: 'warn', msg: `${mockNoMemo} mock exam${mockNoMemo > 1 ? 's have' : ' has'} no memo yet` });

    return issues;
  }, [builderTopics, builderPapers, builderMocks]);

  const errorCount = missingFields.length + otherIssues.filter((i) => i.level === 'error').length;
  const completeness = Math.max(0, 5 - errorCount) * 20;

  // Handles errors from uploads (incl. expired session)
  const handleUploadError = (err) => {
    if (err.message === 'SESSION_EXPIRED') {
      showError('Your session expired. Please log in again, then retry the upload.');
      setTimeout(() => { window.location.href = '/admin/login'; }, 2000);
    } else {
      showError(err.message || 'The file could not be uploaded. Please try again.');
    }
  };

  const handleFileUpload = async (e, type, index) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!isPdfFile(file)) { showError('Please choose a PDF file.'); e.target.value = ''; return; }
    if (file.size > MAX_UPLOAD_BYTES) { showError('The PDF must be smaller than 50MB.'); e.target.value = ''; return; }
    try {
      setUploading(true);
      const publicUrl = await uploadFileToBackend(file, 'content');
      const update = (setter) => setter((prev) => {
        const copy = [...prev];
        if (!copy[index]) return copy;
        const field = type.endsWith('_memo') ? 'memo_url' : 'paper_url';
        const nameField = type.endsWith('_memo') ? 'memo_name' : 'paper_name';
        copy[index] = { ...copy[index], [field]: publicUrl, [nameField]: file.name };
        return copy;
      });
      if (type === 'paper_qp' || type === 'paper_memo') update(setBuilderPapers);
      if (type === 'mock_qp' || type === 'mock_memo') update(setBuilderMocks);
      showSuccess(`${file.name} uploaded.`);
    } catch (err) {
      handleUploadError(err);
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleResourceFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!isPdfFile(file)) { showError('Please choose a PDF file.'); e.target.value = ''; return; }
    if (file.size > MAX_UPLOAD_BYTES) { showError('The PDF must be smaller than 50MB.'); e.target.value = ''; return; }
    try {
      setResourceUploading(true);
      const publicUrl = await uploadFileToBackend(file, 'resources');
      setResourceDraft((prev) => ({ ...prev, url: publicUrl, name: prev.name || file.name.replace(/\.pdf$/i, '') }));
      setResourceFileName(file.name);
      showSuccess(`${file.name} uploaded.`);
    } catch (err) {
      handleUploadError(err);
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

  const clearFiles = (setter, index) =>
    setter((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], paper_url: '', memo_url: '', paper_name: '', memo_name: '' };
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

  // ============================================================
  // Load existing topics / resources / papers for a subject.
  // Each request is independent: one failing request (e.g. a 401 on
  // /papers) no longer prevents the others from showing.
  // ============================================================
  const loadExistingContent = async (subjectId) => {
    setContentLoading(true);
    setLoadFailures([]);

    const fetchPart = async (path) => {
      try {
        const r = await authFetch(`${API_URL}/admin/content/subjects/${subjectId}/${path}`);
        if (!r.ok) return { ok: false, status: r.status };
        return { ok: true, data: await r.json() };
      } catch (e) {
        return { ok: false, error: e.message };
      }
    };

    try {
      const [t, r, p] = await Promise.all([
        fetchPart('topics'),
        fetchPart('resources'),
        fetchPart('papers'),
      ]);

      const failed = [];

      if (t.ok) {
        const topics = t.data.topics || t.data.data || [];
        setBuilderTopics(topics.map((x) => ({
          id: x.id, name: x.name, description: x.description || '',
          display_order: x.display_order || 0, is_active: x.is_active !== false,
        })));
        setTopicsLoaded(true);
      } else {
        setTopicsLoaded(false);
        failed.push('topics');
      }

      if (r.ok) {
        const resources = r.data.resources || r.data.data || [];
        setBuilderResources(resources.map((x) => ({
          saved: true, id: x.id, name: x.name, type: x.type || 'pdf', url: x.url || '',
          description: x.description || '', topicLocalId: x.topic_id || null,
          youtube_id: x.youtube_id || '', thumbnail_url: x.thumbnail_url || '',
          duration: x.duration || '', difficulty: x.difficulty || 'beginner',
          is_free: x.is_free || false, display_order: x.display_order || 0,
          is_active: x.is_active !== false,
        })));
      } else {
        failed.push('resources');
      }

      if (p.ok) {
        const papers = p.data.papers || p.data.data || [];
        const regular = papers.filter((x) => !x.is_mock);
        const mocks = papers.filter((x) => x.is_mock);
        setBuilderPapers(regular.map((x) => ({
          saved: true, id: x.id, year: String(x.year || new Date().getFullYear()), session: x.session || 'Nov', paper: x.paper_number || 'P1',
          paper_url: x.paper_url || '', memo_url: x.memo_url || '',
          paper_name: x.paper_url ? 'Uploaded' : '', memo_name: x.memo_url ? 'Uploaded' : '',
        })));
        setBuilderMocks(mocks.map((x) => ({
          saved: true, id: x.id, title: x.title || '', paper: x.paper_number || 'P1',
          duration: x.duration_minutes ? String(x.duration_minutes) : '', marks: x.total_marks ? String(x.total_marks) : '',
          paper_url: x.paper_url || '', memo_url: x.memo_url || '',
          paper_name: x.paper_url ? 'Uploaded' : '', memo_name: x.memo_url ? 'Uploaded' : '',
        })));
      } else {
        failed.push('past papers & mock exams');
      }

      setLoadFailures(failed);

      if (failed.length) {
        const expired = [t, r, p].some((x) => x.error === 'SESSION_EXPIRED' || x.status === 401);
        showError(
          `Couldn't load: ${failed.join(', ')}.\n\n` +
          (expired
            ? 'Your session looks expired. Please log out and log in again, then reopen this subject.\n\n'
            : 'Check your connection and try again.\n\n') +
          (failed.includes('topics')
            ? 'Saving is blocked from removing topics until topics load, so nothing will be deleted by mistake.'
            : 'Items that failed to load will not be changed when you save.')
        );
      }
    } finally {
      setContentLoading(false);
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
    if (contentLoading) {
      showError('Existing content is still loading. Please wait a moment and try again.');
      return;
    }

    try {
      setActionLoading(true);
      const url = editingSubject ? `${API_URL}/admin/content/subjects/${editingSubject.id}` : `${API_URL}/admin/content/subjects`;
      const method = editingSubject ? 'PUT' : 'POST';

      const payload = {
        name: formData.name.trim(), slug: formData.slug,
        language: formData.language || 'en',
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

      // The subject now exists. If the rest fails, a retry must update it, not create a second one.
      if (!editingSubject) setEditingSubject(data.subject || data.data || { id: newId });

      const failures = [];
      const done = new Set();
      const post = async (path, body, label) => {
        const r = await authFetch(`${API_URL}/admin/content/${path}`, { method: 'POST', body: JSON.stringify(body) });
        if (!r.ok) {
          let msg = '';
          try { const j = await r.json(); msg = j.error || j.message || ''; } catch { /* ignore */ }
          failures.push(`${label}${msg ? ` (${msg})` : ''}`);
          return null;
        }
        return r;
      };

      // Topics: remove only the ones the admin deleted, create only the new ones.
      const topicIdMap = {};
      const keptTopicIds = builderTopics.filter((t) => !String(t.id).startsWith('local-')).map((t) => t.id);
      keptTopicIds.forEach((id) => { topicIdMap[id] = id; });

      // SAFETY: only delete topics if the existing topics were actually loaded.
      // Otherwise an empty builder would wipe every topic of this subject.
      if (editingSubject && topicsLoaded) {
        const { data: oldTopics } = await supabase.from('topics').select('id').eq('subject_id', newId);
        const removed = (Array.isArray(oldTopics) ? oldTopics : []).filter((t) => !keptTopicIds.includes(t.id));
        if (removed.length) await supabase.from('topics').delete().in('id', removed.map((t) => t.id));
      }
      for (const t of builderTopics) {
        if (!t.name?.trim() || !String(t.id).startsWith('local-')) continue;
        const r = await post('topics', { subject_id: newId, name: t.name, description: t.description || '', display_order: t.display_order || 0, is_active: true }, `Topic "${t.name}"`);
        if (r) {
          const d = await r.json();
          const tid = d.topic?.id || d.data?.id || d.id;
          if (tid) topicIdMap[t.id] = tid;
        }
      }

      for (const res2 of builderResources) {
        if (res2.saved) continue;
        const okRes = await post('resources', {
          subject_id: newId, topic_id: res2.topicLocalId ? (topicIdMap[res2.topicLocalId] || null) : null,
          subtopic_id: null, name: res2.name, description: res2.description || '',
          type: res2.type, url: res2.url || '',
          youtube_id: res2.youtube_id || '', thumbnail_url: res2.thumbnail_url || '',
          duration: res2.duration || '', difficulty: res2.difficulty || 'beginner',
          content: { problems: [] }, is_free: !!res2.is_free, is_featured: false,
          display_order: res2.display_order || 0, is_active: true,
        }, `Resource "${res2.name}"`);
        if (okRes) done.add(res2);
      }

      // Past papers
      for (const p of builderPapers) {
        if (p.saved || (!p.paper_url && !isDraft)) continue;
        const okP = await post('papers', {
          subject_id: newId, year: Number(p.year) || p.year, session: p.session, paper_number: p.paper,
          is_mock: false, paper_url: p.paper_url || null, memo_url: p.memo_url || null,
        }, `Past paper ${p.year} ${p.session} ${p.paper}`);
        if (okP) done.add(p);
      }

      // Mock exams
      for (const m of builderMocks) {
        if (m.saved || (!m.paper_url && !isDraft)) continue;
        const okM = await post('papers', {
          subject_id: newId, is_mock: true,
          title: String(m.title || '').trim(),
          year: new Date().getFullYear(), paper_number: m.paper || 'P1',
          duration_minutes: Number(m.duration) || 0, total_marks: Number(m.marks) || 0,
          paper_url: m.paper_url || null, memo_url: m.memo_url || null,
        }, `Mock exam "${m.title || 'untitled'}"`);
        if (okM) done.add(m);
      }

      if (failures.length) {
        // Remember what did save, so pressing Save again only retries the failures.
        const mark = (list) => list.map((x) => (done.has(x) ? { ...x, saved: true } : x));
        setBuilderResources((prev) => mark(prev).map((r) => (r.topicLocalId && topicIdMap[r.topicLocalId] ? { ...r, topicLocalId: topicIdMap[r.topicLocalId] } : r)));
        setBuilderPapers((prev) => mark(prev));
        setBuilderMocks((prev) => mark(prev));
        setBuilderTopics((prev) => prev.map((t) => (topicIdMap[t.id] ? { ...t, id: topicIdMap[t.id] } : t)));
        showError(`The subject was saved, but these items were NOT saved:\n\n${failures.map((f) => `• ${f}`).join('\n')}\n\nFix the problem and press ${publishLabel} again. Items already saved will not be duplicated.`);
        return;
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
    const defaultGrade = contentTab === 'tertiary' ? 'tertiary-year-1' : 'grade-8';
    setFormData((prev) => ({ ...prev, grade_key: defaultGrade }));
    setViewMode('builder');
    setActiveSection('basics');
  };
  const openEditModal = async (subject) => {
    setContentTab(isTertiaryKey(subject.grade_key) ? 'tertiary' : 'highschool');
    setEditingSubject(subject);
    setFormData({
      language: subject.language || 'en',
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

    // Clear anything left over from a previously opened subject, so a failed
    // load can never show (or save) another subject's content.
    setBuilderTopics([]); setBuilderResources([]); setBuilderPapers([]); setBuilderMocks([]);
    setTopicsLoaded(false);
    setLoadFailures([]);

    setViewMode('builder');
    setActiveSection('basics');
    await loadExistingContent(subject.id);
  };
  const resetForm = () => {
    setFormData(initialForm());
    setBuilderTopics([]); setBuilderResources([]); setBuilderPapers([]); setBuilderMocks([]);
    setTopicsLoaded(true);   // a brand-new subject has nothing to protect
    setLoadFailures([]);
    setContentLoading(false);
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
    const target = normGrade(grade_key);
    const g = grades.find((x) => normGrade(x.key) === target);

    if (!g) {
      if (target.includes('8')) return <span className="tier-badge" style={{ background: '#10b981' }}>Grade 8</span>;
      if (target.includes('9')) return <span className="tier-badge" style={{ background: '#10b981' }}>Grade 9</span>;
      if (target.includes('10')) return <span className="tier-badge" style={{ background: '#f59e0b' }}>Grade 10</span>;
      if (target.includes('11')) return <span className="tier-badge" style={{ background: '#f59e0b' }}>Grade 11</span>;
      if (target.includes('12')) return <span className="tier-badge" style={{ background: '#ef4444' }}>Grade 12</span>;
      if (target.includes('tertiary')) return <span className="tier-badge" style={{ background: '#4f46e5' }}>Tertiary</span>;
      return <span className="tier-badge" style={{ background: '#6b7280' }}>No Grade</span>;
    }

    let color = '#10b981';
    if (g.tier === '10' || g.tier === '11') color = '#f59e0b';
    if (g.tier === '12') color = '#ef4444';
    if (g.tier === 'tertiary') color = '#4f46e5';
    return <span className="tier-badge" style={{ background: color }}>{g.label}</span>;
  };

  // Feedback popup. Rendered LAST in each view with a high z-index so it is
  // never hidden behind the "Add resource" popup (which hid upload errors).
  const renderFeedback = () => {
    if (!feedback) return null;
    const iconChar = feedback.type === 'success' ? '✅' : feedback.type === 'error' ? '⚠️' : 'ℹ️';

    return (
      <div className="login-prompt-overlay" style={{ zIndex: 10000 }} onClick={closeFeedback}>
        <div className="login-prompt-modal" onClick={(e) => e.stopPropagation()}>
          <button className="login-prompt-close" onClick={closeFeedback}>×</button>
          <div className="login-prompt-icon">{iconChar}</div>
          <h3>{feedback.title}</h3>
          <p style={{ whiteSpace: 'pre-line' }}>{feedback.message}</p>
          <div className="login-prompt-actions">
            <button className="login-prompt-btn" onClick={closeFeedback}>Continue</button>
          </div>
        </div>
      </div>
    );
  };

  if (loading) return <div className="admin-content-loading"><div className="loading-spinner" /><p>Loading content...</p></div>;

  if (viewMode === 'list') {
    const highschoolCount = subjects.filter((s) => !isTertiaryKey(s.grade_key)).length;
    const tertiaryCount = subjects.filter((s) => isTertiaryKey(s.grade_key)).length;

    return (
      <div className="admin-content">
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
          <select className="ac-lang-filter" value={languageFilter} onChange={(e) => setLanguageFilter(e.target.value)} aria-label="Filter by language">
            <option value="all">All languages</option>
            {LANGUAGES.map((l) => <option key={l.code} value={l.code}>{l.label}</option>)}
          </select>
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
                      <span className="tier-badge lang-badge">{getLanguageLabel(subject.language)}</span>
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
          <PromptModal
            open={showDeletePopup}
            icon="🗑️"
            title="Delete this subject?"
            onClose={() => !deleteLoading && setShowDeletePopup(false)}
            buttons={[
              { label: 'Cancel', variant: 'ghost', onClick: () => setShowDeletePopup(false), disabled: deleteLoading },
              { label: deleteLoading ? 'Deleting…' : 'Delete', onClick: confirmDelete, disabled: deleteLoading },
            ]}
          >
            <strong>{deleteTarget.name}</strong> will be removed permanently. This can't be undone.
          </PromptModal>
        )}

        {showTogglePopup && toggleTarget && (
          <PromptModal
            open={showTogglePopup}
            icon={toggleTarget.is_active ? '⚠️' : '✅'}
            title={toggleTarget.is_active ? 'Deactivate this subject?' : 'Activate this subject?'}
            onClose={() => !toggleLoading && setShowTogglePopup(false)}
            buttons={[
              { label: 'Cancel', variant: 'ghost', onClick: () => setShowTogglePopup(false), disabled: toggleLoading },
              { label: toggleLoading ? 'Saving…' : (toggleTarget.is_active ? 'Deactivate' : 'Activate'), onClick: confirmToggle, disabled: toggleLoading },
            ]}
          >
            {toggleTarget.is_active ? "Students won't be able to see it." : 'Students will be able to see it again.'}
          </PromptModal>
        )}

        {renderFeedback()}
      </div>
    );
  }

  const gradeLabel = grades.find((g) => normGrade(g.key) === normGrade(formData.grade_key))?.label;
  const saveDisabled = actionLoading || uploading || contentLoading;

  // Small helper so past papers and mock exams share the same upload buttons.
  const renderUploads = (item, index, setter, qpType, memoType, qpLabel) => (
    <div className="ac-upload-group">
      <label className={`ac-upload-btn ${item.paper_url ? 'uploaded' : ''} ${item.saved ? 'locked' : ''}`}>
        {item.paper_url ? `✅ ${item.paper_name || `${qpLabel} uploaded`}` : (uploading ? '⏳ Uploading…' : `📤 Upload ${qpLabel}`)}
        <input type="file" accept="application/pdf,.pdf" disabled={uploading || item.saved} onChange={(e) => handleFileUpload(e, qpType, index)} hidden />
      </label>
      <label className={`ac-upload-btn ${item.memo_url ? 'uploaded' : ''} ${item.saved ? 'locked' : ''}`}>
        {item.memo_url ? `✅ ${item.memo_name || 'Memo uploaded'}` : (uploading ? '⏳ Uploading…' : '📤 Upload memo')}
        <input type="file" accept="application/pdf,.pdf" disabled={uploading || item.saved} onChange={(e) => handleFileUpload(e, memoType, index)} hidden />
      </label>
      {!item.saved && (item.paper_url || item.memo_url) && (
        <button type="button" className="ac-btn-icon" title="Clear files" onClick={() => clearFiles(setter, index)}>🗑️</button>
      )}
    </div>
  );

  return (
    <div className="ac-builder-page">
      <header className="ac-builder-header">
        <div>
          <div className="ac-breadcrumb">Admin / {contentTab === 'tertiary' ? 'Tertiary' : 'Highschool'} / <span>{editingSubject ? 'Edit subject' : 'Add subject'}</span></div>
          <h1>{editingSubject ? 'Edit subject' : 'Add subject content'} {editingSubject && <span className="ac-status-badge published">Published</span>}</h1>
          <p>Everything here feeds the student Subjects page.</p>
        </div>
        <div className="ac-header-actions">
          <button className="ac-btn-secondary" onClick={() => setViewMode('list')}>Cancel</button>
          <button className="ac-btn-secondary" onClick={() => handleSaveSubject({ draft: true })} disabled={saveDisabled}>Save draft</button>
          <button className="ac-btn-primary" onClick={() => handleSaveSubject()} disabled={saveDisabled}>
            {actionLoading ? 'Saving…' : publishLabel}
          </button>
        </div>
      </header>

      {contentLoading && (
        <div className="ac-banner info">⏳ Loading existing topics, resources and papers…</div>
      )}

      {!contentLoading && loadFailures.length > 0 && editingSubject && (
        <div className="ac-banner warn">
          <span className="ac-banner-text">
            ⚠️ Couldn't load: {loadFailures.join(', ')}. What you see below is incomplete.
            {loadFailures.includes('topics') ? ' Existing topics will not be removed when you save.' : ''}
          </span>
          <button type="button" className="ac-btn-secondary" onClick={() => loadExistingContent(editingSubject.id)}>Retry</button>
        </div>
      )}

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
            else if (sec.id === 'resources') badgeText = builderResources.length;
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
          {/* ---------- 1. BASIC INFO ---------- */}
          {activeSection === 'basics' && (
            <div className="ac-section-panel">
              <h2>Basic info</h2>
              <p className="ac-subtitle">Start with who this is for. Students find subjects by language and grade, then see the name and description on the subject card.</p>

              <div className="ac-form-grid">
                <div className="ac-field">
                  <label>Content language *</label>
                  <select value={formData.language} onChange={(e) => setFormData({ ...formData, language: e.target.value })}>
                    {LANGUAGES.map((l) => <option key={l.code} value={l.code}>{l.label}</option>)}
                  </select>
                  <p className="ac-hint">The language the lessons, papers and memos are written in. The same subject in another language is a separate entry.</p>
                </div>
                <div className="ac-field">
                  <label>Grade *</label>
                  <select value={formData.grade_key} onChange={(e) => setFormData({ ...formData, grade_key: e.target.value })}>
                    <option value="" disabled>Select a grade…</option>
                    {gradeOptions.map((g) => <option key={g.key} value={g.key}>{g.label}</option>)}
                  </select>
                </div>
              </div>

              <div className="ac-form-grid">
                <div className="ac-field">
                  <label>Category *</label>
                  <select value={formData.category_id} onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}>
                    <option value="" disabled>Select a category…</option>
                    {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div className="ac-field">
                  <label>Subject name *</label>
                  <input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="e.g. Physical Sciences" />
                </div>
              </div>

              <div className="ac-field">
                <label>URL slug (automatic)</label>
                <input value={formData.slug} readOnly className="ac-readonly" />
              </div>

              <div className="ac-field">
                <label>Short description</label>
                <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="Shown on the subject card." rows={3} />
              </div>

              <div className="ac-form-grid">
                <div className="ac-field"><label>Icon (emoji)</label><input value={formData.icon} onChange={(e) => setFormData({ ...formData, icon: e.target.value })} placeholder="e.g. ⚗️" maxLength={2} /></div>
                <div className="ac-field">
                  <label>Accent colour</label>
                  <div className="ac-colors">
                    {DEFAULT_COLORS.map((c) => (
                      <button key={c} type="button" className={`ac-color-swatch ${formData.color === c ? 'active' : ''}`} style={{ background: c }} onClick={() => setFormData({ ...formData, color: c })} />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ---------- 2. TOPICS ---------- */}
          {activeSection === 'topics' && (
            <div className="ac-section-panel">
              <h2>Topics</h2>
              <p className="ac-subtitle">The chapters students open from View topics. Add topics first, then attach lesson resources to them in the next step.</p>
              <div className="ac-inline-add">
                <input value={newTopicName} onChange={(e) => setNewTopicName(e.target.value)} placeholder="Topic name" />
                <input value={newTopicDesc} onChange={(e) => setNewTopicDesc(e.target.value)} placeholder="Description (optional)" />
                <button type="button" className="ac-btn-primary" onClick={addTopicToBuilder}>➕ Add</button>
              </div>
              <div className="ac-list">
                {builderTopics.map((t, i) => (
                  <div key={t.id} className="ac-list-row">
                    <span className="ac-row-num">{i + 1}</span>
                    <span className="ac-row-main">{t.name} {t.description && <small style={{ color: '#9a9ab8' }}>— {t.description}</small>}</span>
                    <button type="button" className="ac-btn-icon" onClick={() => removeTopicFromBuilder(t.id)}>✕</button>
                  </div>
                ))}
                {builderTopics.length === 0 && <p className="ac-muted-text">{contentLoading ? 'Loading topics…' : 'No topics yet.'}</p>}
              </div>
            </div>
          )}

          {/* ---------- 3. LESSON RESOURCES ---------- */}
          {activeSection === 'resources' && (
            <div className="ac-section-panel">
              <h2>Lesson resources</h2>
              <p className="ac-subtitle">PDF notes and videos for the lessons. Link each one to a topic so students find it in the right place.</p>
              <div className="ac-list">
                {builderResources.map((r) => {
                  const topicName = builderTopics.find((t) => t.id === r.topicLocalId)?.name;
                  return (
                    <div key={r.id} className="ac-list-row">
                      <span>{getResourceIcon(r.type)}</span>
                      <span className="ac-row-main">{r.name}</span>
                      {topicName && <span className="ac-builder-tag">{topicName}</span>}
                      <span className="ac-builder-tag">{r.type}</span>
                      {r.saved
                        ? <span className="ac-saved-tag">Saved</span>
                        : <button type="button" className="ac-btn-icon" onClick={() => setBuilderResources((prev) => prev.filter((x) => x.id !== r.id))}>✕</button>}
                    </div>
                  );
                })}
                {builderResources.length === 0 && <p className="ac-muted-text">No lesson resources yet.</p>}
              </div>
              <button type="button" className="ac-btn-dashed" onClick={openResourcePopup}>➕ Add resource (PDF / Video)</button>
              {builderResources.some((r) => r.saved) && (
                <p className="ac-hint" style={{ marginTop: 12 }}>Resources marked Saved are already live. Edit or remove them from the subject's Manage page.</p>
              )}
            </div>
          )}

          {/* ---------- 4. PAST PAPERS ---------- */}
          {activeSection === 'papers' && (
            <div className="ac-section-panel">
              <h2>Past papers</h2>
              <p className="ac-subtitle">Official exam papers from earlier years. Upload the question paper and, if you have it, the memo (marking guideline).</p>
              <div className="ac-list">
                {builderPapers.map((p, i) => (
                  <div key={p.id || i} className="ac-list-row ac-paper-row">
                    <div className="ac-row-head">
                      <span className="ac-row-title">{p.year} {p.session === 'Jun' ? 'June' : 'November'} · Paper {String(p.paper).replace('P', '')}</span>
                      {p.saved
                        ? <span className="ac-saved-tag">Saved</span>
                        : <button type="button" className="ac-btn-icon danger" title="Remove" onClick={() => setBuilderPapers(builderPapers.filter((_, idx) => idx !== i))}>✕</button>}
                    </div>
                    <div className="ac-mini-grid three">
                      <div className="ac-mini">
                        <label>Exam year</label>
                        <input type="number" min="1990" max="2100" value={p.year} disabled={p.saved} onChange={(e) => updateArrayItem(setBuilderPapers, i, 'year', e.target.value)} placeholder="e.g. 2024" />
                      </div>
                      <div className="ac-mini">
                        <label>Exam session</label>
                        <select value={p.session} disabled={p.saved} onChange={(e) => updateArrayItem(setBuilderPapers, i, 'session', e.target.value)}>
                          <option value="Nov">November</option>
                          <option value="Jun">June</option>
                        </select>
                      </div>
                      <div className="ac-mini">
                        <label>Paper</label>
                        <select value={p.paper} disabled={p.saved} onChange={(e) => updateArrayItem(setBuilderPapers, i, 'paper', e.target.value)}>
                          <option value="P1">Paper 1</option>
                          <option value="P2">Paper 2</option>
                          <option value="P3">Paper 3</option>
                        </select>
                      </div>
                    </div>
                    {renderUploads(p, i, setBuilderPapers, 'paper_qp', 'paper_memo', 'question paper')}
                  </div>
                ))}
                {builderPapers.length === 0 && <p className="ac-muted-text">No past papers yet.</p>}
              </div>
              <button type="button" className="ac-btn-dashed" onClick={() => setBuilderPapers([...builderPapers, newPaper()])}>➕ Add past paper</button>
            </div>
          )}

          {/* ---------- 5. MOCK EXAMS ---------- */}
          {activeSection === 'mocks' && (
            <div className="ac-section-panel">
              <h2>Mock exams</h2>
              <p className="ac-subtitle">Practice exams written by EduSpantech. Students sit them under exam conditions, so set how long they have and what they are marked out of.</p>
              <div className="ac-list">
                {builderMocks.map((m, i) => (
                  <div key={m.id || i} className="ac-list-row ac-paper-row">
                    <div className="ac-row-head">
                      <span className="ac-row-title">{m.title?.trim() || `Mock exam ${i + 1}`}</span>
                      {m.saved
                        ? <span className="ac-saved-tag">Saved</span>
                        : <button type="button" className="ac-btn-icon danger" title="Remove" onClick={() => setBuilderMocks(builderMocks.filter((_, idx) => idx !== i))}>✕</button>}
                    </div>
                    <div className="ac-mini-grid mock">
                      <div className="ac-mini wide">
                        <label>Mock exam title</label>
                        <input value={m.title} disabled={m.saved} onChange={(e) => updateArrayItem(setBuilderMocks, i, 'title', e.target.value)} placeholder="e.g. Mathematics Mock Exam 1" />
                      </div>
                      <div className="ac-mini">
                        <label>Paper</label>
                        <select value={m.paper} disabled={m.saved} onChange={(e) => updateArrayItem(setBuilderMocks, i, 'paper', e.target.value)}>
                          <option value="P1">Paper 1</option>
                          <option value="P2">Paper 2</option>
                          <option value="P3">Paper 3</option>
                        </select>
                      </div>
                      <div className="ac-mini">
                        <label>Time allowed</label>
                        <div className="ac-unit-input">
                          <input type="number" min="1" value={m.duration} disabled={m.saved} onChange={(e) => updateArrayItem(setBuilderMocks, i, 'duration', e.target.value)} placeholder="e.g. 180" />
                          <span>minutes</span>
                        </div>
                      </div>
                      <div className="ac-mini">
                        <label>Total marks</label>
                        <div className="ac-unit-input">
                          <input type="number" min="1" value={m.marks} disabled={m.saved} onChange={(e) => updateArrayItem(setBuilderMocks, i, 'marks', e.target.value)} placeholder="e.g. 150" />
                          <span>marks</span>
                        </div>
                      </div>
                    </div>
                    {renderUploads(m, i, setBuilderMocks, 'mock_qp', 'mock_memo', 'question paper')}
                  </div>
                ))}
                {builderMocks.length === 0 && <p className="ac-muted-text">No mock exams yet.</p>}
              </div>
              <button type="button" className="ac-btn-dashed" onClick={() => setBuilderMocks([...builderMocks, newMock()])}>➕ Add mock exam</button>
            </div>
          )}

          {/* ---------- 6. ACCESS ---------- */}
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

          {/* ---------- 7. REVIEW ---------- */}
          {activeSection === 'review' && (
            <div className="ac-section-panel">
              <h2>Review and publish</h2>
              <p className="ac-subtitle">A last look at what will go live.</p>
              <div className="ac-review-grid">
                <div className="ac-review-item"><dt>Type</dt><dd>{contentTab === 'tertiary' ? 'Tertiary' : 'Highschool'}</dd></div>
                <div className="ac-review-item"><dt>Language</dt><dd>{getLanguageLabel(formData.language)}</dd></div>
                <div className="ac-review-item"><dt>Subject</dt><dd>{formData.name || 'Untitled'}{gradeLabel ? ` — ${gradeLabel}` : ''}</dd></div>
                <div className="ac-review-item"><dt>Category</dt><dd>{categories.find((c) => c.id === formData.category_id)?.name || '—'}</dd></div>
                <div className="ac-review-item"><dt>Topics</dt><dd>{builderTopics.length}</dd></div>
                <div className="ac-review-item"><dt>Lesson resources</dt><dd>{builderResources.length}</dd></div>
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
            <button type="button" className="ac-btn-secondary" disabled={activeSection === 'basics'} onClick={() => setActiveSection(SECTIONS[SECTIONS.findIndex((s) => s.id === activeSection) - 1].id)}>Back</button>
            {activeSection === 'review' ? (
              <button type="button" className="ac-btn-primary ac-publish-btn" onClick={() => handleSaveSubject()} disabled={saveDisabled}>
                {actionLoading ? 'Saving…' : publishLabel}
              </button>
            ) : (
              <button type="button" className="ac-btn-secondary" onClick={() => setActiveSection(SECTIONS[SECTIONS.findIndex((s) => s.id === activeSection) + 1].id)}>Next</button>
            )}
          </div>
        </main>

        <aside className="ac-preview">
          <div className="ac-preview-header">
            <h3>Live preview</h3>
            <div className="ac-toggle-group">
              <button type="button" className={`ac-toggle-btn ${previewMode === 'open' ? 'active' : ''}`} onClick={() => setPreviewMode('open')}>Plan includes it</button>
              <button type="button" className={`ac-toggle-btn ${previewMode === 'locked' ? 'active' : ''}`} onClick={() => setPreviewMode('locked')}>Locked view</button>
            </div>
          </div>

          <div className="ac-pv-card" style={{ '--c': formData.color || '#a78bfa', opacity: previewMode === 'locked' ? 0.7 : 1 }}>
            <div className="ac-pv-top">
              <span className="ac-pv-icon">{formData.icon || '📚'}</span>
              <span className="ac-pv-tags">
                <span className="ac-pv-grade">{gradeLabel || 'Grade ?'}</span>
                <span className="ac-pv-grade lang">{getLanguageLabel(formData.language)}</span>
              </span>
            </div>
            <h4>{formData.name || 'Subject name'}</h4>
            <p>{formData.description || 'Description…'}</p>
            <dl className="ac-pv-stats">
              <div><dt>Past papers</dt><dd>{builderPapers.length}</dd></div>
              <div><dt>Topics</dt><dd>{builderTopics.length}</dd></div>
              <div><dt>Memos</dt><dd>{builderPapers.filter((p) => p.memo_url).length}</dd></div>
              <div><dt>Mock exams</dt><dd>{builderMocks.length}</dd></div>
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
                <div key={p.id || i} className="ac-hub-item">
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
        <PromptModal
          open={showResourceDraftPopup}
          icon="📚"
          title="Add resource"
          onClose={() => !resourceUploading && setShowResourceDraftPopup(false)}
          buttons={[
            { label: 'Cancel', variant: 'ghost', onClick: () => setShowResourceDraftPopup(false), disabled: resourceUploading },
            { label: 'Add to list', onClick: confirmAddResourceDraft, disabled: resourceUploading },
          ]}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, textAlign: 'left' }}>
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

            {builderTopics.length > 0 && (
              <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.7)' }}>Topic (optional)</span>
                <select
                  value={resourceDraft.topicIndex}
                  onChange={(e) => setResourceDraft({ ...resourceDraft, topicIndex: e.target.value })}
                  style={{ padding: '10px 12px', borderRadius: 10, background: '#0f0f24', border: '1px solid #5b5b8f', color: '#fff' }}
                >
                  <option value="">No topic (general resource)</option>
                  {builderTopics.map((t, idx) => <option key={t.id} value={idx}>{t.name}</option>)}
                </select>
              </label>
            )}

            {resourceDraft.type === 'pdf' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.7)' }}>PDF file *</span>
                <div
                  className={`resource-upload-zone ${resourceDraft.url ? 'has-file' : ''}`}
                  onClick={() => !resourceUploading && resourceFileRef.current?.click()}
                >
                  <input
                    ref={resourceFileRef}
                    type="file"
                    accept="application/pdf,.pdf"
                    onChange={handleResourceFileUpload}
                    disabled={resourceUploading}
                    style={{ display: 'none' }}
                  />
                  {resourceUploading ? <span>⏳ Uploading…</span>
                    : resourceDraft.url ? <span>✅ {resourceFileName || 'PDF'} uploaded — click to replace</span>
                    : <span>📤 Click to upload a PDF (max 50MB)</span>}
                </div>
              </div>
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
        </PromptModal>
      )}

      {renderFeedback()}
    </div>
  );
};

export default AdminContent;
