// src/App.js
import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
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

// ===== LAZY LOAD WITH ERROR BOUNDARY =====
// Create a wrapper component to handle lazy loading errors
const LazyWrapper = ({ children, fallback }) => {
  const [hasError, setHasError] = React.useState(false);
  
  React.useEffect(() => {
    // If the lazy component fails, this will catch it
    const handleError = (event) => {
      if (event.error && event.error.toString().includes('loading chunk')) {
        setHasError(true);
      }
    };
    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, []);
  
  if (hasError) {
    return (
      <div style={{
        padding: '40px 20px',
        textAlign: 'center',
        color: '#ef4444',
        minHeight: '60vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#0a0e1a'
      }}>
        <h2>⚠️ Failed to load this page</h2>
        <p style={{ color: '#94a3b8', marginTop: '12px' }}>
          Please refresh the page or try again later.
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
    );
  }
  
  return children;
};

// ===== LAZY LOAD COMPONENTS WITH ERROR HANDLING =====
const MyCourses = lazy(() => 
  import('./pages/MyCourses')
    .then(module => {
      console.log('✅ MyCourses loaded successfully');
      return module;
    })
    .catch(err => {
      console.error('❌ Failed to load MyCourses:', err);
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
            <h2>⚠️ Failed to load MyCourses</h2>
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

const MySessions = lazy(() => 
  import('./pages/MySessions')
    .then(module => {
      console.log('✅ MySessions loaded successfully');
      return module;
    })
    .catch(err => {
      console.error('❌ Failed to load MySessions:', err);
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
            <h2>⚠️ Failed to load MySessions</h2>
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

// ===== ERROR BOUNDARY COMPONENT =====
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('❌ React Error Boundary caught:', error);
    console.error('Error Info:', errorInfo);
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
          <h1 style={{ color: '#ef4444' }}>⚠️ Something went wrong</h1>
          <p style={{ color: '#94a3b8', marginTop: '12px' }}>
            {this.state.error?.message || 'An unexpected error occurred'}
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
      );
    }

    return this.props.children;
  }
}

// ===== LOADING COMPONENT =====
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

function App() {
  console.log('🚀 App starting...');
  
  return (
    <ErrorBoundary>
      <Router>
        <SoundProvider>
          <ThemeProvider>
            <LanguageProvider>
              <SessionSettingsProvider>
                <div className="app">
                  <Navbar />
                  <main className="app-main">
                    <Suspense fallback={<PageLoader />}>
                      <Routes>
                        {/* ===== CORE ROUTES (Always accessible) ===== */}
                        <Route path="/forgot-password" element={<ForgotPassword />} />
                        <Route path="/login" element={<Login />} />
                        <Route path="/register" element={<Register />} />
                        <Route path="/verify-email" element={<VerifyEmail />} />
                        
                        {/* ===== PUBLIC ROUTES ===== */}
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
                        
                        {/* ===== PROTECTED ROUTES (Requires Login) ===== */}
                        <Route path="/dashboard" element={<Dashboard />} />
                        <Route path="/profile" element={<Profile />} />
                        <Route path="/settings" element={<Settings />} />
                        <Route path="/help/*" element={<Help />} />
                        <Route path="/practice/:id" element={<Practice />} />
                        <Route path="/session/:sessionId" element={<TutorSession />} />
                        <Route path="/checkout" element={<Checkout />} />
                        <Route path="/payment-success" element={<PaymentSuccess />} />
                        <Route path="/notifications" element={<Notifications />} />
                        
                        {/* ===== TUTOR ROUTES ===== */}
                        <Route path="/tutor/dashboard" element={<TutorDashboard />} />
                        <Route path="/tutor/session/:sessionId" element={<TutorSession />} />
                        <Route path="/tutor/students" element={<TutorStudents />} />
                        <Route path="/tutor/earnings" element={<TutorEarnings />} />
                        <Route path="/admin/add-tutor" element={<AddTutor />} />
                        
                        {/* ===== LAZY LOADED ROUTES (With LazyWrapper) ===== */}
                        <Route path="/my-courses" element={
                          <LazyWrapper>
                            <MyCourses />
                          </LazyWrapper>
                        } />
                        <Route path="/my-sessions" element={
                          <LazyWrapper>
                            <MySessions />
                          </LazyWrapper>
                        } />
                      </Routes>
                    </Suspense>
                  </main>
                  <Footer />
                  <ChatWidget />
                </div>
              </SessionSettingsProvider>
            </LanguageProvider>
          </ThemeProvider>
        </SoundProvider>
      </Router>
    </ErrorBoundary>
  );
}

export default App;