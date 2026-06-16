const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');

// Get all badges
router.get('/', async (req, res) => {
    const prisma = req.app.get('prisma');
    try {
        const badges = await prisma.customBadge.findMany({ orderBy: { createdAt: 'desc' } });
        res.json({ badges });
    } catch (error) {
        res.status(500).json({ error: 'Error obteniendo badges' });
    }
});

// Get my badges
router.get('/me', authenticateToken, async (req, res) => {
    const prisma = req.app.get('prisma');
    try {
        const userBadges = await prisma.userBadge.findMany({
            where: { userId: req.user.userId },
            include: { badge: true }
        });
        res.json({ badges: userBadges });
    } catch (error) {
        res.status(500).json({ error: 'Error' });
    }
});

// Toggle equip badge (max 3 custom equipped)
router.post('/me/:badgeId/toggle', authenticateToken, async (req, res) => {
    const prisma = req.app.get('prisma');
    try {
        const ub = await prisma.userBadge.findUnique({
            where: { userId_badgeId: { userId: req.user.userId, badgeId: req.params.badgeId } }
        });
        if (!ub) return res.status(404).json({ error: 'No tenés esta insignia' });

        // If trying to equip, check max 3 limit
        if (!ub.equipped) {
            const equippedCount = await prisma.userBadge.count({
                where: { userId: req.user.userId, equipped: true }
            });
            if (equippedCount >= 3) {
                return res.status(400).json({ error: 'Máximo 3 insignias equipadas. Desactivá una primero.' });
            }
        }

        await prisma.userBadge.update({ where: { id: ub.id }, data: { equipped: !ub.equipped } });
        res.json({ success: true, equipped: !ub.equipped });
    } catch (error) {
        res.status(500).json({ error: 'Error' });
    }
});

// Get equipped badges for a user (for Kick chat)
router.get('/user/:username', async (req, res) => {
    const prisma = req.app.get('prisma');
    try {
        const user = await prisma.user.findUnique({ where: { kickUsername: req.params.username.toLowerCase() } });
        if (!user) return res.json({ badges: [] });
        const userBadges = await prisma.userBadge.findMany({
            where: { userId: user.id, equipped: true },
            include: { badge: true }
        });
        res.json({ badges: userBadges.map(ub => ub.badge) });
    } catch (error) {
        res.json({ badges: [] });
    }
});

// ADMIN: Create badge
router.post('/', authenticateToken, async (req, res) => {
    const prisma = req.app.get('prisma');
    const requester = await prisma.user.findUnique({ where: { id: req.user.userId } });
    if (!requester || !['broadcaster', 'moderator'].includes(requester.kickRole)) {
        return res.status(403).json({ error: 'Sin permisos' });
    }
    const { name, icon, color, description } = req.body;
    if (!name || !icon) return res.status(400).json({ error: 'name e icon requeridos' });
    try {
        const badge = await prisma.customBadge.create({
            data: { name, icon, color: color || '#52B788', description: description || '' }
        });
        res.json({ success: true, badge });
    } catch (error) {
        res.status(500).json({ error: 'Error creando badge' });
    }
});

// ADMIN: Delete badge
router.delete('/:id', authenticateToken, async (req, res) => {
    const prisma = req.app.get('prisma');
    const requester = await prisma.user.findUnique({ where: { id: req.user.userId } });
    if (!requester || !['broadcaster', 'moderator'].includes(requester.kickRole)) {
        return res.status(403).json({ error: 'Sin permisos' });
    }
    try {
        await prisma.userBadge.deleteMany({ where: { badgeId: req.params.id } });
        await prisma.customBadge.delete({ where: { id: req.params.id } });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Error eliminando badge' });
    }
});

// ADMIN: Grant badge to user
router.post('/:id/grant', authenticateToken, async (req, res) => {
    const prisma = req.app.get('prisma');
    const requester = await prisma.user.findUnique({ where: { id: req.user.userId } });
    if (!requester || !['broadcaster', 'moderator'].includes(requester.kickRole)) {
        return res.status(403).json({ error: 'Sin permisos' });
    }
    const { username } = req.body;
    if (!username) return res.status(400).json({ error: 'username requerido' });
    try {
        const target = await prisma.user.findUnique({ where: { kickUsername: username.toLowerCase() } });
        if (!target) return res.status(404).json({ error: 'Usuario no encontrado' });
        const badge = await prisma.customBadge.findUnique({ where: { id: req.params.id } });
        if (!badge) return res.status(404).json({ error: 'Badge no encontrado' });

        await prisma.userBadge.upsert({
            where: { userId_badgeId: { userId: target.id, badgeId: badge.id } },
            create: { userId: target.id, badgeId: badge.id, equipped: true },
            update: {}
        });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Error asignando badge' });
    }
});

// ADMIN: Revoke badge from user
router.post('/:id/revoke', authenticateToken, async (req, res) => {
    const prisma = req.app.get('prisma');
    const requester = await prisma.user.findUnique({ where: { id: req.user.userId } });
    if (!requester || !['broadcaster', 'moderator'].includes(requester.kickRole)) {
        return res.status(403).json({ error: 'Sin permisos' });
    }
    const { username } = req.body;
    if (!username) return res.status(400).json({ error: 'username requerido' });
    try {
        const target = await prisma.user.findUnique({ where: { kickUsername: username.toLowerCase() } });
        if (!target) return res.status(404).json({ error: 'Usuario no encontrado' });
        await prisma.userBadge.deleteMany({ where: { userId: target.id, badgeId: req.params.id } });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Error revocando badge' });
    }
});

// ADMIN: Get all users with their badges (for mod panel)
router.get('/admin/users', authenticateToken, async (req, res) => {
    const prisma = req.app.get('prisma');
    const requester = await prisma.user.findUnique({ where: { id: req.user.userId } });
    if (!requester || !['broadcaster', 'moderator'].includes(requester.kickRole)) {
        return res.status(403).json({ error: 'Sin permisos' });
    }
    try {
        const users = await prisma.user.findMany({
            select: {
                id: true,
                kickUsername: true,
                displayName: true,
                avatar: true,
                kickRole: true,
                badges: { include: { badge: true } }
            },
            orderBy: { kickUsername: 'asc' }
        });
        // Map 'badges' relation to 'userBadges' for frontend compatibility
        res.json({ users: users.map(u => ({ ...u, userBadges: u.badges })) });
    } catch (error) {
        res.status(500).json({ error: 'Error obteniendo usuarios' });
    }
});

module.exports = router;
