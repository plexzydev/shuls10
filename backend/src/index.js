require('dotenv').config();
const app = require('./app');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const PORT = process.env.PORT || 3001;

// Stream monitor - acumular puntos a usuarios activos
const StreamMonitor = require('./services/streamMonitor');
const streamMonitor = new StreamMonitor(prisma);
streamMonitor.start();

app.listen(PORT, () => {
    console.log(`🚀 Backend corriendo en http://localhost:${PORT}`);
    console.log(`📊 Monitoreando canal: ${process.env.KICK_CHANNEL_SLUG || 'shuls10'}`);
});

// Graceful shutdown
process.on('SIGINT', async () => {
    streamMonitor.stop();
    await prisma.$disconnect();
    process.exit(0);
});
