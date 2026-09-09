// src/pages/Admin/AdminLogin.js
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import './AdminLogin.css';

const AdminLogin = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('https://eduspantech-backend.onrender.com/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ 
          email: email.trim(), 
          password: password 
        })
      });

      const data = await response.json();

      if (response.ok && data.accessToken) {
        localStorage.setItem('accessToken', data.accessToken);
        localStorage.setItem('refreshToken', data.refreshToken);
        localStorage.setItem('user', JSON.stringify(data.user));
        
        if (data.user?.is_admin) {
          navigate('/admin/dashboard');
        } else {
          setError('Access denied. Admin privileges required.');
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('user');
        }
      } else {
        // ✅ Show user-friendly error message
        if (response.status === 500) {
          setError('Server error. Please try again later.');
        } else if (response.status === 401) {
          setError('Invalid email or password.');
        } else if (response.status === 403) {
          setError('Account not verified. Please check your email.');
        } else {
          setError(data.error || data.message || 'Login failed. Please try again.');
        }
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('Unable to connect to server. Please check your internet connection.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-login-container">
      <div className="admin-login-bg">
        <div className="admin-login-orb orb-1"></div>
        <div className="admin-login-orb orb-2"></div>
      </div>
      <div className="admin-login-card">
        <div className="admin-login-header">
          <div className="admin-login-icon">👑</div>
          <h1>Admin Access</h1>
          <p>Secure administrator login panel</p>
        </div>
        
        {error && (
          <div className="admin-login-error">
            <span>⚠️</span> {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="admin-login-form">
          <div className="form-group">
            <label>Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@eduspantech.com"
              required
              disabled={loading}
            />
          </div>
          
          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
              disabled={loading}
            />
          </div>
          
          <button 
            type="submit" 
            disabled={loading} 
            className="admin-login-btn"
          >
            {loading ? 'Authenticating...' : 'Access Admin Panel →'}
          </button>
        </form>
        
        <div className="admin-login-footer">
          <Link to="/login">← Back to User Login</Link>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;