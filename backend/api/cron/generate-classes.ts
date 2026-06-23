import type { VercelRequest, VercelResponse } from '@vercel/node';
import { generateClassesFromSchedules } from '../../src/services/scheduleService';

/**
 * Vercel Cron Job endpoint for generating classes from schedules
 * Runs daily at 2 AM (configured in vercel.json)
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Verify this is a cron job request (Vercel injects this header in prod).
  // Fail CLOSED: when a CRON_SECRET is configured, the header must match exactly.
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    if (req.headers.authorization !== `Bearer ${cronSecret}`) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
  } else if (process.env.VERCEL_ENV === 'production') {
    console.error('generate-classes cron called but CRON_SECRET is not set in production');
    return res.status(401).json({ error: 'Unauthorized' });
  }
  // Local/dev with no CRON_SECRET: allow for manual testing.

  try {
    console.log('🔄 Vercel Cron: Generating classes from schedules...');
    await generateClassesFromSchedules(2);
    console.log('✅ Vercel Cron: Successfully generated classes for the next 2 months');
    
    return res.status(200).json({
      success: true,
      message: 'Classes generated successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Vercel Cron: Error generating classes:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to generate classes',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
}
