const express = require('express');
const router = express.Router();
const LeaveApplication = require('../models/LeaveApplication');
const LeaveBalance = require('../models/LeaveBalance');
const { getPool, sql } = require('../config/database');

// Get pending leaves for approval (only manager's team)
router.get('/pending-leaves', async (req, res) => {
    try {
        const managerId = req.user?.user_id;

        if (!managerId) {
            return res.status(401).json({
                message: 'Authentication required. Please login again.'
            });
        }

        console.log('===== PENDING LEAVES REQUEST =====');
        console.log('Manager ID:', managerId);

        // First, check which employees belong to this manager
        const pool = await getPool();
        const employees = await pool.request()
            .input('manager_id', sql.Int, managerId)
            .query('SELECT user_id, employee_id, full_name FROM users WHERE manager_id = @manager_id');

        console.log('Employees under this manager:', employees.recordset);

        // Now get pending leaves
        const leaves = await LeaveApplication.getPendingByManager(managerId);
        console.log('Pending leaves found:', leaves.length);

        if (leaves.length > 0) {
            console.log('First leave:', leaves[0]);
        }

        res.json({ leaves });
    } catch (error) {
        console.error('Get pending leaves error:', error);
        res.status(500).json({ message: 'Failed to get pending leaves', error: error.message });
    }
});

// Get all team leaves (only manager's team)
router.get('/team-leaves', async (req, res) => {
    try {
        const managerId = req.user?.user_id;

        if (!managerId) {
            return res.status(401).json({
                message: 'Authentication required. Please login again.'
            });
        }

        console.log('===== TEAM LEAVES REQUEST =====');
        console.log('Manager ID:', managerId);

        const leaves = await LeaveApplication.getTeamLeaves(managerId);
        console.log('Team leaves found:', leaves.length);

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
        const managerId = req.user?.user_id;

        if (!managerId) {
            return res.status(401).json({
                message: 'Authentication required. Please login again.'
            });
        }

        console.log('===== APPROVE LEAVE REQUEST =====');
        console.log('Manager ID:', managerId);
        console.log('Application ID:', applicationId);

        // Get leave details
        const leave = await LeaveApplication.getById(applicationId);

        if (!leave) {
            console.log('Leave not found');
            return res.status(404).json({ message: 'Leave application not found' });
        }

        console.log('Leave details:', {
            application_id: leave.application_id,
            user_id: leave.user_id,
            employee_name: leave.employee_name,
            manager_id: leave.manager_id,
            leave_type_id: leave.leave_type_id,
            total_days: leave.total_days,
            status: leave.status
        });

        // Verify authorization
        if (leave.manager_id !== managerId) {
            console.log('Authorization failed - manager_id mismatch');
            console.log('Leave manager_id:', leave.manager_id, 'Approving manager_id:', managerId);
            return res.status(403).json({ message: 'You are not authorized to approve this leave' });
        }

        console.log('Approving leave...');
        await LeaveApplication.approve(applicationId, managerId);

        console.log('Updating leave balance...');
        console.log('User ID:', leave.user_id, 'Leave Type ID:', leave.leave_type_id, 'Days:', leave.total_days);

        // Get current balance before update
        const pool = await getPool();
        const balanceBefore = await pool.request()
            .input('user_id', sql.Int, leave.user_id)
            .input('leave_type_id', sql.Int, leave.leave_type_id)
            .query('SELECT * FROM leave_balances WHERE user_id = @user_id AND leave_type_id = @leave_type_id AND year = YEAR(GETDATE())');

        console.log('Balance before update:', balanceBefore.recordset[0]);

        await LeaveBalance.updateBalance(leave.user_id, leave.leave_type_id, leave.total_days);

        // Get balance after update
        const balanceAfter = await pool.request()
            .input('user_id', sql.Int, leave.user_id)
            .input('leave_type_id', sql.Int, leave.leave_type_id)
            .query('SELECT * FROM leave_balances WHERE user_id = @user_id AND leave_type_id = @leave_type_id AND year = YEAR(GETDATE())');

        console.log('Balance after update:', balanceAfter.recordset[0]);

        res.json({
            message: 'Leave approved successfully',
            balanceUpdated: true,
            before: balanceBefore.recordset[0],
            after: balanceAfter.recordset[0]
        });
    } catch (error) {
        console.error('Approve leave error:', error);
        res.status(500).json({ message: 'Failed to approve leave', error: error.message, stack: error.stack });
    }
});

// Reject leave
router.post('/reject/:applicationId', async (req, res) => {
    try {
        const { applicationId } = req.params;
        const { rejection_reason } = req.body;
        const managerId = req.user?.user_id;

        if (!managerId) {
            return res.status(401).json({
                message: 'Authentication required. Please login again.'
            });
        }

        console.log('===== REJECT LEAVE REQUEST =====');
        console.log('Manager ID:', managerId);
        console.log('Application ID:', applicationId);

        if (!rejection_reason) {
            return res.status(400).json({ message: 'Rejection reason is required' });
        }

        const leave = await LeaveApplication.getById(applicationId);

        if (!leave) {
            return res.status(404).json({ message: 'Leave application not found' });
        }

        console.log('Leave manager_id:', leave.manager_id, 'Rejecting manager_id:', managerId);

        // Verify authorization
        if (leave.manager_id !== managerId) {
            return res.status(403).json({ message: 'You are not authorized to reject this leave' });
        }

        await LeaveApplication.reject(applicationId, managerId, rejection_reason);

        res.json({ message: 'Leave rejected successfully' });
    } catch (error) {
        console.error('Reject leave error:', error);
        res.status(500).json({ message: 'Failed to reject leave', error: error.message });
    }
});

module.exports = router;