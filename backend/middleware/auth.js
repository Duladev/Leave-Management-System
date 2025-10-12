const jwt = require('jsonwebtoken');
const LeaveApplication = require('../models/LeaveApplication');

const authMiddleware = async (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');

        if (!token) {
            return res.status(401).json({
                message: 'Authentication required. Please login.',
                code: 'NO_TOKEN'
            });
        }

        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET || '1234');
            req.user = decoded;
            console.log('Authenticated user:', {
                user_id: decoded.user_id,
                email: decoded.email,
                user_level: decoded.user_level
            });
            next();
        } catch (jwtError) {
            return res.status(401).json({
                message: 'Invalid or expired token. Please login again.',
                code: 'INVALID_TOKEN'
            });
        }
    } catch (error) {
        return res.status(401).json({
            message: 'Authentication failed',
            code: 'AUTH_ERROR',
            error: error.message
        });
    }
};

// Check user level access
const checkLevel = (...allowedLevels) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                message: 'Authentication required',
                code: 'NOT_AUTHENTICATED'
            });
        }

        if (!allowedLevels.includes(req.user.user_level)) {
            return res.status(403).json({
                message: 'Access denied. Insufficient permissions.',
                your_level: req.user.user_level,
                required_level: allowedLevels,
                code: 'INSUFFICIENT_PERMISSIONS'
            });
        }

        next();
    };
};

// Check if user can access specific leave application
const canAccessLeave = async (req, res, next) => {
    try {
        const { applicationId } = req.params;
        const leave = await LeaveApplication.getById(applicationId);

        if (!leave) {
            return res.status(404).json({ message: 'Leave application not found' });
        }

        // HR can access all
        if (req.user.user_level === 1) {
            req.leave = leave;
            return next();
        }

        // Manager can access their team's leaves
        if (req.user.user_level === 2 && leave.manager_id === req.user.user_id) {
            req.leave = leave;
            return next();
        }

        // Employee can access only their own
        if (req.user.user_level === 3 && leave.user_id === req.user.user_id) {
            req.leave = leave;
            return next();
        }

        return res.status(403).json({
            message: 'You do not have permission to access this leave application',
            code: 'ACCESS_DENIED'
        });
    } catch (error) {
        return res.status(500).json({
            message: 'Error checking permissions',
            error: error.message
        });
    }
};

module.exports = { authMiddleware, checkLevel, canAccessLeave };