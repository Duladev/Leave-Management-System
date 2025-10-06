const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');

router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        console.log('Login attempt:', email);

        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required' });
        }

        const user = await User.findByEmail(email);
        if (!user) {
            console.log('User not found:', email);
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        // TEMPORARY: Skip password verification
        // const isValidPassword = await User.verifyPassword(password, user.password_hash);
        // if (!isValidPassword) {
        //     return res.status(401).json({ message: 'Invalid email or password' });
        // }

        const token = jwt.sign(
            {
                user_id: user.user_id,
                employee_id: user.employee_id,
                email: user.email,
                user_level: user.user_level
            },
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: '24h' }
        );

        console.log('Login successful:', email);

        res.json({
            message: 'Login successful',
            token,
            user: {
                user_id: user.user_id,
                employee_id: user.employee_id,
                email: user.email,
                full_name: user.full_name,
                user_level: user.user_level
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Login failed', error: error.message });
    }
});

module.exports = router;