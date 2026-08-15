// src/pages/TutorEarnings.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';
import './TutorEarnings.css';

const TutorEarnings = () => {
  const navigate = useNavigate();
  const [tutor, setTutor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [earningsData, setEarningsData] = useState(null);
  const [period, setPeriod] = useState('all');

  useEffect(() => {
    checkAuth();
    fetchEarnings();
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

  const fetchEarnings = async () => {
    try {
      setLoading(true);
      setError('');
      const token = localStorage.getItem('accessToken');
      
      console.log('📊 Fetching earnings from API...');
      
      const response = await fetch('https://eduspantech-backend.onrender.com/api/tutors/earnings', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      console.log('📊 Earnings response:', data);

      if (response.ok && data.success) {
        setEarningsData(data.earnings);
      } else {
        setError(data.error || 'Failed to load earnings');
      }
    } catch (error) {
      console.error('❌ Failed to fetch earnings:', error);
      setError('Failed to load earnings data');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    if (typeof amount !== 'number') return 'R0.00';
    return `R${amount.toFixed(2)}`;
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

  const getFilteredHistory = () => {
    if (!earningsData?.history) return [];
    
    if (period === 'all') return earningsData.history;
    
    const now = new Date();
    const filterDate = new Date(now);
    
    if (period === 'week') {
      filterDate.setDate(now.getDate() - 7);
    } else if (period === 'month') {
      filterDate.setMonth(now.getMonth() - 1);
    }
    
    return earningsData.history.filter(item => 
      new Date(item.date) >= filterDate
    );
  };

  if (loading) {
    return (
      <div className="tutor-earnings-loading">
        <div className="loading-spinner"></div>
        <p>Loading earnings...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="tutor-earnings-error">
        <span className="error-icon">⚠️</span>
        <h3>Failed to load earnings</h3>
        <p>{error}</p>
        <button className="retry-btn" onClick={fetchEarnings}>
          Retry
        </button>
      </div>
    );
  }

  const filteredHistory = getFilteredHistory();

  return (
    <div className="tutor-earnings-wrapper">
      <div className="tutor-earnings-bg">
        <div className="gradient-orb orb-1"></div>
        <div className="gradient-orb orb-2"></div>
        <div className="gradient-orb orb-3"></div>
      </div>

      <div className="tutor-earnings-container">
        {/* Header */}
        <div className="tutor-earnings-header">
          <div className="header-content">
            <div className="header-left">
              <h1 className="header-title">
                <span className="title-icon">📊</span>
                Earnings
              </h1>
              <p className="header-subtitle">
                {earningsData?.studentCount || 0} students • {earningsData?.sessionsCount || 0} sessions completed
              </p>
            </div>
            <div className="header-right">
              <button className="btn-refresh" onClick={fetchEarnings}>
                🔄 Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="earnings-stats">
          <div className="stat-card total">
            <span className="stat-label">Total Earnings</span>
            <span className="stat-number">{formatCurrency(earningsData?.total || 0)}</span>
          </div>
          <div className="stat-card month">
            <span className="stat-label">This Month</span>
            <span className="stat-number">{formatCurrency(earningsData?.thisMonth || 0)}</span>
          </div>
          <div className="stat-card week">
            <span className="stat-label">This Week</span>
            <span className="stat-number">{formatCurrency(earningsData?.thisWeek || 0)}</span>
          </div>
          <div className="stat-card sessions">
            <span className="stat-label">Completed Sessions</span>
            <span className="stat-number">{earningsData?.sessionsCount || 0}</span>
          </div>
          <div className="stat-card pending">
            <span className="stat-label">Pending Sessions</span>
            <span className="stat-number">{earningsData?.pendingSessions || 0}</span>
          </div>
        </div>

        {/* History */}
        <div className="earnings-history">
          <div className="history-header">
            <h3>📋 Earnings History</h3>
            <div className="period-selector">
              <button 
                className={`period-btn ${period === 'all' ? 'active' : ''}`}
                onClick={() => setPeriod('all')}
              >
                All
              </button>
              <button 
                className={`period-btn ${period === 'month' ? 'active' : ''}`}
                onClick={() => setPeriod('month')}
              >
                Month
              </button>
              <button 
                className={`period-btn ${period === 'week' ? 'active' : ''}`}
                onClick={() => setPeriod('week')}
              >
                Week
              </button>
            </div>
          </div>

          <div className="history-table">
            <div className="table-header">
              <span>Date</span>
              <span>Student</span>
              <span>Subject</span>
              <span>Duration</span>
              <span>Amount</span>
              <span>Status</span>
            </div>
            {filteredHistory && filteredHistory.length > 0 ? (
              filteredHistory.map((item) => (
                <div key={item.id} className="table-row">
                  <span className="date">{formatDate(item.date)}</span>
                  <span className="student">{item.student}</span>
                  <span className="subject">{item.subject}</span>
                  <span className="duration">{item.duration || 60} min</span>
                  <span className="amount">{formatCurrency(item.amount)}</span>
                  <span className={`status-badge ${item.status}`}>
                    {item.status === 'completed' ? '✅ Completed' : 
                     item.status === 'upcoming' ? '📅 Upcoming' : 
                     item.status}
                  </span>
                </div>
              ))
            ) : (
              <div className="empty-history">
                <p>No earnings history yet.</p>
                <p className="empty-sub">Complete sessions to start earning!</p>
              </div>
            )}
          </div>

          {filteredHistory && filteredHistory.length > 0 && (
            <div className="history-footer">
              <span className="total-label">Total:</span>
              <span className="total-amount">
                {formatCurrency(filteredHistory.reduce((sum, item) => sum + item.amount, 0))}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TutorEarnings;