const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Test route
app.get('/', (req, res) => {
    res.json({ message: 'Leave Management System Backend is Running!' });
});

// Test database connection
app.get('/test-db', async (req, res) => {
    try {
        const { getPool, sql } = require('./config/database');
        console.log('Attempting database connection...');

        const pool = await getPool();
        const result = await pool.request()
            .query('SELECT COUNT(*) as count FROM users');

        console.log('Database query successful!');
        res.json({
            message: 'Database connected successfully!',
            users_count: result.recordset[0].count
        });
    } catch (error) {
        console.error('Database Error Details:', error);
        res.status(500).json({
            message: 'Database connection failed',
            error: error.message
        });
    }
});

const PORT = process.env.PORT || 3300;

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});