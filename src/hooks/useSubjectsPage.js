// src/hooks/useSubjectsPage.js
import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../services/supabaseClient';

const GRADE_LABEL_MAP = {
  'grade8-9':   'Grade 8 – 9',
  'grade10-11': 'Grade 10 – 11',
  'grade12':    'Grade 12',
  'tertiary':   '1st & 2nd Year Tertiary',
};

const GRADE_TIER_MAP = {
  'grade8-9':   '8-9',
  'grade10-11': '10-11',
  'grade12':    '12',
  'tertiary':   'tertiary',
};

const GRADE_ORDER = ['grade8-9', 'grade10-11', 'grade12', 'tertiary'];

const PLAN_TIER_MAP = {
  TIER_1: '8-9',
  TIER_2: '10-11',
  TIER_3: '12',
  TERTIARY: 'tertiary',
};

// Parse any grade key into the levels it covers.
//   'grade-8' -> grades [8]        'grade-8-9' / 'grade8-9' -> grades [8, 9]
//   'tertiary' -> any tertiary year   'tertiary-year-2' -> tertiary year 2
const parseLevel = (raw) => {
  if (raw == null || raw === '') return null;
  const k = String(raw).trim().toLowerCase();
  if (k.includes('tertiary')) {
    const m = k.match(/(\d+)/);
    return { tertiary: true, year: m ? parseInt(m[1], 10) : null, grades: [] };
  }
  const nums = (k.match(/\d+/g) || []).map((n) => parseInt(n, 10)).filter((n) => n >= 1 && n <= 12);
  if (nums.length === 0) return null;
  if (nums.length >= 2 && nums[1] > nums[0]) {
    const range = [];
    for (let n = nums[0]; n <= nums[1]; n++) range.push(n);
    return { tertiary: false, year: null, grades: range };
  }
  return { tertiary: false, year: null, grades: [nums[0]] };
};

const levelsOverlap = (a, b) => {
  if (!a || !b) return false;
  if (a.tertiary !== b.tertiary) return false;
  if (a.tertiary) return a.year === null || b.year === null || a.year === b.year;
  return a.grades.some((g) => b.grades.includes(g));
};

const tierOfLevel = (level) => {
  if (!level) return null;
  if (level.tertiary) return 'tertiary';
  const g = level.grades[0];
  if (g === 8 || g === 9) return '8-9';
  if (g === 10 || g === 11) return '10-11';
  if (g === 12) return '12';
  return null;
};

const TIER_TO_KEY = { '8-9': 'grade8-9', '10-11': 'grade10-11', '12': 'grade12', tertiary: 'tertiary' };
const levelFromTier = (tier) => (tier ? parseLevel(TIER_TO_KEY[tier]) : null);

// The learner's exact grade (8, 9 … 12) or tertiary year, if their profile says so.
const levelFromUser = (user) => {
  if (!user) return null;
  const n = parseInt(user.grade, 10);
  if (!isNaN(n) && n >= 1 && n <= 12) return { tertiary: false, year: null, grades: [n] };
  const candidates = [user.grade, user.grade_key, user.gradeKey];
  for (let i = 0; i < candidates.length; i++) {
    const l = parseLevel(candidates[i]);
    if (l && (l.tertiary || l.grades.length === 1)) return l;
  }
  return null;
};

const tierFromValue = (v) => {
  if (v == null || v === '') return null;
  const clean = String(v).trim().toLowerCase();
  if (clean.includes('tertiary')) return 'tertiary';
  const normalised = clean.replace(/-/g, '');
  if (GRADE_TIER_MAP[normalised]) return GRADE_TIER_MAP[normalised];
  if (GRADE_TIER_MAP[clean]) return GRADE_TIER_MAP[clean];
  const n = parseInt(v, 10);
  if (!isNaN(n)) {
    if (n === 8 || n === 9) return '8-9';
    if (n === 10 || n === 11) return '10-11';
    if (n === 12) return '12';
  }
  const upper = String(v).trim().toUpperCase();
  if (PLAN_TIER_MAP[upper]) return PLAN_TIER_MAP[upper];
  return null;
};

const resolveTierFromUser = (user) => {
  if (!user) return null;
  return (
    tierFromValue(user.grade) ||
    tierFromValue(user.grade_key) ||
    tierFromValue(user.gradeKey) ||
    tierFromValue(user.tier) ||
    null
  );
};

const gradeFromUser = (user) => {
  const l = levelFromUser(user);
  return l && !l.tertiary && l.grades.length === 1 ? l.grades[0] : null;
};

const getStoredUser = () => {
  try {
    return JSON.parse(localStorage.getItem('user') || 'null');
  } catch {
    return null;
  }
};

