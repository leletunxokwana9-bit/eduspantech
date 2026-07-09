import React from 'react';
import { useHomeData } from '../hooks/useHomeData';
import './Dashboard.css';

const Dashboard = () => {
  const { data, loading, error } = useHomeData();

  if (loading) return <div className="dashboard-loading">Loading your dashboard...</div>;
  if (error) return <div className="dashboard-error">Error loading dashboard: {error}</div>;
  if (!data) return <div className="dashboard-empty">No dashboard data available</div>;

  const { dashboard } = data;

  return (
    <div className="dashboard-container">
      <h2>📊 Welcome back, {dashboard?.user?.name || 'Student'}!</h2>
      <p>Continue your learning journey</p>
      
      <div className="dashboard-stats">
        <div className="stat-card">
          <span className="stat-emoji">📚</span>
          <div>
            <h3>{dashboard?.stats?.courses || 0}</h3>
            <p>Courses</p>
          </div>
        </div>
        <div className="stat-card">
          <span className="stat-emoji">⏰</span>
          <div>
            <h3>{dashboard?.stats?.hours || 0}</h3>
            <p>Hours</p>
          </div>
        </div>
        <div className="stat-card">
          <span className="stat-emoji">🏆</span>
          <div>
            <h3>{dashboard?.stats?.badges || 0}</h3>
            <p>Badges</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;