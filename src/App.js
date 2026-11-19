
// src/App.js
// COMPLETE APP ROUTING
// Parent Home, Parent Navbar, Parent Profile, Parent Help Centre,
// Tutor Protection, Student Protection, Admin Protection,
// Tour Guide, Session Recordings and Existing App Features.

import React, { Suspense, lazy, useState, useEffect } from 'react';

import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
  useNavigate,
  Navigate
} from 'react-router-dom';

// =====================================================
// CORE COMPONENTS
// =====================================================

import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ChatWidget from './components/ChatWidget';
import TourGuide from './components/TourGuide';
import SplashScreen from './components/SplashScreen';

// =====================================================
// PUBLIC PAGES
// =====================================================

import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Subjects from './pages/Subjects';
import SubjectDetail from './pages/SubjectDetail';
import Curriculum from './pages/Curriculum';
import CurriculumDetail from './pages/CurriculumDetail';
import Tutors from './pages/Tutors';
import Pricing from './pages/Pricing';
import Resources from './pages/Resources';
import ResourceDetail from './pages/ResourceDetail';
import Terms from './pages/Terms';
import Privacy from './pages/Privacy';
import SearchResults from './pages/SearchResults';
import MissionPage from './pages/MissionPage';
import BecomeATutor from './pages/BecomeATutor';
import TrackApplication from './pages/TrackApplication';
import Team from './pages/Team';

// =====================================================
// STUDENT PAGES
// =====================================================

import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import Help from './pages/Help';
import Practice from './pages/Practice';
import TutorSession from './pages/TutorSession';
import Checkout from './pages/Checkout';
import PaymentSuccess from './pages/PaymentSuccess';
import VerifyEmail from './pages/VerifyEmail';
import Notifications from './pages/Notifications';
import ForgotPassword from './pages/ForgotPassword';
import Timetable from './pages/Timetable';
import SubjectContent from './pages/SubjectContent';
import SessionRecordings from './pages/SessionRecordings';

// =====================================================
// TUTOR PAGES
// =====================================================

import TutorDashboard from './pages/TutorDashboard';
import TutorStudents from './pages/TutorStudents';
import TutorEarnings from './pages/TutorEarnings';

// =====================================================
// PARENT PAGES
// =====================================================

import ParentLogin from './pages/ParentLogin';
import ParentRegister from './pages/ParentRegister';
import ParentDashboard from './pages/ParentDashboard';
import ParentHome from './pages/ParentHome';
import ParentProfile from './pages/ParentProfile';
import ParentHelp from './pages/ParentHelp';

// =====================================================
// ADMIN PAGES
// =====================================================

import AddTutor from './pages/Admin/AddTutor';
import AdminLayout from './pages/Admin/AdminLayout';
import AdminDashboard from './pages/Admin/AdminDashboard';
import AdminUsers from './pages/Admin/AdminUsers';
import AdminTutors from './pages/Admin/AdminTutors';
import AdminContent from './pages/Admin/AdminContent';
import AdminSubjectContent from './pages/Admin/AdminSubjectContent';
import AdminPayments from './pages/Admin/AdminPayments';
import AdminAnalytics from './pages/Admin/AdminAnalytics';
import AdminSettings from './pages/Admin/AdminSettings';
import AdminActivity from './pages/Admin/AdminActivity';
import AdminLogin from './pages/Admin/AdminLogin';
import AdminProfile from './pages/Admin/AdminProfile';
import AdminPricing from './pages/Admin/AdminPricing';
import AdminLoginLayout from './pages/Admin/AdminLoginLayout';

// =====================================================
// CONTEXT PROVIDERS
// =====================================================

import { LanguageProvider } from './context/LanguageContext';
import { SessionSettingsProvider } from './context/SessionSettingsContext';
import { ThemeProvider } from './context/ThemeContext';
import { SoundProvider } from './context/SoundContext';

// =====================================================
// SERVICES AND STYLES
// =====================================================

import { supabase } from './services/supabaseClient';
import './App.css';

// =====================================================
// LAZY-LOADED PAGES
// =====================================================

