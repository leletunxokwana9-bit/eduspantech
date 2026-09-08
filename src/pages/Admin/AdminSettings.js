// src/pages/Admin/AdminSettings.js
import React, { useState, useEffect } from 'react';
import './AdminSettings.css';

const AdminSettings = () => {
    const [settings, setSettings] = useState({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saveMessage, setSaveMessage] = useState('');

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('accessToken');
            const response = await fetch(`${process.env.REACT_APP_API_URL}/admin/settings`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            if (data.success) {
                setSettings(data.settings || {});
            }
        } catch (error) {
            console.error('Error fetching settings:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSettingChange = (key, value) => {
        setSettings(prev => ({ ...prev, [key]: value }));
    };

    const handleSaveSettings = async () => {
        try {
            setSaving(true);
            setSaveMessage('');
            const token = localStorage.getItem('accessToken');
            const response = await fetch(`${process.env.REACT_APP_API_URL}/admin/settings`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(settings)
            });
            const data = await response.json();
            if (data.success) {
                setSaveMessage('✅ Settings saved successfully!');
                setTimeout(() => setSaveMessage(''), 3000);
            }
        } catch (error) {
            console.error('Error saving settings:', error);
            setSaveMessage('❌ Error saving settings');
        } finally {
            setSaving(false);
        }
    };

    const renderSettingInput = (key, value) => {
        if (typeof value === 'boolean') {
            return (
                <label className="toggle-label">
                    <input
                        type="checkbox"
                        checked={value}
                        onChange={(e) => handleSettingChange(key, e.target.checked)}
                    />
                    <span className="toggle-slider"></span>
                </label>
            );
        }

        if (typeof value === 'number') {
            return (
                <input
                    type="number"
                    value={value}
                    onChange={(e) => handleSettingChange(key, parseFloat(e.target.value) || 0)}
                    className="setting-input"
                />
            );
        }

        if (typeof value === 'string' && value.startsWith('{')) {
            try {
                const parsed = JSON.parse(value);
                if (Array.isArray(parsed)) {
                    return (
                        <input
                            type="text"
                            value={parsed.join(', ')}
                            onChange={(e) => handleSettingChange(key, JSON.stringify(e.target.value.split(',').map(s => s.trim()).filter(Boolean)))}
                            className="setting-input"
                        />
                    );
                }
            } catch (e) {
                return (
                    <input
                        type="text"
                        value={value}
                        onChange={(e) => handleSettingChange(key, e.target.value)}
                        className="setting-input"
                    />
                );
            }
        }

        return (
            <input
                type="text"
                value={value}
                onChange={(e) => handleSettingChange(key, e.target.value)}
                className="setting-input"
            />
        );
    };

    const getSettingDisplay = (key, value) => {
        if (key === 'ip_whitelist') {
            try {
                const parsed = JSON.parse(value);
                if (Array.isArray(parsed)) {
                    return parsed.join(', ') || 'No IPs whitelisted';
                }
            } catch (e) {
                return value || 'No IPs whitelisted';
            }
        }
        return value;
    };

    if (loading) {
        return <div className="admin-settings-loading">Loading settings...</div>;
    }

    return (
        <div className="admin-settings">
            <div className="settings-header">
                <h2>System Settings</h2>
                <button className="save-btn" onClick={handleSaveSettings} disabled={saving}>
                    {saving ? 'Saving...' : '💾 Save Settings'}
                </button>
            </div>

            {saveMessage && (
                <div className={`save-message ${saveMessage.includes('Error') ? 'error' : 'success'}`}>
                    {saveMessage}
                </div>
            )}

            <div className="settings-grid">
                {/* General Settings */}
                <div className="settings-section">
                    <h3>General</h3>
                    <div className="setting-group">
                        <label>Site Name</label>
                        {renderSettingInput('site_name', settings.site_name || 'EduSpantech')}
                    </div>
                    <div className="setting-group">
                        <label>Site Tagline</label>
                        {renderSettingInput('site_tagline', settings.site_tagline || 'Education for the love of your life')}
                    </div>
                    <div className="setting-group">
                        <label>Support Email</label>
                        {renderSettingInput('support_email', settings.support_email || 'support@eduspantech.com')}
                    </div>
                </div>

                {/* Payment Settings */}
                <div className="settings-section">
                    <h3>Payments</h3>
                    <div className="setting-group">
                        <label>Default Currency</label>
                        {renderSettingInput('default_currency', settings.default_currency || 'ZAR')}
                    </div>
                    <div className="setting-group">
                        <label>Tax Rate</label>
                        {renderSettingInput('tax_rate', settings.tax_rate || 0.15)}
                    </div>
                </div>

                {/* Tutor Settings */}
                <div className="settings-section">
                    <h3>Tutors</h3>
                    <div className="setting-group">
                        <label>Require Admin Approval</label>
                        {renderSettingInput('tutor_approval_required', settings.tutor_approval_required ?? true)}
                    </div>
                </div>

                {/* Session Settings */}
                <div className="settings-section">
                    <h3>Sessions</h3>
                    <div className="setting-group">
                        <label>Max Students Per Session</label>
                        {renderSettingInput('max_students_per_session', settings.max_students_per_session || 50)}
                    </div>
                    <div className="setting-group">
                        <label>Default Duration (minutes)</label>
                        {renderSettingInput('session_duration_default', settings.session_duration_default || 60)}
                    </div>
                </div>

                {/* Security Settings */}
                <div className="settings-section">
                    <h3>Security</h3>
                    <div className="setting-group">
                        <label>Require 2FA for Admins</label>
                        {renderSettingInput('admin_2fa_required', settings.admin_2fa_required ?? false)}
                    </div>
                    <div className="setting-group">
                        <label>Session Timeout (minutes)</label>
                        {renderSettingInput('session_timeout_minutes', settings.session_timeout_minutes || 15)}
                    </div>
                    <div className="setting-group">
                        <label>Enable IP Whitelist</label>
                        {renderSettingInput('ip_whitelist_enabled', settings.ip_whitelist_enabled ?? false)}
                    </div>
                    <div className="setting-group">
                        <label>IP Whitelist (comma separated)</label>
                        <input
                            type="text"
                            value={getSettingDisplay('ip_whitelist', settings.ip_whitelist)}
                            onChange={(e) => {
                                const ips = e.target.value.split(',').map(s => s.trim()).filter(Boolean);
                                handleSettingChange('ip_whitelist', JSON.stringify(ips));
                            }}
                            className="setting-input"
                            placeholder="192.168.1.1, 10.0.0.1"
                        />
                    </div>
                </div>

                {/* System Settings */}
                <div className="settings-section">
                    <h3>System</h3>
                    <div className="setting-group">
                        <label>Maintenance Mode</label>
                        {renderSettingInput('maintenance_mode', settings.maintenance_mode ?? false)}
                    </div>
                    <div className="setting-group">
                        <label>Allow Registration</label>
                        {renderSettingInput('allow_registration', settings.allow_registration ?? true)}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminSettings;