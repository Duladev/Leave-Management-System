import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/Login.css';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        const result = await login(email, password);
        
        setLoading(false);

        if (result.success) {
            navigate('/dashboard');
        } else {
            setError(result.message);
        }
    };

    return (
        <div className="login-container">
            <div className="login-background"></div>
            
            <div className="diamond-container">
                <div className="diamond-shape">
                    <div className="diamond-content">
                        <div className="logo-section">
                            <h1 className="system-title">Leave Management</h1>
                            <p className="system-subtitle">Professional System</p>
                        </div>

                        {error && (
                            <div className="error-message">
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="login-form">
                            <div className="form-group">
                                <label>Email Address</label>
                                <input
                                    type="email"
                                    className="form-input"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    placeholder="Enter your email"
                                />
                            </div>

                            <div className="form-group">
                                <label>Password</label>
                                <input
                                    type="password"
                                    className="form-input"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    placeholder="Enter your password"
                                />
                            </div>

                            <button
                                type="submit"
                                className="login-button"
                                disabled={loading}
                            >
                                {loading ? (
                                    <span className="spinner"></span>
                                ) : (
                                    'Sign In'
                                )}
                            </button>
                        </form>

                        <div className="demo-credentials">
                            <p className="demo-title">Demo Accounts</p>
                            <div className="demo-list">
                                <div className="demo-item">
                                    <span className="badge-hr">HR</span>
                                    <span>hr@company.com</span>
                                </div>
                                <div className="demo-item">
                                    <span className="badge-manager">Manager</span>
                                    <span>manager@company.com</span>
                                </div>
                                <div className="demo-item">
                                    <span className="badge-employee">Employee</span>
                                    <span>employee@company.com</span>
                                </div>
                                <p className="demo-password">Password: password123</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;