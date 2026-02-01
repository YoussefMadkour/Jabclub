import { Router } from 'express';
import QRCode from 'qrcode';
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const router = Router();
const prisma = new PrismaClient();

/**
 * QR Code payload structure
 * Contains booking ID, user ID, and timestamp for validation
 */
interface QRPayload {
  bookingId: number;
  userId: number;
  childId?: number;
  timestamp: string;
  signature: string;
}

/**
 * Generate QR code for a specific booking
 * POST /api/qr/generate/:bookingId
 */
router.post('/generate/:bookingId', async (req: any, res) => {
  try {
    const userId = req.session.userId;
    const bookingId = parseInt(req.params.bookingId);

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Fetch booking with all necessary relations
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        classInstance: {
          include: {
            classType: true,
            location: true,
            coach: true,
          },
        },
        user: true,
        child: true,
        memberPackage: true,
      },
    });

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    // Verify booking belongs to user
    if (booking.userId !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Check if booking is already attended or cancelled
    if (booking.status !== 'confirmed') {
      return res.status(400).json({
        error: `Cannot generate QR code for ${booking.status} booking`,
      });
    }

    // Allow QR code generation immediately after booking (no time restriction)
    const now = new Date();
    const classStartTime = new Date(booking.classInstance.startTime);
    
    // Only check that class hasn't ended yet
    if (classStartTime < now) {
      return res.status(400).json({
        error: 'Cannot generate QR code for past classes',
      });
    }

    // Create QR code payload
    const timestamp = now.toISOString();
    const payload: QRPayload = {
      bookingId: booking.id,
      userId: booking.userId,
      childId: booking.childId || undefined,
      timestamp,
      signature: createSignature(booking.id, booking.userId, timestamp),
    };

    // Generate QR code as data URL
    const qrDataUrl = await QRCode.toDataURL(JSON.stringify(payload), {
      width: 300,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
      errorCorrectionLevel: 'H', // High error correction for better scanning
    });

    res.json({
      qrCode: qrDataUrl,
      bookingId: booking.id,
      classInfo: {
        className: booking.classInstance.classType.name,
        date: booking.classInstance.startTime,
        location: booking.classInstance.location.name,
        coach: `${booking.classInstance.coach.firstName} ${booking.classInstance.coach.lastName}`,
        forChild: booking.child
          ? `${booking.child.firstName} ${booking.child.lastName}`
          : `${booking.user.firstName} ${booking.user.lastName}`,
      },
      expiresAt: booking.classInstance.startTime,
    });
  } catch (error) {
    console.error('Error generating QR code:', error);
    res.status(500).json({ error: 'Failed to generate QR code' });
  }
});

/**
 * Validate QR code and mark attendance
 * POST /api/qr/validate
 */
