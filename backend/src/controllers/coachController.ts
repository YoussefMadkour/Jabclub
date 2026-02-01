import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import prisma from '../config/database';

/**
 * POST /api/coach/notes/:bookingId
 * Create or update a class note for a booking
 */
export const createOrUpdateNote = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const bookingId = parseInt(req.params.bookingId);
    const { rating, notes } = req.body;

    if (!userId) {
      res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'User not authenticated'
        }
      });
      return;
    }

    // Verify user is a coach
    const coach = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!coach || coach.role !== 'coach' && coach.role !== 'admin') {
      res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Only coaches can add notes'
        }
      });
      return;
    }

    // Fetch booking with class instance to verify coach assignment
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        classInstance: {
          include: {
            coach: true
          }
        }
      }
    });

    if (!booking) {
      res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Booking not found'
        }
      });
      return;
    }

    // Verify coach is assigned to this class
    if (booking.classInstance.coachId !== userId && coach.role !== 'admin') {
      res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'You can only add notes for your own classes'
        }
      });
      return;
    }

    // Validate rating if provided (1-5)
    if (rating !== undefined && rating !== null) {
      const ratingNum = parseInt(rating);
      if (isNaN(ratingNum) || ratingNum < 1 || ratingNum > 5) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Rating must be between 1 and 5'
          }
        });
        return;
      }
    }

    // Create or update note (upsert)
    const classNote = await prisma.classNote.upsert({
      where: { bookingId },
      update: {
        rating: rating !== undefined ? parseInt(rating) : null,
        notes: notes || null,
        updatedAt: new Date()
      },
      create: {
        bookingId,
        coachId: userId,
        rating: rating !== undefined ? parseInt(rating) : null,
        notes: notes || null
      },
      include: {
        coach: {
          select: {
            firstName: true,
            lastName: true
          }
        }
      }
    });

    res.json({
      success: true,
      data: {
        note: {
          id: classNote.id,
          bookingId: classNote.bookingId,
          rating: classNote.rating,
          notes: classNote.notes,
          coachName: `${classNote.coach.firstName} ${classNote.coach.lastName}`,
          createdAt: classNote.createdAt,
          updatedAt: classNote.updatedAt
        }
      }
    });
  } catch (error) {
    console.error('Error creating/updating note:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'An error occurred while saving the note'
      }
    });
  }
};

/**
 * GET /api/coach/notes/:bookingId
 * Get note for a specific booking
 */
export const getNote = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const bookingId = parseInt(req.params.bookingId);

    if (!userId) {
      res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'User not authenticated'
        }
      });
      return;
    }

    const classNote = await prisma.classNote.findUnique({
      where: { bookingId },
      include: {
        coach: {
          select: {
            firstName: true,
            lastName: true
          }
        }
      }
    });

    if (!classNote) {
      res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Note not found'
        }
      });
      return;
    }

    res.json({
      success: true,
      data: {
        note: {
          id: classNote.id,
          bookingId: classNote.bookingId,
          rating: classNote.rating,
          notes: classNote.notes,
          coachName: `${classNote.coach.firstName} ${classNote.coach.lastName}`,
          createdAt: classNote.createdAt,
          updatedAt: classNote.updatedAt
        }
      }
    });
  } catch (error) {
    console.error('Error fetching note:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'An error occurred while fetching the note'
      }
    });
  }
};

/**
 * GET /api/coach/classes/:id/notes
 * Get all notes for a class
 */
export const getClassNotes = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const classInstanceId = parseInt(req.params.id);

    if (!userId) {
      res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'User not authenticated'
        }
      });
      return;
    }

    // Verify coach is assigned to this class
    const classInstance = await prisma.classInstance.findUnique({
      where: { id: classInstanceId },
      include: {
        coach: true
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

    const coach = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!coach || (coach.role !== 'coach' && coach.role !== 'admin')) {
      res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Only coaches can view notes'
        }
      });
      return;
    }

    if (classInstance.coachId !== userId && coach.role !== 'admin') {
      res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'You can only view notes for your own classes'
        }
      });
      return;
    }

    // Get all bookings for this class with their notes
    const bookings = await prisma.booking.findMany({
      where: { classInstanceId },
      include: {
        classNotes: {
          include: {
            coach: {
              select: {
                firstName: true,
                lastName: true
              }
            }
          }
        },
        user: {
          select: {
            firstName: true,
            lastName: true
          }
        },
        child: {
          select: {
            firstName: true,
            lastName: true
          }
        }
      }
    });

    const notes = bookings
      .filter(b => b.classNotes && b.classNotes.length > 0)
      .map(b => {
        const note = b.classNotes[0]; // Should only be one note per booking
        return {
          bookingId: b.id,
          memberName: b.child 
            ? `${b.child.firstName} ${b.child.lastName}` 
            : `${b.user.firstName} ${b.user.lastName}`,
          rating: note.rating,
          notes: note.notes,
          coachName: `${note.coach.firstName} ${note.coach.lastName}`,
          createdAt: note.createdAt,
          updatedAt: note.updatedAt
        };
      });

    res.json({
      success: true,
      data: {
        notes
      }
    });
  } catch (error) {
    console.error('Error fetching class notes:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'An error occurred while fetching notes'
      }
    });
  }
};

