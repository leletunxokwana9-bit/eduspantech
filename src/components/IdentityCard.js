// src/components/IdentityCard.js
import React, { useRef } from 'react';
import './IdentityCard.css';

const IdentityCard = ({ 
  isTutor, 
  user, 
  editForm, 
  subscription, 
  shiftOptions, 
  profilePhoto, 
  avatarImage,
  setIsEditing 
}) => {
  const cardRef = useRef(null);

  if (!user && !editForm) {
    return null;
  }

  const getUserName = () => {
    return user?.name || editForm?.name || 'User';
  };

  const getUserRole = () => {
    if (isTutor) return 'TUTOR';
    if (user?.cohort === 'HighSchool') return 'STUDENT';
    if (user?.cohort === 'UniversityFirstYear') return 'UNIVERSITY STUDENT';
    return 'STUDENT';
  };

  const getGradeDisplay = () => {
    if (isTutor) return 'Professional Tutor';
    const grade = editForm?.grade || user?.grade;
    if (grade) {
      if (grade <= 9) return `Grade ${grade} · Foundation Phase`;
      if (grade <= 12) return `Grade ${grade} · NSC CAPS Core`;
      return `${grade} Year · Tertiary`;
    }
    return 'Not specified';
  };

  const getTierDisplay = () => {
    const tier = subscription?.tier || editForm?.tier || user?.tier || 'SILVER';
    const tierMap = {
      'SILVER': { label: 'Silver', color: '#d3d1c7', bg: 'rgba(211,209,199,0.1)' },
      'GOLD': { label: 'Gold', color: '#c9a227', bg: 'rgba(201,162,39,0.1)' },
      'PLATINUM': { label: 'Platinum', color: '#cecbf6', bg: 'rgba(206,203,246,0.1)' },
      'TIER_1': { label: 'Tier 1', color: '#d3d1c7', bg: 'rgba(211,209,199,0.1)' },
      'TIER_2': { label: 'Tier 2', color: '#c9a227', bg: 'rgba(201,162,39,0.1)' },
      'TIER_3': { label: 'Tier 3', color: '#cecbf6', bg: 'rgba(206,203,246,0.1)' },
    };
    return tierMap[tier] || tierMap['SILVER'];
  };

  const getStudentId = () => {
    const id = user?.id || editForm?.id || 'ESP-24-108452';
    // Format as ESP-24-XXXXXX (6 digits)
    if (id.length > 15) {
      const shortId = id.slice(-6);
      return `ESP-24-${shortId}`;
    }
    return id;
  };

  const getShiftName = () => {
    const shiftId = editForm?.shiftId || user?.tutor_shift_id;
    if (shiftId && shiftOptions) {
      const shift = shiftOptions.find(s => s.id === shiftId);
      return shift?.name || 'Not assigned';
    }
    return 'Not assigned';
  };

  const getAvatar = () => {
    if (isTutor && profilePhoto) return profilePhoto;
    if (!isTutor && avatarImage) return avatarImage;
    return null;
  };

  const getInitials = () => {
    const name = getUserName();
    if (!name) return 'U';
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return `${parts[0].charAt(0)}${parts[1].charAt(0)}`.toUpperCase();
    }
    return name.charAt(0).toUpperCase();
  };

  const currentYear = new Date().getFullYear();
  const validUntil = `31 Dec ${currentYear + 2}`;

  // Handle download
  const handleDownload = () => {
    if (!cardRef.current) return;
    
    // Import html2pdf dynamically
    import('html2pdf.js').then((html2pdf) => {
      const element = cardRef.current;
      const opt = {
        margin: 0.5,
        filename: `EduSpantech_ID_${getUserName().replace(/\s/g, '_')}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { 
          scale: 2, 
          useCORS: true,
          logging: false,
          backgroundColor: '#0b2340'
        },
        jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
      };
      html2pdf.default().set(opt).from(element).save();
    }).catch(() => {
      alert('Download feature requires html2pdf.js. Please install: npm install html2pdf.js');
    });
  };

  return (
    <div className="id-card-wrapper">
      <div className="id-card" ref={cardRef}>
        {/* Watermark */}
        <div className="id-card-watermark">
          <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
            <text x="10" y="30" fontSize="20" fill="currentColor" opacity="0.1">∑</text>
            <text x="60" y="60" fontSize="25" fill="currentColor" opacity="0.1">π</text>
            <text x="20" y="80" fontSize="18" fill="currentColor" opacity="0.1">∫</text>
            <text x="70" y="25" fontSize="22" fill="currentColor" opacity="0.1">√</text>
          </svg>
        </div>

        {/* Header */}
        <div className="id-card-header">
          <div className="id-card-logo">
            <span className="logo-symbol">∑</span>
            <div>
              <span className="logo-text">EduSpantech</span>
              <span className="logo-sub">EDUCATIONAL LIVE STREAMING SERVICES</span>
            </div>
          </div>
          <div className="id-card-type-badge">
            <span>{getUserRole()}</span>
          </div>
        </div>

        {/* Body */}
        <div className="id-card-body">
          <div className="id-card-photo">
            {getAvatar() ? (
              <img src={getAvatar()} alt={getUserName()} />
            ) : (
              <span className="photo-initials">{getInitials()}</span>
            )}
          </div>
          <div className="id-card-details">
            <div className="id-card-name">{getUserName()}</div>
            <div className="id-card-grade">{getGradeDisplay()}</div>
            <div className="id-card-tier">
              <span 
                className="tier-badge" 
                style={{ 
                  background: getTierDisplay().bg,
                  color: getTierDisplay().color,
                  borderColor: getTierDisplay().color
                }}
              >
                Tier {getTierDisplay().label}
              </span>
              <span className="id-card-hybrid">· Hybrid</span>
            </div>
          </div>
        </div>

        {/* Info Table */}
        <div className="id-card-table">
          <div className="table-row">
            <span className="table-label">Student ID</span>
            <span className="table-value">{getStudentId()}</span>
          </div>
          <div className="table-row">
            <span className="table-label">AWS hub</span>
            <span className="table-value">Cape Town <span className="region-code">af-south-1</span></span>
          </div>
          <div className="table-row">
            <span className="table-label">Valid until</span>
            <span className="table-value">{validUntil}</span>
          </div>
          {isTutor && (
            <div className="table-row">
              <span className="table-label">Shift</span>
              <span className="table-value">{getShiftName()}</span>
            </div>
          )}
          {isTutor && editForm?.subjects?.length > 0 && (
            <div className="table-row subjects-row">
              <span className="table-label">Subjects</span>
              <span className="table-value subjects-tags">
                {editForm.subjects.slice(0, 3).map((s, i) => (
                  <span key={i} className="subject-tag">{s}</span>
                ))}
                {editForm.subjects.length > 3 && (
                  <span className="subject-tag more">+{editForm.subjects.length - 3}</span>
                )}
              </span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="id-card-footer">
          <div className="footer-left">
            <div className="barcode">
              <svg width="60" height="40" viewBox="0 0 60 40">
                {[...Array(30)].map((_, i) => (
                  <rect 
                    key={i} 
                    x={i * 2} 
                    y={0} 
                    width={1 + Math.random() * 1.5} 
                    height={20 + Math.random() * 20} 
                    fill="rgba(255,255,255,0.6)" 
                  />
                ))}
              </svg>
            </div>
            <div className="footer-text">
              <p className="footer-instruction">Scan at drop-in evening clinics for shift-gated access.</p>
              <p className="footer-property">Property of EduSpantech (Pty) Ltd · if found, return to nearest branch.</p>
            </div>
          </div>
          <div className="id-card-actions">
            <button className="id-card-download-btn" onClick={handleDownload} title="Download as PDF">
              ⬇️
            </button>
            {setIsEditing && (
              <button className="id-card-edit-btn" onClick={() => setIsEditing(true)}>
                ✎ Edit
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default IdentityCard;