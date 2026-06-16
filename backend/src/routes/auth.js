const express = require('express');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const fetch = require('node-fetch');
const { authenticateToken, tokenBlacklist } = require('../middleware/auth');

const router = express.Router();

// In-memory store for PKCE verifiers (in production use Redis)
const pkceStore = new Map();

// ===== KICK OAUTH LOGIN =====

// Step 1: Generate Kick OAuth URL
router.get('/kick', (req, res) => {
    // Generate PKCE code verifier and challenge
    const codeVerifier = crypto.randomBytes(32).toString('base64url');
    const codeChallenge = crypto.createHash('sha256').update(codeVerifier).digest('base64url');
    const state = crypto.randomBytes(16).toString('hex');

    // Store verifier for later
    pkceStore.set(state, { codeVerifier, createdAt: Date.now() });

    // Cleanup old entries (>10 min)
    for (const [key, val] of pkceStore.entries()) {
        if (Date.now() - val.createdAt > 600000) pkceStore.delete(key);
    }

    const params = new URLSearchParams({
        client_id: process.env.KICK_CLIENT_ID,
        redirect_uri: process.env.KICK_REDIRECT_URI,
        response_type: 'code',
        scope: 'user:read',
        state,
        code_challenge: codeChallenge,
        code_challenge_method: 'S256'
    });

    const url = `https://id.kick.com/oauth/authorize?${params}`;
    res.json({ url, state });
});

// Step 2: Kick OAuth callback
router.get('/kick/callback', async (req, res) => {
    const { code, state } = req.query;
    const prisma = req.app.get('prisma');
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

    console.log('[Kick OAuth] Callback received:', { code: code ? '✓' : '✗', state: state ? '✓' : '✗' });

    if (!code || !state) {
        console.error('[Kick OAuth] Missing code or state');
        return res.redirect(`${frontendUrl}?error=missing_params`);
    }

    const pkceData = pkceStore.get(state);
    if (!pkceData) {
        console.error('[Kick OAuth] Invalid state - PKCE data not found. Known states:', [...pkceStore.keys()]);
        return res.redirect(`${frontendUrl}?error=invalid_state`);
    }
    pkceStore.delete(state);

    try {
        // Exchange code for token
        console.log('[Kick OAuth] Exchanging code for token...');
        const tokenRes = await fetch('https://id.kick.com/oauth/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                code,
                client_id: process.env.KICK_CLIENT_ID,
                client_secret: process.env.KICK_CLIENT_SECRET,
                redirect_uri: process.env.KICK_REDIRECT_URI,
                grant_type: 'authorization_code',
                code_verifier: pkceData.codeVerifier
            })
        });

        const tokenData = await tokenRes.json();
        console.log('[Kick OAuth] Token response:', { hasAccessToken: !!tokenData.access_token, error: tokenData.error, message: tokenData.message });

        if (!tokenData.access_token) {
            console.error('[Kick OAuth] Token error full:', JSON.stringify(tokenData));
            return res.redirect(`${frontendUrl}?error=token_failed`);
        }

        // Get user info from Kick API
        console.log('[Kick OAuth] Getting user info...');
        const userRes = await fetch('https://api.kick.com/public/v1/users', {
            headers: {
                'Authorization': `Bearer ${tokenData.access_token}`,
                'Accept': 'application/json'
            }
        });

        const userData = await userRes.json();
        console.log('[Kick OAuth] User response:', JSON.stringify(userData).substring(0, 500));

        // Kick API returns { data: [{ user_id, name, email, profile_picture }], message: "OK" }
        const kickUser = Array.isArray(userData.data) ? userData.data[0] : (userData.data || userData);

        if (!kickUser || (!kickUser.name && !kickUser.user_id)) {
            console.error('[Kick OAuth] Could not extract user from:', JSON.stringify(userData));
            return res.redirect(`${frontendUrl}?error=user_failed`);
        }

        const kickUserId = kickUser.user_id || null;
        const kickUsername = (kickUser.name || `kick_${kickUserId}`).toLowerCase();
        const displayName = kickUser.name || kickUsername;
        const avatar = kickUser.profile_picture || null;
        console.log('[Kick OAuth] User extracted:', { kickUserId, kickUsername, displayName, avatar });

        // Find or create user in DB
        let user = await prisma.user.findUnique({
            where: { kickUsername }
        });

        if (!user) {
            user = await prisma.user.create({
                data: {
                    kickUserId,
                    kickUsername,
                    displayName,
                    avatar
                }
            });
        } else {
            // Update profile data from Kick
            user = await prisma.user.update({
                where: { id: user.id },
                data: { kickUserId, displayName, avatar }
            });
        }

        // Generate JWT
        const jwtToken = jwt.sign(
            { userId: user.id, kickUsername: user.kickUsername },
            process.env.JWT_SECRET,
            { expiresIn: '30d' }
        );

        // Redirect to frontend with token
        console.log('[Kick OAuth] Success! Redirecting to frontend with token');
        res.redirect(`${frontendUrl}/auth/callback?token=${jwtToken}`);
    } catch (error) {
        console.error('Error en Kick callback:', error);
        res.redirect(`${frontendUrl}?error=internal`);
    }
});

