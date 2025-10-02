import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import { employeeAPI } from '../services/api';
import '../styles/Dashboard.css';

const ApplyLeave = () => {
    const [formData, setFormData] = useState({
        leave_type_id: '1',
        leave_category: 'Full Day',
        start_date: '',
        end_date: '',
        half_day_period: 'Morning',
        short_leave_start_time: '',
        short_leave_end_time: '',
        reason: ''
    });
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const leaveTypes = [
        { id: 1, name: 'Annual Leave' },
        { id: 2, name: 'Sick Leave' },
        { id: 3, name: 'Casual Leave' }
    ];

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const calculateDays = () => {
        if (formData.leave_category === 'Full Day' && formData.start_date && formData.end_date) {
            const start = new Date(formData.start_date);
            const end = new Date(formData.end_date);
            const diffTime = Math.abs(end - start);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
            return diffDays;
        } else if (formData.leave_category === 'Half Day') {
            return 0.5;
        } else if (formData.leave_category === 'Short Leave') {
            return 0.25;
        }
        return 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setMessage('');

        try {
            const total_days = calculateDays();
            
            const leaveData = {
                ...formData,
                leave_type_id: parseInt(formData.leave_type_id),
                total_days
            };

            await employeeAPI.applyLeave(leaveData);
            setMessage('Leave application submitted successfully!');
            
            // Reset form
            setFormData({
                leave_type_id: '1',
                leave_category: 'Full Day',
                start_date: '',
                end_date: '',
                half_day_period: 'Morning',
                short_leave_start_time: '',
                short_leave_end_time: '',
                reason: ''
            });
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to apply leave');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="dashboard-wrapper">
            <Sidebar />
            <div className="main-content">
                <div className="page-header">
                    <h1 className="page-title">Apply for Leave</h1>
                    <p className="page-subtitle">Submit a new leave application</p>
                </div>

                <div className="card" style={{ maxWidth: '800px' }}>
                    {message && (
                        <div style={{
                            padding: '15px',
                            background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
                            borderRadius: '12px',
                            marginBottom: '20px',
                            color: 'white'
                        }}>
                            {message}
                        </div>
                    )}

                    {error && (
                        <div style={{
                            padding: '15px',
                            background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
                            borderRadius: '12px',
                            marginBottom: '20px',
                            color: 'white'
                        }}>
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit}>
                        <div style={{ marginBottom: '20px' }}>
                            <label style={{ display: 'block', color: 'white', marginBottom: '8px', fontWeight: '500' }}>
                                Leave Type
                            </label>
                            <select
                                name="leave_type_id"
                                value={formData.leave_type_id}
                                onChange={handleChange}
                                required
                                style={{
                                    width: '100%',
                                    padding: '12px',
                                    borderRadius: '8px',
                                    border: '1px solid rgba(255,255,255,0.3)',
                                    background: 'rgba(255,255,255,0.1)',
                                    color: 'white',
                                    fontSize: '16px'
                                }}
                            >
                                {leaveTypes.map(type => (
                                    <option key={type.id} value={type.id} style={{ background: '#1a1a2e' }}>
                                        {type.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div style={{ marginBottom: '20px' }}>
                            <label style={{ display: 'block', color: 'white', marginBottom: '8px', fontWeight: '500' }}>
                                Leave Category
                            </label>
                            <select
                                name="leave_category"
                                value={formData.leave_category}
                                onChange={handleChange}
                                required
                                style={{
                                    width: '100%',
                                    padding: '12px',
                                    borderRadius: '8px',
                                    border: '1px solid rgba(255,255,255,0.3)',
                                    background: 'rgba(255,255,255,0.1)',
                                    color: 'white',
                                    fontSize: '16px'
                                }}
                            >
                                <option value="Full Day" style={{ background: '#1a1a2e' }}>Full Day</option>
                                <option value="Half Day" style={{ background: '#1a1a2e' }}>Half Day</option>
                                <option value="Short Leave" style={{ background: '#1a1a2e' }}>Short Leave</option>
                            </select>
                        </div>

                        {formData.leave_category === 'Full Day' && (
                            <>
                                <div style={{ marginBottom: '20px' }}>
                                    <label style={{ display: 'block', color: 'white', marginBottom: '8px', fontWeight: '500' }}>
                                        Start Date
                                    </label>
                                    <input
                                        type="date"
                                        name="start_date"
                                        value={formData.start_date}
                                        onChange={handleChange}
                                        required
                                        style={{
                                            width: '100%',
                                            padding: '12px',
                                            borderRadius: '8px',
                                            border: '1px solid rgba(255,255,255,0.3)',
                                            background: 'rgba(255,255,255,0.1)',
                                            color: 'white',
                                            fontSize: '16px'
                                        }}
                                    />
                                </div>

                                <div style={{ marginBottom: '20px' }}>
                                    <label style={{ display: 'block', color: 'white', marginBottom: '8px', fontWeight: '500' }}>
                                        End Date
                                    </label>
                                    <input
                                        type="date"
                                        name="end_date"
                                        value={formData.end_date}
                                        onChange={handleChange}
                                        required
                                        style={{
                                            width: '100%',
                                            padding: '12px',
                                            borderRadius: '8px',
                                            border: '1px solid rgba(255,255,255,0.3)',
                                            background: 'rgba(255,255,255,0.1)',
                                            color: 'white',
                                            fontSize: '16px'
                                        }}
                                    />
                                </div>
                            </>
                        )}

                        {formData.leave_category === 'Half Day' && (
                            <>
                                <div style={{ marginBottom: '20px' }}>
                                    <label style={{ display: 'block', color: 'white', marginBottom: '8px', fontWeight: '500' }}>
                                        Date
                                    </label>
                                    <input
                                        type="date"
                                        name="start_date"
                                        value={formData.start_date}
                                        onChange={handleChange}
                                        required
                                        style={{
                                            width: '100%',
                                            padding: '12px',
                                            borderRadius: '8px',
                                            border: '1px solid rgba(255,255,255,0.3)',
                                            background: 'rgba(255,255,255,0.1)',
                                            color: 'white',
                                            fontSize: '16px'
                                        }}
                                    />
                                </div>

                                <div style={{ marginBottom: '20px' }}>
                                    <label style={{ display: 'block', color: 'white', marginBottom: '8px', fontWeight: '500' }}>
                                        Period
                                    </label>
                                    <select
                                        name="half_day_period"
                                        value={formData.half_day_period}
                                        onChange={handleChange}
                                        required
                                        style={{
                                            width: '100%',
                                            padding: '12px',
                                            borderRadius: '8px',
                                            border: '1px solid rgba(255,255,255,0.3)',
                                            background: 'rgba(255,255,255,0.1)',
                                            color: 'white',
                                            fontSize: '16px'
                                        }}
                                    >
                                        <option value="Morning" style={{ background: '#1a1a2e' }}>Morning</option>
                                        <option value="Afternoon" style={{ background: '#1a1a2e' }}>Afternoon</option>
                                    </select>
                                </div>
                            </>
                        )}

                        {formData.leave_category === 'Short Leave' && (
                            <>
                                <div style={{ marginBottom: '20px' }}>
                                    <label style={{ display: 'block', color: 'white', marginBottom: '8px', fontWeight: '500' }}>
                                        Date
                                    </label>
                                    <input
                                        type="date"
                                        name="start_date"
                                        value={formData.start_date}
                                        onChange={handleChange}
                                        required
                                        style={{
                                            width: '100%',
                                            padding: '12px',
                                            borderRadius: '8px',
                                            border: '1px solid rgba(255,255,255,0.3)',
                                            background: 'rgba(255,255,255,0.1)',
                                            color: 'white',
                                            fontSize: '16px'
                                        }}
                                    />
                                </div>

                                <div style={{ marginBottom: '20px' }}>
                                    <label style={{ display: 'block', color: 'white', marginBottom: '8px', fontWeight: '500' }}>
                                        Start Time
                                    </label>
                                    <input
                                        type="time"
                                        name="short_leave_start_time"
                                        value={formData.short_leave_start_time}
                                        onChange={handleChange}
                                        required
                                        style={{
                                            width: '100%',
                                            padding: '12px',
                                            borderRadius: '8px',
                                            border: '1px solid rgba(255,255,255,0.3)',
                                            background: 'rgba(255,255,255,0.1)',
                                            color: 'white',
                                            fontSize: '16px'
                                        }}
                                    />
                                </div>

                                <div style={{ marginBottom: '20px' }}>
                                    <label style={{ display: 'block', color: 'white', marginBottom: '8px', fontWeight: '500' }}>
                                        End Time
                                    </label>
                                    <input
                                        type="time"
                                        name="short_leave_end_time"
                                        value={formData.short_leave_end_time}
                                        onChange={handleChange}
                                        required
                                        style={{
                                            width: '100%',
                                            padding: '12px',
                                            borderRadius: '8px',
                                            border: '1px solid rgba(255,255,255,0.3)',
                                            background: 'rgba(255,255,255,0.1)',
                                            color: 'white',
                                            fontSize: '16px'
                                        }}
                                    />
                                </div>
                            </>
                        )}

                        <div style={{ marginBottom: '20px' }}>
                            <label style={{ display: 'block', color: 'white', marginBottom: '8px', fontWeight: '500' }}>
                                Reason
                            </label>
                            <textarea
                                name="reason"
                                value={formData.reason}
                                onChange={handleChange}
                                required
                                rows="4"
                                style={{
                                    width: '100%',
                                    padding: '12px',
                                    borderRadius: '8px',
                                    border: '1px solid rgba(255,255,255,0.3)',
                                    background: 'rgba(255,255,255,0.1)',
                                    color: 'white',
                                    fontSize: '16px',
                                    resize: 'vertical'
                                }}
                                placeholder="Enter reason for leave..."
                            />
                        </div>

                        <div style={{ marginTop: '10px', color: 'rgba(255,255,255,0.7)', fontSize: '14px' }}>
                            Total Days: {calculateDays()}
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="btn-primary"
                            style={{ marginTop: '20px' }}
                        >
                            {loading ? 'Submitting...' : 'Submit Leave Application'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default ApplyLeave;