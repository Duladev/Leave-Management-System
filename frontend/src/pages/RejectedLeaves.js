import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import { hrAPI, managerAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import '../styles/Dashboard.css';

const RejectedLeaves = () => {
    const { user } = useAuth();
    const [leaves, setLeaves] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchRejectedLeaves();
    }, []);

    const fetchRejectedLeaves = async () => {
        try {
            let response;
            if (user.user_level === 1) {
                // HR sees all rejected leaves
                response = await hrAPI.getAllLeaves();
                setLeaves(response.data.leaves.filter(l => l.status === 'Rejected'));
            } else if (user.user_level === 2) {
                // Manager sees their team's rejected leaves
                response = await managerAPI.getTeamLeaves();
                setLeaves(response.data.leaves.filter(l => l.status === 'Rejected'));
            }
        } catch (error) {
            console.error('Error fetching rejected leaves:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredLeaves = leaves.filter(leave =>
        leave.employee_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        leave.employee_email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) {
        return <div className="loading">Loading...</div>;
    }

    return (
        <div className="dashboard-wrapper">
            <Sidebar />
            <div className="main-content">
                <div className="page-header">
                    <h1 className="page-title">Rejected Leave Applications</h1>
                    <p className="page-subtitle">View all rejected leave requests</p>
                </div>

                <div style={{ marginBottom: '20px' }}>
                    <input
                        type="text"
                        placeholder="Search by employee name or email..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{
                            width: '100%',
                            maxWidth: '500px',
                            padding: '12px',
                            borderRadius: '8px',
                            border: '1px solid rgba(255,255,255,0.3)',
                            background: 'rgba(255,255,255,0.1)',
                            color: 'white',
                            fontSize: '16px'
                        }}
                    />
                </div>

                {filteredLeaves.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-state-icon">✓</div>
                        <div className="empty-state-text">No rejected leave applications</div>
                    </div>
                ) : (
                    <div className="table-container">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Employee</th>
                                    <th>Leave Type</th>
                                    <th>Category</th>
                                    <th>Start Date</th>
                                    <th>End Date</th>
                                    <th>Days</th>
                                    <th>Reason</th>
                                    <th>Rejection Reason</th>
                                    <th>Rejected By</th>
                                    <th>Rejected On</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredLeaves.map((leave) => (
                                    <tr key={leave.application_id}>
                                        <td>{leave.application_id}</td>
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
                                        <td style={{ maxWidth: '150px' }}>{leave.reason}</td>
                                        <td style={{ maxWidth: '200px' }}>
                                            <div style={{
                                                background: 'rgba(250, 112, 154, 0.2)',
                                                padding: '8px',
                                                borderRadius: '8px',
                                                border: '1px solid rgba(250, 112, 154, 0.3)'
                                            }}>
                                                {leave.rejection_reason}
                                            </div>
                                        </td>
                                        <td>{leave.approver_name || '-'}</td>
                                        <td>{leave.approved_at ? new Date(leave.approved_at).toLocaleDateString() : '-'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default RejectedLeaves;