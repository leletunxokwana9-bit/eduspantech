import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useHomeData } from '../hooks/useHomeData';
import './SubjectDetail.css';

const SubjectDetail = () => {
  const { subjectName } = useParams();
  const navigate = useNavigate();
  const { data, loading, error } = useHomeData();
  const [activeTab, setActiveTab] = useState('overview');

  // Find the subject from the data
  const subject = data?.subjects?.items?.find(
    (item) => item.name.toLowerCase().replace(/\s+/g, '-') === subjectName
  );

  // If subject not found, redirect
  useEffect(() => {
    if (!loading && !subject && data) {
      navigate('/subjects');
    }
  }, [loading, subject, data, navigate]);

  if (loading) {
    return (
      <div className="subject-detail-container loading">
        <div className="loading-spinner"></div>
        <p>Loading subject details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="subject-detail-container error">
        <div className="error-icon">⚠️</div>
        <h2>Error loading subject</h2>
        <p>{error}</p>
        <button className="retry-button" onClick={() => window.location.reload()}>
          Try Again
        </button>
      </div>
    );
  }

  if (!subject) {
    return (
      <div className="subject-detail-container error">
        <div className="error-icon">🔍</div>
        <h2>Subject Not Found</h2>
        <p>The subject you're looking for doesn't exist.</p>
        <button className="retry-button" onClick={() => navigate('/subjects')}>
          Back to Subjects
        </button>
      </div>
    );
  }

  const getCohortTier = () => {
    if (subject.name === 'Algebra' || subject.name === 'Geometry') return 'Tier 1';
    if (subject.name === 'Calculus' || subject.name === 'Statistics' || subject.name === 'Trigonometry') return 'Tier 2';
    if (subject.name === 'Differential Equations' || subject.name === 'Linear Algebra' || subject.name === 'Matrices') return 'Tier 3';
    return 'Tier 1';
  };

  const getRegion = () => {
    const regions = {
      'Algebra': 'Global',
      'Geometry': 'Global',
      'Calculus': 'Global',
      'Statistics': 'Global',
      'Trigonometry': 'Global',
      'Matrices': 'Global',
      'Functions': 'Global',
      'Financial Mathematics': 'South Africa',
      'Differential Equations': 'Global',
      'Linear Algebra': 'Global'
    };
    return regions[subject.name] || 'Global';
  };

  const getAWSRegion = () => {
    const regions = {
      'South Africa': 'af-south-1',
      'USA': 'us-east-1',
      'UK': 'eu-west-1',
      'Australia': 'ap-southeast-2',
      'Singapore': 'ap-southeast-1',
      'Japan': 'ap-northeast-1',
      'Brazil': 'sa-east-1'
    };
    return regions[getRegion()] || 'us-east-1';
  };

  const tabs = [
    { id: 'overview', label: '📋 Overview' },
    { id: 'topics', label: '📚 Topics' },
    { id: 'schedule', label: '🕐 Schedule' },
    { id: 'resources', label: '📄 Resources' }
  ];

  return (
    <div className="subject-detail-container">
      {/* Header */}
      <div className="subject-detail-header">
        <div className="subject-title-section">
          <h1>{subject.icon} {subject.name}</h1>
          <div className="subject-meta-tags">
            <span className="tag cohort-tier">{getCohortTier()}</span>
            <span className="tag region">🌍 {getRegion()}</span>
            <span className="tag aws-region">☁️ {getAWSRegion()}</span>
          </div>
        </div>
        <div className="subject-actions">
          <button className="btn btn-primary">📚 Enroll Now</button>
          <button className="btn btn-secondary">📝 View Syllabus</button>
        </div>
      </div>

      {/* Content */}
      <div className="subject-detail-content">
        {/* Overview Section */}
        <div className="subject-overview">
          <h3>📖 About This Subject</h3>
          <p className="subject-description">{subject.longDescription || subject.description}</p>
          
          <div className="subject-info-grid">
            <div className="info-card">
              <h4>🎯 Curriculum Structure</h4>
              <p><strong>Tier:</strong> {getCohortTier()}</p>
              <p><strong>Region:</strong> {getRegion()}</p>
              <p><strong>AWS Hub:</strong> {getAWSRegion()}</p>
            </div>
            <div className="info-card">
              <h4>📊 Grade Mapping</h4>
              <p><strong>South Africa:</strong> Grades 8-12</p>
              <p><strong>International:</strong> Equivalent</p>
              <div className="curriculum-adjustment">
                <p>⚠️ <strong>Adjustment:</strong> {subject.name} may be introduced earlier in accelerated curricula (e.g., Singapore, USA AP tracks).</p>
              </div>
            </div>
            <div className="info-card">
              <h4>👨‍🏫 Tutor Assignment</h4>
              <p><strong>Shift:</strong> 24/7 Centralised South African Tutors</p>
              <div className="tutors-list">
                <span className="tutor-tag">🇿🇦 Tutor A (Tier 1)</span>
                <span className="tutor-tag">🇿🇦 Tutor B (Tier 2)</span>
                <span className="tutor-tag">🇿🇦 Tutor C (Tier 3)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Whiteboard Preview */}
        <div className="whiteboard-preview-section">
          <h3>✏️ Interactive Whiteboard Preview</h3>
          <div className="whiteboard-container">
            <svg className="whiteboard-canvas" viewBox="0 0 600 200" preserveAspectRatio="xMidYMid meet">
              <rect width="100%" height="100%" fill="#ffffff" />
              <text x="20" y="40" fontSize="14" fill="#333" fontFamily="monospace">📐 Interactive Whiteboard</text>
              <text x="20" y="70" fontSize="12" fill="#666" fontFamily="monospace">Draw, collaborate, and solve problems in real-time</text>
              <line x1="20" y1="100" x2="580" y2="100" stroke="#e2e8f0" strokeWidth="1" />
              <text x="20" y="130" fontSize="12" fill="#888" fontFamily="monospace">✏️ Vector tools | 📐 Shape tools | ✏️ Freehand</text>
              <text x="20" y="160" fontSize="12" fill="#aaa" fontFamily="monospace">💡 {subject.name} • Live session • Tutor: 🇿🇦</text>
            </svg>
          </div>
          <p className="whiteboard-note">💡 Whiteboard archives available for Tier_Silver and above</p>
        </div>

        {/* Tabs Section */}
        <div className="topics-section">
          {/* Tab Navigation */}
          <div className="tab-navigation">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="tab-content">
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <>
                <h3>📋 Subject Overview</h3>
                <p>{subject.longDescription || subject.description}</p>
                <div className="overview-details">
                  <p><strong>📚 Subject:</strong> {subject.name}</p>
                  <p><strong>🎯 Tier:</strong> {getCohortTier()}</p>
                  <p><strong>🌍 Region:</strong> {getRegion()}</p>
                  <p><strong>☁️ AWS Hub:</strong> {getAWSRegion()}</p>
                  <p><strong>📖 Topics:</strong> {subject.topics?.length || 0}</p>
                  <p><strong>📄 Resources:</strong> {subject.resources?.length || 0}</p>
                </div>
              </>
            )}

            {/* Topics Tab */}
            {activeTab === 'topics' && (
              <>
                <h3>📚 Topics Covered</h3>
                <div className="topics-grid">
                  {subject.topics?.map((topic) => (
                    <div key={topic.id} className="topic-card">
                      <h4>{topic.name}</h4>
                      <p>{topic.description}</p>
                      <div className="subtopics">
                        <span className="subtopic-tag">📖 Study</span>
                        <span className="subtopic-tag">✏️ Practice</span>
                        <span className="subtopic-tag">🎯 Master</span>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* Schedule Tab */}
            {activeTab === 'schedule' && (
              <>
                <h3>🕐 Learning Schedule</h3>
                <div className="schedule-info">
                  <div className="schedule-item">
                    <h4>🌏 Asia-Pacific Window</h4>
                    <p><strong>Time:</strong> 08:00 – 15:00 SAST</p>
                    <p><strong>Tutor:</strong> 🇿🇦 Tutor A (Tier 1)</p>
                    <p><strong>Hubs:</strong> Sydney, Tokyo</p>
                  </div>
                  <div className="schedule-item">
                    <h4>🌏 South Asian / Indian Corridor</h4>
                    <p><strong>Time:</strong> 12:00 – 19:30 SAST</p>
                    <p><strong>Tutor:</strong> 🇿🇦 Tutor B (Tier 2)</p>
                    <p><strong>Hubs:</strong> Singapore, Mumbai</p>
                  </div>
                  <div className="schedule-item">
                    <h4>🌍 Africa / Europe Core</h4>
                    <p><strong>Time:</strong> 16:00 – 23:00 SAST</p>
                    <p><strong>Tutor:</strong> 🇿🇦 Tutor C (Tier 3)</p>
                    <p><strong>Hubs:</strong> Cape Town, Ireland</p>
                  </div>
                  <div className="schedule-item">
                    <h4>🌎 Pan-American Axis</h4>
                    <p><strong>Time:</strong> 21:00 – 04:00 SAST</p>
                    <p><strong>Tutor:</strong> 🇿🇦 Tutor D (Tier 3)</p>
                    <p><strong>Hubs:</strong> São Paulo, N. Virginia, Oregon</p>
                  </div>
                </div>
              </>
            )}

            {/* Resources Tab */}
            {activeTab === 'resources' && (
              <>
                <h3>📄 Learning Resources</h3>
                <div className="overview-details">
                  {subject.resources?.map((resource) => (
                    <div key={resource.id} className="info-card">
                      <h4>
                        {resource.type === 'guide' && '📖'}
                        {resource.type === 'practice' && '✏️'}
                        {resource.type === 'video' && '🎬'}
                        {resource.type === 'interactive' && '🎮'}
                        {' '}{resource.name}
                      </h4>
                      <p><a href={resource.url} className="btn btn-secondary" style={{ display: 'inline-block', marginTop: '8px' }}>Access →</a></p>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubjectDetail;