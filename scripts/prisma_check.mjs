import { PrismaClient } from '@prisma/client';

(async () => {
  const prisma = new PrismaClient();
  try {
    await prisma.$connect();
    console.log('prisma: connected');
    await prisma.$disconnect();
    process.exit(0);
  } catch (e) {
    console.error('prisma:connect error', e);
    process.exit(1);
  }
})();