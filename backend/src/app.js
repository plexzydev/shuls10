require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { PrismaClient } = require('@prisma/client');

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const rewardRoutes = require('./routes/rewards');
const streamRoutes = require('./routes/stream');
const extensionRoutes = require('./routes/extension');
const challengeRoutes = require('./routes/challenges');
const clipRoutes = require('./routes/clips');
const profileRoutes = require('./routes/profile');
const badgeRoutes = require('./routes/badges');
const openrouterRoutes = require('./routes/openrouter');

const app = express();
const prisma = new PrismaClient();

// Security headers
app.use(helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    contentSecurityPolicy: false
}));

// Rate limiting - general
const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 300, // 300 requests per 15 min per IP
    message: { error: 'Demasiadas solicitudes, intenta de nuevo más tarde' },
    standardHeaders: true,
    legacyHeaders: false
});
app.use(generalLimiter);

// Strict rate limiting for auth routes
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20, // 20 auth attempts per 15 min
    message: { error: 'Demasiados intentos de autenticación' },
    standardHeaders: true,
    legacyHeaders: false
});

// Allowed origins for CORS
const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:3000',
    'https://shuls10.vercel.app',
];

// Add custom FRONTEND_URL if set
if (process.env.FRONTEND_URL && !allowedOrigins.includes(process.env.FRONTEND_URL)) {
    allowedOrigins.push(process.env.FRONTEND_URL);
}

// Middleware
app.use(cors({
    origin: function(origin, callback) {
        // Permitir requests sin origin (extensiones, curl, etc)
        if (!origin) return callback(null, true);
        // Permitir localhost, extensiones de Chrome, kick.com, y dominios de producción
        if (origin.startsWith('http://localhost') || 
            origin.startsWith('chrome-extension://') ||
            origin.startsWith('https://kick.com') ||
            allowedOrigins.includes(origin) ||
            origin.endsWith('.vercel.app')) {
            return callback(null, true);
        }
        callback(null, false);
    },
    credentials: true
}));
app.use(express.json({ limit: '1mb' }));

// Hacer prisma accesible en las rutas
app.set('prisma', prisma);

// Routes
app.use('/auth', authLimiter, authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/rewards', rewardRoutes);
app.use('/api/stream', streamRoutes);
app.use('/api/extension', extensionRoutes);
app.use('/api/challenges', challengeRoutes);
app.use('/api/clips', clipRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/badges', badgeRoutes);
app.use('/api/openrouter', openrouterRoutes);

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Export the app for Vercel serverless
module.exports = app;