// ===== TWITCH LINKING =====

router.get('/twitch', authenticateToken, (req, res) => {
    const params = new URLSearchParams({
        client_id: process.env.TWITCH_CLIENT_ID,
        redirect_uri: process.env.TWITCH_REDIRECT_URI,
        response_type: 'code',
        scope: 'user:read:email',
        state: req.user.userId
    });

    res.json({ url: `https://id.twitch.tv/oauth2/authorize?${params}` });
});

router.get('/twitch/callback', async (req, res) => {
    const { code, state: userId } = req.query;
    const prisma = req.app.get('prisma');

    if (!code || !userId) {
        return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}?error=twitch_failed`);
    }

    try {
        const tokenRes = await fetch('https://id.twitch.tv/oauth2/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                client_id: process.env.TWITCH_CLIENT_ID,
                client_secret: process.env.TWITCH_CLIENT_SECRET,
                code,
                grant_type: 'authorization_code',
                redirect_uri: process.env.TWITCH_REDIRECT_URI
            })
        });

        const tokenData = await tokenRes.json();
        if (!tokenData.access_token) {
            return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/dashboard?twitch=error`);
        }

        const userRes = await fetch('https://api.twitch.tv/helix/users', {
            headers: {
                'Authorization': `Bearer ${tokenData.access_token}`,
                'Client-Id': process.env.TWITCH_CLIENT_ID
            }
        });

        const userData = await userRes.json();
        const twitchUser = userData.data?.[0];

        if (twitchUser) {
            await prisma.user.update({
                where: { id: userId },
                data: {
                    twitchId: twitchUser.id,
                    twitchUsername: twitchUser.login,
                    avatar: twitchUser.profile_image_url
                }
            });
        }

        res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/dashboard?twitch=linked`);
    } catch (error) {
        console.error('Error en Twitch callback:', error);
        res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/dashboard?twitch=error`);
    }
});

// ===== CLAIM TWITCH POINTS =====

router.post('/claim-twitch-points', authenticateToken, async (req, res) => {
    const { twitchPoints } = req.body;
    const prisma = req.app.get('prisma');

    try {
        const user = await prisma.user.findUnique({
            where: { id: req.user.userId }
        });

        if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });
        if (!user.twitchId) return res.status(400).json({ error: 'Vinculá tu cuenta de Twitch primero' });
        if (user.twitchPointsClaimed) return res.status(400).json({ error: 'Ya reclamaste tus puntos' });

        const points = Math.min(Math.max(parseInt(twitchPoints) || 0, 0), 1000000);

        await prisma.user.update({
            where: { id: user.id },
            data: {
                points: user.points + points,
                twitchPointsClaimed: true,
                twitchPointsAmount: points
            }
        });

        res.json({ success: true, message: `¡Reclamaste ${points} puntos!`, newBalance: user.points + points });
    } catch (error) {
        console.error('Error reclamando puntos:', error);
        res.status(500).json({ error: 'Error interno' });
    }
});

// ===== DISCORD LINKING =====

