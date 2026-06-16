const jwt = require('jsonwebtoken');

// In-memory token blacklist (use Redis in production)
const tokenBlacklist = new Set();

function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Token requerido' });
    }

    if (tokenBlacklist.has(token)) {
        return res.status(401).json({ error: 'Sesión cerrada' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(403).json({ error: 'Token inválido' });
    }
}

function optionalAuth(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.user = decoded;
        } catch (error) {
            // Token inválido, continuar sin auth
        }
    }
    next();
}

module.exports = { authenticateToken, optionalAuth, tokenBlacklist };
