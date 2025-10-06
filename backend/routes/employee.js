const express = require('express');
const router = express.Router();
const LeaveApplication = require('../models/LeaveApplication');
const LeaveBalance = require('../models/LeaveBalance');

// Apply for leave
router.post('/apply-leave', async (req, res) => {
    try {
        const {
            leave_type_id,
            leave_category,
            start_date,
            end_date,
            half_day_period,
            short_leave_start_time,
            short_leave_end_time,
            reason
        } = req.body;

        // Calculate total days based on category
        let total_days;
        switch (leave_category) {
            case 'Full Day':
                const start = new Date(start_date);
                const end = new Date(end_date);
                const diffTime = Math.abs(end - start);
                total_days = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
                break;
            case 'Half Day':
                total_days = 0.5;
                break;
            case 'Short Leave':
                total_days = 0.25;
                break;
        }

        const leaveData = {
            user_id: req.user?.user_id || 1, // Temporary fallback
            leave_type_id,
            leave_category,
            start_date,
            end_date,
            half_day_period,
            short_leave_start_time,
            short_leave_end_time,
            total_days,
            reason
        };

        const leave = await LeaveApplication.create(leaveData);

        res.status(201).json({
            message: 'Leave application submitted successfully',
            leave
        });
    } catch (error) {
        console.error('Apply leave error:', error);
        res.status(500).json({ message: 'Failed to apply for leave', error: error.message });
    }
});

// Get my leave applications
router.get('/my-leaves', async (req, res) => {
    try {
        const userId = req.user?.user_id || 1; // Temporary fallback
        const leaves = await LeaveApplication.getByUserId(userId);
        res.json({ leaves });
    } catch (error) {
        console.error('Get leaves error:', error);
        res.status(500).json({ message: 'Failed to get leaves', error: error.message });
    }
});

// Get my leave balances
router.get('/my-balances', async (req, res) => {
    try {
        const userId = req.user?.user_id || 1; // Temporary fallback
        const balances = await LeaveBalance.getByUserId(userId);
        res.json({ balances });
    } catch (error) {
        console.error('Get balances error:', error);
        res.status(500).json({ message: 'Failed to get leave balances', error: error.message });
    }
});

module.exports = router;