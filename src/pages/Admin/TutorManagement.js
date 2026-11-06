// src/pages/Admin/TutorManagement.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { tutorApplicationService } from '../../services/tutorApplicationService';
import './TutorManagement.css';

const STATUS_TABS = [
  { key: 'all', label: 'All Applications' },
  { key: 'pending', label: 'Pending' },
  { key: 'under_review', label: 'Under Review' },
  { key: 'interview_scheduled', label: 'Interview' },
  { key: 'approved', label: 'Approved' },
  { key: 'rejected', label: 'Rejected' }
];

const STATUS_LABELS = {
  pending: '⏳ Pending',
  under_review: '🔍 Under Review',
  interview_scheduled: '📅 Interview',
  approved: '✅ Approved',
  rejected: '❌ Rejected',
  withdrawn: '↩️ Withdrawn'
};

const TutorManagement = () => {
  const navigate = useNavigate();
  const [applications, setApplications] = useState([]);
  const [counts, setCounts] = useState({});
  // ✅ CHANGED: default tab is now 'all' instead of 'pending'
  const [activeTab, setActiveTab] = useState('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [detail, setDetail] = useState(null);
  const [statusNote, setStatusNote] = useState('');
  const [updating, setUpdating] = useState(false);

  const load = async () => {
    setLoading(true);
    const params = { status: activeTab };
    if (search) params.q = search;
    const res = await tutorApplicationService.list(params);
    if (res.success) {
      setApplications(res.applications || []);
      setCounts(res.counts || {});
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const openDetail = async (app) => {
    setSelected(app);
    setStatusNote('');
    const res = await tutorApplicationService.getOne(app.id);
    if (res.success) setDetail(res);
  };

  const closeDetail = () => {
    setSelected(null);
    setDetail(null);
  };

  const changeStatus = async (newStatus) => {
    if (!selected) return;
    setUpdating(true);
    const res = await tutorApplicationService.updateStatus(selected.id, {
      status: newStatus,
      review_notes: statusNote
    });
    setUpdating(false);
    if (res.success) {
      closeDetail();
      load();
    } else {
      alert(res.error || 'Failed to update');
    }
  };

  const getStatusClass = (s) => `tm-badge tm-badge-${s}`;

  return (
    <div className="tm-container">
      <div className="tm-header">
        <div>
          <h1>📝 Tutor Applications</h1>
          <p className="tm-subtitle">Review applicants, verify credentials, approve new tutors</p>
        </div>
        <button className="tm-refresh" onClick={load}>🔄 Refresh</button>
      </div>

      <div className="tm-tabs">
        {STATUS_TABS.map(t => (
          <button
            key={t.key}
            className={`tm-tab ${activeTab === t.key ? 'active' : ''}`}
            onClick={() => setActiveTab(t.key)}
          >
            {t.label}
            {counts[t.key] !== undefined && <span className="tm-tab-count">{counts[t.key]}</span>}
          </button>
        ))}
      </div>

      <div className="tm-search">
        <span>🔍</span>
        <input
          placeholder="Search applicants by name or email…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && load()}
        />
      </div>

      {loading ? (
        <div className="tm-empty">Loading applications…</div>
      ) : applications.length === 0 ? (
        <div className="tm-empty">
          <span>📭</span>
          <h3>No applications {activeTab !== 'all' ? `in "${activeTab}"` : ''}</h3>
          <p>Applications submitted via <code>/become-a-tutor</code> will appear here.</p>
        </div>
      ) : (
        <div className="tm-grid">
          {applications.map(app => (
            <div key={app.id} className="tm-card" onClick={() => openDetail(app)}>
              <div className="tm-card-photo">
                {app.photo_url ? (
                  <img src={app.photo_url} alt={app.full_name} />
                ) : (
                  <div className="tm-card-initials">{app.full_name?.charAt(0) || '?'}</div>
                )}
                {app.intro_video_url && <span className="tm-has-video">🎬</span>}
              </div>
              <div className="tm-card-body">
                <div className="tm-card-top">
                  <h3>{app.full_name}</h3>
                  <span className={getStatusClass(app.status)}>{STATUS_LABELS[app.status] || app.status}</span>
                </div>
                <p className="tm-card-email">{app.email}</p>
                <div className="tm-card-subjects">
                  {(app.subjects || []).slice(0, 4).map(s => (
                    <span key={s} className="tm-tag">{s}</span>
                  ))}
                  {app.subjects?.length > 4 && <span className="tm-tag tm-tag-more">+{app.subjects.length - 4}</span>}
                </div>
                <div className="tm-card-meta">
                  <span>🌍 {app.country || '—'}</span>
                  <span>📅 {app.years_experience || 0} yrs</span>
                  {app.hourly_rate && <span>💵 R{app.hourly_rate}/hr</span>}
                </div>
                <p className="tm-card-date">
                  Submitted {new Date(app.submitted_at).toLocaleDateString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ============ DETAIL MODAL ============ */}
      {selected && detail && (
        <div className="tm-modal-overlay" onClick={closeDetail}>
          <div className="tm-modal" onClick={e => e.stopPropagation()}>
            <button className="tm-modal-close" onClick={closeDetail}>✕</button>

            <div className="tm-modal-header">
              <div className="tm-modal-photo">
                {detail.application.photo_url ? (
                  <img src={detail.application.photo_url} alt={detail.application.full_name} />
                ) : (
                  <div className="tm-card-initials">{detail.application.full_name?.charAt(0)}</div>
                )}
              </div>
              <div className="tm-modal-headline">
                <h2>{detail.application.full_name}</h2>
                <p>{detail.application.email} · {detail.application.phone || 'no phone'}</p>
                <div className="tm-modal-badges">
                  <span className={getStatusClass(detail.application.status)}>
                    {STATUS_LABELS[detail.application.status]}
                  </span>
                  <span className="tm-tag">🌍 {detail.application.country || '—'}</span>
                  <span className="tm-tag">📅 {detail.application.years_experience || 0} yrs</span>
                </div>
              </div>
            </div>

            <div className="tm-modal-body">
              {/* VIDEO */}
              {detail.application.intro_video_url && (
                <section className="tm-section">
                  <h3>🎬 Intro Video</h3>
                  <video
                    controls
                    src={detail.application.intro_video_url}
                    poster={detail.application.intro_video_thumbnail}
                    className="tm-video"
                  />
                  <p className="tm-video-meta">
                    Duration: {Math.floor((detail.application.intro_video_duration || 0) / 60)}:
                    {String((detail.application.intro_video_duration || 0) % 60).padStart(2, '0')}
                  </p>
                </section>
              )}

              {/* BIO */}
              <section className="tm-section">
                <h3>📝 Bio</h3>
                <p className="tm-short-bio"><em>"{detail.application.bio_short || '—'}"</em></p>
                <p className="tm-long-bio">{detail.application.bio_long || '—'}</p>
              </section>

              {/* TEACHING */}
              <section className="tm-section">
                <h3>🎓 Teaching Profile</h3>
                <div className="tm-fact-grid">
                  <Fact label="Subjects" values={detail.application.subjects} />
                  <Fact label="Curricula" values={detail.application.curricula} />
                  <Fact label="Grade Levels" values={detail.application.grade_levels} />
                  <Fact label="Languages" values={detail.application.languages} />
                  <Fact label="Preferred Shifts" values={detail.application.preferred_shifts} />
                  <Fact label="Teaching Certs" values={detail.application.teaching_certifications} />
                </div>
              </section>

              {/* QUALIFICATIONS */}
              <section className="tm-section">
                <h3>🎓 Qualifications</h3>
                <div className="tm-fact-grid">
                  <Fact label="Highest Degree" values={[detail.application.highest_degree]} />
                  <Fact label="Institution" values={[detail.application.institution]} />
                  <Fact label="Graduation Year" values={[detail.application.graduation_year]} />
                </div>
              </section>

              {/* DOCUMENTS */}
              <section className="tm-section">
                <h3>📁 Documents</h3>
                <div className="tm-docs">
                  {detail.application.cv_url && (
                    <a href={detail.application.cv_url} target="_blank" rel="noopener noreferrer" className="tm-doc">
                      📄 View CV
                    </a>
                  )}
                  {detail.application.id_document_url && (
                    <a href={detail.application.id_document_url} target="_blank" rel="noopener noreferrer" className="tm-doc">
                      🆔 View ID
                    </a>
                  )}
                  {(detail.application.qualification_docs || []).map((u, i) => (
                    <a key={i} href={u} target="_blank" rel="noopener noreferrer" className="tm-doc">
                      🎓 Certificate {i + 1}
                    </a>
                  ))}
                </div>
              </section>

              {/* NOTES + ACTIONS */}
              <section className="tm-section">
                <h3>📝 Review Notes</h3>
                <textarea
                  rows={3}
                  value={statusNote}
                  onChange={e => setStatusNote(e.target.value)}
                  placeholder="Add internal notes about this applicant…"
                  className="tm-notes"
                />
              </section>

              {/* LOGS */}
              {detail.logs?.length > 0 && (
                <section className="tm-section">
                  <h3>📜 Activity Log</h3>
                  <ul className="tm-logs">
                    {detail.logs.map(log => (
                      <li key={log.id}>
                        <strong>{log.action}</strong>
                        <span>{new Date(log.created_at).toLocaleString()}</span>
                        {log.note && <em>{log.note}</em>}
                      </li>
                    ))}
                  </ul>
                </section>
              )}
            </div>

            <div className="tm-modal-footer">
              <button className="tm-btn tm-btn-secondary" onClick={closeDetail}>Close</button>
              <button
                className="tm-btn tm-btn-reject"
                disabled={updating}
                onClick={() => changeStatus('rejected')}
              >
                ❌ Reject
              </button>
              <button
                className="tm-btn tm-btn-interview"
                disabled={updating}
                onClick={() => changeStatus('interview_scheduled')}
              >
                📅 Schedule Interview
              </button>
              <button
                className="tm-btn tm-btn-approve"
                disabled={updating}
                onClick={() => changeStatus('approved')}
              >
                ✅ Approve Tutor
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const Fact = ({ label, values }) => {
  const list = (values || []).filter(Boolean);
  return (
    <div className="tm-fact">
      <span className="tm-fact-label">{label}</span>
      <span className="tm-fact-value">
        {list.length === 0 ? '—' : list.join(', ')}
      </span>
    </div>
  );
};

export default TutorManagement;