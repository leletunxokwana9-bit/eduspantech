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
  'grade-8-9': { key: 'grade8-9', label: 'Grade 8 – 9', tier: '8-9' },
  'grade-10-11': { key: 'grade10-11', label: 'Grade 10 – 11', tier: '10-11' },
  'grade-12': { key: 'grade12', label: 'Grade 12', tier: '12' },
  'grade8-9': { key: 'grade8-9', label: 'Grade 8 – 9', tier: '8-9' },
  'grade10-11': { key: 'grade10-11', label: 'Grade 10 – 11', tier: '10-11' },
  'grade12': { key: 'grade12', label: 'Grade 12', tier: '12' },
  tertiary: { key: 'tertiary', label: 'Tertiary (Years 1 – 2)', tier: 'tertiary' },
};

const TIER_TO_KEY = {
  '8-9': 'grade8-9',
  '10-11': 'grade10-11',
  '12': 'grade12',
  tertiary: 'tertiary',
};

const canonicalGrade = (raw) => {
  if (!raw) return null;
  const clean = String(raw).trim().toLowerCase();
  return CANONICAL_GRADES[clean] || null;
};

const parseLevel = (raw) => {
  if (!raw) return null;
  const k = String(raw).trim().toLowerCase();

  if (k.includes('tertiary')) {
    const m = k.match(/(\d+)/);
    return { tertiary: true, year: m ? parseInt(m[1], 10) : null, grades: [] };
  }

  const nums = (k.match(/\d+/g) || [])
    .map((n) => parseInt(n, 10))
    .filter((n) => n >= 1 && n <= 12);

  if (nums.length === 0) return null;

  if (nums.length >= 2 && nums[1] > nums[0]) {
    const range = [];
    for (let n = nums[0]; n <= nums[1]; n++) range.push(n);
    return { tertiary: false, year: null, grades: range };
  }

  return { tertiary: false, year: null, grades: [nums[0]] };
};

// A subject with no readable grade is kept (shown everywhere), as before.
const levelsOverlap = (a, b) => {
  if (!a || !b) return true;
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

const levelLabel = (raw) => {
  const l = parseLevel(raw);
  if (!l) return null;

  if (l.tertiary) return l.year ? `Tertiary – Year ${l.year}` : 'Tertiary';
  if (l.grades.length === 1) return `Grade ${l.grades[0]}`;

  return `Grade ${l.grades[0]} – ${l.grades[l.grades.length - 1]}`;
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
  const cat = categories.find(
    (c) => c.key === subject.category_key || c.id === subject.category_id
  );
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
  ]
    .join(' ')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
};