const withLazyErrorHandling = (importFn, componentName) => {
  return lazy(() =>
    importFn()
      .then((module) => {
        console.log(`Loaded ${componentName} successfully`);

        if (module.default) {
          return module;
        }

        if (module[componentName]) {
          return {
            default: module[componentName]
          };
        }

        throw new Error(
          `${componentName} has no default or named export`
        );
      })
      .catch((error) => {
        console.error(
          `Failed to load ${componentName}:`,
          error
        );

        return {
          default: () => (
            <div
              style={{
                padding: '60px 20px',
                textAlign: 'center',
                color: '#ef4444',
                minHeight: '100vh',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                background: '#0a0e1a'
              }}
            >
              <h2>Failed to load {componentName}</h2>

              <p
                style={{
                  color: '#94a3b8',
                  marginTop: '12px'
                }}
              >
                {error.message ||
                  'An error occurred loading this page.'}
              </p>

              <button
                onClick={() => window.location.reload()}
                style={{
                  marginTop: '24px',
                  padding: '12px 32px',
                  background: '#4f46e5',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '16px'
                }}
              >
                Refresh Page
              </button>
            </div>
          )
        };
      })
  );
};

const MyCourses = withLazyErrorHandling(
  () => import('./pages/MyCourses'),
  'MyCourses'
);

const MySessions = withLazyErrorHandling(
  () => import('./pages/MySessions'),
  'MySessions'
);

// =====================================================
// STORAGE HELPERS
// =====================================================

const getStoredUser = () => {
  try {
    const storedUser = JSON.parse(
      localStorage.getItem('user') || 'null'
    );

    if (!storedUser) {
      return null;
    }

    return storedUser.user || storedUser;
  } catch (error) {
    console.error(
      'Unable to read stored user:',
      error
    );

    return null;
  }
};

const getUserRole = (user) => {
  if (!user) {
    return '';
  }

  const storedRole = localStorage.getItem('userRole');

  const role =
    user.role ||
    user.userType ||
    user.user_type ||
    user.type ||
    storedRole ||
    '';

  return String(role).toLowerCase();
};

// =====================================================
// ROLE HELPERS
// =====================================================

const isParentAccount = (user) => {
  if (!user) {
    return false;
  }

  const role = getUserRole(user);

  const roles = Array.isArray(user.roles)
    ? user.roles.map((item) =>
        String(item).toLowerCase()
      )
    : [];

  return (
    role === 'parent' ||
    role === 'guardian' ||
    user.is_parent === true ||
    user.is_parent === 'true' ||
    roles.includes('parent') ||
    roles.includes('guardian')
  );
};

const isAdminAccount = (user) => {
  if (!user) {
    return false;
  }

  const role = getUserRole(user);

  return (
    user.is_admin === true ||
    user.is_super_admin === true ||
    role === 'admin' ||
    role === 'super_admin'
  );
};

const isTutorAccount = (user) => {
  if (!user) {
    return false;
  }

  const role = getUserRole(user);

  const roles = Array.isArray(user.roles)
    ? user.roles.map((item) =>
        String(item).toLowerCase()
      )
    : [];

  return (
    role === 'tutor' ||
    user.is_tutor === true ||
    user.is_tutor === 'true' ||
    roles.includes('tutor')
  );
};

// =====================================================
// ERROR BOUNDARY
// =====================================================

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error) {
    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error, errorInfo) {
    console.error(
      'React Error Boundary caught an error:',
      error
    );

    console.error(
      'Error Info:',
      errorInfo
    );

    this.setState({
      errorInfo
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            padding: '60px 20px',
            textAlign: 'center',
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#0a0e1a',
            color: '#ffffff'
          }}
        >
          <h1
            style={{
              color: '#ef4444',
              fontSize: '28px'
            }}
          >
            Something went wrong
          </h1>

          <p
            style={{
              color: '#94a3b8',
              marginTop: '12px',
              maxWidth: '500px'
            }}
          >
            {this.state.error?.message ||
              'An unexpected error occurred.'}
          </p>

          {this.state.errorInfo && (
            <details
              style={{
                marginTop: '20px',
                color: '#94a3b8',
                fontSize: '14px',
                textAlign: 'left',
                maxWidth: '600px',
                background: '#1a1a2e',
                padding: '16px',
                borderRadius: '8px'
              }}
            >
              <summary>
                Technical Details
              </summary>

              <pre
                style={{
                  marginTop: '12px',
                  fontSize: '12px',
                  overflow: 'auto',
                  maxHeight: '200px'
                }}
              >
                {this.state.errorInfo.componentStack}
              </pre>
            </details>
          )}

          <button
            onClick={() => window.location.reload()}
            style={{
              marginTop: '24px',
              padding: '12px 32px',
              background: '#4f46e5',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '16px'
            }}
          >
            Refresh Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

// =====================================================
// PAGE LOADER
// =====================================================

const PageLoader = () => (
  <div
    style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#0a0e1a',
      color: '#94a3b8',
      gap: '16px'
    }}
  >
    <div
      style={{
        width: '40px',
        height: '40px',
        border: '3px solid rgba(79, 70, 229, 0.2)',
        borderTopColor: '#4f46e5',
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite'
      }}
    />

    <p>Loading...</p>

    <style>
      {`
        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
      `}
    </style>
  </div>
);

