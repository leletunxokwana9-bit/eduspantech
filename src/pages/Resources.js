
import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import resourceService from '../services/resourceService';
import authService from '../services/authService';
import './Resources.css';

const PAGE_SIZE = 10;

const CATEGORIES = [
  {
    slug: 'past-papers',
    title: 'Past Papers',
    description: 'Previous examination papers to help you prepare.',
    icon: '📄',
    types: ['past paper', 'past_paper', 'past-paper', 'examination paper', 'exam paper']
  },
  {
    slug: 'memorandums',
    title: 'Memorandums',
    description: 'Answers, marking guidelines and worked solutions.',
    icon: '📝',
    types: ['memorandum', 'memo', 'marking guideline', 'marking guide']
  },
  {
    slug: 'study-guides',
    title: 'Study Guides',
    description: 'Structured learning materials and subject guides.',
    icon: '📚',
    types: ['study guide', 'study_guide', 'study-guide', 'guide']
  },
  {
    slug: 'revision-notes',
    title: 'Revision Notes',
    description: 'Important concepts, summaries and revision material.',
    icon: '📖',
    types: ['revision notes', 'revision_note', 'revision-notes', 'notes', 'formula sheet']
  }
];

const getText = (...values) => {
  const value = values.find(
    item => item !== undefined && item !== null && String(item).trim() !== ''
  );
  return value === undefined ? '' : String(value);
};

const getResourceTitle = resource =>
  getText(
    resource.title,
    resource.name,
    resource.resource_name,
    resource.file_name,
    resource.filename,
    'Untitled resource'
  );

const getResourceSubjectId = resource =>
  getText(resource.subject_id, resource.subjectId);

const getResourceSubject = (resource, subjects) => {
  const subjectName = getText(
    resource.subject_name,
    resource.subjectName,
    resource.subject?.name
  );

  if (subjectName) return subjectName;

  const subjectId = getResourceSubjectId(resource);
  const subject = subjects.find(item => String(item.id) === subjectId);

  return subject?.name || 'General';
};

const getResourceType = resource => {
  const type = getText(
    resource.type,
    resource.resource_type,
    resource.category,
    resource.resource_category
  ).toLowerCase().replace(/-/g, ' ').replace(/_/g, ' ');

  const searchableText = [
    type,
    getResourceTitle(resource),
    resource.description,
    resource.topic
  ].join(' ').toLowerCase();

  if (/memorandum|\bmemo\b|marking guide|marking guideline/.test(searchableText)) {
    return 'memorandums';
  }

  if (/past paper|past examination|previous examination|exam paper|examination paper/.test(searchableText)) {
    return 'past-papers';
  }

  if (/revision note|revision material|formula sheet|summary notes/.test(searchableText)) {
    return 'revision-notes';
  }

  if (/study guide|study material|\bguide\b/.test(searchableText)) {
    return 'study-guides';
  }

  return 'other';
};

const getResourceGrade = resource =>
  getText(
    resource.grade,
    resource.grade_name,
    resource.grade_level,
    resource.school_grade
  );

const getResourceYear = resource => {
  const year = getText(
    resource.year,
    resource.resource_year,
    resource.academic_year,
    resource.created_at?.slice?.(0, 4)
  );

  const match = year.match(/\b20\d{2}\b/);
  return match ? match[0] : '';
};

const getResourceUrl = resource =>
  getText(
    resource.url,
    resource.file_url,
    resource.resource_url,
    resource.download_url,
    resource.public_url,
    resource.storage_url,
    resource.link
  );

