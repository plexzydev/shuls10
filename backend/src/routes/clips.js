const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');

// Get all clips (public, sorted by votes)
router.get('/', async (req, res) => {
    const prisma = req.app.get('prisma');
    try {
        const clips = await prisma.clip.findMany({
            orderBy: { votes: 'desc' },
            take: 50,
            include: {
                user: { select: { kickUsername: true, displayName: true, avatar: true } },
                clipVotes: { select: { userId: true, value: true } }
            }
        });
        res.json({ clips: clips.map(c => ({ ...c, clipVotes: c.clipVotes || [] })) });
    } catch (error) {
        res.status(500).json({ error: 'Error interno' });
    }
});

// Submit a clip
router.post('/', authenticateToken, async (req, res) => {
    const prisma = req.app.get('prisma');
    const { title, url, thumbnail } = req.body;

    if (!title || !url) return res.status(400).json({ error: 'Título y URL requeridos' });

    try {
        const clip = await prisma.clip.create({
            data: { userId: req.user.userId, title, url, thumbnail }
        });
        res.json({ success: true, clip });
    } catch (error) {
        res.status(500).json({ error: 'Error creando clip' });
    }
});

// Vote on a clip (value: 1 = upvote, -1 = downvote)
router.post('/:id/vote', authenticateToken, async (req, res) => {
    const prisma = req.app.get('prisma');
    const { id } = req.params;
    const { value } = req.body;
    const voteVal = value === -1 ? -1 : 1;

    try {
        const existing = await prisma.clipVote.findUnique({
            where: { clipId_userId: { clipId: id, userId: req.user.userId } }
        });

        if (existing) {
            if (existing.value === voteVal) {
                // Same vote = remove it
                await prisma.clipVote.delete({ where: { id: existing.id } });
                await prisma.clip.update({ where: { id }, data: { votes: { decrement: voteVal } } });
                return res.json({ success: true, action: 'removed' });
            } else {
                // Switch vote direction
                await prisma.clipVote.update({ where: { id: existing.id }, data: { value: voteVal } });
                await prisma.clip.update({ where: { id }, data: { votes: { increment: voteVal * 2 } } });
                return res.json({ success: true, action: 'switched' });
            }
        }

        // New vote
        await prisma.clipVote.create({ data: { clipId: id, userId: req.user.userId, value: voteVal } });
        await prisma.clip.update({ where: { id }, data: { votes: { increment: voteVal } } });
        res.json({ success: true, action: 'added' });
    } catch (error) {
        res.status(500).json({ error: 'Error votando' });
    }
});

// Delete clip (owner or mod/broadcaster)
router.delete('/:id', authenticateToken, async (req, res) => {
    const prisma = req.app.get('prisma');
    const { id } = req.params;

    try {
        const clip = await prisma.clip.findUnique({ where: { id } });
        if (!clip) return res.status(404).json({ error: 'Clip no encontrado' });

        const user = await prisma.user.findUnique({ where: { id: req.user.userId } });
        if (clip.userId !== req.user.userId && !['broadcaster', 'moderator'].includes(user?.kickRole)) {
            return res.status(403).json({ error: 'Sin permisos' });
        }

        await prisma.clipVote.deleteMany({ where: { clipId: id } });
        await prisma.clip.delete({ where: { id } });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Error eliminando clip' });
    }
});

module.exports = router;
