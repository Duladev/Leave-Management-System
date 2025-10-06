import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import { employeeAPI } from '../services/api';
import '../styles/Dashboard.css';

const MyLeaves = () => {
    const [leaves, setLeaves] = useState([]);
    const [balances, setBalances] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('All');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [leavesRes, balancesRes] = await Promise.all([
                employeeAPI.getMyLeaves(),
                employeeAPI.getMyBalances()
            ]);
            setLeaves(leavesRes.data.leaves);
            setBalances(balancesRes.data.balances);
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const getStatusClass = (status) => {
        return `status-badge status-${status.toLowerCase()}`;
    };

    const filteredLeaves = filter === 'All'
        ? leaves
        : leaves.filter(leave => leave.status === filter);

    if (loading) {
        return <div className="loading">Loading...</div>;
    }

    return (
        <div className="dashboard-wrapper">
            <Sidebar />
            <div className="main-content">
                <div className="page-header">
                    <h1 className="page-title">My Leaves</h1>
                    <p className="page-subtitle">View your leave applications and balances</p>
                </div>

                {/* Leave Balances */}
                <div className="content-grid" style={{ marginBottom: '30px' }}>
                    {balances.map((balance) => (
                        <div key={balance.balance_id} className="card">
                            <h3 className="card-title">{balance.leave_type_name}</h3>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px', marginTop: '20px' }}>
                                <div>
                                    <div style={{ fontSize: '32px', fontWeight: '700', color: 'white' }}>
                                        {balance.total_days}
                                    </div>
                                    <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.7)' }}>Total</div>
                                </div>
                                <div>
                                    <div style={{ fontSize: '32px', fontWeight: '700', color: '#fa709a' }}>
                                        {balance.used_days}
                                    </div>
                                    <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.7)' }}>Used</div>
                                </div>
                                <div>
                                    <div style={{ fontSize: '32px', fontWeight: '700', color: '#43e97b' }}>
                                        {balance.available_days}
                                    </div>
                                    <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.7)' }}>Available</div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Filter Buttons */}
                <div style={{ marginBottom: '20px', display: 'flex', gap: '10px' }}>
                    {['All', 'Pending', 'Approved', 'Rejected'].map(status => (
                        <button
                            key={status}
                            onClick={() => setFilter(status)}
                            style={{
                                padding: '10px 20px',
                                borderRadius: '8px',
                                border: 'none',
                                background: filter === status
                                    ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                                    : 'rgba(255,255,255,0.1)',
                                color: 'white',
                                cursor: 'pointer',
                                fontWeight: '600'
                            }}
                        >
                            {status}
                        </button>
                    ))}
                </div>

                {/* Leave Applications Table */}
                <div className="table-container">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Leave Type</th>
                                <th>Category</th>
                                <th>Start Date</th>
                                <th>End Date</th>
                                <th>Days</th>
                                <th>Status</th>
                                <th>Reason</th>
                                <th>Applied On</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredLeaves.length === 0 ? (
                                <tr>
                                    <td colSpan="8" style={{ textAlign: 'center', padding: '40px' }}>
                                        No leave applications found
                                    </td>
                                </tr>
                            ) : (
                                filteredLeaves.map((leave) => (
                                    <tr key={leave.application_id}>
                                        <td>{leave.leave_type_name}</td>
                                        <td>{leave.leave_category}</td>
                                        <td>{new Date(leave.start_date).toLocaleDateString()}</td>
                                        <td>{leave.end_date ? new Date(leave.end_date).toLocaleDateString() : '-'}</td>
                                        <td>{leave.total_days}</td>
                                        <td>
                                            <span className={getStatusClass(leave.status)}>
                                                {leave.status}
                                            </span>
                                        </td>
                                        <td style={{ maxWidth: '200px' }}>{leave.reason}</td>
                                        <td>{new Date(leave.created_at).toLocaleDateString()}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default MyLeaves;