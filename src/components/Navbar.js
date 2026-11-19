
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

import {
  Home,
  BookOpen,
  GraduationCap,
  Users,
  CalendarDays,
  Library,
  Target,
  LayoutDashboard,
  User,
  Settings,
  LogOut,
  Search,
  Menu,
  X,
  ChevronDown,
  CreditCard,
  BarChart3,
  FileText,
  Wallet,
  HelpCircle,
  Activity,
  Languages,
  BookMarked
} from 'lucide-react';

import { useLanguage } from '../context/LanguageContext';
import { useSound } from '../context/SoundContext';
import { authService } from '../services/authService';

import NotificationBell from './NotificationBell';
import ParentNavbar from './ParentNavbar';

import './Navbar.css';
import logo from '../assets/EduspanLogo.png';

const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const {
    currentLanguage,
    changeLanguage,
    languages
  } = useLanguage();

  const { playClick } = useSound();

  const searchInputRef = useRef(null);

  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loadingUser, setLoadingUser] = useState(true);

  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [languageOpen, setLanguageOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);

  // =========================================================
  // HELPERS
  // =========================================================

  const getToken = () => {
    const candidates = [
      localStorage.getItem('accessToken'),
      localStorage.getItem('token'),
      localStorage.getItem('authToken')
    ];

    return candidates.find(token =>
      typeof token === 'string' &&
      token.trim() !== '' &&
      token !== 'undefined' &&
      token !== 'null'
    );
  };

  const normalizeRole = value => {
    if (typeof value !== 'string') return '';

    return value.trim().toLowerCase().replace(/[\s-]+/g, '_');
  };

  const getUserRole = currentUser => {
    if (!currentUser) {
      return normalizeRole(localStorage.getItem('userRole'));
    }

    const explicitRole =
      currentUser.role ||
      currentUser.userRole ||
      currentUser.user_role ||
      currentUser.userType ||
      currentUser.user_type ||
      currentUser.type;

    if (explicitRole) return normalizeRole(explicitRole);

    if (currentUser.is_parent === true || currentUser.isParent === true) {
      return 'parent';
    }

    if (currentUser.is_admin === true || currentUser.isAdmin === true) {
      return 'admin';
    }

    if (currentUser.is_tutor === true || currentUser.isTutor === true) {
      return 'tutor';
    }

    const roles = Array.isArray(currentUser.roles)
      ? currentUser.roles.map(normalizeRole)
      : [];

    if (roles.includes('parent')) return 'parent';
    if (roles.includes('admin')) return 'admin';
    if (roles.includes('tutor')) return 'tutor';

    const adminRole = normalizeRole(currentUser.admin_role);

    if (adminRole && adminRole !== 'none') return 'admin';

    return normalizeRole(localStorage.getItem('userRole')) || 'student';
  };

  const role = getUserRole(user);

  const isAdmin = role === 'admin' || role === 'administrator';
  const isTutor = role === 'tutor';
  const isParent = role === 'parent';

  const isActive = path => {
    if (path === '/') return location.pathname === '/';

    return (
      location.pathname === path ||
      location.pathname.startsWith(`${path}/`)
    );
  };

  const handleClick = () => {
    if (typeof playClick === 'function') playClick();
  };

  const closeAllMenus = () => {
    setUserMenuOpen(false);
    setLanguageOpen(false);
    setMobileMenuOpen(false);
  };

  // =========================================================
  // AUTHENTICATION
  // =========================================================

  useEffect(() => {
    let mounted = true;

    const loadUser = async () => {
      try {
        const token = getToken();

        if (!token) {
          if (mounted) {
            setUser(null);
            setIsAuthenticated(false);
          }
          return;
        }

        let storedUser = null;

        try {
          storedUser = authService.getStoredUser?.() || null;
        } catch (error) {
          console.warn('Unable to read stored user:', error);
        }

        if (storedUser && mounted) {
          setUser(storedUser);
          setIsAuthenticated(true);
        }

        try {
          const response = await authService.getCurrentUser();

          const currentUser =
            response?.user ||
            response?.data?.user ||
            response?.data ||
            response ||
            storedUser;

          if (mounted && currentUser) {
            setUser(currentUser);
            setIsAuthenticated(true);
          } else if (mounted) {
            setUser(null);
            setIsAuthenticated(false);
          }
        } catch (error) {
          console.error('Unable to verify current user:', error);

          if (mounted && storedUser) {
            setUser(storedUser);
            setIsAuthenticated(true);
          }
        }
      } finally {
        if (mounted) setLoadingUser(false);
      }
    };

    loadUser();

    const handleLogin = event => {
      const loggedInUser =
        event?.detail?.user ||
        event?.detail ||
        authService.getStoredUser?.();

      if (loggedInUser) {
        setUser(loggedInUser);
        setIsAuthenticated(true);
        setLoadingUser(false);
      } else {
        loadUser();
      }
    };

    const handleLogoutEvent = () => {
      setUser(null);
      setIsAuthenticated(false);
      closeAllMenus();
      setLoadingUser(false);
    };

    const handleStorageChange = event => {
      if (
        event.key === 'accessToken' ||
        event.key === 'token' ||
        event.key === 'authToken' ||
        event.key === 'user' ||
        event.key === 'userRole'
      ) {
        loadUser();
      }
    };

    window.addEventListener('auth:login', handleLogin);
    window.addEventListener('auth:logout', handleLogoutEvent);
    window.addEventListener('storage', handleStorageChange);

    return () => {
      mounted = false;

      window.removeEventListener('auth:login', handleLogin);
      window.removeEventListener('auth:logout', handleLogoutEvent);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const handleLogout = async () => {
    handleClick();
    closeAllMenus();

    try {
      await authService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      [
        'accessToken',
        'refreshToken',
        'token',
        'authToken',
        'user',
        'userRole'
      ].forEach(key => localStorage.removeItem(key));

      setUser(null);
      setIsAuthenticated(false);

      window.dispatchEvent(new Event('auth:logout'));
      navigate('/login');
    }
  };

  // =========================================================
  // NAVIGATION LINKS
  // =========================================================

  const studentLinks = [
    { label: 'Home', path: '/', icon: <Home size={17} /> },
    { label: 'Subjects', path: '/subjects', icon: <BookOpen size={17} /> },
    { label: 'Curriculum', path: '/curriculum', icon: <GraduationCap size={17} /> },
    { label: 'Tutors', path: '/tutors', icon: <Users size={17} /> },
    { label: 'Pricing', path: '/pricing', icon: <CreditCard size={17} /> },
    { label: 'Resources', path: '/resources', icon: <Library size={17} /> },
    { label: 'Our Mission', path: '/mission', icon: <Target size={17} /> }
  ];

  const tutorLinks = [
    { label: 'Home', path: '/', icon: <Home size={17} /> },
    { label: 'Dashboard', path: '/tutor/dashboard', icon: <LayoutDashboard size={17} /> },
    { label: 'Sessions', path: '/my-sessions', icon: <CalendarDays size={17} /> },
    { label: 'Resources', path: '/resources', icon: <Library size={17} /> }
  ];

  const adminLinks = [
    { label: 'Dashboard', path: '/admin/dashboard', icon: <LayoutDashboard size={17} /> },
    { label: 'Users', path: '/admin/users', icon: <Users size={17} /> },
    { label: 'Tutors', path: '/admin/tutors', icon: <GraduationCap size={17} /> },
    { label: 'Content', path: '/admin/content', icon: <FileText size={17} /> },
    { label: 'Payments', path: '/admin/payments', icon: <Wallet size={17} /> },
    { label: 'Analytics', path: '/admin/analytics', icon: <BarChart3 size={17} /> },
    { label: 'Settings', path: '/admin/settings', icon: <Settings size={17} /> }
  ];

  const navigationLinks = isAdmin
    ? adminLinks
    : isTutor
      ? tutorLinks
      : studentLinks;

  // =========================================================
  // ACCOUNT LINKS
  // =========================================================

  const getAccountLinks = () => {
    if (isAdmin) {
      return [
        { label: 'Admin Dashboard', path: '/admin/dashboard', icon: <LayoutDashboard size={17} /> },
        { label: 'Manage Users', path: '/admin/users', icon: <Users size={17} /> },
        { label: 'Activity Logs', path: '/admin/activity', icon: <Activity size={17} /> },
        { label: 'My Profile', path: '/admin/profile', icon: <User size={17} /> },
        { label: 'Account Settings', path: '/admin/settings', icon: <Settings size={17} /> }
      ];
    }

    if (isTutor) {
      return [
        { label: 'My Profile', path: '/tutor/profile', icon: <User size={17} /> },
        { label: 'Tutor Dashboard', path: '/tutor/dashboard', icon: <LayoutDashboard size={17} /> },
        { label: 'My Students', path: '/tutor/students', icon: <Users size={17} /> },
        { label: 'My Sessions', path: '/my-sessions', icon: <CalendarDays size={17} /> },
        { label: 'My Earnings', path: '/tutor/earnings', icon: <Wallet size={17} /> },
        { label: 'Account Settings', path: '/settings', icon: <Settings size={17} /> },
        { label: 'Help Centre', path: '/help', icon: <HelpCircle size={17} /> }
      ];
    }

    return [
      { label: 'My Profile', path: '/profile', icon: <User size={17} /> },
      { label: 'My Dashboard', path: '/dashboard', icon: <LayoutDashboard size={17} /> },
      { label: 'My Courses', path: '/my-courses', icon: <BookMarked size={17} /> },
      { label: 'My Sessions', path: '/my-sessions', icon: <CalendarDays size={17} /> },
      { label: 'Account Settings', path: '/settings', icon: <Settings size={17} /> },
      { label: 'Help Centre', path: '/help', icon: <HelpCircle size={17} /> }
    ];
  };

  // =========================================================
  // SEARCH
  // =========================================================

  const searchableItems = useMemo(() => {
    const items = [];

    const addItems = (collection, category, route) => {
      if (!Array.isArray(collection)) return;

      collection.forEach(item => {
        if (!item) return;

        const title =
          item.title ||
          item.name ||
          item.subject_name ||
          item.full_name;

        if (!title) return;

        items.push({
          title,
          category,
          path: item.slug
            ? `${route}/${item.slug}`
            : item.id
              ? `${route}/${item.id}`
              : route
        });
      });
    };

    // Search is independent of HomeDataContext.
    // Static navigation destinations remain searchable.
    addItems(studentLinks.map(link => ({
      title: link.label,
      path: link.path
    })), 'Page', '');

    return items;
  }, []);

  useEffect(() => {
    if (!searchOpen) return;

    const timer = setTimeout(() => {
      searchInputRef.current?.focus();
    }, 100);

    return () => clearTimeout(timer);
  }, [searchOpen]);

  useEffect(() => {
    const query = searchQuery.trim();

    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(() => {
      const results = searchableItems
        .filter(item =>
          item.title.toLowerCase().includes(query.toLowerCase())
        )
        .slice(0, 8);

      setSearchResults(results);
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery, searchableItems]);

  const openSearch = () => {
    handleClick();
    closeAllMenus();
    setSearchOpen(true);
    setSearchQuery('');
    setSearchResults([]);
  };

  const closeSearch = () => {
    setSearchOpen(false);
    setSearchQuery('');
    setSearchResults([]);
  };

  const handleSearchSubmit = event => {
    event.preventDefault();

    const query = searchQuery.trim();
    if (!query) return;

    closeSearch();
    navigate(`/search?q=${encodeURIComponent(query)}`);
  };

  // =========================================================
  // LANGUAGE
  // =========================================================

  const languageOptions = Object.values(languages || {});

  const handleLanguageChange = language => {
    handleClick();

    if (language?.code) {
      changeLanguage(language.code);
    }

    setLanguageOpen(false);
  };

  // =========================================================
  // MENU CONTROLS
  // =========================================================

  const toggleUserMenu = () => {
    handleClick();
    setUserMenuOpen(previous => !previous);
    setLanguageOpen(false);
  };

  const toggleLanguageMenu = () => {
    handleClick();
    setLanguageOpen(previous => !previous);
    setUserMenuOpen(false);
  };

  const toggleMobileMenu = () => {
    handleClick();
    setMobileMenuOpen(previous => !previous);
    setUserMenuOpen(false);
    setLanguageOpen(false);
  };

  // =========================================================
  // ROLE-BASED NAVBAR
  // =========================================================

  if (location.pathname.startsWith('/admin') && !isAdmin) {
    return null;
  }

  if (isParent && isAuthenticated) {
    return <ParentNavbar user={user} onLogout={handleLogout} />;
  }

  // =========================================================
  // USER DETAILS
  // =========================================================

  const userName =
    user?.full_name ||
    user?.name ||
    user?.first_name ||
    user?.username ||
    'My Account';

  const userEmail = user?.email || '';
  const userInitial = userName.charAt(0).toUpperCase();

  const avatarUrl =
    user?.avatar_url ||
    user?.profile_image ||
    user?.profile_picture ||
    user?.avatar ||
    '';

  const roleLabel = isAdmin
    ? 'Administrator'
    : isTutor
      ? 'Tutor'
      : 'Student';

  // =========================================================
  // RENDER
  // =========================================================

  return (
    <>
      <nav className="navbar">
        <div className="navbar-container">

          <Link to="/" className="logo" onClick={handleClick}>
            <div className="logo-icon">
              <img src={logo} alt="EduSpantech" className="logo-image" />
            </div>

            <div className="logo-content">
              <span className="logo-title">EduSpantech</span>
              <span className="logo-subtitle">
                Education for the love of your life
              </span>
            </div>
          </Link>

          <div className="navbar-links">
            {navigationLinks.map(link => (
              <Link
                key={link.path}
                to={link.path}
                className={[
                  isActive(link.path) ? 'active' : '',
                  isAdmin ? 'admin-nav-link' : '',
                  isTutor ? 'tutor-nav-link' : '',
                  !isAdmin && !isTutor ? 'student-nav-link' : ''
                ].filter(Boolean).join(' ')}
                onClick={handleClick}
              >
                <span className="nav-icon">{link.icon}</span>
                {link.label}
              </Link>
            ))}
          </div>

          <div className="navbar-actions">

            <button
              type="button"
              className="search-icon-button"
              aria-label="Search"
              onClick={openSearch}
            >
              <Search size={19} />
            </button>

            {isAuthenticated && (
              <NotificationBell
                isActive={
                  isActive('/notifications') ||
                  isActive('/admin/notifications')
                }
              />
            )}

            <div className="language-container">
              <button
                type="button"
                className={`language-button ${languageOpen ? 'active' : ''}`}
                onClick={toggleLanguageMenu}
                aria-expanded={languageOpen}
              >
                <Languages size={16} />

                <span className="language-code-label">
                  {currentLanguage?.toUpperCase?.() || 'EN'}
                </span>

                <ChevronDown
                  size={13}
                  className={`language-arrow ${languageOpen ? 'open' : ''}`}
                />
              </button>

              <div className={`language-dropdown ${languageOpen ? 'open' : ''}`}>
                {languageOptions.map(language => (
                  <button
                    type="button"
                    key={language.code}
                    className={`language-option ${
                      currentLanguage === language.code ? 'active' : ''
                    }`}
                    onClick={() => handleLanguageChange(language)}
                  >
                    <span className="lang-flag">{language.flag}</span>
                    <span className="lang-name">
                      {language.nativeName || language.name}
                    </span>
                    <span className="lang-code">
                      {language.code?.toUpperCase()}
                    </span>

                    {currentLanguage === language.code && (
                      <span className="lang-check">✓</span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {isAuthenticated && user ? (
              <div className="user-menu">
                <button
                  type="button"
                  className={`user-dropdown-toggle ${
                    userMenuOpen ? 'open' : ''
                  } ${
                    isAdmin
                      ? 'admin-dropdown'
                      : isTutor
                        ? 'tutor-dropdown'
                        : ''
                  }`}
                  onClick={toggleUserMenu}
                  aria-expanded={userMenuOpen}
                >
                  <div className="user-avatar-circle">
                    {avatarUrl ? (
                      <img
                        src={avatarUrl}
                        alt={userName}
                        className="user-avatar-img"
                      />
                    ) : (
                      <span className="user-avatar-initial">
                        {userInitial}
                      </span>
                    )}

                    {isAdmin && (
                      <span className="admin-badge-avatar">★</span>
                    )}

                    {isTutor && (
                      <span className="tutor-badge">✓</span>
                    )}

                    <span className="avatar-chevron">
                      <ChevronDown size={9} />
                    </span>
                  </div>

                  <span className="user-name">{userName}</span>
                </button>

                <div className={`user-dropdown ${userMenuOpen ? 'open' : ''}`}>
                  <div className="dropdown-header">
                    <div className="dropdown-user-info">
                      <div className="dropdown-avatar">
                        {avatarUrl ? (
                          <img
                            src={avatarUrl}
                            alt={userName}
                            className="dropdown-avatar-img"
                          />
                        ) : (
                          <span className="dropdown-avatar-initial">
                            {userInitial}
                          </span>
                        )}
                      </div>

                      <div className="dropdown-user-details">
                        <span className="dropdown-user-name">{userName}</span>
                        <span className="dropdown-user-email">{userEmail}</span>

                        <span
                          className={`dropdown-user-tier ${
                            isAdmin
                              ? 'admin-tier'
                              : isTutor
                                ? 'tutor-tier'
                                : ''
                          }`}
                        >
                          {roleLabel}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className={`dropdown-items ${
                    isAdmin ? 'admin-dropdown-items' : ''
                  }`}>
                    {getAccountLinks().map(item => (
                      <Link
                        key={item.path}
                        to={item.path}
                        className="dropdown-item"
                        onClick={() => {
                          handleClick();
                          closeAllMenus();
                        }}
                      >
                        <span className="dropdown-icon">{item.icon}</span>
                        {item.label}
                      </Link>
                    ))}

                    <div className="dropdown-divider" />

                    <button
                      type="button"
                      className="dropdown-item logout"
                      onClick={handleLogout}
                    >
                      <span className="dropdown-icon">
                        <LogOut size={17} />
                      </span>
                      Sign Out
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="auth-buttons">
                <Link to="/login" className="login-button" onClick={handleClick}>
                  Login
                </Link>

                <Link to="/register" className="signup-button" onClick={handleClick}>
                  Get Started
                </Link>
              </div>
            )}

            <button
              type="button"
              className="mobile-menu"
              onClick={toggleMobileMenu}
              aria-label="Open navigation menu"
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>

          </div>
        </div>
      </nav>

      {/* SEARCH OVERLAY */}

      {searchOpen && (
        <div className="mobile-menu-backdrop" onClick={closeSearch}>
          <div
            className="search-overlay-panel"
            onClick={event => event.stopPropagation()}
          >
            <div className="search-overlay-header">
              <h3>Search EduSpantech</h3>

              <button
                type="button"
                className="search-overlay-close"
                onClick={closeSearch}
                aria-label="Close search"
              >
                <X size={20} />
              </button>
            </div>

            <form className="search-overlay-form" onSubmit={handleSearchSubmit}>
              <Search size={20} />

              <input
                ref={searchInputRef}
                type="search"
                className="search-overlay-input"
                placeholder="Search subjects, tutors, resources..."
                value={searchQuery}
                onChange={event => setSearchQuery(event.target.value)}
              />
            </form>

            {searchResults.length > 0 && (
              <div className="search-overlay-results">
                {searchResults.map((result, index) => (
                  <Link
                    key={`${result.category}-${result.title}-${index}`}
                    to={result.path}
                    className="search-overlay-result"
                    onClick={closeSearch}
                  >
                    <div>
                      <div className="search-overlay-result-title">
                        {result.title}
                      </div>
                      <span>{result.category}</span>
                    </div>

                    <Search size={15} />
                  </Link>
                ))}
              </div>
            )}

            {searchQuery.trim().length >= 2 && searchResults.length === 0 && (
              <div className="search-overlay-empty">
                No matching results found.
              </div>
            )}

            <button
              type="button"
              className="search-overlay-submit"
              onClick={handleSearchSubmit}
              disabled={!searchQuery.trim()}
            >
              View all search results
            </button>
          </div>
        </div>
      )}

      {/* MOBILE MENU BACKDROP */}

      {mobileMenuOpen && (
        <div
          className="mobile-menu-backdrop"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* MOBILE MENU */}

      <div className={`mobile-menu-overlay ${
        mobileMenuOpen ? 'open' : ''
      }`}>
        <div
          className="mobile-menu-sheet"
          onClick={event => event.stopPropagation()}
        >
          <div className="mobile-menu-header">
            <span className="mobile-menu-title">Navigation</span>

            <button
              type="button"
              className="mobile-menu-close"
              onClick={() => setMobileMenuOpen(false)}
              aria-label="Close navigation"
            >
              <X size={20} />
            </button>
          </div>

          <div className="mobile-nav-links">
            {navigationLinks.map(link => (
              <Link
                key={link.path}
                to={link.path}
                className={[
                  isActive(link.path) ? 'active' : '',
                  isAdmin ? 'admin-nav-link' : '',
                  isTutor ? 'tutor-nav-link' : '',
                  !isAdmin && !isTutor ? 'student-nav-link' : ''
                ].filter(Boolean).join(' ')}
                onClick={() => {
                  handleClick();
                  setMobileMenuOpen(false);
                }}
              >
                <span className="mobile-nav-icon">{link.icon}</span>
                {link.label}
              </Link>
            ))}
          </div>

          {isAuthenticated && (
            <>
              <div className="mobile-divider" />

              <div className="mobile-section">
                <span className="mobile-section-label">My Account</span>

                {getAccountLinks().map(item => (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => {
                      handleClick();
                      setMobileMenuOpen(false);
                    }}
                  >
                    {item.icon}
                    {item.label}
                  </Link>
                ))}
              </div>

              <div className="mobile-divider" />

              <button
                type="button"
                className="mobile-logout"
                onClick={handleLogout}
              >
                <LogOut size={17} />
                Sign Out
              </button>
            </>
          )}

          {!isAuthenticated && (
            <>
              <div className="mobile-divider" />

              <div className="mobile-auth-buttons">
                <Link
                  to="/login"
                  className="mobile-login"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Login
                </Link>

                <Link
                  to="/register"
                  className="mobile-signup"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Get Started
                </Link>
              </div>
            </>
          )}

          {languageOptions.length > 0 && (
            <>
              <div className="mobile-divider" />

              <div className="mobile-section">
                <span className="mobile-section-label">Language</span>

                <div className="mobile-lang-grid">
                  {languageOptions.map(language => (
                    <button
                      type="button"
                      key={language.code}
                      className={`mobile-language-option ${
                        currentLanguage === language.code ? 'active' : ''
                      }`}
                      onClick={() => {
                        handleLanguageChange(language);
                        setMobileMenuOpen(false);
                      }}
                    >
                      <span>{language.flag}</span>
                      <span>{language.nativeName || language.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default Navbar;
