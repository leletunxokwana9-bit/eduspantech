// src/pages/MyCourses.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';
import { API_BASE_URL } from '../services/api';
import './MyCourses.css';

const MyCourses = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showRedirectPopup, setShowRedirectPopup] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [expandedCourse, setExpandedCourse] = useState(null);

  useEffect(() => {
    const fetchUserAndCourses = async () => {
      try {
        const userData = await authService.getCurrentUser();
        if (userData) {
          setUser(userData);
          await fetchEnrolledCourses();
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

    fetchUserAndCourses();
  }, [navigate]);

  const fetchEnrolledCourses = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      
      // ✅ FIXED: Using API_BASE_URL from api.js (no /v1)
      const response = await fetch(`${API_BASE_URL}/content/my/subjects`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.subjects) {
          setEnrolledCourses(data.subjects);
          await fetchCourseDetails(data.subjects);
        } else {
          setEnrolledCourses([]);
        }
      } else {
        setEnrolledCourses([]);
      }
    } catch (error) {
      console.error('Failed to fetch enrolled courses:', error);
      setEnrolledCourses([]);
    }
  };

  const fetchCourseDetails = async (courses) => {
    try {
      const token = localStorage.getItem('accessToken');
      
      const updatedCourses = await Promise.all(
        courses.map(async (course) => {
          try {
            // ✅ FIXED: Using API_BASE_URL (no /v1)
            const progressResponse = await fetch(
              `${API_BASE_URL}/content/my/subjects/${course.id}/progress`,
              {
                headers: {
                  'Authorization': `Bearer ${token}`
                }
              }
            );

            if (progressResponse.ok) {
              const progressData = await progressResponse.json();
              return {
                ...course,
                progress: progressData.progress || 0,
                completedTopics: progressData.completedTopics || 0,
                totalTopics: course.topics?.length || 0,
                lastAccessed: progressData.lastAccessed || null,
                quizScores: progressData.quizScores || [],
                timeSpent: progressData.timeSpent || 0,
                upcomingDeadlines: progressData.upcomingDeadlines || []
              };
            }
            return {
              ...course,
              progress: 0,
              completedTopics: 0,
              totalTopics: course.topics?.length || 0,
              lastAccessed: null,
              quizScores: [],
              timeSpent: 0,
              upcomingDeadlines: []
            };
          } catch (error) {
            return {
              ...course,
              progress: 0,
              completedTopics: 0,
              totalTopics: course.topics?.length || 0,
              lastAccessed: null,
              quizScores: [],
              timeSpent: 0,
              upcomingDeadlines: []
            };
          }
        })
      );

      setEnrolledCourses(updatedCourses);
    } catch (error) {
      console.error('Failed to fetch course details:', error);
    }
  };

  const handleCourseClick = (course) => {
    setSelectedCourse(course);
    setExpandedCourse(expandedCourse === course.id ? null : course.id);
  };

  const handleContinueLearning = (courseId) => {
    navigate(`/subjects/${courseId}`);
  };

  const handleViewDetails = (courseId) => {
    navigate(`/curriculum/${courseId}`);
  };

  const handleRedirectToSubjects = () => {
    setShowRedirectPopup(true);
  };

  const handleProceed = () => {
    setShowRedirectPopup(false);
    navigate('/subjects');
  };

  const handleCancel = () => {
    setShowRedirectPopup(false);
  };

  const getProgressColor = (progress) => {
    if (progress >= 80) return 'progress-high';
    if (progress >= 50) return 'progress-medium';
    if (progress >= 20) return 'progress-low';
    return 'progress-start';
  };

  const getTimeSpent = (minutes) => {
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    if (remainingMinutes === 0) return `${hours}h`;
    return `${hours}h ${remainingMinutes}min`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="my-courses-loading">
        <div className="loading-spinner"></div>
        <p>Loading your courses...</p>
      </div>
    );
  }

  if (error) {
    return <div className="my-courses-error">{error}</div>;
  }

  return (
    <div className="my-courses-wrapper">
      <div className="my-courses-bg">
        <div className="gradient-orb orb-1"></div>
        <div className="gradient-orb orb-2"></div>
        <div className="gradient-orb orb-3"></div>
      </div>

      <div className="my-courses-container">
        <div className="my-courses-header">
          <div className="header-content">
            <div className="header-left">
              <h1 className="header-title">
                <span className="title-icon">📚</span>
                My Courses
              </h1>
              <p className="header-subtitle">
                {enrolledCourses.length === 0 
                  ? "You haven't enrolled in any courses yet"
                  : `You are enrolled in ${enrolledCourses.length} course${enrolledCourses.length > 1 ? 's' : ''}`
                }
              </p>
            </div>
            {/* ===== ONLY SHOW "Browse Subjects" IF USER HAS COURSES ===== */}
            {enrolledCourses.length > 0 && (
              <div className="header-right">
                <button 
                  className="browse-btn"
                  onClick={handleRedirectToSubjects}
                >
                  <span className="btn-icon">➕</span>
                  Browse Subjects
                </button>
              </div>
            )}
          </div>
        </div>

        {enrolledCourses.length > 0 && (
          <div className="courses-stats">
            <div className="stat-item">
              <span className="stat-number">{enrolledCourses.length}</span>
              <span className="stat-label">Total Courses</span>
            </div>
            <div className="stat-divider"></div>
            <div className="stat-item">
              <span className="stat-number">
                {Math.round(enrolledCourses.reduce((acc, course) => acc + (course.progress || 0), 0) / enrolledCourses.length)}%
              </span>
              <span className="stat-label">Average Progress</span>
            </div>
            <div className="stat-divider"></div>
            <div className="stat-item">
              <span className="stat-number">
                {enrolledCourses.reduce((acc, course) => acc + (course.completedTopics || 0), 0)}
              </span>
              <span className="stat-label">Topics Completed</span>
            </div>
            <div className="stat-divider"></div>
            <div className="stat-item">
              <span className="stat-number">
                {getTimeSpent(enrolledCourses.reduce((acc, course) => acc + (course.timeSpent || 0), 0))}
              </span>
              <span className="stat-label">Total Time Spent</span>
            </div>
          </div>
        )}

        {enrolledCourses.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📖</div>
            <h3>No Courses Enrolled Yet</h3>
            <p>
              You haven't enrolled in any courses. Explore our subjects and 
              start your learning journey today!
            </p>
            <button 
              className="empty-enroll-btn"
              onClick={handleRedirectToSubjects}
            >
              Explore Subjects
            </button>
          </div>
        ) : (
          <div className="courses-grid">
            {enrolledCourses.map((course) => (
              <div 
                key={course.id} 
                className={`course-card ${expandedCourse === course.id ? 'expanded' : ''}`}
              >
                <div 
                  className="course-card-header"
                  onClick={() => handleCourseClick(course)}
                >
                  <div className="course-icon-wrapper">
                    <span className="course-icon">{course.icon || '📘'}</span>
                  </div>
                  <div className="course-info">
                    <h3 className="course-title">{course.name}</h3>
                    <div className="course-meta">
                      <span className="course-tier">{course.tier || 'Tier 1'}</span>
                      <span className="course-topics">{course.totalTopics} topics</span>
                      {course.lastAccessed && (
                        <span className="course-last">Last: {formatDate(course.lastAccessed)}</span>
                      )}
                    </div>
                  </div>
                  <div className="course-progress-wrapper">
                    <div className="course-progress-circle">
                      <svg viewBox="0 0 36 36" className="progress-ring">
                        <circle 
                          cx="18" 
                          cy="18" 
                          r="15" 
                          fill="none" 
                          className="progress-ring-bg"
                        />
                        <circle 
                          cx="18" 
                          cy="18" 
                          r="15" 
                          fill="none" 
                          className={`progress-ring-fill ${getProgressColor(course.progress)}`}
                          strokeDasharray={`${course.progress * 94.2 / 100} 94.2`}
                          strokeLinecap="round"
                        />
                      </svg>
                      <span className="progress-text">{Math.round(course.progress || 0)}%</span>
                    </div>
                  </div>
                </div>

                {expandedCourse === course.id && (
                  <div className="course-details">
                    <div className="details-grid">
                      <div className="detail-section">
                        <h4>📊 Progress Details</h4>
                        <div className="progress-details">
                          <div className="progress-bar-container">
                            <div className="progress-bar">
                              <div 
                                className={`progress-fill ${getProgressColor(course.progress)}`}
                                style={{ width: `${course.progress || 0}%` }}
                              ></div>
                            </div>
                            <span className="progress-percentage">{Math.round(course.progress || 0)}% Complete</span>
                          </div>
                          <div className="progress-stats">
                            <div className="stat-row">
                              <span>✅ Completed Topics:</span>
                              <strong>{course.completedTopics || 0} / {course.totalTopics || 0}</strong>
                            </div>
                            <div className="stat-row">
                              <span>⏱️ Time Spent:</span>
                              <strong>{getTimeSpent(course.timeSpent || 0)}</strong>
                            </div>
                            <div className="stat-row">
                              <span>📝 Quizzes Taken:</span>
                              <strong>{course.quizScores?.length || 0}</strong>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="detail-section">
                        <h4>📋 Topics</h4>
                        <div className="topics-list">
                          {course.topics && course.topics.length > 0 ? (
                            course.topics.map((topic, index) => (
                              <div key={index} className="topic-item">
                                <span className="topic-status">
                                  {topic.completed ? '✅' : '⭕'}
                                </span>
                                <span className="topic-name">{topic.name}</span>
                              </div>
                            ))
                          ) : (
                            <p className="no-topics">No topics available</p>
                          )}
                        </div>
                      </div>

                      {course.upcomingDeadlines && course.upcomingDeadlines.length > 0 && (
                        <div className="detail-section">
                          <h4>⏰ Upcoming Deadlines</h4>
                          <div className="deadlines-list">
                            {course.upcomingDeadlines.map((deadline, index) => (
                              <div key={index} className="deadline-item">
                                <span className="deadline-name">{deadline.name}</span>
                                <span className="deadline-date">{formatDate(deadline.date)}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="course-actions">
                      <button 
                        className="action-btn continue-btn"
                        onClick={() => handleContinueLearning(course.id)}
                      >
                        <span className="btn-icon">▶️</span>
                        Continue Learning
                      </button>
                      <button 
                        className="action-btn details-btn"
                        onClick={() => handleViewDetails(course.id)}
                      >
                        <span className="btn-icon">📖</span>
                        View Full Details
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {enrolledCourses.length > 0 && (
          <div className="resources-section">
            <h3 className="resources-title">📚 Learning Resources</h3>
            <div className="resources-grid">
              <div className="resource-card">
                <span className="resource-icon">📝</span>
                <h4>Practice Tests</h4>
                <p>Test your knowledge with quizzes</p>
                <button className="resource-btn">View Tests</button>
              </div>
              <div className="resource-card">
                <span className="resource-icon">📹</span>
                <h4>Video Lessons</h4>
                <p>Watch recorded lectures</p>
                <button className="resource-btn">Watch Now</button>
              </div>
              <div className="resource-card">
                <span className="resource-icon">📄</span>
                <h4>Study Materials</h4>
                <p>Download notes and guides</p>
                <button className="resource-btn">Download</button>
              </div>
            </div>
          </div>
        )}
      </div>

      {showRedirectPopup && (
        <div className="popup-overlay">
          <div className="popup-backdrop" onClick={handleCancel}></div>
          <div className="popup-card">
            <div className="popup-icon">🔔</div>
            <h3 className="popup-title">No Courses Enrolled</h3>
            <p className="popup-message">
              You haven't enrolled in any courses yet. You will be redirected to 
              the subjects page to browse and enroll in your first course.
            </p>
            <div className="popup-actions">
              <button className="popup-btn cancel-btn" onClick={handleCancel}>
                Cancel
              </button>
              <button className="popup-btn proceed-btn" onClick={handleProceed}>
                Proceed to Subjects
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyCourses;