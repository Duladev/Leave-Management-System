import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import { employeeAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import '../styles/Dashboard.css';

const ApplyLeave = () => {
    const { user } = useAuth();
    const [balances, setBalances] = useState([]);
    const [loading, setLoading] = useState(true);
    const [shortLeaveInfo, setShortLeaveInfo] = useState(null);
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
    const [submitting, setSubmitting] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [validationError, setValidationError] = useState('');

    const leaveTypes = [
        { id: 1, name: 'Annual Leave' },
        { id: 2, name: 'Sick Leave' },
        { id: 3, name: 'Casual Leave' }
    ];

    useEffect(() => {
        fetchBalances();
    }, []);

    useEffect(() => {
        if (formData.leave_category === 'Short Leave') {
            fetchShortLeaveCount();
        }
    }, [formData.leave_category]);

    // Validate dates whenever they change
    useEffect(() => {
        if (formData.leave_category === 'Full Day' && formData.start_date && formData.end_date) {
            validateCrossMonth();
        } else {
            setValidationError('');
        }
    }, [formData.start_date, formData.end_date, formData.leave_category]);

    const fetchBalances = async () => {
        setLoading(true);
        try {
            console.log('Fetching balances for user:', user);
            const response = await employeeAPI.getMyBalances();
            console.log('Balances response:', response.data);
            setBalances(response.data.balances || []);
        } catch (error) {
            console.error('Error fetching balances:', error);

            if (error.response?.status === 404) {
                setError('User account not found in system. Please contact HR to create your account.');
            } else if (error.response?.status === 500) {
                const serverError = error.response?.data?.error || '';
                if (serverError.includes('foreign key constraint')) {
                    setError('Database configuration error. Please contact system administrator.');
                } else {
                    setError('Server error. Please try again or contact support.');
                }
            } else if (error.code === 'ERR_NETWORK') {
                setError('Network error. Please check your connection and try again.');
            } else {
                setError('Failed to fetch leave balances. Please refresh the page.');
            }

            setBalances([]);
        } finally {
            setLoading(false);
        }
    };

    const fetchShortLeaveCount = async () => {
        try {
            const response = await employeeAPI.getShortLeaveCount();
            setShortLeaveInfo(response.data);
            console.log('Short leave info:', response.data);
        } catch (error) {
            console.error('Error fetching short leave count:', error);
        }
    };

    const validateCrossMonth = () => {
        const startDate = new Date(formData.start_date);
        const endDate = new Date(formData.end_date);

        if (startDate.getMonth() !== endDate.getMonth() ||
            startDate.getFullYear() !== endDate.getFullYear()) {
            setValidationError('❌ Leave cannot span across two different months. Please apply for each month separately.');
            return false;
        }

        setValidationError('');
        return true;
    };

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
        setError('');
        setMessage('');
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

    const getSelectedLeaveBalance = () => {
        const balance = balances.find(b => b.leave_type_id === parseInt(formData.leave_type_id));
        return balance ? parseFloat(balance.available_days) : 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setMessage('');

        // Validation for cross-month
        if (formData.leave_category === 'Full Day' && formData.start_date && formData.end_date) {
            if (!validateCrossMonth()) {
                return;
            }
        }

        // Validation for short leave limit
        if (formData.leave_category === 'Short Leave' && shortLeaveInfo) {
            if (shortLeaveInfo.remaining <= 0) {
                setError(`You have already used all ${shortLeaveInfo.max_allowed} short leaves for ${shortLeaveInfo.month}. Please select a different leave type or wait for next month.`);
                return;
            }
        }

        const total_days = calculateDays();
        const availableBalance = getSelectedLeaveBalance();

        if (total_days <= 0) {
            setError('Please select valid dates');
            return;
        }

        if (total_days > availableBalance) {
            setError(`Insufficient leave balance! You only have ${availableBalance} day(s) available for this leave type.`);
            return;
        }

        setSubmitting(true);

        try {
            // Build leave data based on category
            const leaveData = {
                leave_type_id: parseInt(formData.leave_type_id),
                leave_category: formData.leave_category,
                start_date: formData.start_date,
                reason: formData.reason,
                total_days
            };

            // Add category-specific fields
            if (formData.leave_category === 'Full Day') {
                leaveData.end_date = formData.end_date;
            } else if (formData.leave_category === 'Half Day') {
                leaveData.half_day_period = formData.half_day_period;
            } else if (formData.leave_category === 'Short Leave') {
                // Only include times if they have values
                if (formData.short_leave_start_time) {
                    leaveData.short_leave_start_time = formData.short_leave_start_time;
                }
                if (formData.short_leave_end_time) {
                    leaveData.short_leave_end_time = formData.short_leave_end_time;
                }
            }

            console.log('Submitting leave data:', leaveData);
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

            // Refresh data
            await fetchBalances();
            if (formData.leave_category === 'Short Leave') {
                await fetchShortLeaveCount();
            }

            window.scrollTo({ top: 0, behavior: 'smooth' });
        } catch (err) {
            console.error('Apply leave error:', err);

            const errorCode = err.response?.data?.code;
            const errorMessage = err.response?.data?.message;

            if (errorCode === 'CROSS_MONTH_NOT_ALLOWED') {
                setError(errorMessage || 'Leave cannot span across two different months.');
            } else if (errorCode === 'SHORT_LEAVE_LIMIT_EXCEEDED') {
                setError(errorMessage || 'Short leave limit exceeded for this month.');
            } else if (err.response?.status === 404) {
                setError('Your account was not found. Please contact HR.');
            } else if (err.response?.status === 400) {
                setError(errorMessage || 'Invalid leave application data.');
            } else {
                setError(errorMessage || 'Failed to apply leave. Please try again.');
            }
        } finally {
            setSubmitting(false);
        }
    };

    const selectedBalance = balances.find(b => b.leave_type_id === parseInt(formData.leave_type_id));

    const isFormValid = () => {
        if (validationError) return false;
        if (getSelectedLeaveBalance() === 0) return false;
        if (calculateDays() > getSelectedLeaveBalance()) return false;
        if (formData.leave_category === 'Short Leave' && shortLeaveInfo && shortLeaveInfo.remaining <= 0) return false;
        return true;
    };

    if (loading) {
        return (
            <div className="dashboard-wrapper">
                <Sidebar />
                <div className="main-content">
                    <div className="loading">Loading leave balances...</div>
                </div>
            </div>
        );
    }

    return (
        <div className="dashboard-wrapper">
            <Sidebar />
            <div className="main-content">
                <div className="page-header">
                    <h1 className="page-title">Apply for Leave</h1>
                    <p className="page-subtitle">Submit a new leave application</p>
                </div>

                {error && error.includes('not found') ? (
                    <div className="card" style={{ maxWidth: '800px' }}>
                        <div style={{ textAlign: 'center', padding: '40px' }}>
                            <div style={{ fontSize: '48px', marginBottom: '20px' }}>⚠️</div>
                            <h3 style={{ color: 'white', marginBottom: '15px' }}>Account Not Found</h3>
                            <p style={{ color: 'rgba(255,255,255,0.7)', marginBottom: '20px' }}>
                                {error}
                            </p>
                            <button onClick={fetchBalances} className="btn-primary">
                                Retry
                            </button>
                        </div>
                    </div>
                ) : balances.length === 0 ? (
                    <div className="card" style={{ maxWidth: '800px' }}>
                        <div style={{ textAlign: 'center', padding: '40px' }}>
                            <div style={{ fontSize: '48px', marginBottom: '20px' }}>⚠️</div>
                            <h3 style={{ color: 'white', marginBottom: '15px' }}>No Leave Balances Found</h3>
                            <p style={{ color: 'rgba(255,255,255,0.7)', marginBottom: '20px' }}>
                                {error || 'Your leave balances have not been initialized yet. Please contact HR to set up your leave balances.'}
                            </p>
                            <button onClick={fetchBalances} className="btn-primary">
                                Retry
                            </button>
                        </div>
                    </div>
                ) : (
                    <>
                        {/* Leave Balances Summary */}
                        <div style={{ marginBottom: '30px' }}>
                            <h3 style={{ color: 'white', marginBottom: '15px', fontSize: '20px' }}>Your Leave Balances</h3>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
                                {balances.map((balance) => (
                                    <div
                                        key={balance.balance_id}
                                        style={{
                                            background: balance.leave_type_id === parseInt(formData.leave_type_id)
                                                ? 'rgba(102, 126, 234, 0.3)'
                                                : 'rgba(255,255,255,0.05)',
                                            padding: '20px',
                                            borderRadius: '12px',
                                            border: balance.leave_type_id === parseInt(formData.leave_type_id)
                                                ? '2px solid rgba(102, 126, 234, 0.5)'
                                                : '1px solid rgba(255,255,255,0.1)',
                                            transition: 'all 0.3s ease'
                                        }}
                                    >
                                        <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.7)', marginBottom: '8px' }}>
                                            {balance.leave_type_name}
                                        </div>
                                        <div style={{ fontSize: '32px', fontWeight: '700', color: '#43e97b', marginBottom: '5px' }}>
                                            {balance.available_days}
                                        </div>
                                        <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)' }}>
                                            days available
                                        </div>
                                        <div style={{
                                            marginTop: '10px',
                                            fontSize: '11px',
                                            color: 'rgba(255,255,255,0.5)',
                                            borderTop: '1px solid rgba(255,255,255,0.1)',
                                            paddingTop: '8px'
                                        }}>
                                            Total: {balance.total_days} | Used: {balance.used_days}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="card" style={{ maxWidth: '800px' }}>
                            {message && (
                                <div style={{
                                    padding: '15px',
                                    background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
                                    borderRadius: '12px',
                                    marginBottom: '20px',
                                    color: 'white',
                                    fontWeight: '600'
                                }}>
                                    ✓ {message}
                                </div>
                            )}

                            {error && !error.includes('not found') && (
                                <div style={{
                                    padding: '15px',
                                    background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
                                    borderRadius: '12px',
                                    marginBottom: '20px',
                                    color: 'white',
                                    fontWeight: '600'
                                }}>
                                    ⚠ {error}
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
                                    {selectedBalance && (
                                        <div style={{
                                            marginTop: '10px',
                                            padding: '12px',
                                            background: selectedBalance.available_days > 0
                                                ? 'rgba(67, 233, 123, 0.15)'
                                                : 'rgba(250, 112, 154, 0.15)',
                                            borderRadius: '8px',
                                            border: `1px solid ${selectedBalance.available_days > 0 ? 'rgba(67, 233, 123, 0.3)' : 'rgba(250, 112, 154, 0.3)'}`,
                                            fontSize: '14px',
                                            color: selectedBalance.available_days > 0 ? '#43e97b' : '#fa709a'
                                        }}>
                                            {selectedBalance.available_days > 0
                                                ? `✓ ${selectedBalance.available_days} day(s) available`
                                                : '⚠ No balance remaining for this leave type'
                                            }
                                        </div>
                                    )}
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

                                {/* Short Leave Warning */}
                                {formData.leave_category === 'Short Leave' && shortLeaveInfo && (
                                    <div style={{
                                        padding: '15px',
                                        background: shortLeaveInfo.remaining > 0
                                            ? 'rgba(67, 233, 123, 0.15)'
                                            : 'rgba(250, 112, 154, 0.15)',
                                        border: `1px solid ${shortLeaveInfo.remaining > 0
                                            ? 'rgba(67, 233, 123, 0.3)'
                                            : 'rgba(250, 112, 154, 0.3)'}`,
                                        borderRadius: '12px',
                                        marginBottom: '20px'
                                    }}><div style={{
                                        color: 'white',
                                        fontWeight: '600',
                                        marginBottom: '8px',
                                        fontSize: '15px'
                                    }}>
                                            📊 Short Leave Status for {shortLeaveInfo.month}
                                        </div>
                                        <div style={{
                                            color: 'rgba(255,255,255,0.9)',
                                            fontSize: '14px',
                                            marginBottom: '5px'
                                        }}>
                                            Used: <strong>{shortLeaveInfo.short_leave_count}</strong> / {shortLeaveInfo.max_allowed}
                                        </div>
                                        <div style={{
                                            color: 'rgba(255,255,255,0.9)',
                                            fontSize: '14px',
                                            marginBottom: '8px'
                                        }}>
                                            Remaining: <strong style={{
                                                color: shortLeaveInfo.remaining > 0 ? '#43e97b' : '#fa709a'
                                            }}>{shortLeaveInfo.remaining}</strong>
                                        </div>
                                        {shortLeaveInfo.remaining === 0 && (
                                            <div style={{
                                                color: '#fa709a',
                                                fontSize: '13px',
                                                fontWeight: '600',
                                                marginTop: '8px',
                                                paddingTop: '8px',
                                                borderTop: '1px solid rgba(250, 112, 154, 0.3)'
                                            }}>
                                                ⚠️ You have used all short leaves for this month. Please select a different leave type.
                                            </div>
                                        )}
                                    </div>
                                )}

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
                                                min={new Date().toISOString().split('T')[0]}
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
                                                min={formData.start_date || new Date().toISOString().split('T')[0]}
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

                                        {/* Cross-month validation error */}
                                        {validationError && (
                                            <div style={{
                                                padding: '12px',
                                                background: 'rgba(250, 112, 154, 0.15)',
                                                border: '1px solid rgba(250, 112, 154, 0.3)',
                                                borderRadius: '8px',
                                                marginBottom: '20px',
                                                color: '#fa709a',
                                                fontSize: '14px',
                                                fontWeight: '600'
                                            }}>
                                                {validationError}
                                            </div>
                                        )}
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
                                                min={new Date().toISOString().split('T')[0]}
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
                                                min={new Date().toISOString().split('T')[0]}
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

                                        {/* Optional time fields for short leave - removed as per requirement */}
                                        {/* Times are not required for short leave */}
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

                                <div style={{
                                    marginTop: '20px',
                                    padding: '15px',
                                    background: 'rgba(102, 126, 234, 0.2)',
                                    borderRadius: '8px',
                                    border: '1px solid rgba(102, 126, 234, 0.3)'
                                }}>
                                    <div style={{ color: 'white', fontSize: '16px', fontWeight: '600', marginBottom: '5px' }}>
                                        Total Days Requested: {calculateDays()}
                                    </div>
                                    <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '14px' }}>
                                        Available Balance: {getSelectedLeaveBalance()} day(s)
                                    </div>
                                    {calculateDays() > getSelectedLeaveBalance() && (
                                        <div style={{ color: '#fa709a', fontSize: '13px', marginTop: '5px', fontWeight: '600' }}>
                                            ⚠ Insufficient balance!
                                        </div>
                                    )}
                                </div>

                                <button
                                    type="submit"
                                    disabled={submitting || !isFormValid()}
                                    className="btn-primary"
                                    style={{
                                        marginTop: '20px',
                                        opacity: !isFormValid() ? 0.5 : 1,
                                        cursor: !isFormValid() ? 'not-allowed' : 'pointer'
                                    }}
                                >
                                    {submitting ? 'Submitting...' :
                                        validationError ? 'Invalid Date Range' :
                                            getSelectedLeaveBalance() === 0 ? 'No Balance Available' :
                                                calculateDays() > getSelectedLeaveBalance() ? 'Insufficient Balance' :
                                                    (formData.leave_category === 'Short Leave' && shortLeaveInfo && shortLeaveInfo.remaining <= 0) ? 'Short Leave Limit Reached' :
                                                        'Submit Leave Application'}
                                </button>
                            </form>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default ApplyLeave;