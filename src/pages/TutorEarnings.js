// src/pages/TutorEarnings.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';
import { API_BASE_URL } from '../services/api';
import './TutorEarnings.css';

const TutorEarnings = () => {
  const navigate = useNavigate();
  const [tutor, setTutor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [earningsData, setEarningsData] = useState(null);
  const [period, setPeriod] = useState('all');

  useEffect(() => {
    checkAuthAndFetch();
  }, []);

  const checkAuthAndFetch = async () => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      navigate('/login');
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      // Get current user
      const user = await authService.getCurrentUser();
      console.log('👤 Current user:', user);
      
      if (!user) {
        navigate('/login');
        return;
      }

      // Check if user has tutor access
      const isTutor = user.is_tutor === true || user.role === 'tutor' || user.role === 'TUTOR';
      console.log('🔍 Is tutor:', isTutor);
      
      if (!isTutor) {
        setError('You do not have tutor access. Please contact support if you believe this is an error.');
        setLoading(false);
        return;
      }

      setTutor(user);
      
      // Fetch earnings - using the correct API endpoint
      await fetchEarnings(token);
      
    } catch (error) {
      console.error('❌ Auth check failed:', error);
      setError('Failed to authenticate. Please try logging in again.');
      setLoading(false);
    }
  };

  const fetchEarnings = async (token) => {
    try {
      setLoading(true);
      setError('');
      
      // ✅ CORRECT: Use API_BASE_URL which includes /api
      // Full URL: https://eduspantech-backend.onrender.com/api/earnings
      const earningsUrl = `${API_BASE_URL}/earnings`;
      console.log('📊 Fetching earnings from:', earningsUrl);
      
      const response = await fetch(earningsUrl, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('📊 Response status:', response.status);

      // Check if response is JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('❌ Non-JSON response:', text.substring(0, 200));
        throw new Error('Server returned non-JSON response. Please check if the API endpoint is correct.');
      }

      const data = await response.json();
      console.log('📊 Earnings response:', data);

      if (!response.ok) {
        // Handle specific error cases
        if (response.status === 404) {
          throw new Error('Tutor profile not found. Please contact support to set up your tutor account.');
        } else if (response.status === 401) {
          throw new Error('Session expired. Please log in again.');
        } else {
          throw new Error(data.error || data.message || 'Failed to fetch earnings data');
        }
      }

      // Your backend returns: { success: true, earnings: { ... } }
      if (data.success && data.earnings) {
        console.log('✅ Earnings data received:', data.earnings);
        setEarningsData(data.earnings);
      } else {
        throw new Error(data.error || 'Invalid response from server');
      }
      
    } catch (error) {
      console.error('❌ Failed to fetch earnings:', error);
      setError(error.message || 'Failed to load earnings data');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    if (typeof amount !== 'number' || isNaN(amount)) return 'R0.00';
    return `R${amount.toFixed(2)}`;
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return 'N/A';
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch {
      return 'N/A';
    }
  };

  const getFilteredHistory = () => {
    if (!earningsData?.history) return [];
    if (!Array.isArray(earningsData.history)) return [];
    
    if (period === 'all') return earningsData.history;
    
    const now = new Date();
    const filterDate = new Date(now);
    
    if (period === 'week') {
      filterDate.setDate(now.getDate() - 7);
    } else if (period === 'month') {
      filterDate.setMonth(now.getMonth() - 1);
    }
    
    return earningsData.history.filter(item => {
      try {
        const itemDate = new Date(item.date);
        return !isNaN(itemDate.getTime()) && itemDate >= filterDate;
      } catch {
        return false;
      }
    });
  };

  const handleRefresh = () => {
    setLoading(true);
    checkAuthAndFetch();
  };

  // Loading state
  if (loading) {
    return (
      <div className="tutor-earnings-loading">
        <div className="loading-spinner"></div>
        <p>Loading earnings data...</p>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="tutor-earnings-error">
        <span className="error-icon">⚠️</span>
        <h3>Failed to load earnings</h3>
        <p>{error}</p>
        <button className="retry-btn" onClick={handleRefresh}>
          🔄 Retry
        </button>
      </div>
    );
  }

  // No earnings data state
  if (!earningsData) {
    return (
      <div className="tutor-earnings-error">
        <span className="error-icon">📊</span>
        <h3>No earnings data available</h3>
        <p>Start teaching sessions to see your earnings here.</p>
        <button className="retry-btn" onClick={handleRefresh}>
          🔄 Refresh
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
                {earningsData.studentCount || 0} students • {earningsData.sessionsCount || 0} sessions completed
              </p>
            </div>
            <div className="header-right">
              <button className="btn-refresh" onClick={handleRefresh}>
                🔄 Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="earnings-stats">
          <div className="stat-card total">
            <span className="stat-label">Total Earnings</span>
            <span className="stat-number">{formatCurrency(earningsData.total || 0)}</span>
          </div>
          <div className="stat-card month">
            <span className="stat-label">This Month</span>
            <span className="stat-number">{formatCurrency(earningsData.thisMonth || 0)}</span>
          </div>
          <div className="stat-card week">
            <span className="stat-label">This Week</span>
            <span className="stat-number">{formatCurrency(earningsData.thisWeek || 0)}</span>
          </div>
          <div className="stat-card sessions">
            <span className="stat-label">Completed Sessions</span>
            <span className="stat-number">{earningsData.sessionsCount || 0}</span>
          </div>
          <div className="stat-card pending">
            <span className="stat-label">Pending Sessions</span>
            <span className="stat-number">{earningsData.pendingSessions || 0}</span>
          </div>
        </div>

        {/* History Table */}
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
                <div key={item.id || Math.random()} className="table-row">
                  <span className="date">{formatDate(item.date)}</span>
                  <span className="student">{item.student || 'Student'}</span>
                  <span className="subject">{item.subject || 'Mathematics'}</span>
                  <span className="duration">{item.duration || 60} min</span>
                  <span className="amount">{formatCurrency(item.amount || 0)}</span>
                  <span className={`status-badge ${item.status || 'pending'}`}>
                    {item.status === 'completed' ? '✅ Completed' : 
                     item.status === 'upcoming' ? '📅 Upcoming' : 
                     item.status === 'pending' ? '⏳ Pending' :
                     item.status === 'cancelled' ? '❌ Cancelled' :
                     item.status || 'Pending'}
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
                {formatCurrency(filteredHistory.reduce((sum, item) => sum + (item.amount || 0), 0))}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TutorEarnings;