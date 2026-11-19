
import React, { useEffect, useMemo, useState } from 'react';
import {
  Search,
  ArrowLeft,
  ArrowRight,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Home,
  HelpCircle,
  BookOpen,
  Clock,
  Star,
  TrendingUp,
  FileText,
  GraduationCap,
  CreditCard,
  ShieldCheck,
  Users,
  UserRoundCog,
  Bell,
  CalendarClock,
  MessageCircle,
  Settings,
  Rocket,
  LayoutDashboard,
  Wrench,
  X,
  SearchX,
  RefreshCw,
  ExternalLink
} from 'lucide-react';

import { supabase } from '../services/supabaseClient';
import './ParentHelp.css';

const ICONS = {
  rocket: Rocket,
  'user-round-cog': UserRoundCog,
  users: Users,
  'layout-dashboard': LayoutDashboard,
  'chart-no-axes-combined': TrendingUp,
  'book-open': BookOpen,
  presentation: GraduationCap,
  'calendar-clock': CalendarClock,
  'credit-card': CreditCard,
  'bell-ring': Bell,
  'messages-square': MessageCircle,
  wrench: Wrench,
  'shield-check': ShieldCheck,
  'circle-help': HelpCircle,
  'file-text': FileText
};

const ParentHelp = () => {
  const [categories, setCategories] = useState([]);
  const [articles, setArticles] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedArticle, setSelectedArticle] = useState(null);

  const [showAllCategories, setShowAllCategories] = useState(false);
  const [showAllPopular, setShowAllPopular] = useState(false);

  const [feedback, setFeedback] = useState({});
  const [feedbackLoading, setFeedbackLoading] = useState(false);

  useEffect(() => {
    loadHelpCentre();
  }, []);

  const loadHelpCentre = async () => {
    setLoading(true);
    setError('');

    try {
      const [
        { data: categoryData, error: categoryError },
        { data: articleData, error: articleError }
      ] = await Promise.all([
        supabase
          .from('parent_help_categories')
          .select('*')
          .eq('is_active', true)
          .order('display_order', { ascending: true }),

        supabase
          .from('parent_help_articles')
          .select('*')
          .eq('audience', 'parent')
          .eq('status', 'published')
          .order('published_at', { ascending: false })
      ]);

      if (categoryError) throw categoryError;
      if (articleError) throw articleError;

      setCategories(categoryData || []);
      setArticles(articleData || []);
    } catch (err) {
      console.error('Parent Help Centre error:', err);
      setError(
        'We could not load the Help Centre. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const getCategory = (categoryId) => {
    return categories.find(
      category => category.id === categoryId
    );
  };

  const getCategoryName = (categoryId) => {
    return getCategory(categoryId)?.name || 'General Help';
  };

  const getCategoryIcon = (category) => {
    const Icon = ICONS[category?.icon] || HelpCircle;
    return Icon;
  };

  const featuredArticles = useMemo(() => {
    return articles
      .filter(article => article.is_featured)
      .slice(0, 4);
  }, [articles]);

  const popularArticles = useMemo(() => {
    return [...articles]
      .sort(
        (a, b) =>
          (b.view_count || 0) - (a.view_count || 0)
      )
      .slice(0, 6);
  }, [articles]);

  const categoryArticles = useMemo(() => {
    if (!selectedCategory) return [];

    return articles.filter(
      article => article.category_id === selectedCategory.id
    );
  }, [articles, selectedCategory]);

  const filteredArticles = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    if (!term) return [];

    return articles.filter(article => {
      const categoryName = getCategoryName(
        article.category_id
      ).toLowerCase();

      const searchableText = [
        article.title,
        article.summary,
        article.content,
        categoryName,
        ...(article.keywords || [])
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return searchableText.includes(term);
    });
  }, [articles, searchTerm, categories]);

  const openArticle = async (article) => {
    setSelectedArticle(article);
    setSelectedCategory(null);

    // Increment article views in the database.
    try {
      await supabase
        .from('parent_help_articles')
        .update({
          view_count: (article.view_count || 0) + 1
        })
        .eq('id', article.id);

      setArticles(previous =>
        previous.map(item =>
          item.id === article.id
            ? {
                ...item,
                view_count: (item.view_count || 0) + 1
              }
            : item
        )
      );
    } catch (err) {
      console.error('Could not update article view count:', err);
    }

    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  const submitFeedback = async (article, type) => {
    if (feedback[article.id]) return;

    setFeedbackLoading(true);

    const column =
      type === 'helpful'
        ? 'helpful_count'
        : 'not_helpful_count';

    try {
      const currentValue = article[column] || 0;

      const { error: updateError } = await supabase
        .from('parent_help_articles')
        .update({
          [column]: currentValue + 1
        })
        .eq('id', article.id);

      if (updateError) throw updateError;

      setFeedback(previous => ({
        ...previous,
        [article.id]: type
      }));

      setArticles(previous =>
        previous.map(item =>
          item.id === article.id
            ? {
                ...item,
                [column]: (item[column] || 0) + 1
              }
            : item
        )
      );
    } catch (err) {
      console.error('Feedback error:', err);
    } finally {
      setFeedbackLoading(false);
    }
  };

  const clearSearch = () => {
    setSearchTerm('');
  };

  const goHome = () => {
    setSelectedArticle(null);
    setSelectedCategory(null);
    setSearchTerm('');
  };

  const getReadingTime = (article) => {
    return article.reading_time
      ? `${article.reading_time} min read`
      : 'Quick read';
  };

  const visibleCategories = showAllCategories
    ? categories
    : categories.slice(0, 8);

  const visiblePopularArticles = showAllPopular
    ? popularArticles
    : popularArticles.slice(0, 4);

  const renderArticleCard = (article, featured = false) => {
    const CategoryIcon = getCategoryIcon(
      getCategory(article.category_id)
    );

    return (
      <button
        type="button"
        className={`ph-article-card ${
          featured ? 'ph-featured-card' : ''
        }`}
        key={article.id}
        onClick={() => openArticle(article)}
      >
        <div className="ph-article-card-top">
          <span className="ph-article-icon">
            <CategoryIcon size={19} />
          </span>

          {article.is_popular && (
            <span className="ph-popular-label">
              Popular
            </span>
          )}
        </div>

        <div className="ph-article-card-content">
          <span className="ph-article-category">
            {getCategoryName(article.category_id)}
          </span>

          <h3>{article.title}</h3>

          <p>
            {article.summary || 'Read this help article for more information.'}
          </p>
        </div>

        <div className="ph-article-card-footer">
          <span>
            <Clock size={14} />
            {getReadingTime(article)}
          </span>

          <span className="ph-card-arrow">
            <ArrowRight size={17} />
          </span>
        </div>
      </button>
    );
  };

  const renderArticleContent = (article) => {
    if (!article.content) {
      return (
        <div className="ph-no-content">
          <FileText size={30} />
          <h3>Article content is being prepared</h3>
          <p>
            Please check back soon or contact our support team
            if you need assistance.
          </p>
        </div>
      );
    }

    // The content column supports plain text and basic
    // line breaks. Rich HTML must be rendered through a
    // sanitised content renderer before being enabled.
    return (
      <div className="ph-article-body">
        {article.content.split('\n').map((line, index) => (
          <p key={index}>
            {line || '\u00A0'}
          </p>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="ph-page">
        <div className="ph-loading">
          <div className="ph-spinner" />
          <h3>Loading Parent Help Centre</h3>
          <p>Preparing helpful resources for you...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="ph-page">
        <div className="ph-error-state">
          <div className="ph-error-icon">
            <RefreshCw size={25} />
          </div>

          <h2>Something went wrong</h2>
          <p>{error}</p>

          <button
            type="button"
            className="ph-primary-button"
            onClick={loadHelpCentre}
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <main className="ph-page">
      <div className="ph-container">

        {/* BREADCRUMB */}
        <div className="ph-breadcrumb">
          <button type="button" onClick={goHome}>
            <Home size={15} />
            Parent Portal
          </button>

          <ChevronRight size={14} />

          <button type="button" onClick={goHome}>
            Help Centre
          </button>

          {selectedCategory && (
            <>
              <ChevronRight size={14} />
              <span>{selectedCategory.name}</span>
            </>
          )}

          {selectedArticle && (
            <>
              <ChevronRight size={14} />
              <span>{selectedArticle.title}</span>
            </>
          )}
        </div>

        {/* ARTICLE DETAIL */}
        {selectedArticle ? (
          <section className="ph-detail-layout">
            <div className="ph-detail-main">
              <button
                type="button"
                className="ph-back-button"
                onClick={goHome}
              >
                <ArrowLeft size={17} />
                Back to Help Centre
              </button>

              <div className="ph-detail-heading">
                <span className="ph-detail-category">
                  {getCategoryName(selectedArticle.category_id)}
                </span>

                <h1>{selectedArticle.title}</h1>

                <p>
                  {selectedArticle.summary}
                </p>

                <div className="ph-detail-meta">
                  <span>
                    <Clock size={15} />
                    {getReadingTime(selectedArticle)}
                  </span>

                  <span>
                    <BookOpen size={15} />
                    {selectedArticle.view_count || 0} views
                  </span>

                  {selectedArticle.published_at && (
                    <span>
                      Updated{' '}
                      {new Date(
                        selectedArticle.published_at
                      ).toLocaleDateString('en-ZA')}
                    </span>
                  )}
                </div>
              </div>

              <div className="ph-detail-content">
                {renderArticleContent(selectedArticle)}
              </div>

              <div className="ph-feedback-panel">
                <div>
                  <h3>Was this article helpful?</h3>
                  <p>
                    Your feedback helps us improve our support resources.
                  </p>
                </div>

                <div className="ph-feedback-actions">
                  <button
                    type="button"
                    disabled={
                      feedbackLoading ||
                      Boolean(feedback[selectedArticle.id])
                    }
                    className={
                      feedback[selectedArticle.id] === 'helpful'
                        ? 'selected'
                        : ''
                    }
                    onClick={() =>
                      submitFeedback(selectedArticle, 'helpful')
                    }
                  >
                    <Star size={16} />
                    Yes
                  </button>

                  <button
                    type="button"
                    disabled={
                      feedbackLoading ||
                      Boolean(feedback[selectedArticle.id])
                    }
                    className={
                      feedback[selectedArticle.id] === 'not_helpful'
                        ? 'selected'
                        : ''
                    }
                    onClick={() =>
                      submitFeedback(selectedArticle, 'not_helpful')
                    }
                  >
                    No
                  </button>
                </div>

                {feedback[selectedArticle.id] && (
                  <p className="ph-feedback-thanks">
                    Thank you for your feedback.
                  </p>
                )}
              </div>
            </div>

            <aside className="ph-detail-sidebar">
              <div className="ph-sidebar-card">
                <h3>Related articles</h3>

                {articles
                  .filter(article =>
                    article.category_id ===
                      selectedArticle.category_id &&
                    article.id !== selectedArticle.id
                  )
                  .slice(0, 5)
                  .map(article => (
                    <button
                      type="button"
                      className="ph-related-link"
                      key={article.id}
                      onClick={() => openArticle(article)}
                    >
                      <span>{article.title}</span>
                      <ChevronRight size={16} />
                    </button>
                  ))}

                {articles.filter(article =>
                  article.category_id ===
                    selectedArticle.category_id &&
                  article.id !== selectedArticle.id
                ).length === 0 && (
                  <p className="ph-muted">
                    No related articles available yet.
                  </p>
                )}
              </div>

              <div className="ph-sidebar-contact">
                <MessageCircle size={22} />
                <h3>Still need help?</h3>
                <p>
                  Our support team is here to assist you.
                </p>
                <a href="/contact">
                  Contact Support
                  <ArrowRight size={15} />
                </a>
              </div>
            </aside>
          </section>
        ) : selectedCategory ? (
          /* CATEGORY VIEW */
          <section className="ph-category-view">
            <button
              type="button"
              className="ph-back-button"
              onClick={goHome}
            >
              <ArrowLeft size={17} />
              All help topics
            </button>

            <div className="ph-section-heading">
              <span className="ph-eyebrow">HELP TOPIC</span>
              <h1>{selectedCategory.name}</h1>
              <p>{selectedCategory.description}</p>
            </div>

            {categoryArticles.length > 0 ? (
              <div className="ph-article-grid">
                {categoryArticles.map(article =>
                  renderArticleCard(article)
                )}
              </div>
            ) : (
              <div className="ph-empty-state">
                <SearchX size={35} />
                <h3>No articles available yet</h3>
                <p>
                  We are preparing resources for this topic.
                </p>
              </div>
            )}
          </section>
        ) : (
          /* MAIN HELP CENTRE */
          <>
            <section className="ph-hero">
              <div className="ph-hero-content">
                <span className="ph-eyebrow">
                  PARENT & GUARDIAN SUPPORT
                </span>

                <h1>
                  How can we
                  <span> help you today?</span>
                </h1>

                <p>
                  Find answers, explore helpful guides and
                  learn how to get the most out of EduSpantech
                  for your child's learning journey.
                </p>

                <div className="ph-search-wrap">
                  <Search size={21} />

                  <input
                    type="search"
                    value={searchTerm}
                    onChange={event =>
                      setSearchTerm(event.target.value)
                    }
                    placeholder="Search for help, e.g. payments, linked students..."
                    aria-label="Search help articles"
                  />

                  {searchTerm && (
                    <button
                      type="button"
                      onClick={clearSearch}
                      aria-label="Clear search"
                    >
                      <X size={18} />
                    </button>
                  )}

                  <button
                    type="button"
                    className="ph-search-button"
                    onClick={() => {
                      if (!searchTerm.trim()) return;
                      document
                        .getElementById('ph-search-results')
                        ?.scrollIntoView({ behavior: 'smooth' });
                    }}
                  >
                    Search
                  </button>
                </div>

                <div className="ph-search-suggestions">
                  <span>Popular searches:</span>

                  {['Payments', 'Link a student', 'Sessions', 'Reports'].map(
                    term => (
                      <button
                        type="button"
                        key={term}
                        onClick={() => setSearchTerm(term)}
                      >
                        {term}
                      </button>
                    )
                  )}
                </div>
              </div>

              <div className="ph-hero-decoration">
                <div className="ph-hero-circle">
                  <HelpCircle size={74} strokeWidth={1.3} />
                </div>

                <div className="ph-hero-floating-card">
                  <div className="ph-floating-icon">
                    <ShieldCheck size={19} />
                  </div>
                  <div>
                    <strong>Parent support</strong>
                    <span>Guidance every step of the way</span>
                  </div>
                </div>
              </div>
            </section>

            {/* SEARCH RESULTS */}
            {searchTerm.trim() && (
              <section
                className="ph-section"
                id="ph-search-results"
              >
                <div className="ph-section-heading">
                  <span className="ph-eyebrow">SEARCH</span>
                  <h2>Search results</h2>
                  <p>
                    {filteredArticles.length} article
                    {filteredArticles.length === 1 ? '' : 's'} found
                    for "{searchTerm}"
                  </p>
                </div>

                {filteredArticles.length > 0 ? (
                  <div className="ph-article-grid">
                    {filteredArticles.map(article =>
                      renderArticleCard(article)
                    )}
                  </div>
                ) : (
                  <div className="ph-empty-state">
                    <SearchX size={35} />
                    <h3>No matching articles found</h3>
                    <p>
                      Try another search term or browse the help topics below.
                    </p>
                  </div>
                )}
              </section>
            )}

            {/* CATEGORIES */}
            {!searchTerm.trim() && (
              <>
                <section className="ph-section">
                  <div className="ph-section-heading ph-heading-row">
                    <div>
                      <span className="ph-eyebrow">
                        EXPLORE SUPPORT
                      </span>
                      <h2>Browse help topics</h2>
                      <p>
                        Find guidance organised around your parent account.
                      </p>
                    </div>

                    {categories.length > 8 && (
                      <button
                        type="button"
                        className="ph-text-button"
                        onClick={() =>
                          setShowAllCategories(value => !value)
                        }
                      >
                        {showAllCategories ? 'Show less' : 'View all topics'}
                        {showAllCategories ? (
                          <ChevronUp size={16} />
                        ) : (
                          <ChevronDown size={16} />
                        )}
                      </button>
                    )}
                  </div>

                  {categories.length > 0 ? (
                    <div className="ph-category-grid">
                      {visibleCategories.map(category => {
                        const Icon = getCategoryIcon(category);

                        const count = articles.filter(
                          article =>
                            article.category_id === category.id
                        ).length;

                        return (
                          <button
                            type="button"
                            className="ph-category-card"
                            key={category.id}
                            onClick={() =>
                              setSelectedCategory(category)
                            }
                          >
                            <div className="ph-category-icon">
                              <Icon size={22} />
                            </div>

                            <div className="ph-category-info">
                              <h3>{category.name}</h3>
                              <p>{category.description}</p>
                              <span>
                                {count} {count === 1 ? 'article' : 'articles'}
                              </span>
                            </div>

                            <ChevronRight
                              size={18}
                              className="ph-category-arrow"
                            />
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="ph-empty-state">
                      <BookOpen size={35} />
                      <h3>No help topics published</h3>
                      <p>
                        Help topics will appear here once they are activated.
                      </p>
                    </div>
                  )}
                </section>

                {/* FEATURED ARTICLES */}
                {featuredArticles.length > 0 && (
                  <section className="ph-section">
                    <div className="ph-section-heading">
                      <span className="ph-eyebrow">
                        GETTING STARTED
                      </span>
                      <h2>Featured guides</h2>
                      <p>
                        Start with these useful resources for parents.
                      </p>
                    </div>

                    <div className="ph-featured-grid">
                      {featuredArticles.map(article =>
                        renderArticleCard(article, true)
                      )}
                    </div>
                  </section>
                )}

                {/* POPULAR ARTICLES */}
                {popularArticles.length > 0 && (
                  <section className="ph-section">
                    <div className="ph-section-heading ph-heading-row">
                      <div>
                        <span className="ph-eyebrow">
                          MOST READ
                        </span>
                        <h2>Popular articles</h2>
                        <p>
                          Resources other parents are reading.
                        </p>
                      </div>

                      {popularArticles.length > 4 && (
                        <button
                          type="button"
                          className="ph-text-button"
                          onClick={() =>
                            setShowAllPopular(value => !value)
                          }
                        >
                          {showAllPopular ? 'Show less' : 'View all'}
                          <ArrowRight size={16} />
                        </button>
                      )}
                    </div>

                    <div className="ph-popular-list">
                      {visiblePopularArticles.map((article, index) => (
                        <button
                          type="button"
                          className="ph-popular-row"
                          key={article.id}
                          onClick={() => openArticle(article)}
                        >
                          <span className="ph-popular-number">
                            {String(index + 1).padStart(2, '0')}
                          </span>

                          <div className="ph-popular-content">
                            <span>
                              {getCategoryName(article.category_id)}
                            </span>
                            <h3>{article.title}</h3>
                          </div>

                          <div className="ph-popular-views">
                            <BookOpen size={14} />
                            {article.view_count || 0}
                          </div>

                          <ChevronRight size={18} />
                        </button>
                      ))}
                    </div>
                  </section>
                )}

                {/* CONTACT SUPPORT */}
                <section className="ph-contact-banner">
                  <div className="ph-contact-icon">
                    <MessageCircle size={29} />
                  </div>

                  <div className="ph-contact-content">
                    <span>WE'RE HERE TO HELP</span>
                    <h2>Couldn't find what you were looking for?</h2>
                    <p>
                      Get in touch with our support team for
                      personalised assistance.
                    </p>
                  </div>

                  <a href="/contact" className="ph-contact-button">
                    Contact Support
                    <ArrowRight size={17} />
                  </a>
                </section>
              </>
            )}
          </>
        )}
      </div>
    </main>
  );
};

export default ParentHelp;
