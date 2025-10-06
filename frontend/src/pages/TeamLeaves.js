import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import { managerAPI } from '../services/api';
import '../styles/Dashboard.css';

const TeamLeaves = () => {
    const [leaves, setLeaves] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('All');

    useEffect(() => {
        fetchTeamLeaves();
    }, []);

    const fetchTeamLeaves = async () => {
        try {
            const response = await managerAPI.getTeamLeaves();
            setLeaves(response.data.leaves);
        } catch (error) {
            console.error('Error fetching team leaves:', error);
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

    const stats = {
        total: leaves.length,
        pending: leaves.filter(l => l.status === 'Pending').length,
        approved: leaves.filter(l => l.status === 'Approved').length,
        rejected: leaves.filter(l => l.status === 'Rejected').length
    };

    if (loading) {
        return <div className="loading">Loading...</div>;
    }

    return (
        <div className="dashboard-wrapper">
            <Sidebar />
            <div className="main-content">
                <div className="page-header">
                    <h1 className="page-title">Team Leaves</h1>
                    <p className="page-subtitle">View all leave applications from your team</p>
                </div>

                {/* Statistics */}
                <div className="content-grid" style={{ marginBottom: '30px' }}>
                    <div className="card stat-card">
                        <h3 className="card-title">Total Applications</h3>
                        <div className="stat-value">{stats.total}</div>
                    </div>
                    <div className="card stat-card">
                        <h3 className="card-title">Pending</h3>
                        <div className="stat-value" style={{ color: '#f6d365' }}>{stats.pending}</div>
                    </div>
                    <div className="card stat-card">
                        <h3 className="card-title">Approved</h3>
                        <div className="stat-value" style={{ color: '#43e97b' }}>{stats.approved}</div>
                    </div>
                    <div className="card stat-card">
                        <h3 className="card-title">Rejected</h3>
                        <div className="stat-value" style={{ color: '#fa709a' }}>{stats.rejected}</div>
                    </div>
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
                                <th>Employee</th>
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
                                    <td colSpan="9" style={{ textAlign: 'center', padding: '40px' }}>
                                        No leave applications found
                                    </td>
                                </tr>
                            ) : (
                                filteredLeaves.map((leave) => (
                                    <tr key={leave.application_id}>
                                        <td>
                                            <div style={{ fontWeight: '600' }}>{leave.employee_name}</div>
                                            <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)' }}>
                                                {leave.employee_email}
                                            </div>
                                        </td>
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

export default TeamLeaves;