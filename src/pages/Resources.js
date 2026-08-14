// src/pages/Resources.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import resourceService from '../services/resourceService';
import authService from '../services/authService';
import './Resources.css';

const Resources = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [resources, setResources] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  // ✅ Check authentication
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        setIsAuthenticated(false);
        setCheckingAuth(false);
        setLoading(false);
        return;
      }

      try {
        const user = await authService.getCurrentUserWithSubscription();
        if (user) {
          setIsAuthenticated(true);
        } else {
          setIsAuthenticated(false);
          authService.logout();
        }
      } catch (err) {
        console.error('Auth check failed:', err);
        setIsAuthenticated(false);
      } finally {
        setCheckingAuth(false);
      }
    };
    checkAuth();
  }, []);

  // Fetch resources only if authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch resources using the service
        const resourcesData = await resourceService.getAllResources();
        console.log('📚 Resources from API:', resourcesData);
        setResources(resourcesData.resources || []);
        
        // Fetch subjects
        try {
          const subjectsData = await resourceService.getSubjects();
          console.log('📚 Subjects from API:', subjectsData);
          setSubjects(subjectsData.subjects || []);
        } catch (subjErr) {
          console.warn('Could not fetch subjects:', subjErr);
          setSubjects([]);
        }
        
        setError(null);
      } catch (err) {
        console.error('❌ Error fetching resources:', err);
        setError(err.message || 'Failed to load resources');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [isAuthenticated]);

  // Group resources by subject to create vaults
  const getVaults = () => {
    // If we have real data, use it
    if (resources.length > 0 && subjects.length > 0) {
      const grouped = {};
      
      resources.forEach(resource => {
        const subjectId = resource.subject_id;
        if (!subjectId) return;
        
        if (!grouped[subjectId]) {
          const subject = subjects.find(s => s.id === subjectId);
          grouped[subjectId] = {
            id: subjectId,
            name: subject?.name || 'Unknown Subject',
            icon: subject?.icon || '📚',
            description: subject?.description || '',
            videos: [],
            practice: [],
            guides: []
          };
        }
        
        // Classify by type
        const type = resource.type?.toLowerCase() || '';
        if (type === 'video') {
          grouped[subjectId].videos.push(resource);
        } else if (type === 'practice') {
          grouped[subjectId].practice.push(resource);
        } else if (type === 'guide') {
          grouped[subjectId].guides.push(resource);
        } else {
          // Default fallback
          grouped[subjectId].videos.push(resource);
        }
      });
      
      const result = Object.values(grouped);
      if (result.length > 0) {
        return result;
      }
    }

    // Return fallback vaults if no data
    return getFallbackVaults();
  };

  // Fallback vaults for demo/empty state (only shown if no data)
  const getFallbackVaults = () => {
    // If we have subjects but no resources, use subjects
    if (subjects.length > 0) {
      return subjects.map(subject => ({
        id: subject.id,
        name: subject.name,
        icon: subject.icon || '📚',
        description: subject.description || '',
        videos: [],
        practice: [],
        guides: []
      }));
    }

    // Hardcoded fallback
    return [
      {
        id: 'algebra',
        name: 'Algebra',
        icon: '🔢',
        description: 'Master linear equations, polynomials, functions, and inequalities',
        videos: [],
        practice: [],
        guides: []
      },
      {
        id: 'geometry',
        name: 'Geometry',
        icon: '📐',
        description: 'Explore shapes, angles, proofs, and spatial reasoning',
        videos: [],
        practice: [],
        guides: []
      },
      {
        id: 'calculus',
        name: 'Calculus',
        icon: '∫',
        description: 'Understand derivatives, integrals, limits, and applications',
        videos: [],
        practice: [],
        guides: []
      }
    ];
  };

  const vaults = getVaults();

  const handleAccessResources = (vault) => {
    const slug = vault.name.toLowerCase().replace(/\s+/g, '-');
    navigate(`/resources/${slug}`, { state: { vault } });
  };

  // Show loading while checking auth
  if (checkingAuth || loading) {
    return (
      <div className="resources-page-loading">
        <div className="loading-spinner"></div>
        <p>{checkingAuth ? 'Checking authentication...' : 'Loading resources...'}</p>
      </div>
    );
  }

  // If not authenticated, show login prompt
  if (!isAuthenticated) {
    return (
      <div className="resources-page-login-required">
        <div className="login-prompt-card">
          <span className="login-prompt-icon">🔒</span>
          <h2>Login Required</h2>
          <p>Please log in to access learning resources.</p>
          <button 
            className="login-prompt-btn"
            onClick={() => navigate('/login', { state: { from: '/resources' } })}
          >
            Login Now →
          </button>
          <p className="login-prompt-register">
            Don't have an account? <span onClick={() => navigate('/register')}>Register here</span>
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="resources-page-error">
        <span>⚠️</span>
        <p>{error}</p>
        <button onClick={() => window.location.reload()}>Try Again</button>
      </div>
    );
  }

  const totalResources = resources.length;

  return (
    <div className="resources-page">
      <div className="resources-page-header">
        <h1>📚 Learning Resources</h1>
        <p>On-demand whiteboard archives and study materials</p>
        <span className="resources-count">{totalResources} resources available</span>
      </div>

      <div className="resources-page-grid">
        {vaults.length > 0 ? (
          vaults.map((vault) => {
            const total = (vault.videos?.length || 0) + (vault.practice?.length || 0) + (vault.guides?.length || 0);
            return (
              <div key={vault.id} className="resources-page-card">
                <div className="resources-page-icon">{vault.icon}</div>
                <h3>{vault.name}</h3>
                <p>{vault.description}</p>
                <div className="resources-page-stats">
                  <span>🎬 {vault.videos?.length || 0} Videos</span>
                  <span>✏️ {vault.practice?.length || 0} Practice</span>
                  <span>📖 {vault.guides?.length || 0} Guides</span>
                </div>
                <button 
                  className="resources-page-btn"
                  onClick={() => handleAccessResources(vault)}
                  disabled={total === 0}
                >
                  {total > 0 
                    ? `Access Resources →` 
                    : 'No Resources Available'}
                </button>
              </div>
            );
          })
        ) : (
          <div className="resources-page-empty">
            <span>📚</span>
            <p>No resources available yet.</p>
            <p className="sub-text">Resources will be added soon.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Resources;