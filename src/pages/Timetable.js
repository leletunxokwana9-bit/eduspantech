// src/pages/Timetable.js
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabaseClient';
import { authService } from '../services/authService';
import './Timetable.css';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const DAYS_SHORT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const SUBJECT_COLORS = {
  'Mathematics': '#4F46E5',
  'Physical Sciences': '#EF4444',
  'Life Sciences': '#22C55E',
  'Economics': '#F59E0B',
  'Accounting': '#EC4899',
  'Pure/Technical Mathematics': '#4F46E5',
  'Physics I / Applied Physics': '#EF4444',
  'Mathematical Statistics': '#8B5CF6',
  'Applied Business Statistics': '#14B8A6',
  'Financial Accounting': '#EC4899',
  'Micro/Macroeconomics': '#F59E0B',
  'Business Mathematics': '#4F46E5',
  'ECP Mathematics': '#8B5CF6',
  'ECP Physical Sciences': '#A78BFA',
  'ECP Statistics': '#C4B5FD',
  'ECP Life Sciences': '#6EE7B7',
  'ECP Financial Accounting': '#F472B6',
  'ECP Economics': '#FB923C',
  'ECP Business Statistics': '#2DD4BF',
  'ECP Business Mathematics': '#60A5FA'
};

function Timetable() {
  const navigate = useNavigate();
  const [masterEntries, setMasterEntries] = useState([]);
  const [userEntries, setUserEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [user, setUser] = useState(null);
  const [isTutor, setIsTutor] = useState(false);
  const [viewFilter, setViewFilter] = useState('all');
  const [formData, setFormData] = useState({
    subject: '',
    topic: '',
    day_of_week: 'Monday',
    start_time: '09:00',
    end_time: '10:00',
    location: 'Online',
    meeting_link: '',
    color: '#4F46E5',
    notes: '',
    is_recurring: true
  });

  // ============================================
  // GET CURRENT USER
  // ============================================
  useEffect(() => {
    const getUser = async () => {
      try {
        const userData = await authService.getCurrentUser();
        if (userData) {
          setUser(userData);
          const isTutorAccount = userData.is_tutor === true || userData.role === 'tutor' || userData.role === 'TUTOR';
          setIsTutor(isTutorAccount);
        } else {
          navigate('/login');
        }
      } catch (error) {
        console.error('Failed to get user:', error);
        navigate('/login');
      }
    };
    getUser();
  }, [navigate]);

  // ============================================
  // FETCH TIMETABLE DATA - NO FILTERS!
  // ============================================
  const fetchTimetable = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      // ✅ FETCH ALL MASTER TIMETABLE DATA - NO FILTERS
      const { data: masterData, error: masterError } = await supabase
        .from('master_timetable')
        .select('*')
        .eq('is_active', true)
        .order('day_of_week', { ascending: true })
        .order('start_time', { ascending: true });

      if (masterError) {
        console.error('Master fetch error:', masterError);
        setMasterEntries([]);
      } else {
        console.log('✅ Master timetable loaded:', masterData?.length || 0, 'sessions');
        setMasterEntries(masterData || []);
      }

      // Fetch user's custom entries
      const { data: userData, error: userError } = await supabase
        .from('timetable_entries')
        .select('*')
        .eq('user_id', user.id)
        .order('day_of_week', { ascending: true })
        .order('start_time', { ascending: true });

      if (userError) {
        console.error('User entries error:', userError);
        setUserEntries([]);
      } else {
        console.log('✅ User entries loaded:', userData?.length || 0, 'sessions');
        setUserEntries(userData || []);
      }

    } catch (error) {
      console.error('Failed to fetch timetable:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchTimetable();
    }
  }, [user, fetchTimetable]);

  // ============================================
  // GET ALL ENTRIES (Master + User)
  // ============================================
  const getAllEntries = useCallback(() => {
    const all = [...masterEntries];
    
    userEntries.forEach(userEntry => {
      const existingIndex = all.findIndex(m => 
        m.day_of_week === userEntry.day_of_week && 
        m.start_time === userEntry.start_time
      );
      if (existingIndex !== -1) {
        all[existingIndex] = { ...all[existingIndex], ...userEntry, isCustom: true };
      } else {
        all.push({ ...userEntry, isCustom: true });
      }
    });
    
    return all;
  }, [masterEntries, userEntries]);

  // ============================================
  // GET WEEK DATES
  // ============================================
  const getWeekDates = (date) => {
    const start = new Date(date);
    const day = start.getDay();
    const diff = start.getDate() - day + (day === 0 ? -6 : 1);
    start.setDate(diff);
    
    const weekDates = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      weekDates.push(d);
    }
    return weekDates;
  };

  const weekDates = getWeekDates(currentWeek);

  const getWeekNumber = (date) => {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + 3 - (d.getDay() + 6) % 7);
    const week1 = new Date(d.getFullYear(), 0, 4);
    return 1 + Math.round(((d - week1) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7);
  };

  const weekNumber = getWeekNumber(currentWeek);

  const goToPreviousWeek = () => {
    const newDate = new Date(currentWeek);
    newDate.setDate(newDate.getDate() - 7);
    setCurrentWeek(newDate);
  };

  const goToNextWeek = () => {
    const newDate = new Date(currentWeek);
    newDate.setDate(newDate.getDate() + 7);
    setCurrentWeek(newDate);
  };

  const goToToday = () => {
    setCurrentWeek(new Date());
  };

  const isToday = (date) => {
    const today = new Date();
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
  };

  // ============================================
  // GET ENTRIES FOR DAY
  // ============================================
  const getEntriesForDay = (dayOfWeek) => {
    const allEntries = getAllEntries();
    return allEntries
      .filter(entry => entry.day_of_week === dayOfWeek)
      .sort((a, b) => a.start_time.localeCompare(b.start_time));
  };

  // ============================================
  // FORMAT TIME
  // ============================================
  const formatTime = (time) => {
    if (!time) return '';
    const [hours, minutes] = time.split(':');
    const h = parseInt(hours);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 || 12;
    return `${h12}:${minutes} ${ampm}`;
  };

  // ============================================
  // GET COLOR FOR SUBJECT
  // ============================================
  const getSubjectColor = (subject) => {
    return SUBJECT_COLORS[subject] || '#6B7280';
  };

  // ============================================
  // HANDLE ADD/EDIT ENTRY
  // ============================================
  const handleAddEntry = () => {
    setIsEditing(false);
    setSelectedEntry(null);
    setFormData({
      subject: '',
      topic: '',
      day_of_week: 'Monday',
      start_time: '09:00',
      end_time: '10:00',
      location: 'Online',
      meeting_link: '',
      color: '#4F46E5',
      notes: '',
      is_recurring: true
    });
    setShowModal(true);
  };

  const handleCellClick = (day, time) => {
    const userEntry = userEntries.find(e => {
      const startHour = parseInt(e.start_time.split(':')[0]);
      const clickedHour = parseInt(time.split(':')[0]);
      return startHour === clickedHour && e.day_of_week === day;
    });

    if (userEntry) {
      handleEditEntry(userEntry);
      return;
    }

    setIsEditing(false);
    setSelectedEntry(null);
    const [hours, minutes] = time.split(':');
    const h = parseInt(hours);
    const nextHour = (h + 1).toString().padStart(2, '0');
    setFormData({
      subject: '',
      topic: '',
      day_of_week: day,
      start_time: time,
      end_time: `${nextHour}:${minutes}`,
      location: 'Online',
      meeting_link: '',
      color: '#4F46E5',
      notes: '',
      is_recurring: true
    });
    setShowModal(true);
  };

  const handleEditEntry = (entry) => {
    setIsEditing(true);
    setSelectedEntry(entry);
    setFormData({
      subject: entry.subject || '',
      topic: entry.topic || '',
      day_of_week: entry.day_of_week || 'Monday',
      start_time: entry.start_time || '09:00',
      end_time: entry.end_time || '10:00',
      location: entry.location || 'Online',
      meeting_link: entry.meeting_link || '',
      color: entry.color || '#4F46E5',
      notes: entry.notes || '',
      is_recurring: entry.is_recurring !== false
    });
    setShowModal(true);
  };

  const handleDeleteEntry = async (entryId, e) => {
    if (e) e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this session?')) return;

    try {
      const { error } = await supabase
        .from('timetable_entries')
        .delete()
        .eq('id', entryId);
      if (error) throw error;
      await fetchTimetable();
    } catch (error) {
      console.error('Failed to delete entry:', error);
      alert('Failed to delete entry. Please try again.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      alert('Please login to manage your timetable.');
      return;
    }

    try {
      const entryData = {
        user_id: user.id,
        subject: formData.subject,
        topic: formData.topic || null,
        day_of_week: formData.day_of_week,
        start_time: formData.start_time,
        end_time: formData.end_time,
        location: formData.location,
        meeting_link: formData.meeting_link || null,
        color: formData.color,
        notes: formData.notes || null,
        is_recurring: formData.is_recurring,
        status: 'scheduled'
      };

      let error;
      if (isEditing && selectedEntry) {
        const { error: updateError } = await supabase
          .from('timetable_entries')
          .update(entryData)
          .eq('id', selectedEntry.id);
        error = updateError;
      } else {
        const { error: insertError } = await supabase
          .from('timetable_entries')
          .insert([entryData]);
        error = insertError;
      }

      if (error) throw error;
      setShowModal(false);
      await fetchTimetable();
    } catch (error) {
      console.error('Failed to save entry:', error);
      alert('Failed to save entry. Please try again.');
    }
  };

  // ============================================
  // RENDER TIMETABLE GRID
  // ============================================
  const renderGrid = () => {
    const timeSlots = [];
    for (let h = 6; h < 24; h++) {
      const hour = h.toString().padStart(2, '0');
      timeSlots.push(`${hour}:00`);
    }

    const allEntries = getAllEntries();

    return (
      <div className="timetable-grid">
        <div className="timetable-header">
          <div className="timetable-header-cell corner">Time</div>
          {DAYS_SHORT.map((day, index) => {
            const date = weekDates[index];
            const isTodayDate = isToday(date);
            return (
              <div key={day} className={`timetable-header-cell ${isTodayDate ? 'today' : ''}`}>
                <span className="day-short">{day}</span>
                <span className="day-date">{date.getDate()}</span>
              </div>
            );
          })}
        </div>

        {timeSlots.map((time) => {
          const hour = parseInt(time.split(':')[0]);
          return (
            <div key={time} className="timetable-row">
              <div className="timetable-time-cell">
                <span className="time-label">{formatTime(time)}</span>
              </div>
              {DAYS.map((day) => {
                const dayEntries = allEntries.filter(e => e.day_of_week === day);
                const entryAtTime = dayEntries.find(e => {
                  const startHour = parseInt(e.start_time.split(':')[0]);
                  return startHour === hour;
                });
                const date = weekDates[DAYS.indexOf(day)];
                const isTodayDate = isToday(date);
                const hasEntry = !!entryAtTime;

                return (
                  <div 
                    key={`${day}-${time}`} 
                    className={`timetable-cell ${isTodayDate ? 'today' : ''} ${hasEntry ? 'has-entry' : 'empty-cell'}`}
                    onClick={() => handleCellClick(day, time)}
                  >
                    {entryAtTime ? (
                      <div 
                        className={`timetable-event ${entryAtTime.isCustom ? 'custom-event' : 'master-event'}`}
                        style={{ background: entryAtTime.color || getSubjectColor(entryAtTime.subject) }}
                      >
                        <div className="event-time">
                          {formatTime(entryAtTime.start_time)} - {formatTime(entryAtTime.end_time)}
                        </div>
                        <div className="event-subject">{entryAtTime.subject}</div>
                        {entryAtTime.topic && <div className="event-topic">{entryAtTime.topic}</div>}
                        {entryAtTime.grade_level && (
                          <div className="event-grade">{entryAtTime.grade_level}</div>
                        )}
                        {entryAtTime.isCustom && (
                          <button className="event-delete" onClick={(e) => handleDeleteEntry(entryAtTime.id, e)}>✕</button>
                        )}
                        {!entryAtTime.isCustom && <div className="event-badge">System</div>}
                      </div>
                    ) : (
                      <div className="empty-cell-content">
                        <span className="add-hint">+</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    );
  };

  // ============================================
  // RENDER LIST VIEW (Mobile)
  // ============================================
  const renderListView = () => {
    const allEntries = getAllEntries();
    const sortedEntries = [...allEntries].sort((a, b) => {
      const dayOrder = DAYS.indexOf(a.day_of_week) - DAYS.indexOf(b.day_of_week);
      if (dayOrder !== 0) return dayOrder;
      return a.start_time.localeCompare(b.start_time);
    });

    if (sortedEntries.length === 0) {
      return (
        <div className="empty-state">
          <span className="empty-icon">📅</span>
          <h3>No sessions scheduled</h3>
          <p>Tap the + button below to add your first session</p>
          <button className="btn-add" onClick={handleAddEntry}>+ Add Session</button>
        </div>
      );
    }

    return (
      <div className="list-view">
        {sortedEntries.map((entry) => (
          <div 
            key={entry.id || `${entry.day_of_week}-${entry.start_time}`} 
            className={`list-item ${entry.isCustom ? 'custom-item' : 'master-item'}`}
            style={{ borderLeftColor: entry.color || getSubjectColor(entry.subject) }}
          >
            <div className="list-item-header">
              <span className="list-day">{entry.day_of_week}</span>
              <span className="list-time">{formatTime(entry.start_time)} - {formatTime(entry.end_time)}</span>
            </div>
            <div className="list-item-body">
              <span className="list-subject">{entry.subject}</span>
              {entry.topic && <span className="list-topic">{entry.topic}</span>}
              {entry.grade_level && <span className="list-grade">{entry.grade_level}</span>}
            </div>
            <div className="list-item-actions">
              {entry.isCustom && (
                <button className="list-delete" onClick={(e) => handleDeleteEntry(entry.id, e)}>✕</button>
              )}
              {!entry.isCustom && <span className="list-badge">System</span>}
            </div>
          </div>
        ))}
        <button className="btn-add" onClick={handleAddEntry}>+ Add Session</button>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="timetable-page">
        <div className="timetable-loading">
          <div className="loader"></div>
          <p>Loading your timetable...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="timetable-page">
      <div className="container">
        <div className="timetable-page-header">
          <div className="header-left">
            <h1>
              <span className="header-icon">📅</span>
              {isTutor ? 'My Teaching Schedule' : 'My Timetable'}
            </h1>
            <p className="header-subtitle">
              {isTutor ? 'Manage your teaching sessions and student bookings' : 'Click on any time slot to add or edit a session'}
            </p>
            <div className="header-filters">
              <button 
                className={`filter-btn ${viewFilter === 'all' ? 'active' : ''}`}
                onClick={() => setViewFilter('all')}
              >
                All
              </button>
              <button 
                className={`filter-btn ${viewFilter === 'school' ? 'active' : ''}`}
                onClick={() => setViewFilter('school')}
              >
                School
              </button>
              <button 
                className={`filter-btn ${viewFilter === 'university' ? 'active' : ''}`}
                onClick={() => setViewFilter('university')}
              >
                University
              </button>
            </div>
          </div>
          <div className="header-actions">
            <button className="btn-primary" onClick={handleAddEntry}>+ Add Session</button>
          </div>
        </div>

        <div className="week-navigation">
          <button className="nav-btn" onClick={goToPreviousWeek}>‹</button>
          <div className="week-info">
            <span className="week-label">Week {weekNumber}</span>
            <span className="week-dates">
              {weekDates[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - 
              {weekDates[6].toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
          </div>
          <button className="nav-btn" onClick={goToNextWeek}>›</button>
          <button className="btn-today" onClick={goToToday}>Today</button>
        </div>

        <div className="desktop-view">{renderGrid()}</div>
        <div className="mobile-view">{renderListView()}</div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{isEditing ? 'Edit Session' : 'Add New Session'}</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSubmit} className="modal-form">
              <div className="form-group">
                <label>Subject *</label>
                <input type="text" value={formData.subject} onChange={(e) => setFormData({...formData, subject: e.target.value})} placeholder="e.g., Mathematics" required className="form-input" />
              </div>
              <div className="form-group">
                <label>Topic</label>
                <input type="text" value={formData.topic} onChange={(e) => setFormData({...formData, topic: e.target.value})} placeholder="e.g., Quadratic Equations" className="form-input" />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Day *</label>
                  <select value={formData.day_of_week} onChange={(e) => setFormData({...formData, day_of_week: e.target.value})} className="form-select" required>
                    {DAYS.map((day) => <option key={day} value={day}>{day}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Start Time *</label>
                  <input type="time" value={formData.start_time} onChange={(e) => setFormData({...formData, start_time: e.target.value})} className="form-input" required />
                </div>
                <div className="form-group">
                  <label>End Time *</label>
                  <input type="time" value={formData.end_time} onChange={(e) => setFormData({...formData, end_time: e.target.value})} className="form-input" required />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Location</label>
                  <select value={formData.location} onChange={(e) => setFormData({...formData, location: e.target.value})} className="form-select">
                    <option value="Online">Online</option>
                    <option value="In-person">In-person</option>
                    <option value="Hybrid">Hybrid</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Color</label>
                  <input type="color" value={formData.color} onChange={(e) => setFormData({...formData, color: e.target.value})} className="form-color" />
                </div>
              </div>
              <div className="form-group">
                <label className="checkbox-label">
                  <input type="checkbox" checked={formData.is_recurring} onChange={(e) => setFormData({...formData, is_recurring: e.target.checked})} />
                  Recurring (weekly)
                </label>
              </div>
              <div className="form-group">
                <label>Notes</label>
                <textarea value={formData.notes} onChange={(e) => setFormData({...formData, notes: e.target.value})} placeholder="Any additional notes..." className="form-textarea" rows="3" />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn-save">{isEditing ? 'Update' : 'Save'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Timetable;