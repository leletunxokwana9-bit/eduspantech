// src/pages/Admin/AdminPayments.js
import React, { useState, useEffect } from 'react';
import './AdminPayments.css';

const AdminPayments = () => {
    const [payments, setPayments] = useState([]);
    const [summary, setSummary] = useState({ total: 0, completed: 0, pending: 0, refunded: 0, count: 0 });
    const [loading, setLoading] = useState(true);
    const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 });
    const [filters, setFilters] = useState({ status: '', startDate: '', endDate: '' });

    useEffect(() => {
        fetchPayments();
    }, [pagination.page, filters]);

    const fetchPayments = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('accessToken');
            const params = new URLSearchParams({
                page: pagination.page,
                limit: pagination.limit,
                ...(filters.status && { status: filters.status }),
                ...(filters.startDate && { startDate: filters.startDate }),
                ...(filters.endDate && { endDate: filters.endDate })
            });

            const response = await fetch(`${process.env.REACT_APP_API_URL}/admin/payments?${params}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            
            if (data.success) {
                setPayments(data.payments || []);
                setSummary(data.summary || { total: 0, completed: 0, pending: 0, refunded: 0, count: 0 });
                setPagination(prev => ({
                    ...prev,
                    total: data.pagination.total,
                    totalPages: data.pagination.totalPages
                }));
            }
        } catch (error) {
            console.error('Error fetching payments:', error);
        } finally {
            setLoading(false);
        }
    };

    const getStatusBadge = (status) => {
        const colors = {
            'completed': '#10b981',
            'pending': '#f59e0b',
            'failed': '#ef4444',
            'refunded': '#8b5cf6'
        };
        return <span className="payment-status" style={{ background: colors[status] || '#6b7280' }}>{status}</span>;
    };

    if (loading) {
        return <div className="admin-payments-loading">Loading payments...</div>;
    }

    return (
        <div className="admin-payments">
            <div className="payments-header">
                <h2>Payment Management</h2>
            </div>

            {/* Summary Cards */}
            <div className="summary-grid">
                <div className="summary-card total">
                    <span className="summary-label">Total Revenue</span>
                    <span className="summary-value">R{summary.total?.toLocaleString() || 0}</span>
                </div>
                <div className="summary-card completed">
                    <span className="summary-label">Completed</span>
                    <span className="summary-value">R{summary.completed?.toLocaleString() || 0}</span>
                </div>
                <div className="summary-card pending">
                    <span className="summary-label">Pending</span>
                    <span className="summary-value">R{summary.pending?.toLocaleString() || 0}</span>
                </div>
                <div className="summary-card refunded">
                    <span className="summary-label">Refunded</span>
                    <span className="summary-value">R{summary.refunded?.toLocaleString() || 0}</span>
                </div>
            </div>

            {/* Filters */}
            <div className="filters-bar">
                <select
                    value={filters.status}
                    onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                    className="filter-select"
                >
                    <option value="">All Status</option>
                    <option value="completed">Completed</option>
                    <option value="pending">Pending</option>
                    <option value="failed">Failed</option>
                    <option value="refunded">Refunded</option>
                </select>
                <input
                    type="date"
                    value={filters.startDate}
                    onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                    className="filter-date"
                />
                <input
                    type="date"
                    value={filters.endDate}
                    onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                    className="filter-date"
                />
                <button className="filter-btn" onClick={() => fetchPayments()}>Apply</button>
            </div>

            {/* Table */}
            <div className="payments-table-container">
                <table className="payments-table">
                    <thead>
                        <tr>
                            <th>User</th>
                            <th>Amount</th>
                            <th>Currency</th>
                            <th>Status</th>
                            <th>Method</th>
                            <th>Date</th>
                        </tr>
                    </thead>
                    <tbody>
                        {payments.length === 0 ? (
                            <tr>
                                <td colSpan="6" className="no-data">No payments found</td>
                            </tr>
                        ) : (
                            payments.map((payment) => (
                                <tr key={payment.id}>
                                    <td>
                                        <div className="user-cell">
                                            <span>{payment.users?.name || 'Unknown'}</span>
                                            <span className="user-email">{payment.users?.email || 'No email'}</span>
                                        </div>
                                    </td>
                                    <td className="amount">R{payment.amount?.toFixed(2)}</td>
                                    <td>{payment.currency}</td>
                                    <td>{getStatusBadge(payment.status)}</td>
                                    <td>{payment.payment_method || 'N/A'}</td>
                                    <td>{new Date(payment.created_at).toLocaleDateString()}</td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            <div className="pagination">
                <button
                    onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
                    disabled={pagination.page === 1}
                >
                    Previous
                </button>
                <span>Page {pagination.page} of {pagination.totalPages}</span>
                <button
                    onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
                    disabled={pagination.page === pagination.totalPages}
                >
                    Next
                </button>
            </div>
        </div>
    );
};

export default AdminPayments;