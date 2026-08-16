// src/pages/AddTutor.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../services/api';
import './AddTutor.css';

const AddTutor = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: 'Password123!',
    tier: 'TIER_2',
    shiftId: '',
    subjects: [],
    bio: '',
    experience: ''
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const shifts = [
    { id: 'shift_apac', name: 'APAC (Asia-Pacific)' },
    { id: 'shift_south_asia', name: 'SOUTH_ASIA (South Asian / Indian)' },
    { id: 'shift_africa_europe', name: 'AFRICA_EUROPE (Africa / Europe)' },
    { id: 'shift_americas', name: 'AMERICAS (Pan-American)' }
  ];

  const subjectOptions = [
    'Algebra', 'Geometry', 'Calculus', 'Trigonometry', 
    'Statistics', 'Linear Algebra', 'Differential Equations', 
    'Matrices', 'Functions', 'Financial Mathematics'
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('accessToken');
      
      // ✅ FIXED: Using API_BASE_URL
      const checkResponse = await fetch(`${API_BASE_URL}/auth/check-user`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ email: formData.email })
      });

      if (checkResponse.ok) {
        const data = await checkResponse.json();
        if (data.exists) {
          setError('❌ User with this email already exists');
          setLoading(false);
          return;
        }
      }

      // ✅ FIXED: Using API_BASE_URL
      const response = await fetch(`${API_BASE_URL}/admin/create-tutor`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        setSuccess('✅ Tutor created successfully!');
        setFormData({
          name: '',
          email: '',
          password: 'Password123!',
          tier: 'TIER_2',
          shiftId: '',
          subjects: [],
          bio: '',
          experience: ''
        });
        setTimeout(() => navigate('/tutor/dashboard'), 2000);
      } else {
        const data = await response.json();
        setError(data.error || '❌ Failed to create tutor');
      }
    } catch (error) {
      setError('❌ Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubjectToggle = (subject) => {
    setFormData(prev => ({
      ...prev,
      subjects: prev.subjects.includes(subject)
        ? prev.subjects.filter(s => s !== subject)
        : [...prev.subjects, subject]
    }));
  };

  return (
    <div className="add-tutor-container">
      <div className="add-tutor-card">
        <div className="add-tutor-header">
          <h1>👨‍🏫 Add New Tutor</h1>
          <p>Create a new tutor account for the platform</p>
        </div>

        {error && <div className="add-tutor-error">{error}</div>}
        {success && <div className="add-tutor-success">{success}</div>}

        <form onSubmit={handleSubmit} className="add-tutor-form">
          <div className="form-group">
            <label>Full Name *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              placeholder="John Doe"
            />
          </div>

          <div className="form-group">
            <label>Email Address *</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
              placeholder="tutor@eduspantech.com"
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input
              type="text"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder="Password123!"
            />
            <small>Default: Password123! (Change this after first login)</small>
          </div>

          <div className="form-group">
            <label>Tier *</label>
            <select
              value={formData.tier}
              onChange={(e) => setFormData({ ...formData, tier: e.target.value })}
              required
            >
              <option value="TIER_1">TIER_1 (Grades 8-9)</option>
              <option value="TIER_2">TIER_2 (Grades 10-11)</option>
              <option value="TIER_3">TIER_3 (Grade 12 / Tertiary)</option>
            </select>
          </div>

          <div className="form-group">
            <label>Shift *</label>
            <select
              value={formData.shiftId}
              onChange={(e) => setFormData({ ...formData, shiftId: e.target.value })}
              required
            >
              <option value="">Select a shift...</option>
              {shifts.map(shift => (
                <option key={shift.id} value={shift.id}>{shift.name}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Subjects *</label>
            <div className="subject-grid">
              {subjectOptions.map(subject => (
                <button
                  key={subject}
                  type="button"
                  className={`subject-btn ${formData.subjects.includes(subject) ? 'selected' : ''}`}
                  onClick={() => handleSubjectToggle(subject)}
                >
                  {formData.subjects.includes(subject) ? '✓' : '+'} {subject}
                </button>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label>Bio</label>
            <textarea
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              placeholder="Brief description of the tutor's experience..."
              rows="3"
            />
          </div>

          <div className="form-group">
            <label>Experience</label>
            <textarea
              value={formData.experience}
              onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
              placeholder="Teaching experience, qualifications, etc..."
              rows="2"
            />
          </div>

          <button type="submit" className="add-tutor-btn" disabled={loading}>
            {loading ? 'Creating...' : '📚 Create Tutor'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddTutor;