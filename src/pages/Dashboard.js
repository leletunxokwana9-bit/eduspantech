// src/pages/Dashboard.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Hand,
  Sparkles,
  Rocket,
  LibraryBig,
  Timer,
  Medal,
  TrendingUp,
  Ruler,
  UserSearch,
  Gem,
  BookOpen,
  Calculator,
  FlaskConical,
  Atom,
  Dna,
  BookText,
  Globe,
  Landmark,
  Receipt,
  Code,
  Monitor
} from 'lucide-react';
import { authService } from '../services/authService';
import { API_BASE_URL } from '../services/api';
import { useDynamicGreeting } from '../hooks/useDynamicGreeting';
import './Dashboard.css';

// Subject name -> Lucide icon (falls back to BookOpen)
const SUBJECT_ICONS = {
  mathematics: Calculator,
  maths: Calculator,
  'mathematical literacy': Calculator,
  'physical sciences': FlaskConical,
  physics: Atom,
  chemistry: FlaskConical,
  'life sciences': Dna,
  biology: Dna,
  english: BookText,
  geography: Globe,
  history: Landmark,
  accounting: Receipt,
  economics: TrendingUp,
  'computer science': Code,
  ict: Monitor
};

// Accent colours cycled across the subject cards
const CARD_COLORS = ['icon-blue', 'icon-purple', 'icon-amber', 'icon-green'];

const getSubjectIcon = (name = '') => SUBJECT_ICONS[name.toLowerCase()] || BookOpen;

const Dashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [timeOfDay, setTimeOfDay] = useState('');
  const [subjects, setSubjects] = useState([]);
  const [userStats, setUserStats] = useState({
    coursesEnrolled: 0,
    hoursSpent: 0,
    badgesEarned: 0
  });

  // Fetch the dynamic message from Supabase based on the user
  const dynamicTagline = useDynamicGreeting(user, 'dashboard');

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const userData = await authService.getCurrentUser();
        if (userData) {
          setUser(userData);

          const hour = new Date().getHours();
          if (hour < 12) setTimeOfDay('Good Morning');
          else if (hour < 17) setTimeOfDay('Good Afternoon');
          else if (hour < 21) setTimeOfDay('Good Evening');
          else setTimeOfDay('Good Night');

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

      const subjectsResponse = await fetch(`${API_BASE_URL}/content/subjects`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (subjectsResponse.ok) {
        const data = await subjectsResponse.json();
        if (data.success && data.subjects) {
          setSubjects(data.subjects);
        }
      }

      const enrollResponse = await fetch(`${API_BASE_URL}/content/my/subjects`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (enrollResponse.ok) {
        const data = await enrollResponse.json();
        if (data.success) {
          const enrolledCount = data.subjects?.length || 0;
          setUserStats((prev) => ({
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

  // Determine user role for the subtitle
  let roleDisplay = 'Student';
  if (user.is_admin) roleDisplay = 'Administrator';
  else if (user.is_tutor || user.role === 'tutor') roleDisplay = 'Tutor';
  else if (user.cohort === 'HighSchool')
    roleDisplay = user.grade ? `Grade ${user.grade} Student` : 'High School Student';
  else if (user.cohort === 'UniversityFirstYear' || user.grade === 1 || user.grade === 2)
    roleDisplay = 'University Student';

  // Get REAL stats
  const coursesEnrolled = userStats.coursesEnrolled || 0;
  const hoursSpent = userStats.hoursSpent || 0;
  const badgesEarned = userStats.badgesEarned || 0;

  return (
    <div className="dashboard-container">
      {/* Header */}
      <div className="dashboard-header">
        <div className="greeting-section">
          <h1 className="greeting-name">
            {timeOfDay}, {firstName}
            {isFirstTime ? (
              <Hand className="greeting-icon icon-amber" aria-hidden="true" />
            ) : (
              <Sparkles className="greeting-icon icon-amber" aria-hidden="true" />
            )}
          </h1>
          <p className="greeting-subtitle">
            {roleDisplay} • {user.country || 'South Africa'}
          </p>
        </div>
        <div className="header-right">
          <div className="badge-status">
            <span className="badge-dot"></span>
            <span className="badge-text">Active</span>
          </div>
        </div>
      </div>

      {/* Welcome Banner - shows dynamic taglines from Supabase */}
      {isFirstTime && (
        <div className="welcome-banner">
          <div className="welcome-banner-content">
            <Rocket className="welcome-icon icon-purple" aria-hidden="true" />
            <div className="welcome-text">
              <h3>Welcome to EduSpantech, {firstName}!</h3>
              <p>{dynamicTagline}</p>
            </div>
          </div>
        </div>
      )}

      {/* If they are NOT first time, show the dynamic tagline as a subtle banner */}
      {!isFirstTime && (
        <div
          className="welcome-banner"
          style={{ background: 'rgba(79, 70, 229, 0.05)', borderColor: 'rgba(79, 70, 229, 0.1)' }}
        >
          <div className="welcome-banner-content">
            <Sparkles className="welcome-icon icon-purple" aria-hidden="true" />
            <div className="welcome-text">
              <p style={{ fontSize: '15px', color: '#94a3b8', margin: 0 }}>{dynamicTagline}</p>
            </div>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon-wrapper icon-blue">
            <LibraryBig className="stat-icon" aria-hidden="true" />
          </div>
          <div className="stat-info">
            <span className="stat-value">{coursesEnrolled}</span>
            <span className="stat-label">Courses Enrolled</span>
            {isFirstTime && <span className="stat-hint">Enroll in a course</span>}
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon-wrapper icon-purple">
            <Timer className="stat-icon" aria-hidden="true" />
          </div>
          <div className="stat-info">
            <span className="stat-value">{hoursSpent}</span>
            <span className="stat-label">Hours Spent</span>
            <span className="stat-hint">Coming soon</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon-wrapper icon-amber">
            <Medal className="stat-icon" aria-hidden="true" />
          </div>
          <div className="stat-info">
            <span className="stat-value">{badgesEarned}</span>
            <span className="stat-label">Badges Earned</span>
            <span className="stat-hint">Coming soon</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon-wrapper icon-green">
            <TrendingUp className="stat-icon" aria-hidden="true" />
          </div>
          <div className="stat-info">
            <span className="stat-value">
              {coursesEnrolled > 0 ? `${Math.min(coursesEnrolled * 20, 100)}%` : '0%'}
            </span>
            <span className="stat-label">Progress</span>
            {isFirstTime && <span className="stat-hint">Start learning</span>}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="quick-actions">
        <button className="action-btn" onClick={() => navigate('/subjects')}>
          <Ruler className="action-icon icon-blue" aria-hidden="true" />
          Browse Subjects
        </button>
        <button className="action-btn" onClick={() => navigate('/tutors')}>
          <UserSearch className="action-icon icon-green" aria-hidden="true" />
          Find a Tutor
        </button>
        <button className="action-btn" onClick={() => navigate('/pricing')}>
          <Gem className="action-icon icon-purple" aria-hidden="true" />
          Upgrade Plan
        </button>
        <button className="action-btn" onClick={() => navigate('/resources')}>
          <BookOpen className="action-icon icon-amber" aria-hidden="true" />
          Resources
        </button>
      </div>

      {/* Available Subjects */}
      <div className="popular-section">
        <div className="popular-header">
          <div className="popular-title-group">
            <LibraryBig className="popular-icon icon-blue" aria-hidden="true" />
            <h2 className="popular-title">Available Subjects</h2>
          </div>
          <p className="popular-description">
            {subjects.length > 0 ? `${subjects.length} subjects available` : 'Loading subjects...'}
          </p>
        </div>

        <div className="popular-grid">
          {subjects && subjects.length > 0 ? (
            subjects.map((subject, index) => {
              const SubjectIcon = getSubjectIcon(subject.name);
              return (
                <div
                  key={subject.id}
                  className="popular-card"
                  onClick={() => navigate(`/subjects/${subject.name.toLowerCase()}`)}
                >
                  <div className="popular-card-header">
                    <SubjectIcon
                      className={`popular-card-icon ${CARD_COLORS[index % CARD_COLORS.length]}`}
                      aria-hidden="true"
                    />
                  </div>
                  <div className="popular-card-body">
                    <h3 className="popular-card-title">{subject.name}</h3>
                    <span className="popular-card-tier">{subject.tier || 'Tier 1'}</span>
                  </div>
                  <div className="popular-card-footer">
                    <span className="popular-card-topics">
                      <BookOpen className="topics-icon" aria-hidden="true" />
                      {subject.topics?.length || 0} topics
                    </span>
                  </div>
                </div>
              );
            })
          ) : (
            <p className="no-subjects">No subjects available yet</p>
          )}
        </div>
      </div>

      {/* Dynamic Quote Section */}
      <div className="quote-section">
        <div className="quote-divider"></div>
        <blockquote className="quote-block">
          <p className="quote-text">"{dynamicTagline}"</p>
          <footer className="quote-author">— EduSpantech</footer>
        </blockquote>
      </div>
    </div>
  );
};

export default Dashboard;
