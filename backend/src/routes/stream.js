const express = require('express');
const { optionalAuth } = require('../middleware/auth');

const router = express.Router();

// Estado actual del stream
router.get('/status', async (req, res) => {
    const prisma = req.app.get('prisma');

    try {
        const status = await prisma.streamStatus.findFirst();
        res.json({
            isLive: status?.isLive || false,
            title: status?.title || null,
            viewerCount: status?.viewerCount || 0,
            startedAt: status?.startedAt || null
        });
    } catch (error) {
        res.json({ isLive: false });
    }
});

// Heartbeat del viewer (extensión envía cada 1 min para acumular puntos)
router.post('/heartbeat', optionalAuth, async (req, res) => {
    const prisma = req.app.get('prisma');

    if (!req.user) {
        return res.status(401).json({ error: 'Necesitás estar logueado' });
    }

    try {
        const status = await prisma.streamStatus.findFirst();
        if (!status || !status.isLive) {
            return res.json({ success: false, message: 'El stream no está en vivo' });
        }

        const user = await prisma.user.findUnique({
            where: { id: req.user.userId }
        });

        if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });

        // Buscar sesión activa o crear una nueva
        let activeSession = await prisma.watchSession.findFirst({
            where: {
                userId: user.id,
                endTime: null
            },
            orderBy: { startTime: 'desc' }
        });

        if (!activeSession) {
            activeSession = await prisma.watchSession.create({
                data: {
                    userId: user.id,
                    streamId: status.streamId
                }
            });
        }

        // Acumular 1 minuto de watch time + puntos
        const POINTS_PER_MINUTE = 10;

        await prisma.user.update({
            where: { id: user.id },
            data: {
                points: user.points + POINTS_PER_MINUTE,
                totalWatchTime: user.totalWatchTime + 1,
                lastSeenStream: new Date()
            }
        });

        await prisma.watchSession.update({
            where: { id: activeSession.id },
            data: { duration: activeSession.duration + 1 }
        });

        // --- Update challenge progress ---
        try {
            await updateChallengeProgress(prisma, user.id, user);
        } catch (e) {
            console.error('Error updating challenge progress:', e);
        }

        res.json({
            success: true,
            pointsEarned: POINTS_PER_MINUTE,
            totalPoints: user.points + POINTS_PER_MINUTE,
            sessionDuration: activeSession.duration + 1
        });
    } catch (error) {
        console.error('Error en heartbeat:', error);
        res.status(500).json({ error: 'Error interno' });
    }
});

// Update challenge progress for a user based on their current stats
async function updateChallengeProgress(prisma, userId, user) {
    const activeChallenges = await prisma.challenge.findMany({
        where: { active: true }
    });

    for (const challenge of activeChallenges) {
        let currentValue = 0;

        switch (challenge.metric) {
            case 'watchTime':
                // totalWatchTime is in minutes, +1 because we just incremented
                currentValue = (user.totalWatchTime || 0) + 1;
                break;
            case 'streak':
                currentValue = user.currentStreak || 0;
                break;
            case 'logins':
                // Count distinct days with watch sessions
                const sessions = await prisma.watchSession.findMany({
                    where: { userId },
                    select: { startTime: true }
                });
                const uniqueDays = new Set(sessions.map(s => s.startTime.toISOString().split('T')[0]));
                currentValue = uniqueDays.size;
                break;
            case 'messages':
                // Messages are tracked separately via /chat-messages endpoint
                continue;
            default:
                continue;
        }

        const progress = Math.min(currentValue, challenge.goal);

        const existing = await prisma.userChallenge.findFirst({
            where: { userId, challengeId: challenge.id }
        });

        if (existing) {
            // Only update if not already completed and progress changed
            if (!existing.completed && progress > existing.progress) {
                const completed = progress >= challenge.goal;
                await prisma.userChallenge.update({
                    where: { id: existing.id },
                    data: {
                        progress,
                        completed,
                        ...(completed ? { completedAt: new Date() } : {})
                    }
                });
            }
        } else {
            const completed = progress >= challenge.goal;
            await prisma.userChallenge.create({
                data: {
                    userId,
                    challengeId: challenge.id,
                    progress,
                    completed,
                    ...(completed ? { completedAt: new Date() } : {})
                }
            });
        }
    }
}

module.exports = router;
