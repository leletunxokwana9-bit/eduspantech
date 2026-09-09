// src/pages/Admin/AdminLoginLayout.js
import React from 'react';
import { Outlet } from 'react-router-dom';

/**
 * AdminLoginLayout - Clean layout for admin login (no navbar, no footer)
 * This ensures the admin login page doesn't show student/tutor navigation
 */
const AdminLoginLayout = () => {
  return (
    <div className="admin-login-layout" style={{ 
      minHeight: '100vh',
      background: '#0a0e1a'
    }}>
      <Outlet />
    </div>
  );
};

export default AdminLoginLayout;