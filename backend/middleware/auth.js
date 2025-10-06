const jwt = require('jsonwebtoken');

const authMiddleware = async (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');

        if (!token) {
            return res.status(401).json({ message: 'Authentication required' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
        req.user = decoded;
        next();
    } catch (error) {
        res.status(401).json({ message: 'Invalid token' });
    }
};

// Check user level access
const checkLevel = (...allowedLevels) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ message: 'Authentication required' });
        }

        if (!allowedLevels.includes(req.user.user_level)) {
            return res.status(403).json({
                message: 'Access denied',
                your_level: req.user.user_level,
                required_level: allowedLevels
            });
        }

        next();
    };
};

module.exports = { authMiddleware, checkLevel };