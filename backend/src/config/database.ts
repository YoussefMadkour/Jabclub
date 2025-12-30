import { PrismaClient } from '@prisma/client';

// Optimize Prisma Client for serverless (connection pooling)
const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  // Optimize for serverless environments
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});

// Handle Prisma connection errors gracefully
prisma.$connect().catch((error) => {
  console.error('Prisma connection error:', error);
});

// Graceful shutdown
if (typeof process !== 'undefined') {
  process.on('beforeExit', async () => {
    await prisma.$disconnect();
  });
}

export default prisma;
