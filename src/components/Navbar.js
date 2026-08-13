import React, { useState, useEffect, useRef, useCallback } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  FiSearch,
  FiGlobe,
  FiChevronDown,
  FiMenu,
  FiX,
  FiUser,
  FiLogOut,
  FiSettings,
  FiBookOpen,
  FiAward,
  FiClock,
  FiHelpCircle
} from "react-icons/fi";
import { useHomeData } from "../hooks/useHomeData";
import { useLanguage } from "../context/LanguageContext";
import { useSound } from "../context/SoundContext";
import { authService } from "../services/authService";
import "./Navbar.css";

// ============================================
// IMPORT LOGO FROM ASSETS FOLDER
// ============================================
import logo from "../assets/EduspanLogo.png";

function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isLanguageOpen, setIsLanguageOpen] = useState(false);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [logoError, setLogoError] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const menuRef = useRef(null);
  const searchRef = useRef(null);
  const languageRef = useRef(null);
  const userDropdownRef = useRef(null);
  const searchInputRef = useRef(null);
  const { data, loading } = useHomeData();
  const { currentLanguage, changeLanguage, t, languages } = useLanguage();
  const { playClick } = useSound();

  // Check authentication status on mount and when location changes
  useEffect(() => {
    const checkAuth = async () => {
      const accessToken = localStorage.getItem('accessToken');
      if (accessToken) {
        setIsAuthenticated(true);
        try {
          const userData = await authService.getCurrentUserWithSubscription();
          if (userData) {
            setUser(userData);
          } else {
            const fallbackUser = await authService.getCurrentUser();
            if (fallbackUser) {
              setUser(fallbackUser);
            }
          }
        } catch (error) {
          console.error('Failed to get user:', error);
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('user');
          setIsAuthenticated(false);
          setUser(null);
        }
      } else {
        setIsAuthenticated(false);
        setUser(null);
      }
    };
    checkAuth();
  }, [location]);

  const handleLogout = () => {
    authService.logout();
    setIsAuthenticated(false);
    setUser(null);
    setIsUserDropdownOpen(false);
    playClick();
    navigate('/');
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
    playClick();
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  const toggleUserDropdown = () => {
    setIsUserDropdownOpen(!isUserDropdownOpen);
    playClick();
  };

  const closeUserDropdown = () => {
    setIsUserDropdownOpen(false);
  };

  const toggleSearch = () => {
    setIsSearchOpen(!isSearchOpen);
    setIsLanguageOpen(false);
    playClick();
    if (!isSearchOpen) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 150);
    }
  };

  const toggleLanguage = () => {
    setIsLanguageOpen(!isLanguageOpen);
    setIsSearchOpen(false);
    playClick();
  };

  const handleLanguageChange = (langCode) => {
    changeLanguage(langCode);
    setIsLanguageOpen(false);
    playClick();
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userDropdownRef.current && !userDropdownRef.current.contains(event.target)) {
        setIsUserDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (languageRef.current && !languageRef.current.contains(event.target)) {
        setIsLanguageOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setIsSearchOpen(false);
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    setIsMenuOpen(false);
    setIsUserDropdownOpen(false);
  }, [location]);

  const performSearch = useCallback((query) => {
    const term = query.toLowerCase().trim();
    const results = [];
    if (!data) return;

    if (data.subjects?.items) {
      data.subjects.items.forEach(subject => {
        if (
          subject.name.toLowerCase().includes(term) ||
          subject.description.toLowerCase().includes(term)
        ) {
          results.push({
            type: 'subject',
            title: subject.name,
            subtitle: subject.description,
            icon: subject.icon,
            path: `/subjects/${subject.name.toLowerCase().replace(/\s+/g, '-')}`
          });
        }
      });
    }

    if (data.tutors?.shifts) {
      data.tutors.shifts.forEach(shift => {
        shift.tutors?.forEach(tutor => {
          if (
            tutor.name.toLowerCase().includes(term) ||
            tutor.subjects?.some(s => s.toLowerCase().includes(term))
          ) {
            results.push({
              type: 'tutor',
              title: tutor.name,
              subtitle: `${tutor.tier} • ${shift.name}`,
              icon: '🧑‍🏫',
              path: `/tutors`
            });
          }
        });
      });
    }

    if (data.curriculum?.items) {
      data.curriculum.items.forEach(country => {
        if (
          country.country.toLowerCase().includes(term) ||
          country.subjects?.some(s => s.toLowerCase().includes(term))
        ) {
          results.push({
            type: 'curriculum',
            title: country.country,
            subtitle: country.description,
            icon: country.flag,
            path: `/curriculum/${country.country.toLowerCase().replace(/\s+/g, '-')}`
          });
        }
      });
    }

    if (data.resources?.vaults) {
      data.resources.vaults.forEach(vault => {
        if (
          vault.name.toLowerCase().includes(term) ||
          vault.description.toLowerCase().includes(term) ||
          vault.topics?.some(t => t.toLowerCase().includes(term))
        ) {
          results.push({
            type: 'resource',
            title: vault.name,
            subtitle: vault.description,
            icon: vault.icon,
            path: `/resources/${vault.name.toLowerCase().replace(/\s+/g, '-')}`
          });
        }
      });
    }

    setSearchResults(results.slice(0, 6));
  }, [data]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.trim().length >= 2) {
        performSearch(searchQuery);
        setShowSuggestions(true);
      } else {
        setSearchResults([]);
        setShowSuggestions(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, performSearch]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      playClick();
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
      setIsSearchOpen(false);
      setShowSuggestions(false);
    }
  };

  const handleResultClick = (path) => {
    playClick();
    navigate(path);
    setIsSearchOpen(false);
    setSearchQuery('');
    setShowSuggestions(false);
  };

  const navLinks = [
    { path: "/", label: t('nav.home') },
    { path: "/subjects", label: t('nav.subjects') },
    { path: "/curriculum", label: t('nav.curriculum') },
    { path: "/tutors", label: t('nav.tutors') },
    { path: "/pricing", label: t('nav.pricing') },
    { path: "/resources", label: t('nav.resources') }
  ];

  const isActive = (path) => location.pathname === path;

  const getTypeLabel = (type) => {
    const labels = {
      subject: 'Subject',
      tutor: 'Tutor',
      curriculum: 'Curriculum',
      resource: 'Resource'
    };
    return labels[type] || '';
  };

  const getUserName = () => {
    if (!user) return 'User';
    return user.name?.split(' ')[0] || user.name || 'User';
  };

  const getUserInitial = () => {
    if (!user || !user.name) return 'U';
    return user.name.charAt(0).toUpperCase();
  };

  const getUserTier = () => {
    if (!user) return 'Silver';
    if (user.tier) return user.tier;
    if (user.subscriptionTier) return user.subscriptionTier;
    if (user.subscription?.tier) return user.subscription.tier;
    return 'Silver';
  };

  // ============================================
  // RENDER LOGO WITH IMPORTED IMAGE
  // ============================================
  const renderLogo = () => {
    return (
      <div className="logo-icon">
        {!logoError ? (
          <img 
            src={logo} 
            alt="EduSpantech" 
            className="logo-image"
            onError={() => {
              console.log('Logo failed to load');
              setLogoError(true);
            }}
          />
        ) : (
          <span style={{ fontSize: '24px', fontWeight: '700', color: '#818cf8' }}>∑</span>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <header className="navbar" ref={menuRef}>
        <div className="navbar-container">
          <Link to="/" className="logo">
            {renderLogo()}
            <div className="logo-content">
              <span className="logo-title">EduSpantech</span>
              <span className="logo-subtitle">Global Mathematics Platform</span>
            </div>
          </Link>
        </div>
      </header>
    );
  }

  return (
    <header className="navbar" ref={menuRef}>
      <div className="navbar-container">
        <Link to="/" className="logo" onClick={closeMenu}>
          {renderLogo()}
          <div className="logo-content">
            <span className="logo-title">EduSpantech</span>
            <span className="logo-subtitle">{t('app.subtitle')}</span>
          </div>
        </Link>

        <nav className="navbar-links">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={isActive(link.path) ? "active" : ""}
              onClick={() => playClick()}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="navbar-actions">
          <div className="search-container" ref={searchRef}>
            <button 
              className={`search-button ${isSearchOpen ? 'active' : ''}`}
              aria-label="Search"
              onClick={toggleSearch}
            >
              <FiSearch />
            </button>
            
            <div className={`search-dropdown ${isSearchOpen ? 'open' : ''}`}>
              <form onSubmit={handleSearch} className="search-form">
                <div className="search-input-wrapper">
                  <input
                    ref={searchInputRef}
                    type="text"
                    className="search-input"
                    placeholder={t('nav.search')}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onFocus={() => {
                      if (searchQuery.trim().length >= 2 && searchResults.length > 0) {
                        setShowSuggestions(true);
                      }
                    }}
                  />
                </div>
                <button type="submit" className="search-submit">
                  <FiSearch />
                </button>
              </form>

              {showSuggestions && (
                <div className="search-results">
                  {searchResults.length > 0 ? (
                    searchResults.map((result, index) => (
                      <div
                        key={index}
                        className="search-result-item"
                        onClick={() => handleResultClick(result.path)}
                      >
                        <div className="result-icon">{result.icon}</div>
                        <div className="result-info">
                          <div className="result-title">{result.title}</div>
                          <div className="result-subtitle">{result.subtitle}</div>
                        </div>
                        <span className="result-type">{getTypeLabel(result.type)}</span>
                      </div>
                    ))
                  ) : (
                    searchQuery.trim().length >= 2 ? (
                      <div className="search-empty-state">
                        <span>🔍</span>
                        <p>No results found for "{searchQuery}"</p>
                      </div>
                    ) : (
                      <div className="search-empty-state">
                        <p>Type at least 2 characters to search</p>
                      </div>
                    )
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="language-container" ref={languageRef}>
            <button 
              className={`language-button ${isLanguageOpen ? 'active' : ''}`}
              aria-label="Language"
              onClick={toggleLanguage}
            >
              <FiGlobe />
              <span>{currentLanguage.toUpperCase()}</span>
              <FiChevronDown className={`language-arrow ${isLanguageOpen ? 'open' : ''}`} />
            </button>
            
            <div className={`language-dropdown ${isLanguageOpen ? 'open' : ''}`}>
              {Object.values(languages).map((lang) => (
                <button
                  key={lang.code}
                  className={`language-option ${currentLanguage === lang.code ? 'active' : ''}`}
                  onClick={() => handleLanguageChange(lang.code)}
                >
                  <span className="lang-flag">{lang.flag}</span>
                  <span className="lang-name">{lang.nativeName}</span>
                  <span className="lang-code">{lang.code.toUpperCase()}</span>
                  {currentLanguage === lang.code && (
                    <span className="lang-check">✓</span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* User Dropdown */}
          {isAuthenticated ? (
            <div className="user-menu" ref={userDropdownRef}>
              <button 
                className={`user-dropdown-toggle ${isUserDropdownOpen ? 'open' : ''}`}
                onClick={toggleUserDropdown}
                aria-label="User menu"
              >
                <div className="user-avatar-circle">
                  {user?.avatar ? (
                    <img src={user.avatar} alt="Avatar" className="user-avatar-img" />
                  ) : (
                    <span className="user-avatar-initial">{getUserInitial()}</span>
                  )}
                </div>
                <span className="user-name">{getUserName()}</span>
                <FiChevronDown className={`dropdown-arrow ${isUserDropdownOpen ? 'open' : ''}`} />
              </button>

              <div className={`user-dropdown ${isUserDropdownOpen ? 'open' : ''}`}>
                <div className="dropdown-header">
                  <div className="dropdown-user-info">
                    <div className="dropdown-avatar">
                      {user?.avatar ? (
                        <img src={user.avatar} alt="Avatar" className="dropdown-avatar-img" />
                      ) : (
                        <span className="dropdown-avatar-initial">{getUserInitial()}</span>
                      )}
                    </div>
                    <div className="dropdown-user-details">
                      <span className="dropdown-user-name">{user?.name || 'User'}</span>
                      <span className="dropdown-user-email">{user?.email || ''}</span>
                      <span className="dropdown-user-tier">🏅 {getUserTier()} Tier</span>
                    </div>
                  </div>
                </div>

                <div className="dropdown-items">
                  <Link to="/profile" className="dropdown-item" onClick={() => { closeUserDropdown(); playClick(); }}>
                    <FiUser className="dropdown-icon" />
                    <span>Profile</span>
                  </Link>
                  
                  <Link to="/settings" className="dropdown-item" onClick={() => { closeUserDropdown(); playClick(); }}>
                    <FiSettings className="dropdown-icon" />
                    <span>Settings</span>
                  </Link>

                  <Link to="/dashboard" className="dropdown-item" onClick={() => { closeUserDropdown(); playClick(); }}>
                    <FiBookOpen className="dropdown-icon" />
                    <span>Dashboard</span>
                  </Link>

                  {/* ===== MY COURSES - Now links to /my-courses ===== */}
                  <Link to="/my-courses" className="dropdown-item" onClick={() => { closeUserDropdown(); playClick(); }}>
                    <FiAward className="dropdown-icon" />
                    <span>My Courses</span>
                  </Link>

                  {/* ===== MY SESSIONS - Now links to /my-sessions ===== */}
                  <Link to="/my-sessions" className="dropdown-item" onClick={() => { closeUserDropdown(); playClick(); }}>
                    <FiClock className="dropdown-icon" />
                    <span>My Sessions</span>
                  </Link>

                  <Link to="/help" className="dropdown-item" onClick={() => { closeUserDropdown(); playClick(); }}>
                    <FiHelpCircle className="dropdown-icon" />
                    <span>Help & Support</span>
                  </Link>

                  <div className="dropdown-divider"></div>

                  <button className="dropdown-item logout" onClick={handleLogout}>
                    <FiLogOut className="dropdown-icon" />
                    <span>Logout</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <>
              <Link to="/login" className="login-button" onClick={() => playClick()}>
                {t('nav.login')}
              </Link>
              <Link to="/register" className="signup-button" onClick={() => playClick()}>
                {t('nav.register')}
              </Link>
            </>
          )}

          <button className="mobile-menu" onClick={toggleMenu} aria-label="Toggle menu">
            {isMenuOpen ? <FiX /> : <FiMenu />}
          </button>
        </div>
      </div>

      <div className={`mobile-menu-overlay ${isMenuOpen ? "open" : ""}`}>
        <nav className="mobile-nav-links">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={isActive(link.path) ? "active" : ""}
              onClick={() => { closeMenu(); playClick(); }}
            >
              {link.label}
            </Link>
          ))}
          
          <div className="mobile-language-section">
            <div className="mobile-language-label">🌐 Language</div>
            {Object.values(languages).map((lang) => (
              <button
                key={lang.code}
                className={`mobile-language-option ${currentLanguage === lang.code ? 'active' : ''}`}
                onClick={() => {
                  handleLanguageChange(lang.code);
                  closeMenu();
                }}
              >
                <span>{lang.flag}</span>
                <span>{lang.nativeName}</span>
              </button>
            ))}
          </div>

          <div className="mobile-search">
            <form onSubmit={handleSearch} className="mobile-search-form">
              <input
                type="text"
                className="mobile-search-input"
                placeholder={t('nav.search')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button type="submit" className="mobile-search-submit">
                <FiSearch />
              </button>
            </form>
          </div>
          
          <div className="mobile-actions">
            {isAuthenticated ? (
              <>
                <Link to="/profile" className="mobile-profile" onClick={() => { closeMenu(); playClick(); }}>
                  <FiUser /> {getUserName()}
                </Link>
                <Link to="/settings" className="mobile-settings" onClick={() => { closeMenu(); playClick(); }}>
                  <FiSettings /> Settings
                </Link>
                <Link to="/my-courses" className="mobile-my-courses" onClick={() => { closeMenu(); playClick(); }}>
                  <FiAward /> My Courses
                </Link>
                <Link to="/my-sessions" className="mobile-my-sessions" onClick={() => { closeMenu(); playClick(); }}>
                  <FiClock /> My Sessions
                </Link>
                <button className="mobile-logout" onClick={handleLogout}>
                  <FiLogOut /> Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="mobile-login" onClick={() => { closeMenu(); playClick(); }}>
                  {t('nav.login')}
                </Link>
                <Link to="/register" className="mobile-signup" onClick={() => { closeMenu(); playClick(); }}>
                  {t('nav.register')}
                </Link>
              </>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
}

export default Navbar;