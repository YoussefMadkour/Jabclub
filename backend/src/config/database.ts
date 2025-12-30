import { PrismaClient } from '@prisma/client';

// Optimize Prisma Client for serverless (connection pooling)
// Increase connection pool size and timeout for serverless environments
const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});

// Don't eagerly connect in serverless - connections are managed per request
// This prevents connection pool exhaustion
const isServerless = !!process.env.VERCEL || !!process.env.VERCEL_ENV;

if (!isServerless) {
  // Only connect eagerly in non-serverless environments
  prisma.$connect().catch((error) => {
    console.error('Prisma connection error:', error);
  });

  // Graceful shutdown
  process.on('beforeExit', async () => {
    await prisma.$disconnect();
  });
}

export default prisma;
