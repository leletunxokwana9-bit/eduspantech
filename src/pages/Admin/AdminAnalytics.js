// src/pages/Admin/AdminAnalytics.js
import React, { useState, useEffect } from 'react';
import './AdminAnalytics.css';

const AdminAnalytics = () => {
    const [revenueData, setRevenueData] = useState([]);
    const [userData, setUserData] = useState([]);
    const [period, setPeriod] = useState('monthly');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchAnalytics();
    }, [period]);

    const fetchAnalytics = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('accessToken');
            
            const [revenueRes, userRes] = await Promise.all([
                fetch(`${process.env.REACT_APP_API_URL}/admin/analytics/revenue?period=${period}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                }),
                fetch(`${process.env.REACT_APP_API_URL}/admin/analytics/users?period=${period === 'monthly' ? '30d' : '7d'}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                })
            ]);

            const revenueData = await revenueRes.json();
            const userData = await userRes.json();

            if (revenueData.success) {
                setRevenueData(revenueData.data || []);
            }
            if (userData.success) {
                setUserData(userData.data || []);
            }
        } catch (error) {
            console.error('Error fetching analytics:', error);
        } finally {
            setLoading(false);
        }
    };

    const getMaxValue = (data, key) => {
        return Math.max(...data.map(d => d[key] || 0), 1);
    };

    if (loading) {
        return <div className="admin-analytics-loading">Loading analytics...</div>;
    }

    return (
        <div className="admin-analytics">
            <div className="analytics-header">
                <h2>Analytics & Reports</h2>
                <div className="period-selector">
                    <button 
                        className={`period-btn ${period === 'daily' ? 'active' : ''}`}
                        onClick={() => setPeriod('daily')}
                    >
                        Daily
                    </button>
                    <button 
                        className={`period-btn ${period === 'monthly' ? 'active' : ''}`}
                        onClick={() => setPeriod('monthly')}
                    >
                        Monthly
                    </button>
                </div>
            </div>

            <div className="analytics-grid">
                {/* Revenue Chart */}
                <div className="analytics-card">
                    <h3>Revenue {period === 'daily' ? '(Last 30 Days)' : '(Year to Date)'}</h3>
                    <div className="chart-container">
                        {revenueData.length === 0 ? (
                            <p className="no-data">No revenue data available</p>
                        ) : (
                            <div className="chart-bars">
                                {revenueData.map((item, index) => (
                                    <div key={index} className="chart-bar-wrapper">
                                        <div 
                                            className="chart-bar revenue-bar"
                                            style={{ 
                                                height: `${(item.amount / getMaxValue(revenueData, 'amount')) * 200}px` 
                                            }}
                                        ></div>
                                        <span className="chart-label">{item.date}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                    <div className="chart-total">
                        Total: R{revenueData.reduce((sum, d) => sum + d.amount, 0).toLocaleString()}
                    </div>
                </div>

                {/* User Growth Chart */}
                <div className="analytics-card">
                    <h3>User Growth {period === 'daily' ? '(Last 30 Days)' : '(Year to Date)'}</h3>
                    <div className="chart-container">
                        {userData.length === 0 ? (
                            <p className="no-data">No user data available</p>
                        ) : (
                            <div className="chart-bars">
                                {userData.map((item, index) => (
                                    <div key={index} className="chart-bar-wrapper">
                                        <div 
                                            className="chart-bar user-bar"
                                            style={{ 
                                                height: `${(item.count / getMaxValue(userData, 'count')) * 200}px` 
                                            }}
                                        ></div>
                                        <span className="chart-label">{item.date}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                    <div className="chart-total">
                        Total New Users: {userData.reduce((sum, d) => sum + d.count, 0).toLocaleString()}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminAnalytics;