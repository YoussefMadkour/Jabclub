import type { VercelRequest, VercelResponse } from '@vercel/node';
import { generateClassesFromSchedules } from '../../src/services/scheduleService';

/**
 * Vercel Cron Job endpoint for generating classes from schedules
 * Runs daily at 2 AM (configured in vercel.json)
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Verify this is a cron job request (Vercel adds a special header)
  const authHeader = req.headers.authorization;
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    // In production, Vercel automatically adds the authorization header
    // For local testing, you can set CRON_SECRET in your .env
    if (process.env.VERCEL_ENV === 'production' && !authHeader) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
  }

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
