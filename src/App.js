import React from 'react';
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
                  <Routes>
                    <Route path="/help" element={<Help />} />
                    <Route path="/help/*" element={<Help />} />
                    <Route path="/settings" element={<Settings />} />
                    <Route path="/profile" element={<Profile />} />
                    <Route path="/" element={<Home />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/subjects" element={<Subjects />} />
                    <Route path="/subjects/:subjectName" element={<SubjectDetail />} />
                    <Route path="/curriculum" element={<Curriculum />} />
                    <Route path="/curriculum/:countryId" element={<CurriculumDetail />} />
                    <Route path="/tutors" element={<Tutors />} />
                    <Route path="/pricing" element={<Pricing />} />
                    <Route path="/resources" element={<Resources />} />
                    <Route path="/resources/:vaultName" element={<ResourceDetail />} />
                    <Route path="/resources/:vaultName/:resourceId" element={<ResourceDetail />} />
                    <Route path="/resources/videos/:id" element={<ResourceDetail />} />
                    <Route path="/resources/practice/:id" element={<ResourceDetail />} />
                    <Route path="/resources/guides/:id" element={<ResourceDetail />} />
                    <Route path="/terms" element={<Terms />} />
                    <Route path="/privacy" element={<Privacy />} />
                    <Route path="/session/:sessionId" element={<TutorSession />} />
                    <Route path="/checkout" element={<Checkout />} />
                    <Route path="/payment-success" element={<PaymentSuccess />} />
                    <Route path="/search" element={<SearchResults />} />
                  </Routes>
                </main>
                <Footer />
              </div>
            </SessionSettingsProvider>
          </LanguageProvider>
        </ThemeProvider>
      </SoundProvider>
    </Router>
  );
}

export default App;