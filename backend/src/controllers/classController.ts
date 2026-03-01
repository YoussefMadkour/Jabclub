import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import prisma from '../config/database';

/**
 * GET /api/classes/schedule
 * Fetch class schedule with optional filters (location, date, coach)
 */
export const getSchedule = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { location, date, coach } = req.query;

    const { startDate, endDate } = req.query;

    // Default window: today → 14 days ahead (2 weeks visible at a time)
    const windowStart = startDate ? new Date(startDate as string) : new Date();
    const windowEnd = endDate
      ? new Date(endDate as string)
      : new Date(windowStart.getTime() + 14 * 24 * 60 * 60 * 1000);

    // Build where clause based on filters
    const whereClause: any = {
      isCancelled: false,
      startTime: { gte: windowStart, lte: windowEnd }
    };

    // Filter by location
    if (location) {
      whereClause.locationId = parseInt(location as string);
    }

    // Filter by date (classes on specific date — overrides window)
    if (date) {
      const selectedDate = new Date(date as string);
      const startOfDay = new Date(selectedDate); startOfDay.setHours(0, 0, 0, 0);
      const endOfDay   = new Date(selectedDate); endOfDay.setHours(23, 59, 59, 999);
      whereClause.startTime = { gte: startOfDay, lte: endOfDay };
    }

    // Filter by coach
    if (coach) {
      whereClause.coachId = parseInt(coach as string);
    }

    // Fetch class instances with related data
    const classInstances = await prisma.classInstance.findMany({
      where: whereClause,
      include: {
        classType: {
          select: {
            name: true,
            description: true,
            durationMinutes: true
          }
        },
        coach: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        },
        location: {
          select: {
            id: true,
            name: true,
            address: true
          }
        },
        bookings: {
          where: {
            status: 'confirmed'
          },
          select: {
            id: true,
            userId: true,
            childId: true
          }
        }
      },
      orderBy: {
        startTime: 'asc'
      }
    });

    // Get current user ID if authenticated
    const userId = req.user?.id;

    // Format response with calculated available spots and user booking status
    const formattedClasses = classInstances.map(classInstance => {
      const bookedCount = classInstance.bookings.length;
      const availableSpots = classInstance.capacity - bookedCount;
      
      // Check if current user is booked in this class
      const userBooking = userId 
        ? classInstance.bookings.find(b => b.userId === userId)
        : null;
      const isBooked = !!userBooking;
      const bookingId = userBooking?.id || null;

      return {
        id: classInstance.id,
        classType: classInstance.classType.name,
        description: classInstance.classType.description,
        duration: classInstance.classType.durationMinutes,
        startTime: classInstance.startTime,
        endTime: classInstance.endTime,
        coach: {
          id: classInstance.coach.id,
          name: `${classInstance.coach.firstName} ${classInstance.coach.lastName}`
        },
        location: {
          id: classInstance.location.id,
          name: classInstance.location.name,
          address: classInstance.location.address
        },
        capacity: classInstance.capacity,
        bookedCount,
        availableSpots,
        isFull: availableSpots <= 0,
        isBooked,
        bookingId
      };
    });

    res.json({
      success: true,
      data: {
        classes: formattedClasses,
        total: formattedClasses.length
      }
    });
  } catch (error) {
    console.error('Class schedule fetch error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'An error occurred while fetching class schedule'
      }
    });
  }
};

/**
 * GET /api/classes/:id/availability
 * Get availability information for a specific class
 */
export const getClassAvailability = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // Fetch class instance
    const classInstance = await prisma.classInstance.findUnique({
      where: {
        id: parseInt(id)
      },
      include: {
        bookings: {
          where: {
            status: 'confirmed'
          },
          select: {
            id: true,
            userId: true,
            childId: true
          }
        }
      }
    });

    if (!classInstance) {
      res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Class not found'
        }
      });
      return;
    }

    // Calculate availability
    const bookedCount = classInstance.bookings.length;
    const availableSpots = classInstance.capacity - bookedCount;
    const isFull = availableSpots <= 0;

    res.json({
      success: true,
      data: {
        classId: classInstance.id,
        capacity: classInstance.capacity,
        bookedCount,
        availableSpots,
        isFull,
        isCancelled: classInstance.isCancelled
      }
    });
  } catch (error) {
    console.error('Class availability fetch error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'An error occurred while fetching class availability'
      }
    });
  }
};
