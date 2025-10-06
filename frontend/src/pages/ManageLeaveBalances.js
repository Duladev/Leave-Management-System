import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import { hrAPI } from '../services/api';
import '../styles/Dashboard.css';

const ManageLeaveBalances = () => {
    const [users, setUsers] = useState([]);
    const [filteredUsers, setFilteredUsers] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedEmployee, setSelectedEmployee] = useState('');
    const [balances, setBalances] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showEditModal, setShowEditModal] = useState(null);
    const [editFormData, setEditFormData] = useState({
        total_days: '',
        used_days: '',
        available_days: ''
    });

    useEffect(() => {
        fetchUsers();
    }, []);

    useEffect(() => {
        // Filter users based on search term
        if (searchTerm.trim() === '') {
            setFilteredUsers(users);
        } else {
            const filtered = users.filter(user =>
                user.employee_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                user.email.toLowerCase().includes(searchTerm.toLowerCase())
            );
            setFilteredUsers(filtered);
        }
    }, [searchTerm, users]);

    const fetchUsers = async () => {
        try {
            const response = await hrAPI.getAllUsers();
            const employeeList = response.data.users.filter(u => u.user_level === 2 || u.user_level === 3);
            setUsers(employeeList);
            setFilteredUsers(employeeList);
        } catch (error) {
            console.error('Error fetching users:', error);
        }
    };

    const fetchBalances = async (userId) => {
        setLoading(true);
        try {
            const response = await hrAPI.getEmployeeBalances(userId);
            setBalances(response.data.balances);
        } catch (error) {
            console.error('Error fetching balances:', error);
            alert('Failed to fetch leave balances');
        } finally {
            setLoading(false);
        }
    };

    const handleEmployeeChange = (e) => {
        const userId = e.target.value;
        setSelectedEmployee(userId);
        if (userId) {
            fetchBalances(userId);
        } else {
            setBalances([]);
        }
    };

    const handleEditClick = (balance) => {
        setShowEditModal(balance.balance_id);
        setEditFormData({
            total_days: balance.total_days,
            used_days: balance.used_days,
            available_days: balance.available_days
        });
    };

    const handleEditSubmit = async (balanceId) => {
        try {
            await hrAPI.updateLeaveBalance(balanceId, {
                ...editFormData,
                total_days: parseFloat(editFormData.total_days),
                used_days: parseFloat(editFormData.used_days),
                available_days: parseFloat(editFormData.available_days)
            });
            alert('Leave balance updated successfully');
            setShowEditModal(null);
            fetchBalances(selectedEmployee);
        } catch (error) {
            alert('Failed to update balance: ' + (error.response?.data?.message || 'Unknown error'));
        }
    };

    const handleCreateBalances = async () => {
        if (!selectedEmployee) {
            alert('Please select an employee first');
            return;
        }

        if (!window.confirm('This will create default leave balances for all leave types. Continue?')) {
            return;
        }

        try {
            await hrAPI.initializeLeaveBalances(selectedEmployee);
            alert('Leave balances initialized successfully');
            fetchBalances(selectedEmployee);
        } catch (error) {
            alert('Failed to create balances: ' + (error.response?.data?.message || 'Unknown error'));
        }
    };

    const selectedUser = users.find(u => u.user_id === parseInt(selectedEmployee));

    return (
        <div className="dashboard-wrapper">
            <Sidebar />
            <div className="main-content">
                <div className="page-header">
                    <h1 className="page-title">Manage Leave Balances</h1>
                    <p className="page-subtitle">Set and adjust leave balances for employees</p>
                </div>

                <div className="card" style={{ maxWidth: '1200px' }}>
                    {/* Search Box */}
                    <div style={{ marginBottom: '20px' }}>
                        <label style={{ display: 'block', color: 'white', marginBottom: '8px', fontWeight: '500', fontSize: '16px' }}>
                            Search Employee
                        </label>
                        <input
                            type="text"
                            placeholder="Search by Employee ID, Name, or Email..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{
                                width: '100%',
                                maxWidth: '500px',
                                padding: '12px 16px',
                                borderRadius: '8px',
                                border: '1px solid rgba(255,255,255,0.3)',
                                background: 'rgba(255,255,255,0.1)',
                                color: 'white',
                                fontSize: '16px',
                                marginBottom: '10px'
                            }}
                        />
                        {searchTerm && (
                            <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '14px' }}>
                                Found {filteredUsers.length} employee(s)
                            </div>
                        )}
                    </div>

                    {/* Employee Dropdown */}
                    <div style={{ marginBottom: '30px' }}>
                        <label style={{ display: 'block', color: 'white', marginBottom: '10px', fontWeight: '500', fontSize: '18px' }}>
                            Select Employee
                        </label>
                        <select
                            value={selectedEmployee}
                            onChange={handleEmployeeChange}
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
                        >
                            <option value="" style={{ background: '#1a1a2e' }}>
                                {filteredUsers.length === 0 ? 'No employees found' : 'Select an employee...'}
                            </option>
                            {filteredUsers.map(user => (
                                <option key={user.user_id} value={user.user_id} style={{ background: '#1a1a2e' }}>
                                    {user.employee_id} - {user.full_name} ({user.email})
                                </option>
                            ))}
                        </select>
                    </div>

                    {selectedEmployee && selectedUser && (
                        <div style={{
                            background: 'rgba(102, 126, 234, 0.2)',
                            padding: '20px',
                            borderRadius: '12px',
                            marginBottom: '30px',
                            border: '1px solid rgba(102, 126, 234, 0.3)'
                        }}>
                            <h3 style={{ color: 'white', margin: '0 0 10px 0' }}>{selectedUser.full_name}</h3>
                            <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: '14px' }}>
                                <div>Employee ID: {selectedUser.employee_id}</div>
                                <div>Email: {selectedUser.email}</div>
                                <div>Department: {selectedUser.department_name || 'Not assigned'}</div>
                            </div>
                        </div>
                    )}

                    {loading ? (
                        <div style={{ textAlign: 'center', padding: '40px', color: 'white' }}>
                            Loading balances...
                        </div>
                    ) : selectedEmployee && balances.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '40px' }}>
                            <p style={{ color: 'rgba(255,255,255,0.7)', marginBottom: '20px' }}>
                                No leave balances found for this employee
                            </p>
                            <button
                                onClick={handleCreateBalances}
                                className="btn-primary"
                            >
                                Initialize Leave Balances
                            </button>
                        </div>
                    ) : balances.length > 0 && (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
                            {balances.map((balance) => (
                                <div
                                    key={balance.balance_id}
                                    style={{
                                        background: 'rgba(255,255,255,0.05)',
                                        padding: '25px',
                                        borderRadius: '15px',
                                        border: '1px solid rgba(255,255,255,0.1)'
                                    }}
                                >
                                    <h3 style={{ color: 'white', margin: '0 0 20px 0', fontSize: '20px' }}>
                                        {balance.leave_type_name}
                                    </h3>
                                    <div style={{ display: 'grid', gap: '15px' }}>
                                        <div>
                                            <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '13px', marginBottom: '5px' }}>
                                                Total Days
                                            </div>
                                            <div style={{ color: 'white', fontSize: '28px', fontWeight: '700' }}>
                                                {balance.total_days}
                                            </div>
                                        </div>
                                        <div>
                                            <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '13px', marginBottom: '5px' }}>
                                                Used Days
                                            </div>
                                            <div style={{ color: '#fa709a', fontSize: '28px', fontWeight: '700' }}>
                                                {balance.used_days}
                                            </div>
                                        </div>
                                        <div>
                                            <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '13px', marginBottom: '5px' }}>
                                                Available Days
                                            </div>
                                            <div style={{ color: '#43e97b', fontSize: '28px', fontWeight: '700' }}>
                                                {balance.available_days}
                                            </div>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleEditClick(balance)}
                                        style={{
                                            marginTop: '20px',
                                            width: '100%',
                                            padding: '10px',
                                            borderRadius: '8px',
                                            border: 'none',
                                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                            color: 'white',
                                            cursor: 'pointer',
                                            fontWeight: '600'
                                        }}
                                    >
                                        Edit Balance
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Edit Modal */}
                {showEditModal && (
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
                            maxWidth: '400px',
                            border: '1px solid rgba(255,255,255,0.2)'
                        }}>
                            <h2 style={{ color: 'white', marginTop: 0 }}>Edit Leave Balance</h2>

                            <div style={{ marginBottom: '15px' }}>
                                <label style={{ color: 'white', display: 'block', marginBottom: '5px' }}>
                                    Total Days
                                </label>
                                <input
                                    type="number"
                                    step="0.5"
                                    value={editFormData.total_days}
                                    onChange={(e) => setEditFormData({ ...editFormData, total_days: e.target.value })}
                                    style={{
                                        width: '100%',
                                        padding: '10px',
                                        borderRadius: '8px',
                                        border: '1px solid rgba(255,255,255,0.3)',
                                        background: 'rgba(255,255,255,0.1)',
                                        color: 'white'
                                    }}
                                />
                            </div>

                            <div style={{ marginBottom: '15px' }}>
                                <label style={{ color: 'white', display: 'block', marginBottom: '5px' }}>
                                    Used Days
                                </label>
                                <input
                                    type="number"
                                    step="0.5"
                                    value={editFormData.used_days}
                                    onChange={(e) => setEditFormData({ ...editFormData, used_days: e.target.value })}
                                    style={{
                                        width: '100%',
                                        padding: '10px',
                                        borderRadius: '8px',
                                        border: '1px solid rgba(255,255,255,0.3)',
                                        background: 'rgba(255,255,255,0.1)',
                                        color: 'white'
                                    }}
                                />
                            </div>

                            <div style={{ marginBottom: '15px' }}>
                                <label style={{ color: 'white', display: 'block', marginBottom: '5px' }}>
                                    Available Days
                                </label>
                                <input
                                    type="number"
                                    step="0.5"
                                    value={editFormData.available_days}
                                    onChange={(e) => setEditFormData({ ...editFormData, available_days: e.target.value })}
                                    style={{
                                        width: '100%',
                                        padding: '10px',
                                        borderRadius: '8px',
                                        border: '1px solid rgba(255,255,255,0.3)',
                                        background: 'rgba(255,255,255,0.1)',
                                        color: 'white'
                                    }}
                                />
                            </div>

                            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
                                <button
                                    onClick={() => setShowEditModal(null)}
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
                                    onClick={() => handleEditSubmit(showEditModal)}
                                    className="btn-primary"
                                >
                                    Save Changes
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ManageLeaveBalances;