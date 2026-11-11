import { prisma } from '../src/db.js';

const email = process.argv[2]?.trim().toLowerCase();
if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
  console.error('Usage: npm run admin:promote -- user@example.com');
  process.exitCode = 1;
} else {
  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      console.error(`No account found for ${email}. Sign up first, then promote it.`);
      process.exitCode = 1;
    } else {
      const roles = user.roles.includes('ADMIN') ? user.roles : [...user.roles, 'ADMIN'];
      await prisma.user.update({ where: { id: user.id }, data: { roles, activeRole: 'ADMIN' } });
      if (!user.roles.includes('ADMIN')) {
        await prisma.adminAction.create({
          data: {
            actorId: user.id,
            action: 'ADMIN_PROMOTED',
            subjectType: 'USER',
            subjectId: user.id,
            details: { method: 'local-cli-bootstrap' },
          },
        });
      }
      console.log(`Admin access enabled for ${email}. This account can now use admin routes.`);
    }
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}
