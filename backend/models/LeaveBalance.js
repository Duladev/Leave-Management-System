const { getPool, sql } = require('../config/database');

class LeaveBalance {
    // Get user's leave balances
    static async getByUserId(userId) {
        const pool = await getPool();

        const result = await pool.request()
            .input('user_id', sql.Int, userId)
            .input('year', sql.Int, new Date().getFullYear())
            .query(`
                SELECT 
                    lb.*,
                    lt.leave_type_name,
                    lt.description
                FROM leave_balances lb
                JOIN leave_types lt ON lb.leave_type_id = lt.leave_type_id
                WHERE lb.user_id = @user_id AND lb.year = @year
            `);

        return result.recordset;
    }

    // Initialize leave balances for new user
    static async initialize(userId) {
        const pool = await getPool();
        const year = new Date().getFullYear();

        await pool.request()
            .input('user_id', sql.Int, userId)
            .input('year', sql.Int, year)
            .query(`
                INSERT INTO leave_balances (user_id, leave_type_id, total_days, used_days, available_days, year)
                SELECT @user_id, leave_type_id, 20.0, 0, 20.0, @year
                FROM leave_types
            `);
    }

    // Update leave balance after approval
    static async updateBalance(userId, leaveTypeId, days) {
        const pool = await getPool();
        const year = new Date().getFullYear();

        await pool.request()
            .input('user_id', sql.Int, userId)
            .input('leave_type_id', sql.Int, leaveTypeId)
            .input('days', sql.Decimal(5, 1), days)
            .input('year', sql.Int, year)
            .query(`
                UPDATE leave_balances 
                SET used_days = used_days + @days,
                    available_days = total_days - (used_days + @days)
                WHERE user_id = @user_id 
                  AND leave_type_id = @leave_type_id 
                  AND year = @year
            `);
    }
    // Add this method to the LeaveBalance class
    static async updateBalanceManually(balanceId, balanceData) {
        const pool = await getPool();

        await pool.request()
            .input('balance_id', sql.Int, balanceId)
            .input('total_days', sql.Decimal(5, 1), balanceData.total_days)
            .input('used_days', sql.Decimal(5, 1), balanceData.used_days)
            .input('available_days', sql.Decimal(5, 1), balanceData.available_days)
            .query(`
            UPDATE leave_balances 
            SET total_days = @total_days,
                used_days = @used_days,
                available_days = @available_days
            WHERE balance_id = @balance_id
        `);
    }
}

module.exports = LeaveBalance;