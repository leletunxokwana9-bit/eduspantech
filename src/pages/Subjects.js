// src/pages/Subjects.js
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useSubjectsPage } from '../hooks/useSubjectsPage';
import './Subjects.css';

const SORT_MODES = ['popular', 'name', 'newest'];

const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const CANONICAL_GRADES = {
  'grade-8-9':   { key: 'grade8-9',   label: 'Grade 8 – 9',   tier: '8-9' },
  'grade-10-11': { key: 'grade10-11', label: 'Grade 10 – 11', tier: '10-11' },
  'grade-12':    { key: 'grade12',    label: 'Grade 12',      tier: '12' },
  'grade8-9':    { key: 'grade8-9',   label: 'Grade 8 – 9',   tier: '8-9' },
  'grade10-11':  { key: 'grade10-11', label: 'Grade 10 – 11', tier: '10-11' },
  'grade12':     { key: 'grade12',    label: 'Grade 12',      tier: '12' },
  'tertiary':    { key: 'tertiary',   label: '1st & 2nd Year Tertiary', tier: 'tertiary' },
};

const TIER_TO_KEY = {
  '8-9': 'grade8-9',
  '10-11': 'grade10-11',
  '12': 'grade12',
  'tertiary': 'tertiary',
};

const canonicalGrade = (raw) => {
  if (!raw) return null;
  const clean = String(raw).trim().toLowerCase();
  return CANONICAL_GRADES[clean] || null;
};

const tierForSubject = (subject) => {
  if (!subject) return null;
  const g = canonicalGrade(subject.grade_key);
  if (g) return g.tier;
  if (typeof subject.grade_key === 'string') {
    const m = subject.grade_key.match(/(\d+)/);
    if (m) {
      const n = parseInt(m[1], 10);
      if (n === 8 || n === 9) return '8-9';
      if (n === 10 || n === 11) return '10-11';
      if (n === 12) return '12';
    }
  }
  return null;
};

const monogram = (name) => {
  if (!name) return '?';
  const cleaned = String(name).replace(/[^A-Za-z0-9 ]/g, '').trim();
  if (!cleaned) return '?';
  const parts = cleaned.split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
};

const formatYearRange = (min, max) => {
  if (!min && !max) return null;
  if (min && max && min !== max) return `${min}–${max}`;
  return String(min || max);
};

const buildSearchIndex = (subject, categories, grades) => {
  const cat = categories.find((c) => c.key === subject.category_key || c.id === subject.category_id);
  const grade = grades.find((g) => g.key === subject.grade_key);
  return [
    subject.name || '',
    subject.description || '',
    subject.long_description || '',
    cat?.name || '',
    grade?.label || '',
    subject.code || '',
    subject.track || '',
    subject.institution || '',
    subject.slug || '',
  ].join(' ').toLowerCase().replace(/[^a-z0-9\s-]/g, ' ').replace(/\s+/g, ' ').trim();
};

const matchesSearch = (subject, query, categories, grades) => {
  if (!query.trim()) return true;
  const hay = buildSearchIndex(subject, categories, grades);
  return query.toLowerCase().split(/\s+/).filter(Boolean).every((t) => hay.includes(t));
};

const EmptyState = ({ title, hint, action, onAction }) => (
  <div className="subjects-empty-block" role="status" aria-live="polite">
    <p className="subjects-empty-title">{title}</p>
    {hint && <p className="subjects-empty-hint">{hint}</p>}
    {action && onAction && (
      <button type="button" className="subjects-retry-btn" onClick={onAction}>
        {action}
      </button>
    )}
  </div>
);

const Subjects = () => {
  const { data, loading, error, reload } = useSubjectsPage();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGrade, setSelectedGrade] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [sortBy, setSortBy] = useState('popular');
  const [viewTier, setViewTier] = useState('own');
  const [otherLevelOpen, setOtherLevelOpen] = useState(false);

  const [papersSubject, setPapersSubject] = useState('all');
  const [papersYear, setPapersYear] = useState('all');
  const [papersSession, setPapersSession] = useState('all');

  const resultsRef = useRef(null);
  const papersRef = useRef(null);
  const headingRef = useRef(null);
  const searchRef = useRef(null);

  const settings = data?.settings || {};
  const text = (key) => (settings && typeof settings[key] === 'string' ? settings[key] : '');
  const grades = data?.grades || [];
  const categories = data?.categories || [];
  const allSubjects = data?.subjects || [];
  const papers = data?.papers || [];
  const jumpBackIn = data?.jumpBackIn || [];
  const access = data?.access || {};

  const categoryByKey = useMemo(() => {
    const map = {};
    categories.forEach((c) => { map[c.key] = c; });
    return map;
  }, [categories]);

  const categoryById = useMemo(() => {
    const map = {};
    categories.forEach((c) => { if (c.id) map[c.id] = c; });
    return map;
  }, [categories]);

  const gradeByKey = useMemo(() => {
    const map = {};
    grades.forEach((g) => { map[g.key] = g; });
    return map;
  }, [grades]);

  const heroSymbols = useMemo(
    () => (categories || [])
      .filter((c) => c.icon || c.name)
      .slice(0, 4)
      .map((c) => ({
        key: c.key,
        icon: c.icon || monogram(c.name),
        color: c.color || '#a78bfa',
      })),
    [categories]
  );

  const memberTier = data?.memberTier || null;
  const memberGrade = data?.memberGrade || null;

  const allowedGrades = useMemo(() => {
    if (!memberTier) return grades;
    return grades.filter((g) => {
      if (g.is_all) return true;
      const gTier = g.tier || canonicalGrade(g.key)?.tier;
      return gTier === memberTier;
    });
  }, [grades, memberTier]);

  const effectiveTier = viewTier === 'own' ? memberTier : (data?.otherTier || null);
  const isCrossLevel = viewTier === 'other' && memberTier && effectiveTier && effectiveTier !== memberTier;
  const crossLevelLocked = isCrossLevel && !access?.crossLevel;

  // Hero's "You're viewing …" — exact numeric grade > selected pill > tier bucket
  const viewingLabel = useMemo(() => {
    if (selectedGrade) {
      const g = gradeByKey[selectedGrade];
      if (g?.label) return g.label;
      const meta = canonicalGrade(selectedGrade);
      if (meta?.label) return meta.label;
    }
    if (memberGrade && memberGrade >= 1 && memberGrade <= 12) {
      return `Grade ${memberGrade}`;
    }
    if (memberTier) {
      const g = grades.find(
        (x) => !x.is_all && (x.tier || canonicalGrade(x.key)?.tier) === memberTier
      );
      if (g?.label) return g.label;
      const meta = canonicalGrade(TIER_TO_KEY[memberTier]);
      if (meta?.label) return meta.label;
    }
    const realGrades = grades.filter((g) => !g.is_all);
    if (realGrades.length === 1) return realGrades[0].label;
    const presentGradeKeys = Array.from(
      new Set(allSubjects.map((s) => s.grade_key).filter(Boolean))
    );
    if (presentGradeKeys.length === 1) {
      const meta = canonicalGrade(presentGradeKeys[0]);
      if (meta?.label) return meta.label;
    }
    return null;
  }, [selectedGrade, gradeByKey, memberGrade, memberTier, grades, allSubjects]);

  const viewingPrefix = text('viewing_prefix') || "You're viewing";

  const subjectCategoryKey = (s) => {
    if (s.category_key) return s.category_key;
    if (s.category_id && categoryById[s.category_id]) return categoryById[s.category_id].key;
    return null;
  };

  const baseFiltered = useMemo(() => {
    return allSubjects.filter((s) => {
      if (effectiveTier) {
        const sTier = tierForSubject(s);
        if (sTier && sTier !== effectiveTier) return false;
      }
      if (selectedGrade && s.grade_key !== selectedGrade) return false;
      if (selectedCategory && subjectCategoryKey(s) !== selectedCategory) return false;
      if (!matchesSearch(s, searchQuery, categories, grades)) return false;
      return true;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allSubjects, selectedGrade, selectedCategory, searchQuery, effectiveTier, categoryById, categories, grades]);

  const countsBeforeCategory = useMemo(() => {
    return allSubjects.filter((s) => {
      if (effectiveTier) {
        const sTier = tierForSubject(s);
        if (sTier && sTier !== effectiveTier) return false;
      }
      if (selectedGrade && s.grade_key !== selectedGrade) return false;
      if (!matchesSearch(s, searchQuery, categories, grades)) return false;
      return true;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allSubjects, selectedGrade, searchQuery, effectiveTier, categories, grades]);

  const categoryCounts = useMemo(() => {
    const counts = {};
    countsBeforeCategory.forEach((s) => {
      const key = subjectCategoryKey(s);
      if (key) counts[key] = (counts[key] || 0) + 1;
    });
    return counts;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [countsBeforeCategory, categoryById]);

  const visibleSubjects = useMemo(() => {
    let list = [...baseFiltered];
    if (sortBy === 'name') list.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    else if (sortBy === 'newest') list.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
    return list;
  }, [baseFiltered, sortBy]);

  const papersInView = useMemo(() => {
    const subjectIds = new Set(visibleSubjects.map((s) => s.id));
    return papers.filter((p) => subjectIds.has(p.subject_id));
  }, [papers, visibleSubjects]);

  const papersYears = useMemo(() => {
    const set = new Set(papersInView.map((p) => p.year).filter(Boolean));
    return Array.from(set).sort((a, b) => b - a);
  }, [papersInView]);

  const papersSessions = useMemo(() => {
    const set = new Set(papersInView.map((p) => p.session).filter(Boolean));
    return Array.from(set);
  }, [papersInView]);

  const filteredPapers = useMemo(() => {
    return papersInView.filter((p) => {
      if (papersSubject !== 'all' && p.subject_id !== papersSubject) return false;
      if (papersYear !== 'all' && String(p.year) !== String(papersYear)) return false;
      if (papersSession !== 'all' && p.session !== papersSession) return false;
      return true;
    });
  }, [papersInView, papersSubject, papersYear, papersSession]);

  const papersBySubject = useMemo(() => {
    const map = {};
    filteredPapers.forEach((p) => { (map[p.subject_id] = map[p.subject_id] || []).push(p); });
    Object.values(map).forEach((arr) => arr.sort((a, b) => (b.year || 0) - (a.year || 0)));
    return map;
  }, [filteredPapers]);

  useEffect(() => {
    if (!selectedGrade) return;
    const stillAllowed = allowedGrades.some((g) => !g.is_all && g.key === selectedGrade);
    if (!stillAllowed) setSelectedGrade(null);
  }, [allowedGrades, selectedGrade]);

  const clearFilters = () => {
    setSelectedGrade(null);
    setSearchQuery('');
    setSelectedCategory(null);
    setPapersSubject('all');
    setPapersYear('all');
    setPapersSession('all');
  };
  const jumpToPapers = () => {
    if (papersRef.current) {
      papersRef.current.scrollIntoView({
        behavior: prefersReducedMotion() ? 'auto' : 'smooth',
        block: 'start',
      });
    }
  };
  const focusSearch = () => searchRef.current?.focus();

  const plural = (n) => {
    const singular = text('subject_singular') || 'subject';
    const pluralWord = text('subject_plural') || 'subjects';
    return `${n} ${n === 1 ? singular : pluralWord}`;
  };

  if (loading) {
    return (
      <div className="subjects-page" aria-busy="true">
        <div className="subjects-skeleton subjects-skeleton-hero" />
        <div className="subjects-page-grid">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="subjects-skeleton subjects-skeleton-card" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="subjects-page">
        <div className="subjects-page-error" role="alert">
          <p>{text('error_message') || (error && error.message) || 'Something went wrong.'}</p>
          <button type="button" className="subjects-retry-btn" onClick={reload}>
            {text('retry_label') || 'Retry'}
          </button>
        </div>
      </div>
    );
  }

  const activeFilterCount =
    (selectedGrade ? 1 : 0) +
    (selectedCategory ? 1 : 0) +
    (searchQuery.trim() ? 1 : 0);
  const hasAnySubjects = allSubjects.length > 0;
  const visibleCategories = categories.filter((cat) => (categoryCounts[cat.key] || 0) > 0);

  return (
    <div className="subjects-page">

      {/* ===== HERO — with "You're viewing <grade>" ===== */}
      <section className="subjects-hero">
        <div className="subjects-hero-content">
          {text('hero_eyebrow') && (
            <span className="subjects-hero-eyebrow">{text('hero_eyebrow')}</span>
          )}
          {viewingLabel && (
            <p className="subjects-viewing-line" role="status" aria-live="polite">
              {viewingPrefix} <strong>{viewingLabel}</strong>
            </p>
          )}
          <h1 className="subjects-hero-title">
            {text('hero_title') || 'Explore our subjects'}
            {text('hero_title_accent') && (
              <>
                <br />
                <span className="subjects-hero-title-accent">{text('hero_title_accent')}</span>
              </>
            )}
          </h1>
          {text('hero_subtext') && <p className="subjects-hero-subtext">{text('hero_subtext')}</p>}
        </div>
        <div className="subjects-hero-illustration" aria-hidden="true">
          {heroSymbols.map((sym, idx) => (
            <span key={sym.key} className={`hero-symbol hero-symbol-${idx + 1}`} style={{ color: sym.color }}>
              {sym.icon}
            </span>
          ))}
          <div className="hero-books">
            <div className="hero-book hero-book-1" />
            <div className="hero-book hero-book-2" />
            <div className="hero-book hero-book-3" />
          </div>
        </div>
      </section>

      {/* ===== SUBJECTS PANEL ===== */}
      <section className="subjects-filter-section" aria-labelledby="subjects-section-title">
        <div className="subjects-section-head">
          <div>
            <h2 id="subjects-section-title" className="subjects-section-title">
              {text('subjects_title') || 'Subjects'}
            </h2>
            <p className="subjects-section-subtitle">
              {hasAnySubjects
                ? `${plural(allSubjects.length)} available — search, filter, or pick a category below.`
                : 'Subjects will appear here once your admin publishes them.'}
            </p>
          </div>
          <div className="subjects-section-head-actions">
            {activeFilterCount > 0 && (
              <button type="button" className="subjects-clear-filters-btn" onClick={clearFilters}>
                Clear {activeFilterCount} filter{activeFilterCount > 1 ? 's' : ''}
              </button>
            )}
            <button type="button" className="subjects-jump-papers" onClick={jumpToPapers}>
              Past papers ↓
            </button>
          </div>
        </div>

        <div className="subjects-filter-search-row">
          <label className="subjects-search subjects-search-lg">
            <svg className="subjects-search-icon" width="20" height="20" viewBox="0 0 24 24"
                 fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" />
            </svg>
            <input
              ref={searchRef}
              type="search"
              placeholder={text('search_placeholder') || 'Search subjects, topics, grades…'}
              aria-label={text('search_placeholder') || 'Search subjects'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                type="button"
                className="subjects-search-clear"
                aria-label="Clear search"
                onClick={() => { setSearchQuery(''); focusSearch(); }}
              >
                ✕
              </button>
            )}
          </label>

          <label className="subjects-sort subjects-sort-inline">
            <span className="subjects-sort-label">{text('sort_label') || 'Sort'}</span>
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
              {SORT_MODES.map((mode) => (
                <option key={mode} value={mode}>{settings[`sort_${mode}`] || mode}</option>
              ))}
            </select>
          </label>
        </div>

        {allowedGrades.length > 1 && (
          <div className="subjects-filter-group" role="group" aria-label="Filter by grade">
            <span className="subjects-filter-label">Grade</span>
            <div className="subjects-filter-pills">
              {allowedGrades.map((g) => {
                const active = g.is_all ? selectedGrade === null : selectedGrade === g.key;
                return (
                  <button
                    key={g.key}
                    type="button"
                    className={`filter-pill ${active ? 'active' : ''}`}
                    aria-pressed={active}
                    onClick={() => setSelectedGrade(g.is_all ? null : g.key)}
                  >
                    {g.label}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {visibleCategories.length > 0 && (
          <div className="subjects-filter-group" role="group" aria-label="Filter by category">
            <span className="subjects-filter-label">Category</span>
            <div className="subjects-filter-pills">
              <button
                type="button"
                className={`filter-pill filter-pill-cat ${selectedCategory === null ? 'active' : ''}`}
                aria-pressed={selectedCategory === null}
                onClick={() => setSelectedCategory(null)}
              >
                All
                <span className="filter-pill-count">{countsBeforeCategory.length}</span>
              </button>
              {visibleCategories.map((cat) => {
                const active = selectedCategory === cat.key;
                const count = categoryCounts[cat.key] || 0;
                return (
                  <button
                    key={cat.key}
                    type="button"
                    className={`filter-pill filter-pill-cat ${active ? 'active' : ''}`}
                    style={{ '--cat-color': cat.color || '#7c3aed' }}
                    aria-pressed={active}
                    onClick={() => setSelectedCategory(active ? null : cat.key)}
                  >
                    <span aria-hidden="true">{cat.icon || monogram(cat.name)}</span>
                    {cat.name}
                    <span className="filter-pill-count">{count}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {hasAnySubjects && (
          <p className="subjects-results-summary" role="status" aria-live="polite">
            {visibleSubjects.length === 0
              ? 'No subjects match your filters.'
              : `Showing ${plural(visibleSubjects.length)}${searchQuery ? ` for “${searchQuery}”` : ''}.`}
          </p>
        )}
      </section>

      {/* ===== RESULTS GRID ===== */}
      <section ref={resultsRef} className="subjects-results" aria-labelledby="subjects-results-title">
        {!hasAnySubjects ? (
          <EmptyState
            title="Subjects will appear here once they're added."
            hint="Your admin hasn't published any subjects for this level yet. Check back soon."
          />
        ) : visibleSubjects.length === 0 ? (
          <EmptyState
            title={text('empty_message') || 'No subjects match your filters yet.'}
            hint="Try clearing the search or picking a different grade."
            action={text('clear_filters_label') || 'Clear filters'}
            onAction={clearFilters}
          />
        ) : (
          <div className="subjects-page-grid" key={`${selectedCategory}-${selectedGrade}-${sortBy}-${viewTier}-${searchQuery}`}>
            {visibleSubjects.map((subject, i) => {
              const cat = categoryByKey[subjectCategoryKey(subject)]
                       || (subject.category_id ? categoryById[subject.category_id] : null);
              const color = subject.color || cat?.color || '#7c3aed';
              const icon = subject.icon || cat?.icon || '';
              const grade = gradeByKey[subject.grade_key];
              const gradeLabel = grade?.label || subject.grade_label || canonicalGrade(subject.grade_key)?.label;
              const stats = subject.stats || {};
              const paperRange = formatYearRange(stats.paperYearMin, stats.paperYearMax);
              const empty = !stats.lessonCount && !stats.paperCount && !stats.mockCount;
              const locked = isCrossLevel && crossLevelLocked;

              return (
                <div
                  key={subject.id}
                  className={`subjects-page-card ${locked ? 'locked' : ''}`}
                  style={{ '--i': Math.min(i, 12), '--subject-color': color }}
                >
                  <div className="subjects-page-card-top">
                    <span className="subjects-page-icon" aria-hidden="true">
                      {icon || monogram(subject.name)}
                    </span>
                    {gradeLabel && <span className="subjects-grade-badge">{gradeLabel}</span>}
                  </div>
                  <h3>{subject.name}</h3>
                  {subject.description && <p>{subject.description}</p>}
                  {!empty ? (
                    <dl className="subjects-page-stats">
                      {typeof stats.topicsCovered === 'number' && (
                        <div><dt>{text('stat_topics') || 'Topics'}</dt><dd>{stats.topicsCovered}{stats.topicsTotal ? ` of ${stats.topicsTotal}` : ''}</dd></div>
                      )}
                      {typeof stats.lessonCount === 'number' && (
                        <div><dt>{text('stat_lessons') || 'Lessons'}</dt><dd>{stats.lessonCount}</dd></div>
                      )}
                      {typeof stats.paperCount === 'number' && (
                        <div><dt>{text('stat_past_papers') || 'Past papers'}</dt><dd>{stats.paperCount}{paperRange && <span className="subjects-page-range"> ({paperRange})</span>}</dd></div>
                      )}
                      {typeof stats.mockCount === 'number' && (
                        <div><dt>{text('stat_mocks') || 'Mocks'}</dt><dd>{stats.mockCount}</dd></div>
                      )}
                    </dl>
                  ) : (
                    <p className="subjects-page-coming-soon">{text('coming_soon_label') || 'Content coming soon'}</p>
                  )}
                  <div className="subjects-page-card-footer">
                    {locked ? (
                      <span className="subjects-page-locked">{text('locked_label') || 'Locked'}</span>
                    ) : (
                      <>
                        <Link to={`/subjects/${subject.slug}`} className="subjects-view-link">
                          {text('view_subject_label') || 'View Subject'} →
                        </Link>
                        <Link to={`/subjects/${subject.slug}/papers`} className="subjects-page-arrow-btn"
                          aria-label={text('view_papers_label') || 'View past papers'}>→</Link>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ===== JUMP BACK IN ===== */}
      <section className="subjects-jumpback" aria-labelledby="subjects-jumpback-title">
        <div className="subjects-section-header">
          <div>
            <h2 id="subjects-jumpback-title">{text('jump_back_in_title') || 'Jump back in'}</h2>
            <p>{text('jump_back_in_subtitle') || 'Resume the lessons and papers you were working on.'}</p>
          </div>
        </div>
        {jumpBackIn.length > 0 ? (
          <div className="subjects-jumpback-row">
            {jumpBackIn.map((item) => (
              <Link key={`${item.kind}-${item.id}`} to={item.href} className="subjects-jumpback-card">
                <span className="subjects-jumpback-kind">
                  {item.kind === 'paper' ? text('kind_paper') || 'Paper'
                    : item.kind === 'mock' ? text('kind_mock') || 'Mock'
                    : text('kind_lesson') || 'Lesson'}
                </span>
                <span className="subjects-jumpback-title">{item.title}</span>
                {item.subtitle && <span className="subjects-jumpback-sub">{item.subtitle}</span>}
              </Link>
            ))}
          </div>
        ) : (
          <EmptyState title="Nothing to resume yet."
            hint="Start a lesson or attempt a paper and it will appear here for quick access." />
        )}
      </section>

      {/* ===== PAST PAPERS ===== */}
      <section ref={papersRef} className="subjects-papers" aria-labelledby="subjects-papers-title">
        <div className="subjects-section-header">
          <div>
            <h2 id="subjects-papers-title">{text('papers_title') || 'Past Papers & Memos'}</h2>
            <p>{text('papers_subtitle') || 'Practise with real exam papers and check against the memos.'}</p>
          </div>
        </div>
        <div className="subjects-papers-filters">
          <label className="subjects-papers-filter">
            <span>{text('papers_filter_subject') || 'Subject'}</span>
            <select value={papersSubject} onChange={(e) => setPapersSubject(e.target.value)}>
              <option value="all">{text('filter_all') || 'All'}</option>
              {visibleSubjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </label>
          <label className="subjects-papers-filter">
            <span>{text('papers_filter_year') || 'Year'}</span>
            <select value={papersYear} onChange={(e) => setPapersYear(e.target.value)}>
              <option value="all">{text('filter_all') || 'All'}</option>
              {papersYears.map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
          </label>
          <label className="subjects-papers-filter">
            <span>{text('papers_filter_session') || 'Session'}</span>
            <select value={papersSession} onChange={(e) => setPapersSession(e.target.value)}>
              <option value="all">{text('filter_all') || 'All'}</option>
              {papersSessions.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </label>
        </div>
        {filteredPapers.length === 0 ? (
          <EmptyState title={text('papers_empty') || 'No papers available for this selection.'}
            hint="Try clearing the filters or picking a different subject."
            action={text('clear_filters_label') || 'Clear filters'}
            onAction={() => { setPapersSubject('all'); setPapersYear('all'); setPapersSession('all'); }} />
        ) : (
          Object.entries(papersBySubject).map(([subjectId, list]) => {
            const subject = visibleSubjects.find((s) => String(s.id) === String(subjectId));
            if (!subject) return null;
            return (
              <div key={subjectId} className="subjects-papers-group">
                <h3 className="subjects-papers-group-title">{subject.name}</h3>
                <ul className="subjects-papers-list">
                  {list.map((p) => {
                    const locked = isCrossLevel && crossLevelLocked;
                    return (
                      <li key={p.id} className={`subjects-paper-row ${locked ? 'locked' : ''}`}>
                        <span className="subjects-paper-meta">
                          <span className="subjects-paper-year">{p.year || ''}</span>
                          <span className="subjects-paper-session">{p.session || ''}</span>
                          <span className="subjects-paper-number">{p.paper_number || ''}</span>
                          {p.is_mock && <span className="subjects-paper-tag">{text('tag_mock') || 'Mock'}</span>}
                        </span>
                        <span className="subjects-paper-links">
                          <a href={locked ? undefined : p.paper_url} className="subjects-paper-link" aria-disabled={locked}>
                            {text('paper_label') || 'Paper'}
                          </a>
                          <span className="subjects-paper-sep" aria-hidden="true">|</span>
                          <a href={locked ? undefined : p.memo_url} className="subjects-paper-link" aria-disabled={locked}>
                            {text('memo_label') || 'Memo'}
                          </a>
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })
        )}
      </section>

      {/* ===== OTHER LEVELS ===== */}
      <section className="subjects-other-levels" aria-labelledby="subjects-other-levels-title">
        <button
          type="button"
          className="subjects-other-levels-toggle"
          aria-expanded={otherLevelOpen}
          onClick={() => setOtherLevelOpen((v) => !v)}
        >
          <h2 id="subjects-other-levels-title">{text('other_levels_title') || 'Explore other levels'}</h2>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
               strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"
               className={otherLevelOpen ? 'rotated' : ''} aria-hidden="true">
            <path d="M6 9l6 6 6-6" />
          </svg>
        </button>
        {otherLevelOpen && (
          (data?.otherLevels?.length > 0) ? (
            <div className="subjects-other-levels-body">
              {data.otherLevels.map((lvl) => (
                <button
                  key={lvl.tier}
                  type="button"
                  className={`subjects-other-level-pill ${lvl.tier === effectiveTier ? 'active' : ''}`}
                  onClick={() => {
                    if (!lvl.enabled && !access?.crossLevel) return;
                    setViewTier('other');
                    setSelectedCategory(null);
                    setSelectedGrade(null);
                  }}
                >
                  {lvl.label}
                  {!lvl.enabled && !access?.crossLevel && (
                    <span className="subjects-other-level-lock" aria-hidden="true">🔒</span>
                  )}
                </button>
              ))}
            </div>
          ) : (
            <EmptyState
              title="More levels coming soon."
              hint="You'll be able to explore other grades and tertiary subjects here as they're added."
            />
          )
        )}
      </section>
    </div>
  );
};

export default Subjects;