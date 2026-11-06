// src/components/Navbar.js
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
  FiHelpCircle,
  FiCalendar,
  FiHome,
  FiBook,
  FiGrid,
  FiUsers,
  FiDollarSign,
  FiFolder,
  FiBarChart2,
  FiTrendingUp,
  FiPieChart,
  FiCreditCard,
  FiFileText
} from "react-icons/fi";
import { useHomeData } from "../hooks/useHomeData";
import { useLanguage } from "../context/LanguageContext";
import { useSound } from "../context/SoundContext";
import { authService } from "../services/authService";
import NotificationBell from "./NotificationBell";
import "./Navbar.css";

import logo from "../assets/EduspanLogo.png";

function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isLanguageOpen, setIsLanguageOpen] = useState(false);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isTutor, setIsTutor] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [logoError, setLogoError] = useState(false);

  const location = useLocation();
  const navigate = useNavigate();

  const menuRef = useRef(null);
  const languageRef = useRef(null);
  const userDropdownRef = useRef(null);
  const searchOverlayInputRef = useRef(null);

  const { data, loading } = useHomeData();
  const { currentLanguage, changeLanguage, t, languages } = useLanguage();
  const { playClick } = useSound();

  // ============================================
  // BODY SCROLL LOCK when mobile menu or search overlay is open
  // ============================================
  useEffect(() => {
    const lock = isMenuOpen || isSearchOpen;
    if (lock) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [isMenuOpen, isSearchOpen]);

  // ============================================
  // ROLE HELPERS
  // ============================================
  const checkIsTutor = (userData) => {
    if (!userData) return false;
    return (
      userData.is_tutor === true ||
      userData.role === "tutor" ||
      userData.role === "TUTOR"
    );
  };

  const checkIsAdmin = (userData) => {
    if (!userData) return false;
    return (
      userData.is_admin === true ||
      userData.is_super_admin === true ||
      userData.role === "admin" ||
      userData.role === "ADMIN"
    );
  };

  // ============================================
  // AUTH CHECK
  // ============================================
  useEffect(() => {
    const checkAuth = async () => {
      const accessToken = localStorage.getItem("accessToken");
      if (accessToken) {
        setIsAuthenticated(true);
        try {
          const userData = await authService.getCurrentUserWithSubscription();
          if (userData) {
            setUser(userData);
            setIsTutor(checkIsTutor(userData));
            setIsAdmin(checkIsAdmin(userData));
          } else {
            const fallbackUser = await authService.getCurrentUser();
            if (fallbackUser) {
              setUser(fallbackUser);
              setIsTutor(checkIsTutor(fallbackUser));
              setIsAdmin(checkIsAdmin(fallbackUser));
            }
          }
        } catch (error) {
          console.error("Failed to get user:", error);
          localStorage.removeItem("accessToken");
          localStorage.removeItem("refreshToken");
          localStorage.removeItem("user");
          localStorage.removeItem("userRole");
          setIsAuthenticated(false);
          setUser(null);
          setIsTutor(false);
          setIsAdmin(false);
        }
      } else {
        setIsAuthenticated(false);
        setUser(null);
        setIsTutor(false);
        setIsAdmin(false);
      }
    };
    checkAuth();
  }, [location]);

  // ============================================
  // HANDLERS
  // ============================================
  const handleLogout = () => {
    authService.logout();
    setIsAuthenticated(false);
    setUser(null);
    setIsTutor(false);
    setIsAdmin(false);
    setIsUserDropdownOpen(false);
    setIsMenuOpen(false);
    playClick();
    navigate("/");
  };

  const toggleMenu = () => {
    setIsMenuOpen((v) => !v);
    setIsSearchOpen(false);
    setIsLanguageOpen(false);
    setIsUserDropdownOpen(false);
    playClick();
  };

  const closeMenu = () => setIsMenuOpen(false);

  const toggleUserDropdown = () => {
    setIsUserDropdownOpen((v) => !v);
    setIsSearchOpen(false);
    setIsLanguageOpen(false);
    playClick();
  };

  const closeUserDropdown = () => setIsUserDropdownOpen(false);

  // Open the full-screen search overlay
  const openSearch = () => {
    setIsSearchOpen(true);
    setIsLanguageOpen(false);
    setIsUserDropdownOpen(false);
    setIsMenuOpen(false);
    playClick();
    setTimeout(() => searchOverlayInputRef.current?.focus(), 180);
  };

  const closeSearch = () => {
    setIsSearchOpen(false);
    setSearchQuery("");
    setSearchResults([]);
    setShowSuggestions(false);
  };

  const toggleLanguage = () => {
    setIsLanguageOpen((v) => !v);
    setIsUserDropdownOpen(false);
    playClick();
  };

  const handleLanguageChange = (langCode) => {
    changeLanguage(langCode);
    setIsLanguageOpen(false);
    playClick();
  };

  // ============================================
  // OUTSIDE CLICK HANDLERS (for dropdowns only)
  // ============================================
  useEffect(() => {
    const onDown = (e) => {
      if (userDropdownRef.current && !userDropdownRef.current.contains(e.target)) {
        setIsUserDropdownOpen(false);
      }
      if (languageRef.current && !languageRef.current.contains(e.target)) {
        setIsLanguageOpen(false);
      }
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("touchstart", onDown);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("touchstart", onDown);
    };
  }, []);

  // Close everything on route change
  useEffect(() => {
    setIsMenuOpen(false);
    setIsUserDropdownOpen(false);
    setIsLanguageOpen(false);
    closeSearch();
  }, [location]);

  // Escape closes everything
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") {
        setIsMenuOpen(false);
        setIsUserDropdownOpen(false);
        setIsLanguageOpen(false);
        closeSearch();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  // ============================================
  // SEARCH LOGIC
  // ============================================
  const performSearch = useCallback(
    (query) => {
      const term = query.toLowerCase().trim();
      const results = [];
      if (!data) return;

      if (data.subjects?.items) {
        data.subjects.items.forEach((subject) => {
          if (
            subject.name.toLowerCase().includes(term) ||
            subject.description.toLowerCase().includes(term)
          ) {
            results.push({
              type: "subject",
              title: subject.name,
              subtitle: subject.description,
              icon: subject.icon,
              path: `/subjects/${subject.name.toLowerCase().replace(/\s+/g, "-")}`
            });
          }
        });
      }

      if (data.tutors?.shifts) {
        data.tutors.shifts.forEach((shift) => {
          shift.tutors?.forEach((tutor) => {
            if (
              tutor.name.toLowerCase().includes(term) ||
              tutor.subjects?.some((s) => s.toLowerCase().includes(term))
            ) {
              results.push({
                type: "tutor",
                title: tutor.name,
                subtitle: `${tutor.tier} • ${shift.name}`,
                icon: "🧑‍🏫",
                path: `/tutors`
              });
            }
          });
        });
      }

      if (data.curriculum?.items) {
        data.curriculum.items.forEach((country) => {
          if (
            country.country.toLowerCase().includes(term) ||
            country.subjects?.some((s) => s.toLowerCase().includes(term))
          ) {
            results.push({
              type: "curriculum",
              title: country.country,
              subtitle: country.description,
              icon: country.flag,
              path: `/curriculum/${country.country.toLowerCase().replace(/\s+/g, "-")}`
            });
          }
        });
      }

      if (data.resources?.vaults) {
        data.resources.vaults.forEach((vault) => {
          if (
            vault.name.toLowerCase().includes(term) ||
            vault.description.toLowerCase().includes(term) ||
            vault.topics?.some((t) => t.toLowerCase().includes(term))
          ) {
            results.push({
              type: "resource",
              title: vault.name,
              subtitle: vault.description,
              icon: vault.icon,
              path: `/resources/${vault.name.toLowerCase().replace(/\s+/g, "-")}`
            });
          }
        });
      }

      setSearchResults(results.slice(0, 8));
    },
    [data]
  );

  useEffect(() => {
    if (!isSearchOpen) return;
    const timer = setTimeout(() => {
      if (searchQuery.trim().length >= 2) {
        performSearch(searchQuery);
        setShowSuggestions(true);
      } else {
        setSearchResults([]);
        setShowSuggestions(false);
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [searchQuery, performSearch, isSearchOpen]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      playClick();
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      closeSearch();
    }
  };

  const handleResultClick = (path) => {
    playClick();
    navigate(path);
    closeSearch();
  };

  // ============================================
  // NAV LINKS BY ROLE
  // ============================================
  const adminNavLinks = [
    { path: "/admin/dashboard", label: "Dashboard", icon: <FiPieChart /> },
    { path: "/admin/users", label: "Users", icon: <FiUsers /> },
    { path: "/admin/tutors", label: "Tutors", icon: <FiUsers /> },
    { path: "/admin/content", label: "Content", icon: <FiBook /> },
    { path: "/admin/payments", label: "Payments", icon: <FiCreditCard /> },
    { path: "/admin/analytics", label: "Analytics", icon: <FiBarChart2 /> },
    { path: "/admin/settings", label: "Settings", icon: <FiSettings /> }
  ];

  const tutorNavLinks = [
    { path: "/", label: "Home", icon: <FiHome /> },
    { path: "/tutor/dashboard", label: "Dashboard", icon: <FiBarChart2 /> },
    { path: "/my-sessions", label: "Sessions", icon: <FiCalendar /> },
    { path: "/resources", label: "Resources", icon: <FiFolder /> }
  ];

  const studentNavLinks = [
    { path: "/", label: "Home", icon: <FiHome /> },
    { path: "/subjects", label: "Subjects", icon: <FiBook /> },
    { path: "/curriculum", label: "Curriculum", icon: <FiGrid /> },
    { path: "/tutors", label: "Tutors", icon: <FiUsers /> },
    { path: "/pricing", label: "Pricing", icon: <FiDollarSign /> },
    { path: "/resources", label: "Resources", icon: <FiFolder /> },
    { path: "/timetable", label: "Timetable", icon: <FiCalendar /> }
  ];

  const baseNavLinks = [
    { path: "/", label: "Home", icon: <FiHome /> },
    { path: "/subjects", label: "Subjects", icon: <FiBook /> },
    { path: "/curriculum", label: "Curriculum", icon: <FiGrid /> },
    { path: "/tutors", label: "Tutors", icon: <FiUsers /> },
    { path: "/pricing", label: "Pricing", icon: <FiDollarSign /> },
    { path: "/resources", label: "Resources", icon: <FiFolder /> }
  ];

  let navLinks = baseNavLinks;
  if (isAdmin) navLinks = adminNavLinks;
  else if (isTutor) navLinks = tutorNavLinks;
  else if (isAuthenticated) navLinks = studentNavLinks;

  const showSearch = !isAdmin;
  const isActive = (path) => location.pathname === path;

  const getTypeLabel = (type) => {
    const labels = {
      subject: "Subject",
      tutor: "Tutor",
      curriculum: "Curriculum",
      resource: "Resource"
    };
    return labels[type] || "";
  };

  const getUserName = () => {
    if (!user) return "User";
    return user.name?.split(" ")[0] || user.name || "User";
  };

  const getUserInitial = () => {
    if (!user || !user.name) return "U";
    return user.name.charAt(0).toUpperCase();
  };

  const getUserTier = () => {
    if (!user) return "Silver";
    if (user.tier) return user.tier;
    if (user.subscriptionTier) return user.subscriptionTier;
    if (user.subscription?.tier) return user.subscription.tier;
    return "Silver";
  };

  const getAvatarImage = () => user?.avatar || null;

  const renderLogo = () => (
    <div className="logo-icon">
      {!logoError ? (
        <img
          src={logo}
          alt="EduSpantech"
          className="logo-image"
          onError={() => setLogoError(true)}
        />
      ) : (
        <span style={{ fontSize: "20px", fontWeight: 700, color: "#818cf8" }}>∑</span>
      )}
    </div>
  );

  const isAdminRoute = location.pathname.startsWith("/admin");

  if (loading) {
    return (
      <header className="navbar" ref={menuRef}>
        <div className="navbar-container">
          <Link to="/" className="logo">
            {renderLogo()}
            <div className="logo-content">
              <span className="logo-title">EduSpantech</span>
              <span className="logo-subtitle">Global Education Platform</span>
            </div>
          </Link>
        </div>
      </header>
    );
  }

  if (isAdminRoute) return null;

  // ============================================
  // RENDER
  // ============================================
  return (
    <>
      <header className={`navbar ${isAdmin ? "admin-navbar" : ""}`} ref={menuRef}>
        <div className="navbar-container">
          {/* ===== LOGO ===== */}
          <Link
            to={isAdmin ? "/admin/dashboard" : "/"}
            className="logo"
            onClick={closeMenu}
          >
            {renderLogo()}
            <div className="logo-content">
              <span className="logo-title">EduSpantech</span>
              <span className="logo-subtitle">
                {isAdmin ? "Admin Panel" : t("app.subtitle") || "Global Education Platform"}
              </span>
            </div>
            {isAdmin && <span className="admin-badge">ADMIN</span>}
          </Link>

          {/* ===== DESKTOP NAV LINKS ===== */}
          <nav className="navbar-links">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`${isActive(link.path) ? "active" : ""} ${
                  isAdmin ? "admin-nav-link" : isTutor ? "tutor-nav-link" : "student-nav-link"
                }`}
                onClick={() => playClick()}
              >
                {link.icon && <span className="nav-icon">{link.icon}</span>}
                {link.label}
              </Link>
            ))}
          </nav>

          {/* ===== ACTIONS ===== */}
          <div className="navbar-actions">
            {/* Search — SMALL ICON ONLY, opens full overlay */}
            {showSearch && (
              <button
                type="button"
                className="search-icon-button"
                aria-label="Open search"
                onClick={openSearch}
              >
                <FiSearch />
              </button>
            )}

            {/* Language */}
            <div className="language-container" ref={languageRef}>
              <button
                className={`language-button ${isLanguageOpen ? "active" : ""}`}
                aria-label="Language"
                aria-expanded={isLanguageOpen}
                onClick={toggleLanguage}
              >
                <FiGlobe />
                <span className="language-code-label">{currentLanguage.toUpperCase()}</span>
                <FiChevronDown className={`language-arrow ${isLanguageOpen ? "open" : ""}`} />
              </button>

              <div className={`language-dropdown ${isLanguageOpen ? "open" : ""}`}>
                {Object.values(languages).map((lang) => (
                  <button
                    key={lang.code}
                    className={`language-option ${currentLanguage === lang.code ? "active" : ""}`}
                    onClick={() => handleLanguageChange(lang.code)}
                  >
                    <span className="lang-flag">{lang.flag}</span>
                    <span className="lang-name">{lang.nativeName}</span>
                    <span className="lang-code">{lang.code.toUpperCase()}</span>
                    {currentLanguage === lang.code && <span className="lang-check">✓</span>}
                  </button>
                ))}
              </div>
            </div>

            {/* Notifications */}
            {isAuthenticated && <NotificationBell />}

            {/* User OR Login/Register */}
            {isAuthenticated ? (
              <div className="user-menu" ref={userDropdownRef}>
                <button
                  className={`user-dropdown-toggle ${isUserDropdownOpen ? "open" : ""} ${
                    isAdmin ? "admin-dropdown" : isTutor ? "tutor-dropdown" : "student-dropdown"
                  }`}
                  onClick={toggleUserDropdown}
                  aria-label="User menu"
                  aria-expanded={isUserDropdownOpen}
                >
                  <div
                    className="user-avatar-circle"
                    style={{
                      background: isAdmin
                        ? "linear-gradient(135deg, #f59e0b, #d97706)"
                        : isTutor
                        ? "linear-gradient(135deg, #059669, #10b981)"
                        : "linear-gradient(135deg, #4f46e5, #7c3aed)"
                    }}
                  >
                    {getAvatarImage() ? (
                      <img src={getAvatarImage()} alt="Avatar" className="user-avatar-img" />
                    ) : (
                      <span className="user-avatar-initial">{getUserInitial()}</span>
                    )}
                    {/* Role badge */}
                    {isAdmin && (
                      <span className="admin-badge-avatar" title="Admin">👑</span>
                    )}
                    {isTutor && !isAdmin && (
                      <span className="tutor-badge" title="Tutor">👨‍🏫</span>
                    )}
                    {/* ✅ NEW: Chevron badge at bottom-right of avatar */}
                    <span className="avatar-chevron" aria-hidden="true">
                      <FiChevronDown />
                    </span>
                  </div>
                  <span className="user-name">{getUserName()}</span>
                </button>

                <div className={`user-dropdown ${isUserDropdownOpen ? "open" : ""}`}>
                  <div className="dropdown-header">
                    <div className="dropdown-user-info">
                      <div
                        className="dropdown-avatar"
                        style={{
                          background: isAdmin
                            ? "linear-gradient(135deg, #f59e0b, #d97706)"
                            : isTutor
                            ? "linear-gradient(135deg, #059669, #10b981)"
                            : "linear-gradient(135deg, #4f46e5, #7c3aed)"
                        }}
                      >
                        {getAvatarImage() ? (
                          <img src={getAvatarImage()} alt="Avatar" className="dropdown-avatar-img" />
                        ) : (
                          <span className="dropdown-avatar-initial">{getUserInitial()}</span>
                        )}
                      </div>
                      <div className="dropdown-user-details">
                        <span className="dropdown-user-name">{user?.name || "User"}</span>
                        <span className="dropdown-user-email">{user?.email || ""}</span>
                        {isAdmin ? (
                          <span className="dropdown-user-tier admin-tier">👑 Admin</span>
                        ) : isTutor ? (
                          <span className="dropdown-user-tier tutor-tier">👨‍🏫 Tutor Account</span>
                        ) : (
                          <span className="dropdown-user-tier">🏅 {getUserTier()} Tier</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* ADMIN DROPDOWN */}
                  {isAdmin && (
                    <div className="dropdown-items admin-dropdown-items">
                      <Link to="/admin/dashboard" className="dropdown-item" onClick={() => { closeUserDropdown(); playClick(); }}>
                        <FiPieChart className="dropdown-icon" /><span>Dashboard</span>
                      </Link>
                      <Link to="/admin/users" className="dropdown-item" onClick={() => { closeUserDropdown(); playClick(); }}>
                        <FiUsers className="dropdown-icon" /><span>Manage Users</span>
                      </Link>
                      <Link to="/admin/tutors" className="dropdown-item" onClick={() => { closeUserDropdown(); playClick(); }}>
                        <FiUsers className="dropdown-icon" /><span>Manage Tutors</span>
                      </Link>
                      <Link to="/admin/content" className="dropdown-item" onClick={() => { closeUserDropdown(); playClick(); }}>
                        <FiBook className="dropdown-icon" /><span>Content Management</span>
                      </Link>
                      <Link to="/admin/payments" className="dropdown-item" onClick={() => { closeUserDropdown(); playClick(); }}>
                        <FiCreditCard className="dropdown-icon" /><span>Payments</span>
                      </Link>
                      <Link to="/admin/analytics" className="dropdown-item" onClick={() => { closeUserDropdown(); playClick(); }}>
                        <FiBarChart2 className="dropdown-icon" /><span>Analytics</span>
                      </Link>
                      <Link to="/admin/settings" className="dropdown-item" onClick={() => { closeUserDropdown(); playClick(); }}>
                        <FiSettings className="dropdown-icon" /><span>System Settings</span>
                      </Link>
                      <Link to="/admin/activity" className="dropdown-item" onClick={() => { closeUserDropdown(); playClick(); }}>
                        <FiFileText className="dropdown-icon" /><span>Audit Log</span>
                      </Link>
                      <div className="dropdown-divider"></div>
                      <Link to="/admin/profile" className="dropdown-item" onClick={() => { closeUserDropdown(); playClick(); }}>
                        <FiUser className="dropdown-icon" /><span>My Profile</span>
                      </Link>
                      <button className="dropdown-item logout" onClick={handleLogout}>
                        <FiLogOut className="dropdown-icon" /><span>Logout</span>
                      </button>
                    </div>
                  )}

                  {/* STUDENT DROPDOWN */}
                  {!isAdmin && !isTutor && (
                    <div className="dropdown-items">
                      <Link to="/profile" className="dropdown-item" onClick={() => { closeUserDropdown(); playClick(); }}>
                        <FiUser className="dropdown-icon" /><span>Profile</span>
                      </Link>
                      <Link to="/settings" className="dropdown-item" onClick={() => { closeUserDropdown(); playClick(); }}>
                        <FiSettings className="dropdown-icon" /><span>Settings</span>
                      </Link>
                      <Link to="/dashboard" className="dropdown-item" onClick={() => { closeUserDropdown(); playClick(); }}>
                        <FiBookOpen className="dropdown-icon" /><span>Dashboard</span>
                      </Link>
                      <Link to="/my-courses" className="dropdown-item" onClick={() => { closeUserDropdown(); playClick(); }}>
                        <FiAward className="dropdown-icon" /><span>My Courses</span>
                      </Link>
                      <Link to="/my-sessions" className="dropdown-item" onClick={() => { closeUserDropdown(); playClick(); }}>
                        <FiClock className="dropdown-icon" /><span>My Sessions</span>
                      </Link>
                      <Link to="/timetable" className="dropdown-item" onClick={() => { closeUserDropdown(); playClick(); }}>
                        <FiCalendar className="dropdown-icon" /><span>Timetable</span>
                      </Link>
                      <Link to="/help" className="dropdown-item" onClick={() => { closeUserDropdown(); playClick(); }}>
                        <FiHelpCircle className="dropdown-icon" /><span>Help &amp; Support</span>
                      </Link>
                      <div className="dropdown-divider"></div>
                      <button className="dropdown-item logout" onClick={handleLogout}>
                        <FiLogOut className="dropdown-icon" /><span>Logout</span>
                      </button>
                    </div>
                  )}

                  {/* TUTOR DROPDOWN */}
                  {!isAdmin && isTutor && (
                    <div className="dropdown-items tutor-dropdown-items">
                      <Link to="/profile" className="dropdown-item" onClick={() => { closeUserDropdown(); playClick(); }}>
                        <FiUser className="dropdown-icon" /><span>My Profile</span>
                      </Link>
                      <Link to="/settings" className="dropdown-item" onClick={() => { closeUserDropdown(); playClick(); }}>
                        <FiSettings className="dropdown-icon" /><span>Settings</span>
                      </Link>
                      <Link to="/tutor/dashboard" className="dropdown-item" onClick={() => { closeUserDropdown(); playClick(); }}>
                        <FiBarChart2 className="dropdown-icon" /><span>Dashboard</span>
                      </Link>
                      <Link to="/tutor/students" className="dropdown-item" onClick={() => { closeUserDropdown(); playClick(); }}>
                        <FiUsers className="dropdown-icon" /><span>My Students</span>
                      </Link>
                      <Link to="/tutor/earnings" className="dropdown-item" onClick={() => { closeUserDropdown(); playClick(); }}>
                        <FiTrendingUp className="dropdown-icon" /><span>Earnings</span>
                      </Link>
                      <Link to="/help" className="dropdown-item" onClick={() => { closeUserDropdown(); playClick(); }}>
                        <FiHelpCircle className="dropdown-icon" /><span>Help &amp; Support</span>
                      </Link>
                      <div className="dropdown-divider"></div>
                      <button className="dropdown-item logout" onClick={handleLogout}>
                        <FiLogOut className="dropdown-icon" /><span>Logout</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="auth-buttons">
                <Link to="/login" className="login-button" onClick={() => playClick()}>
                  {t("nav.login") || "Login"}
                </Link>
                <Link to="/register" className="signup-button" onClick={() => playClick()}>
                  {t("nav.register") || "Sign Up"}
                </Link>
              </div>
            )}

            {/* Mobile burger */}
            <button
              className="mobile-menu"
              onClick={toggleMenu}
              aria-label="Toggle menu"
              aria-expanded={isMenuOpen}
            >
              {isMenuOpen ? <FiX /> : <FiMenu />}
            </button>
          </div>
        </div>
      </header>

      {/* ============================================
          FULL-SCREEN SEARCH OVERLAY
          Rendered OUTSIDE header so it never affects layout.
          ============================================ */}
      {isSearchOpen && (
        <div className="search-overlay" role="dialog" aria-modal="true" aria-label="Search">
          <div className="search-overlay-backdrop" onClick={closeSearch} />
          <div className="search-overlay-panel">
            <div className="search-overlay-header">
              <form onSubmit={handleSearch} className="search-overlay-form">
                <FiSearch className="search-overlay-icon" />
                <input
                  ref={searchOverlayInputRef}
                  type="text"
                  className="search-overlay-input"
                  placeholder={t("nav.search") || "Search subjects, tutors, resources…"}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                  <button
                    type="button"
                    className="search-overlay-clear"
                    aria-label="Clear"
                    onClick={() => {
                      setSearchQuery("");
                      setSearchResults([]);
                      setShowSuggestions(false);
                      searchOverlayInputRef.current?.focus();
                    }}
                  >
                    <FiX />
                  </button>
                )}
              </form>
              <button
                type="button"
                className="search-overlay-close"
                aria-label="Close search"
                onClick={closeSearch}
              >
                <FiX />
              </button>
            </div>

            <div className="search-overlay-results">
              {showSuggestions && searchResults.length > 0 ? (
                searchResults.map((result, index) => (
                  <div
                    key={index}
                    className="search-overlay-result"
                    onClick={() => handleResultClick(result.path)}
                  >
                    <div className="search-overlay-result-icon">{result.icon}</div>
                    <div className="search-overlay-result-info">
                      <div className="search-overlay-result-title">{result.title}</div>
                      <div className="search-overlay-result-subtitle">{result.subtitle}</div>
                    </div>
                    <span className="search-overlay-result-type">{getTypeLabel(result.type)}</span>
                  </div>
                ))
              ) : searchQuery.trim().length >= 2 ? (
                <div className="search-overlay-empty">
                  <span>🔍</span>
                  <p>No results found for "{searchQuery}"</p>
                </div>
              ) : (
                <div className="search-overlay-hint">
                  <span>🔍</span>
                  <p>Type at least 2 characters to search</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ============================================
          MOBILE MENU BACKDROP + SHEET
          ============================================ */}
      {isMenuOpen && (
        <div
          className="mobile-menu-backdrop"
          onClick={closeMenu}
          aria-hidden="true"
        />
      )}
      <div
        className={`mobile-menu-overlay ${isMenuOpen ? "open" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-hidden={!isMenuOpen}
      >
        <div className="mobile-menu-sheet">
          <div className="mobile-menu-header">
            <span className="mobile-menu-title">
              {isAdmin ? "Admin Menu" : isTutor ? "Tutor Menu" : "Menu"}
            </span>
            <button
              className="mobile-menu-close"
              onClick={closeMenu}
              aria-label="Close menu"
            >
              <FiX />
            </button>
          </div>

          <nav className="mobile-nav-links">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={isActive(link.path) ? "active" : ""}
                onClick={() => { closeMenu(); playClick(); }}
              >
                {link.icon && <span className="mobile-nav-icon">{link.icon}</span>}
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="mobile-divider"></div>

          {isAuthenticated && !isAdmin && !isTutor && (
            <div className="mobile-section">
              <div className="mobile-section-label">Account</div>
              <Link to="/profile" onClick={() => { closeMenu(); playClick(); }}>
                <FiUser /> Profile
              </Link>
              <Link to="/settings" onClick={() => { closeMenu(); playClick(); }}>
                <FiSettings /> Settings
              </Link>
              <Link to="/dashboard" onClick={() => { closeMenu(); playClick(); }}>
                <FiBookOpen /> Dashboard
              </Link>
              <Link to="/my-courses" onClick={() => { closeMenu(); playClick(); }}>
                <FiAward /> My Courses
              </Link>
              <Link to="/my-sessions" onClick={() => { closeMenu(); playClick(); }}>
                <FiClock /> My Sessions
              </Link>
              <Link to="/timetable" onClick={() => { closeMenu(); playClick(); }}>
                <FiCalendar /> Timetable
              </Link>
              <Link to="/help" onClick={() => { closeMenu(); playClick(); }}>
                <FiHelpCircle /> Help &amp; Support
              </Link>
            </div>
          )}

          {isAuthenticated && !isAdmin && isTutor && (
            <div className="mobile-section">
              <div className="mobile-section-label">Tutor Tools</div>
              <Link to="/profile" onClick={() => { closeMenu(); playClick(); }}>
                <FiUser /> My Profile
              </Link>
              <Link to="/settings" onClick={() => { closeMenu(); playClick(); }}>
                <FiSettings /> Settings
              </Link>
              <Link to="/tutor/dashboard" onClick={() => { closeMenu(); playClick(); }}>
                <FiBarChart2 /> Dashboard
              </Link>
              <Link to="/tutor/students" onClick={() => { closeMenu(); playClick(); }}>
                <FiUsers /> My Students
              </Link>
              <Link to="/tutor/earnings" onClick={() => { closeMenu(); playClick(); }}>
                <FiTrendingUp /> Earnings
              </Link>
              <Link to="/help" onClick={() => { closeMenu(); playClick(); }}>
                <FiHelpCircle /> Help
              </Link>
            </div>
          )}

          {isAdmin && (
            <div className="mobile-section">
              <div className="mobile-section-label">Admin</div>
              <Link to="/admin/dashboard" onClick={() => { closeMenu(); playClick(); }}>
                <FiPieChart /> Dashboard
              </Link>
              <Link to="/admin/users" onClick={() => { closeMenu(); playClick(); }}>
                <FiUsers /> Manage Users
              </Link>
              <Link to="/admin/tutors" onClick={() => { closeMenu(); playClick(); }}>
                <FiUsers /> Manage Tutors
              </Link>
              <Link to="/admin/content" onClick={() => { closeMenu(); playClick(); }}>
                <FiBook /> Content
              </Link>
              <Link to="/admin/payments" onClick={() => { closeMenu(); playClick(); }}>
                <FiCreditCard /> Payments
              </Link>
              <Link to="/admin/analytics" onClick={() => { closeMenu(); playClick(); }}>
                <FiBarChart2 /> Analytics
              </Link>
              <Link to="/admin/settings" onClick={() => { closeMenu(); playClick(); }}>
                <FiSettings /> Settings
              </Link>
              <Link to="/admin/activity" onClick={() => { closeMenu(); playClick(); }}>
                <FiFileText /> Audit Log
              </Link>
            </div>
          )}

          <div className="mobile-divider"></div>
          <div className="mobile-section">
            <div className="mobile-section-label">🌐 Language</div>
            <div className="mobile-lang-grid">
              {Object.values(languages).map((lang) => (
                <button
                  key={lang.code}
                  className={`mobile-language-option ${currentLanguage === lang.code ? "active" : ""}`}
                  onClick={() => { handleLanguageChange(lang.code); closeMenu(); }}
                >
                  <span>{lang.flag}</span>
                  <span>{lang.nativeName}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="mobile-divider"></div>
          <div className="mobile-section">
            {isAuthenticated ? (
              <button className="mobile-logout" onClick={handleLogout}>
                <FiLogOut /> Logout
              </button>
            ) : (
              <div className="mobile-auth-buttons">
                <Link to="/login" className="mobile-login" onClick={() => { closeMenu(); playClick(); }}>
                  {t("nav.login") || "Login"}
                </Link>
                <Link to="/register" className="mobile-signup" onClick={() => { closeMenu(); playClick(); }}>
                  {t("nav.register") || "Sign Up"}
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

export default Navbar;