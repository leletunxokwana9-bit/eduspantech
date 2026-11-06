// src/hooks/useHomeData.js
import { useState, useEffect } from 'react';
import { homeService } from '../services/homeService';

const API_URL =
  process.env.REACT_APP_API_URL ||
  'https://eduspantech-backend.onrender.com/api';

const CANONICAL_GRADES = {
  'grade-8-9':   { key: 'grade8-9',   label: 'Grade 8 – 9',   tier: '8-9' },
  'grade-10-11': { key: 'grade10-11', label: 'Grade 10 – 11', tier: '10-11' },
  'grade-12':    { key: 'grade12',    label: 'Grade 12',      tier: '12' },
  'grade8-9':    { key: 'grade8-9',   label: 'Grade 8 – 9',   tier: '8-9' },
  'grade10-11':  { key: 'grade10-11', label: 'Grade 10 – 11', tier: '10-11' },
  'grade12':     { key: 'grade12',    label: 'Grade 12',      tier: '12' },
  'tertiary':    { key: 'tertiary',   label: '1st & 2nd Year Tertiary', tier: 'tertiary' },
};

const GRADE_ORDER = ['grade8-9', 'grade10-11', 'grade12', 'tertiary'];

const canonicalGrade = (raw) => {
  if (!raw) return null;
  const clean = String(raw).trim().toLowerCase();
  return CANONICAL_GRADES[clean] || null;
};

// numeric grade ("8", 8, "12") → tier key ('8-9', '12')
const numericGradeToTier = (rawGrade) => {
  if (rawGrade == null || rawGrade === '') return null;
  const n = parseInt(rawGrade, 10);
  if (isNaN(n)) return null;
  if (n === 8 || n === 9) return '8-9';
  if (n === 10 || n === 11) return '10-11';
  if (n === 12) return '12';
  return null;
};

const getDefaultIcon = (name) => {
  if (!name) return '📚';
  const icons = {
    Mathematics: '🔢', Math: '🔢', Physics: '⚛️', Chemistry: '🧪',
    Biology: '🧬', 'Life Sci': '🧬', Accounting: '📊', Economics: '📈',
    Business: '💼', Statistics: '📉', ECP: '📘',
  };
  for (const [k, v] of Object.entries(icons)) {
    if (name.toLowerCase().includes(k.toLowerCase())) return v;
  }
  return '📚';
};

const getDefaultColor = (name) => {
  if (!name) return '#4f46e5';
  const colors = {
    Mathematics: '#4f46e5', Math: '#4f46e5', Physics: '#06b6d4',
    Chemistry: '#10b981', Biology: '#22c55e', 'Life Sci': '#22c55e',
    Accounting: '#f59e0b', Economics: '#8b5cf6', Business: '#ec4899',
    Statistics: '#14b8a6', ECP: '#f97316',
  };
  for (const [k, v] of Object.entries(colors)) {
    if (name.toLowerCase().includes(k.toLowerCase())) return v;
  }
  return '#4f46e5';
};

const normaliseSubject = (subject) => {
  if (!subject || typeof subject !== 'object') return null;
  const name = subject.name || subject.title || 'Untitled';
  const grade = canonicalGrade(subject.grade_key);

  return {
    ...subject,
    id: subject.id,
    slug: subject.slug || subject.code || subject.id,
    name,
    description: subject.description || subject.long_description || subject.code || 'No description',
    icon: subject.icon || getDefaultIcon(name),
    color: subject.color || getDefaultColor(name),
    grade_key: grade?.key || subject.grade_key || null,
    grade_label: grade?.label || null,
    tier: grade?.tier || subject.tier || subject.year_level || null,
    category_id: subject.category_id || null,
    category_key: subject.category_key || null,
    display_order: subject.display_order ?? 0,
    is_active: subject.is_active !== undefined ? subject.is_active : true,
    stats: subject.stats || {
      lessonCount: subject.lesson_count ?? null,
      paperCount: subject.paper_count ?? null,
      mockCount: subject.mock_count ?? null,
      topicsCovered: subject.topics_covered ?? null,
      topicsTotal: subject.topics_total ?? null,
      paperYearMin: subject.paper_year_min ?? null,
      paperYearMax: subject.paper_year_max ?? null,
    },
    topics: Array.isArray(subject.topics) ? subject.topics : [],
  };
};