router.post('/validate', async (req: any, res) => {
  try {
    const coachId = req.session.userId;
    const { qrData } = req.body;

    if (!coachId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Verify coach role
    const coach = await prisma.user.findUnique({
      where: { id: coachId },
    });

    if (!coach || coach.role !== 'coach' && coach.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied. Coach or Admin only.' });
    }

    // Parse QR data
    let payload: QRPayload;
    try {
      payload = JSON.parse(qrData);
    } catch {
      return res.status(400).json({ error: 'Invalid QR code format' });
    }

    // Verify required fields
    if (!payload.bookingId || !payload.userId || !payload.timestamp || !payload.signature) {
      return res.status(400).json({ error: 'Invalid QR code data' });
    }

    // Verify signature
    const expectedSignature = createSignature(payload.bookingId, payload.userId, payload.timestamp);
    if (payload.signature !== expectedSignature) {
      return res.status(400).json({ error: 'Invalid QR code signature' });
    }

    // Check QR code age (prevent reuse, valid for 3 hours from generation)
    const qrTimestamp = new Date(payload.timestamp);
    const now = new Date();
    const ageInMinutes = (now.getTime() - qrTimestamp.getTime()) / (1000 * 60);

    if (ageInMinutes > 180) {
      return res.status(400).json({
        error: 'QR code has expired',
        ageInMinutes,
      });
    }

    // Fetch booking with all necessary relations
    const booking = await prisma.booking.findUnique({
      where: { id: payload.bookingId },
      include: {
        classInstance: {
          include: {
            classType: true,
            coach: true,
          },
        },
        user: true,
        child: true,
      },
    });

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    // Verify booking matches QR data
    if (booking.userId !== payload.userId) {
      return res.status(400).json({ error: 'Booking ID does not match' });
    }

    if (booking.childId !== payload.childId) {
      return res.status(400).json({ error: 'Child ID does not match' });
    }

    // Check if coach is assigned to this class
    if (booking.classInstance.coachId !== coachId && coach.role !== 'admin') {
      return res.status(403).json({
        error: 'You are not assigned to this class',
      });
    }

    // Check if booking is already attended or cancelled
    if (booking.status === 'attended') {
      return res.status(400).json({
        error: 'Attendance already marked',
        attendanceTime: booking.attendanceMarkedAt,
      });
    }

    if (booking.status === 'cancelled') {
      return res.status(400).json({ error: 'Booking has been cancelled' });
    }

    // Check if class is within a reasonable time window (1 hour before start to 1 hour after)
    const classStartTime = new Date(booking.classInstance.startTime);
    const classEndTime = new Date(booking.classInstance.endTime);
    const minutesBeforeClass = (classStartTime.getTime() - now.getTime()) / (1000 * 60);
    const minutesAfterClass = (now.getTime() - classEndTime.getTime()) / (1000 * 60);

    if (minutesBeforeClass > 60) {
      return res.status(400).json({
        error: 'Too early to mark attendance. Class starts in ' + Math.round(minutesBeforeClass) + ' minutes',
      });
    }

    if (minutesAfterClass > 60) {
      return res.status(400).json({
        error: 'Too late to mark attendance. Class ended ' + Math.round(minutesAfterClass) + ' minutes ago',
      });
    }

    // Mark attendance
    await prisma.booking.update({
      where: { id: booking.id },
      data: {
        status: 'attended',
        attendanceMarkedAt: now,
        updatedAt: now,
      },
    });

    // Log check-in for analytics
    console.log(`Check-in: Booking ${booking.id} marked by Coach ${coachId}`);

    res.json({
      success: true,
      message: 'Attendance marked successfully',
      booking: {
        id: booking.id,
        member: booking.child
          ? `${booking.child.firstName} ${booking.child.lastName}`
          : `${booking.user.firstName} ${booking.user.lastName}`,
        isChild: !!booking.child,
        class: booking.classInstance.classType.name,
        checkedInAt: now,
        classTime: booking.classInstance.startTime,
      },
    });
  } catch (error) {
    console.error('Error validating QR code:', error);
    res.status(500).json({ error: 'Failed to validate QR code' });
  }
});

/**
 * Get QR code status for a booking
 * GET /api/qr/status/:bookingId
 */
router.get('/status/:bookingId', async (req: any, res) => {
  try {
    const userId = req.session.userId;
    const bookingId = parseInt(req.params.bookingId);

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        classInstance: true,
      },
    });

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    if (booking.userId !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const now = new Date();
    const classStartTime = new Date(booking.classInstance.startTime);
    const hoursUntilClass = (classStartTime.getTime() - now.getTime()) / (1000 * 60 * 60);

    // QR codes can be generated immediately after booking, until class ends
    const canGenerateQR =
      booking.status === 'confirmed' && hoursUntilClass >= -1;

    res.json({
      bookingId: booking.id,
      status: booking.status,
      canGenerateQR,
      hoursUntilClass: Math.round(hoursUntilClass * 10) / 10,
      classStartTime: booking.classInstance.startTime,
      attendanceMarkedAt: booking.attendanceMarkedAt,
    });
  } catch (error) {
    console.error('Error fetching QR status:', error);
    res.status(500).json({ error: 'Failed to fetch QR status' });
  }
});

/**
 * Create a cryptographic signature for QR codes
 * Prevents tampering and forgery
 */
function createSignature(bookingId: number, userId: number, timestamp: string): string {
  const secret = process.env.QR_SECRET || 'default-qr-secret-change-in-production';
  const data = `${bookingId}:${userId}:${timestamp}`;
  return crypto.createHmac('sha256', secret).update(data).digest('hex');
}

export default router;
