// src/pages/TutorEarnings.js - WITH DOWNLOAD BUTTONS VISIBLE
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
  const [downloading, setDownloading] = useState(false);

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
      
      const user = await authService.getCurrentUser();
      console.log('👤 Current user:', user);
      
      if (!user) {
        navigate('/login');
        return;
      }

      const isTutor = user.is_tutor === true || user.role === 'tutor' || user.role === 'TUTOR';
      console.log('🔍 Is tutor:', isTutor);
      
      if (!isTutor) {
        setError('You do not have tutor access. Please contact support if you believe this is an error.');
        setLoading(false);
        return;
      }

      setTutor(user);
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
      
      const earningsUrl = `${API_BASE_URL}/earnings`;
      console.log('📊 Fetching earnings from:', earningsUrl);
      
      const response = await fetch(earningsUrl, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('📊 Response status:', response.status);

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('❌ Non-JSON response:', text.substring(0, 200));
        throw new Error('Server returned non-JSON response.');
      }

      const data = await response.json();
      console.log('📊 Earnings response:', data);

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Tutor profile not found.');
        } else if (response.status === 401) {
          throw new Error('Session expired. Please log in again.');
        } else {
          throw new Error(data.error || data.message || 'Failed to fetch earnings data');
        }
      }

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

  // ============================================
  // DOWNLOAD FUNCTIONS
  // ============================================

  const getFilteredData = () => {
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

  // Generate payslip HTML
  const generatePayslipHTML = (data, tutorName, filteredData) => {
    const total = filteredData.reduce((sum, item) => sum + (item.amount || 0), 0);
    const currentDate = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Payslip - ${tutorName}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { 
            font-family: 'Segoe UI', Arial, sans-serif; 
            background: #ffffff; 
            padding: 40px;
            color: #1a1a2e;
          }
          .payslip-container {
            max-width: 800px;
            margin: 0 auto;
            background: #ffffff;
            border: 2px solid #e2e8f0;
            border-radius: 12px;
            padding: 40px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.08);
          }
          .payslip-header {
            text-align: center;
            padding-bottom: 24px;
            border-bottom: 3px solid #4f46e5;
            margin-bottom: 24px;
          }
          .payslip-header h1 {
            font-size: 28px;
            color: #1a1a2e;
            margin-bottom: 4px;
          }
          .payslip-header h1 span {
            color: #4f46e5;
          }
          .payslip-header .subtitle {
            color: #64748b;
            font-size: 14px;
          }
          .payslip-header .date {
            color: #94a3b8;
            font-size: 13px;
            margin-top: 4px;
          }
          .payslip-info {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 16px;
            background: #f8fafc;
            padding: 16px 20px;
            border-radius: 8px;
            margin-bottom: 24px;
          }
          .payslip-info .info-item {
            display: flex;
            flex-direction: column;
          }
          .payslip-info .info-item .label {
            font-size: 12px;
            color: #94a3b8;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .payslip-info .info-item .value {
            font-size: 16px;
            font-weight: 600;
            color: #1a1a2e;
          }
          .payslip-table {
            width: 100%;
            border-collapse: collapse;
            margin: 16px 0 24px;
          }
          .payslip-table th {
            background: #f1f5f9;
            padding: 12px 16px;
            text-align: left;
            font-size: 12px;
            font-weight: 600;
            color: #475569;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            border-bottom: 2px solid #e2e8f0;
          }
          .payslip-table td {
            padding: 12px 16px;
            border-bottom: 1px solid #f1f5f9;
            font-size: 14px;
            color: #1a1a2e;
          }
          .payslip-table tr:hover td {
            background: #f8fafc;
          }
          .payslip-table .text-right {
            text-align: right;
          }
          .payslip-table .amount {
            font-weight: 600;
            color: #059669;
          }
          .payslip-summary {
            display: flex;
            justify-content: space-between;
            padding: 16px 20px;
            background: #f0fdf4;
            border-radius: 8px;
            border: 2px solid #86efac;
            margin-top: 8px;
          }
          .payslip-summary .label {
            font-size: 16px;
            font-weight: 600;
            color: #065f46;
          }
          .payslip-summary .total {
            font-size: 24px;
            font-weight: 700;
            color: #059669;
          }
          .payslip-footer {
            text-align: center;
            padding-top: 24px;
            margin-top: 24px;
            border-top: 1px solid #e2e8f0;
            color: #94a3b8;
            font-size: 13px;
          }
          .status-badge {
            display: inline-block;
            padding: 2px 10px;
            border-radius: 12px;
            font-size: 12px;
            font-weight: 500;
          }
          .status-badge.completed { background: #d1fae5; color: #065f46; }
          .status-badge.upcoming { background: #dbeafe; color: #1e40af; }
          .status-badge.pending { background: #fef3c7; color: #92400e; }
          .status-badge.cancelled { background: #fee2e2; color: #991b1b; }
          .status-badge.unknown { background: #f1f5f9; color: #475569; }
          .no-data {
            text-align: center;
            padding: 40px 0;
            color: #94a3b8;
          }
          @media print {
            body { padding: 20px; }
            .payslip-container { box-shadow: none; border: 1px solid #e2e8f0; }
          }
        </style>
      </head>
      <body>
        <div class="payslip-container">
          <div class="payslip-header">
            <h1>📊 <span>EduSpantech</span> Payslip</h1>
            <div class="subtitle">Tutor Earnings Statement</div>
            <div class="date">Generated: ${currentDate}</div>
          </div>

          <div class="payslip-info">
            <div class="info-item">
              <span class="label">Tutor Name</span>
              <span class="value">${tutorName || 'N/A'}</span>
            </div>
            <div class="info-item">
              <span class="label">Period</span>
              <span class="value">${period === 'all' ? 'All Time' : period === 'month' ? 'Last 30 Days' : 'Last 7 Days'}</span>
            </div>
            <div class="info-item">
              <span class="label">Total Sessions</span>
              <span class="value">${filteredData.length}</span>
            </div>
            <div class="info-item">
              <span class="label">Total Earnings</span>
              <span class="value">R${total.toFixed(2)}</span>
            </div>
          </div>

          <table class="payslip-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Student</th>
                <th>Subject</th>
                <th>Duration</th>
                <th>Amount</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${filteredData.length > 0 ? filteredData.map(item => `
                <tr>
                  <td>${item.date ? new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'}</td>
                  <td>${item.student || 'Student'}</td>
                  <td>${item.subject || 'Mathematics'}</td>
                  <td>${item.duration || 60} min</td>
                  <td class="amount text-right">R${(item.amount || 0).toFixed(2)}</td>
                  <td><span class="status-badge ${item.status || 'unknown'}">${item.status || 'N/A'}</span></td>
                </tr>
              `).join('') : `
                <tr>
                  <td colspan="6" class="no-data">No earnings records found for this period.</td>
                </tr>
              `}
            </tbody>
          </table>

          ${filteredData.length > 0 ? `
            <div class="payslip-summary">
              <span class="label">💰 Total Earnings</span>
              <span class="total">R${total.toFixed(2)}</span>
            </div>
          ` : ''}

          <div class="payslip-footer">
            This is an official statement of earnings from EduSpantech.<br>
            For any queries, please contact support@eduspantech.com
          </div>
        </div>
      </body>
      </html>
    `;
  };

  // Generate CSV data
  const generateCSV = (data) => {
    const headers = ['Date', 'Student', 'Subject', 'Duration (min)', 'Amount (R)', 'Status'];
    const rows = data.map(item => [
      item.date ? new Date(item.date).toLocaleDateString() : 'N/A',
      item.student || 'Student',
      item.subject || 'Mathematics',
      item.duration || 60,
      (item.amount || 0).toFixed(2),
      item.status || 'Pending'
    ]);
    return [headers, ...rows].map(row => row.join(',')).join('\n');
  };

  // ============================================
  // DOWNLOAD HANDLERS
  // ============================================

  const handleDownloadPayslip = async () => {
    try {
      setDownloading(true);
      const filteredData = getFilteredData();
      
      if (filteredData.length === 0) {
        alert('No earnings data available to download for the selected period.');
        setDownloading(false);
        return;
      }

      const tutorName = tutor?.name || 'Tutor';
      const html = generatePayslipHTML(earningsData, tutorName, filteredData);
      
      const blob = new Blob([html], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const dateStr = new Date().toISOString().slice(0, 10);
      link.download = `payslip-${tutorName.replace(/\s+/g, '-')}-${dateStr}.html`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      setDownloading(false);
    } catch (error) {
      console.error('❌ Download payslip error:', error);
      alert('Failed to download payslip. Please try again.');
      setDownloading(false);
    }
  };

  const handleDownloadCSV = async () => {
    try {
      setDownloading(true);
      const filteredData = getFilteredData();
      
      if (filteredData.length === 0) {
        alert('No earnings data available to download for the selected period.');
        setDownloading(false);
        return;
      }

      const csv = generateCSV(filteredData);
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const tutorName = tutor?.name || 'Tutor';
      const dateStr = new Date().toISOString().slice(0, 10);
      link.download = `earnings-${tutorName.replace(/\s+/g, '-')}-${dateStr}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      setDownloading(false);
    } catch (error) {
      console.error('❌ Download CSV error:', error);
      alert('Failed to download CSV. Please try again.');
      setDownloading(false);
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
    return getFilteredData();
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

        {/* History Table with Download Buttons */}
        <div className="earnings-history">
          <div className="history-header">
            <h3>📋 Earnings History</h3>
            <div className="history-controls">
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
              <div className="download-buttons">
                <button 
                  className="download-btn payslip-btn"
                  onClick={handleDownloadPayslip}
                  disabled={downloading || filteredHistory.length === 0}
                >
                  {downloading ? '⏳' : '📄'} Payslip
                </button>
                <button 
                  className="download-btn csv-btn"
                  onClick={handleDownloadCSV}
                  disabled={downloading || filteredHistory.length === 0}
                >
                  {downloading ? '⏳' : '📊'} CSV
                </button>
              </div>
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