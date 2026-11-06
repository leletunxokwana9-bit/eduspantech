// src/App.js - COMPLETE WITH ADMIN ROUTES + ADMIN LOGIN LAYOUT + ADMIN ROUTE CHECK + TUTOR APPLICATION + TRACK APPLICATION + ADMIN PRICING
import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
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
import TutorSession from './pages/TutorSession';
import Checkout from './pages/Checkout';
import PaymentSuccess from './pages/PaymentSuccess';
import SearchResults from './pages/SearchResults';
import { LanguageProvider } from './context/LanguageContext';
import { SessionSettingsProvider } from './context/SessionSettingsContext';
import { ThemeProvider } from './context/ThemeContext';
import { SoundProvider } from './context/SoundContext';
import './App.css';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import Help from './pages/Help';
import Practice from './pages/Practice';
import VerifyEmail from './pages/VerifyEmail';
import ChatWidget from './components/ChatWidget';
import TutorDashboard from './pages/TutorDashboard';
import AddTutor from './pages/Admin/AddTutor';
import TutorStudents from './pages/TutorStudents';
import TutorEarnings from './pages/TutorEarnings';
import Notifications from './pages/Notifications';
import ForgotPassword from './pages/ForgotPassword';
import Team from './pages/Team';
import Timetable from './pages/Timetable';

// ============================================
// TUTOR APPLICATION (Public)
// ============================================
import BecomeATutor from './pages/BecomeATutor';

// ============================================
// ✅ TRACK APPLICATION (Public)
// ============================================
import TrackApplication from './pages/TrackApplication';

// ============================================
// ADMIN ROUTES - Direct imports (not lazy)
// ============================================
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

// ============================================
// ADMIN LOGIN LAYOUT (No Navbar)
// ============================================
import AdminLoginLayout from './pages/Admin/AdminLoginLayout';

// ============================================
// PUBLIC SUBJECT CONTENT (Student view)
// ============================================
import SubjectContent from './pages/SubjectContent';

// ============================================
// ERROR BOUNDARY COMPONENT
// ============================================
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('❌ React Error Boundary caught an error:', error);
    console.error('Error Info:', errorInfo);
    this.setState({ errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          padding: '60px 20px',
          textAlign: 'center',
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#0a0e1a',
          color: '#fff'
        }}>
          <h1 style={{ color: '#ef4444', fontSize: '28px' }}>⚠️ Something went wrong</h1>
          <p style={{ color: '#94a3b8', marginTop: '12px', maxWidth: '500px' }}>
            {this.state.error?.message || 'An unexpected error occurred'}
          </p>
          {this.state.errorInfo && (
            <details style={{
              marginTop: '20px',
              color: '#94a3b8',
              fontSize: '14px',
              textAlign: 'left',
              maxWidth: '600px',
              background: '#1a1a2e',
              padding: '16px',
              borderRadius: '8px'
            }}>
              <summary>Technical Details</summary>
              <pre style={{
                marginTop: '12px',
                fontSize: '12px',
                overflow: 'auto',
                maxHeight: '200px'
              }}>
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
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '16px',
              transition: 'background 0.3s'
            }}
            onMouseEnter={(e) => e.target.style.background = '#6366f1'}
            onMouseLeave={(e) => e.target.style.background = '#4f46e5'}
          >
            Refresh Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

