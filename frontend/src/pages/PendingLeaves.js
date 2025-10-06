import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import { managerAPI } from '../services/api';
import '../styles/Dashboard.css';

const PendingLeaves = () => {
    const [leaves, setLeaves] = useState([]);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(null);
    const [rejectReason, setRejectReason] = useState('');
    const [showRejectModal, setShowRejectModal] = useState(null);

    useEffect(() => {
        fetchPendingLeaves();
    }, []);

    const fetchPendingLeaves = async () => {
        try {
            const response = await managerAPI.getPendingLeaves();
            setLeaves(response.data.leaves);
        } catch (error) {
            console.error('Error fetching pending leaves:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (applicationId) => {
        if (!window.confirm('Are you sure you want to approve this leave?')) return;

        setProcessing(applicationId);
        try {
            await managerAPI.approveLeave(applicationId);
            alert('Leave approved successfully');
            fetchPendingLeaves();
        } catch (error) {
            alert('Failed to approve leave: ' + (error.response?.data?.message || 'Unknown error'));
        } finally {
            setProcessing(null);
        }
    };

    const handleReject = async (applicationId) => {
        if (!rejectReason.trim()) {
            alert('Please provide a reason for rejection');
            return;
        }

        setProcessing(applicationId);
        try {
            await managerAPI.rejectLeave(applicationId, rejectReason);
            alert('Leave rejected successfully');
            setShowRejectModal(null);
            setRejectReason('');
            fetchPendingLeaves();
        } catch (error) {
            alert('Failed to reject leave: ' + (error.response?.data?.message || 'Unknown error'));
        } finally {
            setProcessing(null);
        }
    };

    if (loading) {
        return <div className="loading">Loading...</div>;
    }

    return (
        <div className="dashboard-wrapper">
            <Sidebar />
            <div className="main-content">
                <div className="page-header">
                    <h1 className="page-title">Pending Leave Approvals</h1>
                    <p className="page-subtitle">Review and approve team leave requests</p>
                </div>

                {leaves.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-state-icon">📭</div>
                        <div className="empty-state-text">No pending leave requests</div>
                    </div>
                ) : (
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
                                    <th>Reason</th>
                                    <th>Applied On</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {leaves.map((leave) => (
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
                                        <td style={{ maxWidth: '200px' }}>{leave.reason}</td>
                                        <td>{new Date(leave.created_at).toLocaleDateString()}</td>
                                        <td>
                                            <div style={{ display: 'flex', gap: '10px' }}>
                                                <button
                                                    className="btn-approve"
                                                    onClick={() => handleApprove(leave.application_id)}
                                                    disabled={processing === leave.application_id}
                                                >
                                                    {processing === leave.application_id ? '...' : 'Approve'}
                                                </button>
                                                <button
                                                    className="btn-reject"
                                                    onClick={() => setShowRejectModal(leave.application_id)}
                                                    disabled={processing === leave.application_id}
                                                >
                                                    Reject
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Reject Modal */}
                {showRejectModal && (
                    <div style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: 'rgba(0,0,0,0.7)',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        zIndex: 9999
                    }}>
                        <div style={{
                            background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
                            padding: '30px',
                            borderRadius: '20px',
                            width: '90%',
                            maxWidth: '500px',
                            border: '1px solid rgba(255,255,255,0.2)'
                        }}>
                            <h2 style={{ color: 'white', marginTop: 0 }}>Reject Leave Application</h2>
                            <p style={{ color: 'rgba(255,255,255,0.7)' }}>Please provide a reason for rejection:</p>
                            <textarea
                                value={rejectReason}
                                onChange={(e) => setRejectReason(e.target.value)}
                                rows="4"
                                placeholder="Enter rejection reason..."
                                style={{
                                    width: '100%',
                                    padding: '12px',
                                    borderRadius: '8px',
                                    border: '1px solid rgba(255,255,255,0.3)',
                                    background: 'rgba(255,255,255,0.1)',
                                    color: 'white',
                                    fontSize: '16px',
                                    resize: 'vertical',
                                    marginBottom: '20px'
                                }}
                            />
                            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                                <button
                                    onClick={() => {
                                        setShowRejectModal(null);
                                        setRejectReason('');
                                    }}
                                    style={{
                                        padding: '10px 20px',
                                        borderRadius: '8px',
                                        border: 'none',
                                        background: 'rgba(255,255,255,0.1)',
                                        color: 'white',
                                        cursor: 'pointer'
                                    }}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => handleReject(showRejectModal)}
                                    disabled={processing === showRejectModal}
                                    className="btn-reject"
                                >
                                    {processing === showRejectModal ? 'Rejecting...' : 'Confirm Rejection'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PendingLeaves;