const Resources = () => {
  const navigate = useNavigate();
  const { category: categorySlug } = useParams();

  const [resources, setResources] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [error, setError] = useState('');

  const [search, setSearch] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('');
  const [gradeFilter, setGradeFilter] = useState('');
  const [yearFilter, setYearFilter] = useState('');
  const [page, setPage] = useState(1);

  const [selectedResource, setSelectedResource] = useState(null);

  const currentCategory = CATEGORIES.find(
    item => item.slug === categorySlug
  );

  const isLandingPage = !categorySlug;

  useEffect(() => {
    let mounted = true;

    const checkAuthentication = async () => {
      const token = localStorage.getItem('accessToken');

      if (!token) {
        if (mounted) {
          setAuthenticated(false);
          setCheckingAuth(false);
          setLoading(false);
        }
        return;
      }

      try {
        const user = await authService.getCurrentUserWithSubscription();

        if (!mounted) return;

        if (user) {
          setAuthenticated(true);
        } else {
          setAuthenticated(false);
          authService.logout();
        }
      } catch (err) {
        console.error('Resource authentication check failed:', err);
        if (mounted) setAuthenticated(false);
      } finally {
        if (mounted) setCheckingAuth(false);
      }
    };

    checkAuthentication();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!authenticated) {
      setLoading(false);
      return;
    }

    let mounted = true;

    const fetchLibrary = async () => {
      setLoading(true);
      setError('');

      try {
        const [resourceResponse, subjectResponse] = await Promise.all([
          resourceService.getAllResources(),
          resourceService.getSubjects()
        ]);

        if (!mounted) return;

        setResources(
          Array.isArray(resourceResponse)
            ? resourceResponse
            : resourceResponse?.resources || []
        );

        setSubjects(
          Array.isArray(subjectResponse)
            ? subjectResponse
            : subjectResponse?.subjects || []
        );
      } catch (err) {
        console.error('Failed to load academic library:', err);
        if (mounted) {
          setError('We could not load the learning resources. Please try again.');
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchLibrary();

    return () => {
      mounted = false;
    };
  }, [authenticated]);

  useEffect(() => {
    setSearch('');
    setSubjectFilter('');
    setGradeFilter('');
    setYearFilter('');
    setPage(1);
    setSelectedResource(null);
  }, [categorySlug]);

  const normalizedResources = useMemo(() => {
    return resources.map(resource => ({
      ...resource,
      _title: getResourceTitle(resource),
      _subject: getResourceSubject(resource, subjects),
      _grade: getResourceGrade(resource),
      _year: getResourceYear(resource),
      _category: getResourceType(resource),
      _url: getResourceUrl(resource)
    }));
  }, [resources, subjects]);

  const categoryResources = useMemo(() => {
    if (!currentCategory) return [];

    return normalizedResources.filter(
      resource => resource._category === currentCategory.slug
    );
  }, [normalizedResources, currentCategory]);

  const availableResources = isLandingPage
    ? normalizedResources
    : categoryResources;

  const subjectOptions = useMemo(() => {
    const names = new Set(
      availableResources
        .map(resource => resource._subject)
        .filter(name => name && name !== 'General')
    );

    return [...names].sort((a, b) => a.localeCompare(b));
  }, [availableResources]);

  const gradeOptions = useMemo(() => {
    return [...new Set(
      availableResources.map(resource => resource._grade).filter(Boolean)
    )].sort();
  }, [availableResources]);

  const yearOptions = useMemo(() => {
    return [...new Set(
      availableResources.map(resource => resource._year).filter(Boolean)
    )].sort((a, b) => Number(b) - Number(a));
  }, [availableResources]);

  const filteredResources = useMemo(() => {
    const query = search.trim().toLowerCase();

    return availableResources.filter(resource => {
      const searchable = [
        resource._title,
        resource._subject,
        resource._grade,
        resource._year,
        resource.description,
        resource.topic
      ].join(' ').toLowerCase();

      return (
        (!query || searchable.includes(query)) &&
        (!subjectFilter || resource._subject === subjectFilter) &&
        (!gradeFilter || resource._grade === gradeFilter) &&
        (!yearFilter || resource._year === yearFilter)
      );
    });
  }, [
    availableResources,
    search,
    subjectFilter,
    gradeFilter,
    yearFilter
  ]);

  const totalPages = Math.max(1, Math.ceil(filteredResources.length / PAGE_SIZE));

  const currentPage = Math.min(page, totalPages);

  const paginatedResources = filteredResources.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  useEffect(() => {
    setPage(1);
  }, [search, subjectFilter, gradeFilter, yearFilter]);

  const getCategoryCount = slug =>
    normalizedResources.filter(item => item._category === slug).length;

  const handleOpenResource = async resource => {
    setSelectedResource(resource);

    if (resource._url) return;

    if (resource.id) {
      try {
        const response = await resourceService.getResource(resource.id);
        const details = response?.resource || response;

        const url = getResourceUrl(details || {});

        if (url) {
          setSelectedResource({
            ...resource,
            ...details,
            _url: url
          });
        }
      } catch (err) {
        console.error('Could not retrieve resource details:', err);
      }
    }
  };

  const handleDownload = resource => {
    if (!resource._url) {
      handleOpenResource(resource);
      return;
    }

    const link = document.createElement('a');
    link.href = resource._url;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.download = resource._title;
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const closeViewer = () => setSelectedResource(null);

  if (checkingAuth || loading) {
    return (
      <div className="resources-loading">
        <div className="resources-spinner"></div>
        <p>Loading your learning library...</p>
      </div>
    );
  }

  if (!authenticated) {
    return (
      <div className="resources-access">
        <div className="resources-access-card">
          <div className="access-icon">🔒</div>
          <h2>Sign in to access your library</h2>
          <p>Log in to explore your learning materials and examination resources.</p>

          <button
            className="resources-primary-btn"
            onClick={() =>
              navigate('/login', { state: { from: '/resources' } })
            }
          >
            Sign in
            <span>→</span>
          </button>

          <p className="access-register">
            Don't have an account?{' '}
            <span onClick={() => navigate('/register')}>Create an account</span>
          </p>
        </div>
      </div>
    );
  }

  if (categorySlug && !currentCategory) {
    return (
      <div className="resources-error">
        <h2>Resource category not found</h2>
        <p>The category you're looking for doesn't exist.</p>
        <button onClick={() => navigate('/resources')}>
          Back to Resources
        </button>
      </div>
    );
  }

  if (error) {
    return (
      <div className="resources-error">
        <h2>Unable to load resources</h2>
        <p>{error}</p>
        <button onClick={() => window.location.reload()}>
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="resources-page">

      {/* PAGE HEADER */}
      <div className="resources-header">
        <div>
          <div className="resources-eyebrow">EDUSPANTECH LIBRARY</div>

          <h1>
            {isLandingPage
              ? 'Learning Resources'
              : currentCategory.title}
          </h1>

          <p>
            {isLandingPage
              ? 'Explore academic materials and prepare with confidence.'
              : currentCategory.description}
          </p>
        </div>

        {isLandingPage ? (
          <div className="library-total">
            <span className="library-total-number">
              {normalizedResources.length}
            </span>
            <span>Available resources</span>
          </div>
        ) : (
          <button
            className="resources-back-btn"
            onClick={() => navigate('/resources')}
          >
            ← All resources
          </button>
        )}
      </div>

      {/* LANDING PAGE: CATEGORY NAVIGATION ONLY */}
      {isLandingPage && (
        <section className="resource-categories">
          <div className="resource-section-heading">
            <div>
              <h2>Explore the library</h2>
              <p>Choose the type of learning material you need.</p>
            </div>
          </div>

          <div className="resource-category-grid">
            {CATEGORIES.map(category => (
              <button
                key={category.slug}
                className="resource-category-card"
                onClick={() => navigate(`/resources/${category.slug}`)}
              >
                <div className="category-card-top">
                  <div className="category-card-icon">
                    {category.icon}
                  </div>
                  <span className="category-arrow">↗</span>
                </div>

                <h3>{category.title}</h3>
                <p>{category.description}</p>

                <div className="category-card-bottom">
                  <span>{getCategoryCount(category.slug)} resources</span>
                  <span className="category-explore">Explore →</span>
                </div>
              </button>
            ))}
          </div>

          <div className="library-information">
            <div className="library-information-icon">✦</div>
            <div>
              <h3>Your academic library</h3>
              <p>
                Select a category to browse materials across all available
                subjects. You can filter resources by subject, grade and year.
              </p>
            </div>
          </div>
        </section>
      )}

      {/* CATEGORY PAGE: RESOURCE SEARCH AND RESULTS */}
      {!isLandingPage && (
        <section className="resource-results-section">

          <div className="resource-search-row">
            <div className="resource-search">
              <span>⌕</span>
              <input
                type="search"
                placeholder={`Search ${currentCategory.title.toLowerCase()}...`}
                value={search}
                onChange={event => setSearch(event.target.value)}
              />

              {search && (
                <button onClick={() => setSearch('')} aria-label="Clear search">
                  ×
                </button>
              )}
            </div>
          </div>

          {/* FILTERS */}
          <div className="resource-filters">

            <label>
              <span>Subject</span>
              <select
                value={subjectFilter}
                onChange={event => setSubjectFilter(event.target.value)}
              >
                <option value="">All subjects</option>
                {subjectOptions.map(subject => (
                  <option key={subject} value={subject}>{subject}</option>
                ))}
              </select>
            </label>

            <label>
              <span>Grade</span>
              <select
                value={gradeFilter}
                onChange={event => setGradeFilter(event.target.value)}
              >
                <option value="">All grades</option>
                {gradeOptions.map(grade => (
                  <option key={grade} value={grade}>{grade}</option>
                ))}
              </select>
            </label>

            <label>
              <span>Year</span>
              <select
                value={yearFilter}
                onChange={event => setYearFilter(event.target.value)}
              >
                <option value="">Any year</option>
                {yearOptions.map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </label>

            <button
              className="clear-filters-btn"
              onClick={() => {
                setSearch('');
                setSubjectFilter('');
                setGradeFilter('');
                setYearFilter('');
              }}
            >
              Clear filters
            </button>
          </div>

          {/* RESULTS HEADER */}
          <div className="resource-results-heading">
            <div>
              <h2>{currentCategory.title}</h2>
              <p>
                {filteredResources.length} matching resource
                {filteredResources.length === 1 ? '' : 's'}
              </p>
            </div>
          </div>

          {/* RESOURCE LIST */}
          {paginatedResources.length > 0 ? (
            <div className="resource-list">

              {paginatedResources.map((resource, index) => (
                <article
                  className="resource-item"
                  key={resource.id || `${resource._title}-${index}`}
                >
                  <div className="resource-file-icon">
                    {resource._url?.toLowerCase().includes('.pdf')
                      ? 'PDF'
                      : 'DOC'}
                  </div>

                  <div className="resource-item-info">
                    <h3>{resource._title}</h3>
                    <div className="resource-item-meta">
                      <span>{resource._subject}</span>
                      <span>•</span>
                      <span>{resource._grade || 'Grade not specified'}</span>
                      {resource._year && (
                        <>
                          <span>•</span>
                          <span>{resource._year}</span>
                        </>
                      )}
                    </div>

                    {resource.description && (
                      <p className="resource-description">
                        {resource.description}
                      </p>
                    )}
                  </div>

                  <div className="resource-item-actions">
                    <button
                      className="resource-view-btn"
                      onClick={() => handleOpenResource(resource)}
                    >
                      View resource
                    </button>

                    {resource._url && (
                      <button
                        className="resource-download-btn"
                        onClick={() => handleDownload(resource)}
                        title="Open or download resource"
                      >
                        ↓
                      </button>
                    )}
                  </div>
                </article>
              ))}

            </div>
          ) : (
            <div className="resource-empty-state">
              <div className="resource-empty-icon">📂</div>
              <h3>No resources found</h3>
              <p>
                {availableResources.length === 0
                  ? `There are no ${currentCategory.title.toLowerCase()} available yet.`
                  : 'Try changing your search or filters to find what you need.'}
              </p>

              {(search || subjectFilter || gradeFilter || yearFilter) && (
                <button
                  onClick={() => {
                    setSearch('');
                    setSubjectFilter('');
                    setGradeFilter('');
                    setYearFilter('');
                  }}
                >
                  Clear filters
                </button>
              )}
            </div>
          )}

          {/* PAGINATION */}
          {filteredResources.length > PAGE_SIZE && (
            <div className="resource-pagination">
              <span>
                Showing {(currentPage - 1) * PAGE_SIZE + 1}–
                {Math.min(currentPage * PAGE_SIZE, filteredResources.length)}
                {' '}of {filteredResources.length}
              </span>

              <div>
                <button
                  disabled={currentPage === 1}
                  onClick={() => setPage(currentPage - 1)}
                >
                  ← Previous
                </button>

                <span className="page-number">
                  {currentPage} / {totalPages}
                </span>

                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setPage(currentPage + 1)}
                >
                  Next →
                </button>
              </div>
            </div>
          )}

        </section>
      )}

      {/* RESOURCE VIEWER */}
      {selectedResource && (
        <div
          className="resource-modal-backdrop"
          onClick={closeViewer}
        >
          <div
            className="resource-modal"
            onClick={event => event.stopPropagation()}
          >
            <div className="resource-modal-header">
              <div>
                <h2>{selectedResource._title}</h2>
                <p>
                  {selectedResource._subject} · {selectedResource._grade}
                </p>
              </div>

              <button
                className="resource-modal-close"
                onClick={closeViewer}
                aria-label="Close resource"
              >
                ×
              </button>
            </div>

            <div className="resource-modal-content">
              {selectedResource._url ? (
                <iframe
                  src={selectedResource._url}
                  title={selectedResource._title}
                  allowFullScreen
                />
              ) : (
                <div className="resource-modal-unavailable">
                  <div>📄</div>
                  <h3>Resource preview unavailable</h3>
                  <p>
                    We couldn't find a viewable file link for this resource.
                    Please contact support if you need assistance.
                  </p>
                </div>
              )}
            </div>

            <div className="resource-modal-footer">
              {selectedResource._url && (
                <button
                  className="resources-primary-btn"
                  onClick={() => window.open(
                    selectedResource._url,
                    '_blank',
                    'noopener,noreferrer'
                  )}
                >
                  Open in new tab ↗
                </button>
              )}

              <button
                className="resources-secondary-btn"
                onClick={closeViewer}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Resources;
