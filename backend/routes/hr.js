const express = require('express');
const router = express.Router();
const { authMiddleware, checkLevel } = require('../middleware/auth');
const User = require('../models/User');
const LeaveApplication = require('../models/LeaveApplication');
const LeaveBalance = require('../models/LeaveBalance');

// All routes require Level 1 (HR) authentication
router.use(authMiddleware);
router.use(checkLevel(1));

// Get all users
router.get('/users', async (req, res) => {
    try {
        const users = await User.getAll();
        res.json({ users });
    } catch (error) {
        console.error('Get users error:', error);
        res.status(500).json({ message: 'Failed to get users', error: error.message });
    }
});

// Create new user
router.post('/users', async (req, res) => {
    try {
        const { email, password, full_name, user_level, manager_id } = req.body;

        // Validate
        if (!email || !password || !full_name || !user_level) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        // Check if user exists
        const existingUser = await User.findByEmail(email);
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // Create user
        const user = await User.create({ email, password, full_name, user_level, manager_id });
        
        // Initialize leave balances
        await LeaveBalance.initialize(user.user_id);

        res.status(201).json({
            message: 'User created successfully',
            user: {
                user_id: user.user_id,
                email: user.email,
                full_name: user.full_name,
                user_level: user.user_level
            }
        });
    } catch (error) {
        console.error('Create user error:', error);
        res.status(500).json({ message: 'Failed to create user', error: error.message });
    }
});

// Assign manager to employee
router.put('/assign-manager', async (req, res) => {
    try {
        const { user_id, manager_id } = req.body;

        if (!user_id || !manager_id) {
            return res.status(400).json({ message: 'User ID and Manager ID are required' });
        }

        await User.updateManager(user_id, manager_id);

        res.json({ message: 'Manager assigned successfully' });
    } catch (error) {
        console.error('Assign manager error:', error);
        res.status(500).json({ message: 'Failed to assign manager', error: error.message });
    }
});

// Get all leave applications
router.get('/all-leaves', async (req, res) => {
    try {
        const leaves = await LeaveApplication.getAll();
        res.json({ leaves });
    } catch (error) {
        console.error('Get all leaves error:', error);
        res.status(500).json({ message: 'Failed to get leaves', error: error.message });
    }
});

module.exports = router;