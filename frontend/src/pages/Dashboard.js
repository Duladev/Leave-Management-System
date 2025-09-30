import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { employeeAPI, managerAPI, hrAPI } from '../services/api';
import '../styles/Dashboard.css';

const Dashboard = () => {
    const { user, isAuthenticated } = useAuth();
    const [stats, setStats] = useState({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDashboardData();
    }, [user]);

    const fetchDashboardData = async () => {
        try {
            if (user?.user_level === 3) {
                // Employee Dashboard
                const [leaves, balances] = await Promise.all([
                    employeeAPI.getMyLeaves(),
                    employeeAPI.getMyBalances()
                ]);
                setStats({
                    totalLeaves: leaves.data.leaves.length,
                    pendingLeaves: leaves.data.leaves.filter(l => l.status === 'Pending').length,
                    approvedLeaves: leaves.data.leaves.filter(l => l.status === 'Approved').length,
                    availableDays: balances.data.balances.reduce((sum, b) => sum + b.available_days, 0)
                });
            } else if (user?.user_level === 2) {
                // Manager Dashboard
                const [pending, team] = await Promise.all([
                    managerAPI.getPendingLeaves(),
                    managerAPI.getTeamLeaves()
                ]);
                setStats({
                    pendingApprovals: pending.data.leaves.length,
                    totalTeamLeaves: team.data.leaves.length,
                    approvedThisMonth: team.data.leaves.filter(l =>
                        l.status === 'Approved' &&
                        new Date(l.approved_at).getMonth() === new Date().getMonth()
                    ).length
                });
            } else if (user?.user_level === 1) {
                // HR Dashboard
                const [users, leaves] = await Promise.all([
                    hrAPI.getAllUsers(),
                    hrAPI.getAllLeaves()
                ]);
                setStats({
                    totalEmployees: users.data.users.length,
                    totalLeaves: leaves.data.leaves.length,
                    pendingLeaves: leaves.data.leaves.filter(l => l.status === 'Pending').length,
                    approvedLeaves: leaves.data.leaves.filter(l => l.status === 'Approved').length
                });
            }
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    if (!isAuthenticated) {
        return <Navigate to="/login" />;
    }

    if (loading) {
        return <div className="loading">Loading Dashboard...</div>;
    }

    const renderEmployeeDashboard = () => (
        <>
            <div className="page-header">
                <h1 className="page-title">Employee Dashboard</h1>
                <p className="page-subtitle">Welcome back, {user.full_name}</p>
            </div>
            <div className="content-grid">
                <div className="card stat-card">
                    <h3 className="card-title">Available Days</h3>
                    <div className="stat-value">{stats.availableDays || 0}</div>
                    <div className="stat-label">Days Remaining</div>
                </div>
                <div className="card stat-card">
                    <h3 className="card-title">Total Applications</h3>
                    <div className="stat-value">{stats.totalLeaves || 0}</div>
                    <div className="stat-label">All Time</div>
                </div>
                <div className="card stat-card">
                    <h3 className="card-title">Pending</h3>
                    <div className="stat-value">{stats.pendingLeaves || 0}</div>
                    <div className="stat-label">Awaiting Approval</div>
                </div>
                <div className="card stat-card">
                    <h3 className="card-title">Approved</h3>
                    <div className="stat-value">{stats.approvedLeaves || 0}</div>
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
            <div className="content-grid">
                <div className="card stat-card">
                    <h3 className="card-title">Pending Approvals</h3>
                    <div className="stat-value">{stats.pendingApprovals || 0}</div>
                    <div className="stat-label">Requires Action</div>
                </div>
                <div className="card stat-card">
                    <h3 className="card-title">Team Leaves</h3>
                    <div className="stat-value">{stats.totalTeamLeaves || 0}</div>
                    <div className="stat-label">Total</div>
                </div>
                <div className="card stat-card">
                    <h3 className="card-title">Approved This Month</h3>
                    <div className="stat-value">{stats.approvedThisMonth || 0}</div>
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
                    <div className="stat-value">{stats.pendingLeaves || 0}</div>
                    <div className="stat-label">Awaiting Approval</div>
                </div>
                <div className="card stat-card">
                    <h3 className="card-title">Approved</h3>
                    <div className="stat-value">{stats.approvedLeaves || 0}</div>
                    <div className="stat-label">Total Approved</div>
                </div>
            </div>
        </>
    );

    return (
        <div className="dashboard-wrapper">
            <Sidebar />
            <div className="main-content">
                {user.user_level === 3 && renderEmployeeDashboard()}
                {user.user_level === 2 && renderManagerDashboard()}
                {user.user_level === 1 && renderHRDashboard()}
            </div>
        </div>
    );
};

export default Dashboard;