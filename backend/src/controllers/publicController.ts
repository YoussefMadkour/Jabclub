import { Request, Response } from 'express';
import prisma from '../config/database';

/**
 * GET /api/public/locations
 * Public list of active locations (no auth). Used by the marketing website.
 */
export const getPublicLocations = async (_req: Request, res: Response): Promise<void> => {
  try {
    const locations = await prisma.location.findMany({
      where: { isActive: true },
      select: { id: true, name: true, address: true },
      orderBy: { name: 'asc' },
    });

    res.json({ success: true, data: { locations } });
  } catch (error) {
    console.error('Public locations fetch error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Could not load locations right now.' },
    });
  }
};

/**
 * GET /api/public/schedule
 * Public, read-only class timetable (no auth). Booking happens in the member
 * portal, so this intentionally omits coach names and per-user booking status.
 */
export const getPublicSchedule = async (req: Request, res: Response): Promise<void> => {
  try {
    const { location, startDate, endDate } = req.query;

    const windowStart = startDate ? new Date(startDate as string) : new Date();
    const windowEnd = endDate
      ? new Date(endDate as string)
      : new Date(windowStart.getTime() + 7 * 24 * 60 * 60 * 1000);

    const whereClause: any = {
      isCancelled: false,
      startTime: { gte: windowStart, lte: windowEnd },
    };

    if (location) {
      whereClause.locationId = parseInt(location as string);
    }

    const classInstances = await prisma.classInstance.findMany({
      where: whereClause,
      include: {
        classType: { select: { name: true, description: true, durationMinutes: true } },
        location: { select: { id: true, name: true, address: true } },
        bookings: { where: { status: 'confirmed' }, select: { id: true } },
      },
      orderBy: { startTime: 'asc' },
    });

    const classes = classInstances.map((c) => {
      const bookedCount = c.bookings.length;
      const availableSpots = c.capacity - bookedCount;
      return {
        id: c.id,
        classType: c.classType.name,
        description: c.classType.description,
        duration: c.classType.durationMinutes,
        startTime: c.startTime,
        endTime: c.endTime,
        location: { id: c.location.id, name: c.location.name, address: c.location.address },
        capacity: c.capacity,
        availableSpots,
        isFull: availableSpots <= 0,
      };
    });

    res.json({ success: true, data: { classes, total: classes.length } });
  } catch (error) {
    console.error('Public schedule fetch error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Could not load the schedule right now.' },
    });
  }
};
