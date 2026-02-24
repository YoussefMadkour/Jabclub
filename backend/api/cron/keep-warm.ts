import type { VercelRequest, VercelResponse } from '@vercel/node';
import prisma from '../../src/config/database';

/**
 * Keep-warm cron — runs every 5 minutes to prevent serverless cold starts.
 * Does a lightweight DB ping so the connection pool stays alive too.
 */
export default async function handler(_req: VercelRequest, res: VercelResponse) {
  try {
    // Lightweight query — just checks DB connectivity
    await prisma.$queryRaw`SELECT 1`;
    return res.status(200).json({ ok: true, ts: Date.now() });
  } catch (error) {
    console.error('Keep-warm DB ping failed:', error);
    // Still return 200 so Vercel doesn't flag the cron as failing
    return res.status(200).json({ ok: false, ts: Date.now() });
  }
}
