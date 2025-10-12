import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { employeeAPI, managerAPI, hrAPI } from '../services/api';
import '../styles/Dashboard.css';

const Dashboard = () => {
    const { user, isAuthenticated } = useAuth();
    const [stats, setStats] = useState({});
    const [balances, setBalances] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (user) {
            fetchDashboardData();
        }
    }, [user]);

    const fetchDashboardData = async () => {
        setLoading(true);
        setError('');

        try {
            console.log('Fetching dashboard data for user level:', user?.user_level);

            if (user?.user_level === 3) {
                // Employee Dashboard
                console.log('Fetching employee data...');

                try {
                    const leavesRes = await employeeAPI.getMyLeaves();
                    console.log('Leaves response:', leavesRes.data);

                    const balancesRes = await employeeAPI.getMyBalances();
                    console.log('Balances response:', balancesRes.data);

                    setBalances(balancesRes.data.balances || []);
                    setStats({
                        totalLeaves: leavesRes.data.leaves?.length || 0,
                        pendingLeaves: leavesRes.data.leaves?.filter(l => l.status === 'Pending').length || 0,
                        approvedLeaves: leavesRes.data.leaves?.filter(l => l.status === 'Approved').length || 0,
                        availableDays: (balancesRes.data.balances || []).reduce((sum, b) => sum + parseFloat(b.available_days || 0), 0)
                    });
                } catch (err) {
                    console.error('Error fetching employee data:', err);
                    throw err;
                }

            } else if (user?.user_level === 2) {
                // Manager Dashboard
                console.log('Fetching manager data...');

                try {
                    const pendingRes = await managerAPI.getPendingLeaves();
                    console.log('Pending leaves response:', pendingRes.data);

                    const teamRes = await managerAPI.getTeamLeaves();
                    console.log('Team leaves response:', teamRes.data);

                    const balancesRes = await employeeAPI.getMyBalances();
                    console.log('Manager balances response:', balancesRes.data);

                    setBalances(balancesRes.data.balances || []);
                    setStats({
                        pendingApprovals: pendingRes.data.leaves?.length || 0,
                        totalTeamLeaves: teamRes.data.leaves?.length || 0,
                        approvedThisMonth: (teamRes.data.leaves || []).filter(l =>
                            l.status === 'Approved' &&
                            l.approved_at &&
                            new Date(l.approved_at).getMonth() === new Date().getMonth()
                        ).length,
                        myAvailableDays: (balancesRes.data.balances || []).reduce((sum, b) => sum + parseFloat(b.available_days || 0), 0)
                    });
                } catch (err) {
                    console.error('Error fetching manager data:', err);
                    throw err;
                }

            } else if (user?.user_level === 1) {
                // HR Dashboard
                console.log('Fetching HR data...');

                try {
                    const usersRes = await hrAPI.getAllUsers();
                    console.log('Users response:', usersRes.data);

                    const leavesRes = await hrAPI.getAllLeaves();
                    console.log('All leaves response:', leavesRes.data);

                    setStats({
                        totalEmployees: usersRes.data.users?.length || 0,
                        totalLeaves: leavesRes.data.leaves?.length || 0,
                        pendingLeaves: leavesRes.data.leaves?.filter(l => l.status === 'Pending').length || 0,
                        approvedLeaves: leavesRes.data.leaves?.filter(l => l.status === 'Approved').length || 0
                    });
                } catch (err) {
                    console.error('Error fetching HR data:', err);
                    throw err;
                }
            }
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
            setError(error.response?.data?.message || error.message || 'Failed to load dashboard data');
        } finally {
            setLoading(false);
        }
    };

    if (!isAuthenticated) {
        return <Navigate to="/login" />;
    }

    if (loading) {
        return (
            <div className="dashboard-wrapper">
                <Sidebar />
                <div className="main-content">
                    <div className="loading">Loading Dashboard...</div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="dashboard-wrapper">
                <Sidebar />
                <div className="main-content">
                    <div className="card" style={{ maxWidth: '600px' }}>
                        <h3 style={{ color: '#fa709a', marginBottom: '15px' }}>⚠️ Error Loading Dashboard</h3>
                        <p style={{ color: 'white', marginBottom: '20px' }}>{error}</p>
                        <button
                            onClick={fetchDashboardData}
                            className="btn-primary"
                        >
                            Retry
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    const renderEmployeeDashboard = () => (
        <>
            <div className="page-header">
                <h1 className="page-title">Employee Dashboard</h1>
                <p className="page-subtitle">Welcome back, {user.full_name}</p>
            </div>

            {/* Leave Balances Cards */}
            {balances.length > 0 && (
                <div style={{ marginBottom: '30px' }}>
                    <h2 style={{ color: 'white', marginBottom: '20px', fontSize: '24px' }}>Your Leave Balances</h2>
                    <div className="content-grid">
                        {balances.map((balance) => (
                            <div key={balance.balance_id} className="card">
                                <h3 className="card-title">{balance.leave_type_name}</h3>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px', marginTop: '20px' }}>
                                    <div>
                                        <div style={{ fontSize: '28px', fontWeight: '700', color: 'white' }}>
                                            {balance.total_days}
                                        </div>
                                        <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)' }}>Total</div>
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '28px', fontWeight: '700', color: '#fa709a' }}>
                                            {balance.used_days}
                                        </div>
                                        <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)' }}>Used</div>
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '28px', fontWeight: '700', color: '#43e97b' }}>
                                            {balance.available_days}
                                        </div>
                                        <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)' }}>Available</div>
                                    </div>
                                </div>
                                <div style={{
                                    marginTop: '15px',
                                    padding: '10px',
                                    background: 'rgba(255,255,255,0.05)',
                                    borderRadius: '8px',
                                    textAlign: 'center'
                                }}>
                                    <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)' }}>
                                        {balance.available_days > 0 ? (
                                            <span style={{ color: '#43e97b' }}>✓ You can apply for this leave</span>
                                        ) : (
                                            <span style={{ color: '#fa709a' }}>⚠ No balance remaining</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Statistics */}
            <h2 style={{ color: 'white', marginBottom: '20px', fontSize: '24px' }}>Leave Statistics</h2>
            <div className="content-grid">
                <div className="card stat-card">
                    <h3 className="card-title">Total Applications</h3>
                    <div className="stat-value">{stats.totalLeaves || 0}</div>
                    <div className="stat-label">All Time</div>
                </div>
                <div className="card stat-card">
                    <h3 className="card-title">Pending</h3>
                    <div className="stat-value" style={{ color: '#f6d365' }}>{stats.pendingLeaves || 0}</div>
                    <div className="stat-label">Awaiting Approval</div>
                </div>
                <div className="card stat-card">
                    <h3 className="card-title">Approved</h3>
                    <div className="stat-value" style={{ color: '#43e97b' }}>{stats.approvedLeaves || 0}</div>
                    <div className="stat-label">This Year</div>
                </div>
            </div>
        </>
    );

    const renderManagerDashboard = () => (
        <>
            <div className="page-header">
                <h1 className="page-title">Manager Dashboard</h1>
                <p className="page-subtitle">Manage your team's leave requests</p>
            </div>

            {/* Manager's Own Leave Balances */}
            {balances.length > 0 && (
                <div style={{ marginBottom: '30px' }}>
                    <h2 style={{ color: 'white', marginBottom: '20px', fontSize: '24px' }}>Your Leave Balances</h2>
                    <div className="content-grid">
                        {balances.map((balance) => (
                            <div key={balance.balance_id} className="card">
                                <h3 className="card-title">{balance.leave_type_name}</h3>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px', marginTop: '20px' }}>
                                    <div>
                                        <div style={{ fontSize: '28px', fontWeight: '700', color: 'white' }}>
                                            {balance.total_days}
                                        </div>
                                        <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)' }}>Total</div>
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '28px', fontWeight: '700', color: '#fa709a' }}>
                                            {balance.used_days}
                                        </div>
                                        <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)' }}>Used</div>
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '28px', fontWeight: '700', color: '#43e97b' }}>
                                            {balance.available_days}
                                        </div>
                                        <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)' }}>Available</div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Team Statistics */}
            <h2 style={{ color: 'white', marginBottom: '20px', fontSize: '24px' }}>Team Overview</h2>
            <div className="content-grid">
                <div className="card stat-card">
                    <h3 className="card-title">Pending Approvals</h3>
                    <div className="stat-value" style={{ color: '#f6d365' }}>{stats.pendingApprovals || 0}</div>
                    <div className="stat-label">Requires Action</div>
                </div>
                <div className="card stat-card">
                    <h3 className="card-title">Team Leaves</h3>
                    <div className="stat-value">{stats.totalTeamLeaves || 0}</div>
                    <div className="stat-label">Total</div>
                </div>
                <div className="card stat-card">
                    <h3 className="card-title">Approved This Month</h3>
                    <div className="stat-value" style={{ color: '#43e97b' }}>{stats.approvedThisMonth || 0}</div>
                    <div className="stat-label">Current Month</div>
                </div>
            </div>
        </>
    );

    const renderHRDashboard = () => (
        <>
            <div className="page-header">
                <h1 className="page-title">HR Dashboard</h1>
                <p className="page-subtitle">Complete system overview</p>
            </div>
            <div className="content-grid">
                <div className="card stat-card">
                    <h3 className="card-title">Total Employees</h3>
                    <div className="stat-value">{stats.totalEmployees || 0}</div>
                    <div className="stat-label">Active Users</div>
                </div>
                <div className="card stat-card">
                    <h3 className="card-title">Total Leaves</h3>
                    <div className="stat-value">{stats.totalLeaves || 0}</div>
                    <div className="stat-label">All Applications</div>
                </div>
                <div className="card stat-card">
                    <h3 className="card-title">Pending</h3>
                    <div className="stat-value" style={{ color: '#f6d365' }}>{stats.pendingLeaves || 0}</div>
                    <div className="stat-label">Awaiting Approval</div>
                </div>
                <div className="card stat-card">
                    <h3 className="card-title">Approved</h3>
                    <div className="stat-value" style={{ color: '#43e97b' }}>{stats.approvedLeaves || 0}</div>
                    <div className="stat-label">Total Approved</div>
                </div>
            </div>
        </>
    );

    return (
        <div className="dashboard-wrapper">
            <Sidebar />
            <div className="main-content">
                {user?.user_level === 3 && renderEmployeeDashboard()}
                {user?.user_level === 2 && renderManagerDashboard()}
                {user?.user_level === 1 && renderHRDashboard()}
            </div>
        </div>
    );
};

export default Dashboard;