// ============================================
// LAZY LOAD WITH ERROR HANDLING
// ============================================
const withLazyErrorHandling = (importFn, componentName) => {
  return lazy(() =>
    importFn()
      .then(module => {
        console.log(`✅ ${componentName} loaded successfully`);
        return module;
      })
      .catch(err => {
        console.error(`❌ Failed to load ${componentName}:`, err);
        return {
          default: () => (
            <div style={{
              padding: '60px 20px',
              textAlign: 'center',
              color: '#ef4444',
              minHeight: '100vh',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              background: '#0a0e1a'
            }}>
              <h2>⚠️ Failed to load {componentName}</h2>
              <p style={{ color: '#94a3b8', marginTop: '12px' }}>
                {err.message || 'An error occurred loading this page'}
              </p>
              <button
                onClick={() => window.location.reload()}
                style={{
                  marginTop: '24px',
                  padding: '12px 32px',
                  background: '#4f46e5',
                  color: 'white',
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

// ============================================
// LAZY LOADED COMPONENTS
// ============================================
const MyCourses = withLazyErrorHandling(
  () => import('./pages/MyCourses'),
  'MyCourses'
);

const MySessions = withLazyErrorHandling(
  () => import('./pages/MySessions'),
  'MySessions'
);

// ============================================
// LAZY LOAD FALLBACK COMPONENT
// ============================================
const PageLoader = () => (
  <div style={{
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#0a0e1a',
    color: '#94a3b8',
    gap: '16px'
  }}>
    <div style={{
      width: '40px',
      height: '40px',
      border: '3px solid rgba(79, 70, 229, 0.2)',
      borderTopColor: '#4f46e5',
      borderRadius: '50%',
      animation: 'spin 0.8s linear infinite'
    }}></div>
    <p>Loading...</p>
    <style>{`
      @keyframes spin {
        to { transform: rotate(360deg); }
      }
    `}</style>
  </div>
);

// ============================================
// WRAPPER COMPONENT FOR NAVBAR CONDITIONAL RENDERING
// ============================================
const AppContent = () => {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');

  return (
    <div className="app">
      {/* ✅ Hide Navbar on admin routes */}
      {!isAdminRoute && <Navbar />}
      <main className="app-main">
        <Suspense fallback={<PageLoader />}>
          <Routes>
            {/* ============================================
                ✅ ADMIN LOGIN - NO NAVBAR (Layout Route with Outlet)
                ============================================ */}
            <Route element={<AdminLoginLayout />}>
              <Route path="/admin/login" element={<AdminLogin />} />
            </Route>

            {/* ============================================
                ADMIN ROUTES - With Sidebar (AdminLayout)
                ============================================ */}
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<AdminDashboard />} />
              <Route path="dashboard" element={<AdminDashboard />} />
              <Route path="users" element={<AdminUsers />} />
              <Route path="tutors" element={<AdminTutors />} />
              <Route path="content" element={<AdminContent />} />
              <Route path="content/:subjectId" element={<AdminSubjectContent />} />
              <Route path="payments" element={<AdminPayments />} />
              <Route path="pricing" element={<AdminPricing />} />
              <Route path="analytics" element={<AdminAnalytics />} />
              <Route path="settings" element={<AdminSettings />} />
              <Route path="activity" element={<AdminActivity />} />
              <Route path="profile" element={<AdminProfile />} />
              {/* ✅ Admin notifications — lives inside the admin shell */}
              <Route path="notifications" element={<Notifications />} />
            </Route>

            {/* ============================================
                CORE ROUTES - Always accessible
                ============================================ */}
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/verify-email" element={<VerifyEmail />} />

            {/* ============================================
                PUBLIC ROUTES - No authentication needed
                ============================================ */}
            <Route path="/" element={<Home />} />
            <Route path="/subjects" element={<Subjects />} />
            <Route path="/subjects/:subjectName" element={<SubjectDetail />} />
            <Route path="/curriculum" element={<Curriculum />} />
            <Route path="/curriculum/:countryId" element={<CurriculumDetail />} />
            <Route path="/tutors" element={<Tutors />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/resources" element={<Resources />} />
            <Route path="/resources/:vaultName/:resourceId" element={<ResourceDetail />} />
            <Route path="/resources/:vaultName" element={<ResourceDetail />} />
            <Route path="/resources/videos/:id" element={<ResourceDetail />} />
            <Route path="/resources/practice/:id" element={<ResourceDetail />} />
            <Route path="/resources/guides/:id" element={<ResourceDetail />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/search" element={<SearchResults />} />

            {/* ✅ PUBLIC SUBJECT CONTENT VIEWER */}
            <Route path="/subject-content/:subjectId" element={<SubjectContent />} />

            {/* ============================================
                TEAM ROUTE
                ============================================ */}
            <Route path="/team" element={<Team />} />

            {/* ============================================
                ✅ BECOME A TUTOR - Public application
                ============================================ */}
            <Route path="/become-a-tutor" element={<BecomeATutor />} />

            {/* ============================================
                ✅ TRACK APPLICATION - Public status check
                ============================================ */}
            <Route path="/track-application" element={<TrackApplication />} />

            {/* ============================================
                PROTECTED ROUTES - Require authentication
                ============================================ */}
            <Route path="/timetable" element={<Timetable />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/help/*" element={<Help />} />
            <Route path="/practice/:id" element={<Practice />} />
            <Route path="/session/:sessionId" element={<TutorSession />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/payment-success" element={<PaymentSuccess />} />
            <Route path="/notifications" element={<Notifications />} />

            {/* ============================================
                TUTOR ROUTES - Require tutor role
                ============================================ */}
            <Route path="/tutor/dashboard" element={<TutorDashboard />} />
            <Route path="/tutor/session/:sessionId" element={<TutorSession />} />
            <Route path="/tutor/students" element={<TutorStudents />} />
            <Route path="/tutor/earnings" element={<TutorEarnings />} />

            {/* ============================================
                LAZY LOADED ROUTES - With error handling
                ============================================ */}
            <Route path="/my-courses" element={<MyCourses />} />
            <Route path="/my-sessions" element={<MySessions />} />
          </Routes>
        </Suspense>
      </main>
      <Footer />
      <ChatWidget />
    </div>
  );
};

// ============================================
// MAIN APP COMPONENT
// ============================================
function App() {
  console.log('🚀 App starting...');
  console.log('📋 Environment:', process.env.NODE_ENV);

  return (
    <ErrorBoundary>
      <Router>
        <SoundProvider>
          <ThemeProvider>
            <LanguageProvider>
              <SessionSettingsProvider>
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