/**
 * PUT /api/coach/attendance/:bookingId
 * Mark attendance for a booking (attended or no_show)
 */
export const markAttendance = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const bookingId = parseInt(req.params.bookingId);
    const { status } = req.body;

    if (!userId) {
      res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'User not authenticated'
        }
      });
      return;
    }

    if (!bookingId || isNaN(bookingId)) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Valid booking ID is required'
        }
      });
      return;
    }

    // Validate status
    if (!status || !['attended', 'no_show'].includes(status)) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Status must be either "attended" or "no_show"'
        }
      });
      return;
    }

    // Fetch booking with class instance details
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        classInstance: {
          include: {
            classType: {
              select: {
                name: true
              }
            }
          }
        },
        user: {
          select: {
            firstName: true,
            lastName: true
          }
        },
        child: {
          select: {
            firstName: true,
            lastName: true
          }
        }
      }
    });

    if (!booking) {
      res.status(404).json({
        success: false,
        error: {
          code: 'BOOKING_NOT_FOUND',
          message: 'Booking not found'
        }
      });
      return;
    }

    // Verify coach is assigned to this class
    if (booking.classInstance.coachId !== userId) {
      res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'You are not assigned to this class'
        }
      });
      return;
    }

    // Only allow marking attendance on the class day
    const classDate = new Date(booking.classInstance.startTime);
    const today = new Date();
    
    // Check if class date is today (same year, month, and day)
    const isSameDay = 
      classDate.getFullYear() === today.getFullYear() &&
      classDate.getMonth() === today.getMonth() &&
      classDate.getDate() === today.getDate();

    if (!isSameDay) {
      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_DATE',
          message: 'Attendance can only be marked on the day of the class',
          details: {
            classDate: classDate.toISOString(),
            today: today.toISOString()
          }
        }
      });
      return;
    }

    // Update booking status
    const updatedBooking = await prisma.booking.update({
      where: { id: bookingId },
      data: {
        status,
        attendanceMarkedAt: new Date()
      }
    });

    const attendeeName = booking.child 
      ? `${booking.child.firstName} ${booking.child.lastName}`
      : `${booking.user.firstName} ${booking.user.lastName}`;

    res.json({
      success: true,
      data: {
        bookingId: updatedBooking.id,
        status: updatedBooking.status,
        attendanceMarkedAt: updatedBooking.attendanceMarkedAt,
        attendeeName,
        className: booking.classInstance.classType.name,
        message: `Attendance marked as ${status === 'attended' ? 'Present' : 'No-Show'}`
      }
    });
  } catch (error) {
    console.error('Attendance marking error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'An error occurred while marking attendance'
      }
    });
  }
};

/**
 * GET /api/coach/classes/:id/roster
 * Fetch roster (all bookings) for a specific class
 */
