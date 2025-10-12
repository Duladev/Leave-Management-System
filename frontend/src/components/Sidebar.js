import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import '../styles/Sidebar.css';

// Import the logo directly
import logo from '../assets/NIRU.png';

const Sidebar = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const isActive = (path) => location.pathname === path;

    const menuItems = [
        {
            path: '/dashboard',
            label: 'Dashboard',
            icon: '📊',
            levels: [1, 2, 3]
        },
        {
            path: '/apply-leave',
            label: 'Apply Leave',
            icon: '📝',
            levels: [2, 3]
        },
        {
            path: '/my-leaves',
            label: 'My Leaves',
            icon: '📋',
            levels: [2, 3]
        },
        {
            path: '/pending-leaves',
            label: 'Pending Leaves',
            icon: '⏳',
            levels: [2]
        },
        {
            path: '/team-leaves',
            label: 'Team Leaves',
            icon: '👥',
            levels: [2]
        },
        {
            path: '/hr-dashboard',
            label: 'HR Dashboard',
            icon: '👔',
            levels: [1]
        },
        {
            path: '/manage-users',
            label: 'Manage Users',
            icon: '👤',
            levels: [1]
        },
        {
            path: '/manage-departments',
            label: 'Manage Departments',
            icon: '🏢',
            levels: [1]
        },
        {
            path: '/all-leaves',
            label: 'All Leaves',
            icon: '📄',
            levels: [1]
        },
        {
            path: '/rejected-leaves',
            label: 'Rejected Leaves',
            icon: '❌',
            levels: [1, 2]
        },
        {
            path: '/manage-leave-balances',
            label: 'Manage Leave Balances',
            icon: '⚖️',
            levels: [1]
        }
    ];

    const filteredMenu = menuItems.filter(item =>
        item.levels.includes(user?.user_level)
    );

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <div className="sidebar">
            <div className="sidebar-header">
                <div className="logo-container">
                    <img
                        src={logo}
                        alt="Diamond Cutters Ltd Logo"
                        className="sidebar-logo"
                    />
                </div>
                <h2><p className="system-subtitle">Diamond Cutters LTD</p></h2>
                <p className="system-subtitle">Leave Management System</p>
            </div>

            <div className="sidebar-user">
                <div className="user-avatar">
                    {user?.full_name?.charAt(0).toUpperCase()}
                </div>
                <div className="user-details">
                    <span className="user-name">{user?.full_name}</span>
                    <span className={`user-role level-${user?.user_level}`}>
                        {user?.user_level === 1 ? 'HR Admin' :
                            user?.user_level === 2 ? 'Manager' : 'Employee'}
                    </span>
                </div>
            </div>

            <nav className="sidebar-nav">
                {filteredMenu.map((item) => (
                    <button
                        key={item.path}
                        className={`nav-item ${isActive(item.path) ? 'active' : ''}`}
                        onClick={() => navigate(item.path)}
                    >
                        <span className="nav-icon">{item.icon}</span>
                        <span className="nav-label">{item.label}</span>
                    </button>
                ))}
            </nav>

            <button className="logout-btn" onClick={handleLogout}>
                <span className="logout-icon">🚪</span>
                <span>Logout</span>
            </button>
        </div>
    );
};

export default Sidebar;