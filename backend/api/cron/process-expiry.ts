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
  // Fail CLOSED: when a CRON_SECRET is configured, the header must match exactly.
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    if (req.headers.authorization !== `Bearer ${cronSecret}`) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
  } else if (process.env.VERCEL_ENV === 'production') {
    // In production a secret is mandatory — refuse rather than run unauthenticated.
    console.error('process-expiry cron called but CRON_SECRET is not set in production');
    return res.status(401).json({ error: 'Unauthorized' });
  }
  // Local/dev with no CRON_SECRET: allow for manual testing.

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
