const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();

// Middleware - MUST be before routes
app.use(cors());
app.use(express.json());

// Test route
app.get('/', (req, res) => {
    res.json({ message: 'Leave Management System Backend is Running!' });
});

// Test database connection
app.get('/test-db', async (req, res) => {
    try {
        const { getPool } = require('./config/database');
        const pool = await getPool();
        const result = await pool.request().query('SELECT COUNT(*) as count FROM users');
        res.json({
            message: 'Database connected successfully!',
            users_count: result.recordset[0].count
        });
    } catch (error) {
        res.status(500).json({
            message: 'Database connection failed',
            error: error.message
        });
    }
});

// Import routes
const authRoutes = require('./routes/auth');
const employeeRoutes = require('./routes/employee');
const managerRoutes = require('./routes/manager');
const hrRoutes = require('./routes/hr');

// Register routes
app.use('/api/auth', authRoutes);
app.use('/api/employee', employeeRoutes);
app.use('/api/manager', managerRoutes);
app.use('/api/hr', hrRoutes);



const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});