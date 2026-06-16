const express = require('express');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Listar rewards disponibles
router.get('/', async (req, res) => {
    const prisma = req.app.get('prisma');

    try {
        const rewards = await prisma.reward.findMany({
            where: { available: true },
            orderBy: { cost: 'asc' },
            include: {
                claims: {
                    orderBy: { createdAt: 'desc' },
                    take: 10,
                    include: {
                        user: { select: { kickUsername: true, displayName: true, avatar: true } }
                    }
                }
            }
        });

        // Map claimers and count
        const rewardsWithClaimers = rewards.map(r => ({
            ...r,
            claimCount: r.claims.length,
            claimers: r.claims.map(c => ({
                username: c.user.displayName || c.user.kickUsername,
                avatar: c.user.avatar
            })),
            claims: undefined
        }));

        res.json({ rewards: rewardsWithClaimers });
    } catch (error) {
        console.error('Error obteniendo rewards:', error);
        res.status(500).json({ error: 'Error interno' });
    }
});

// Reclamar un reward
router.post('/:id/claim', authenticateToken, async (req, res) => {
    const prisma = req.app.get('prisma');
    const { id } = req.params;

    try {
        const user = await prisma.user.findUnique({
            where: { id: req.user.userId }
        });

        if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });

        const reward = await prisma.reward.findUnique({
            where: { id }
        });

        if (!reward) return res.status(404).json({ error: 'Reward no encontrado' });
        if (!reward.available) return res.status(400).json({ error: 'Reward no disponible' });
        if (reward.stock === 0) return res.status(400).json({ error: 'Reward agotado' });
        if (user.points < reward.cost) {
            return res.status(400).json({ 
                error: 'Puntos insuficientes', 
                required: reward.cost, 
                current: user.points 
            });
        }

        // Descontar puntos y crear claim
        await prisma.$transaction([
            prisma.user.update({
                where: { id: user.id },
                data: { points: user.points - reward.cost }
            }),
            prisma.rewardClaim.create({
                data: {
                    userId: user.id,
                    rewardId: reward.id
                }
            }),
            // Reducir stock si no es ilimitado
            ...(reward.stock > 0 ? [
                prisma.reward.update({
                    where: { id: reward.id },
                    data: { stock: reward.stock - 1 }
                })
            ] : [])
        ]);

        res.json({
            success: true,
            message: `¡Reclamaste "${reward.name}"!`,
            newBalance: user.points - reward.cost
        });
    } catch (error) {
        console.error('Error reclamando reward:', error);
        res.status(500).json({ error: 'Error interno' });
    }
});

// Obtener mis claims
router.get('/my-claims', authenticateToken, async (req, res) => {
    const prisma = req.app.get('prisma');

    try {
        const claims = await prisma.rewardClaim.findMany({
            where: { userId: req.user.userId },
            include: { reward: true },
            orderBy: { createdAt: 'desc' }
        });

        res.json({ claims });
    } catch (error) {
        console.error('Error obteniendo claims:', error);
        res.status(500).json({ error: 'Error interno' });
    }
});

// ADMIN: Crear reward
router.post('/', authenticateToken, async (req, res) => {
    const prisma = req.app.get('prisma');
    const { name, description, cost, image, stock } = req.body;

    const requester = await prisma.user.findUnique({ where: { id: req.user.userId } });
    if (!requester || !['broadcaster', 'moderator'].includes(requester.kickRole)) {
        return res.status(403).json({ error: 'Sin permisos' });
    }

    try {
        const reward = await prisma.reward.create({
            data: {
                name,
                description: description || '',
                cost: parseInt(cost) || 100,
                image: image || null,
                stock: parseInt(stock) ?? -1
            }
        });

        res.json({ reward });
    } catch (error) {
        console.error('Error creando reward:', error);
        res.status(500).json({ error: 'Error interno' });
    }
});