const isAuthenticated = () => {
  try {
    return !!(
      localStorage.getItem('accessToken') ||
      localStorage.getItem('token') ||
      localStorage.getItem('authToken')
    );
  } catch {
    return false;
  }
};

const KNOWN_SETTING_KEYS = new Set([
  'hero_eyebrow', 'hero_title', 'hero_title_accent', 'hero_subtext',
  'viewing_prefix', 'search_placeholder',
  'subject_singular', 'subject_plural',
  'categories_title', 'categories_subtitle',
  'view_all_label', 'viewing_label',
  'all_subjects_title', 'all_grades_label',
  'jump_back_in_title', 'jump_back_in_subtitle',
  'kind_lesson', 'kind_paper', 'kind_mock',
  'sort_label', 'sort_popular', 'sort_name', 'sort_newest',
  'back_to_categories', 'empty_message', 'clear_filters_label',
  'coming_soon_label', 'locked_label',
  'view_subject_label', 'view_papers_label',
  'stat_topics', 'stat_lessons', 'stat_past_papers', 'stat_mocks',
  'papers_title', 'papers_subtitle',
  'papers_filter_subject', 'papers_filter_year', 'papers_filter_session',
  'filter_all', 'papers_empty', 'paper_label', 'memo_label', 'tag_mock',
  'level_switcher_label', 'your_level_label', 'other_level_label',
  'cross_level_locked', 'cross_level_unlocked', 'back_to_your_level',
  'other_levels_title', 'slogan',
  'error_message', 'retry_label', 'jump_to_papers',
]);

function sanitizeSettings(raw) {
  const out = {};
  if (!raw || typeof raw !== 'object') return out;
  Object.keys(raw).forEach((k) => {
    const v = raw[k];
    if (typeof v !== 'string') return;
    if (!KNOWN_SETTING_KEYS.has(k)) return;
    out[k] = v;
  });
  return out;
}

function normaliseCategories(rawCategories, scopedSubjects) {
  const usedKeys = new Set();
  const usedIds = new Set();
  (scopedSubjects || []).forEach((s) => {
    if (s.category_key) usedKeys.add(s.category_key);
    if (s.category_id) usedIds.add(s.category_id);
  });
  const hasKeyMatch = usedKeys.size > 0;
  return (rawCategories || [])
    .map((c) => ({
      id: c.id,
      key: c.key || c.slug || c.id,
      name: c.name || 'Untitled',
      icon: c.icon || '',
      color: c.color || '#7c3aed',
    }))
    .filter((c) => (hasKeyMatch ? usedKeys.has(c.key) : usedIds.has(c.id)));
}

function deriveGrades(scopedSubjects, memberGrade, loggedIn) {
  const present = new Set(
    (scopedSubjects || []).map((s) => s.grade_key).filter(Boolean)
  );
  
  // For logged out, always show all grade options
  const keysToShow = loggedIn
    ? Array.from(present).filter((key) => GRADE_LABEL_MAP[key])
    : GRADE_ORDER.filter((key) => GRADE_LABEL_MAP[key]);

  const real = keysToShow
    .sort((a, b) => GRADE_ORDER.indexOf(a) - GRADE_ORDER.indexOf(b))
    .map((key) => {
      const tier = GRADE_TIER_MAP[key] || null;
      let label = GRADE_LABEL_MAP[key];
      if (loggedIn && memberGrade && tier) {
        const inTier =
          (tier === '8-9'   && (memberGrade === 8  || memberGrade === 9))  ||
          (tier === '10-11' && (memberGrade === 10 || memberGrade === 11)) ||
          (tier === '12'    && memberGrade === 12);
        if (inTier) label = `Grade ${memberGrade}`;
      }
      return { key, label, tier };
    });
  return [{ key: 'all', label: 'All', is_all: true }, ...real];
}

async function fetchLiveStats(ids) {
  const out = {};
  if (!ids || ids.length === 0) return out;
  const bucket = (id) => (out[id] = out[id] || { lessonCount: 0, paperCount: 0, mockCount: 0, topicsCovered: 0, years: [] });
  const safe = async (fn, label) => {
    try {
      const r = await fn();
      if (r?.error) { console.warn('[subjects] could not read', label, '->', r.error.message || r.error); return []; }
      return r?.data || [];
    } catch (e) { console.warn('[subjects] could not read', label, e); return []; }
  };

  const [resources, papers, topics] = await Promise.all([
    safe(() => supabase.from('resources').select('subject_id,is_active').in('subject_id', ids), 'resources'),
    safe(() => supabase.from('papers').select('subject_id,is_mock,year,is_active').in('subject_id', ids), 'papers'),
    safe(() => supabase.from('topics').select('id,subject_id,is_active').in('subject_id', ids), 'topics'),
  ]);

  console.info('[subjects] live rows', { resources: resources.length, papers: papers.length, topics: topics.length });
  resources.forEach((r) => { if (r.is_active !== false) bucket(r.subject_id).lessonCount += 1; });
  papers.forEach((p) => {
    if (p.is_active === false) return;
    const b = bucket(p.subject_id);
    if (p.is_mock) b.mockCount += 1;
    else { b.paperCount += 1; if (p.year) b.years.push(Number(p.year)); }
  });
  topics.forEach((t) => { if (t.is_active !== false) bucket(t.subject_id).topicsCovered += 1; });
  return out;
}

