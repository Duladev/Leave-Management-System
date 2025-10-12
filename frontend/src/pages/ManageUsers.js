import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import { hrAPI } from '../services/api';
import '../styles/Dashboard.css';

const ManageUsers = () => {
    const [users, setUsers] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showAssignModal, setShowAssignModal] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterLevel, setFilterLevel] = useState('All'); // All, Managers, Employees
    const [formData, setFormData] = useState({
        employee_id: '',
        email: '',
        password: '',
        full_name: '',
        user_level: '3',
        manager_id: '',
        department_id: ''
    });
    const [assignManagerId, setAssignManagerId] = useState('');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [usersRes, deptsRes] = await Promise.all([
                hrAPI.getAllUsers(),
                hrAPI.getDepartments()
            ]);
            setUsers(usersRes.data.users);
            setDepartments(deptsRes.data.departments);
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateUser = async (e) => {
        e.preventDefault();
        try {
            await hrAPI.createUser({
                ...formData,
                user_level: parseInt(formData.user_level),
                manager_id: formData.manager_id ? parseInt(formData.manager_id) : null,
                department_id: formData.department_id ? parseInt(formData.department_id) : null
            });
            alert('User created successfully');
            setShowCreateModal(false);
            setFormData({
                employee_id: '',
                email: '',
                password: '',
                full_name: '',
                user_level: '3',
                manager_id: '',
                department_id: ''
            });
            fetchData();
        } catch (error) {
            alert('Failed to create user: ' + (error.response?.data?.message || 'Unknown error'));
        }
    };

    const handleAssignManager = async (userId) => {
        if (!assignManagerId) {
            alert('Please select a manager');
            return;
        }
        try {
            await hrAPI.assignManager(userId, parseInt(assignManagerId));
            alert('Manager assigned successfully');
            setShowAssignModal(null);
            setAssignManagerId('');
            fetchData();
        } catch (error) {
            alert('Failed to assign manager: ' + (error.response?.data?.message || 'Unknown error'));
        }
    };

    const getLevelBadge = (level) => {
        const levels = {
            1: { name: 'HR Admin', class: 'level-1' },
            2: { name: 'Manager', class: 'level-2' },
            3: { name: 'Employee', class: 'level-3' }
        };
        return levels[level] || { name: 'Unknown', class: '' };
    };

    const managers = users.filter(u => u.user_level === 2);

    const filteredUsers = users
        .filter(user => {
            // Filter by level
            if (filterLevel === 'Managers' && user.user_level !== 2) return false;
            if (filterLevel === 'Employees' && user.user_level !== 3) return false;

            // Filter by search term
            if (searchTerm) {
                return (
                    user.employee_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    user.email.toLowerCase().includes(searchTerm.toLowerCase())
                );
            }
            return true;
        });

    if (loading) {
        return <div className="loading">Loading...</div>;
    }

    return (
        <div className="dashboard-wrapper">
            <Sidebar />
            <div className="main-content">
                <div className="page-header">
                    <h1 className="page-title">Manage Users</h1>
                    <button
                        className="btn-primary"
                        onClick={() => setShowCreateModal(true)}
                    >
                        Create New User
                    </button>
                </div>

                {/* Search and Filter */}
                <div style={{ marginBottom: '20px', display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
                    <input
                        type="text"
                        placeholder="Search by Employee ID, Name or Email..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{
                            flex: '1',
                            minWidth: '300px',
                            padding: '12px',
                            borderRadius: '8px',
                            border: '1px solid rgba(255,255,255,0.3)',
                            background: 'rgba(255,255,255,0.1)',
                            color: 'white',
                            fontSize: '16px'
                        }}
                    />
                    <div style={{ display: 'flex', gap: '10px' }}>
                        {['All', 'Managers', 'Employees'].map(filter => (
                            <button
                                key={filter}
                                onClick={() => setFilterLevel(filter)}
                                style={{
                                    padding: '12px 24px',
                                    borderRadius: '8px',
                                    border: 'none',
                                    background: filterLevel === filter
                                        ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                                        : 'rgba(255,255,255,0.1)',
                                    color: 'white',
                                    cursor: 'pointer',
                                    fontWeight: '600'
                                }}
                            >
                                {filter}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Statistics */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginBottom: '30px' }}>
                    <div className="card stat-card">
                        <div className="stat-value">{users.filter(u => u.user_level === 1).length}</div>
                        <div className="stat-label">HR Admins</div>
                    </div>
                    <div className="card stat-card">
                        <div className="stat-value">{users.filter(u => u.user_level === 2).length}</div>
                        <div className="stat-label">Managers</div>
                    </div>
                    <div className="card stat-card">
                        <div className="stat-value">{users.filter(u => u.user_level === 3).length}</div>
                        <div className="stat-label">Employees</div>
                    </div>
                    <div className="card stat-card">
                        <div className="stat-value">{filteredUsers.length}</div>
                        <div className="stat-label">Showing</div>
                    </div>
                </div>

                <div className="table-container">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Employee ID</th>
                                <th>Name</th>
                                <th>Email</th>
                                <th>Level</th>
                                <th>Department</th>
                                <th>Manager</th>
                                <th>Created At</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredUsers.length === 0 ? (
                                <tr>
                                    <td colSpan="8" style={{ textAlign: 'center', padding: '40px' }}>
                                        No users found
                                    </td>
                                </tr>
                            ) : (
                                filteredUsers.map((user) => {
                                    const levelInfo = getLevelBadge(user.user_level);
                                    return (
                                        <tr key={user.user_id}>
                                            <td style={{ fontWeight: '600', color: '#4facfe' }}>{user.employee_id}</td>
                                            <td style={{ fontWeight: '600' }}>{user.full_name}</td>
                                            <td>{user.email}</td>
                                            <td>
                                                <span className={`user-role ${levelInfo.class}`}>
                                                    {levelInfo.name}
                                                </span>
                                            </td>
                                            <td>
                                                {user.department_name ? (
                                                    <div>
                                                        <div>{user.department_name}</div>
                                                        <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)' }}>
                                                            {user.department_code}
                                                        </div>
                                                    </div>
                                                ) : '-'}
                                            </td>
                                            <td>
                                                {user.manager_name ? (
                                                    <div>
                                                        <div>{user.manager_name}</div>
                                                        <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)' }}>
                                                            {user.manager_employee_id}
                                                        </div>
                                                    </div>
                                                ) : user.user_level === 3 ? (
                                                    <span style={{ color: '#fa709a' }}>Not Assigned</span>
                                                ) : '-'}
                                            </td>
                                            <td>{new Date(user.created_at).toLocaleDateString()}</td>
                                            <td>
                                                {user.user_level === 3 && (
                                                    <button
                                                        onClick={() => {
                                                            setShowAssignModal(user.user_id);
                                                            setAssignManagerId(user.manager_id || '');
                                                        }}
                                                        style={{
                                                            padding: '6px 12px',
                                                            borderRadius: '6px',
                                                            border: 'none',
                                                            background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                                                            color: 'white',
                                                            cursor: 'pointer',
                                                            fontSize: '13px',
                                                            fontWeight: '600'
                                                        }}
                                                    >
                                                        {user.manager_id ? 'Change Manager' : 'Assign Manager'}
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Create User Modal */}
                {showCreateModal && (
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
                            border: '1px solid rgba(255,255,255,0.2)',
                            maxHeight: '90vh',
                            overflowY: 'auto'
                        }}>
                            <h2 style={{ color: 'white', marginTop: 0 }}>Create New User</h2>
                            <form onSubmit={handleCreateUser}>
                                <div style={{ marginBottom: '15px' }}>
                                    <label style={{ color: 'white', display: 'block', marginBottom: '5px' }}>
                                        Employee ID (Optional - Auto-generated if empty)
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.employee_id}
                                        onChange={(e) => setFormData({ ...formData, employee_id: e.target.value })}
                                        placeholder="e.g., EMP00123"
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
                                    <label style={{ color: 'white', display: 'block', marginBottom: '5px' }}>Full Name</label>
                                    <input
                                        type="text"
                                        value={formData.full_name}
                                        onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                                        required
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
                                    <label style={{ color: 'white', display: 'block', marginBottom: '5px' }}>Email</label>
                                    <input
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        required
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
                                    <label style={{ color: 'white', display: 'block', marginBottom: '5px' }}>Password</label>
                                    <input
                                        type="password"
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                        required
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
                                    <label style={{ color: 'white', display: 'block', marginBottom: '5px' }}>User Level</label>
                                    <select
                                        value={formData.user_level}
                                        onChange={(e) => setFormData({ ...formData, user_level: e.target.value, department_id: '', manager_id: '' })}
                                        required
                                        style={{
                                            width: '100%',
                                            padding: '10px',
                                            borderRadius: '8px',
                                            border: '1px solid rgba(255,255,255,0.3)',
                                            background: 'rgba(255,255,255,0.1)',
                                            color: 'white'
                                        }}
                                    >
                                        <option value="1" style={{ background: '#1a1a2e' }}>Level 1 - HR Admin</option>
                                        <option value="2" style={{ background: '#1a1a2e' }}>Level 2 - Manager</option>
                                        <option value="3" style={{ background: '#1a1a2e' }}>Level 3 - Employee</option>
                                    </select>
                                </div>

                                {formData.user_level === '2' && (
                                    <div style={{ marginBottom: '15px' }}>
                                        <label style={{ color: 'white', display: 'block', marginBottom: '5px' }}>
                                            Department <span style={{ color: '#fa709a' }}>*</span>
                                        </label>
                                        <select
                                            value={formData.department_id}
                                            onChange={(e) => setFormData({ ...formData, department_id: e.target.value })}
                                            required
                                            style={{
                                                width: '100%',
                                                padding: '10px',
                                                borderRadius: '8px',
                                                border: '1px solid rgba(255,255,255,0.3)',
                                                background: 'rgba(255,255,255,0.1)',
                                                color: 'white'
                                            }}
                                        >
                                            <option value="" style={{ background: '#1a1a2e' }}>Select Department</option>
                                            {departments.map(dept => (
                                                <option key={dept.department_id} value={dept.department_id} style={{ background: '#1a1a2e' }}>
                                                    {dept.department_code} - {dept.department_name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                )}

                                {formData.user_level === '3' && (
                                    <>
                                        <div style={{ marginBottom: '15px' }}>
                                            <label style={{ color: 'white', display: 'block', marginBottom: '5px' }}>
                                                Department (Optional)
                                            </label>
                                            <select
                                                value={formData.department_id}
                                                onChange={(e) => setFormData({ ...formData, department_id: e.target.value })}
                                                style={{
                                                    width: '100%',
                                                    padding: '10px',
                                                    borderRadius: '8px',
                                                    border: '1px solid rgba(255,255,255,0.3)',
                                                    background: 'rgba(255,255,255,0.1)',
                                                    color: 'white'
                                                }}
                                            >
                                                <option value="" style={{ background: '#1a1a2e' }}>No Department</option>
                                                {departments.map(dept => (
                                                    <option key={dept.department_id} value={dept.department_id} style={{ background: '#1a1a2e' }}>
                                                        {dept.department_code} - {dept.department_name}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <div style={{ marginBottom: '15px' }}>
                                            <label style={{ color: 'white', display: 'block', marginBottom: '5px' }}>
                                                Manager <span style={{ color: '#fa709a' }}>*</span>
                                            </label>
                                            <select
                                                value={formData.manager_id}
                                                onChange={(e) => setFormData({ ...formData, manager_id: e.target.value })}
                                                style={{
                                                    width: '100%',
                                                    padding: '10px',
                                                    borderRadius: '8px',
                                                    border: '1px solid rgba(255,255,255,0.3)',
                                                    background: 'rgba(255,255,255,0.1)',
                                                    color: 'white'
                                                }}
                                            >
                                                <option value="" style={{ background: '#1a1a2e' }}>Select Manager</option>
                                                {managers.map(m => (
                                                    <option key={m.user_id} value={m.user_id} style={{ background: '#1a1a2e' }}>
                                                        {m.employee_id} - {m.full_name} ({m.department_name || 'No Dept'})
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    </>
                                )}

                                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
                                    <button
                                        type="button"
                                        onClick={() => setShowCreateModal(false)}
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
                                    <button type="submit" className="btn-primary">
                                        Create User
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
                {showAssignModal && (
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
                            <h2 style={{ color: 'white', marginTop: 0 }}>Assign Manager</h2>
                            <div style={{ marginBottom: '20px' }}>
                                <label style={{ color: 'white', display: 'block', marginBottom: '10px' }}>Select Manager</label>
                                <select
                                    value={assignManagerId}
                                    onChange={(e) => setAssignManagerId(e.target.value)}
                                    style={{
                                        width: '100%',
                                        padding: '10px',
                                        borderRadius: '8px',
                                        border: '1px solid rgba(255,255,255,0.3)',
                                        background: 'rgba(255,255,255,0.1)',
                                        color: 'white'
                                    }}
                                >
                                    <option value="" style={{ background: '#1a1a2e' }}>Select a manager</option>
                                    {managers.map(m => (
                                        <option key={m.user_id} value={m.user_id} style={{ background: '#1a1a2e' }}>
                                            {m.employee_id} - {m.full_name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                                <button
                                    onClick={() => {
                                        setShowAssignModal(null);
                                        setAssignManagerId('');
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
                                    onClick={() => handleAssignManager(showAssignModal)}
                                    className="btn-primary"
                                >
                                    Assign
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ManageUsers;