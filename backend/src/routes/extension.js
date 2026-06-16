const express = require('express');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Datos para la extensión (popup)
router.get('/data', authenticateToken, async (req, res) => {
    const prisma = req.app.get('prisma');

    try {
        const user = await prisma.user.findUnique({
            where: { id: req.user.userId },
            include: {
                badges: {
                    include: { badge: true }
                }
            }
        });

        if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });

        const status = await prisma.streamStatus.findFirst();

        res.json({
            user: {
                kickUsername: user.kickUsername,
                displayName: user.displayName,
                avatar: user.avatar,
                kickRole: user.kickRole,
                points: user.points,
                totalWatchTime: user.totalWatchTime,
                currentStreak: user.currentStreak,
                longestStreak: user.longestStreak,
                twitchLinked: !!user.twitchId,
                badges: user.badges.map(ub => ({
                    equipped: ub.equipped,
                    badge: {
                        name: ub.badge.name,
                        icon: ub.badge.icon,
                        color: ub.badge.color
                    }
                }))
            },
            stream: {
                isLive: status?.isLive || false,
                title: status?.title || null
            }
        });
    } catch (error) {
        console.error('Error obteniendo datos extensión:', error);
        res.status(500).json({ error: 'Error interno' });
    }
});

// Configuración del chat overlay para la extensión
router.get('/chat-config', async (req, res) => {
    res.json({
        badges: {
            enabled: true,
            roles: {
                broadcaster: { emoji: '👑', label: 'Broadcaster', color: '#C9A84C' },
                moderator: { emoji: '🛡️', label: 'Mod', color: '#5B9DFF' },
                vip: { emoji: '⭐', label: 'VIP', color: '#A855F7' },
                subscriber: { emoji: '💚', label: 'Sub', color: '#52B788' },
            },
            watchTime: [
                { name: 'Legend', emoji: '🏆', minMinutes: 10000, color: '#C9A84C' },
                { name: 'Loyal', emoji: '💎', minMinutes: 3000, color: '#95D5B2' },
                { name: 'OG', emoji: '🌿', minMinutes: 600, color: '#52B788' },
            ]
        },
        colors: {
            enabled: true,
            streamerHighlight: '#52B788',
            chatBackground: true,
        },
        theme: {
            primary: '#52B788',
            dark: '#2D6A4F',
            deep: '#1B4332',
            surface: '#0c0f0d',
            accent: '#C9A84C',
        }
    });
});

// Public endpoint: get all users' badge data for chat overlay
router.get('/chat-badges', async (req, res) => {
    const prisma = req.app.get('prisma');
    try {
        const users = await prisma.user.findMany({
            select: {
                kickUsername: true,
                displayName: true,
                kickRole: true,
                totalWatchTime: true,
                points: true,
                badges: {
                    where: { equipped: true },
                    include: { badge: true },
                    take: 3
                }
            }
        });

        const badgeMap = {};
        for (const u of users) {
            const roleBadges = [];
            // Role badge
            if (u.kickRole && u.kickRole !== 'viewer') {
                roleBadges.push({ type: 'role', value: u.kickRole });
            }
            // Watch time badges
            if (u.totalWatchTime >= 10000) roleBadges.push({ type: 'watchtime', value: 'legend' });
            else if (u.totalWatchTime >= 3000) roleBadges.push({ type: 'watchtime', value: 'loyal' });
            else if (u.totalWatchTime >= 600) roleBadges.push({ type: 'watchtime', value: 'og' });

            // Custom badges (equipped, max 3)
            const customBadges = u.badges.map(ub => ({
                name: ub.badge.name,
                icon: ub.badge.icon,
                color: ub.badge.color
            }));

            if (roleBadges.length > 0 || customBadges.length > 0) {
                badgeMap[u.kickUsername] = {
                    displayName: u.displayName,
                    badges: roleBadges,
                    customBadges,
                    points: u.points,
                    watchTime: u.totalWatchTime,
                };
            }
        }

        res.json({ badges: badgeMap });
    } catch (error) {
        console.error('Error obteniendo badges:', error);
        res.status(500).json({ error: 'Error interno' });
    }
});

// Auto-detect roles from chat: content script sends detected roles
router.post('/chat-roles', async (req, res) => {
    const prisma = req.app.get('prisma');
    const { detectedRoles } = req.body;
    // detectedRoles: [{ username: 'user1', role: 'moderator' }, ...]

    if (!Array.isArray(detectedRoles) || detectedRoles.length === 0) {
        return res.status(400).json({ error: 'No roles provided' });
    }

    const validRoles = ['subscriber', 'vip', 'moderator', 'broadcaster'];
    const rolePriority = { broadcaster: 4, moderator: 3, vip: 2, subscriber: 1, viewer: 0 };
    let updated = 0;

    for (const { username, role } of detectedRoles) {
        if (!username || !validRoles.includes(role)) continue;

        try {
            const user = await prisma.user.findUnique({
                where: { kickUsername: username.toLowerCase() },
                select: { kickRole: true }
            });

            if (!user) continue;

            // Only upgrade role, never downgrade (e.g. don't overwrite broadcaster with subscriber)
            const currentPriority = rolePriority[user.kickRole] || 0;
            const newPriority = rolePriority[role] || 0;

            if (newPriority > currentPriority) {
                await prisma.user.update({
                    where: { kickUsername: username.toLowerCase() },
                    data: { kickRole: role }
                });
                updated++;
            }
        } catch (e) {}
    }

    res.json({ success: true, updated });
});

// Track chat messages: content script sends usernames who sent messages
router.post('/chat-messages', async (req, res) => {
    const prisma = req.app.get('prisma');
    const { messages } = req.body;
    // messages: [{ username: 'user1' }, { username: 'user2' }, ...]

    if (!Array.isArray(messages) || messages.length === 0) {
        return res.status(400).json({ error: 'No messages provided' });
    }

    // Count messages per user
    const counts = {};
    for (const { username } of messages) {
        if (!username) continue;
        const u = username.toLowerCase();
        counts[u] = (counts[u] || 0) + 1;
    }

    console.log(`[Chat Messages] Received ${messages.length} messages from ${Object.keys(counts).length} users:`, Object.keys(counts).join(', '));

    let processed = 0;
    for (const [username, count] of Object.entries(counts)) {
        try {
            const user = await prisma.user.findUnique({ where: { kickUsername: username } });
            if (!user) { console.log(`[Chat Messages] User "${username}" not found in DB, skipping`); continue; }

            // Find active challenges with metric 'messages' and update progress
            const activeChallenges = await prisma.challenge.findMany({
                where: { active: true, metric: 'messages' }
            });

            for (const challenge of activeChallenges) {
                const uc = await prisma.userChallenge.findFirst({
                    where: { userId: user.id, challengeId: challenge.id }
                });

                if (uc) {
                    if (!uc.completed) {
                        const newProgress = Math.min(uc.progress + count, challenge.goal);
                        const completed = newProgress >= challenge.goal;
                        await prisma.userChallenge.update({
                            where: { id: uc.id },
                            data: { progress: newProgress, completed, ...(completed ? { completedAt: new Date() } : {}) }
                        });
                    }
                } else {
                    const newProgress = Math.min(count, challenge.goal);
                    const completed = newProgress >= challenge.goal;
                    await prisma.userChallenge.create({
                        data: { userId: user.id, challengeId: challenge.id, progress: newProgress, completed, ...(completed ? { completedAt: new Date() } : {}) }
                    });
                }
            }
            processed++;
        } catch (e) {}
    }

    res.json({ success: true, processed });
});

module.exports = router;
