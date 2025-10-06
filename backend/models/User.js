const bcrypt = require('bcryptjs');
const { getPool, sql } = require('../config/database');

class User {
    static async create(userData) {
        const pool = await getPool();
        const hashedPassword = await bcrypt.hash(userData.password, 10);

        let employee_id = userData.employee_id;
        if (!employee_id) {
            const result = await pool.request()
                .query('SELECT MAX(user_id) as max_id FROM users');
            const nextId = (result.recordset[0].max_id || 0) + 1;
            employee_id = 'EMP' + String(nextId).padStart(5, '0');
        }

        const result = await pool.request()
            .input('employee_id', sql.NVarChar, employee_id)
            .input('email', sql.NVarChar, userData.email)
            .input('password_hash', sql.NVarChar, hashedPassword)
            .input('full_name', sql.NVarChar, userData.full_name)
            .input('user_level', sql.Int, userData.user_level)
            .input('manager_id', sql.Int, userData.manager_id || null)
            .input('department_id', sql.Int, userData.department_id || null)
            .query(`
                INSERT INTO users (employee_id, email, password_hash, full_name, user_level, manager_id, department_id)
                OUTPUT INSERTED.*
                VALUES (@employee_id, @email, @password_hash, @full_name, @user_level, @manager_id, @department_id)
            `);

        return result.recordset[0];
    }

    static async findByEmail(email) {
        const pool = await getPool();
        const result = await pool.request()
            .input('email', sql.NVarChar, email)
            .query('SELECT * FROM users WHERE email = @email');

        return result.recordset[0];
    }

    static async findById(userId) {
        const pool = await getPool();
        const result = await pool.request()
            .input('user_id', sql.Int, userId)
            .query('SELECT user_id, employee_id, email, full_name, user_level, manager_id, department_id FROM users WHERE user_id = @user_id');

        return result.recordset[0];
    }

    static async getAll() {
        const pool = await getPool();
        const result = await pool.request()
            .query(`
                SELECT 
                    u.user_id, 
                    u.employee_id, 
                    u.email, 
                    u.full_name, 
                    u.user_level, 
                    u.manager_id, 
                    u.department_id,
                    u.created_at,
                    d.department_name,
                    d.department_code
                FROM users u
                LEFT JOIN departments d ON u.department_id = d.department_id
                ORDER BY u.user_id
            `);

        return result.recordset;
    }

    static async updateManager(userId, managerId) {
        const pool = await getPool();
        await pool.request()
            .input('user_id', sql.Int, userId)
            .input('manager_id', sql.Int, managerId)
            .query('UPDATE users SET manager_id = @manager_id WHERE user_id = @user_id');
    }

    static async verifyPassword(plainPassword, hashedPassword) {
        return await bcrypt.compare(plainPassword, hashedPassword);
    }

    static getRoleName(level) {
        const roles = {
            1: 'HR',
            2: 'Manager',
            3: 'Employee'
        };
        return roles[level] || 'Unknown';
    }
}

module.exports = User;