const express = require('express');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Obtener perfil del usuario autenticado
router.get('/me', authenticateToken, async (req, res) => {
    const prisma = req.app.get('prisma');

    try {
        const user = await prisma.user.findUnique({
            where: { id: req.user.userId },
            select: {
                id: true,
                kickUsername: true,
                twitchUsername: true,
                displayName: true,
                avatar: true,
                kickRole: true,
                points: true,
                totalWatchTime: true,
                currentStreak: true,
                longestStreak: true,
                twitchPointsClaimed: true,
                twitchPointsAmount: true,
                discordId: true,
                discordUsername: true,
                streamNotify: true,
                createdAt: true
            }
        });

        if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });

        res.json({ user: { ...user, discordLinked: !!user.discordId, twitchLinked: !!user.twitchUsername } });
    } catch (error) {
        console.error('Error obteniendo perfil:', error);
        res.status(500).json({ error: 'Error interno' });
    }
});

// Obtener stats del usuario
router.get('/me/stats', authenticateToken, async (req, res) => {
    const prisma = req.app.get('prisma');

    try {
        const user = await prisma.user.findUnique({
            where: { id: req.user.userId }
        });

        if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });

        // Últimas sesiones
        const recentSessions = await prisma.watchSession.findMany({
            where: { userId: user.id },
            orderBy: { startTime: 'desc' },
            take: 10
        });

        // Total de claims
        const totalClaims = await prisma.rewardClaim.count({
            where: { userId: user.id }
        });

        res.json({
            points: user.points,
            totalWatchTime: user.totalWatchTime,
            totalWatchTimeFormatted: formatWatchTime(user.totalWatchTime),
            currentStreak: user.currentStreak,
            longestStreak: user.longestStreak,
            totalClaims,
            recentSessions: recentSessions.map(s => ({
                date: s.startTime,
                duration: s.duration,
                durationFormatted: formatWatchTime(s.duration)
            }))
        });
    } catch (error) {
        console.error('Error obteniendo stats:', error);
        res.status(500).json({ error: 'Error interno' });
    }
});

// Leaderboard - only real OAuth users
router.get('/leaderboard', async (req, res) => {
    const prisma = req.app.get('prisma');
    const sortBy = req.query.sortBy || 'points';
    const orderMap = {
        points: { points: 'desc' },
        watchTime: { totalWatchTime: 'desc' },
        streak: { longestStreak: 'desc' },
    };

    try {
        const users = await prisma.user.findMany({
            where: { kickUserId: { not: null } },
            orderBy: orderMap[sortBy] || { points: 'desc' },
            take: 50,
            select: {
                kickUsername: true,
                displayName: true,
                avatar: true,
                kickRole: true,
                points: true,
                totalWatchTime: true,
                currentStreak: true,
                longestStreak: true
            }
        });

        res.json({
            leaderboard: users.map(u => ({
                ...u,
                totalWatchTimeFormatted: formatWatchTime(u.totalWatchTime)
            }))
        });
    } catch (error) {
        console.error('Error obteniendo leaderboard:', error);
        res.status(500).json({ error: 'Error interno' });
    }
});

function formatWatchTime(minutes) {
    if (!minutes || minutes === 0) return '0m';
    const days = Math.floor(minutes / 1440);
    const hours = Math.floor((minutes % 1440) / 60);
    const mins = minutes % 60;
    const parts = [];
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0) parts.push(`${hours}h`);
    if (mins > 0) parts.push(`${mins}m`);
    return parts.join(' ') || '0m';
}

function formatWatchTimeDetailed(minutes) {
    if (!minutes || minutes === 0) return { days: 0, hours: 0, minutes: 0, formatted: '0m' };
    const days = Math.floor(minutes / 1440);
    const hours = Math.floor((minutes % 1440) / 60);
    const mins = minutes % 60;
    return { days, hours, minutes: mins, formatted: formatWatchTime(minutes) };
}

