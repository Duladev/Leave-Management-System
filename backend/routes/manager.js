const express = require('express');
const router = express.Router();
const { authMiddleware, checkLevel } = require('../middleware/auth');
const LeaveApplication = require('../models/LeaveApplication');
const LeaveBalance = require('../models/LeaveBalance');

// All routes require Level 2 (Manager) authentication
router.use(authMiddleware);
router.use(checkLevel(2));

// Get pending leaves for approval
router.get('/pending-leaves', async (req, res) => {
    try {
        const leaves = await LeaveApplication.getPendingByManager(req.user.user_id);
        res.json({ leaves });
    } catch (error) {
        console.error('Get pending leaves error:', error);
        res.status(500).json({ message: 'Failed to get pending leaves', error: error.message });
    }
});

// Get all team leaves
router.get('/team-leaves', async (req, res) => {
    try {
        const leaves = await LeaveApplication.getTeamLeaves(req.user.user_id);
        res.json({ leaves });
    } catch (error) {
        console.error('Get team leaves error:', error);
        res.status(500).json({ message: 'Failed to get team leaves', error: error.message });
    }
});

// Approve leave
router.post('/approve/:applicationId', async (req, res) => {
    try {
        const { applicationId } = req.params;
        
        // Get leave details first
        const leave = await LeaveApplication.getById(applicationId);
        
        if (!leave) {
            return res.status(404).json({ message: 'Leave application not found' });
        }

        // Approve the leave
        await LeaveApplication.approve(applicationId, req.user.user_id);
        
        // Update leave balance
        await LeaveBalance.updateBalance(leave.user_id, leave.leave_type_id, leave.total_days);

        res.json({ message: 'Leave approved successfully' });
    } catch (error) {
        console.error('Approve leave error:', error);
        res.status(500).json({ message: 'Failed to approve leave', error: error.message });
    }
});

// Reject leave
router.post('/reject/:applicationId', async (req, res) => {
    try {
        const { applicationId } = req.params;
        const { rejection_reason } = req.body;

        if (!rejection_reason) {
            return res.status(400).json({ message: 'Rejection reason is required' });
        }

        await LeaveApplication.reject(applicationId, req.user.user_id, rejection_reason);

        res.json({ message: 'Leave rejected successfully' });
    } catch (error) {
        console.error('Reject leave error:', error);
        res.status(500).json({ message: 'Failed to reject leave', error: error.message });
    }
});

module.exports = router;