import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';
import './Dashboard.css';

const Dashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [timeOfDay, setTimeOfDay] = useState('');
  const [subjects, setSubjects] = useState([]);
  // ✅ Removed unused 'enrollments' state
  const [userStats, setUserStats] = useState({
    coursesEnrolled: 0,
    hoursSpent: 0,
    badgesEarned: 0
  });

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const userData = await authService.getCurrentUser();
        if (userData) {
          setUser(userData);
          const hour = new Date().getHours();
          if (hour < 12) {
            setTimeOfDay('Good Morning');
          } else if (hour < 17) {
            setTimeOfDay('Good Afternoon');
          } else if (hour < 21) {
            setTimeOfDay('Good Evening');
          } else {
            setTimeOfDay('Good Night');
          }
          
          // Fetch REAL data
          await fetchRealData();
        } else {
          navigate('/login');
        }
      } catch (err) {
        setError('Failed to load user data');
        navigate('/login');
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [navigate]);

  // Fetch REAL data from database
  const fetchRealData = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      
      // 1. Fetch all subjects
      const subjectsResponse = await fetch('http://localhost:5000/api/v1/content/subjects', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (subjectsResponse.ok) {
        const data = await subjectsResponse.json();
        if (data.success && data.subjects) {
          setSubjects(data.subjects);
        }
      }

      // 2. Fetch user's enrollments (REAL data)
      const enrollResponse = await fetch('http://localhost:5000/api/v1/content/my/subjects', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (enrollResponse.ok) {
        const data = await enrollResponse.json();
        if (data.success) {
          const enrolledCount = data.subjects?.length || 0;
          setUserStats(prev => ({
            ...prev,
            coursesEnrolled: enrolledCount
          }));
        }
      }

    } catch (error) {
      console.error('Failed to fetch data:', error);
    }
  };

  if (loading) return <div className="dashboard-loading">Loading your dashboard...</div>;
  if (error) return <div className="dashboard-error">{error}</div>;
  if (!user) return null;

  const firstName = user.name?.split(' ')[0] || 'Student';
  const isFirstTime = userStats.coursesEnrolled === 0;
  
  const cohortDisplay = user.cohort === 'HighSchool' 
    ? user.grade || 'High School Student' 
    : 'University Student';

  // Get REAL stats
  const coursesEnrolled = userStats.coursesEnrolled || 0;
  const hoursSpent = userStats.hoursSpent || 0;
  const badgesEarned = userStats.badgesEarned || 0;

  // Get motivational quote
  const getMotivationalQuote = () => {
    const quotes = [
      { text: "Mathematics is not about numbers, equations, computations, or algorithms: it is about understanding.", author: "William Paul Thurston" },
      { text: "The only way to learn mathematics is to do mathematics.", author: "Paul Halmos" },
      { text: "Without mathematics, there's nothing you can do. Everything around you is mathematics.", author: "Shakuntala Devi" },
      { text: "Pure mathematics is, in its way, the poetry of logical ideas.", author: "Albert Einstein" },
      { text: "The essence of mathematics is not to make simple things complicated, but to make complicated things simple.", author: "Stan Gudder" }
    ];
    return quotes[Math.floor(Math.random() * quotes.length)];
  };

  const quote = getMotivationalQuote();

  return (
    <div className="dashboard-container">
      {/* Header */}
      <div className="dashboard-header">
        <div className="greeting-section">
          <h1 className="greeting-name">
            {timeOfDay}, {firstName}
            <span className="greeting-emoji">{isFirstTime ? ' 👋' : ' ✨'}</span>
          </h1>
          <p className="greeting-subtitle">
            {cohortDisplay} • {user.country || 'South Africa'}
          </p>
        </div>
        <div className="header-right">
          <div className="badge-status">
            <span className="badge-dot"></span>
            <span className="badge-text">Active</span>
          </div>
        </div>
      </div>

      {/* Welcome Banner - Only for first time users */}
      {isFirstTime && (
        <div className="welcome-banner">
          <div className="welcome-banner-content">
            <div className="welcome-icon">🚀</div>
            <div className="welcome-text">
              <h3>Welcome to EduSpantech, {firstName}!</h3>
              <p>Start your mathematics journey by exploring our subjects.</p>
            </div>
          </div>
        </div>
      )}

      {/* Stats Grid - Shows REAL numbers from database */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon-wrapper">
            <span className="stat-icon">📚</span>
          </div>
          <div className="stat-info">
            <span className="stat-value">{coursesEnrolled}</span>
            <span className="stat-label">Courses Enrolled</span>
            {isFirstTime && <span className="stat-hint">Enroll in a course</span>}
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon-wrapper">
            <span className="stat-icon">⏱️</span>
          </div>
          <div className="stat-info">
            <span className="stat-value">{hoursSpent}</span>
            <span className="stat-label">Hours Spent</span>
            <span className="stat-hint">Coming soon</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon-wrapper">
            <span className="stat-icon">🏅</span>
          </div>
          <div className="stat-info">
            <span className="stat-value">{badgesEarned}</span>
            <span className="stat-label">Badges Earned</span>
            <span className="stat-hint">Coming soon</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon-wrapper">
            <span className="stat-icon">📈</span>
          </div>
          <div className="stat-info">
            <span className="stat-value">{coursesEnrolled > 0 ? `${Math.min(coursesEnrolled * 20, 100)}%` : '0%'}</span>
            <span className="stat-label">Progress</span>
            {isFirstTime && <span className="stat-hint">Start learning</span>}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="quick-actions">
        <button className="action-btn" onClick={() => navigate('/subjects')}>
          <span className="action-icon">📐</span>
          Browse Subjects
        </button>
        <button className="action-btn" onClick={() => navigate('/tutors')}>
          <span className="action-icon">👨‍🏫</span>
          Find a Tutor
        </button>
        <button className="action-btn" onClick={() => navigate('/pricing')}>
          <span className="action-icon">💎</span>
          Upgrade Plan
        </button>
        <button className="action-btn" onClick={() => navigate('/resources')}>
          <span className="action-icon">📖</span>
          Resources
        </button>
      </div>

      {/* Available Subjects - REAL subjects from database */}
      <div className="popular-section">
        <div className="popular-header">
          <div className="popular-title-group">
            <span className="popular-icon">📚</span>
            <h2 className="popular-title">Available Subjects</h2>
          </div>
          <p className="popular-description">
            {subjects.length > 0 
              ? `${subjects.length} subjects available` 
              : 'Loading subjects...'}
          </p>
        </div>
        
        <div className="popular-grid">
          {subjects && subjects.length > 0 ? (
            subjects.map((subject, index) => (
              <div 
                key={subject.id} 
                className="popular-card"
                onClick={() => navigate(`/subjects/${subject.name.toLowerCase()}`)}
              >
                <div className="popular-card-header">
                  <span className="popular-card-icon">{subject.icon || '📘'}</span>
                </div>
                <div className="popular-card-body">
                  <h3 className="popular-card-title">{subject.name}</h3>
                  <span className="popular-card-tier">{subject.tier || 'Tier 1'}</span>
                </div>
                <div className="popular-card-footer">
                  <span className="popular-card-topics">
                    📖 {subject.topics?.length || 0} topics
                  </span>
                </div>
              </div>
            ))
          ) : (
            <p className="no-subjects">No subjects available yet</p>
          )}
        </div>
      </div>

      {/* Quote Section */}
      <div className="quote-section">
        <div className="quote-divider"></div>
        <blockquote className="quote-block">
          <p className="quote-text">"{quote.text}"</p>
          <footer className="quote-author">— {quote.author}</footer>
        </blockquote>
      </div>
    </div>
  );
};

export default Dashboard;