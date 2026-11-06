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

// Turn ANY of {8, '8', 'grade-8-9', 'grade8-9', 'TIER_1'} into '8-9'
const tierFromValue = (v) => {
  if (v == null || v === '') return null;

  const clean = String(v).trim().toLowerCase();

  // grade key like 'grade8-9' / 'grade-8-9' / 'grade12'
  const normalised = clean.replace(/-/g, '');
  if (GRADE_TIER_MAP[normalised]) return GRADE_TIER_MAP[normalised];
  if (GRADE_TIER_MAP[clean]) return GRADE_TIER_MAP[clean];

  // numeric grade
  const n = parseInt(v, 10);
  if (!isNaN(n)) {
    if (n === 8 || n === 9) return '8-9';
    if (n === 10 || n === 11) return '10-11';
    if (n === 12) return '12';
  }

  // plan tier
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

const getStoredUser = () => {
  try {
    return JSON.parse(localStorage.getItem('user') || 'null');
  } catch {
    return null;
  }
};

const KNOWN_SETTING_KEYS = new Set([
  'hero_eyebrow', 'hero_title', 'hero_title_accent', 'hero_subtext',
  'viewing_prefix',
  'search_placeholder',
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
  'error_message', 'retry_label',
  'jump_to_papers',
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

function normaliseCategories(rawCategories, rawSubjects) {
  const subjects = rawSubjects || [];

  const usedKeys = new Set();
  const usedIds = new Set();
  subjects.forEach((s) => {
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
    .filter((c) => {
      if (hasKeyMatch) return usedKeys.has(c.key);
      return usedIds.has(c.id);
    });
}

function deriveGrades(rawSubjects) {
  const present = new Set(
    (rawSubjects || []).map((s) => s.grade_key).filter(Boolean)
  );

  const real = Array.from(present)
    .filter((key) => GRADE_LABEL_MAP[key])
    .sort((a, b) => GRADE_ORDER.indexOf(a) - GRADE_ORDER.indexOf(b))
    .map((key) => ({
      key,
      label: GRADE_LABEL_MAP[key],
      tier: GRADE_TIER_MAP[key] || null,
    }));

  return [{ key: 'all', label: 'All', is_all: true }, ...real];
}

export function useSubjectsPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [attempt, setAttempt] = useState(0);

  // Re-run when auth state changes (login writes user-updated)
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

    supabase
      .rpc('get_subjects_page')
      .then(({ data: payload, error: err }) => {
        if (cancelled) return;

        if (err) {
          setError(err);
          setData(null);
          setLoading(false);
          return;
        }

        const rawSubjects   = Array.isArray(payload?.subjects)   ? payload.subjects   : [];
        const rawCategories = Array.isArray(payload?.categories) ? payload.categories : [];

        // ---- memberTier: RPC first, then localStorage.user ----
        const storedUser = getStoredUser();
        const memberTier =
          tierFromValue(payload?.memberTier) ||
          resolveTierFromUser(payload?.user) ||
          resolveTierFromUser(storedUser) ||
          null;

        setData({
          settings:      sanitizeSettings(payload?.settings),
          categories:    normaliseCategories(rawCategories, rawSubjects),
          grades:        deriveGrades(rawSubjects),
          subjects:      rawSubjects,
          papers:        Array.isArray(payload?.papers)      ? payload.papers      : [],
          jumpBackIn:    Array.isArray(payload?.jumpBackIn)  ? payload.jumpBackIn  : [],
          access:        payload?.access || {},
          memberTier,
          otherTier:     payload?.otherTier || null,
          otherTierLabel: payload?.otherTierLabel || null,
          otherLevels:   Array.isArray(payload?.otherLevels) ? payload.otherLevels : [],
        });
        setLoading(false);
      });

    return () => { cancelled = true; };
  }, [attempt]);

  const reload = useCallback(() => setAttempt((n) => n + 1), []);

  return { data, loading, error, reload };
}