// ADMIN: Update reward
router.put('/:id', authenticateToken, async (req, res) => {
    const prisma = req.app.get('prisma');
    const requester = await prisma.user.findUnique({ where: { id: req.user.userId } });
    if (!requester || !['broadcaster', 'moderator'].includes(requester.kickRole)) {
        return res.status(403).json({ error: 'Sin permisos' });
    }
    const { name, description, cost, image, stock, available } = req.body;
    try {
        const reward = await prisma.reward.update({
            where: { id: req.params.id },
            data: {
                ...(name !== undefined && { name }),
                ...(description !== undefined && { description }),
                ...(cost !== undefined && { cost: parseInt(cost) }),
                ...(image !== undefined && { image }),
                ...(stock !== undefined && { stock: parseInt(stock) }),
                ...(available !== undefined && { available }),
            }
        });
        res.json({ success: true, reward });
    } catch (error) {
        res.status(500).json({ error: 'Error actualizando reward' });
    }
});

// ADMIN: Delete reward
router.delete('/:id', authenticateToken, async (req, res) => {
    const prisma = req.app.get('prisma');
    const requester = await prisma.user.findUnique({ where: { id: req.user.userId } });
    if (!requester || !['broadcaster', 'moderator'].includes(requester.kickRole)) {
        return res.status(403).json({ error: 'Sin permisos' });
    }
    try {
        await prisma.rewardClaim.deleteMany({ where: { rewardId: req.params.id } });
        await prisma.reward.delete({ where: { id: req.params.id } });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Error eliminando reward' });
    }
});

// ADMIN: Get all claims (for moderation)
router.get('/all-claims', authenticateToken, async (req, res) => {
    const prisma = req.app.get('prisma');
    const requester = await prisma.user.findUnique({ where: { id: req.user.userId } });
    if (!requester || !['broadcaster', 'moderator'].includes(requester.kickRole)) {
        return res.status(403).json({ error: 'Sin permisos' });
    }
    try {
        const claims = await prisma.rewardClaim.findMany({
            include: {
                reward: true,
                user: { select: { kickUsername: true, displayName: true, avatar: true } }
            },
            orderBy: { createdAt: 'desc' },
            take: 100
        });
        res.json({ claims });
    } catch (error) {
        res.status(500).json({ error: 'Error obteniendo claims' });
    }
});

// ADMIN: Accept or reject a claim
router.post('/claims/:id/resolve', authenticateToken, async (req, res) => {
    const prisma = req.app.get('prisma');
    const requester = await prisma.user.findUnique({ where: { id: req.user.userId } });
    if (!requester || !['broadcaster', 'moderator'].includes(requester.kickRole)) {
        return res.status(403).json({ error: 'Sin permisos' });
    }

    const { action } = req.body; // 'approved' or 'rejected'
    if (!['approved', 'rejected'].includes(action)) {
        return res.status(400).json({ error: 'Action must be approved or rejected' });
    }

    try {
        const claim = await prisma.rewardClaim.findUnique({
            where: { id: req.params.id },
            include: { reward: true }
        });
        if (!claim) return res.status(404).json({ error: 'Claim no encontrado' });

        // Update claim status
        await prisma.rewardClaim.update({
            where: { id: claim.id },
            data: { status: action }
        });

        // If rejected, refund points
        if (action === 'rejected') {
            await prisma.user.update({
                where: { id: claim.userId },
                data: { points: { increment: claim.reward.cost } }
            });
        }

        res.json({ success: true, action, refunded: action === 'rejected' ? claim.reward.cost : 0 });
    } catch (error) {
        res.status(500).json({ error: 'Error resolviendo claim' });
    }
});

// ADMIN: Get all rewards (including unavailable)
router.get('/admin/all', authenticateToken, async (req, res) => {
    const prisma = req.app.get('prisma');
    const requester = await prisma.user.findUnique({ where: { id: req.user.userId } });
    if (!requester || !['broadcaster', 'moderator'].includes(requester.kickRole)) {
        return res.status(403).json({ error: 'Sin permisos' });
    }
    try {
        const rewards = await prisma.reward.findMany({ orderBy: { createdAt: 'desc' } });
        res.json({ rewards });
    } catch (error) {
        res.status(500).json({ error: 'Error' });
    }
});

module.exports = router;
