
import React, { useState, useEffect, useRef, useCallback } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Search, Globe, ChevronDown, Menu, X, User, LogOut, Settings,
  BookOpen, Award, Clock, HelpCircle, Home, Book, LayoutGrid,
  Users, DollarSign, Folder, BarChart2, TrendingUp, PieChart,
  CreditCard, FileText, Calendar, Target
} from "lucide-react";

import { useHomeData } from "../hooks/useHomeData";
import { useLanguage } from "../context/LanguageContext";
import { useSound } from "../context/SoundContext";
import { authService } from "../services/authService";
import NotificationBell from "./NotificationBell";
import "./Navbar.css";

import logo from "../assets/EduspanLogo.png";

// Authentication helpers
const hasAuthToken = () => Boolean(
  localStorage.getItem("accessToken") ||
  localStorage.getItem("token") ||
  localStorage.getItem("authToken")
);

const normalizeRole = (value) =>
  String(value || "").trim().toLowerCase();

const checkIsTutor = (userData) => {
  if (!userData) return false;

  return (
    userData.is_tutor === true ||
    userData.is_tutor === 1 ||
    normalizeRole(userData.is_tutor) === "true" ||
    ["tutor", "instructor"].includes(normalizeRole(userData.role))
  );
};

const checkIsAdmin = (userData) => {
  if (!userData) return false;

  return (
    userData.is_admin === true ||
    userData.is_admin === 1 ||
    userData.is_super_admin === true ||
    userData.is_super_admin === 1 ||
    ["true", "1"].includes(normalizeRole(userData.is_admin)) ||
    ["true", "1"].includes(normalizeRole(userData.is_super_admin)) ||
    ["admin", "super_admin"].includes(normalizeRole(userData.role))
  );
};

