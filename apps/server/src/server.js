import { app } from './app.js';
import { prisma } from './db.js';

const port = Number(process.env.PORT ?? process.env.API_PORT ?? 3000);
const server = app.listen(port, () => {
  console.log(`Crewensia API listening on http://localhost:${port}`);
});

async function shutdown() {
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
