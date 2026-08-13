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

// ===== LAZY LOAD MY COURSES & SESSIONS WITH ERROR BOUNDARY =====
const MyCourses = lazy(() => 
  import('./pages/MyCourses')
    .then(module => {
      console.log('✅ MyCourses loaded successfully');
      return module;
    })
    .catch(err => {
      console.error('❌ Failed to load MyCourses:', err);
      // Return a fallback component
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
            <p style={{ color: '#94a3b8', marginTop: '12px' }}>Please refresh the page or try again later.</p>
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
            <p style={{ color: '#94a3b8', marginTop: '12px' }}>Please refresh the page or try again later.</p>
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
  return (
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
                      {/* ===== CUSTOM ROUTES FIRST ===== */}
                      <Route path="/my-sessions" element={<MySessions />} />
                      <Route path="/my-courses" element={<MyCourses />} />
                      <Route path="/verify-email" element={<VerifyEmail />} />
                      <Route path="/practice/:id" element={<Practice />} />
                      <Route path="/help/*" element={<Help />} />
                      <Route path="/settings" element={<Settings />} />
                      <Route path="/profile" element={<Profile />} />
                      <Route path="/login" element={<Login />} />
                      <Route path="/register" element={<Register />} />
                      <Route path="/dashboard" element={<Dashboard />} />
                      <Route path="/subjects/:subjectName" element={<SubjectDetail />} />
                      <Route path="/subjects" element={<Subjects />} />
                      <Route path="/curriculum/:countryId" element={<CurriculumDetail />} />
                      <Route path="/curriculum" element={<Curriculum />} />
                      <Route path="/tutors" element={<Tutors />} />
                      <Route path="/pricing" element={<Pricing />} />
                      <Route path="/resources/:vaultName/:resourceId" element={<ResourceDetail />} />
                      <Route path="/resources/:vaultName" element={<ResourceDetail />} />
                      <Route path="/resources/videos/:id" element={<ResourceDetail />} />
                      <Route path="/resources/practice/:id" element={<ResourceDetail />} />
                      <Route path="/resources/guides/:id" element={<ResourceDetail />} />
                      <Route path="/resources" element={<Resources />} />
                      <Route path="/terms" element={<Terms />} />
                      <Route path="/privacy" element={<Privacy />} />
                      <Route path="/session/:sessionId" element={<TutorSession />} />
                      <Route path="/checkout" element={<Checkout />} />
                      <Route path="/payment-success" element={<PaymentSuccess />} />
                      <Route path="/search" element={<SearchResults />} />
                      
                      {/* ===== HOME MUST BE LAST ===== */}
                      <Route path="/" element={<Home />} />
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
  );
}

export default App;