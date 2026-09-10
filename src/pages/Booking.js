// src/pages/Booking.js
import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { API_BASE_URL } from '../services/api';
import ShiftStatus from '../components/ShiftStatus';
import './Booking.css';

const Booking = () => {
  const { user } = useAuth();
  const [tutors, setTutors] = useState([]);
  const [selectedTutor, setSelectedTutor] = useState(null);
  const [date, setDate] = useState('');
  const [duration, setDuration] = useState(60);
  const [topic, setTopic] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [shiftInfo, setShiftInfo] = useState(null);

  useEffect(() => {
    fetchAvailableTutors();
    fetchShiftStatus();
  }, []);

  const fetchShiftStatus = async () => {
    try {
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
      }
    } catch (error) {
      console.error('Failed to fetch shift status:', error);
    }
  };

  const fetchAvailableTutors = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/auth/available-tutors`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      });

      const data = await response.json();
      if (data.success) {
        setTutors(data.tutors || []);
      } else {
        setError(data.error || 'No tutors available');
      }
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleBooking = async (e) => {
    e.preventDefault();
    if (!selectedTutor || !date) {
      setError('Please select a tutor and date');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${API_BASE_URL}/sessions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        },
        body: JSON.stringify({
          tutorId: selectedTutor.id,
          date: date,
          duration: duration,
          topic: topic || 'Mathematics'
        })
      });

      const data = await response.json();
      if (data.success) {
        setSuccess(true);
        setSelectedTutor(null);
        setDate('');
        setTopic('');
        setTimeout(() => setSuccess(false), 5000);
      } else {
        setError(data.error || data.message || 'Booking failed');
      }
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const isShiftActive = shiftInfo?.shiftInfo?.isActive || false;
  const canBook = isShiftActive && tutors.length > 0;

  return (
    <div className="booking-page">
      <div className="booking-container">
        <h1 className="booking-title">Book a Tutoring Session</h1>
        <p className="booking-subtitle">
          Connect with expert tutors during active shift hours
        </p>

        <ShiftStatus />

        {success && (
          <div className="alert alert-success">
            ✅ Session booked successfully! Check your sessions page.
          </div>
        )}

        {error && (
          <div className="alert alert-error">
            ❌ {error}
          </div>
        )}

        {!canBook && !loading && (
          <div className="booking-unavailable">
            <h3>No Tutors Currently Available</h3>
            <p>
              {shiftInfo?.shiftInfo?.availability?.reason === 'OUTSIDE_LEARNING_WINDOW' 
                ? 'Sessions are available from 16:00 to 23:00 local time.'
                : 'Please check back during active shift hours.'
              }
            </p>
            {shiftInfo?.shiftInfo?.nextShift && (
              <p className="next-shift-info">
                Next shift starts at: {new Date(shiftInfo.shiftInfo.nextShift).toLocaleString()}
              </p>
            )}
          </div>
        )}

        {canBook && (
          <form onSubmit={handleBooking} className="booking-form">
            <div className="form-group">
              <label htmlFor="tutor">Select Tutor</label>
              <select
                id="tutor"
                value={selectedTutor?.id || ''}
                onChange={(e) => {
                  const tutor = tutors.find(t => t.id === e.target.value);
                  setSelectedTutor(tutor);
                }}
                required
              >
                <option value="">Choose a tutor...</option>
                {tutors.map(tutor => (
                  <option key={tutor.id} value={tutor.id}>
                    {tutor.name} - {tutor.tier} ({tutor.subjects?.join(', ') || 'Mathematics'})
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="date">Session Date & Time</label>
              <input
                type="datetime-local"
                id="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                min={new Date().toISOString().slice(0, 16)}
              />
            </div>

            <div className="form-group">
              <label htmlFor="duration">Duration (minutes)</label>
              <select
                id="duration"
                value={duration}
                onChange={(e) => setDuration(parseInt(e.target.value))}
              >
                <option value="30">30 minutes</option>
                <option value="60">60 minutes</option>
                <option value="90">90 minutes</option>
                <option value="120">120 minutes</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="topic">Topic (Optional)</label>
              <input
                type="text"
                id="topic"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g., Algebra, Calculus, Geometry"
              />
            </div>

            <button 
              type="submit" 
              className="btn btn-primary"
              disabled={loading || !selectedTutor || !date}
            >
              {loading ? 'Booking...' : 'Book Session'}
            </button>
          </form>
        )}

        {selectedTutor && (
          <div className="tutor-info">
            <h4>Tutor: {selectedTutor.name}</h4>
            <p>Tier: {selectedTutor.tier}</p>
            <p>Subjects: {selectedTutor.subjects?.join(', ') || 'Mathematics'}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Booking;