export const getClassRoster = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const classInstanceId = parseInt(req.params.id);

    if (!userId) {
      res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'User not authenticated'
        }
      });
      return;
    }

    if (!classInstanceId || isNaN(classInstanceId)) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Valid class instance ID is required'
        }
      });
      return;
    }

    // Verify the class exists and is assigned to this coach
    const classInstance = await prisma.classInstance.findUnique({
      where: { id: classInstanceId },
      include: {
        classType: {
          select: {
            name: true,
            durationMinutes: true
          }
        },
        location: {
          select: {
            name: true,
            address: true
          }
        }
      }
    });

    if (!classInstance) {
      res.status(404).json({
        success: false,
        error: {
          code: 'CLASS_NOT_FOUND',
          message: 'Class not found'
        }
      });
      return;
    }

    // Verify coach is assigned to this class
    if (classInstance.coachId !== userId) {
      res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'You are not assigned to this class'
        }
      });
      return;
    }

    // Fetch all confirmed bookings for this class
    const bookings = await prisma.booking.findMany({
      where: {
        classInstanceId,
        status: {
          in: ['confirmed', 'attended', 'no_show']
        }
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        child: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            age: true
          }
        },
        classNotes: {
          include: {
            coach: {
              select: {
                firstName: true,
                lastName: true
              }
            }
          }
        }
      },
      orderBy: [
        { status: 'asc' }, // confirmed first, then attended, then no_show
        { bookedAt: 'asc' }
      ]
    });

    // Format roster data
    const roster = bookings.map(booking => ({
      bookingId: booking.id,
      memberId: booking.user.id,
      memberName: `${booking.user.firstName} ${booking.user.lastName}`,
      memberEmail: booking.user.email,
      bookedFor: booking.child 
        ? `${booking.child.firstName} ${booking.child.lastName}`
        : 'Self',
      isChildBooking: !!booking.child,
      childAge: booking.child?.age,
      status: booking.status,
      bookedAt: booking.bookedAt,
      attendanceMarkedAt: booking.attendanceMarkedAt,
      note: booking.classNotes && booking.classNotes.length > 0 ? {
        id: booking.classNotes[0].id,
        rating: booking.classNotes[0].rating,
        notes: booking.classNotes[0].notes,
        createdAt: booking.classNotes[0].createdAt,
        updatedAt: booking.classNotes[0].updatedAt
      } : null
    }));

    // Calculate attendance summary
    const summary = {
      total: roster.length,
      confirmed: roster.filter(b => b.status === 'confirmed').length,
      attended: roster.filter(b => b.status === 'attended').length,
      noShow: roster.filter(b => b.status === 'no_show').length
    };

    res.json({
      success: true,
      data: {
        classInfo: {
          id: classInstance.id,
          classType: classInstance.classType.name,
          startTime: classInstance.startTime,
          endTime: classInstance.endTime,
          duration: classInstance.classType.durationMinutes,
          location: classInstance.location.name,
          locationAddress: classInstance.location.address,
          capacity: classInstance.capacity
        },
        roster,
        summary
      }
    });
  } catch (error) {
    console.error('Class roster fetch error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'An error occurred while fetching class roster'
      }
    });
  }
};

/**
 * GET /api/coach/classes
 * Fetch coach's assigned classes with optional date range filter
 */
export const getCoachClasses = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { filter } = req.query; // 'today', 'week', or undefined for all

    if (!userId) {
      res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'User not authenticated'
        }
      });
      return;
    }

    // Build date filter based on query parameter
    let startDate: Date;
    let endDate: Date | undefined;

    const now = new Date();

    if (filter === 'today') {
      // Today: from start of day to end of day
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
      endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
    } else if (filter === 'week') {
      // This week: from start of today to end of 7 days from now
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
      endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 7);
    } else {
      // All upcoming classes
      startDate = now;
    }

    // Fetch classes assigned to this coach
    const classes = await prisma.classInstance.findMany({
      where: {
        coachId: userId,
        isCancelled: false,
        startTime: {
          gte: startDate,
          ...(endDate && { lte: endDate })
        }
      },
      include: {
        classType: {
          select: {
            name: true,
            description: true,
            durationMinutes: true
          }
        },
        location: {
          select: {
            name: true,
            address: true
          }
        },
        _count: {
          select: {
            bookings: {
              where: {
                status: {
                  not: 'cancelled'
                }
              }
            }
          }
        }
      },
      orderBy: {
        startTime: 'asc'
      }
    });

    // Format response
    const formattedClasses = classes.map(classInstance => ({
      id: classInstance.id,
      classType: classInstance.classType.name,
      description: classInstance.classType.description,
      startTime: classInstance.startTime,
      endTime: classInstance.endTime,
      duration: classInstance.classType.durationMinutes,
      location: classInstance.location.name,
      locationAddress: classInstance.location.address,
      capacity: classInstance.capacity,
      bookingCount: classInstance._count.bookings,
      availableSpots: classInstance.capacity - classInstance._count.bookings,
      isFull: classInstance._count.bookings >= classInstance.capacity
    }));

    res.json({
      success: true,
      data: {
        filter: filter || 'all',
        classes: formattedClasses,
        totalClasses: formattedClasses.length
      }
    });
  } catch (error) {
    console.error('Coach classes fetch error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'An error occurred while fetching classes'
      }
    });
  }
};

/**
 * GET /api/coach/members/:id
 * Get limited member information (for coaches viewing class roster members)
 */
