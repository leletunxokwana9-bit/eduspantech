// src/pages/Admin/AdminPayments.js
import React, { useState, useEffect } from 'react';
import { supabase } from '../../services/supabaseClient'; 
import './AdminPayments.css';

const AdminPayments = () => {
    const [payments, setPayments] = useState([]);
    const [summary, setSummary] = useState({ total: 0, completed: 0, pending: 0, refunded: 0 });
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({ status: '', startDate: '', endDate: '' });

    useEffect(() => {
        fetchPayments();
    }, [filters]);

    const fetchPayments = async () => {
        try {
            setLoading(true);
            
            // Query the new View instead of the raw table
            let query = supabase
                .from('payment_details')
                .select('*')
                .order('created_at', { ascending: false });

            if (filters.status) query = query.eq('status', filters.status);
            if (filters.startDate) query = query.gte('created_at', new Date(filters.startDate).toISOString());
            if (filters.endDate) {
                const end = new Date(filters.endDate);
                end.setDate(end.getDate() + 1);
                query = query.lte('created_at', end.toISOString());
            }

            const { data, error } = await query;
            if (error) throw error;

            setPayments(data || []);
            calculateSummary(data || []);

        } catch (error) {
            console.error('Error fetching payments:', error);
        } finally {
            setLoading(false);
        }
    };

    const calculateSummary = (data) => {
        let total = 0, completed = 0, pending = 0, refunded = 0;
        
        data.forEach(p => {
            if (p.status === 'completed') {
                completed += p.amount;
                total += p.amount;
            } else if (p.status === 'pending') {
                pending += p.amount;
            } else if (p.status === 'refunded') {
                refunded += p.amount;
            }
        });

        setSummary({ total, completed, pending, refunded });
    };

    const handleMarkAsPaid = async (paymentId) => {
        const confirm = window.confirm("Are you sure you want to mark this tutor payout as completed?");
        if (!confirm) return;

        try {
            const { error } = await supabase
                .from('payments') // Update the real table
                .update({ status: 'paid_to_tutor' })
                .eq('id', paymentId);
                
            if (error) throw error;
            
            fetchPayments();
        } catch (err) {
            alert('Failed to update payout status.');
        }
    };

    const getStatusBadge = (status) => {
        const colors = {
            'completed': '#10b981',
            'pending': '#f59e0b',
            'failed': '#ef4444',
            'refunded': '#8b5cf6',
            'paid_to_tutor': '#3b82f6'
        };
        return (
            <span className="payment-status" style={{ background: colors[status] || '#6b7280' }}>
                {status ? status.replace('_', ' ').toUpperCase() : 'UNKNOWN'}
            </span>
        );
    };

    if (loading && payments.length === 0) {
        return <div className="admin-payments-loading">Loading payments...</div>;
    }

    return (
        <div className="admin-payments">
            <div className="payments-header">
                <h2>Payment Management</h2>
            </div>

            <div className="summary-grid">
                <div className="summary-card total">
                    <span className="summary-label">Total Revenue</span>
                    <span className="summary-value">R{summary.total.toLocaleString()}</span>
                </div>
                <div className="summary-card completed">
                    <span className="summary-label">Completed</span>
                    <span className="summary-value">R{summary.completed.toLocaleString()}</span>
                </div>
                <div className="summary-card pending">
                    <span className="summary-label">Pending</span>
                    <span className="summary-value">R{summary.pending.toLocaleString()}</span>
                </div>
                <div className="summary-card refunded">
                    <span className="summary-label">Refunded</span>
                    <span className="summary-value">R{summary.refunded.toLocaleString()}</span>
                </div>
            </div>

            <div className="filters-bar">
                <select
                    value={filters.status}
                    onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                    className="filter-select"
                >
                    <option value="">All Status</option>
                    <option value="completed">Completed</option>
                    <option value="paid_to_tutor">Paid to Tutor</option>
                    <option value="pending">Pending</option>
                    <option value="failed">Failed</option>
                    <option value="refunded">Refunded</option>
                </select>
                <input type="date" value={filters.startDate} onChange={(e) => setFilters({ ...filters, startDate: e.target.value })} className="filter-date" />
                <input type="date" value={filters.endDate} onChange={(e) => setFilters({ ...filters, endDate: e.target.value })} className="filter-date" />
                <button className="filter-btn" onClick={fetchPayments}>Apply</button>
            </div>

            <div className="payments-table-container">
                <table className="payments-table">
                    <thead>
                        <tr>
                            <th>User</th>
                            <th>Plan</th>
                            <th>Amount</th>
                            <th>Status</th>
                            <th>Date</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {payments.length === 0 ? (
                            <tr>
                                <td colSpan="6" className="no-data">No payments found</td>
                            </tr>
                        ) : (
                            payments.map((payment) => {
                                const tutorCut = (payment.amount * 0.7).toFixed(2); 
                                
                                // Because we used the View, we just read `user_name` directly!
                                const userName = payment.user_name || 'Student'; 
                                const userEmail = payment.user_email || payment.email;
                                
                                return (
                                    <tr key={payment.id}>
                                        <td>
                                            <div className="user-cell">
                                                <span>{userName}</span>
                                                <span className="user-email">{userEmail}</span>
                                            </div>
                                        </td>
                                        <td>{payment.plan_name || 'N/A'}</td>
                                        <td className="amount">R{payment.amount?.toFixed(2)}</td>
                                        <td>{getStatusBadge(payment.status)}</td>
                                        <td>{new Date(payment.created_at).toLocaleDateString()}</td>
                                        <td>
                                            {payment.status === 'completed' ? (
                                                <button 
                                                    onClick={() => handleMarkAsPaid(payment.id)}
                                                    style={{ background: '#3b82f6', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}
                                                >
                                                    Pay Tutor (R{tutorCut})
                                                </button>
                                            ) : payment.status === 'paid_to_tutor' ? (
                                                <span style={{ color: '#10b981', fontSize: '12px', fontWeight: 'bold' }}>✓ Paid</span>
                                            ) : null}
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default AdminPayments;