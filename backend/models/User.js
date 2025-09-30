const bcrypt = require('bcryptjs');
const { getPool, sql } = require('../config/database');

class User {
    static async create(userData) {
        const pool = await getPool();
        const hashedPassword = await bcrypt.hash(userData.password, 10);

        const result = await pool.request()
            .input('email', sql.NVarChar, userData.email)
            .input('password_hash', sql.NVarChar, hashedPassword)
            .input('full_name', sql.NVarChar, userData.full_name)
            .input('user_level', sql.Int, userData.user_level)
            .input('manager_id', sql.Int, userData.manager_id || null)
            .query(`
                INSERT INTO users (email, password_hash, full_name, user_level, manager_id)
                OUTPUT INSERTED.*
                VALUES (@email, @password_hash, @full_name, @user_level, @manager_id)
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
            .query('SELECT user_id, email, full_name, user_level, manager_id FROM users WHERE user_id = @user_id');

        return result.recordset[0];
    }

    static async getAll() {
        const pool = await getPool();
        const result = await pool.request()
            .query('SELECT user_id, email, full_name, user_level, manager_id, created_at FROM users ORDER BY user_level');

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

    // Helper function to get role name from level
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