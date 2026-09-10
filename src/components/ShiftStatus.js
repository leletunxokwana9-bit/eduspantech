// src/components/ShiftStatus.js
import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { API_BASE_URL } from '../services/api';
import './ShiftStatus.css';

const ShiftStatus = () => {
  const { user } = useAuth();
  const [shiftInfo, setShiftInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchShiftStatus();
    
    // Refresh every minute
    const interval = setInterval(fetchShiftStatus, 60000);
    return () => clearInterval(interval);
  }, []);

  const fetchShiftStatus = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/auth/check-shift`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        },
        body: JSON.stringify({
          countryCode: user?.country || 'ZA'
        })
      });

      const data = await response.json();
      if (data.success) {
        setShiftInfo(data);
      } else {
        setError(data.error || 'Failed to fetch shift status');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="shift-status loading">Checking availability...</div>;
  }

  if (error) {
    return <div className="shift-status error">⚠️ {error}</div>;
  }

  const { shiftInfo: info } = shiftInfo || {};
  const isActive = info?.isActive || false;
  const availability = info?.availability || {};

  return (
    <div className={`shift-status ${isActive ? 'active' : 'inactive'}`}>
      <div className="shift-status-icon">
        {isActive ? '🟢' : '🔴'}
      </div>
      <div className="shift-status-content">
        <div className="shift-status-title">
          {isActive ? 'Active Shift' : 'Off-Peak Hours'}
        </div>
        <div className="shift-status-details">
          {availability?.shift?.name && (
            <span className="shift-name">{availability.shift.name}</span>
          )}
          {availability?.studentTime && (
            <span className="student-time">
              Local Time: {new Date(availability.studentTime).toLocaleTimeString()}
            </span>
          )}
          {!isActive && info?.nextShift && (
            <span className="next-shift">
              Next shift: {new Date(info.nextShift).toLocaleTimeString()}
            </span>
          )}
          {availability?.reason && (
            <span className="shift-reason">{availability.reason}</span>
          )}
        </div>
        <div className="shift-status-window">
          Learning Window: 16:00 - 23:00 Local Time
          <br />
          <small>Weekend: Sat 08:00-14:00, Sun 16:00-23:00</small>
        </div>
      </div>
    </div>
  );
};

export default ShiftStatus;