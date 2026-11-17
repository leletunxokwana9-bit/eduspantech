
import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import './SessionRecordings.css';

const API_URL =
  process.env.REACT_APP_API_URL ||
  'https://eduspantech-backend.onrender.com/api';

const SessionRecordings = () => {
  const [recordings, setRecordings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [selectedRecording, setSelectedRecording] = useState(null);

  useEffect(() => {
    fetchRecordings();
  }, []);

  const fetchRecordings = async () => {
    try {
      setLoading(true);
      setError('');

      const token = localStorage.getItem('accessToken');

      const response = await fetch(`${API_URL}/sessions/recordings`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Unable to load session recordings.');
      }

      const data = await response.json();

      const items = Array.isArray(data)
        ? data
        : data.recordings || data.sessions || [];

      setRecordings(items);
    } catch (err) {
      console.error('Session recordings error:', err);
      setError(err.message || 'Something went wrong loading recordings.');
    } finally {
      setLoading(false);
    }
  };

  const filteredRecordings = useMemo(() => {
    return recordings.filter((recording) => {
      const title = recording.title || recording.session_title || '';
      const tutor = recording.tutor_name || recording.tutor?.name || '';

      const matchesSearch =
        title.toLowerCase().includes(search.toLowerCase()) ||
        tutor.toLowerCase().includes(search.toLowerCase());

      const status = String(recording.recording_status || recording.status || '')
        .toLowerCase();

      const hasVideo = Boolean(
        recording.recording_url ||
        recording.video_url ||
        recording.recordingUrl
      );

      const matchesFilter =
        activeFilter === 'all' ||
        (activeFilter === 'available' && hasVideo) ||
        (activeFilter === 'processing' &&
          (status === 'processing' || status === 'pending'));

      return matchesSearch && matchesFilter;
    });
  }, [recordings, search, activeFilter]);

  const formatDate = (date) => {
    if (!date) return 'Date unavailable';

    const parsed = new Date(date);

    if (Number.isNaN(parsed.getTime())) return 'Date unavailable';

    return parsed.toLocaleDateString('en-ZA', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const getRecordingUrl = (recording) =>
    recording.recording_url ||
    recording.video_url ||
    recording.recordingUrl ||
    '';

  const getStatus = (recording) => {
    const url = getRecordingUrl(recording);
    const status = String(
      recording.recording_status || recording.status || ''
    ).toLowerCase();

    if (url) return 'available';

    if (status === 'processing' || status === 'pending') {
      return 'processing';
    }

    return 'unavailable';
  };

  const getTitle = (recording) =>
    recording.title ||
    recording.session_title ||
    recording.topic ||
    'Recorded Lesson';

  const getTutor = (recording) =>
    recording.tutor_name ||
    recording.tutor?.name ||
    'EduSpantech Tutor';

  const getDuration = (recording) =>
    recording.duration || recording.duration_minutes
      ? `${recording.duration || recording.duration_minutes} min`
      : 'Duration unavailable';

  const availableCount = recordings.filter(
    (item) => getStatus(item) === 'available'
  ).length;

  const processingCount = recordings.filter(
    (item) => getStatus(item) === 'processing'
  ).length;

  return (
    <div className="recordings-page">
      <div className="recordings-container">

        <div className="recordings-breadcrumb">
          <Link to="/parent-dashboard">Dashboard</Link>
          <span>/</span>
          <span>Session Recordings</span>
        </div>

        <div className="recordings-heading">
          <div>
            <span className="recordings-eyebrow">LEARNING LIBRARY</span>
            <h1>Session Recordings</h1>
            <p>
              Revisit your lessons, review important concepts and
              continue learning at your own pace.
            </p>
          </div>

          <button
            className="recordings-refresh"
            onClick={fetchRecordings}
            disabled={loading}
          >
            <span>↻</span> Refresh
          </button>
        </div>

        <div className="recordings-stats">
          <div className="recording-stat">
            <div className="recording-stat-icon blue">▣</div>
            <div>
              <span>Total recordings</span>
              <strong>{recordings.length}</strong>
            </div>
          </div>

          <div className="recording-stat">
            <div className="recording-stat-icon green">▶</div>
            <div>
              <span>Available</span>
              <strong>{availableCount}</strong>
            </div>
          </div>

          <div className="recording-stat">
            <div className="recording-stat-icon orange">◷</div>
            <div>
              <span>Processing</span>
              <strong>{processingCount}</strong>
            </div>
          </div>
        </div>

        <div className="recordings-toolbar">
          <div className="recordings-search">
            <span>⌕</span>
            <input
              type="text"
              placeholder="Search by lesson or tutor..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="recordings-filters">
            {[
              { id: 'all', label: 'All recordings' },
              { id: 'available', label: 'Available' },
              { id: 'processing', label: 'Processing' }
            ].map((filter) => (
              <button
                key={filter.id}
                className={
                  activeFilter === filter.id ? 'active' : ''
                }
                onClick={() => setActiveFilter(filter.id)}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>

        <div className="recordings-section-heading">
          <div>
            <h2>Your recordings</h2>
            <span>
              {filteredRecordings.length} recordings found
            </span>
          </div>
        </div>

        {loading ? (
          <div className="recordings-state">
            <div className="recordings-spinner"></div>
            <p>Loading your recordings...</p>
          </div>
        ) : error ? (
          <div className="recordings-state recordings-error">
            <div className="recordings-state-icon">!</div>
            <h3>Unable to load recordings</h3>
            <p>{error}</p>
            <button onClick={fetchRecordings}>Try again</button>
          </div>
        ) : filteredRecordings.length === 0 ? (
          <div className="recordings-empty">
            <div className="recordings-empty-icon">▶</div>
            <h3>No recordings found</h3>
            <p>
              {search
                ? 'Try another search term.'
                : 'Your completed session recordings will appear here when they become available.'}
            </p>
            {search && (
              <button
                onClick={() => setSearch('')}
                className="recordings-clear"
              >
                Clear search
              </button>
            )}
          </div>
        ) : (
          <div className="recordings-grid">
            {filteredRecordings.map((recording, index) => {
              const status = getStatus(recording);

              return (
                <article
                  className="recording-card"
                  key={recording.id || recording.session_id || index}
                >
                  <div className="recording-thumbnail">
                    <div className="recording-thumbnail-pattern"></div>
                    <div className="recording-play-icon">
                      ▶
                    </div>
                    <span className="recording-thumbnail-label">
                      EDUSPANTECH
                    </span>
                    {recording.duration && (
                      <span className="recording-duration">
                        {recording.duration}
                      </span>
                    )}
                  </div>

                  <div className="recording-card-content">
                    <div className="recording-card-top">
                      <span className={`recording-status ${status}`}>
                        {status === 'available'
                          ? 'Available'
                          : status === 'processing'
                          ? 'Processing'
                          : 'Not available'}
                      </span>
                      <span className="recording-date">
                        {formatDate(
                          recording.session_date ||
                          recording.date ||
                          recording.created_at
                        )}
                      </span>
                    </div>

                    <h3>{getTitle(recording)}</h3>

                    <p className="recording-tutor">
                      <span>◉</span> {getTutor(recording)}
                    </p>

                    <div className="recording-card-footer">
                      <span className="recording-length">
                        ◷ {getDuration(recording)}
                      </span>

                      <button
                        className="recording-watch-button"
                        disabled={status !== 'available'}
                        onClick={() => setSelectedRecording(recording)}
                      >
                        Watch recording <span>→</span>
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        <div className="recordings-help">
          <div className="recordings-help-icon">i</div>
          <div>
            <strong>Need help with your recordings?</strong>
            <p>
              If a recording is unavailable, contact your tutor or
              EduSpantech support for assistance.
            </p>
          </div>
        </div>

      </div>

      {selectedRecording && (
        <div
          className="recording-modal-overlay"
          onClick={() => setSelectedRecording(null)}
        >
          <div
            className="recording-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="recording-modal-header">
              <div>
                <span>SESSION PLAYBACK</span>
                <h2>{getTitle(selectedRecording)}</h2>
              </div>

              <button
                className="recording-modal-close"
                onClick={() => setSelectedRecording(null)}
                aria-label="Close video player"
              >
                ×
              </button>
            </div>

            <video
              className="recording-video"
              controls
              autoPlay
              src={getRecordingUrl(selectedRecording)}
            >
              Your browser does not support video playback.
            </video>

            <div className="recording-modal-details">
              <span>{getTutor(selectedRecording)}</span>
              <span>
                {formatDate(
                  selectedRecording.session_date ||
                  selectedRecording.date ||
                  selectedRecording.created_at
                )}
              </span>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default SessionRecordings;
