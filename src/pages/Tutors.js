import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useHomeData } from '../hooks/useHomeData';
import './Tutors.css';

const Tutors = () => {
  const navigate = useNavigate();
  const { data, loading, error } = useHomeData();

  if (loading) return <div className="page-loading">Loading tutors...</div>;
  if (error) return <div className="page-error">Error: {error}</div>;
  if (!data) return <div className="page-empty">No tutors available</div>;

  const shifts = data.tutors?.shifts || [];

  const bookSession = (tutor) => {
    const sessionId = `session_${Date.now()}_${tutor.id}`;
    console.log('📚 Booking session with tutor:', tutor);
    navigate(`/session/${sessionId}`, { state: { tutor } });
  };

  return (
    <div className="tutors-page">
      <div className="tutors-page-header">
        <h1>👨‍🏫 {data.tutors?.title || 'Our Expert Tutors'}</h1>
        <p>{data.tutors?.subtitle || '12 Centralised Tutors • 24/7 Global Coverage'}</p>
      </div>

      <div className="tutors-page-grid">
        {shifts.map((shift) => (
          <div key={shift.id} className="tutors-page-shift">
            <div className="tutors-page-shift-header">
              <h3>{shift.name}</h3>
              <span className="tutors-page-shift-time">{shift.time}</span>
            </div>
            <div className="tutors-page-hubs">
              {shift.hubs?.map((hub, idx) => (
                <span key={idx}>{hub}</span>
              ))}
            </div>
            <div className="tutors-page-tutor-list">
              {shift.tutors?.map((tutor) => (
                <div key={tutor.id} className="tutors-page-tutor-card">
                  {tutor.image ? (
                    <img 
                      src={tutor.image} 
                      alt={tutor.name} 
                      className="tutors-page-tutor-image"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        const avatar = e.target.parentElement.querySelector('.tutors-page-tutor-avatar');
                        if (avatar) avatar.style.display = 'flex';
                      }}
                    />
                  ) : null}
                  <span 
                    className="tutors-page-tutor-avatar" 
                    style={{ display: tutor.image ? 'none' : 'flex' }}
                  >
                    🧑‍🏫
                  </span>
                  
                  <div className="tutors-page-tutor-info">
                    <div className="tutors-page-tutor-name-row">
                      <h4>{tutor.name}</h4>
                      <span className="tutors-page-tutor-tier">{tutor.tier}</span>
                      <span className="tutors-page-tutor-grades">{tutor.grades}</span>
                    </div>
                    {tutor.bio && <p className="tutors-page-tutor-bio">{tutor.bio}</p>}
                    <div className="tutors-page-tutor-subjects">
                      {tutor.subjects?.map((subject, idx) => (
                        <span key={idx}>{subject}</span>
                      ))}
                    </div>
                    <span className="tutors-page-tutor-time">{tutor.time}</span>
                  </div>

                  <button 
                    className="book-session-btn"
                    onClick={() => {
                      console.log("✅ BUTTON CLICKED");
                      console.log("Tutor:", tutor);
                      bookSession(tutor);
                    }}
                  >
                    📚 Book Session
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="tutors-page-total">
        {shifts.length} Shifts × 3 Tutors = {shifts.length * 3} Centralised Tutors Total
      </div>
    </div>
  );
};

export default Tutors;