const matchesSearch = (subject, query, categories, grades) => {
  if (!query.trim()) return true;

  const hay = buildSearchIndex(subject, categories, grades);

  return query
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .every((t) => hay.includes(t));
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
  const [otherLevelOpen, setOtherLevelOpen] = useState(false);

  // Category list expansion: collapsed state displays a maximum of three rows.
  const [categoriesExpanded, setCategoriesExpanded] = useState(false);

  const [papersSubject, setPapersSubject] = useState('all');
  const [papersYear, setPapersYear] = useState('all');
  const [papersSession, setPapersSession] = useState('all');

  const resultsRef = useRef(null);
  const papersRef = useRef(null);
  const headingRef = useRef(null);
  const searchRef = useRef(null);

  const settings = data?.settings || {};
  const text = (key) =>
    settings && typeof settings[key] === 'string' ? settings[key] : '';

  const grades = data?.grades || [];
  const categories = data?.categories || [];
  const allSubjects = data?.subjects || [];
  const papers = data?.papers || [];
  const jumpBackIn = data?.jumpBackIn || [];
  const access = data?.access || {};
  const loggedIn = !!data?.loggedIn;

  const displayGrades = grades;

  const categoryByKey = useMemo(() => {
    const map = {};
    categories.forEach((c) => {
      map[c.key] = c;
    });
    return map;
  }, [categories]);

  const categoryById = useMemo(() => {
    const map = {};
    categories.forEach((c) => {
      if (c.id) map[c.id] = c;
    });
    return map;
  }, [categories]);

  const gradeByKey = useMemo(() => {
    const map = {};
    displayGrades.forEach((g) => {
      map[g.key] = g;
    });
    return map;
  }, [displayGrades]);

  const heroSymbols = useMemo(
    () =>
      (categories || [])
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
  const memberLevel = data?.memberLevel || null;

  const allowedGrades = displayGrades;

  // Logged-in learners only ever see their own grade / tertiary year.
  // Only guests (choosing a level) or accounts with cross-level access can switch.
  const canSwitchLevel = !loggedIn || !!access?.crossLevel;

  const activeLevel = useMemo(() => {
    if (selectedGrade && canSwitchLevel) return parseLevel(selectedGrade);
    if (!loggedIn) return null;
    if (memberLevel) return memberLevel;

    if (memberGrade && memberGrade >= 1 && memberGrade <= 12) {
      return { tertiary: false, year: null, grades: [memberGrade] };
    }

    return memberTier ? parseLevel(TIER_TO_KEY[memberTier]) : null;
  }, [selectedGrade, canSwitchLevel, loggedIn, memberLevel, memberGrade, memberTier]);

  const effectiveTier = tierOfLevel(activeLevel);

  const viewingLabel = useMemo(() => {
    if (!loggedIn) return null;

    if (selectedGrade) {
      const g = gradeByKey[selectedGrade];
      if (g?.label) return g.label;

      const meta = canonicalGrade(selectedGrade);
      if (meta?.label) return meta.label;

      const lbl = levelLabel(selectedGrade);
      if (lbl) return lbl;
    }

    if (memberGrade && memberGrade >= 1 && memberGrade <= 12) {
      return `Grade ${memberGrade}`;
    }

    if (memberLevel?.tertiary) {
      return memberLevel.year
        ? `Tertiary – Year ${memberLevel.year}`
        : 'Tertiary';
    }

    if (memberTier) {
      const g = grades.find(
        (x) => !x.is_all && (x.tier || canonicalGrade(x.key)?.tier) === memberTier
      );

      if (g?.label) return g.label;

      const meta = canonicalGrade(TIER_TO_KEY[memberTier]);
      if (meta?.label) return meta.label;
    }

    return null;
  }, [loggedIn, selectedGrade, gradeByKey, memberGrade, memberLevel, memberTier, grades]);

  const viewingPrefix = text('viewing_prefix') || "You're viewing";

  const subjectCategoryKey = (s) => {
    if (s.category_key) return s.category_key;

    if (s.category_id && categoryById[s.category_id]) {
      return categoryById[s.category_id].key;
    }

    return null;
  };

  const baseFiltered = useMemo(() => {
    return allSubjects.filter((s) => {
      if (activeLevel && !levelsOverlap(parseLevel(s.grade_key), activeLevel)) {
        return false;
      }

      if (selectedCategory && subjectCategoryKey(s) !== selectedCategory) {
        return false;
      }

      if (!matchesSearch(s, searchQuery, categories, displayGrades)) {
        return false;
      }

      return true;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    allSubjects,
    selectedCategory,
    searchQuery,
    activeLevel,
    categoryById,
    categories,
    displayGrades,
  ]);

  const countsBeforeCategory = useMemo(() => {
    return allSubjects.filter((s) => {
      if (activeLevel && !levelsOverlap(parseLevel(s.grade_key), activeLevel)) {
        return false;
      }

      if (!matchesSearch(s, searchQuery, categories, displayGrades)) {
        return false;
      }

      return true;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allSubjects, searchQuery, activeLevel, categories, displayGrades]);

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
    const list = [...baseFiltered];

    if (sortBy === 'name') {
      list.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    } else if (sortBy === 'newest') {
      list.sort(
        (a, b) =>
          new Date(b.created_at || 0) - new Date(a.created_at || 0)
      );
    }

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
      if (papersYear !== 'all' && String(p.year) !== String(papersYear)) {
        return false;
      }
      if (papersSession !== 'all' && p.session !== papersSession) return false;
      return true;
    });
  }, [papersInView, papersSubject, papersYear, papersSession]);

  const papersBySubject = useMemo(() => {
    const map = {};

    filteredPapers.forEach((p) => {
      (map[p.subject_id] = map[p.subject_id] || []).push(p);
    });

    Object.values(map).forEach((arr) =>
      arr.sort((a, b) => (b.year || 0) - (a.year || 0))
    );

    return map;
  }, [filteredPapers]);

  const clearFilters = () => {
    setSelectedGrade(null);
    setSearchQuery('');
    setSelectedCategory(null);
    setPapersSubject('all');
    setPapersYear('all');
    setPapersSession('all');
    setCategoriesExpanded(false);
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

  // Collapse the category list when the active grade or search changes.
  useEffect(() => {
    setCategoriesExpanded(false);
  }, [searchQuery, selectedGrade]);

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
          <p>
            {text('error_message') ||
              (error && error.message) ||
              'Something went wrong.'}
          </p>

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

  const visibleCategories = categories.filter(
    (cat) => (categoryCounts[cat.key] || 0) > 0
  );

  const gradeSectionTitle = loggedIn
    ? viewingLabel
      ? `Grade: ${viewingLabel}`
      : 'Grade'
    : 'Choose your level';

  return (
    <div className="subjects-page">
      <section className="subjects-hero">
        <div className="subjects-hero-content">
          {text('hero_eyebrow') && (
            <span className="subjects-hero-eyebrow">
              {text('hero_eyebrow')}
            </span>
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
                <span className="subjects-hero-title-accent">
                  {text('hero_title_accent')}
                </span>
              </>
            )}
          </h1>

          {text('hero_subtext') && (
            <p className="subjects-hero-subtext">{text('hero_subtext')}</p>
          )}

          {!loggedIn && (
            <p className="subjects-hero-guest-hint">
              Browse all grades below — pick your level to see subjects, or{' '}
              <Link to="/login" className="subjects-hero-link">
                log in
              </Link>{' '}
              for a personalised view.
            </p>
          )}
        </div>

        <div className="subjects-hero-illustration" aria-hidden="true">
          {heroSymbols.map((sym, idx) => (
            <span
              key={sym.key}
              className={`hero-symbol hero-symbol-${idx + 1}`}
              style={{ color: sym.color }}
            >
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

      <section
        className="subjects-filter-section"
        aria-labelledby="subjects-section-title"
      >
        <div className="subjects-section-head">
          <div>
            <h2 id="subjects-section-title" className="subjects-section-title">
              {text('subjects_title') || 'Subjects'}
            </h2>

            <p className="subjects-section-subtitle">
              {hasAnySubjects
                ? `${plural(allSubjects.length)} available — search, filter, or pick a category below.`
                : 'Your subjects will appear here soon.'}
            </p>
          </div>

          <div className="subjects-section-head-actions">
            {activeFilterCount > 0 && (
              <button
                type="button"
                className="subjects-clear-filters-btn"
                onClick={clearFilters}
              >
                Clear {activeFilterCount} filter
                {activeFilterCount > 1 ? 's' : ''}
              </button>
            )}

            <button
              type="button"
              className="subjects-jump-papers"
              onClick={jumpToPapers}
            >
              Past papers ↓
            </button>
          </div>
        </div>

        <div className="subjects-filter-search-row">
          <label className="subjects-search subjects-search-lg">
            <svg
              className="subjects-search-icon"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              aria-hidden="true"
            >
              <circle cx="11" cy="11" r="7" />
              <path d="M20 20l-3.5-3.5" />
            </svg>

            <input
              ref={searchRef}
              type="search"
              placeholder={
                text('search_placeholder') ||
                'Search subjects, topics, grades…'
              }
              aria-label={text('search_placeholder') || 'Search subjects'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />

            {searchQuery && (
              <button
                type="button"
                className="subjects-search-clear"
                aria-label="Clear search"
                onClick={() => {
                  setSearchQuery('');
                  focusSearch();
                }}
              >
                ✕
              </button>
            )}
          </label>

          <label className="subjects-sort subjects-sort-inline">
            <span className="subjects-sort-label">
              {text('sort_label') || 'Sort'}
            </span>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              {SORT_MODES.map((mode) => (
                <option key={mode} value={mode}>
                  {settings[`sort_${mode}`] || mode}
                </option>
              ))}
            </select>
          </label>
        </div>

        {canSwitchLevel && (
          <div
            className="subjects-filter-group"
            role="group"
            aria-label="Filter by grade"
          >
            <span className="subjects-filter-label">{gradeSectionTitle}</span>

            <div className="subjects-filter-pills">
              {allowedGrades.map((g) => {
                const active = g.is_all
                  ? selectedGrade === null
                  : selectedGrade === g.key;

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
          <div
            className="subjects-filter-group subjects-category-filter-group"
            role="group"
            aria-label="Filter by category"
          >
            <span className="subjects-filter-label">Category</span>

            <div className="subjects-category-filter-content">
              <div
                className={`subjects-filter-pills subjects-category-pills ${
                  categoriesExpanded ? 'is-expanded' : ''
                }`}
              >
                <button
                  type="button"
                  className={`filter-pill filter-pill-cat ${
                    selectedCategory === null ? 'active' : ''
                  }`}
                  aria-pressed={selectedCategory === null}
                  onClick={() => setSelectedCategory(null)}
                >
                  All
                  <span className="filter-pill-count">
                    {countsBeforeCategory.length}
                  </span>
                </button>

                {visibleCategories.map((cat) => {
                  const active = selectedCategory === cat.key;
                  const count = categoryCounts[cat.key] || 0;

                  return (
                    <button
                      key={cat.key}
                      type="button"
                      className={`filter-pill filter-pill-cat ${
                        active ? 'active' : ''
                      }`}
                      style={{
                        '--cat-color': cat.color || '#7c3aed',
                      }}
                      aria-pressed={active}
                      onClick={() =>
                        setSelectedCategory(active ? null : cat.key)
                      }
                    >
                      <span aria-hidden="true">
                        {cat.icon || monogram(cat.name)}
                      </span>

                      <span className="filter-pill-category-name">
                        {cat.name}
                      </span>

                      <span className="filter-pill-count">{count}</span>
                    </button>
                  );
                })}
              </div>

              {visibleCategories.length > 6 && (
                <button
                  type="button"
                  className="subjects-category-toggle"
                  aria-expanded={categoriesExpanded}
                  onClick={() =>
                    setCategoriesExpanded((expanded) => !expanded)
                  }
                >
                  {categoriesExpanded ? (
                    <>
                      View Less <span aria-hidden="true">↑</span>
                    </>
                  ) : (
                    <>
                      View All <span aria-hidden="true">↓</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        )}

        {hasAnySubjects && (
          <p className="subjects-results-summary" role="status" aria-live="polite">
            {visibleSubjects.length === 0
              ? 'No subjects match your filters.'
              : `Showing ${plural(visibleSubjects.length)}${
                  searchQuery ? ` for “${searchQuery}”` : ''
                }.`}
          </p>
        )}
      </section>

      <section
        ref={resultsRef}
        className="subjects-results"
        aria-labelledby="subjects-results-title"
      >
        {!hasAnySubjects ? (
          <EmptyState
            title="No subjects yet."
            hint="We're still setting things up. Check back soon."
          />
        ) : visibleSubjects.length === 0 ? (
          <EmptyState
            title={text('empty_message') || 'Nothing here yet.'}
            hint="Try a different search, or clear your filters."
            action={text('clear_filters_label') || 'Clear filters'}
            onAction={clearFilters}
          />
        ) : (
          <div
            className="subjects-page-grid"
            key={`${selectedCategory}-${selectedGrade}-${sortBy}-${searchQuery}`}
          >
            {visibleSubjects.map((subject, i) => {
              const cat =
                categoryByKey[subjectCategoryKey(subject)] ||
                (subject.category_id
                  ? categoryById[subject.category_id]
                  : null);

              const color = subject.color || cat?.color || '#7c3aed';
              const icon = subject.icon || cat?.icon || '';
              const grade = gradeByKey[subject.grade_key];

              const gradeLabel =
                grade?.label ||
                subject.grade_label ||
                canonicalGrade(subject.grade_key)?.label ||
                levelLabel(subject.grade_key);

              const stats = subject.stats || {};
              const paperRange = formatYearRange(
                stats.paperYearMin,
                stats.paperYearMax
              );

              const empty =
                !stats.lessonCount && !stats.paperCount && !stats.mockCount;

              return (
                <div
                  key={subject.id}
                  className="subjects-page-card"
                  style={{
                    '--i': Math.min(i, 12),
                    '--subject-color': color,
                  }}
                >
                  <div className="subjects-page-card-top">
                    <span className="subjects-page-icon" aria-hidden="true">
                      {icon || monogram(subject.name)}
                    </span>

                    {gradeLabel && (
                      <span className="subjects-grade-badge">
                        {gradeLabel}
                      </span>
                    )}
                  </div>

                  <h3>{subject.name}</h3>

                  {subject.description && <p>{subject.description}</p>}

                  {!empty ? (
                    <dl className="subjects-page-stats">
                      {typeof stats.topicsCovered === 'number' && (
                        <div>
                          <dt>{text('stat_topics') || 'Topics'}</dt>
                          <dd>
                            {stats.topicsCovered}
                            {stats.topicsTotal
                              ? ` of ${stats.topicsTotal}`
                              : ''}
                          </dd>
                        </div>
                      )}

                      {typeof stats.lessonCount === 'number' && (
                        <div>
                          <dt>{text('stat_lessons') || 'Lessons'}</dt>
                          <dd>{stats.lessonCount}</dd>
                        </div>
                      )}

                      {typeof stats.paperCount === 'number' && (
                        <div>
                          <dt>{text('stat_past_papers') || 'Past papers'}</dt>
                          <dd>
                            {stats.paperCount}
                            {paperRange && (
                              <span className="subjects-page-range">
                                {' '}({paperRange})
                              </span>
                            )}
                          </dd>
                        </div>
                      )}

                      {typeof stats.mockCount === 'number' && (
                        <div>
                          <dt>{text('stat_mocks') || 'Mocks'}</dt>
                          <dd>{stats.mockCount}</dd>
                        </div>
                      )}
                    </dl>
                  ) : (
                    <p className="subjects-page-coming-soon">
                      {text('coming_soon_label') || 'Content coming soon'}
                    </p>
                  )}

                  <div className="subjects-page-card-footer">
                    <Link
                      to={`/subjects/${subject.slug}`}
                      className="subjects-view-link"
                    >
                      {text('view_subject_label') || 'View Subject'} →
                    </Link>

                    <Link
                      to={`/subjects/${subject.slug}/papers`}
                      className="subjects-page-arrow-btn"
                      aria-label={
                        text('view_papers_label') || 'View past papers'
                      }
                    >
                      →
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section
        className="subjects-jumpback"
        aria-labelledby="subjects-jumpback-title"
      >
        <div className="subjects-section-header">
          <div>
            <h2 id="subjects-jumpback-title">
              {text('jump_back_in_title') || 'Recently viewed'}
            </h2>

            <p>
              {text('jump_back_in_subtitle') ||
                'Subjects and papers you have opened recently.'}
            </p>
          </div>
        </div>

        {jumpBackIn.length > 0 ? (
          <div className="subjects-jumpback-row">
            {jumpBackIn.map((item) => (
              <Link
                key={`${item.kind}-${item.id}`}
                to={item.href}
                className="subjects-jumpback-card"
              >
                <span className="subjects-jumpback-kind">
                  {item.kind === 'paper'
                    ? text('kind_paper') || 'Paper'
                    : item.kind === 'mock'
                      ? text('kind_mock') || 'Mock'
                      : text('kind_lesson') || 'Lesson'}
                </span>

                <span className="subjects-jumpback-title">{item.title}</span>

                {item.subtitle && (
                  <span className="subjects-jumpback-sub">
                    {item.subtitle}
                  </span>
                )}
              </Link>
            ))}
          </div>
        ) : (
          <EmptyState
            title="Nothing to show."
            hint="Recently opened subjects and papers will appear here."
          />
        )}
      </section>

      <section
        ref={papersRef}
        className="subjects-papers"
        aria-labelledby="subjects-papers-title"
      >
        <div className="subjects-section-header">
          <div>
            <h2 id="subjects-papers-title">
              {text('papers_title') || 'Past Papers & Memos'}
            </h2>

            <p>
              {text('papers_subtitle') ||
                'Practise with real exam papers and check against the memos.'}
            </p>
          </div>
        </div>

        <div className="subjects-papers-filters">
          <label className="subjects-papers-filter">
            <span>{text('papers_filter_subject') || 'Subject'}</span>

            <select
              value={papersSubject}
              onChange={(e) => setPapersSubject(e.target.value)}
            >
              <option value="all">{text('filter_all') || 'All'}</option>

              {visibleSubjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </label>

          <label className="subjects-papers-filter">
            <span>{text('papers_filter_year') || 'Year'}</span>

            <select
              value={papersYear}
              onChange={(e) => setPapersYear(e.target.value)}
            >
              <option value="all">{text('filter_all') || 'All'}</option>

              {papersYears.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </label>

          <label className="subjects-papers-filter">
            <span>{text('papers_filter_session') || 'Session'}</span>

            <select
              value={papersSession}
              onChange={(e) => setPapersSession(e.target.value)}
            >
              <option value="all">{text('filter_all') || 'All'}</option>

              {papersSessions.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>
        </div>

        {filteredPapers.length === 0 ? (
          <EmptyState
            title={text('papers_empty') || 'No papers yet.'}
            hint="Try a different filter, or check back soon for more."
            action={text('clear_filters_label') || 'Clear filters'}
            onAction={() => {
              setPapersSubject('all');
              setPapersYear('all');
              setPapersSession('all');
            }}
          />
        ) : (
          Object.entries(papersBySubject).map(([subjectId, list]) => {
            const subject = visibleSubjects.find(
              (s) => String(s.id) === String(subjectId)
            );

            if (!subject) return null;

            return (
              <div key={subjectId} className="subjects-papers-group">
                <h3 className="subjects-papers-group-title">
                  {subject.name}
                </h3>

                <ul className="subjects-papers-list">
                  {list.map((p) => (
                    <li key={p.id} className="subjects-paper-row">
                      <span className="subjects-paper-meta">
                        <span className="subjects-paper-year">
                          {p.year || ''}
                        </span>

                        <span className="subjects-paper-session">
                          {p.session || ''}
                        </span>

                        <span className="subjects-paper-number">
                          {p.paper_number ||
                            (p.is_mock ? p.title : '') ||
                            ''}
                        </span>

                        {p.is_mock && (
                          <span className="subjects-paper-tag">
                            {text('tag_mock') || 'Mock'}
                          </span>
                        )}
                      </span>

                      <span className="subjects-paper-links">
                        {p.paper_url && (
                          <a
                            href={p.paper_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="subjects-paper-link"
                          >
                            {text('paper_label') || 'Paper'}
                          </a>
                        )}

                        {p.paper_url && p.memo_url && (
                          <span
                            className="subjects-paper-sep"
                            aria-hidden="true"
                          >
                            |
                          </span>
                        )}

                        {p.memo_url && (
                          <a
                            href={p.memo_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="subjects-paper-link"
                          >
                            {text('memo_label') || 'Memo'}
                          </a>
                        )}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })
        )}
      </section>

      {canSwitchLevel && (
        <section
          className="subjects-other-levels"
          aria-labelledby="subjects-other-levels-title"
        >
          <button
            type="button"
            className="subjects-other-levels-toggle"
            aria-expanded={otherLevelOpen}
            onClick={() => setOtherLevelOpen((v) => !v)}
          >
            <h2 id="subjects-other-levels-title">
              {text('other_levels_title') || 'Explore other levels'}
            </h2>

            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={otherLevelOpen ? 'rotated' : ''}
              aria-hidden="true"
            >
              <path d="M6 9l6 6 6-6" />
            </svg>
          </button>

          {otherLevelOpen &&
            (data?.otherLevels?.length > 0 ? (
              <div className="subjects-other-levels-body">
                {data.otherLevels.map((lvl) => (
                  <button
                    key={lvl.tier}
                    type="button"
                    className={`subjects-other-level-pill ${
                      lvl.tier === effectiveTier ? 'active' : ''
                    }`}
                    onClick={() => {
                      if (!lvl.enabled && !access?.crossLevel) return;

                      setSelectedGrade(TIER_TO_KEY[lvl.tier] || null);
                      setSelectedCategory(null);
                    }}
                  >
                    {lvl.label}

                    {!lvl.enabled && !access?.crossLevel && (
                      <span
                        className="subjects-other-level-lock"
                        aria-hidden="true"
                      >
                        🔒
                      </span>
                    )}
                  </button>
                ))}
              </div>
            ) : (
              <EmptyState
                title="More levels coming soon."
                hint="You'll be able to explore other grades and tertiary subjects here as they're added."
              />
            ))}
        </section>
      )}
    </div>
  );
};

export default Subjects;
