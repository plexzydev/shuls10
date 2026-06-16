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

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3001;

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

// Middleware
app.use(cors({
    origin: function(origin, callback) {
        // Permitir requests sin origin (extensiones, curl, etc)
        if (!origin) return callback(null, true);
        // Permitir localhost, extensiones de Chrome, y kick.com (para content script)
        if (origin.startsWith('http://localhost') || 
            origin.startsWith('chrome-extension://') ||
            origin.startsWith('https://kick.com')) {
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

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Stream monitor - acumular puntos a usuarios activos
const StreamMonitor = require('./services/streamMonitor');
const streamMonitor = new StreamMonitor(prisma);
streamMonitor.start();

app.listen(PORT, () => {
    console.log(`🚀 Backend corriendo en http://localhost:${PORT}`);
    console.log(`📊 Monitoreando canal: ${process.env.KICK_CHANNEL_SLUG || 'shuls10'}`);
});

// Graceful shutdown
process.on('SIGINT', async () => {
    streamMonitor.stop();
    await prisma.$disconnect();
    process.exit(0);
});
