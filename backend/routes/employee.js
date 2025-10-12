const express = require('express');
const router = express.Router();
const LeaveApplication = require('../models/LeaveApplication');
const LeaveBalance = require('../models/LeaveBalance');
const { getPool, sql } = require('../config/database');

// Helper function to check if dates span across months
const spansTwoMonths = (startDate, endDate) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    return start.getMonth() !== end.getMonth() || start.getFullYear() !== end.getFullYear();
};

// Helper function to count short leaves in a month
const countShortLeavesInMonth = async (userId, date) => {
    try {
        const pool = await getPool();
        const targetDate = new Date(date);
        const year = targetDate.getFullYear();
        const month = targetDate.getMonth() + 1; // JavaScript months are 0-indexed

        console.log('Counting short leaves for user:', userId, 'year:', year, 'month:', month);

        const result = await pool.request()
            .input('user_id', sql.Int, userId)
            .input('year', sql.Int, year)
            .input('month', sql.Int, month)
            .query(`
                SELECT COUNT(*) as short_leave_count
                FROM leave_applications
                WHERE user_id = @user_id
                AND leave_category = 'Short Leave'
                AND status IN ('Pending', 'Approved')
                AND YEAR(start_date) = @year
                AND MONTH(start_date) = @month
            `);

        const count = result.recordset[0].short_leave_count;
        console.log('Short leave count:', count);

        return count;
    } catch (error) {
        console.error('Error counting short leaves:', error);
        throw error;
    }
};

