const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');

// Get user profile (public)
router.get('/:username', async (req, res) => {
    const prisma = req.app.get('prisma');
    const { username } = req.params;

    try {
        const user = await prisma.user.findUnique({
            where: { kickUsername: username.toLowerCase() },
            select: {
                kickUsername: true,
                displayName: true,
                avatar: true,
                kickRole: true,
                points: true,
                totalWatchTime: true,
                currentStreak: true,
                longestStreak: true,
                createdAt: true,
                achievements: {
                    include: { achievement: true },
                    orderBy: { unlockedAt: 'desc' }
                }
            }
        });

        if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });

        res.json({ profile: user });
    } catch (error) {
        res.status(500).json({ error: 'Error interno' });
    }
});

// Get my achievements
router.get('/me/achievements', authenticateToken, async (req, res) => {
    const prisma = req.app.get('prisma');

    try {
        const allAchievements = await prisma.achievement.findMany({ orderBy: { rarity: 'asc' } });
        const userAchievements = await prisma.userAchievement.findMany({
            where: { userId: req.user.userId },
            include: { achievement: true }
        });

        const unlockedIds = new Set(userAchievements.map(ua => ua.achievementId));

        const result = allAchievements.map(a => ({
            ...a,
            unlocked: unlockedIds.has(a.id),
            displayed: userAchievements.find(ua => ua.achievementId === a.id)?.displayed ?? false,
            unlockedAt: userAchievements.find(ua => ua.achievementId === a.id)?.unlockedAt || null,
        }));

        res.json({ achievements: result });
    } catch (error) {
        res.status(500).json({ error: 'Error interno' });
    }
});

// Toggle achievement display
router.post('/me/achievements/:id/toggle', authenticateToken, async (req, res) => {
    const prisma = req.app.get('prisma');
    const { id } = req.params;

    try {
        const ua = await prisma.userAchievement.findFirst({
            where: { userId: req.user.userId, achievementId: id }
        });

        if (!ua) return res.status(404).json({ error: 'Achievement no desbloqueado' });

        await prisma.userAchievement.update({
            where: { id: ua.id },
            data: { displayed: !ua.displayed }
        });

        res.json({ success: true, displayed: !ua.displayed });
    } catch (error) {
        res.status(500).json({ error: 'Error interno' });
    }
});

module.exports = router;
