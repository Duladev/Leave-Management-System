const express = require('express');
const router = express.Router();
const LeaveApplication = require('../models/LeaveApplication');
const LeaveBalance = require('../models/LeaveBalance');

// Get pending leaves for approval
router.get('/pending-leaves', async (req, res) => {
    try {
        const managerId = req.user?.user_id || 2; // Temporary fallback
        const leaves = await LeaveApplication.getPendingByManager(managerId);
        res.json({ leaves });
    } catch (error) {
        console.error('Get pending leaves error:', error);
        res.status(500).json({ message: 'Failed to get pending leaves', error: error.message });
    }
});

// Get all team leaves
router.get('/team-leaves', async (req, res) => {
    try {
        const managerId = req.user?.user_id || 2; // Temporary fallback
        const leaves = await LeaveApplication.getTeamLeaves(managerId);
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

        const leave = await LeaveApplication.getById(applicationId);

        if (!leave) {
            return res.status(404).json({ message: 'Leave application not found' });
        }

        const approverId = req.user?.user_id || 2; // Temporary fallback
        await LeaveApplication.approve(applicationId, approverId);
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

        const approverId = req.user?.user_id || 2; // Temporary fallback
        await LeaveApplication.reject(applicationId, approverId, rejection_reason);

        res.json({ message: 'Leave rejected successfully' });
    } catch (error) {
        console.error('Reject leave error:', error);
        res.status(500).json({ message: 'Failed to reject leave', error: error.message });
    }
});

module.exports = router;