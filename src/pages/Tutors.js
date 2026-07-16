// src/pages/Tutors.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useHomeData } from '../hooks/useHomeData';
import { authService } from '../services/authService';
import './Tutors.css';

const Tutors = () => {
  const navigate = useNavigate();
  const { data, loading, error } = useHomeData();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [selectedTutor, setSelectedTutor] = useState(null);

  // ✅ Check authentication
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        setIsAuthenticated(false);
        setCheckingAuth(false);
        return;
      }

      try {
        const user = await authService.getCurrentUser();
        if (user) {
          setIsAuthenticated(true);
        } else {
          setIsAuthenticated(false);
          authService.logout();
        }
      } catch (err) {
        console.error('Auth check failed:', err);
        setIsAuthenticated(false);
      } finally {
        setCheckingAuth(false);
      }
    };
    checkAuth();
  }, []);

  // ✅ Show loading while checking auth
  if (loading || checkingAuth) {
    return (
      <div className="page-loading">
        <div className="loading-spinner"></div>
        <p>{checkingAuth ? 'Checking authentication...' : 'Loading tutors...'}</p>
      </div>
    );
  }

  if (error) return <div className="page-error">Error: {error}</div>;
  if (!data) return <div className="page-empty">No tutors available</div>;

  const shifts = data.tutors?.shifts || [];

  // ✅ Book session with auth check
  const bookSession = (tutor) => {
    console.log('📚 Booking session with tutor:', tutor);
    
    // ✅ Check authentication before booking
    if (!isAuthenticated) {
      setSelectedTutor(tutor);
      setShowLoginPrompt(true);
      return;
    }

    const sessionId = `session_${Date.now()}_${tutor.id}`;
    navigate(`/session/${sessionId}`, { state: { tutor } });
  };

  // ✅ Handle login redirect
  const handleLoginRedirect = () => {
    navigate('/login', { state: { from: '/tutors' } });
  };

  // ✅ Login Prompt Modal (same as Resources and Pricing pages)
  const LoginPrompt = () => (
    <div className="login-prompt-overlay" onClick={() => setShowLoginPrompt(false)}>
      <div className="login-prompt-modal" onClick={(e) => e.stopPropagation()}>
        <button className="login-prompt-close" onClick={() => setShowLoginPrompt(false)}>×</button>
        <div className="login-prompt-icon">🔒</div>
        <h3>Login Required</h3>
        <p>Please log in to book a session with <strong>{selectedTutor?.name}</strong>.</p>
        <div className="login-prompt-actions">
          <button className="login-prompt-btn" onClick={handleLoginRedirect}>
            Login Now →
          </button>
          <button className="login-prompt-cancel" onClick={() => setShowLoginPrompt(false)}>
            Cancel
          </button>
        </div>
        <p className="login-prompt-register">
          Don't have an account? <span onClick={() => navigate('/register')}>Register here</span>
        </p>
      </div>
    </div>
  );

  return (
    <div className="tutors-page">
      {/* Login Prompt Modal */}
      {showLoginPrompt && <LoginPrompt />}

      <div className="tutors-page-header">
        <h1>👨‍🏫 {data.tutors?.title || 'Our Expert Tutors'}</h1>
        <p>{data.tutors?.subtitle || '12 Centralised Tutors • 24/7 Global Coverage'}</p>
        
        {/* ✅ Auth banner - shows if not logged in */}
        {!isAuthenticated && (
          <div className="tutors-auth-banner">
            <span>🔐 Please <button onClick={() => navigate('/login', { state: { from: '/tutors' } })}>login</button> to book sessions</span>
          </div>
        )}
      </div>

      <div className="tutors-page-grid">
        {shifts.map((shift) => (
          <div key={shift.id} className="tutors-page-shift">
            <div className="tutors-page-shift-header">
              <h3>{shift.name}</h3>
              <span className="tutors-page-shift-time">{shift.time}</span>
            </div>
            <div className="tutors-page-hubs">
              {shift.hubs?.map((hub, idx) => (
                <span key={idx}>{hub}</span>
              ))}
            </div>
            <div className="tutors-page-tutor-list">
              {shift.tutors?.map((tutor) => (
                <div key={tutor.id} className="tutors-page-tutor-card">
                  {tutor.image ? (
                    <img 
                      src={tutor.image} 
                      alt={tutor.name} 
                      className="tutors-page-tutor-image"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        const avatar = e.target.parentElement.querySelector('.tutors-page-tutor-avatar');
                        if (avatar) avatar.style.display = 'flex';
                      }}
                    />
                  ) : null}
                  <span 
                    className="tutors-page-tutor-avatar" 
                    style={{ display: tutor.image ? 'none' : 'flex' }}
                  >
                    🧑‍🏫
                  </span>
                  
                  <div className="tutors-page-tutor-info">
                    <div className="tutors-page-tutor-name-row">
                      <h4>{tutor.name}</h4>
                      <span className="tutors-page-tutor-tier">{tutor.tier}</span>
                      <span className="tutors-page-tutor-grades">{tutor.grades}</span>
                    </div>
                    {tutor.bio && <p className="tutors-page-tutor-bio">{tutor.bio}</p>}
                    <div className="tutors-page-tutor-subjects">
                      {tutor.subjects?.map((subject, idx) => (
                        <span key={idx}>{subject}</span>
                      ))}
                    </div>
                    <span className="tutors-page-tutor-time">{tutor.time}</span>
                  </div>

                  <button 
                    className="book-session-btn"
                    onClick={() => {
                      console.log("✅ BUTTON CLICKED");
                      console.log("Tutor:", tutor);
                      bookSession(tutor);
                    }}
                  >
                    📚 Book Session
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="tutors-page-total">
        {shifts.length} Shifts × 3 Tutors = {shifts.length * 3} Centralised Tutors Total
      </div>
    </div>
  );
};

export default Tutors;