// =====================================================
// STUDENT PROTECTED ROUTE
// =====================================================

const StudentRoute = ({ children }) => {
  const user = getStoredUser();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (isParentAccount(user)) {
    return (
      <Navigate
        to="/parent/dashboard"
        replace
      />
    );
  }

  if (isAdminAccount(user)) {
    return (
      <Navigate
        to="/admin/dashboard"
        replace
      />
    );
  }

  if (isTutorAccount(user)) {
    return (
      <Navigate
        to="/tutor/dashboard"
        replace
      />
    );
  }

  return children;
};

// =====================================================
// PARENT PROTECTED ROUTE
// =====================================================

const ParentRoute = ({ children }) => {
  const user = getStoredUser();

  if (!user) {
    return (
      <Navigate
        to="/parent-login"
        replace
      />
    );
  }

  if (!isParentAccount(user)) {
    return (
      <Navigate
        to="/parent-login"
        replace
      />
    );
  }

  return children;
};

// =====================================================
// TUTOR PROTECTED ROUTE
// =====================================================

const TutorRoute = ({ children }) => {
  const user = getStoredUser();

  if (!user) {
    return (
      <Navigate
        to="/login"
        replace
      />
    );
  }

  if (!isTutorAccount(user)) {
    if (isParentAccount(user)) {
      return (
        <Navigate
          to="/parent/dashboard"
          replace
        />
      );
    }

    if (isAdminAccount(user)) {
      return (
        <Navigate
          to="/admin/dashboard"
          replace
        />
      );
    }

    return (
      <Navigate
        to="/dashboard"
        replace
      />
    );
  }

  return children;
};

// =====================================================
// SESSION REMINDER LISTENER
// =====================================================

