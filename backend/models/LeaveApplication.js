const { getPool, sql } = require('../config/database');

class LeaveApplication {
    // Apply for leave
    static async create(leaveData) {
        const pool = await getPool();
        
        const result = await pool.request()
            .input('user_id', sql.Int, leaveData.user_id)
            .input('leave_type_id', sql.Int, leaveData.leave_type_id)
            .input('leave_category', sql.NVarChar, leaveData.leave_category)
            .input('start_date', sql.Date, leaveData.start_date)
            .input('end_date', sql.Date, leaveData.end_date || null)
            .input('half_day_period', sql.NVarChar, leaveData.half_day_period || null)
            .input('short_leave_start_time', sql.Time, leaveData.short_leave_start_time || null)
            .input('short_leave_end_time', sql.Time, leaveData.short_leave_end_time || null)
            .input('total_days', sql.Decimal(5, 1), leaveData.total_days)
            .input('reason', sql.NVarChar, leaveData.reason)
            .query(`
                INSERT INTO leave_applications 
                (user_id, leave_type_id, leave_category, start_date, end_date, 
                 half_day_period, short_leave_start_time, short_leave_end_time, 
                 total_days, reason, status)
                OUTPUT INSERTED.*
                VALUES (@user_id, @leave_type_id, @leave_category, @start_date, @end_date,
                        @half_day_period, @short_leave_start_time, @short_leave_end_time,
                        @total_days, @reason, 'Pending')
            `);
        
        return result.recordset[0];
    }

    // Get all leave applications (for HR)
    static async getAll() {
        const pool = await getPool();
        
        const result = await pool.request().query(`
            SELECT 
                la.*,
                u.full_name as employee_name,
                u.email as employee_email,
                lt.leave_type_name,
                approver.full_name as approver_name
            FROM leave_applications la
            JOIN users u ON la.user_id = u.user_id
            JOIN leave_types lt ON la.leave_type_id = lt.leave_type_id
            LEFT JOIN users approver ON la.approved_by = approver.user_id
            ORDER BY la.created_at DESC
        `);
        
        return result.recordset;
    }

    // Get leave applications by user
    static async getByUserId(userId) {
        const pool = await getPool();
        
        const result = await pool.request()
            .input('user_id', sql.Int, userId)
            .query(`
                SELECT 
                    la.*,
                    lt.leave_type_name,
                    approver.full_name as approver_name
                FROM leave_applications la
                JOIN leave_types lt ON la.leave_type_id = lt.leave_type_id
                LEFT JOIN users approver ON la.approved_by = approver.user_id
                WHERE la.user_id = @user_id
                ORDER BY la.created_at DESC
            `);
        
        return result.recordset;
    }

    // Get pending leaves for manager (their team members)
    static async getPendingByManager(managerId) {
        const pool = await getPool();
        
        const result = await pool.request()
            .input('manager_id', sql.Int, managerId)
            .query(`
                SELECT 
                    la.*,
                    u.full_name as employee_name,
                    u.email as employee_email,
                    lt.leave_type_name
                FROM leave_applications la
                JOIN users u ON la.user_id = u.user_id
                JOIN leave_types lt ON la.leave_type_id = lt.leave_type_id
                WHERE u.manager_id = @manager_id AND la.status = 'Pending'
                ORDER BY la.created_at DESC
            `);
        
        return result.recordset;
    }

    // Get all leaves for manager's team
    static async getTeamLeaves(managerId) {
        const pool = await getPool();
        
        const result = await pool.request()
            .input('manager_id', sql.Int, managerId)
            .query(`
                SELECT 
                    la.*,
                    u.full_name as employee_name,
                    u.email as employee_email,
                    lt.leave_type_name,
                    approver.full_name as approver_name
                FROM leave_applications la
                JOIN users u ON la.user_id = u.user_id
                JOIN leave_types lt ON la.leave_type_id = lt.leave_type_id
                LEFT JOIN users approver ON la.approved_by = approver.user_id
                WHERE u.manager_id = @manager_id
                ORDER BY la.created_at DESC
            `);
        
        return result.recordset;
    }

    // Approve leave
    static async approve(applicationId, approverId) {
        const pool = await getPool();
        
        await pool.request()
            .input('application_id', sql.Int, applicationId)
            .input('approved_by', sql.Int, approverId)
            .query(`
                UPDATE leave_applications 
                SET status = 'Approved', 
                    approved_by = @approved_by, 
                    approved_at = GETDATE()
                WHERE application_id = @application_id
            `);
        
        return { message: 'Leave approved successfully' };
    }

    // Reject leave
    static async reject(applicationId, approverId, rejectionReason) {
        const pool = await getPool();
        
        await pool.request()
            .input('application_id', sql.Int, applicationId)
            .input('approved_by', sql.Int, approverId)
            .input('rejection_reason', sql.NVarChar, rejectionReason)
            .query(`
                UPDATE leave_applications 
                SET status = 'Rejected', 
                    approved_by = @approved_by, 
                    approved_at = GETDATE(),
                    rejection_reason = @rejection_reason
                WHERE application_id = @application_id
            `);
        
        return { message: 'Leave rejected successfully' };
    }

    // Get leave by ID
    static async getById(applicationId) {
        const pool = await getPool();
        
        const result = await pool.request()
            .input('application_id', sql.Int, applicationId)
            .query(`
                SELECT 
                    la.*,
                    u.full_name as employee_name,
                    u.email as employee_email,
                    lt.leave_type_name,
                    approver.full_name as approver_name
                FROM leave_applications la
                JOIN users u ON la.user_id = u.user_id
                JOIN leave_types lt ON la.leave_type_id = lt.leave_type_id
                LEFT JOIN users approver ON la.approved_by = approver.user_id
                WHERE la.application_id = @application_id
            `);
        
        return result.recordset[0];
    }
}

module.exports = LeaveApplication;