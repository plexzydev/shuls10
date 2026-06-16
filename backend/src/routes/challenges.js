const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');

// Get all active challenges with user progress
router.get('/', authenticateToken, async (req, res) => {
    const prisma = req.app.get('prisma');
    try {
        const challenges = await prisma.challenge.findMany({
            where: { active: true },
            orderBy: { createdAt: 'desc' },
            include: {
                userChallenges: {
                    where: { userId: req.user.userId }
                }
            }
        });

        // Get completers for each challenge (users who completed it)
        const challengeIds = challenges.map(c => c.id);
        const allCompleters = await prisma.userChallenge.findMany({
            where: { challengeId: { in: challengeIds }, completed: true },
            include: { user: { select: { kickUsername: true, displayName: true, avatar: true } } },
            orderBy: { completedAt: 'desc' },
            take: 50
        });

        // Group completers by challenge
        const completersByChallenge = {};
        for (const uc of allCompleters) {
            if (!completersByChallenge[uc.challengeId]) completersByChallenge[uc.challengeId] = [];
            completersByChallenge[uc.challengeId].push({
                username: uc.user.displayName || uc.user.kickUsername,
                avatar: uc.user.avatar
            });
        }

        const result = challenges.map(c => ({
            id: c.id,
            title: c.title,
            description: c.description,
            type: c.type,
            goal: c.goal,
            metric: c.metric,
            reward: c.reward,
            badgeReward: c.badgeReward,
            startsAt: c.startsAt,
            endsAt: c.endsAt,
            progress: c.userChallenges[0]?.progress || 0,
            completed: c.userChallenges[0]?.completed || false,
            claimed: c.userChallenges[0]?.claimed || false,
            completedAt: c.userChallenges[0]?.completedAt || null,
            completers: completersByChallenge[c.id] || [],
            completedCount: (completersByChallenge[c.id] || []).length,
        }));

        res.json({ challenges: result });
    } catch (error) {
        console.error('Error fetching challenges:', error);
        res.status(500).json({ error: 'Error interno' });
    }
});

// Claim challenge reward
router.post('/:id/claim', authenticateToken, async (req, res) => {
    const prisma = req.app.get('prisma');
    const { id } = req.params;

    try {
        const uc = await prisma.userChallenge.findFirst({
            where: { userId: req.user.userId, challengeId: id, completed: true },
            include: { challenge: true }
        });

        if (!uc) return res.status(400).json({ error: 'Challenge no completado' });
        if (uc.claimed) return res.status(400).json({ error: 'Ya reclamaste este reto' });

        // Mark as claimed
        await prisma.userChallenge.update({
            where: { id: uc.id },
            data: { claimed: true }
        });

        // Award points
        if (uc.challenge.reward > 0) {
            await prisma.user.update({
                where: { id: req.user.userId },
                data: { points: { increment: uc.challenge.reward } }
            });
        }

        // Grant badge if challenge has badgeReward
        if (uc.challenge.badgeReward) {
            const badge = await prisma.customBadge.findUnique({ where: { id: uc.challenge.badgeReward } });
            if (badge) {
                await prisma.userBadge.upsert({
                    where: { userId_badgeId: { userId: req.user.userId, badgeId: badge.id } },
                    create: { userId: req.user.userId, badgeId: badge.id, equipped: false },
                    update: {}
                });
            }
        }

        // Grant reward if challenge has rewardPrize
        if (uc.challenge.rewardPrize) {
            const reward = await prisma.reward.findUnique({ where: { id: uc.challenge.rewardPrize } });
            if (reward) {
                await prisma.rewardClaim.create({
                    data: { userId: req.user.userId, rewardId: reward.id, status: 'approved' }
                });
            }
        }

        res.json({ success: true, pointsAwarded: uc.challenge.reward });
    } catch (error) {
        res.status(500).json({ error: 'Error interno' });
    }
});

// Admin: Create challenge
router.post('/', authenticateToken, async (req, res) => {
    const prisma = req.app.get('prisma');
    const requester = await prisma.user.findUnique({ where: { id: req.user.userId } });
    if (!requester || !['broadcaster', 'moderator'].includes(requester.kickRole)) {
        return res.status(403).json({ error: 'Sin permisos' });
    }

    const { title, description, type, goal, metric, reward, badgeReward, rewardPrize, endsAt } = req.body;

    try {
        const challenge = await prisma.challenge.create({
            data: { title, description, type, goal: parseInt(goal), metric, reward: parseInt(reward) || 0, badgeReward: badgeReward || null, rewardPrize: rewardPrize || null, endsAt: endsAt ? new Date(endsAt) : null }
        });
        res.json({ success: true, challenge });
    } catch (error) {
        res.status(500).json({ error: 'Error creando challenge' });
    }
});

// Admin: Delete challenge
router.delete('/:id', authenticateToken, async (req, res) => {
    const prisma = req.app.get('prisma');
    const requester = await prisma.user.findUnique({ where: { id: req.user.userId } });
    if (!requester || !['broadcaster', 'moderator'].includes(requester.kickRole)) {
        return res.status(403).json({ error: 'Sin permisos' });
    }

    const { id } = req.params;
    try {
        await prisma.userChallenge.deleteMany({ where: { challengeId: id } });
        await prisma.challenge.delete({ where: { id } });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Error eliminando challenge' });
    }
});

module.exports = router;
