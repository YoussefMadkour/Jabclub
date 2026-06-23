import type { VercelRequest, VercelResponse } from '@vercel/node';
import {
  checkExpiredPackages,
  checkExpiringPackages,
  checkRenewalReminders,
} from '../../src/services/expiryService';

/**
 * Vercel Cron endpoint for package expiry processing.
 * Runs daily (configured in vercel.json). Replaces the in-process node-cron jobs,
 * which do not run reliably on serverless (no long-lived process).
 *
 * Does all three passes in one invocation:
 *   1. Mark expired packages
 *   2. Send "expiring within 7 days" warnings
 *   3. Send renewal reminders
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Verify the request originates from Vercel Cron (it injects this header in prod).
  const authHeader = req.headers.authorization;
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    if (process.env.VERCEL_ENV === 'production' && !authHeader) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
  }

  try {
    console.log('🔄 Vercel Cron: processing package expiry...');
    await checkExpiredPackages();
    await checkExpiringPackages();
    await checkRenewalReminders();
    console.log('✅ Vercel Cron: expiry processing complete');

    return res.status(200).json({
      success: true,
      message: 'Expiry processing complete',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('❌ Vercel Cron: expiry processing failed:', error);
    return res.status(500).json({
      success: false,
      error: 'Expiry processing failed',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    });
  }
}
