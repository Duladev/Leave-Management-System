const { getPool, sql } = require('../config/database');

class LeaveBalance {
    // Get user's leave balances with proper error handling
    static async getByUserId(userId) {
        const pool = await getPool();
        const year = new Date().getFullYear();

        try {
            console.log('Getting balances for user:', userId, 'year:', year);

            const result = await pool.request()
                .input('user_id', sql.Int, userId)
                .input('year', sql.Int, year)
                .query(`
                    SELECT 
                        lb.balance_id,
                        lb.user_id,
                        lb.leave_type_id,
                        lb.total_days,
                        lb.used_days,
                        lb.available_days,
                        lb.year,
                        lt.leave_type_name,
                        lt.description
                    FROM leave_balances lb
                    JOIN leave_types lt ON lb.leave_type_id = lt.leave_type_id
                    WHERE lb.user_id = @user_id AND lb.year = @year
                    ORDER BY lb.leave_type_id
                `);

            console.log('Balances query result:', result.recordset.length, 'records');

            // If no balances found, initialize them
            if (result.recordset.length === 0) {
                console.log('No balances found, initializing for user:', userId);
                await this.initialize(userId);
                // Fetch again after initialization
                return await this.getByUserId(userId);
            }

            return result.recordset;
        } catch (error) {
            console.error('Error fetching leave balances:', error);
            throw error;
        }
    }

    // Initialize leave balances for new user - FIXED VERSION
    static async initialize(userId) {
        const pool = await getPool();
        const year = new Date().getFullYear();

        try {
            console.log('Initializing balances for user:', userId, 'year:', year);

            // Verify user exists before initializing balances
            const userCheck = await pool.request()
                .input('user_id', sql.Int, userId)
                .query('SELECT user_id FROM users WHERE user_id = @user_id');

            if (userCheck.recordset.length === 0) {
                throw new Error(`User with ID ${userId} not found in database. Cannot initialize balances.`);
            }

            console.log('User verified, checking existing balances...');

            // Check if balances already exist
            const existing = await pool.request()
                .input('user_id', sql.Int, userId)
                .input('year', sql.Int, year)
                .query('SELECT * FROM leave_balances WHERE user_id = @user_id AND year = @year');

            if (existing.recordset.length > 0) {
                console.log('Balances already exist for user:', userId);
                return existing.recordset;
            }

            // Get all leave types
            const leaveTypes = await pool.request()
                .query('SELECT leave_type_id, leave_type_name FROM leave_types ORDER BY leave_type_id');

            if (leaveTypes.recordset.length === 0) {
                throw new Error('No leave types found in database. Please contact administrator.');
            }

            console.log('Found leave types:', leaveTypes.recordset.length);

            // Insert balances for each leave type
            for (const leaveType of leaveTypes.recordset) {
                console.log('Creating balance for leave type:', leaveType.leave_type_name);

                await pool.request()
                    .input('user_id', sql.Int, userId)
                    .input('leave_type_id', sql.Int, leaveType.leave_type_id)
                    .input('total_days', sql.Decimal(5, 1), 20.0)
                    .input('used_days', sql.Decimal(5, 1), 0.0)
                    .input('available_days', sql.Decimal(5, 1), 20.0)
                    .input('year', sql.Int, year)
                    .query(`
                        INSERT INTO leave_balances (user_id, leave_type_id, total_days, used_days, available_days, year)
                        VALUES (@user_id, @leave_type_id, @total_days, @used_days, @available_days, @year)
                    `);

                console.log('Balance created for leave type:', leaveType.leave_type_name);
            }

            console.log('Leave balances initialized successfully for user:', userId);
            return await this.getByUserId(userId);
        } catch (error) {
            console.error('Error initializing leave balances:', error);
            throw error;
        }
    }