const fetchCategories = async () => {
  try {
    const res = await fetch(`${API_URL}/content/categories`);
    if (!res.ok) return [];
    const json = await res.json();
    if (Array.isArray(json?.categories)) return json.categories;
    if (Array.isArray(json)) return json;
    return [];
  } catch {
    return [];
  }
};

const fetchMe = async () => {
  try {
    const token =
      localStorage.getItem('accessToken') ||
      localStorage.getItem('token') ||
      localStorage.getItem('authToken');
    if (!token) return null;
    const res = await fetch(`${API_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
};

// ---- Resolve member tier from /auth/me OR localStorage.user ----
const resolveMemberTier = (me, homeResult) => {
  // 1. /auth/me response
  const candidates = [
    me?.user?.grade_key,
    me?.user?.tier,
    me?.user?.grade,
    me?.memberTier,
    homeResult?.memberTier,
  ];
  for (const c of candidates) {
    if (!c) continue;
    const canon = canonicalGrade(c);
    if (canon) return canon.tier;
    const numeric = numericGradeToTier(c);
    if (numeric) return numeric;
  }

  // 2. localStorage.user — Profile.js saves grade here after edits
  try {
    const stored = JSON.parse(localStorage.getItem('user') || 'null');
    if (stored) {
      const storedCandidates = [stored.grade_key, stored.tier, stored.grade];
      for (const c of storedCandidates) {
        if (!c) continue;
        const canon = canonicalGrade(c);
        if (canon) return canon.tier;
        const numeric = numericGradeToTier(c);
        if (numeric) return numeric;
      }
    }
  } catch { /* ignore */ }

  return null;
};

export const useHomeData = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      try {
        setLoading(true);

        const [homeResult, rawCategories, me] = await Promise.all([
          homeService.getHomeData().catch(() => null),
          fetchCategories(),
          fetchMe(),
        ]);

        if (cancelled) return;

        let subjectsArray = [];
        if (homeResult?.subjects) {
          if (Array.isArray(homeResult.subjects)) subjectsArray = homeResult.subjects;
          else if (Array.isArray(homeResult.subjects.items)) subjectsArray = homeResult.subjects.items;
        }
        const mappedSubjects = subjectsArray.map(normaliseSubject).filter(Boolean);

        let categoriesArray = [];
        if (rawCategories.length > 0) categoriesArray = rawCategories;
        else if (Array.isArray(homeResult?.categories)) categoriesArray = homeResult.categories;

        const mappedCategories = categoriesArray.map((c) => ({
          id: c.id,
          key: c.key || c.slug || c.id,
          name: c.name || 'Untitled',
          icon: c.icon || getDefaultIcon(c.name),
          color: c.color || getDefaultColor(c.name),
          display_order: c.display_order ?? 0,
        }));

        const usedCategoryIds = new Set(mappedSubjects.map((s) => s.category_id).filter(Boolean));
        const usedCategoryKeys = new Set(mappedSubjects.map((s) => s.category_key).filter(Boolean));
        const hasKeyMatch = usedCategoryKeys.size > 0;

        const filteredCategories = mappedCategories.filter((c) => {
          if (hasKeyMatch) return usedCategoryKeys.has(c.key);
          return usedCategoryIds.has(c.id);
        });

        const presentGradeKeys = Array.from(
          new Set(mappedSubjects.map((s) => s.grade_key).filter(Boolean))
        ).sort((a, b) => GRADE_ORDER.indexOf(a) - GRADE_ORDER.indexOf(b));

        const grades = [
          { key: 'all', label: 'All', is_all: true },
          ...presentGradeKeys.map((k) => {
            const meta = Object.values(CANONICAL_GRADES).find((g) => g.key === k);
            return { key: k, label: meta?.label || k, tier: meta?.tier || null };
          }),
        ];

        const memberTier = resolveMemberTier(me, homeResult);

        setData({
          subjects: mappedSubjects,
          categories: filteredCategories,
          grades,
          memberTier,
          settings: { viewing_prefix: "You're viewing" },
          papers: [],
          jumpBackIn: [],
          access: {},
          otherTier: null,
          otherTierLabel: null,
          otherLevels: [],
        });
        setError(null);
      } catch (err) {
        if (cancelled) return;
        setError(err.message || 'Failed to load data');
        console.error('Failed to fetch home data:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    run();
    return () => { cancelled = true; };
  }, []);

  return { data, loading, error };
};