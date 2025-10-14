const express = require('express');
const cors = require('cors');
require('dotenv').config();

const { authMiddleware, checkLevel } = require('./middleware/auth');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Public routes (no authentication required)
app.use('/api/auth', require('./routes/auth'));

// Protected routes (authentication required)
app.use('/api/employee', authMiddleware, require('./routes/employee'));
app.use('/api/manager', authMiddleware, checkLevel(1, 2), require('./routes/manager'));
app.use('/api/hr', authMiddleware, checkLevel(1), require('./routes/hr'));

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'OK', message: 'Server is running' });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ message: 'Route not found' });
});

// Error handler
app.use((error, req, res, next) => {
    console.error('Global error handler:', error);
    res.status(500).json({
        message: 'Internal server error',
        error: error.message
    });
});

<<<<<<< HEAD
const PORT = process.env.PORT || 3300;
=======
const PORT = process.env.PORT || 3000;
>>>>>>> 84c639e2ce4578b0c87e67ef7e54a03925d8f354

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Public routes: /api/auth/*`);
    console.log(`Protected routes: /api/employee/*, /api/manager/*, /api/hr/*`);
});

module.exports = app;