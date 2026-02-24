import { PrismaClient } from '@prisma/client';

const isServerless = !!process.env.VERCEL || !!process.env.VERCEL_ENV;

// In serverless, append connection_limit=1 to avoid exhausting Postgres connections.
// Each function instance only needs one connection at a time.
// If DATABASE_URL already has query params, append; otherwise add '?'.
const buildDatabaseUrl = (): string | undefined => {
  const base = process.env.DATABASE_URL;
  if (!base) return undefined;
  if (!isServerless) return base;
  // Don't double-add
  if (base.includes('connection_limit')) return base;
  const separator = base.includes('?') ? '&' : '?';
  return `${base}${separator}connection_limit=1&pool_timeout=20`;
};

// Reuse the Prisma client across hot-reloads in development / across invocations in serverless
// by attaching it to the global object.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
    datasources: {
      db: { url: buildDatabaseUrl() },
    },
  });

if (!isServerless) {
  // Reuse client across dev hot-reloads
  globalForPrisma.prisma = prisma;

  prisma.$connect().catch((error) => {
    console.error('Prisma connection error:', error);
  });

  process.on('beforeExit', async () => {
    await prisma.$disconnect();
  });
}

export default prisma;