    // Update leave balance after approval (deduct days)
    static async updateBalance(userId, leaveTypeId, days) {
        const pool = await getPool();
        const year = new Date().getFullYear();

        try {
            // First check current balance
            const currentBalance = await pool.request()
                .input('user_id', sql.Int, userId)
                .input('leave_type_id', sql.Int, leaveTypeId)
                .input('year', sql.Int, year)
                .query(`
                    SELECT balance_id, total_days, used_days, available_days 
                    FROM leave_balances 
                    WHERE user_id = @user_id 
                      AND leave_type_id = @leave_type_id 
                      AND year = @year
                `);

            if (currentBalance.recordset.length === 0) {
                throw new Error('Leave balance not found');
            }

            const balance = currentBalance.recordset[0];
            const newUsedDays = parseFloat(balance.used_days) + parseFloat(days);
            const newAvailableDays = parseFloat(balance.total_days) - newUsedDays;

            // Update the balance
            await pool.request()
                .input('balance_id', sql.Int, balance.balance_id)
                .input('used_days', sql.Decimal(5, 1), newUsedDays)
                .input('available_days', sql.Decimal(5, 1), newAvailableDays)
                .query(`
                    UPDATE leave_balances 
                    SET used_days = @used_days,
                        available_days = @available_days
                    WHERE balance_id = @balance_id
                `);

            console.log(`Balance updated: User ${userId}, Type ${leaveTypeId}, Days ${days}`);
            console.log(`New values - Used: ${newUsedDays}, Available: ${newAvailableDays}`);
        } catch (error) {
            console.error('Error updating leave balance:', error);
            throw error;
        }
    }

    // Restore leave balance (for rejected/cancelled leaves)
    static async restoreBalance(userId, leaveTypeId, days) {
        const pool = await getPool();
        const year = new Date().getFullYear();

        try {
            // First check current balance
            const currentBalance = await pool.request()
                .input('user_id', sql.Int, userId)
                .input('leave_type_id', sql.Int, leaveTypeId)
                .input('year', sql.Int, year)
                .query(`
                    SELECT balance_id, total_days, used_days, available_days 
                    FROM leave_balances 
                    WHERE user_id = @user_id 
                      AND leave_type_id = @leave_type_id 
                      AND year = @year
                `);

            if (currentBalance.recordset.length === 0) {
                throw new Error('Leave balance not found');
            }

            const balance = currentBalance.recordset[0];
            const newUsedDays = Math.max(0, parseFloat(balance.used_days) - parseFloat(days));
            const newAvailableDays = parseFloat(balance.total_days) - newUsedDays;

            // Update the balance
            await pool.request()
                .input('balance_id', sql.Int, balance.balance_id)
                .input('used_days', sql.Decimal(5, 1), newUsedDays)
                .input('available_days', sql.Decimal(5, 1), newAvailableDays)
                .query(`
                    UPDATE leave_balances 
                    SET used_days = @used_days,
                        available_days = @available_days
                    WHERE balance_id = @balance_id
                `);

            console.log(`Balance restored: User ${userId}, Type ${leaveTypeId}, Days ${days}`);
            console.log(`New values - Used: ${newUsedDays}, Available: ${newAvailableDays}`);
        } catch (error) {
            console.error('Error restoring leave balance:', error);
            throw error;
        }
    }

    // Update balance manually (for HR)
    static async updateBalanceManually(balanceId, balanceData) {
        const pool = await getPool();

        try {
            await pool.request()
                .input('balance_id', sql.Int, balanceId)
                .input('total_days', sql.Decimal(5, 1), parseFloat(balanceData.total_days))
                .input('used_days', sql.Decimal(5, 1), parseFloat(balanceData.used_days))
                .input('available_days', sql.Decimal(5, 1), parseFloat(balanceData.available_days))
                .query(`
                    UPDATE leave_balances 
                    SET total_days = @total_days,
                        used_days = @used_days,
                        available_days = @available_days
                    WHERE balance_id = @balance_id
                `);

            console.log(`Balance manually updated: Balance ID ${balanceId}`);
        } catch (error) {
            console.error('Error manually updating balance:', error);
            throw error;
        }
    }

    // Check if user has sufficient balance
    static async checkSufficientBalance(userId, leaveTypeId, daysRequired) {
        const pool = await getPool();
        const year = new Date().getFullYear();

        try {
            const result = await pool.request()
                .input('user_id', sql.Int, userId)
                .input('leave_type_id', sql.Int, leaveTypeId)
                .input('year', sql.Int, year)
                .query(`
                    SELECT available_days 
                    FROM leave_balances 
                    WHERE user_id = @user_id 
                      AND leave_type_id = @leave_type_id 
                      AND year = @year
                `);

            if (result.recordset.length === 0) {
                return { sufficient: false, available: 0 };
            }

            const availableDays = parseFloat(result.recordset[0].available_days);
            return {
                sufficient: availableDays >= daysRequired,
                available: availableDays
            };
        } catch (error) {
            console.error('Error checking balance:', error);
            throw error;
        }
    }
}

module.exports = LeaveBalance;