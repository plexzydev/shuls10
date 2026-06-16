const fetch = require('node-fetch');

class DiscordNotifier {
    constructor(prisma) {
        this.prisma = prisma;
        this.botToken = process.env.DISCORD_BOT_TOKEN;
    }

    async notifyStreamLive(streamTitle) {
        if (!this.botToken) {
            console.log('[Discord] No bot token configured, skipping notifications');
            return;
        }

        try {
            // Find all users with discord linked and notifications enabled
            const users = await this.prisma.user.findMany({
                where: {
                    discordId: { not: null },
                    streamNotify: true
                }
            });

            if (users.length === 0) return;

            console.log(`[Discord] Sending stream live DMs to ${users.length} users`);

            const channel = process.env.KICK_CHANNEL_SLUG || 'shuls10';
            const message = `🔴 **¡Shuls está en vivo!**\n\n${streamTitle || 'Stream en vivo'}\n\n▶️ https://kick.com/${channel}`;

            let sent = 0;
            for (const user of users) {
                try {
                    // Create DM channel
                    const dmRes = await fetch('https://discord.com/api/v10/users/@me/channels', {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bot ${this.botToken}`,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ recipient_id: user.discordId })
                    });

                    const dmChannel = await dmRes.json();
                    if (!dmChannel.id) continue;

                    // Send message
                    await fetch(`https://discord.com/api/v10/channels/${dmChannel.id}/messages`, {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bot ${this.botToken}`,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ content: message })
                    });

                    sent++;
                    // Rate limit: wait 500ms between DMs
                    await new Promise(r => setTimeout(r, 500));
                } catch (e) {
                    console.error(`[Discord] Failed to DM user ${user.discordUsername}:`, e.message);
                }
            }

            console.log(`[Discord] Sent ${sent}/${users.length} stream live DMs`);
        } catch (e) {
            console.error('[Discord] Error sending notifications:', e.message);
        }
    }
}

module.exports = DiscordNotifier;
