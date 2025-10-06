import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import { hrAPI } from '../services/api';
import '../styles/Dashboard.css';

const ManageDepartments = () => {
    const [departments, setDepartments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [formData, setFormData] = useState({
        department_name: '',
        department_code: '',
        description: ''
    });

    useEffect(() => {
        fetchDepartments();
    }, []);

    const fetchDepartments = async () => {
        try {
            const response = await hrAPI.getDepartments();
            setDepartments(response.data.departments);
        } catch (error) {
            console.error('Error fetching departments:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateDepartment = async (e) => {
        e.preventDefault();
        try {
            await hrAPI.createDepartment(formData);
            alert('Department created successfully');
            setShowCreateModal(false);
            setFormData({
                department_name: '',
                department_code: '',
                description: ''
            });
            fetchDepartments();
        } catch (error) {
            alert('Failed to create department: ' + (error.response?.data?.message || 'Unknown error'));
        }
    };

    const handleDeleteDepartment = async (departmentId) => {
        if (!window.confirm('Are you sure you want to delete this department?')) return;

        try {
            await hrAPI.deleteDepartment(departmentId);
            alert('Department deleted successfully');
            fetchDepartments();
        } catch (error) {
            alert('Failed to delete department: ' + (error.response?.data?.message || 'Unknown error'));
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
                    <h1 className="page-title">Manage Departments</h1>
                    <button
                        className="btn-primary"
                        onClick={() => setShowCreateModal(true)}
                    >
                        Add New Department
                    </button>
                </div>

                <div className="content-grid">
                    {departments.map((dept) => (
                        <div key={dept.department_id} className="card">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div>
                                    <h3 className="card-title">{dept.department_name}</h3>
                                    <div style={{
                                        display: 'inline-block',
                                        padding: '4px 12px',
                                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                        borderRadius: '12px',
                                        fontSize: '14px',
                                        fontWeight: '600',
                                        marginBottom: '15px'
                                    }}>
                                        {dept.department_code}
                                    </div>
                                    <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '14px', margin: '10px 0' }}>
                                        {dept.description || 'No description'}
                                    </p>
                                    <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px' }}>
                                        Created: {new Date(dept.created_at).toLocaleDateString()}
                                    </p>
                                </div>
                                <button
                                    onClick={() => handleDeleteDepartment(dept.department_id)}
                                    className="btn-reject"
                                    style={{ padding: '6px 12px', fontSize: '12px' }}
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Create Department Modal */}
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
                            border: '1px solid rgba(255,255,255,0.2)'
                        }}>
                            <h2 style={{ color: 'white', marginTop: 0 }}>Add New Department</h2>
                            <form onSubmit={handleCreateDepartment}>
                                <div style={{ marginBottom: '15px' }}>
                                    <label style={{ color: 'white', display: 'block', marginBottom: '5px' }}>
                                        Department Name
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.department_name}
                                        onChange={(e) => setFormData({ ...formData, department_name: e.target.value })}
                                        required
                                        placeholder="e.g., Human Resources"
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
                                        Department Code
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.department_code}
                                        onChange={(e) => setFormData({ ...formData, department_code: e.target.value })}
                                        required
                                        placeholder="e.g., HR"
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
                                        Description (Optional)
                                    </label>
                                    <textarea
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        rows="3"
                                        placeholder="Department description..."
                                        style={{
                                            width: '100%',
                                            padding: '10px',
                                            borderRadius: '8px',
                                            border: '1px solid rgba(255,255,255,0.3)',
                                            background: 'rgba(255,255,255,0.1)',
                                            color: 'white',
                                            resize: 'vertical'
                                        }}
                                    />
                                </div>
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
                                        Create Department
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ManageDepartments;