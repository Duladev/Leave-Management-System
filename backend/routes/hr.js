const express = require('express');
const router = express.Router();
const User = require('../models/User');
const LeaveApplication = require('../models/LeaveApplication');
const LeaveBalance = require('../models/LeaveBalance');
const Department = require('../models/Department');

// Department routes
router.get('/departments', async (req, res) => {
    try {
        const departments = await Department.getAll();
        res.json({ departments });
    } catch (error) {
        console.error('Get departments error:', error);
        res.status(500).json({ message: 'Failed to get departments', error: error.message });
    }
});

router.post('/departments', async (req, res) => {
    try {
        const { department_name, department_code, description } = req.body;

        if (!department_name || !department_code) {
            return res.status(400).json({ message: 'Department name and code are required' });
        }

        const department = await Department.create({ department_name, department_code, description });
        res.status(201).json({ message: 'Department created successfully', department });
    } catch (error) {
        console.error('Create department error:', error);
        res.status(500).json({ message: 'Failed to create department', error: error.message });
    }
});

router.delete('/departments/:departmentId', async (req, res) => {
    try {
        const { departmentId } = req.params;
        await Department.delete(parseInt(departmentId));
        res.json({ message: 'Department deleted successfully' });
    } catch (error) {
        console.error('Delete department error:', error);
        res.status(500).json({ message: 'Failed to delete department', error: error.message });
    }
});

router.get('/users', async (req, res) => {
    try {
        const users = await User.getAll();
        res.json({ users });
    } catch (error) {
        console.error('Get users error:', error);
        res.status(500).json({ message: 'Failed to get users', error: error.message });
    }
});

router.post('/users', async (req, res) => {
    try {
        const { employee_id, email, password, full_name, user_level, manager_id, department_id } = req.body;

        if (!email || !password || !full_name || !user_level) {
            return res.status(400).json({ message: 'All required fields must be provided' });
        }

        if (parseInt(user_level) === 2 && !department_id) {
            return res.status(400).json({ message: 'Department is required for managers' });
        }

        const existingUser = await User.findByEmail(email);
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const user = await User.create({
            employee_id,
            email,
            password,
            full_name,
            user_level: parseInt(user_level),
            manager_id: manager_id ? parseInt(manager_id) : null,
            department_id: department_id ? parseInt(department_id) : null
        });

        await LeaveBalance.initialize(user.user_id);

        res.status(201).json({
            message: 'User created successfully',
            user: {
                user_id: user.user_id,
                employee_id: user.employee_id,
                email: user.email,
                full_name: user.full_name,
                user_level: user.user_level,
                department_id: user.department_id
            }
        });
    } catch (error) {
        console.error('Create user error:', error);
        res.status(500).json({ message: 'Failed to create user', error: error.message });
    }
});
// Get employee leave balances
router.get('/employee-balances/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const balances = await LeaveBalance.getByUserId(parseInt(userId));
        res.json({ balances });
    } catch (error) {
        console.error('Get employee balances error:', error);
        res.status(500).json({ message: 'Failed to get balances', error: error.message });
    }
});

// Initialize leave balances for an employee
router.post('/initialize-balances/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        await LeaveBalance.initialize(parseInt(userId));
        res.json({ message: 'Leave balances initialized successfully' });
    } catch (error) {
        console.error('Initialize balances error:', error);
        res.status(500).json({ message: 'Failed to initialize balances', error: error.message });
    }
});

// Update leave balance
router.put('/update-balance/:balanceId', async (req, res) => {
    try {
        const { balanceId } = req.params;
        const { total_days, used_days, available_days } = req.body;

        await LeaveBalance.updateBalanceManually(parseInt(balanceId), {
            total_days,
            used_days,
            available_days
        });

        res.json({ message: 'Leave balance updated successfully' });
    } catch (error) {
        console.error('Update balance error:', error);
        res.status(500).json({ message: 'Failed to update balance', error: error.message });
    }
});

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

router.get('/all-leaves', async (req, res) => {
    try {
        const leaves = await LeaveApplication.getAll();
        res.json({ leaves });
    } catch (error) {
        console.error('Get all leaves error:', error);
        res.status(500).json({ message: 'Failed to get leaves', error: error.message });
    }
});
// Update leave balance
router.put('/update-balance/:balanceId', async (req, res) => {
    try {
        const { balanceId } = req.params;
        const { total_days, used_days, available_days } = req.body;

        console.log('===== UPDATE BALANCE REQUEST =====');
        console.log('Balance ID:', balanceId);
        console.log('New values:', { total_days, used_days, available_days });

        const { getPool, sql } = require('../config/database');
        const pool = await getPool();

        // Check current balance
        const before = await pool.request()
            .input('balance_id', sql.Int, parseInt(balanceId))
            .query('SELECT * FROM leave_balances WHERE balance_id = @balance_id');

        console.log('Balance before update:', before.recordset[0]);

        // Update balance
        await pool.request()
            .input('balance_id', sql.Int, parseInt(balanceId))
            .input('total_days', sql.Decimal(5, 1), parseFloat(total_days))
            .input('used_days', sql.Decimal(5, 1), parseFloat(used_days))
            .input('available_days', sql.Decimal(5, 1), parseFloat(available_days))
            .query(`
                UPDATE leave_balances 
                SET total_days = @total_days,
                    used_days = @used_days,
                    available_days = @available_days
                WHERE balance_id = @balance_id
            `);

        // Check after update
        const after = await pool.request()
            .input('balance_id', sql.Int, parseInt(balanceId))
            .query('SELECT * FROM leave_balances WHERE balance_id = @balance_id');

        console.log('Balance after update:', after.recordset[0]);

        res.json({
            message: 'Leave balance updated successfully',
            before: before.recordset[0],
            after: after.recordset[0]
        });
    } catch (error) {
        console.error('Update balance error:', error);
        res.status(500).json({ message: 'Failed to update balance', error: error.message });
    }
});

module.exports = router;