export const getMemberDetails = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const memberId = parseInt(req.params.id);

    if (!userId) {
      res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'User not authenticated'
        }
      });
      return;
    }

    if (!memberId || isNaN(memberId)) {
      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_MEMBER_ID',
          message: 'Valid member ID is required'
        }
      });
      return;
    }

    // Fetch member with limited data
    const member = await prisma.user.findUnique({
      where: { id: memberId },
      include: {
        children: {
          orderBy: {
            createdAt: 'desc'
          },
          include: {
            bookings: {
              where: {
                classInstance: {
                  coachId: userId // Only show bookings for classes this coach teaches
                },
                status: {
                  not: 'cancelled'
                }
              },
              include: {
                classInstance: {
                  include: {
                    classType: {
                      select: {
                        name: true
                      }
                    },
                    location: {
                      select: {
                        name: true
                      }
                    }
                  }
                }
              },
              orderBy: {
                bookedAt: 'desc'
              }
            }
          }
        },
        bookings: {
          where: {
            classInstance: {
              coachId: userId // Only show bookings for classes this coach teaches
            },
            childId: null // Only parent's own bookings (not child bookings)
          },
          include: {
            classInstance: {
              include: {
                classType: {
                  select: {
                    name: true
                  }
                },
                location: {
                  select: {
                    name: true
                  }
                }
              }
            }
          },
          orderBy: {
            bookedAt: 'desc'
          },
          take: 10 // Limit to recent 10 bookings with this coach
        }
      }
    });

    if (!member) {
      res.status(404).json({
        success: false,
        error: {
          code: 'MEMBER_NOT_FOUND',
          message: 'Member not found'
        }
      });
      return;
    }

    // Verify it's a member
    if (member.role !== 'member') {
      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_USER_TYPE',
          message: 'User is not a member'
        }
      });
      return;
    }

    // Calculate statistics for parent's own bookings (excluding child bookings)
    const parentBookings = member.bookings;
    const parentAttendedCount = parentBookings.filter(b => b.status === 'attended').length;
    const parentNoShowCount = parentBookings.filter(b => b.status === 'no_show').length;
    const parentConfirmedCount = parentBookings.filter(b => b.status === 'confirmed').length;

    // Format children with their own booking statistics
    const childrenWithStats = member.children.map(child => {
      const childBookings = child.bookings;
      const childAttendedCount = childBookings.filter(b => b.status === 'attended').length;
      const childNoShowCount = childBookings.filter(b => b.status === 'no_show').length;
      const childConfirmedCount = childBookings.filter(b => b.status === 'confirmed').length;
      const childTotalBookings = childBookings.length;

      return {
        id: child.id,
        firstName: child.firstName,
        lastName: child.lastName,
        age: child.age,
        statistics: {
          totalBookingsWithCoach: childTotalBookings,
          attendedBookings: childAttendedCount,
          noShowBookings: childNoShowCount,
          confirmedBookings: childConfirmedCount,
          attendanceRate: childTotalBookings > 0
            ? ((childAttendedCount / childTotalBookings) * 100).toFixed(1)
            : '0.0'
        },
        recentBookings: childBookings.slice(0, 10).map(booking => ({
          id: booking.id,
          classType: booking.classInstance.classType.name,
          location: booking.classInstance.location.name,
          startTime: booking.classInstance.startTime,
          status: booking.status,
          bookedAt: booking.bookedAt,
          attendanceMarkedAt: booking.attendanceMarkedAt
        }))
      };
    });

    // Format response (limited information for coaches)
    const formattedMember = {
      id: member.id,
      email: member.email,
      firstName: member.firstName,
      lastName: member.lastName,
      phone: member.phone,
      statistics: {
        totalBookingsWithCoach: parentBookings.length,
        attendedBookings: parentAttendedCount,
        noShowBookings: parentNoShowCount,
        confirmedBookings: parentConfirmedCount,
        attendanceRate: parentBookings.length > 0
          ? ((parentAttendedCount / parentBookings.length) * 100).toFixed(1)
          : '0.0'
      },
      children: childrenWithStats,
      recentBookings: parentBookings.map(booking => ({
        id: booking.id,
        classType: booking.classInstance.classType.name,
        location: booking.classInstance.location.name,
        startTime: booking.classInstance.startTime,
        bookedFor: 'Self',
        status: booking.status,
        bookedAt: booking.bookedAt,
        attendanceMarkedAt: booking.attendanceMarkedAt
      }))
    };

    res.json({
      success: true,
      data: formattedMember
    });
  } catch (error) {
    console.error('Member details fetch error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'An error occurred while fetching member details'
      }
    });
  }
};