router.get('/discord', authenticateToken, (req, res) => {
    const params = new URLSearchParams({
        client_id: process.env.DISCORD_CLIENT_ID,
        redirect_uri: process.env.DISCORD_REDIRECT_URI,
        response_type: 'code',
        scope: 'identify',
        state: req.user.userId
    });
    res.json({ url: `https://discord.com/oauth2/authorize?${params}` });
});

router.get('/discord/callback', async (req, res) => {
    const { code, state: userId } = req.query;
    const prisma = req.app.get('prisma');
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

    console.log('[Discord OAuth] Callback received:', { code: code ? '✓' : '✗', userId: userId ? '✓' : '✗' });

    if (!code || !userId) {
        console.log('[Discord OAuth] Missing code or userId');
        return res.redirect(`${frontendUrl}/profile?discord=error`);
    }

    try {
        console.log('[Discord OAuth] Exchanging code for token...');
        const tokenRes = await fetch('https://discord.com/api/oauth2/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                client_id: process.env.DISCORD_CLIENT_ID,
                client_secret: process.env.DISCORD_CLIENT_SECRET,
                code,
                grant_type: 'authorization_code',
                redirect_uri: process.env.DISCORD_REDIRECT_URI
            })
        });

        const tokenData = await tokenRes.json();
        console.log('[Discord OAuth] Token response:', { hasAccessToken: !!tokenData.access_token, error: tokenData.error });
        if (!tokenData.access_token) {
            console.error('[Discord OAuth] Token error:', JSON.stringify(tokenData));
            return res.redirect(`${frontendUrl}/profile?discord=error`);
        }

        const userRes = await fetch('https://discord.com/api/users/@me', {
            headers: { 'Authorization': `Bearer ${tokenData.access_token}` }
        });

        const discordUser = await userRes.json();
        if (discordUser.id) {
            await prisma.user.update({
                where: { id: userId },
                data: {
                    discordId: discordUser.id,
                    discordUsername: discordUser.username
                }
            });
        }

        res.redirect(`${frontendUrl}/profile?discord=linked`);
    } catch (error) {
        console.error('Error en Discord callback:', error);
        res.redirect(`${frontendUrl}/profile?discord=error`);
    }
});

router.post('/discord/unlink', authenticateToken, async (req, res) => {
    const prisma = req.app.get('prisma');
    try {
        await prisma.user.update({
            where: { id: req.user.userId },
            data: { discordId: null, discordUsername: null, streamNotify: false }
        });
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: 'Error' });
    }
});

router.post('/discord/notify-toggle', authenticateToken, async (req, res) => {
    const prisma = req.app.get('prisma');
    try {
        const user = await prisma.user.findUnique({ where: { id: req.user.userId } });
        if (!user?.discordId) return res.status(400).json({ error: 'Vinculá tu Discord primero' });
        const updated = await prisma.user.update({
            where: { id: req.user.userId },
            data: { streamNotify: !user.streamNotify }
        });
        res.json({ success: true, streamNotify: updated.streamNotify });
    } catch (e) {
        res.status(500).json({ error: 'Error' });
    }
});

// ===== LOGOUT =====
router.post('/logout', authenticateToken, (req, res) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (token) {
        tokenBlacklist.add(token);
        // Auto-clean after token expiry (24h)
        setTimeout(() => tokenBlacklist.delete(token), 86400000);
    }
    res.json({ success: true });
});

// ===== VERIFY TOKEN (for extension) =====
router.get('/me', authenticateToken, async (req, res) => {
    const prisma = req.app.get('prisma');
    try {
        const user = await prisma.user.findUnique({ where: { id: req.user.userId } });
        if (!user) return res.status(404).json({ error: 'No encontrado' });
        res.json({ user: { id: user.id, kickUsername: user.kickUsername, displayName: user.displayName, avatar: user.avatar, points: user.points, totalWatchTime: user.totalWatchTime, currentStreak: user.currentStreak, longestStreak: user.longestStreak, kickRole: user.kickRole, twitchLinked: !!user.twitchId, discordLinked: !!user.discordId, discordUsername: user.discordUsername, streamNotify: user.streamNotify } });
    } catch (e) {
        res.status(500).json({ error: 'Error' });
    }
});

module.exports = router;