// Use the larger of the RPC number and the live number.
function mergeStats(subject, live) {
  if (!live) return subject;
  const base = subject.stats || {};
  const years = live.years.filter((y) => !isNaN(y));
  return {
    ...subject,
    stats: {
      ...base,
      lessonCount: Math.max(base.lessonCount || 0, live.lessonCount),
      paperCount:  Math.max(base.paperCount  || 0, live.paperCount),
      mockCount:   Math.max(base.mockCount   || 0, live.mockCount),
      topicsCovered: Math.max(base.topicsCovered || 0, live.topicsCovered),
      paperYearMin: base.paperYearMin || (years.length ? Math.min(...years) : undefined),
      paperYearMax: base.paperYearMax || (years.length ? Math.max(...years) : undefined),
    },
  };
}

export function useSubjectsPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const onAuth = () => setAttempt((n) => n + 1);
    window.addEventListener('user-updated', onAuth);
    window.addEventListener('auth-updated', onAuth);
    return () => {
      window.removeEventListener('user-updated', onAuth);
      window.removeEventListener('auth-updated', onAuth);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    supabase.rpc('get_subjects_page').then(async ({ data: payload, error: err }) => {
      if (cancelled) return;
      if (err) {
        setError(err);
        setData(null);
        setLoading(false);
        return;
      }

      const rawSubjects   = Array.isArray(payload?.subjects)   ? payload.subjects   : [];
      const rawCategories = Array.isArray(payload?.categories) ? payload.categories : [];
      const rawPapers     = Array.isArray(payload?.papers)     ? payload.papers     : [];

      const storedUser = getStoredUser();
      const loggedIn = isAuthenticated();

      const exactLevel = loggedIn
        ? (levelFromUser(payload?.user) || levelFromUser(storedUser))
        : null;

      const memberTier = loggedIn
        ? (
            tierFromValue(payload?.memberTier) ||
            resolveTierFromUser(payload?.user) ||
            resolveTierFromUser(storedUser) ||
            tierOfLevel(exactLevel) ||
            null
          )
        : null;

      // Exact grade / tertiary year when known, otherwise the tier's grades.
      const memberLevel = loggedIn ? (exactLevel || levelFromTier(memberTier)) : null;

      const memberGrade = memberLevel && !memberLevel.tertiary && memberLevel.grades.length === 1
        ? memberLevel.grades[0]
        : null;

      // Logged-in: ONLY the learner's own grade / tertiary year. Logged-out: all subjects.
      const scopedSubjects = (loggedIn && memberLevel)
        ? rawSubjects.filter((s) => levelsOverlap(parseLevel(s.grade_key), memberLevel))
        : rawSubjects;

      // Live content counts straight from the tables, so a card never says
      // "Content coming soon" when lessons/papers/mocks actually exist.
      const liveStats = await fetchLiveStats(scopedSubjects.map((s) => s.id));
      if (cancelled) return;
      const subjectsWithStats = scopedSubjects.map((s) => mergeStats(s, liveStats[s.id]));

      const scopedCategories = normaliseCategories(rawCategories, scopedSubjects);
      const scopedGrades = deriveGrades(scopedSubjects, memberGrade, loggedIn);

      setData({
        settings:      sanitizeSettings(payload?.settings),
        categories:    scopedCategories,
        grades:        scopedGrades,
        subjects:      subjectsWithStats,
        papers:        rawPapers,
        jumpBackIn:    Array.isArray(payload?.jumpBackIn) ? payload.jumpBackIn : [],
        access:        payload?.access || {},
        memberTier,
        memberGrade,
        memberLevel,
        loggedIn,
        otherTier:      null,
        otherTierLabel: null,
        otherLevels:    [],
      });
      setLoading(false);
    });

    return () => { cancelled = true; };
  }, [attempt]);

  const reload = useCallback(() => setAttempt((n) => n + 1), []);

  return { data, loading, error, reload };
}
