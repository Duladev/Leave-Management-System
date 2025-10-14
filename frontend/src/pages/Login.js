import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/Login.css';

// Import the logo directly
import logo from '../assets/NIRU.png';

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
        <main id="login-section" className="login-page">
            <div className="login-card">
                <svg className="login-card-bg" viewBox="0 0 678 600" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                        <div className="login-card-border-outer"></div>
                        <div className="login-card-border"></div>
                        <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" style={{ stopColor: 'rgb(102, 126, 234)', stopOpacity: 1 }} />
                            <stop offset="100%" style={{ stopColor: 'rgb(118, 75, 162)', stopOpacity: 1 }} />
                        </linearGradient>
                    </defs>
                    <rect width="678" height="600" fill="url(#grad1)" rx="20" />
                </svg>
                <form className="login-form" onSubmit={handleSubmit}>
                    {/* Fixed Logo Section */}
                    <div className="login-logo">
                        <img
                            src={logo}
                            alt="Diamond Cutters Ltd Logo"
                            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                        />
                    </div>

                    <h1 className="form-title">DIAMOND CUTTERS LTD</h1>
                    {error && (
                        <div className="error-alert">
                            {error}
                        </div>
                    )}

                    <div className="form-group">
                        <label htmlFor="email" className="form-label">Email</label>
                        <input
                            type="email"
                            id="email"
                            className="form-input"
                            placeholder="email@domain.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="password" className="form-label">Password</label>
                        <input
                            type="password"
                            id="password"
                            className="form-input"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>

                    <button type="submit" className="login-button" disabled={loading}>
                        {loading ? 'Logging in...' : 'Login'}
                    </button>
                </form>
            </div>
        </main>
    );
};

export default Login;