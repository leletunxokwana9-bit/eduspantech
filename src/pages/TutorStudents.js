// src/pages/TutorStudents.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';
import { API_BASE_URL } from '../services/api';
import './TutorStudents.css';

const TutorStudents = () => {
  const navigate = useNavigate();
  const [tutor, setTutor] = useState(null);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedStudent, setSelectedStudent] = useState(null);

  useEffect(() => {
    checkAuth();
    fetchStudents();
  }, []);

  const checkAuth = async () => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      navigate('/login');
      return;
    }

    try {
      const user = await authService.getCurrentUser();
      if (user) {
        const isTutor = user.is_tutor === true || user.role === 'tutor';
        if (!isTutor) {
          navigate('/dashboard');
          return;
        }
        setTutor(user);
      }
    } catch (error) {
      navigate('/login');
    }
  };

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('accessToken');
      
      const response = await fetch(`${API_BASE_URL}/tutors/students`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setStudents(data.students || []);
      } else {
        setStudents([]);
      }
    } catch (error) {
      console.error('Failed to fetch students:', error);
      setStudents([]);
    } finally {
      setLoading(false);
    }
  };

  const renderStudentAvatar = (student) => {
    const hasAvatar = student?.avatar && (
      student.avatar.startsWith('data:image') || 
      student.avatar.startsWith('http://') || 
      student.avatar.startsWith('https://')
    );

    if (hasAvatar) {
      return (
        <img 
          src={student.avatar} 
          alt={student.name} 
          className="student-avatar-img"
          onError={(e) => {
            e.target.style.display = 'none';
            const parent = e.target.parentElement;
            if (parent) {
              parent.textContent = student.name.charAt(0).toUpperCase();
              parent.style.fontSize = '18px';
              parent.style.fontWeight = '600';
              parent.style.display = 'flex';
              parent.style.alignItems = 'center';
              parent.style.justifyContent = 'center';
              parent.style.background = 'linear-gradient(135deg, #4f46e5, #7c3aed)';
              parent.style.color = '#fff';
            }
          }}
        />
      );
    }
    
    return student.name.charAt(0).toUpperCase();
  };

  const getFilteredStudents = () => {
    let filtered = students;
    
    if (searchTerm) {
      filtered = filtered.filter(s => 
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.subjects?.some(sub => sub.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    
    if (filterStatus === 'active') {
      filtered = filtered.filter(s => s.status === 'active');
    } else if (filterStatus === 'inactive') {
      filtered = filtered.filter(s => s.status === 'inactive');
    }
    
    return filtered;
  };

  const getStatusColor = (status) => {
    return status === 'active' ? '#34d399' : '#f87171';
  };

  const getProgressColor = (progress) => {
    if (progress >= 70) return '#34d399';
    if (progress >= 40) return '#fbbf24';
    return '#f87171';
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="tutor-students-loading">
        <div className="loading-spinner"></div>
        <p>Loading students...</p>
      </div>
    );
  }

  return (
    <div className="tutor-students-wrapper">
      <div className="tutor-students-bg">
        <div className="gradient-orb orb-1"></div>
        <div className="gradient-orb orb-2"></div>
        <div className="gradient-orb orb-3"></div>
      </div>

      <div className="tutor-students-container">
        <div className="tutor-students-header">
          <div className="header-content">
            <div className="header-left">
              <h1 className="header-title">
                <span className="title-icon">👨‍🎓</span>
                My Students
              </h1>
              <p className="header-subtitle">
                {students.length} student{students.length !== 1 ? 's' : ''} total
              </p>
            </div>
            <div className="header-right">
              <button className="btn-primary" onClick={() => navigate('/tutors')}>
                <span className="btn-icon">➕</span>
                Find New Students
              </button>
            </div>
          </div>
        </div>

        <div className="tutor-students-stats">
          <div className="stat-card">
            <span className="stat-number">{students.filter(s => s.status === 'active').length}</span>
            <span className="stat-label">🟢 Active</span>
          </div>
          <div className="stat-card">
            <span className="stat-number">{students.reduce((acc, s) => acc + (s.sessions || 0), 0)}</span>
            <span className="stat-label">📚 Total Sessions</span>
          </div>
          <div className="stat-card">
            <span className="stat-number">{students.length > 0 ? Math.round(students.reduce((acc, s) => acc + (s.progress || 0), 0) / students.length) : 0}%</span>
            <span className="stat-label">📈 Avg Progress</span>
          </div>
        </div>

        <div className="tutor-students-toolbar">
          <div className="search-container">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              className="search-input"
              placeholder="Search students by name or subject..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="filter-container">
            <button 
              className={`filter-btn ${filterStatus === 'all' ? 'active' : ''}`}
              onClick={() => setFilterStatus('all')}
            >
              All
            </button>
            <button 
              className={`filter-btn ${filterStatus === 'active' ? 'active' : ''}`}
              onClick={() => setFilterStatus('active')}
            >
              Active
            </button>
            <button 
              className={`filter-btn ${filterStatus === 'inactive' ? 'active' : ''}`}
              onClick={() => setFilterStatus('inactive')}
            >
              Inactive
            </button>
          </div>
        </div>

        <div className="tutor-students-grid">
          {getFilteredStudents().length > 0 ? (
            getFilteredStudents().map((student) => (
              <div 
                key={student.id} 
                className={`student-card ${selectedStudent === student.id ? 'expanded' : ''}`}
                onClick={() => setSelectedStudent(selectedStudent === student.id ? null : student.id)}
              >
                <div className="student-card-header">
                  <div className="student-avatar">
                    {renderStudentAvatar(student)}
                  </div>
                  <div className="student-info">
                    <h3 className="student-name">{student.name}</h3>
                    <div className="student-meta">
                      <span className="student-grade">🎓 Grade {student.grade}</span>
                      <span className="student-status" style={{ color: getStatusColor(student.status) }}>
                        ● {student.status}
                      </span>
                    </div>
                  </div>
                  <div className="student-progress">
                    <div className="progress-bar">
                      <div 
                        className="progress-fill" 
                        style={{ 
                          width: `${student.progress || 0}%`,
                          background: getProgressColor(student.progress || 0)
                        }}
                      ></div>
                    </div>
                    <span className="progress-text">{student.progress || 0}%</span>
                  </div>
                </div>

                {selectedStudent === student.id && (
                  <div className="student-card-details">
                    <div className="details-row">
                      <div className="detail-item">
                        <span className="detail-label">📖 Subjects</span>
                        <div className="subject-tags">
                          {student.subjects?.map((subject, idx) => (
                            <span key={idx} className="subject-tag">{subject}</span>
                          ))}
                        </div>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">📅 Sessions</span>
                        <span className="detail-value">{student.sessions || 0}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">📆 Last Session</span>
                        <span className="detail-value">{formatDate(student.lastSession)}</span>
                      </div>
                    </div>
                    <div className="student-actions">
                      <button className="action-btn primary" onClick={() => navigate(`/session/book?student=${student.id}`)}>
                        📚 Book Session
                      </button>
                      <button className="action-btn secondary" onClick={() => navigate(`/profile/${student.id}`)}>
                        👤 View Profile
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="empty-state">
              <span className="empty-icon">📭</span>
              <h3>No Students Found</h3>
              <p>You haven't taught any students yet. Start by booking sessions with new students!</p>
              <button className="empty-btn" onClick={() => navigate('/tutors')}>
                Find Students →
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TutorStudents;