
import React, { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  GraduationCap,
  FolderOpen,
  Users,
  LifeBuoy,
  Globe,
  ChevronDown,
  Menu,
  X,
  User,
  Settings,
  LogOut,
  LogIn,
  UserPlus
} from "lucide-react";

import { useLanguage } from "../context/LanguageContext";
import { useSound } from "../context/SoundContext";
import NotificationBell from "./NotificationBell";

import logo from "../assets/EduspanLogo.png";
import "./ParentNavbar.css";

function ParentNavbar({ user, onLogout }) {
  const location = useLocation();

  const { currentLanguage, changeLanguage, languages } =
    useLanguage();

  const { playClick } = useSound();

  const isAuthenticatedParent = Boolean(
    user && (user.id || user.email || user.name)
  );

  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [languageOpen, setLanguageOpen] = useState(false);
  const [logoError, setLogoError] = useState(false);

  const profileRef = useRef(null);
  const languageRef = useRef(null);

  // =====================================================
  // PARENT NAVIGATION LINKS
  // =====================================================

  const navLinks = [
    {
      path: "/parent-dashboard",
      label: "Dashboard",
      icon: LayoutDashboard
    },
    {
      path: "/subjects",
      label: "Learning",
      icon: GraduationCap
    },
    {
      path: "/resources",
      label: "Resources",
      icon: FolderOpen
    },
    {
      path: "/tutors",
      label: "Tutors",
      icon: Users
    },
    {
      path: "/help",
      label: "Help Centre",
      icon: LifeBuoy
    }
  ];

  // =====================================================
  // ACTIVE NAVIGATION
  // =====================================================

  const isActive = (path) => {
    if (path === "/parent-dashboard") {
      return location.pathname === path;
    }

    return (
      location.pathname === path ||
      location.pathname.startsWith(`${path}/`)
    );
  };

  // =====================================================
  // PARENT DETAILS
  // =====================================================

  const firstName =
    user?.name?.trim().split(/\s+/)[0] || "Parent";

  const initials = user?.name
    ? user.name
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((part) => part.charAt(0).toUpperCase())
        .join("")
    : "P";

  const avatar =
    user?.avatar ||
    user?.profile_image ||
    user?.profileImage ||
    null;

  // =====================================================
  // MENU HELPERS
  // =====================================================

  const closeMenus = () => {
    setMobileOpen(false);
    setProfileOpen(false);
    setLanguageOpen(false);
  };

  const handleLogout = () => {
    closeMenus();
    playClick();

    if (isAuthenticatedParent && onLogout) {
      onLogout();
    }
  };

  const handleLanguageChange = (code) => {
    changeLanguage(code);
    setLanguageOpen(false);
    playClick();
  };

  // =====================================================
  // CLOSE MENUS WHEN ROUTE CHANGES
  // =====================================================

  useEffect(() => {
    closeMenus();
  }, [location.pathname]);

  // =====================================================
  // CLOSE DROPDOWNS WHEN CLICKING OUTSIDE
  // =====================================================

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (
        profileRef.current &&
        !profileRef.current.contains(event.target)
      ) {
        setProfileOpen(false);
      }

      if (
        languageRef.current &&
        !languageRef.current.contains(event.target)
      ) {
        setLanguageOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("touchstart", handleOutsideClick);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("touchstart", handleOutsideClick);
    };
  }, []);

  // =====================================================
  // MOBILE MENU SCROLL LOCK AND ESCAPE KEY
  // =====================================================

  useEffect(() => {
    if (!mobileOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setMobileOpen(false);
      }
    };

    document.addEventListener("keydown", handleEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleEscape);
    };
  }, [mobileOpen]);

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <>
      <header className="parent-navbar">
        <div className="parent-navbar-inner">

          {/* BRAND */}

          <Link
            to="/parent-dashboard"
            className="parent-navbar-brand"
            onClick={() => playClick()}
          >
            <div className="parent-navbar-logo">
              {!logoError ? (
                <img
                  src={logo}
                  alt="EduSpantech"
                  onError={() => setLogoError(true)}
                />
              ) : (
                <span>∑</span>
              )}
            </div>

            <div className="parent-brand-copy">
              <span className="parent-brand-name">
                EduSpantech
              </span>

              <span className="parent-brand-subtitle">
                Parent Portal
              </span>
            </div>
          </Link>

          {/* DESKTOP NAVIGATION */}

          <nav
            className="parent-desktop-navigation"
            aria-label="Parent navigation"
          >
            {navLinks.map((item) => {
              const Icon = item.icon;

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`parent-nav-link ${
                    isActive(item.path) ? "active" : ""
                  }`}
                  onClick={() => playClick()}
                >
                  <Icon size={17} strokeWidth={1.9} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* RIGHT ACTIONS */}

          <div className="parent-navbar-actions">

            {/* LANGUAGE */}

            <div
              className="parent-language-wrapper"
              ref={languageRef}
            >
              <button
                type="button"
                className={`parent-language-button ${
                  languageOpen ? "active" : ""
                }`}
                onClick={() => {
                  setLanguageOpen((value) => !value);
                  setProfileOpen(false);
                  playClick();
                }}
                aria-label="Choose language"
                aria-expanded={languageOpen}
              >
                <Globe size={17} />

                <span>
                  {currentLanguage.toUpperCase()}
                </span>

                <ChevronDown size={14} />
              </button>

              {languageOpen && (
                <div className="parent-language-dropdown">
                  {Object.values(languages).map((language) => (
                    <button
                      key={language.code}
                      type="button"
                      className={`parent-language-option ${
                        currentLanguage === language.code
                          ? "active"
                          : ""
                      }`}
                      onClick={() =>
                        handleLanguageChange(language.code)
                      }
                    >
                      <span>{language.flag}</span>
                      <span>{language.nativeName}</span>

                      {currentLanguage === language.code && (
                        <span className="parent-language-check">
                          ✓
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* NOTIFICATIONS — AUTHENTICATED PARENTS ONLY */}

            {isAuthenticatedParent && (
              <div className="parent-notification">
                <NotificationBell
                  isActive={
                    location.pathname === "/notifications"
                  }
                />
              </div>
            )}

            {/* AUTHENTICATED PARENT ACCOUNT */}

            {isAuthenticatedParent ? (
              <div
                className="parent-account-wrapper"
                ref={profileRef}
              >
                <button
                  type="button"
                  className={`parent-account-toggle ${
                    profileOpen ? "active" : ""
                  }`}
                  onClick={() => {
                    setProfileOpen((value) => !value);
                    setLanguageOpen(false);
                    playClick();
                  }}
                  aria-label="Parent account menu"
                  aria-expanded={profileOpen}
                >
                  <div className="parent-avatar">
                    {avatar ? (
                      <img src={avatar} alt="Parent profile" />
                    ) : (
                      <span>{initials}</span>
                    )}
                  </div>

                  <span className="parent-account-name">
                    {firstName}
                  </span>

                  <ChevronDown size={15} />
                </button>

                {profileOpen && (
                  <div className="parent-account-dropdown">

                    <div className="parent-account-dropdown-header">
                      <div className="parent-avatar parent-avatar-large">
                        {avatar ? (
                          <img src={avatar} alt="Parent profile" />
                        ) : (
                          <span>{initials}</span>
                        )}
                      </div>

                      <div className="parent-account-details">
                        <strong>{user?.name || "Parent"}</strong>
                        <span>{user?.email || ""}</span>
                        <small>Parent Account</small>
                      </div>
                    </div>

                    <div className="parent-dropdown-divider" />

                    <Link
                      to="/parent-profile"
                      className={`parent-dropdown-item ${
                        location.pathname === "/parent-profile"
                          ? "active"
                          : ""
                      }`}
                      onClick={() => {
                        closeMenus();
                        playClick();
                      }}
                    >
                      <User size={17} />
                      <span>My Profile</span>
                    </Link>

                    <Link
                      to="/settings"
                      className="parent-dropdown-item"
                      onClick={() => {
                        closeMenus();
                        playClick();
                      }}
                    >
                      <Settings size={17} />
                      <span>Account Settings</span>
                    </Link>

                    <div className="parent-dropdown-divider" />

                    <button
                      type="button"
                      className="parent-dropdown-item parent-logout"
                      onClick={handleLogout}
                    >
                      <LogOut size={17} />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              /* PUBLIC PARENT ACTIONS */

              <div className="parent-public-actions">
                <Link
                  to="/parent-login"
                  className="parent-login-link"
                  onClick={() => playClick()}
                >
                  <LogIn size={17} />
                  <span>Login</span>
                </Link>

                <Link
                  to="/parent-register"
                  className="parent-register-link"
                  onClick={() => playClick()}
                >
                  <UserPlus size={17} />
                  <span>Register</span>
                </Link>
              </div>
            )}

            {/* MOBILE MENU BUTTON */}

            <button
              type="button"
              className="parent-mobile-toggle"
              onClick={() => {
                setMobileOpen((value) => !value);
                playClick();
              }}
              aria-label={
                mobileOpen ? "Close menu" : "Open menu"
              }
              aria-expanded={mobileOpen}
            >
              {mobileOpen ? (
                <X size={23} />
              ) : (
                <Menu size={23} />
              )}
            </button>

          </div>
        </div>
      </header>

      {/* MOBILE BACKDROP */}

      {mobileOpen && (
        <div
          className="parent-mobile-backdrop"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* MOBILE NAVIGATION */}

      <aside
        className={`parent-mobile-panel ${
          mobileOpen ? "open" : ""
        }`}
        aria-hidden={!mobileOpen}
      >
        <div className="parent-mobile-panel-header">
          <div>
            <strong>Parent Portal</strong>
            <span>Navigate EduSpantech</span>
          </div>

          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            aria-label="Close navigation"
          >
            <X size={22} />
          </button>
        </div>

        {/* MOBILE ACCOUNT INFORMATION — AUTHENTICATED ONLY */}

        {isAuthenticatedParent && (
          <div className="parent-mobile-profile">
            <div className="parent-avatar parent-avatar-large">
              {avatar ? (
                <img src={avatar} alt="Parent profile" />
              ) : (
                <span>{initials}</span>
              )}
            </div>

            <div>
              <strong>{user?.name || "Parent"}</strong>
              <span>Parent Account</span>
            </div>
          </div>
        )}

        {/* PLATFORM NAVIGATION */}

        <nav className="parent-mobile-navigation">
          <span className="parent-mobile-label">
            PLATFORM
          </span>

          {navLinks.map((item) => {
            const Icon = item.icon;

            return (
              <Link
                key={item.path}
                to={item.path}
                className={`parent-mobile-link ${
                  isActive(item.path) ? "active" : ""
                }`}
                onClick={() => {
                  setMobileOpen(false);
                  playClick();
                }}
              >
                <Icon size={19} />
                <span>{item.label}</span>
                <ChevronDown
                  size={15}
                  className="parent-mobile-link-arrow"
                />
              </Link>
            );
          })}
        </nav>

        <div className="parent-mobile-divider" />

        {/* MOBILE ACCOUNT MENU */}

        <div className="parent-mobile-account">
          <span className="parent-mobile-label">
            ACCOUNT
          </span>

          {isAuthenticatedParent ? (
            <>
              <Link
                to="/parent-profile"
                onClick={() => {
                  setMobileOpen(false);
                  playClick();
                }}
              >
                <User size={18} />
                My Profile
              </Link>

              <Link
                to="/settings"
                onClick={() => {
                  setMobileOpen(false);
                  playClick();
                }}
              >
                <Settings size={18} />
                Account Settings
              </Link>

              <button
                type="button"
                onClick={handleLogout}
                className="parent-mobile-logout"
              >
                <LogOut size={18} />
                Sign Out
              </button>
            </>
          ) : (
            <>
              <Link
                to="/parent-login"
                onClick={() => {
                  setMobileOpen(false);
                  playClick();
                }}
              >
                <LogIn size={18} />
                Parent Login
              </Link>

              <Link
                to="/parent-register"
                onClick={() => {
                  setMobileOpen(false);
                  playClick();
                }}
              >
                <UserPlus size={18} />
                Parent Registration
              </Link>
            </>
          )}
        </div>

        {/* MOBILE LANGUAGE SETTINGS */}

        <div className="parent-mobile-language">
          <span className="parent-mobile-label">
            <Globe size={15} /> LANGUAGE
          </span>

          <div className="parent-mobile-language-grid">
            {Object.values(languages).map((language) => (
              <button
                key={language.code}
                type="button"
                className={
                  currentLanguage === language.code
                    ? "active"
                    : ""
                }
                onClick={() => {
                  handleLanguageChange(language.code);
                  setMobileOpen(false);
                }}
              >
                {language.flag} {language.nativeName}
              </button>
            ))}
          </div>
        </div>
      </aside>
    </>
  );
}

export default ParentNavbar;