// Get short leave count for current month
router.get('/short-leave-count', async (req, res) => {
    try {
        const userId = req.user?.user_id;

        if (!userId) {
            return res.status(401).json({
                message: 'Authentication required. Please login again.'
            });
        }

        console.log('=== SHORT LEAVE COUNT REQUEST ===');
        console.log('User ID:', userId);

        const today = new Date();
        const count = await countShortLeavesInMonth(userId, today);

        const monthName = today.toLocaleString('default', { month: 'long', year: 'numeric' });

        console.log('Returning short leave info:', {
            month: monthName,
            count: count,
            remaining: Math.max(0, 2 - count)
        });

        res.json({
            month: monthName,
            short_leave_count: count,
            remaining: Math.max(0, 2 - count),
            max_allowed: 2
        });
    } catch (error) {
        console.error('Get short leave count error:', error);
        res.status(500).json({
            message: 'Failed to get short leave count',
            error: error.message,
            stack: error.stack
        });
    }
});

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

        console.log('=== APPLY LEAVE REQUEST ===');
        console.log('Request body:', req.body);

        // Get user ID from token
        const userId = req.user?.user_id;

        if (!userId) {
            return res.status(401).json({
                message: 'Authentication required. Please login again.'
            });
        }

        console.log('User ID:', userId);

        // First, verify user exists
        const pool = await getPool();
        const userCheck = await pool.request()
            .input('user_id', sql.Int, userId)
            .query('SELECT user_id FROM users WHERE user_id = @user_id');

        if (userCheck.recordset.length === 0) {
            console.error('User not found in database:', userId);
            return res.status(404).json({
                message: 'User account not found. Please contact HR.',
                user_id: userId
            });
        }

        console.log('User verified');

        // Validation 1: Check if leave spans across two months
        if (leave_category === 'Full Day' && end_date) {
            console.log('Validating cross-month for Full Day leave');
            if (spansTwoMonths(start_date, end_date)) {
                return res.status(400).json({
                    message: 'Leave cannot span across two different months. Please apply for each month separately.',
                    code: 'CROSS_MONTH_NOT_ALLOWED'
                });
            }
        }

        // Validation 2: Check short leave limit (2 per month)
        if (leave_category === 'Short Leave') {
            console.log('Validating short leave limit');
            const shortLeaveCount = await countShortLeavesInMonth(userId, start_date);
            console.log('Current short leave count:', shortLeaveCount);

            if (shortLeaveCount >= 2) {
                return res.status(400).json({
                    message: 'You have already applied for 2 short leaves this month. Maximum 2 short leaves per month allowed.',
                    code: 'SHORT_LEAVE_LIMIT_EXCEEDED',
                    current_count: shortLeaveCount,
                    max_allowed: 2
                });
            }
        }

        // Calculate total days
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
            default:
                total_days = 1;
        }

        console.log('Calculated days:', total_days);

        // Get user's leave balances
        const balances = await LeaveBalance.getByUserId(userId);
        console.log('User balances:', balances.length);

        // Find balance for requested leave type
        const balance = balances.find(b => b.leave_type_id === parseInt(leave_type_id));

        if (!balance) {
            console.log('No balance found for leave_type_id:', leave_type_id);
            return res.status(400).json({
                message: 'Leave balance not found for this leave type. Please contact HR.'
            });
        }

        console.log('Available days:', balance.available_days, 'Requested days:', total_days);

        // Check if sufficient balance
        if (parseFloat(balance.available_days) < total_days) {
            return res.status(400).json({
                message: `Insufficient leave balance. Available: ${balance.available_days} days, Requested: ${total_days} days`
            });
        }

        // Prepare leave data - handle null/empty values properly
        const leaveData = {
            user_id: userId,
            leave_type_id: parseInt(leave_type_id),
            leave_category,
            start_date,
            end_date: (leave_category === 'Full Day' && end_date) ? end_date : start_date,
            half_day_period: (leave_category === 'Half Day' && half_day_period) ? half_day_period : null,
            short_leave_start_time: (leave_category === 'Short Leave' && short_leave_start_time) ? short_leave_start_time : null,
            short_leave_end_time: (leave_category === 'Short Leave' && short_leave_end_time) ? short_leave_end_time : null,
            total_days,
            reason
        };

        console.log('Creating leave application with data:', leaveData);

        const leave = await LeaveApplication.create(leaveData);
        console.log('Leave application created successfully:', leave.application_id);

        res.status(201).json({
            message: 'Leave application submitted successfully',
            leave
        });
    } catch (error) {
        console.error('=== APPLY LEAVE ERROR ===');
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
        res.status(500).json({
            message: 'Failed to apply for leave',
            error: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
});

// Get my leave applications
router.get('/my-leaves', async (req, res) => {
    try {
        const userId = req.user?.user_id;

        if (!userId) {
            return res.status(401).json({
                message: 'Authentication required. Please login again.'
            });
        }

        console.log('Fetching leaves for user:', userId);

        // Verify user exists first
        const pool = await getPool();
        const userCheck = await pool.request()
            .input('user_id', sql.Int, userId)
            .query('SELECT user_id FROM users WHERE user_id = @user_id');

        if (userCheck.recordset.length === 0) {
            return res.status(404).json({
                message: 'User account not found',
                user_id: userId
            });
        }

        const leaves = await LeaveApplication.getByUserId(userId);
        console.log('Found leaves:', leaves.length);

        res.json({ leaves });
    } catch (error) {
        console.error('Get leaves error:', error);
        res.status(500).json({ message: 'Failed to get leaves', error: error.message });
    }
});

// Get my leave balances
router.get('/my-balances', async (req, res) => {
    try {
        const userId = req.user?.user_id;

        if (!userId) {
            return res.status(401).json({
                message: 'Authentication required. Please login again.'
            });
        }

        console.log('Fetching balances for user ID:', userId);

        // First, verify user exists
        const pool = await getPool();
        const userCheck = await pool.request()
            .input('user_id', sql.Int, userId)
            .query('SELECT user_id, employee_id, full_name FROM users WHERE user_id = @user_id');

        if (userCheck.recordset.length === 0) {
            console.error('User not found in database:', userId);
            return res.status(404).json({
                message: 'User account not found. Please contact HR to create your account.',
                user_id: userId
            });
        }

        console.log('User exists:', userCheck.recordset[0]);
        console.log('Fetching balances...');

        let balances = await LeaveBalance.getByUserId(userId);
        console.log('Balances found:', balances.length);

        res.json({
            balances,
            user: userCheck.recordset[0]
        });
    } catch (error) {
        console.error('Get balances error:', error);
        res.status(500).json({
            message: 'Failed to get leave balances',
            error: error.message,
            user_id: req.user?.user_id
        });
    }
});

module.exports = router;