// Update user role (admin endpoint)
router.post('/role', authenticateToken, async (req, res) => {
    const prisma = req.app.get('prisma');
    const { targetUsername, role } = req.body;

    const validRoles = ['viewer', 'subscriber', 'vip', 'moderator', 'broadcaster'];
    if (!validRoles.includes(role)) {
        return res.status(400).json({ error: 'Rol inválido' });
    }

    // Check if requester is broadcaster or moderator
    const requester = await prisma.user.findUnique({ where: { id: req.user.userId } });
    if (!requester || !['broadcaster', 'moderator'].includes(requester.kickRole)) {
        return res.status(403).json({ error: 'Sin permisos' });
    }

    try {
        const updated = await prisma.user.update({
            where: { kickUsername: targetUsername.toLowerCase() },
            data: { kickRole: role }
        });
        res.json({ success: true, user: { kickUsername: updated.kickUsername, kickRole: updated.kickRole } });
    } catch (error) {
        res.status(404).json({ error: 'Usuario no encontrado' });
    }
});

// Bulk sync roles (admin endpoint)
router.post('/roles/sync', authenticateToken, async (req, res) => {
    const prisma = req.app.get('prisma');
    const { roles } = req.body; // [{ username: 'user1', role: 'moderator' }, ...]

    const requester = await prisma.user.findUnique({ where: { id: req.user.userId } });
    if (!requester || requester.kickRole !== 'broadcaster') {
        return res.status(403).json({ error: 'Solo el broadcaster puede sincronizar roles' });
    }

    const validRoles = ['viewer', 'subscriber', 'vip', 'moderator', 'broadcaster'];
    let updated = 0;

    for (const { username, role } of roles) {
        if (!validRoles.includes(role)) continue;
        try {
            await prisma.user.updateMany({
                where: { kickUsername: username.toLowerCase() },
                data: { kickRole: role }
            });
            updated++;
        } catch (e) {}
    }

    res.json({ success: true, updated });
});

// Mod/Broadcaster: Add or remove points from a user
router.post('/points', authenticateToken, async (req, res) => {
    const prisma = req.app.get('prisma');
    const requester = await prisma.user.findUnique({ where: { id: req.user.userId } });
    if (!requester || !['broadcaster', 'moderator'].includes(requester.kickRole)) {
        return res.status(403).json({ error: 'Sin permisos' });
    }

    const { username, amount, action } = req.body;
    if (!username || !amount || !['add', 'remove'].includes(action)) {
        return res.status(400).json({ error: 'username, amount, y action (add/remove) requeridos' });
    }

    try {
        const target = await prisma.user.findUnique({ where: { kickUsername: username.toLowerCase() } });
        if (!target) return res.status(404).json({ error: 'Usuario no encontrado' });

        const pts = Math.abs(parseInt(amount));
        if (action === 'add') {
            await prisma.user.update({ where: { id: target.id }, data: { points: { increment: pts } } });
        } else {
            const newPts = Math.max(0, target.points - pts);
            await prisma.user.update({ where: { id: target.id }, data: { points: newPts } });
        }

        res.json({ success: true, username, action, amount: pts });
    } catch (error) {
        res.status(500).json({ error: 'Error modificando puntos' });
    }
});

// Claim gift drop (30-50 random points, 60s cooldown)
const giftCooldowns = new Map();
router.post('/gift-claim', authenticateToken, async (req, res) => {
    const prisma = req.app.get('prisma');
    const userId = req.user.userId;

    // Check cooldown (60 seconds)
    const lastClaim = giftCooldowns.get(userId);
    if (lastClaim && Date.now() - lastClaim < 60000) {
        return res.status(429).json({ error: 'Esperá antes de reclamar otro regalo' });
    }

    try {
        const amount = Math.floor(Math.random() * 21) + 30; // 30-50
        await prisma.user.update({
            where: { id: userId },
            data: { points: { increment: amount } }
        });
        giftCooldowns.set(userId, Date.now());
        res.json({ success: true, amount });
    } catch (error) {
        res.status(500).json({ error: 'Error reclamando regalo' });
    }
});

module.exports = router;
