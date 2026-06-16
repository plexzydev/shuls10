const fetch = require('node-fetch');
const DiscordNotifier = require('./discordNotifier');

class StreamMonitor {
    constructor(prisma) {
        this.prisma = prisma;
        this.interval = null;
        this.channelSlug = process.env.KICK_CHANNEL_SLUG || 'shuls10';
        this.isLive = false;
        this.discord = new DiscordNotifier(prisma);
    }

    async start() {
        console.log(`📺 Stream Monitor: Monitoreando ${this.channelSlug}`);
        await this.check();
        this.interval = setInterval(() => this.check(), 30 * 1000); // Cada 30s
    }

    stop() {
        if (this.interval) {
            clearInterval(this.interval);
            this.interval = null;
        }
    }

    async check() {
        try {
            const response = await fetch(`https://kick.com/api/v2/channels/${this.channelSlug}`, {
                headers: {
                    'Accept': 'application/json',
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                },
                timeout: 10000
            });

            if (!response.ok) return;

            const channel = await response.json();
            const livestream = channel.livestream;
            const isLive = livestream !== null && livestream !== undefined;

            // Actualizar estado en DB
            const existing = await this.prisma.streamStatus.findFirst();
            if (existing) {
                await this.prisma.streamStatus.update({
                    where: { id: existing.id },
                    data: {
                        isLive,
                        title: livestream?.session_title || null,
                        streamId: livestream?.id?.toString() || null,
                        viewerCount: livestream?.viewer_count || 0,
                        startedAt: livestream?.created_at ? new Date(livestream.created_at) : null
                    }
                });
            } else {
                await this.prisma.streamStatus.create({
                    data: {
                        isLive,
                        title: livestream?.session_title || null,
                        streamId: livestream?.id?.toString() || null,
                        viewerCount: livestream?.viewer_count || 0,
                        startedAt: livestream?.created_at ? new Date(livestream.created_at) : null
                    }
                });
            }

            // Si el stream se apagó, cerrar sesiones activas
            if (!isLive && this.isLive) {
                console.log(`📺 Stream Monitor: ${this.channelSlug} se desconectó`);
                await this.closeActiveSessions();
                await this.updateStreaks();
            }

            if (isLive && !this.isLive) {
                console.log(`📺 Stream Monitor: ${this.channelSlug} está EN VIVO - "${livestream?.session_title}"`);
                // Send Discord DMs to users with notifications enabled
                this.discord.notifyStreamLive(livestream?.session_title).catch(() => {});
            }

            this.isLive = isLive;
        } catch (error) {
            // Silenciar errores de red
        }
    }

    async closeActiveSessions() {
        const activeSessions = await this.prisma.watchSession.findMany({
            where: { endTime: null }
        });

        for (const session of activeSessions) {
            await this.prisma.watchSession.update({
                where: { id: session.id },
                data: { endTime: new Date() }
            });
        }
    }

    async updateStreaks() {
        // Actualizar racha: si el user vio el stream hoy, incrementar streak
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const usersWhoWatched = await this.prisma.user.findMany({
            where: {
                lastSeenStream: { gte: today }
            }
        });

        for (const user of usersWhoWatched) {
            const newStreak = user.currentStreak + 1;
            await this.prisma.user.update({
                where: { id: user.id },
                data: {
                    currentStreak: newStreak,
                    longestStreak: Math.max(newStreak, user.longestStreak)
                }
            });
        }

        // Reset streak para los que no vieron
        await this.prisma.user.updateMany({
            where: {
                lastSeenStream: { lt: today }
            },
            data: { currentStreak: 0 }
        });
    }
}

module.exports = StreamMonitor;
