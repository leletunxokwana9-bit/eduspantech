// src/pages/Admin/AddTutor.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../../services/authService';
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
    bio: ''
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const shifts = [
    { id: 'shift_apac', name: 'APAC' },
    { id: 'shift_south_asia', name: 'SOUTH_ASIA' },
    { id: 'shift_africa_europe', name: 'AFRICA_EUROPE' },
    { id: 'shift_americas', name: 'AMERICAS' }
  ];

  const subjects = [
    'Algebra', 'Geometry', 'Calculus', 'Trigonometry', 
    'Statistics', 'Linear Algebra', 'Differential Equations', 'Matrices'
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('accessToken');
      
      const response = await fetch('https://eduspantech-backend.onrender.com/api/admin/tutors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...formData,
          is_tutor: true,
          role: 'tutor',
          tutor_approved: true
        })
      });

      if (response.ok) {
        setSuccess('✅ Tutor account created successfully!');
        setFormData({
          name: '',
          email: '',
          password: 'Password123!',
          tier: 'TIER_2',
          shiftId: '',
          subjects: [],
          bio: ''
        });
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to create tutor');
      }
    } catch (err) {
      setError(err.message || 'Network error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="add-tutor">
      <h2>👨‍🏫 Add New Tutor</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Full Name *</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({...formData, name: e.target.value})}
            required
          />
        </div>
        <div className="form-group">
          <label>Email *</label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({...formData, email: e.target.value})}
            required
          />
        </div>
        <div className="form-group">
          <label>Tier</label>
          <select
            value={formData.tier}
            onChange={(e) => setFormData({...formData, tier: e.target.value})}
          >
            <option value="TIER_1">TIER_1 (Grades 8-9)</option>
            <option value="TIER_2">TIER_2 (Grades 10-11)</option>
            <option value="TIER_3">TIER_3 (Grade 12/Tertiary)</option>
          </select>
        </div>
        <div className="form-group">
          <label>Shift</label>
          <select
            value={formData.shiftId}
            onChange={(e) => setFormData({...formData, shiftId: e.target.value})}
            required
          >
            <option value="">Select Shift</option>
            {shifts.map(shift => (
              <option key={shift.id} value={shift.id}>{shift.name}</option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label>Subjects</label>
          <div className="subjects-grid">
            {subjects.map(subject => (
              <label key={subject} className="subject-checkbox">
                <input
                  type="checkbox"
                  checked={formData.subjects.includes(subject)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setFormData({...formData, subjects: [...formData.subjects, subject]});
                    } else {
                      setFormData({...formData, subjects: formData.subjects.filter(s => s !== subject)});
                    }
                  }}
                />
                {subject}
              </label>
            ))}
          </div>
        </div>
        <div className="form-group">
          <label>Bio</label>
          <textarea
            value={formData.bio}
            onChange={(e) => setFormData({...formData, bio: e.target.value})}
            rows="3"
            placeholder="Enter tutor's bio and experience..."
          />
        </div>
        {error && <div className="error">{error}</div>}
        {success && <div className="success">{success}</div>}
        <button type="submit" disabled={loading}>
          {loading ? 'Creating...' : '👨‍🏫 Create Tutor'}
        </button>
      </form>
    </div>
  );
};

export default AddTutor;