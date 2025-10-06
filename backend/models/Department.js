const { getPool, sql } = require('../config/database');

class Department {
    static async getAll() {
        const pool = await getPool();
        const result = await pool.request()
            .query('SELECT * FROM departments ORDER BY department_name');
        return result.recordset;
    }

    static async create(departmentData) {
        const pool = await getPool();
        const result = await pool.request()
            .input('department_name', sql.NVarChar, departmentData.department_name)
            .input('department_code', sql.NVarChar, departmentData.department_code)
            .input('description', sql.NVarChar, departmentData.description || null)
            .query(`
                INSERT INTO departments (department_name, department_code, description)
                OUTPUT INSERTED.*
                VALUES (@department_name, @department_code, @description)
            `);
        return result.recordset[0];
    }

    static async delete(departmentId) {
        const pool = await getPool();
        await pool.request()
            .input('department_id', sql.Int, departmentId)
            .query('DELETE FROM departments WHERE department_id = @department_id');
    }

    static async update(departmentId, departmentData) {
        const pool = await getPool();
        const result = await pool.request()
            .input('department_id', sql.Int, departmentId)
            .input('department_name', sql.NVarChar, departmentData.department_name)
            .input('department_code', sql.NVarChar, departmentData.department_code)
            .input('description', sql.NVarChar, departmentData.description || null)
            .query(`
                UPDATE departments 
                SET department_name = @department_name,
                    department_code = @department_code,
                    description = @description
                OUTPUT INSERTED.*
                WHERE department_id = @department_id
            `);
        return result.recordset[0];
    }
}

module.exports = Department;