const SessionReminderListener = () => {
  const navigate = useNavigate();

  const [userId, setUserId] = useState(null);

  useEffect(() => {
    const user = getStoredUser();

    setUserId(user?.id || null);
  }, []);

  useEffect(() => {
    if (!userId) {
      return;
    }

    const channel = supabase
      .channel('public:session_alerts')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          const notif = payload.new;

          if (notif.type === 'session_reminder') {
            const goToSession = window.confirm(
              `⏰ ${notif.title}\n\n${notif.message}\n\nClick OK to go to your sessions.`
            );

            if (goToSession) {
              navigate('/my-sessions');
            }
          } else if (
            notif.type === 'session_started'
          ) {
            const goToSession = window.confirm(
              `🚀 ${notif.title}\n\n${notif.message}\n\nClick OK to join the session now.`
            );

            if (goToSession) {
              navigate('/my-sessions');
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, navigate]);

  return null;
};

// =====================================================
// APP CONTENT
// =====================================================

const AppContent = () => {
  const location = useLocation();

  const currentPath = location.pathname;

  const isAdminRoute =
    currentPath.startsWith('/admin');

  const isVerifyEmailRoute =
    currentPath === '/verify-email';

  const isStandaloneSessionRecordings =
    currentPath === '/session-recordings';

  // Parent routes intentionally remain visible
  // so Navbar.js can render ParentNavbar.

  const hideNavigation =
    isAdminRoute ||
    isVerifyEmailRoute ||
    isStandaloneSessionRecordings;

  return (
    <div className="app">

      {!hideNavigation && (
        <SessionReminderListener />
      )}

      {!hideNavigation && <Navbar />}

      {!hideNavigation && <TourGuide />}

      <main className="app-main">
        <Suspense fallback={<PageLoader />}>
          <Routes>

            {/* =====================================
                STANDALONE ROUTES
            ===================================== */}

            <Route
              path="/verify-email"
              element={<VerifyEmail />}
            />

            {/* =====================================
                ADMIN LOGIN
            ===================================== */}

            <Route element={<AdminLoginLayout />}>
              <Route
                path="/admin/login"
                element={<AdminLogin />}
              />
            </Route>

            {/* =====================================
                ADMIN ROUTES
            ===================================== */}

            <Route
              path="/admin"
              element={<AdminLayout />}
            >
              <Route
                index
                element={<AdminDashboard />}
              />

              <Route
                path="dashboard"
                element={<AdminDashboard />}
              />

              <Route
                path="users"
                element={<AdminUsers />}
              />

              <Route
                path="tutors"
                element={<AdminTutors />}
              />

              <Route
                path="content"
                element={<AdminContent />}
              />

              <Route
                path="content/:subjectId"
                element={<AdminSubjectContent />}
              />

              <Route
                path="payments"
                element={<AdminPayments />}
              />

              <Route
                path="pricing"
                element={<AdminPricing />}
              />

              <Route
                path="analytics"
                element={<AdminAnalytics />}
              />

              <Route
                path="settings"
                element={<AdminSettings />}
              />

              <Route
                path="activity"
                element={<AdminActivity />}
              />

              <Route
                path="profile"
                element={<AdminProfile />}
              />

              <Route
                path="notifications"
                element={<Notifications />}
              />
            </Route>

            {/* =====================================
                CORE AUTHENTICATION ROUTES
            ===================================== */}

            <Route
              path="/forgot-password"
              element={<ForgotPassword />}
            />

            <Route
              path="/login"
              element={<Login />}
            />

            <Route
              path="/register"
              element={<Register />}
            />

            {/* =====================================
                PARENT PUBLIC HOME
                No authentication required.
            ===================================== */}

            <Route
              path="/parent"
              element={<ParentHome />}
            />

            {/* =====================================
                PARENT LOGIN
            ===================================== */}

            <Route
              path="/parent-login"
              element={<ParentLogin />}
            />

            {/* =====================================
                PARENT REGISTRATION
            ===================================== */}

            <Route
              path="/parent-register"
              element={<ParentRegister />}
            />

            {/* =====================================
                PUBLIC ROUTES
            ===================================== */}

            <Route
              path="/"
              element={<Home />}
            />

            <Route
              path="/mission"
              element={<MissionPage />}
            />

            <Route
              path="/subjects"
              element={<Subjects />}
            />

            <Route
              path="/subjects/:subjectName"
              element={<SubjectDetail />}
            />

            <Route
              path="/curriculum"
              element={<Curriculum />}
            />

            <Route
              path="/curriculum/:countryId"
              element={<CurriculumDetail />}
            />

            <Route
              path="/tutors"
              element={<Tutors />}
            />

            <Route
              path="/pricing"
              element={<Pricing />}
            />

            <Route
              path="/resources"
              element={<Resources />}
            />

            <Route
              path="/resources/:vaultName/:resourceId"
              element={<ResourceDetail />}
            />

            <Route
              path="/resources/:vaultName"
              element={<ResourceDetail />}
            />

            <Route
              path="/resources/videos/:id"
              element={<ResourceDetail />}
            />

            <Route
              path="/resources/practice/:id"
              element={<ResourceDetail />}
            />

            <Route
              path="/resources/guides/:id"
              element={<ResourceDetail />}
            />

            <Route
              path="/terms"
              element={<Terms />}
            />

            <Route
              path="/privacy"
              element={<Privacy />}
            />

            <Route
              path="/search"
              element={<SearchResults />}
            />

            <Route
              path="/subject-content/:subjectId"
              element={<SubjectContent />}
            />

            <Route
              path="/team"
              element={<Team />}
            />

            <Route
              path="/become-a-tutor"
              element={<BecomeATutor />}
            />

            <Route
              path="/track-application"
              element={<TrackApplication />}
            />

            {/* =====================================
                STUDENT PROTECTED ROUTES
            ===================================== */}

            <Route
              path="/timetable"
              element={
                <StudentRoute>
                  <Timetable />
                </StudentRoute>
              }
            />

            <Route
              path="/dashboard"
              element={
                <StudentRoute>
                  <Dashboard />
                </StudentRoute>
              }
            />

            <Route
              path="/profile"
              element={
                <StudentRoute>
                  <Profile />
                </StudentRoute>
              }
            />

            <Route
              path="/settings"
              element={
                <StudentRoute>
                  <Settings />
                </StudentRoute>
              }
            />

            <Route
              path="/help/*"
              element={
                <StudentRoute>
                  <Help />
                </StudentRoute>
              }
            />

            <Route
              path="/practice/:id"
              element={
                <StudentRoute>
                  <Practice />
                </StudentRoute>
              }
            />

            <Route
              path="/session/:sessionId"
              element={
                <StudentRoute>
                  <TutorSession />
                </StudentRoute>
              }
            />

            <Route
              path="/checkout"
              element={
                <StudentRoute>
                  <Checkout />
                </StudentRoute>
              }
            />

            <Route
              path="/payment-success"
              element={
                <StudentRoute>
                  <PaymentSuccess />
                </StudentRoute>
              }
            />

            <Route
              path="/notifications"
              element={
                <StudentRoute>
                  <Notifications />
                </StudentRoute>
              }
            />

            {/* =====================================
                PARENT PROTECTED ROUTES
            ===================================== */}

            <Route
              path="/parent/dashboard"
              element={
                <ParentRoute>
                  <ParentDashboard />
                </ParentRoute>
              }
            />

            {/* Parent Profile */}

            <Route
              path="/parent-profile"
              element={
                <ParentRoute>
                  <ParentProfile />
                </ParentRoute>
              }
            />

            {/* Parent Help Centre */}

            <Route
              path="/parent/help/*"
              element={
                <ParentRoute>
                  <ParentHelp />
                </ParentRoute>
              }
            />

            {/* Parent Session Recordings */}

            <Route
              path="/parent/session-recordings"
              element={
                <ParentRoute>
                  <SessionRecordings />
                </ParentRoute>
              }
            />

            {/* =====================================
                STUDENT SESSION RECORDINGS
            ===================================== */}

            <Route
              path="/session-recordings"
              element={
                <StudentRoute>
                  <SessionRecordings />
                </StudentRoute>
              }
            />

            {/* =====================================
                TUTOR PROTECTED ROUTES
            ===================================== */}

            <Route
              path="/tutor/dashboard"
              element={
                <TutorRoute>
                  <TutorDashboard />
                </TutorRoute>
              }
            />

            <Route
              path="/tutor/session/:sessionId"
              element={
                <TutorRoute>
                  <TutorSession />
                </TutorRoute>
              }
            />

            <Route
              path="/tutor/students"
              element={
                <TutorRoute>
                  <TutorStudents />
                </TutorRoute>
              }
            />

            <Route
              path="/tutor/earnings"
              element={
                <TutorRoute>
                  <TutorEarnings />
                </TutorRoute>
              }
            />

            {/* =====================================
                LAZY-LOADED STUDENT ROUTES
            ===================================== */}

            <Route
              path="/my-courses"
              element={
                <StudentRoute>
                  <MyCourses />
                </StudentRoute>
              }
            />

            <Route
              path="/my-sessions"
              element={
                <StudentRoute>
                  <MySessions />
                </StudentRoute>
              }
            />

            {/* =====================================
                FALLBACK ROUTE
            ===================================== */}

            <Route
              path="*"
              element={
                <Navigate
                  to="/"
                  replace
                />
              }
            />

          </Routes>
        </Suspense>
      </main>

      {!hideNavigation && <Footer />}

      {!hideNavigation && <ChatWidget />}

    </div>
  );
};

// =====================================================
// MAIN APP
// =====================================================

function App() {
  console.log('App starting...');
  console.log('Environment:', process.env.NODE_ENV);

  const [isAppReady, setIsAppReady] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsAppReady(true);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <ErrorBoundary>
      <Router>
        <SoundProvider>
          <ThemeProvider>
            <LanguageProvider>
              <SessionSettingsProvider>

                <SplashScreen
                  isReady={isAppReady}
                />

                <AppContent />

              </SessionSettingsProvider>
            </LanguageProvider>
          </ThemeProvider>
        </SoundProvider>
      </Router>
    </ErrorBoundary>
  );
}

export default App;