function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isLanguageOpen, setIsLanguageOpen] = useState(false);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const [user, setUser] = useState(() => authService.getStoredUser());
  const [isAuthenticated, setIsAuthenticated] = useState(() => hasAuthToken());

  const [isTutor, setIsTutor] = useState(() =>
    checkIsTutor(authService.getStoredUser())
  );

  const [isAdmin, setIsAdmin] = useState(() =>
    checkIsAdmin(authService.getStoredUser())
  );

  const [logoError, setLogoError] = useState(false);

  const location = useLocation();
  const navigate = useNavigate();

  const menuRef = useRef(null);
  const languageRef = useRef(null);
  const userDropdownRef = useRef(null);
  const searchOverlayInputRef = useRef(null);

  // Homepage data is used for search suggestions only.
  // It must never determine whether the navbar is rendered.
  const { data } = useHomeData();

  const { currentLanguage, changeLanguage, t, languages } = useLanguage();
  const { playClick } = useSound();

  const applyAuthenticatedUser = useCallback((userData) => {
    if (!userData) {
      setUser(null);
      setIsAuthenticated(false);
      setIsTutor(false);
      setIsAdmin(false);
      return;
    }

    const admin = checkIsAdmin(userData);
    const tutor = !admin && checkIsTutor(userData);

    setUser(userData);
    setIsAuthenticated(true);
    setIsAdmin(admin);
    setIsTutor(tutor);
  }, []);

  // Resolve authentication and role from the backend.
  // The cancellation guard prevents stale requests from overwriting
  // newer authentication state after navigation.
  useEffect(() => {
    let cancelled = false;

    const checkAuth = async () => {
      if (!hasAuthToken()) {
        if (!cancelled) applyAuthenticatedUser(null);
        return;
      }

      try {
        const userData =
          await authService.getCurrentUserWithSubscription();

        if (cancelled) return;

        if (userData) {
          applyAuthenticatedUser(userData);
        } else {
          applyAuthenticatedUser(null);
        }
      } catch (error) {
        if (cancelled) return;

        console.error("Navbar authentication error:", error);
        applyAuthenticatedUser(null);
      }
    };

    checkAuth();

    return () => {
      cancelled = true;
    };
  }, [location.pathname, applyAuthenticatedUser]);

  // Respond to authentication changes made elsewhere in the application.
  useEffect(() => {
    const handleLogout = () => {
      applyAuthenticatedUser(null);
      setIsUserDropdownOpen(false);
      setIsMenuOpen(false);
    };

    const handleStorageChange = (event) => {
      if (
        event.key === "accessToken" ||
        event.key === "token" ||
        event.key === "authToken" ||
        event.key === "user"
      ) {
        if (!hasAuthToken()) {
          applyAuthenticatedUser(null);
        }
      }
    };

    window.addEventListener("auth:logout", handleLogout);
    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener("auth:logout", handleLogout);
      window.removeEventListener("storage", handleStorageChange);
    };
  }, [applyAuthenticatedUser]);

  // Prevent background scrolling when overlays are open.
  useEffect(() => {
    const lock = isMenuOpen || isSearchOpen;

    if (lock) {
      const previousOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";

      return () => {
        document.body.style.overflow = previousOverflow;
      };
    }
  }, [isMenuOpen, isSearchOpen]);

  const handleLogout = () => {
    setIsAuthenticated(false);
    setUser(null);
    setIsTutor(false);
    setIsAdmin(false);

    setIsUserDropdownOpen(false);
    setIsMenuOpen(false);

    playClick();
    authService.logout();
  };

  const toggleMenu = () => {
    setIsMenuOpen((value) => !value);
    setIsSearchOpen(false);
    setIsLanguageOpen(false);
    setIsUserDropdownOpen(false);
    playClick();
  };

  const closeMenu = () => setIsMenuOpen(false);

  const toggleUserDropdown = () => {
    setIsUserDropdownOpen((value) => !value);
    setIsSearchOpen(false);
    setIsLanguageOpen(false);
    playClick();
  };

  const closeUserDropdown = () => setIsUserDropdownOpen(false);

  const openSearch = () => {
    setIsSearchOpen(true);
    setIsLanguageOpen(false);
    setIsUserDropdownOpen(false);
    setIsMenuOpen(false);

    playClick();

    requestAnimationFrame(() => {
      searchOverlayInputRef.current?.focus();
    });
  };

  const closeSearch = () => {
    setIsSearchOpen(false);
    setSearchQuery("");
    setSearchResults([]);
    setShowSuggestions(false);
  };

  const toggleLanguage = () => {
    setIsLanguageOpen((value) => !value);
    setIsUserDropdownOpen(false);
    playClick();
  };

  const handleLanguageChange = (langCode) => {
    changeLanguage(langCode);
    setIsLanguageOpen(false);
    playClick();
  };

  // Close dropdowns when clicking outside.
  useEffect(() => {
    const onDown = (event) => {
      if (
        userDropdownRef.current &&
        !userDropdownRef.current.contains(event.target)
      ) {
        setIsUserDropdownOpen(false);
      }

      if (
        languageRef.current &&
        !languageRef.current.contains(event.target)
      ) {
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

  // Close overlays on navigation.
  useEffect(() => {
    setIsMenuOpen(false);
    setIsUserDropdownOpen(false);
    setIsLanguageOpen(false);
    closeSearch();
  }, [location]);

  // Escape closes open overlays.
  useEffect(() => {
    const onKey = (event) => {
      if (event.key === "Escape") {
        setIsMenuOpen(false);
        setIsUserDropdownOpen(false);
        setIsLanguageOpen(false);
        closeSearch();
      }
    };

    document.addEventListener("keydown", onKey);

    return () => {
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  // Search functionality.
  const performSearch = useCallback((query) => {
    const term = query.toLowerCase().trim();
    const results = [];

    if (!data) return;

    if (data.subjects?.items) {
      data.subjects.items.forEach((subject) => {
        const name = String(subject.name || "");
        const description = String(subject.description || "");

        if (
          name.toLowerCase().includes(term) ||
          description.toLowerCase().includes(term)
        ) {
          results.push({
            type: "subject",
            title: name,
            subtitle: description,
            icon: subject.icon,
            path: `/subjects/${name.toLowerCase().replace(/\s+/g, "-")}`
          });
        }
      });
    }

    if (data.tutors?.shifts) {
      data.tutors.shifts.forEach((shift) => {
        shift.tutors?.forEach((tutor) => {
          const name = String(tutor.name || "");
          const subjects = tutor.subjects || [];

          if (
            name.toLowerCase().includes(term) ||
            subjects.some((subject) =>
              String(subject).toLowerCase().includes(term)
            )
          ) {
            results.push({
              type: "tutor",
              title: name,
              subtitle: `${tutor.tier || ""} • ${shift.name || ""}`,
              icon: "🧑‍🏫",
              path: "/tutors"
            });
          }
        });
      });
    }

    if (data.curriculum?.items) {
      data.curriculum.items.forEach((country) => {
        const name = String(country.country || "");
        const description = String(country.description || "");

        if (
          name.toLowerCase().includes(term) ||
          (country.subjects || []).some((subject) =>
            String(subject).toLowerCase().includes(term)
          )
        ) {
          results.push({
            type: "curriculum",
            title: name,
            subtitle: description,
            icon: country.flag,
            path: `/curriculum/${name.toLowerCase().replace(/\s+/g, "-")}`
          });
        }
      });
    }

    if (data.resources?.vaults) {
      data.resources.vaults.forEach((vault) => {
        const name = String(vault.name || "");
        const description = String(vault.description || "");

        if (
          name.toLowerCase().includes(term) ||
          description.toLowerCase().includes(term) ||
          (vault.topics || []).some((topic) =>
            String(topic).toLowerCase().includes(term)
          )
        ) {
          results.push({
            type: "resource",
            title: name,
            subtitle: description,
            icon: vault.icon,
            path: `/resources/${name.toLowerCase().replace(/\s+/g, "-")}`
          });
        }
      });
    }

    setSearchResults(results.slice(0, 8));
  }, [data]);

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

  const handleSearch = (event) => {
    event.preventDefault();

    if (searchQuery.trim()) {
      playClick();

      navigate(
        `/search?q=${encodeURIComponent(searchQuery.trim())}`
      );

      closeSearch();
    }
  };

  const handleResultClick = (path) => {
    playClick();
    navigate(path);
    closeSearch();
  };

  // Navigation definitions.
  const adminNavLinks = [
    { path: "/admin/dashboard", label: "Dashboard", icon: <PieChart size={18} /> },
    { path: "/admin/users", label: "Users", icon: <Users size={18} /> },
    { path: "/admin/tutors", label: "Tutors", icon: <Users size={18} /> },
    { path: "/admin/content", label: "Content", icon: <Book size={18} /> },
    { path: "/admin/payments", label: "Payments", icon: <CreditCard size={18} /> },
    { path: "/admin/analytics", label: "Analytics", icon: <BarChart2 size={18} /> },
    { path: "/admin/settings", label: "Settings", icon: <Settings size={18} /> }
  ];

  const tutorNavLinks = [
    { path: "/", label: "Home", icon: <Home size={18} /> },
    { path: "/tutor/dashboard", label: "Dashboard", icon: <BarChart2 size={18} /> },
    { path: "/my-sessions", label: "Sessions", icon: <Calendar size={18} /> },
    { path: "/resources", label: "Resources", icon: <Folder size={18} /> }
  ];

  const studentNavLinks = [
    { path: "/", label: "Home", icon: <Home size={18} /> },
    { path: "/subjects", label: "Subjects", icon: <Book size={18} /> },
    { path: "/curriculum", label: "Curriculum", icon: <LayoutGrid size={18} /> },
    { path: "/tutors", label: "Tutors", icon: <Users size={18} /> },
    { path: "/pricing", label: "Pricing", icon: <DollarSign size={18} /> },
    { path: "/resources", label: "Resources", icon: <Folder size={18} /> },
    { path: "/mission", label: "Our Mission", icon: <Target size={18} /> }
  ];

  const baseNavLinks = [
    { path: "/", label: "Home", icon: <Home size={18} /> },
    { path: "/subjects", label: "Subjects", icon: <Book size={18} /> },
    { path: "/curriculum", label: "Curriculum", icon: <LayoutGrid size={18} /> },
    { path: "/tutors", label: "Tutors", icon: <Users size={18} /> },
    { path: "/pricing", label: "Pricing", icon: <DollarSign size={18} /> },
    { path: "/resources", label: "Resources", icon: <Folder size={18} /> },
    { path: "/mission", label: "Our Mission", icon: <Target size={18} /> }
  ];

  let navLinks = baseNavLinks;

  if (isAdmin) {
    navLinks = adminNavLinks;
  } else if (isTutor) {
    navLinks = tutorNavLinks;
  } else if (isAuthenticated) {
    navLinks = studentNavLinks;
  }

  const showSearch = !isAdmin;

  const isActive = (path) => location.pathname === path;

  const getTypeLabel = (type) => ({
    subject: "Subject",
    tutor: "Tutor",
    curriculum: "Curriculum",
    resource: "Resource"
  }[type] || "");

  const getUserName = () =>
    user ? (user.name?.split(" ")[0] || user.name || "User") : "User";

  const getUserInitial = () =>
    user?.name ? user.name.charAt(0).toUpperCase() : "U";

  const getUserTier = () =>
    user
      ? (
        user.tier ||
        user.subscriptionTier ||
        user.subscription?.tier ||
        "Silver"
      )
      : "Silver";

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
        <span style={{ fontSize: "20px", fontWeight: 700, color: "#818cf8" }}>
          ∑
        </span>
      )}
    </div>
  );

  // Admin routes use their own admin layout/navbar.
  const isAdminRoute = location.pathname.startsWith("/admin");

  if (isAdminRoute) return null;

  return (
    <>
      <header
        className={`navbar ${isAdmin ? "admin-navbar" : ""}`}
        ref={menuRef}
      >
        <div className="navbar-container">

          <Link
            to={isAdmin ? "/admin/dashboard" : "/"}
            className="logo"
            onClick={closeMenu}
          >
            {renderLogo()}

            <div className="logo-content">
              <span className="logo-title">EduSpantech</span>
              <span className="logo-subtitle">
                {isAdmin
                  ? "Admin Panel"
                  : t("app.subtitle") || "Global Education Platform"}
              </span>
            </div>

            {isAdmin && <span className="admin-badge">ADMIN</span>}
          </Link>

          <nav className="navbar-links">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`${isActive(link.path) ? "active" : ""} ${
                  isAdmin
                    ? "admin-nav-link"
                    : isTutor
                      ? "tutor-nav-link"
                      : "student-nav-link"
                }`}
                onClick={() => playClick()}
              >
                {link.icon && (
                  <span className="nav-icon">{link.icon}</span>
                )}
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="navbar-actions">

            {showSearch && (
              <button
                type="button"
                className="search-icon-button"
                aria-label="Open search"
                onClick={openSearch}
              >
                <Search size={20} />
              </button>
            )}

            <div className="language-container" ref={languageRef}>
              <button
                className={`language-button ${isLanguageOpen ? "active" : ""}`}
                aria-label="Language"
                aria-expanded={isLanguageOpen}
                onClick={toggleLanguage}
              >
                <Globe size={18} />
                <span className="language-code-label">
                  {currentLanguage.toUpperCase()}
                </span>
                <ChevronDown
                  size={14}
                  className={`language-arrow ${isLanguageOpen ? "open" : ""}`}
                />
              </button>

              <div className={`language-dropdown ${isLanguageOpen ? "open" : ""}`}>
                {Object.values(languages).map((lang) => (
                  <button
                    key={lang.code}
                    className={`language-option ${
                      currentLanguage === lang.code ? "active" : ""
                    }`}
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

            {isAuthenticated && (
              <NotificationBell
                isActive={
                  isActive("/notifications") ||
                  isActive("/admin/notifications")
                }
              />
            )}

            {isAuthenticated ? (
              <div className="user-menu" ref={userDropdownRef}>

                <button
                  className={`user-dropdown-toggle ${
                    isUserDropdownOpen ? "open" : ""
                  } ${
                    isAdmin
                      ? "admin-dropdown"
                      : isTutor
                        ? "tutor-dropdown"
                        : "student-dropdown"
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
                      <img
                        src={getAvatarImage()}
                        alt="Avatar"
                        className="user-avatar-img"
                      />
                    ) : (
                      <span className="user-avatar-initial">
                        {getUserInitial()}
                      </span>
                    )}

                    {isAdmin && (
                      <span className="admin-badge-avatar" title="Admin">
                        👑
                      </span>
                    )}

                    <span className="avatar-chevron" aria-hidden="true">
                      <ChevronDown size={10} strokeWidth={3} />
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
                          <img
                            src={getAvatarImage()}
                            alt="Avatar"
                            className="dropdown-avatar-img"
                          />
                        ) : (
                          <span className="dropdown-avatar-initial">
                            {getUserInitial()}
                          </span>
                        )}
                      </div>

                      <div className="dropdown-user-details">
                        <span className="dropdown-user-name">
                          {user?.name || "User"}
                        </span>

                        <span className="dropdown-user-email">
                          {user?.email || ""}
                        </span>

                        {isAdmin ? (
                          <span className="dropdown-user-tier admin-tier">
                            👑 Admin
                          </span>
                        ) : isTutor ? (
                          <span className="dropdown-user-tier tutor-tier">
                            👨‍🏫 Tutor Account
                          </span>
                        ) : (
                          <span className="dropdown-user-tier">
                            🏅 {getUserTier()} Tier
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {isAdmin && (
                    <div className="dropdown-items admin-dropdown-items">
                      <Link
                        to="/admin/dashboard"
                        className="dropdown-item"
                        onClick={() => { closeUserDropdown(); playClick(); }}
                      >
                        <PieChart size={18} className="dropdown-icon" />
                        <span>Dashboard</span>
                      </Link>

                      <Link
                        to="/admin/users"
                        className="dropdown-item"
                        onClick={() => { closeUserDropdown(); playClick(); }}
                      >
                        <Users size={18} className="dropdown-icon" />
                        <span>Manage Users</span>
                      </Link>

                      <Link
                        to="/admin/tutors"
                        className="dropdown-item"
                        onClick={() => { closeUserDropdown(); playClick(); }}
                      >
                        <Users size={18} className="dropdown-icon" />
                        <span>Manage Tutors</span>
                      </Link>

                      <Link
                        to="/admin/content"
                        className="dropdown-item"
                        onClick={() => { closeUserDropdown(); playClick(); }}
                      >
                        <Book size={18} className="dropdown-icon" />
                        <span>Content Management</span>
                      </Link>

                      <Link
                        to="/admin/payments"
                        className="dropdown-item"
                        onClick={() => { closeUserDropdown(); playClick(); }}
                      >
                        <CreditCard size={18} className="dropdown-icon" />
                        <span>Payments</span>
                      </Link>

                      <Link
                        to="/admin/analytics"
                        className="dropdown-item"
                        onClick={() => { closeUserDropdown(); playClick(); }}
                      >
                        <BarChart2 size={18} className="dropdown-icon" />
                        <span>Analytics</span>
                      </Link>

                      <Link
                        to="/admin/settings"
                        className="dropdown-item"
                        onClick={() => { closeUserDropdown(); playClick(); }}
                      >
                        <Settings size={18} className="dropdown-icon" />
                        <span>System Settings</span>
                      </Link>

                      <Link
                        to="/admin/activity"
                        className="dropdown-item"
                        onClick={() => { closeUserDropdown(); playClick(); }}
                      >
                        <FileText size={18} className="dropdown-icon" />
                        <span>Audit Log</span>
                      </Link>

                      <div className="dropdown-divider"></div>

                      <Link
                        to="/admin/profile"
                        className="dropdown-item"
                        onClick={() => { closeUserDropdown(); playClick(); }}
                      >
                        <User size={18} className="dropdown-icon" />
                        <span>My Profile</span>
                      </Link>

                      <button
                        className="dropdown-item logout"
                        onClick={handleLogout}
                      >
                        <LogOut size={18} className="dropdown-icon" />
                        <span>Logout</span>
                      </button>
                    </div>
                  )}

                  {!isAdmin && !isTutor && (
                    <div className="dropdown-items">
                      <Link
                        to="/profile"
                        className="dropdown-item"
                        onClick={() => { closeUserDropdown(); playClick(); }}
                      >
                        <User size={18} className="dropdown-icon" />
                        <span>Profile</span>
                      </Link>

                      <Link
                        to="/settings"
                        className="dropdown-item"
                        onClick={() => { closeUserDropdown(); playClick(); }}
                      >
                        <Settings size={18} className="dropdown-icon" />
                        <span>Settings</span>
                      </Link>

                      <Link
                        to="/dashboard"
                        className="dropdown-item"
                        onClick={() => { closeUserDropdown(); playClick(); }}
                      >
                        <BookOpen size={18} className="dropdown-icon" />
                        <span>Dashboard</span>
                      </Link>

                      <Link
                        to="/my-courses"
                        className="dropdown-item"
                        onClick={() => { closeUserDropdown(); playClick(); }}
                      >
                        <Award size={18} className="dropdown-icon" />
                        <span>My Courses</span>
                      </Link>

                      <Link
                        to="/my-sessions"
                        className="dropdown-item"
                        onClick={() => { closeUserDropdown(); playClick(); }}
                      >
                        <Clock size={18} className="dropdown-icon" />
                        <span>My Sessions</span>
                      </Link>

                      <Link
                        to="/help"
                        className="dropdown-item"
                        onClick={() => { closeUserDropdown(); playClick(); }}
                      >
                        <HelpCircle size={18} className="dropdown-icon" />
                        <span>Help &amp; Support</span>
                      </Link>

                      <div className="dropdown-divider"></div>

                      <button
                        className="dropdown-item logout"
                        onClick={handleLogout}
                      >
                        <LogOut size={18} className="dropdown-icon" />
                        <span>Logout</span>
                      </button>
                    </div>
                  )}

                  {!isAdmin && isTutor && (
                    <div className="dropdown-items tutor-dropdown-items">
                      <Link
                        to="/profile"
                        className="dropdown-item"
                        onClick={() => { closeUserDropdown(); playClick(); }}
                      >
                        <User size={18} className="dropdown-icon" />
                        <span>My Profile</span>
                      </Link>

                      <Link
                        to="/settings"
                        className="dropdown-item"
                        onClick={() => { closeUserDropdown(); playClick(); }}
                      >
                        <Settings size={18} className="dropdown-icon" />
                        <span>Settings</span>
                      </Link>

                      <Link
                        to="/tutor/dashboard"
                        className="dropdown-item"
                        onClick={() => { closeUserDropdown(); playClick(); }}
                      >
                        <BarChart2 size={18} className="dropdown-icon" />
                        <span>Dashboard</span>
                      </Link>

                      <Link
                        to="/tutor/students"
                        className="dropdown-item"
                        onClick={() => { closeUserDropdown(); playClick(); }}
                      >
                        <Users size={18} className="dropdown-icon" />
                        <span>My Students</span>
                      </Link>

                      <Link
                        to="/tutor/earnings"
                        className="dropdown-item"
                        onClick={() => { closeUserDropdown(); playClick(); }}
                      >
                        <TrendingUp size={18} className="dropdown-icon" />
                        <span>Earnings</span>
                      </Link>

                      <Link
                        to="/help"
                        className="dropdown-item"
                        onClick={() => { closeUserDropdown(); playClick(); }}
                      >
                        <HelpCircle size={18} className="dropdown-icon" />
                        <span>Help &amp; Support</span>
                      </Link>

                      <div className="dropdown-divider"></div>

                      <button
                        className="dropdown-item logout"
                        onClick={handleLogout}
                      >
                        <LogOut size={18} className="dropdown-icon" />
                        <span>Logout</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="auth-buttons">
                <Link
                  to="/login"
                  className="login-button"
                  onClick={() => playClick()}
                >
                  {t("nav.login") || "Login"}
                </Link>

                <Link
                  to="/register"
                  className="signup-button"
                  onClick={() => playClick()}
                >
                  {t("nav.register") || "Sign Up"}
                </Link>
              </div>
            )}

            <button
              className="mobile-menu"
              onClick={toggleMenu}
              aria-label="Toggle menu"
              aria-expanded={isMenuOpen}
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </header>

      {/* Search overlay */}
      {isSearchOpen && (
        <div
          className="search-overlay"
          role="dialog"
          aria-modal="true"
          aria-label="Search"
        >
          <div
            className="search-overlay-backdrop"
            onClick={closeSearch}
          />

          <div className="search-overlay-panel">
            <div className="search-overlay-header">
              <form
                onSubmit={handleSearch}
                className="search-overlay-form"
              >
                <Search size={20} className="search-overlay-icon" />

                <input
                  ref={searchOverlayInputRef}
                  type="text"
                  className="search-overlay-input"
                  placeholder={
                    t("nav.search") ||
                    "Search subjects, tutors, resources…"
                  }
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
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
                    <X size={16} />
                  </button>
                )}
              </form>

              <button
                type="button"
                className="search-overlay-close"
                aria-label="Close search"
                onClick={closeSearch}
              >
                <X size={20} />
              </button>
            </div>

            <div className="search-overlay-results">
              {showSuggestions && searchResults.length > 0 ? (
                searchResults.map((result, index) => (
                  <div
                    key={`${result.type}-${result.title}-${index}`}
                    className="search-overlay-result"
                    onClick={() => handleResultClick(result.path)}
                  >
                    <div className="search-overlay-result-icon">
                      {result.icon}
                    </div>

                    <div className="search-overlay-result-info">
                      <div className="search-overlay-result-title">
                        {result.title}
                      </div>

                      <div className="search-overlay-result-subtitle">
                        {result.subtitle}
                      </div>
                    </div>

                    <span className="search-overlay-result-type">
                      {getTypeLabel(result.type)}
                    </span>
                  </div>
                ))
              ) : searchQuery.trim().length >= 2 ? (
                <div className="search-overlay-empty">
                  <Search size={32} />
                  <p>No results found for "{searchQuery}"</p>
                </div>
              ) : (
                <div className="search-overlay-hint">
                  <Search size={32} />
                  <p>Type at least 2 characters to search</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Mobile menu */}
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
              {isAdmin
                ? "Admin Menu"
                : isTutor
                  ? "Tutor Menu"
                  : "Menu"}
            </span>

            <button
              className="mobile-menu-close"
              onClick={closeMenu}
              aria-label="Close menu"
            >
              <X size={24} />
            </button>
          </div>

          <nav className="mobile-nav-links">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={isActive(link.path) ? "active" : ""}
                onClick={() => {
                  closeMenu();
                  playClick();
                }}
              >
                {link.icon && (
                  <span className="mobile-nav-icon">
                    {link.icon}
                  </span>
                )}
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="mobile-divider"></div>

          {isAuthenticated && !isAdmin && !isTutor && (
            <div className="mobile-section">
              <div className="mobile-section-label">Account</div>

              <Link to="/profile" onClick={() => { closeMenu(); playClick(); }}>
                <User size={18} /> Profile
              </Link>

              <Link to="/settings" onClick={() => { closeMenu(); playClick(); }}>
                <Settings size={18} /> Settings
              </Link>

              <Link to="/dashboard" onClick={() => { closeMenu(); playClick(); }}>
                <BookOpen size={18} /> Dashboard
              </Link>

              <Link to="/my-courses" onClick={() => { closeMenu(); playClick(); }}>
                <Award size={18} /> My Courses
              </Link>

              <Link to="/my-sessions" onClick={() => { closeMenu(); playClick(); }}>
                <Clock size={18} /> My Sessions
              </Link>

              <Link to="/help" onClick={() => { closeMenu(); playClick(); }}>
                <HelpCircle size={18} /> Help &amp; Support
              </Link>
            </div>
          )}

          {isAuthenticated && !isAdmin && isTutor && (
            <div className="mobile-section">
              <div className="mobile-section-label">Tutor Tools</div>

              <Link to="/profile" onClick={() => { closeMenu(); playClick(); }}>
                <User size={18} /> My Profile
              </Link>

              <Link to="/settings" onClick={() => { closeMenu(); playClick(); }}>
                <Settings size={18} /> Settings
              </Link>

              <Link to="/tutor/dashboard" onClick={() => { closeMenu(); playClick(); }}>
                <BarChart2 size={18} /> Dashboard
              </Link>

              <Link to="/tutor/students" onClick={() => { closeMenu(); playClick(); }}>
                <Users size={18} /> My Students
              </Link>

              <Link to="/tutor/earnings" onClick={() => { closeMenu(); playClick(); }}>
                <TrendingUp size={18} /> Earnings
              </Link>

              <Link to="/help" onClick={() => { closeMenu(); playClick(); }}>
                <HelpCircle size={18} /> Help
              </Link>
            </div>
          )}

          {isAdmin && (
            <div className="mobile-section">
              <div className="mobile-section-label">Admin</div>

              <Link to="/admin/dashboard" onClick={() => { closeMenu(); playClick(); }}>
                <PieChart size={18} /> Dashboard
              </Link>

              <Link to="/admin/users" onClick={() => { closeMenu(); playClick(); }}>
                <Users size={18} /> Manage Users
              </Link>

              <Link to="/admin/tutors" onClick={() => { closeMenu(); playClick(); }}>
                <Users size={18} /> Manage Tutors
              </Link>

              <Link to="/admin/content" onClick={() => { closeMenu(); playClick(); }}>
                <Book size={18} /> Content
              </Link>

              <Link to="/admin/payments" onClick={() => { closeMenu(); playClick(); }}>
                <CreditCard size={18} /> Payments
              </Link>

              <Link to="/admin/analytics" onClick={() => { closeMenu(); playClick(); }}>
                <BarChart2 size={18} /> Analytics
              </Link>

              <Link to="/admin/settings" onClick={() => { closeMenu(); playClick(); }}>
                <Settings size={18} /> Settings
              </Link>

              <Link to="/admin/activity" onClick={() => { closeMenu(); playClick(); }}>
                <FileText size={18} /> Audit Log
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
                  className={`mobile-language-option ${
                    currentLanguage === lang.code ? "active" : ""
                  }`}
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
          </div>

          <div className="mobile-divider"></div>

          <div className="mobile-section">
            {isAuthenticated ? (
              <button
                className="mobile-logout"
                onClick={handleLogout}
              >
                <LogOut size={18} /> Logout
              </button>
            ) : (
              <div className="mobile-auth-buttons">
                <Link
                  to="/login"
                  className="mobile-login"
                  onClick={() => { closeMenu(); playClick(); }}
                >
                  {t("nav.login") || "Login"}
                </Link>

                <Link
                  to="/register"
                  className="mobile-signup"
                  onClick={() => { closeMenu(); playClick(); }}
                >
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
