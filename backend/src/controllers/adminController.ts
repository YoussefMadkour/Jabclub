import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import prisma from '../config/database';
import bcrypt from 'bcrypt';
import { getRelativeUploadPath } from '../utils/filePath';
import { sendEmail, NotificationTemplates } from '../services/notificationService';

/**
 * GET /api/admin/payments/pending
 * List all pending payments with member details, package info, and screenshot URL
 */
export const getPendingPayments = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // Fetch all pending payments
    const pendingPayments = await prisma.payment.findMany({
      where: {
        status: 'pending'
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phone: true
          }
        },
        package: {
          select: {
            id: true,
            name: true,
            sessionCount: true,
            price: true,
            expiryDays: true
          }
        }
      },
      orderBy: {
        createdAt: 'asc' // Sort by submission date (oldest first)
      }
    });

    // Format response
    const formattedPayments = pendingPayments.map(payment => ({
      id: payment.id,
      member: {
        id: payment.user.id,
        email: payment.user.email,
        name: `${payment.user.firstName} ${payment.user.lastName}`,
        phone: payment.user.phone
      },
      package: {
        id: payment.package.id,
        name: payment.package.name,
        sessionCount: payment.package.sessionCount,
        price: payment.package.price,
        expiryDays: payment.package.expiryDays
      },
      amount: payment.amount,
      screenshotUrl: getRelativeUploadPath(payment.screenshotPath),
      screenshotPath: payment.screenshotPath,
      submittedAt: payment.createdAt,
      status: payment.status
    }));

    res.json({
      success: true,
      data: formattedPayments
    });
  } catch (error) {
    console.error('Pending payments fetch error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'An error occurred while fetching pending payments'
      }
    });
  }
};

/**
 * PUT /api/admin/payments/:id/approve
 * Approve a payment and create member_package with credits
 */
export const approvePayment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const paymentId = parseInt(req.params.id);
    const adminId = req.user?.id;

    if (!adminId) {
      res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Admin not authenticated'
        }
      });
      return;
    }

    if (isNaN(paymentId)) {
      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_PAYMENT_ID',
          message: 'Invalid payment ID'
        }
      });
      return;
    }

    // Use transaction to ensure atomicity
    const result = await prisma.$transaction(async (tx) => {
      // Fetch payment with package details
      const payment = await tx.payment.findUnique({
        where: { id: paymentId },
        include: {
          package: true,
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true
            }
          }
        }
      });

      if (!payment) {
        throw new Error('PAYMENT_NOT_FOUND');
      }

      // Prevent duplicate approvals
      if (payment.status !== 'pending') {
        throw new Error('PAYMENT_ALREADY_PROCESSED');
      }

      // Calculate expiry date
      const purchaseDate = new Date();
      const expiryDate = new Date(purchaseDate);
      expiryDate.setDate(expiryDate.getDate() + payment.package.expiryDays);

      // Create member_package record
      const memberPackage = await tx.memberPackage.create({
        data: {
          userId: payment.userId,
          packageId: payment.packageId,
          sessionsRemaining: payment.package.sessionCount,
          sessionsTotal: payment.package.sessionCount,
          purchaseDate,
          expiryDate,
          isExpired: false
        }
      });

      // Update payment status
      const updatedPayment = await tx.payment.update({
        where: { id: paymentId },
        data: {
          status: 'approved',
          reviewedBy: adminId,
          reviewedAt: new Date()
        }
      });

      // Create credit transaction log entry
      await tx.creditTransaction.create({
        data: {
          userId: payment.userId,
          memberPackageId: memberPackage.id,
          transactionType: 'purchase',
          creditsChange: payment.package.sessionCount,
          balanceAfter: payment.package.sessionCount,
          notes: `Package purchase approved: ${payment.package.name}`
        }
      });

      return {
        payment: updatedPayment,
        memberPackage,
        user: payment.user,
        package: payment.package
      };
    });

    // Send package purchase receipt email (non-blocking)
    const user = result.user;
    const purchaseDate = result.memberPackage.purchaseDate;
    const expiryDate = result.memberPackage.expiryDate;
    
    const startDateFormatted = new Date(purchaseDate).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    const expiryDateFormatted = new Date(expiryDate).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    // Send receipt email
    const receiptTemplate = NotificationTemplates.packagePurchaseReceipt(
      user.firstName,
      result.package.name,
      result.package.sessionCount,
      startDateFormatted,
      expiryDateFormatted,
      Number(result.payment.amount),
      result.payment.vatAmount ? Number(result.payment.vatAmount) : null,
      result.payment.vatIncluded,
      result.payment.totalAmount ? Number(result.payment.totalAmount) : Number(result.payment.amount),
      result.payment.id
    );

    // Send receipt email
    sendEmail(
      user.email,
      receiptTemplate.emailSubject,
      receiptTemplate.emailHtml
    ).catch((err) => {
      console.error('Failed to send receipt email:', err);
    });

    res.json({
      success: true,
      data: {
        paymentId: result.payment.id,
        status: result.payment.status,
        member: {
          id: result.user.id,
          name: `${result.user.firstName} ${result.user.lastName}`,
          email: result.user.email
        },
        package: {
          name: result.package.name,
          sessionsGranted: result.package.sessionCount,
          expiryDate: result.memberPackage.expiryDate
        },
        approvedAt: result.payment.reviewedAt,
        message: 'Payment approved successfully and credits granted to member'
      }
    });
  } catch (error: any) {
    console.error('Payment approval error:', error);

    if (error.message === 'PAYMENT_NOT_FOUND') {
      res.status(404).json({
        success: false,
        error: {
          code: 'PAYMENT_NOT_FOUND',
          message: 'Payment not found'
        }
      });
      return;
    }

    if (error.message === 'PAYMENT_ALREADY_PROCESSED') {
      res.status(409).json({
        success: false,
        error: {
          code: 'PAYMENT_ALREADY_PROCESSED',
          message: 'This payment has already been processed'
        }
      });
      return;
    }

    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'An error occurred while approving the payment'
      }
    });
  }
};


/**
 * PUT /api/admin/payments/:id/reject
 * Reject a payment with a reason
 */
export const rejectPayment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const paymentId = parseInt(req.params.id);
    const adminId = req.user?.id;
    const { rejectionReason } = req.body;

    if (!adminId) {
      res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Admin not authenticated'
        }
      });
      return;
    }

    if (isNaN(paymentId)) {
      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_PAYMENT_ID',
          message: 'Invalid payment ID'
        }
      });
      return;
    }

    if (!rejectionReason || rejectionReason.trim() === '') {
      res.status(400).json({
        success: false,
        error: {
          code: 'REJECTION_REASON_REQUIRED',
          message: 'Rejection reason is required'
        }
      });
      return;
    }

    // Fetch payment
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true
          }
        },
        package: {
          select: {
            name: true
          }
        }
      }
    });

    if (!payment) {
      res.status(404).json({
        success: false,
        error: {
          code: 'PAYMENT_NOT_FOUND',
          message: 'Payment not found'
        }
      });
      return;
    }

    // Prevent duplicate rejections
    if (payment.status !== 'pending') {
      res.status(409).json({
        success: false,
        error: {
          code: 'PAYMENT_ALREADY_PROCESSED',
          message: 'This payment has already been processed'
        }
      });
      return;
    }

    // Update payment status to rejected
    const updatedPayment = await prisma.payment.update({
      where: { id: paymentId },
      data: {
        status: 'rejected',
        rejectionReason: rejectionReason.trim(),
        reviewedBy: adminId,
        reviewedAt: new Date()
      }
    });

    res.json({
      success: true,
      data: {
        paymentId: updatedPayment.id,
        status: updatedPayment.status,
        member: {
          id: payment.user.id,
          name: `${payment.user.firstName} ${payment.user.lastName}`,
          email: payment.user.email
        },
        package: {
          name: payment.package.name
        },
        rejectionReason: updatedPayment.rejectionReason,
        rejectedAt: updatedPayment.reviewedAt,
        message: 'Payment rejected successfully'
      }
    });
  } catch (error) {
    console.error('Payment rejection error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'An error occurred while rejecting the payment'
      }
    });
  }
};

/**
 * GET /api/admin/bookings
 * List all bookings with optional filters (class, member, date)
 */
export const getAllBookings = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { classInstanceId, userId, date, status } = req.query;

    // Build filter object
    const where: any = {};

    if (classInstanceId) {
      where.classInstanceId = parseInt(classInstanceId as string);
    }

    if (userId) {
      where.userId = parseInt(userId as string);
    }

    if (status) {
      where.status = status as string;
    }

    if (date) {
      // Filter by date (start of day to end of day)
      const filterDate = new Date(date as string);
      const startOfDay = new Date(filterDate.setHours(0, 0, 0, 0));
      const endOfDay = new Date(filterDate.setHours(23, 59, 59, 999));

      where.classInstance = {
        startTime: {
          gte: startOfDay,
          lte: endOfDay
        }
      };
    }

    // Fetch bookings with all related data
    const bookings = await prisma.booking.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phone: true
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
        classInstance: {
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
            },
            coach: {
              select: {
                firstName: true,
                lastName: true
              }
            }
          }
        },
        memberPackage: {
          select: {
            id: true,
            sessionsRemaining: true
          }
        }
      },
      orderBy: {
        classInstance: {
          startTime: 'desc'
        }
      }
    });

    // Format response
    const formattedBookings = bookings.map(booking => ({
      id: booking.id,
      member: {
        id: booking.user.id,
        name: `${booking.user.firstName} ${booking.user.lastName}`,
        email: booking.user.email,
        phone: booking.user.phone
      },
      bookedFor: booking.child 
        ? {
            type: 'child',
            id: booking.child.id,
            name: `${booking.child.firstName} ${booking.child.lastName}`,
            age: booking.child.age
          }
        : {
            type: 'self',
            name: `${booking.user.firstName} ${booking.user.lastName}`
          },
      class: {
        id: booking.classInstance.id,
        type: booking.classInstance.classType.name,
        startTime: booking.classInstance.startTime,
        endTime: booking.classInstance.endTime,
        duration: booking.classInstance.classType.durationMinutes,
        location: booking.classInstance.location.name,
        locationAddress: booking.classInstance.location.address,
        coach: `${booking.classInstance.coach.firstName} ${booking.classInstance.coach.lastName}`,
        isCancelled: booking.classInstance.isCancelled
      },
      status: booking.status,
      bookedAt: booking.bookedAt,
      cancelledAt: booking.cancelledAt,
      attendanceMarkedAt: booking.attendanceMarkedAt
    }));

    res.json({
      success: true,
      data: {
        bookings: formattedBookings,
        total: formattedBookings.length
      }
    });
  } catch (error) {
    console.error('Bookings fetch error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'An error occurred while fetching bookings'
      }
    });
  }
};

/**
 * POST /api/admin/bookings
 * Manually create a booking for a member
 */
export const createBookingManually = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { userId, classInstanceId, childId } = req.body;

    // Validate required fields
    if (!userId || !classInstanceId) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'User ID and class instance ID are required'
        }
      });
      return;
    }

    // Verify user exists
    const user = await prisma.user.findUnique({
      where: { id: parseInt(userId) }
    });

    if (!user) {
      res.status(404).json({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found'
        }
      });
      return;
    }

    // If childId is provided, verify it belongs to the user
    if (childId) {
      const child = await prisma.child.findFirst({
        where: {
          id: parseInt(childId),
          parentId: parseInt(userId)
        }
      });

      if (!child) {
        res.status(403).json({
          success: false,
          error: {
            code: 'INVALID_CHILD',
            message: 'Child not found or does not belong to the specified user'
          }
        });
        return;
      }
    }

    // Fetch class instance details
    const classInstance = await prisma.classInstance.findUnique({
      where: { id: parseInt(classInstanceId) },
      include: {
        classType: true,
        location: true,
        coach: {
          select: {
            firstName: true,
            lastName: true
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

    // Check if class is cancelled
    if (classInstance.isCancelled) {
      res.status(400).json({
        success: false,
        error: {
          code: 'CLASS_CANCELLED',
          message: 'This class has been cancelled'
        }
      });
      return;
    }

    // Check class capacity
    const currentBookingCount = await prisma.booking.count({
      where: {
        classInstanceId: parseInt(classInstanceId),
        status: 'confirmed'
      }
    });

    if (currentBookingCount >= classInstance.capacity) {
      res.status(400).json({
        success: false,
        error: {
          code: 'CLASS_FULL',
          message: 'This class is fully booked'
        }
      });
      return;
    }

    // Check for duplicate booking
    const existingBooking = await prisma.booking.findFirst({
      where: {
        classInstanceId: parseInt(classInstanceId),
        userId: parseInt(userId),
        childId: childId ? parseInt(childId) : null,
        status: 'confirmed'
      }
    });

    if (existingBooking) {
      res.status(400).json({
        success: false,
        error: {
          code: 'ALREADY_BOOKED',
          message: childId 
            ? 'This child is already booked for this class'
            : 'This user is already booked for this class'
        }
      });
      return;
    }

    // Fetch active (non-expired) member packages with available credits
    const activePackages = await prisma.memberPackage.findMany({
      where: {
        userId: parseInt(userId),
        isExpired: false,
        expiryDate: {
          gte: new Date()
        },
        sessionsRemaining: {
          gt: 0
        }
      },
      include: {
        package: {
          select: {
            name: true
          }
        }
      },
      orderBy: {
        expiryDate: 'asc' // Use credits from packages expiring soonest
      }
    });

    if (activePackages.length === 0) {
      res.status(400).json({
        success: false,
        error: {
          code: 'INSUFFICIENT_CREDITS',
          message: 'User does not have any available session credits',
          details: {
            required: 1,
            available: 0
          }
        }
      });
      return;
    }

    // Use database transaction to ensure atomicity
    const result = await prisma.$transaction(async (tx) => {
      // Select the package to deduct credit from (first one with available credits)
      const packageToUse = activePackages[0];

      // Deduct one credit from the package
      const updatedPackage = await tx.memberPackage.update({
        where: { id: packageToUse.id },
        data: {
          sessionsRemaining: packageToUse.sessionsRemaining - 1
        }
      });

      // Create the booking
      const booking = await tx.booking.create({
        data: {
          classInstanceId: parseInt(classInstanceId),
          userId: parseInt(userId),
          childId: childId ? parseInt(childId) : null,
          memberPackageId: packageToUse.id,
          status: 'confirmed'
        },
        include: {
          classInstance: {
            include: {
              classType: true,
              location: true,
              coach: {
                select: {
                  firstName: true,
                  lastName: true
                }
              }
            }
          },
          child: {
            select: {
              firstName: true,
              lastName: true
            }
          },
          user: {
            select: {
              firstName: true,
              lastName: true
            }
          }
        }
      });

      // Create credit transaction log
      await tx.creditTransaction.create({
        data: {
          userId: parseInt(userId),
          memberPackageId: packageToUse.id,
          bookingId: booking.id,
          transactionType: 'booking',
          creditsChange: -1,
          balanceAfter: updatedPackage.sessionsRemaining,
          notes: `Admin manual booking for ${classInstance.classType.name} on ${classInstance.startTime.toISOString()}`
        }
      });

      return booking;
    });

    // Return booking confirmation
    res.status(201).json({
      success: true,
      data: {
        bookingId: result.id,
        member: {
          name: `${result.user.firstName} ${result.user.lastName}`
        },
        bookedFor: result.child 
          ? `${result.child.firstName} ${result.child.lastName}`
          : 'Self',
        classType: result.classInstance.classType.name,
        startTime: result.classInstance.startTime,
        endTime: result.classInstance.endTime,
        location: result.classInstance.location.name,
        coach: `${result.classInstance.coach.firstName} ${result.classInstance.coach.lastName}`,
        bookedAt: result.bookedAt,
        message: 'Booking created successfully by admin'
      }
    });
  } catch (error) {
    console.error('Admin booking creation error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'An error occurred while creating the booking'
      }
    });
  }
};

/**
 * DELETE /api/admin/bookings/:id
 * Cancel a booking with credit refund (bypasses time restriction)
 */
export const cancelBookingAdmin = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const bookingId = parseInt(req.params.id);

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
        memberPackage: true,
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

    // Check if booking is already cancelled
    if (booking.status === 'cancelled') {
      res.status(400).json({
        success: false,
        error: {
          code: 'ALREADY_CANCELLED',
          message: 'This booking has already been cancelled'
        }
      });
      return;
    }

    // Admin can cancel even if class is in the past or within cancellation window
    const now = new Date();

    // Use database transaction to refund credit and update booking status
    const result = await prisma.$transaction(async (tx) => {
      // Update booking status to cancelled
      const cancelledBooking = await tx.booking.update({
        where: { id: bookingId },
        data: {
          status: 'cancelled',
          cancelledAt: now
        }
      });

      // Refund one credit to the member package
      const updatedPackage = await tx.memberPackage.update({
        where: { id: booking.memberPackageId },
        data: {
          sessionsRemaining: booking.memberPackage.sessionsRemaining + 1
        }
      });

      // Create credit transaction log entry
      await tx.creditTransaction.create({
        data: {
          userId: booking.userId,
          memberPackageId: booking.memberPackageId,
          bookingId: bookingId,
          transactionType: 'refund',
          creditsChange: 1,
          balanceAfter: updatedPackage.sessionsRemaining,
          notes: `Admin cancellation refund for ${booking.classInstance.classType.name} on ${booking.classInstance.startTime.toISOString()}`
        }
      });

      return {
        cancelledBooking,
        updatedPackage
      };
    });

    // Return cancellation confirmation
    res.json({
      success: true,
      data: {
        bookingId: result.cancelledBooking.id,
        member: {
          name: `${booking.user.firstName} ${booking.user.lastName}`
        },
        bookedFor: booking.child 
          ? `${booking.child.firstName} ${booking.child.lastName}`
          : 'Self',
        status: result.cancelledBooking.status,
        cancelledAt: result.cancelledBooking.cancelledAt,
        creditRefunded: true,
        newCreditBalance: result.updatedPackage.sessionsRemaining,
        message: 'Booking cancelled successfully by admin. One credit has been refunded.'
      }
    });
  } catch (error) {
    console.error('Admin booking cancellation error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'An error occurred while cancelling the booking'
      }
    });
  }
};

/**
 * POST /api/admin/refund
 * Issue a manual credit refund to a member
 */
export const issueManualRefund = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { userId, credits, reason } = req.body;

    // Validate required fields
    if (!userId || !credits) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'User ID and credits amount are required'
        }
      });
      return;
    }

    const creditsNum = parseInt(credits);
    if (isNaN(creditsNum) || creditsNum < 1) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Credits must be a positive number'
        }
      });
      return;
    }

    // Verify user exists
    const user = await prisma.user.findUnique({
      where: { id: parseInt(userId) },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true
      }
    });

    if (!user) {
      res.status(404).json({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found'
        }
      });
      return;
    }

    // Find the most recent active package to add credits to
    // If no active package exists, find the most recently expired one
    let targetPackage = await prisma.memberPackage.findFirst({
      where: {
        userId: parseInt(userId),
        isExpired: false,
        expiryDate: {
          gte: new Date()
        }
      },
      orderBy: {
        expiryDate: 'desc'
      },
      include: {
        package: {
          select: {
            name: true
          }
        }
      }
    });

    // If no active package, find most recent package (even if expired)
    if (!targetPackage) {
      targetPackage = await prisma.memberPackage.findFirst({
        where: {
          userId: parseInt(userId)
        },
        orderBy: {
          purchaseDate: 'desc'
        },
        include: {
          package: {
            select: {
              name: true
            }
          }
        }
      });
    }

    if (!targetPackage) {
      res.status(400).json({
        success: false,
        error: {
          code: 'NO_PACKAGE_FOUND',
          message: 'User has no packages. Please ensure the user has purchased at least one package before issuing a refund.'
        }
      });
      return;
    }

    // Use transaction to add credits and log transaction
    const result = await prisma.$transaction(async (tx) => {
      // Add credits to the package
      const updatedPackage = await tx.memberPackage.update({
        where: { id: targetPackage.id },
        data: {
          sessionsRemaining: targetPackage.sessionsRemaining + creditsNum,
          // If package was expired, reactivate it if we're adding credits
          isExpired: false,
          // Extend expiry if package was expired
          expiryDate: targetPackage.isExpired || targetPackage.expiryDate < new Date()
            ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // Add 30 days from now
            : targetPackage.expiryDate
        }
      });

      // Create credit transaction log
      await tx.creditTransaction.create({
        data: {
          userId: parseInt(userId),
          memberPackageId: targetPackage.id,
          transactionType: 'refund',
          creditsChange: creditsNum,
          balanceAfter: updatedPackage.sessionsRemaining,
          notes: reason ? `Admin manual refund: ${reason}` : 'Admin manual refund'
        }
      });

      return updatedPackage;
    });

    res.json({
      success: true,
      data: {
        userId: user.id,
        member: {
          name: `${user.firstName} ${user.lastName}`,
          email: user.email
        },
        creditsAdded: creditsNum,
        newBalance: result.sessionsRemaining,
        packageName: targetPackage.package.name,
        expiryDate: result.expiryDate,
        message: `Successfully added ${creditsNum} credit(s) to member's account`
      }
    });
  } catch (error) {
    console.error('Manual refund error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'An error occurred while issuing the refund'
      }
    });
  }
};

/**
 * GET /api/admin/locations
 * List all locations (active and inactive)
 */
export const getAllLocations = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const locations = await prisma.location.findMany({
      orderBy: {
        name: 'asc'
      }
    });

    res.json({
      success: true,
      data: {
        locations,
        total: locations.length
      }
    });
  } catch (error) {
    console.error('Locations fetch error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'An error occurred while fetching locations'
      }
    });
  }
};

/**
 * POST /api/admin/locations
 * Create a new location
 */
export const createLocation = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, address, capacity } = req.body;

    // Validate required fields
    if (!name || !address || !capacity) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Name, address, and capacity are required'
        }
      });
      return;
    }

    const capacityNum = parseInt(capacity);
    if (isNaN(capacityNum) || capacityNum < 1) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Capacity must be a positive number'
        }
      });
      return;
    }

    // Check if location with same name already exists
    const existingLocation = await prisma.location.findFirst({
      where: {
        name: name.trim()
      }
    });

    if (existingLocation) {
      res.status(409).json({
        success: false,
        error: {
          code: 'LOCATION_EXISTS',
          message: 'A location with this name already exists'
        }
      });
      return;
    }

    // Create location
    const location = await prisma.location.create({
      data: {
        name: name.trim(),
        address: address.trim(),
        capacity: capacityNum,
        isActive: true
      }
    });

    res.status(201).json({
      success: true,
      data: {
        location,
        message: 'Location created successfully'
      }
    });
  } catch (error) {
    console.error('Location creation error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'An error occurred while creating the location'
      }
    });
  }
};

/**
 * PUT /api/admin/locations/:id
 * Update an existing location
 */
export const updateLocation = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const locationId = parseInt(req.params.id);
    const { name, address, capacity, isActive } = req.body;

    if (isNaN(locationId)) {
      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_LOCATION_ID',
          message: 'Invalid location ID'
        }
      });
      return;
    }

    // Check if location exists
    const existingLocation = await prisma.location.findUnique({
      where: { id: locationId }
    });

    if (!existingLocation) {
      res.status(404).json({
        success: false,
        error: {
          code: 'LOCATION_NOT_FOUND',
          message: 'Location not found'
        }
      });
      return;
    }

    // Build update data object
    const updateData: any = {};

    if (name !== undefined) {
      const trimmedName = name.trim();
      if (!trimmedName) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Name cannot be empty'
          }
        });
        return;
      }

      // Check if another location has this name
      const duplicateName = await prisma.location.findFirst({
        where: {
          name: trimmedName,
          id: { not: locationId }
        }
      });

      if (duplicateName) {
        res.status(409).json({
          success: false,
          error: {
            code: 'LOCATION_EXISTS',
            message: 'A location with this name already exists'
          }
        });
        return;
      }

      updateData.name = trimmedName;
    }

    if (address !== undefined) {
      const trimmedAddress = address.trim();
      if (!trimmedAddress) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Address cannot be empty'
          }
        });
        return;
      }
      updateData.address = trimmedAddress;
    }

    if (capacity !== undefined) {
      const capacityNum = parseInt(capacity);
      if (isNaN(capacityNum) || capacityNum < 1) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Capacity must be a positive number'
          }
        });
        return;
      }
      updateData.capacity = capacityNum;
    }

    if (isActive !== undefined) {
      updateData.isActive = Boolean(isActive);
    }

    // Update location
    const updatedLocation = await prisma.location.update({
      where: { id: locationId },
      data: updateData
    });

    res.json({
      success: true,
      data: {
        location: updatedLocation,
        message: 'Location updated successfully'
      }
    });
  } catch (error) {
    console.error('Location update error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'An error occurred while updating the location'
      }
    });
  }
};

/**
 * DELETE /api/admin/locations/:id
 * Soft delete a location (set isActive to false)
 */
export const deleteLocation = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const locationId = parseInt(req.params.id);

    if (isNaN(locationId)) {
      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_LOCATION_ID',
          message: 'Invalid location ID'
        }
      });
      return;
    }

    // Check if location exists
    const location = await prisma.location.findUnique({
      where: { id: locationId }
    });

    if (!location) {
      res.status(404).json({
        success: false,
        error: {
          code: 'LOCATION_NOT_FOUND',
          message: 'Location not found'
        }
      });
      return;
    }

    // Get all future classes at this location
    const futureClassInstances = await prisma.classInstance.findMany({
      where: {
        locationId: locationId,
        startTime: {
          gte: new Date()
        },
        isCancelled: false
      },
      include: {
        bookings: {
          include: {
            memberPackage: true,
            user: true
          }
        },
        classType: true
      }
    });

    // Use transaction to cancel all future classes, refund credits, and deactivate location
    const result = await prisma.$transaction(async (tx) => {
      let totalRefundedCredits = 0;
      let totalCancelledBookings = 0;

      // Cancel all future classes and refund bookings
      for (const classInstance of futureClassInstances) {
        // Cancel the class instance
        await tx.classInstance.update({
          where: { id: classInstance.id },
          data: {
            isCancelled: true
          }
        });

        // Process each booking for this class
        for (const booking of classInstance.bookings) {
          if (booking.status === 'confirmed') {
            // Cancel the booking
            await tx.booking.update({
              where: { id: booking.id },
              data: {
                status: 'cancelled',
                cancelledAt: new Date()
              }
            });

            // Refund credit
            const updatedPackage = await tx.memberPackage.update({
              where: { id: booking.memberPackageId },
              data: {
                sessionsRemaining: booking.memberPackage.sessionsRemaining + 1
              }
            });

            // Create credit transaction log
            await tx.creditTransaction.create({
              data: {
                userId: booking.userId,
                memberPackageId: booking.memberPackageId,
                bookingId: booking.id,
                transactionType: 'refund',
                creditsChange: 1,
                balanceAfter: updatedPackage.sessionsRemaining,
                notes: `Refund due to location deletion: ${classInstance.classType.name} on ${classInstance.startTime.toISOString()}`
              }
            });

            totalRefundedCredits++;
            totalCancelledBookings++;
          }
        }
      }

      // Deactivate all class schedules for this location
      await tx.classSchedule.updateMany({
        where: {
          locationId: locationId,
          isActive: true
        },
        data: {
          isActive: false
        }
      });

      // Soft delete by setting isActive to false
      const deletedLocation = await tx.location.update({
        where: { id: locationId },
        data: {
          isActive: false
        }
      });

      return {
        location: deletedLocation,
        cancelledClasses: futureClassInstances.length,
        cancelledBookings: totalCancelledBookings,
        refundedCredits: totalRefundedCredits
      };
    });

    res.json({
      success: true,
      data: {
        location: result.location,
        message: `Location deactivated successfully. ${result.cancelledClasses} future class(es) cancelled, ${result.refundedCredits} credit(s) refunded.`,
        details: {
          cancelledClasses: result.cancelledClasses,
          cancelledBookings: result.cancelledBookings,
          refundedCredits: result.refundedCredits
        }
      }
    });
  } catch (error) {
    console.error('Location deletion error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'An error occurred while deleting the location'
      }
    });
  }
};

/**
 * GET /api/admin/classes
 * List all class instances with filters
 */
export const getAllClassInstances = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { locationId, coachId, classTypeId, startDate, endDate, includeCancel } = req.query;

    // Build filter object
    const where: any = {};

    if (locationId) {
      where.locationId = parseInt(locationId as string);
    }

    if (coachId) {
      where.coachId = parseInt(coachId as string);
    }

    if (classTypeId) {
      where.classTypeId = parseInt(classTypeId as string);
    }

    if (startDate || endDate) {
      where.startTime = {};
      if (startDate) {
        where.startTime.gte = new Date(startDate as string);
      }
      if (endDate) {
        where.startTime.lte = new Date(endDate as string);
      }
    }

    // By default, exclude cancelled classes unless explicitly requested
    if (includeCancel !== 'true') {
      where.isCancelled = false;
    }

    // Fetch class instances
    const classInstances = await prisma.classInstance.findMany({
      where,
      include: {
        classType: {
          select: {
            id: true,
            name: true,
            description: true,
            durationMinutes: true
          }
        },
        location: {
          select: {
            id: true,
            name: true,
            address: true,
            isActive: true
          }
        },
        coach: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        bookings: {
          where: {
            status: {
              in: ['confirmed', 'attended', 'no_show']
            }
          },
          select: {
            id: true
          }
        }
      },
      orderBy: {
        startTime: 'asc'
      }
    });

    // Format response with booking count
    const formattedClasses = classInstances.map(classInstance => ({
      id: classInstance.id,
      classType: {
        id: classInstance.classType.id,
        name: classInstance.classType.name,
        description: classInstance.classType.description,
        duration: classInstance.classType.durationMinutes
      },
      location: {
        id: classInstance.location.id,
        name: classInstance.location.name,
        address: classInstance.location.address,
        isActive: classInstance.location.isActive
      },
      coach: {
        id: classInstance.coach.id,
        name: `${classInstance.coach.firstName} ${classInstance.coach.lastName}`,
        email: classInstance.coach.email
      },
      startTime: classInstance.startTime,
      endTime: classInstance.endTime,
      capacity: classInstance.capacity,
      bookingCount: classInstance.bookings.length,
      availableSpots: classInstance.capacity - classInstance.bookings.length,
      isCancelled: classInstance.isCancelled,
      createdAt: classInstance.createdAt
    }));

    res.json({
      success: true,
      data: {
        classes: formattedClasses,
        total: formattedClasses.length
      }
    });
  } catch (error) {
    console.error('Class instances fetch error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'An error occurred while fetching class instances'
      }
    });
  }
};

/**
 * GET /api/admin/classes/:id/roster
 * Get class roster with all bookings for admin view
 */
export const getClassRoster = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const classInstanceId = parseInt(req.params.id);

    if (!classInstanceId || isNaN(classInstanceId)) {
      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_CLASS_ID',
          message: 'Valid class instance ID is required'
        }
      });
      return;
    }

    // Fetch class instance
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
        },
        coach: {
          select: {
            firstName: true,
            lastName: true,
            email: true
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

    // Fetch all non-cancelled bookings for this class
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
            email: true,
            phone: true
          }
        },
        child: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            age: true
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
      memberPhone: booking.user.phone,
      bookedFor: booking.child 
        ? {
            type: 'child',
            id: booking.child.id,
            name: `${booking.child.firstName} ${booking.child.lastName}`,
            age: booking.child.age
          }
        : {
            type: 'self',
            name: `${booking.user.firstName} ${booking.user.lastName}`
          },
      isChildBooking: !!booking.child,
      status: booking.status,
      bookedAt: booking.bookedAt,
      attendanceMarkedAt: booking.attendanceMarkedAt
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
          coach: `${classInstance.coach.firstName} ${classInstance.coach.lastName}`,
          coachEmail: classInstance.coach.email,
          capacity: classInstance.capacity,
          isCancelled: classInstance.isCancelled
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
 * POST /api/admin/classes
 * Create a new class instance (with optional recurring support)
 */
export const createClassInstance = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { 
      classTypeId, 
      coachId, 
      locationId, 
      startTime, 
      capacity,
      recurring 
    } = req.body;

    // Validate required fields
    if (!classTypeId || !coachId || !locationId || !startTime || !capacity) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Class type, coach, location, start time, and capacity are required'
        }
      });
      return;
    }

    const capacityNum = parseInt(capacity);
    if (isNaN(capacityNum) || capacityNum < 1) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Capacity must be a positive number'
        }
      });
      return;
    }

    // Verify class type exists
    const classType = await prisma.classType.findUnique({
      where: { id: parseInt(classTypeId) }
    });

    if (!classType) {
      res.status(404).json({
        success: false,
        error: {
          code: 'CLASS_TYPE_NOT_FOUND',
          message: 'Class type not found'
        }
      });
      return;
    }

    // Verify coach exists and has coach role
    const coach = await prisma.user.findFirst({
      where: {
        id: parseInt(coachId),
        role: 'coach'
      }
    });

    if (!coach) {
      res.status(404).json({
        success: false,
        error: {
          code: 'COACH_NOT_FOUND',
          message: 'Coach not found or user is not a coach'
        }
      });
      return;
    }

    // Verify location exists and is active
    const location = await prisma.location.findFirst({
      where: {
        id: parseInt(locationId),
        isActive: true
      }
    });

    if (!location) {
      res.status(404).json({
        success: false,
        error: {
          code: 'LOCATION_NOT_FOUND',
          message: 'Location not found or is inactive'
        }
      });
      return;
    }

    const startDateTime = new Date(startTime);
    const endDateTime = new Date(startDateTime.getTime() + classType.durationMinutes * 60000);

    // Handle recurring class creation
    if (recurring && recurring.enabled) {
      const { frequency, count, endDate } = recurring;

      if (!frequency || (!count && !endDate)) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Recurring classes require frequency and either count or end date'
          }
        });
        return;
      }

      const classInstances = [];
      let currentStart = new Date(startDateTime);
      let iterations = 0;
      const maxIterations = count || 52; // Default max 52 weeks if using endDate
      const recurEndDate = endDate ? new Date(endDate) : null;

      while (iterations < maxIterations) {
        // Check if we've passed the end date
        if (recurEndDate && currentStart > recurEndDate) {
          break;
        }

        const currentEnd = new Date(currentStart.getTime() + classType.durationMinutes * 60000);

        classInstances.push({
          classTypeId: parseInt(classTypeId),
          coachId: parseInt(coachId),
          locationId: parseInt(locationId),
          startTime: new Date(currentStart),
          endTime: currentEnd,
          capacity: capacityNum,
          isCancelled: false
        });

        // Calculate next occurrence based on frequency
        switch (frequency) {
          case 'daily':
            currentStart.setDate(currentStart.getDate() + 1);
            break;
          case 'weekly':
            currentStart.setDate(currentStart.getDate() + 7);
            break;
          case 'biweekly':
            currentStart.setDate(currentStart.getDate() + 14);
            break;
          case 'monthly':
            currentStart.setMonth(currentStart.getMonth() + 1);
            break;
          default:
            res.status(400).json({
              success: false,
              error: {
                code: 'VALIDATION_ERROR',
                message: 'Invalid frequency. Must be daily, weekly, biweekly, or monthly'
              }
            });
            return;
        }

        iterations++;
      }

      // Create all recurring class instances
      const createdClasses = await prisma.classInstance.createMany({
        data: classInstances
      });

      res.status(201).json({
        success: true,
        data: {
          classesCreated: createdClasses.count,
          message: `Successfully created ${createdClasses.count} recurring class instances`
        }
      });
      return;
    }

    // Create single class instance
    const classInstance = await prisma.classInstance.create({
      data: {
        classTypeId: parseInt(classTypeId),
        coachId: parseInt(coachId),
        locationId: parseInt(locationId),
        startTime: startDateTime,
        endTime: endDateTime,
        capacity: capacityNum,
        isCancelled: false
      },
      include: {
        classType: {
          select: {
            name: true,
            durationMinutes: true
          }
        },
        location: {
          select: {
            name: true
          }
        },
        coach: {
          select: {
            firstName: true,
            lastName: true
          }
        }
      }
    });

    res.status(201).json({
      success: true,
      data: {
        class: {
          id: classInstance.id,
          classType: classInstance.classType.name,
          coach: `${classInstance.coach.firstName} ${classInstance.coach.lastName}`,
          location: classInstance.location.name,
          startTime: classInstance.startTime,
          endTime: classInstance.endTime,
          capacity: classInstance.capacity
        },
        message: 'Class instance created successfully'
      }
    });
  } catch (error) {
    console.error('Class instance creation error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'An error occurred while creating the class instance'
      }
    });
  }
};

/**
 * PUT /api/admin/classes/:id
 * Update a class instance (with booking notification)
 */
export const updateClassInstance = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const classInstanceId = parseInt(req.params.id);
    const { classTypeId, coachId, locationId, startTime, capacity, isCancelled } = req.body;

    if (isNaN(classInstanceId)) {
      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_CLASS_ID',
          message: 'Invalid class instance ID'
        }
      });
      return;
    }

    // Check if class instance exists
    const existingClass = await prisma.classInstance.findUnique({
      where: { id: classInstanceId },
      include: {
        classType: true,
        bookings: {
          where: {
            status: 'confirmed'
          },
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true
              }
            }
          }
        }
      }
    });

    if (!existingClass) {
      res.status(404).json({
        success: false,
        error: {
          code: 'CLASS_NOT_FOUND',
          message: 'Class instance not found'
        }
      });
      return;
    }

    // Build update data object
    const updateData: any = {};
    let durationMinutes = existingClass.classType.durationMinutes;

    if (classTypeId !== undefined) {
      const classType = await prisma.classType.findUnique({
        where: { id: parseInt(classTypeId) }
      });

      if (!classType) {
        res.status(404).json({
          success: false,
          error: {
            code: 'CLASS_TYPE_NOT_FOUND',
            message: 'Class type not found'
          }
        });
        return;
      }

      updateData.classTypeId = parseInt(classTypeId);
      durationMinutes = classType.durationMinutes;
    }

    if (coachId !== undefined) {
      const coach = await prisma.user.findFirst({
        where: {
          id: parseInt(coachId),
          role: 'coach'
        }
      });

      if (!coach) {
        res.status(404).json({
          success: false,
          error: {
            code: 'COACH_NOT_FOUND',
            message: 'Coach not found or user is not a coach'
          }
        });
        return;
      }

      updateData.coachId = parseInt(coachId);
    }

    if (locationId !== undefined) {
      const location = await prisma.location.findFirst({
        where: {
          id: parseInt(locationId),
          isActive: true
        }
      });

      if (!location) {
        res.status(404).json({
          success: false,
          error: {
            code: 'LOCATION_NOT_FOUND',
            message: 'Location not found or is inactive'
          }
        });
        return;
      }

      updateData.locationId = parseInt(locationId);
    }

    if (startTime !== undefined) {
      const startDateTime = new Date(startTime);
      const endDateTime = new Date(startDateTime.getTime() + durationMinutes * 60000);
      updateData.startTime = startDateTime;
      updateData.endTime = endDateTime;
    }

    if (capacity !== undefined) {
      const capacityNum = parseInt(capacity);
      if (isNaN(capacityNum) || capacityNum < 1) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Capacity must be a positive number'
          }
        });
        return;
      }

      // Check if new capacity is less than current bookings
      const bookingCount = existingClass.bookings.length;
      if (capacityNum < bookingCount) {
        res.status(400).json({
          success: false,
          error: {
            code: 'CAPACITY_TOO_LOW',
            message: `Cannot reduce capacity below current booking count (${bookingCount})`,
            details: {
              currentBookings: bookingCount,
              requestedCapacity: capacityNum
            }
          }
        });
        return;
      }

      updateData.capacity = capacityNum;
    }

    if (isCancelled !== undefined) {
      updateData.isCancelled = Boolean(isCancelled);
    }

    // Update class instance
    const updatedClass = await prisma.classInstance.update({
      where: { id: classInstanceId },
      data: updateData,
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
        },
        coach: {
          select: {
            firstName: true,
            lastName: true
          }
        }
      }
    });

    // Note: In a production system, you would send notifications to affected members here
    const affectedMembers = existingClass.bookings.length;

    res.json({
      success: true,
      data: {
        class: {
          id: updatedClass.id,
          classType: updatedClass.classType.name,
          coach: `${updatedClass.coach.firstName} ${updatedClass.coach.lastName}`,
          location: updatedClass.location.name,
          startTime: updatedClass.startTime,
          endTime: updatedClass.endTime,
          capacity: updatedClass.capacity,
          isCancelled: updatedClass.isCancelled
        },
        affectedMembers,
        message: `Class instance updated successfully${affectedMembers > 0 ? `. ${affectedMembers} member(s) have bookings for this class.` : ''}`
      }
    });
  } catch (error) {
    console.error('Class instance update error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'An error occurred while updating the class instance'
      }
    });
  }
};

/**
 * DELETE /api/admin/classes/:id
 * Delete a class instance with automatic refunds for all bookings
 */
export const deleteClassInstance = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const classInstanceId = parseInt(req.params.id);

    if (isNaN(classInstanceId)) {
      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_CLASS_ID',
          message: 'Invalid class instance ID'
        }
      });
      return;
    }

    // Check if class instance exists
    const classInstance = await prisma.classInstance.findUnique({
      where: { id: classInstanceId },
      include: {
        classType: {
          select: {
            name: true
          }
        },
        bookings: {
          where: {
            status: 'confirmed'
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
            memberPackage: true
          }
        }
      }
    });

    if (!classInstance) {
      res.status(404).json({
        success: false,
        error: {
          code: 'CLASS_NOT_FOUND',
          message: 'Class instance not found'
        }
      });
      return;
    }

    // Use transaction to cancel bookings and refund credits
    const result = await prisma.$transaction(async (tx) => {
      const refundedBookings = [];

      // Process each booking
      for (const booking of classInstance.bookings) {
        // Cancel the booking
        await tx.booking.update({
          where: { id: booking.id },
          data: {
            status: 'cancelled',
            cancelledAt: new Date()
          }
        });

        // Refund credit
        const updatedPackage = await tx.memberPackage.update({
          where: { id: booking.memberPackageId },
          data: {
            sessionsRemaining: booking.memberPackage.sessionsRemaining + 1
          }
        });

        // Create credit transaction log
        await tx.creditTransaction.create({
          data: {
            userId: booking.userId,
            memberPackageId: booking.memberPackageId,
            bookingId: booking.id,
            transactionType: 'refund',
            creditsChange: 1,
            balanceAfter: updatedPackage.sessionsRemaining,
            notes: `Refund due to class deletion: ${classInstance.classType.name} on ${classInstance.startTime.toISOString()}`
          }
        });

        refundedBookings.push({
          userId: booking.userId,
          userName: `${booking.user.firstName} ${booking.user.lastName}`,
          email: booking.user.email
        });
      }

      // Delete the class instance (cascade will handle bookings)
      await tx.classInstance.delete({
        where: { id: classInstanceId }
      });

      return {
        refundedBookings,
        bookingCount: classInstance.bookings.length
      };
    });

    res.json({
      success: true,
      data: {
        classId: classInstanceId,
        className: classInstance.classType.name,
        startTime: classInstance.startTime,
        bookingsRefunded: result.bookingCount,
        affectedMembers: result.refundedBookings,
        message: `Class instance deleted successfully. ${result.bookingCount} booking(s) cancelled and credits refunded.`
      }
    });
  } catch (error) {
    console.error('Class instance deletion error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'An error occurred while deleting the class instance'
      }
    });
  }
};

/**
 * GET /api/admin/class-types
 * List all class types
 */
export const getAllClassTypes = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const classTypes = await prisma.classType.findMany({
      orderBy: {
        name: 'asc'
      }
    });

    res.json({
      success: true,
      data: {
        classTypes,
        total: classTypes.length
      }
    });
  } catch (error) {
    console.error('Class types fetch error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'An error occurred while fetching class types'
      }
    });
  }
};

/**
 * GET /api/admin/coaches
 * List all users with coach role
 */
export const getAllCoaches = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const coaches = await prisma.user.findMany({
      where: {
        role: 'coach'
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        createdAt: true
      },
      orderBy: {
        firstName: 'asc'
      }
    });

    res.json({
      success: true,
      data: {
        coaches,
        total: coaches.length
      }
    });
  } catch (error) {
    console.error('Coaches fetch error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'An error occurred while fetching coaches'
      }
    });
  }
};

/**
 * GET /api/admin/packages
 * List all session packages (active and inactive) with purchase statistics
 */
export const getAllPackages = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // Fetch all packages with purchase count and location prices
    const packages = await prisma.sessionPackage.findMany({
      include: {
        _count: {
          select: {
            payments: {
              where: {
                status: 'approved'
              }
            }
          }
        },
        locationPackagePrices: {
          include: {
            location: {
              select: {
                id: true,
                name: true,
                isActive: true
              }
            }
          }
        }
      },
      orderBy: {
        sessionCount: 'asc'
      }
    });

    // Format response with purchase statistics and location prices
    const formattedPackages = packages.map(pkg => ({
      id: pkg.id,
      name: pkg.name,
      sessionCount: pkg.sessionCount,
      price: pkg.price,
      expiryDays: pkg.expiryDays,
      isActive: pkg.isActive,
      purchaseCount: pkg._count.payments,
      locationPrices: pkg.locationPackagePrices.map(lp => ({
        locationId: lp.locationId,
        locationName: lp.location.name,
        price: lp.price,
        isActive: lp.isActive
      })),
      createdAt: pkg.createdAt,
      updatedAt: pkg.updatedAt
    }));

    res.json({
      success: true,
      data: {
        packages: formattedPackages,
        total: formattedPackages.length
      }
    });
  } catch (error) {
    console.error('Packages fetch error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'An error occurred while fetching packages'
      }
    });
  }
};

/**
 * POST /api/admin/packages
 * Create a new session package
 */
export const createPackage = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, sessionCount, price, expiryDays, includeVat } = req.body;

    // Validate required fields
    if (!name || !sessionCount || !price || !expiryDays) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Name, session count, price, and expiry days are required'
        }
      });
      return;
    }

    // Validate session count
    const sessionCountNum = parseInt(sessionCount);
    if (isNaN(sessionCountNum) || sessionCountNum < 1) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Session count must be a positive number'
        }
      });
      return;
    }

    // Validate price
    const priceNum = parseFloat(price);
    if (isNaN(priceNum) || priceNum <= 0) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Price must be a positive number'
        }
      });
      return;
    }

    // Validate expiry days
    const expiryDaysNum = parseInt(expiryDays);
    if (isNaN(expiryDaysNum) || expiryDaysNum < 1) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Expiry days must be a positive number'
        }
      });
      return;
    }

    // Check if package with same name already exists
    const existingPackage = await prisma.sessionPackage.findFirst({
      where: {
        name: name.trim()
      }
    });

    if (existingPackage) {
      res.status(409).json({
        success: false,
        error: {
          code: 'PACKAGE_EXISTS',
          message: 'A package with this name already exists'
        }
      });
      return;
    }

    // Create package
    const newPackage = await prisma.sessionPackage.create({
      data: {
        name: name.trim(),
        sessionCount: sessionCountNum,
        price: priceNum,
        expiryDays: expiryDaysNum,
        includeVat: includeVat !== undefined ? Boolean(includeVat) : false,
        isActive: true
      } as any
    });

    res.status(201).json({
      success: true,
      data: {
        package: newPackage,
        message: 'Package created successfully'
      }
    });
  } catch (error) {
    console.error('Package creation error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'An error occurred while creating the package'
      }
    });
  }
};

/**
 * PUT /api/admin/packages/:id
 * Update a session package (only affects new purchases)
 */
export const updatePackage = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const packageId = parseInt(req.params.id);
    const { name, sessionCount, price, expiryDays, includeVat, isActive } = req.body;

    if (isNaN(packageId)) {
      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_PACKAGE_ID',
          message: 'Invalid package ID'
        }
      });
      return;
    }

    // Check if package exists
    const existingPackage = await prisma.sessionPackage.findUnique({
      where: { id: packageId }
    });

    if (!existingPackage) {
      res.status(404).json({
        success: false,
        error: {
          code: 'PACKAGE_NOT_FOUND',
          message: 'Package not found'
        }
      });
      return;
    }

    // Build update data object
    const updateData: any = {};

    if (name !== undefined) {
      const trimmedName = name.trim();
      if (!trimmedName) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Name cannot be empty'
          }
        });
        return;
      }

      // Check if another package has this name
      const duplicateName = await prisma.sessionPackage.findFirst({
        where: {
          name: trimmedName,
          id: { not: packageId }
        }
      });

      if (duplicateName) {
        res.status(409).json({
          success: false,
          error: {
            code: 'PACKAGE_EXISTS',
            message: 'A package with this name already exists'
          }
        });
        return;
      }

      updateData.name = trimmedName;
    }

    if (sessionCount !== undefined) {
      const sessionCountNum = parseInt(sessionCount);
      if (isNaN(sessionCountNum) || sessionCountNum < 1) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Session count must be a positive number'
          }
        });
        return;
      }
      updateData.sessionCount = sessionCountNum;
    }

    if (price !== undefined) {
      const priceNum = parseFloat(price);
      if (isNaN(priceNum) || priceNum <= 0) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Price must be a positive number'
          }
        });
        return;
      }
      updateData.price = priceNum;
    }

    if (expiryDays !== undefined) {
      const expiryDaysNum = parseInt(expiryDays);
      if (isNaN(expiryDaysNum) || expiryDaysNum < 1) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Expiry days must be a positive number'
          }
        });
        return;
      }
      updateData.expiryDays = expiryDaysNum;
    }

    if (includeVat !== undefined) {
      updateData.includeVat = Boolean(includeVat);
    }

    if (isActive !== undefined) {
      updateData.isActive = Boolean(isActive);
    }

    // Update package (only affects new purchases)
    const updatedPackage = await prisma.sessionPackage.update({
      where: { id: packageId },
      data: updateData as any
    });

    res.json({
      success: true,
      data: {
        package: updatedPackage,
        message: 'Package updated successfully. Changes will only affect new purchases.'
      }
    });
  } catch (error) {
    console.error('Package update error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'An error occurred while updating the package'
      }
    });
  }
};

/**
 * DELETE /api/admin/packages/:id
 * Soft delete a package (set isActive to false)
 */
export const deletePackage = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const packageId = parseInt(req.params.id);

    if (isNaN(packageId)) {
      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_PACKAGE_ID',
          message: 'Invalid package ID'
        }
      });
      return;
    }

    // Check if package exists
    const existingPackage = await prisma.sessionPackage.findUnique({
      where: { id: packageId }
    });

    if (!existingPackage) {
      res.status(404).json({
        success: false,
        error: {
          code: 'PACKAGE_NOT_FOUND',
          message: 'Package not found'
        }
      });
      return;
    }

    // Check if package is already inactive
    if (!existingPackage.isActive) {
      res.status(400).json({
        success: false,
        error: {
          code: 'PACKAGE_ALREADY_INACTIVE',
          message: 'Package is already inactive'
        }
      });
      return;
    }

    // Soft delete by setting isActive to false
    const deactivatedPackage = await prisma.sessionPackage.update({
      where: { id: packageId },
      data: {
        isActive: false
      }
    });

    res.json({
      success: true,
      data: {
        package: deactivatedPackage,
        message: 'Package deactivated successfully. Existing member packages are not affected.'
      }
    });
  } catch (error) {
    console.error('Package deletion error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'An error occurred while deactivating the package'
      }
    });
  }
};

/**
 * GET /api/admin/packages/:id/location-prices
 * Get all location-specific prices for a package
 */
export const getPackageLocationPrices = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const packageId = parseInt(req.params.id);

    if (isNaN(packageId)) {
      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_PACKAGE_ID',
          message: 'Invalid package ID'
        }
      });
      return;
    }

    // Fetch all location prices for this package
    const locationPrices = await prisma.locationPackagePrice.findMany({
      where: {
        packageId
      },
      include: {
        location: {
          select: {
            id: true,
            name: true,
            address: true,
            isActive: true
          }
        },
        package: {
          select: {
            id: true,
            name: true,
            price: true // Default price
          }
        }
      },
      orderBy: {
        location: {
          name: 'asc'
        }
      }
    });

    // Also get all locations to show which ones don't have custom prices
    const allLocations = await prisma.location.findMany({
      where: {
        isActive: true
      },
      orderBy: {
        name: 'asc'
      }
    });

    // Map locations with their prices
    const locationsWithPrices = allLocations.map(location => {
      const locationPrice = locationPrices.find(lp => lp.locationId === location.id);
      return {
        locationId: location.id,
        locationName: location.name,
        locationAddress: location.address,
        hasCustomPrice: !!locationPrice,
        price: locationPrice ? locationPrice.price : null,
        isActive: locationPrice ? locationPrice.isActive : true,
        createdAt: locationPrice?.createdAt,
        updatedAt: locationPrice?.updatedAt
      };
    });

    res.json({
      success: true,
      data: {
        packageId,
        defaultPrice: locationPrices[0]?.package.price || null,
        locations: locationsWithPrices
      }
    });
  } catch (error) {
    console.error('Package location prices fetch error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'An error occurred while fetching location prices'
      }
    });
  }
};

/**
 * PUT /api/admin/packages/:packageId/location-prices/:locationId
 * Set or update location-specific price for a package
 */
export const setPackageLocationPrice = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const packageId = parseInt(req.params.packageId);
    const locationId = parseInt(req.params.locationId);
    const { price, includeVat, isActive } = req.body;

    if (isNaN(packageId) || isNaN(locationId)) {
      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_ID',
          message: 'Invalid package ID or location ID'
        }
      });
      return;
    }

    // Validate price
    if (!price) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Price is required'
        }
      });
      return;
    }

    const priceNum = parseFloat(price);
    if (isNaN(priceNum) || priceNum <= 0) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Price must be a positive number'
        }
      });
      return;
    }

    // Verify package exists
    const packageExists = await prisma.sessionPackage.findUnique({
      where: { id: packageId }
    });

    if (!packageExists) {
      res.status(404).json({
        success: false,
        error: {
          code: 'PACKAGE_NOT_FOUND',
          message: 'Package not found'
        }
      });
      return;
    }

    // Verify location exists
    const locationExists = await prisma.location.findUnique({
      where: { id: locationId }
    });

    if (!locationExists) {
      res.status(404).json({
        success: false,
        error: {
          code: 'LOCATION_NOT_FOUND',
          message: 'Location not found'
        }
      });
      return;
    }

    // Upsert location package price
    const locationPrice = await prisma.locationPackagePrice.upsert({
      where: {
        locationId_packageId: {
          locationId,
          packageId
        }
      },
      update: {
        price: priceNum,
        includeVat: includeVat !== undefined ? Boolean(includeVat) : false,
        isActive: isActive !== undefined ? Boolean(isActive) : true,
        updatedAt: new Date()
      } as any,
      create: {
        locationId,
        packageId,
        price: priceNum,
        includeVat: includeVat !== undefined ? Boolean(includeVat) : false,
        isActive: isActive !== undefined ? Boolean(isActive) : true
      } as any,
      include: {
        location: {
          select: {
            name: true
          }
        },
        package: {
          select: {
            name: true
          }
        }
      }
    });

    res.json({
      success: true,
      data: {
        locationPrice: {
          id: locationPrice.id,
          locationId: locationPrice.locationId,
          locationName: (locationPrice as any).location?.name || '',
          packageId: locationPrice.packageId,
          packageName: (locationPrice as any).package?.name || '',
          price: locationPrice.price,
          includeVat: (locationPrice as any).includeVat || false,
          isActive: locationPrice.isActive
        },
        message: 'Location package price updated successfully'
      }
    });
  } catch (error) {
    console.error('Location package price update error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'An error occurred while updating location package price'
      }
    });
  }
};

/**
 * DELETE /api/admin/packages/:packageId/location-prices/:locationId
 * Remove location-specific price (will use default package price)
 */
export const removePackageLocationPrice = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const packageId = parseInt(req.params.packageId);
    const locationId = parseInt(req.params.locationId);

    if (isNaN(packageId) || isNaN(locationId)) {
      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_ID',
          message: 'Invalid package ID or location ID'
        }
      });
      return;
    }

    // Check if location price exists
    const locationPrice = await prisma.locationPackagePrice.findUnique({
      where: {
        locationId_packageId: {
          locationId,
          packageId
        }
      }
    });

    if (!locationPrice) {
      res.status(404).json({
        success: false,
        error: {
          code: 'LOCATION_PRICE_NOT_FOUND',
          message: 'Location-specific price not found'
        }
      });
      return;
    }

    // Delete location price
    await prisma.locationPackagePrice.delete({
      where: {
        locationId_packageId: {
          locationId,
          packageId
        }
      }
    });

    res.json({
      success: true,
      data: {
        message: 'Location-specific price removed. Package will use default price for this location.'
      }
    });
  } catch (error) {
    console.error('Location package price removal error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'An error occurred while removing location package price'
      }
    });
  }
};

/**
 * GET /api/admin/members/:id/package-prices
 * Get all member-specific package prices for a member
 */
export const getMemberPackagePrices = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const memberId = parseInt(req.params.id);

    if (isNaN(memberId)) {
      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_MEMBER_ID',
          message: 'Invalid member ID'
        }
      });
      return;
    }

    // Verify member exists
    const member = await prisma.user.findUnique({
      where: { id: memberId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true
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

    // Fetch all member-specific prices
    const memberPrices = await prisma.memberPackagePrice.findMany({
      where: {
        userId: memberId
      },
      include: {
        package: {
          select: {
            id: true,
            name: true,
            sessionCount: true,
            price: true,
            expiryDays: true,
            isActive: true
          }
        }
      },
      orderBy: {
        package: {
          sessionCount: 'asc'
        }
      }
    });

    // Also get all active packages to show which ones don't have custom prices
    const allPackages = await prisma.sessionPackage.findMany({
      where: {
        isActive: true
      },
      orderBy: {
        sessionCount: 'asc'
      }
    });

    // Map packages with their member-specific prices
    const packagesWithPrices = allPackages.map(pkg => {
      const memberPrice = memberPrices.find(mp => mp.packageId === pkg.id);
      return {
        packageId: pkg.id,
        packageName: pkg.name,
        sessionCount: pkg.sessionCount,
        defaultPrice: pkg.price,
        expiryDays: pkg.expiryDays,
        hasCustomPrice: !!memberPrice,
        customPrice: memberPrice ? memberPrice.price : null,
        isActive: memberPrice ? memberPrice.isActive : true,
        createdAt: memberPrice?.createdAt,
        updatedAt: memberPrice?.updatedAt
      };
    });

    res.json({
      success: true,
      data: {
        member: {
          id: member.id,
          name: `${member.firstName} ${member.lastName}`,
          email: member.email
        },
        packages: packagesWithPrices
      }
    });
  } catch (error) {
    console.error('Member package prices fetch error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'An error occurred while fetching member package prices'
      }
    });
  }
};

/**
 * PUT /api/admin/members/:memberId/package-prices/:packageId
 * Set or update member-specific price for a package (applies to all purchases, not just renewals)
 */
export const setMemberPackagePrice = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const memberId = parseInt(req.params.memberId);
    const packageId = parseInt(req.params.packageId);
    const { price, isActive } = req.body;

    if (isNaN(memberId) || isNaN(packageId)) {
      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_ID',
          message: 'Invalid member ID or package ID'
        }
      });
      return;
    }

    // Validate price
    if (!price) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Price is required'
        }
      });
      return;
    }

    const priceNum = parseFloat(price);
    if (isNaN(priceNum) || priceNum <= 0) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Price must be a positive number'
        }
      });
      return;
    }

    // Verify member exists and is a member
    const member = await prisma.user.findUnique({
      where: { id: memberId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true
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

    // Verify package exists
    const packageExists = await prisma.sessionPackage.findUnique({
      where: { id: packageId }
    });

    if (!packageExists) {
      res.status(404).json({
        success: false,
        error: {
          code: 'PACKAGE_NOT_FOUND',
          message: 'Package not found'
        }
      });
      return;
    }

    // Upsert member package price
    const memberPrice = await prisma.memberPackagePrice.upsert({
      where: {
        userId_packageId: {
          userId: memberId,
          packageId
        }
      },
      update: {
        price: priceNum,
        isActive: isActive !== undefined ? Boolean(isActive) : true,
        updatedAt: new Date()
      },
      create: {
        userId: memberId,
        packageId,
        price: priceNum,
        isActive: isActive !== undefined ? Boolean(isActive) : true
      },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true
          }
        },
        package: {
          select: {
            name: true
          }
        }
      }
    });

    res.json({
      success: true,
      data: {
        memberPrice: {
          id: memberPrice.id,
          userId: memberPrice.userId,
          memberName: `${memberPrice.user.firstName} ${memberPrice.user.lastName}`,
          packageId: memberPrice.packageId,
          packageName: memberPrice.package.name,
          price: memberPrice.price,
          isActive: memberPrice.isActive
        },
        message: 'Member package price updated successfully. This price will apply when the member renews their package.'
      }
    });
  } catch (error) {
    console.error('Member package price update error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'An error occurred while updating member package price'
      }
    });
  }
};

/**
 * DELETE /api/admin/members/:memberId/package-prices/:packageId
 * Remove member-specific price (member will use normal location-based pricing)
 */
export const removeMemberPackagePrice = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const memberId = parseInt(req.params.memberId);
    const packageId = parseInt(req.params.packageId);

    if (isNaN(memberId) || isNaN(packageId)) {
      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_ID',
          message: 'Invalid member ID or package ID'
        }
      });
      return;
    }

    // Check if member price exists
    const memberPrice = await prisma.memberPackagePrice.findUnique({
      where: {
        userId_packageId: {
          userId: memberId,
          packageId
        }
      }
    });

    if (!memberPrice) {
      res.status(404).json({
        success: false,
        error: {
          code: 'MEMBER_PRICE_NOT_FOUND',
          message: 'Member-specific price not found'
        }
      });
      return;
    }

    // Delete member price
    await prisma.memberPackagePrice.delete({
      where: {
        userId_packageId: {
          userId: memberId,
          packageId
        }
      }
    });

    res.json({
      success: true,
      data: {
        message: 'Member-specific price removed. Member will use normal location-based pricing.'
      }
    });
  } catch (error) {
    console.error('Member package price removal error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'An error occurred while removing member package price'
      }
    });
  }
};

/**
 * GET /api/admin/reports/attendance
 * Generate attendance report with date range filter
 */
export const getAttendanceReport = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { startDate, endDate, format } = req.query;

    // Build date filter
    const where: any = {
      status: {
        in: ['attended', 'no_show']
      }
    };

    if (startDate || endDate) {
      where.classInstance = {
        startTime: {}
      };
      if (startDate) {
        where.classInstance.startTime.gte = new Date(startDate as string);
      }
      if (endDate) {
        const endDateTime = new Date(endDate as string);
        endDateTime.setHours(23, 59, 59, 999);
        where.classInstance.startTime.lte = endDateTime;
      }
    }

    // Fetch all attendance records
    const bookings = await prisma.booking.findMany({
      where,
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
            },
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
      },
      orderBy: {
        classInstance: {
          startTime: 'desc'
        }
      }
    });

    // Calculate statistics
    const totalBookings = bookings.length;
    const attendedCount = bookings.filter(b => b.status === 'attended').length;
    const noShowCount = bookings.filter(b => b.status === 'no_show').length;
    const noShowRate = totalBookings > 0 ? ((noShowCount / totalBookings) * 100).toFixed(2) : '0.00';

    // Group by class instance to calculate attendees per class
    const classSummary = bookings.reduce((acc: any, booking) => {
      const classId = booking.classInstance.id;
      if (!acc[classId]) {
        acc[classId] = {
          classId,
          className: booking.classInstance.classType.name,
          location: booking.classInstance.location.name,
          coach: `${booking.classInstance.coach.firstName} ${booking.classInstance.coach.lastName}`,
          startTime: booking.classInstance.startTime,
          capacity: booking.classInstance.capacity,
          totalAttendees: 0,
          attended: 0,
          noShows: 0
        };
      }
      acc[classId].totalAttendees++;
      if (booking.status === 'attended') {
        acc[classId].attended++;
      } else if (booking.status === 'no_show') {
        acc[classId].noShows++;
      }
      return acc;
    }, {});

    const classBreakdown = Object.values(classSummary).sort((a: any, b: any) => 
      new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
    );

    // Identify most attended classes
    const mostAttended = [...classBreakdown]
      .sort((a: any, b: any) => b.attended - a.attended)
      .slice(0, 10);

    // Prepare report data
    const reportData = {
      summary: {
        totalBookings,
        attended: attendedCount,
        noShows: noShowCount,
        noShowRate: `${noShowRate}%`,
        dateRange: {
          start: startDate || 'All time',
          end: endDate || 'Present'
        }
      },
      classBreakdown,
      mostAttendedClasses: mostAttended,
      detailedBookings: bookings.map(booking => ({
        id: booking.id,
        member: `${booking.user.firstName} ${booking.user.lastName}`,
        bookedFor: booking.child 
          ? `${booking.child.firstName} ${booking.child.lastName} (Child)`
          : 'Self',
        className: booking.classInstance.classType.name,
        location: booking.classInstance.location.name,
        coach: `${booking.classInstance.coach.firstName} ${booking.classInstance.coach.lastName}`,
        startTime: booking.classInstance.startTime,
        status: booking.status,
        markedAt: booking.attendanceMarkedAt
      }))
    };

    // Handle CSV export
    if (format === 'csv') {
      const csvRows = [
        ['Class', 'Location', 'Coach', 'Date', 'Total Attendees', 'Attended', 'No Shows', 'No Show Rate'].join(','),
        ...classBreakdown.map((cls: any) => [
          cls.className,
          cls.location,
          cls.coach,
          new Date(cls.startTime).toISOString().split('T')[0],
          cls.totalAttendees,
          cls.attended,
          cls.noShows,
          `${((cls.noShows / cls.totalAttendees) * 100).toFixed(2)}%`
        ].join(','))
      ];

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=attendance-report.csv');
      res.send(csvRows.join('\n'));
      return;
    }

    // Return JSON by default
    res.json({
      success: true,
      data: reportData
    });
  } catch (error) {
    console.error('Attendance report error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'An error occurred while generating the attendance report'
      }
    });
  }
};

/**
 * GET /api/admin/reports/revenue
 * Generate revenue report with date range filter
 */
export const getRevenueReport = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { startDate, endDate, format } = req.query;

    // Build date filter for approved payments
    const approvedWhere: any = {
      status: 'approved'
    };

    if (startDate || endDate) {
      approvedWhere.reviewedAt = {};
      if (startDate) {
        approvedWhere.reviewedAt.gte = new Date(startDate as string);
      }
      if (endDate) {
        const endDateTime = new Date(endDate as string);
        endDateTime.setHours(23, 59, 59, 999);
        approvedWhere.reviewedAt.lte = endDateTime;
      }
    }

    // Fetch approved payments
    const approvedPayments = await prisma.payment.findMany({
      where: approvedWhere,
      include: {
        package: {
          select: {
            name: true,
            sessionCount: true
          }
        },
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true
          }
        },
        location: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: {
        reviewedAt: 'desc'
      }
    });

    // Fetch pending payments (not filtered by date)
    const pendingPayments = await prisma.payment.findMany({
      where: {
        status: 'pending'
      },
      include: {
        package: {
          select: {
            name: true,
            sessionCount: true
          }
        }
      }
    });

    // Calculate total revenue from approved payments
    const totalRevenue = approvedPayments.reduce((sum, payment) => 
      sum + Number(payment.amount), 0
    );

    // Calculate pending payment value
    const pendingValue = pendingPayments.reduce((sum, payment) => 
      sum + Number(payment.amount), 0
    );

    // Break down by package type
    const packageBreakdown = approvedPayments.reduce((acc: any, payment) => {
      const packageName = payment.package.name;
      if (!acc[packageName]) {
        acc[packageName] = {
          packageName,
          sessionCount: payment.package.sessionCount,
          totalSales: 0,
          revenue: 0,
          count: 0
        };
      }
      acc[packageName].count++;
      acc[packageName].revenue += Number(payment.amount);
      acc[packageName].totalSales = acc[packageName].count;
      return acc;
    }, {});

    const packageSummary = Object.values(packageBreakdown).sort((a: any, b: any) => 
      b.revenue - a.revenue
    );

    // Prepare report data
    const reportData = {
      summary: {
        totalRevenue: totalRevenue.toFixed(2),
        pendingRevenue: pendingValue.toFixed(2),
        approvedPayments: approvedPayments.length,
        pendingPayments: pendingPayments.length,
        dateRange: {
          start: startDate || 'All time',
          end: endDate || 'Present'
        }
      },
      packageBreakdown: packageSummary,
      recentPayments: approvedPayments.slice(0, 50).map(payment => ({
        id: payment.id,
        member: `${payment.user.firstName} ${payment.user.lastName}`,
        email: payment.user.email,
        package: payment.package.name,
        location: payment.location?.name || 'N/A',
        amount: Number(payment.amount).toFixed(2),
        approvedAt: payment.reviewedAt,
        submittedAt: payment.createdAt
      })),
      pendingPaymentsSummary: {
        count: pendingPayments.length,
        totalValue: pendingValue.toFixed(2),
        packages: pendingPayments.reduce((acc: any, payment) => {
          const packageName = payment.package.name;
          if (!acc[packageName]) {
            acc[packageName] = { count: 0, value: 0 };
          }
          acc[packageName].count++;
          acc[packageName].value += Number(payment.amount);
          return acc;
        }, {})
      }
    };

    // Location breakdown
    const locationBreakdown = approvedPayments.reduce((acc: any, payment) => {
      const locationName = payment.location?.name || 'No Location';
      if (!acc[locationName]) {
        acc[locationName] = {
          locationName,
          revenue: 0,
          count: 0
        };
      }
      acc[locationName].count++;
      acc[locationName].revenue += Number(payment.amount);
      return acc;
    }, {});

    const locationSummary = Object.values(locationBreakdown).sort((a: any, b: any) => 
      b.revenue - a.revenue
    );

    // Add location breakdown to report data
    const reportDataWithLocation = {
      ...reportData,
      locationBreakdown: locationSummary
    };

    // Handle CSV export
    if (format === 'csv') {
      const csvRows = [
        ['Package', 'Session Count', 'Sales Count', 'Total Revenue'].join(','),
        ...packageSummary.map((pkg: any) => [
          pkg.packageName,
          pkg.sessionCount,
          pkg.count,
          `$${pkg.revenue.toFixed(2)}`
        ].join(','))
      ];

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=revenue-report.csv');
      res.send(csvRows.join('\n'));
      return;
    }

    // Return JSON by default
    res.json({
      success: true,
      data: reportDataWithLocation
    });
  } catch (error) {
    console.error('Revenue report error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'An error occurred while generating the revenue report'
      }
    });
  }
};

/**
 * GET /api/admin/dashboard/stats
 * Get dashboard statistics for admin overview
 */
export const getDashboardStats = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const now = new Date();
    const startOfToday = new Date(now);
    startOfToday.setHours(0, 0, 0, 0);
    const endOfToday = new Date(now);
    endOfToday.setHours(23, 59, 59, 999);
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay()); // Start of week (Sunday)
    startOfWeek.setHours(0, 0, 0, 0);

    // Get total members
    const totalMembers = await prisma.user.count({
      where: { role: 'member' }
    });

    // Get total coaches
    const totalCoaches = await prisma.user.count({
      where: { role: 'coach' }
    });

    // Get pending payments count
    const pendingPaymentsCount = await prisma.payment.count({
      where: { status: 'pending' }
    });

    // Get total bookings (exclude cancelled)
    const totalBookings = await prisma.booking.count({
      where: { 
        status: {
          not: 'cancelled'
        }
      }
    });

    // Get today's bookings (exclude cancelled)
    const todayBookings = await prisma.booking.count({
      where: {
        status: {
          not: 'cancelled'
        },
        classInstance: {
          startTime: {
            gte: startOfToday,
            lte: endOfToday
          }
        }
      }
    });

    // Get this week's bookings (exclude cancelled)
    const weekBookings = await prisma.booking.count({
      where: {
        status: {
          not: 'cancelled'
        },
        classInstance: {
          startTime: {
            gte: startOfWeek
          }
        }
      }
    });

    // Get upcoming classes (next 7 days)
    const upcomingClasses = await prisma.classInstance.count({
      where: {
        startTime: {
          gte: now
        },
        isCancelled: false
      }
    });

    // Get today's classes
    const todayClasses = await prisma.classInstance.count({
      where: {
        startTime: {
          gte: startOfToday,
          lte: endOfToday
        },
        isCancelled: false
      }
    });

    // Get total revenue (from approved payments)
    const totalRevenue = await prisma.payment.aggregate({
      where: {
        status: 'approved'
      },
      _sum: {
        amount: true
      }
    });

    // Get this month's revenue
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const thisMonthRevenue = await prisma.payment.aggregate({
      where: {
        status: 'approved',
        reviewedAt: {
          gte: startOfMonth
        }
      },
      _sum: {
        amount: true
      }
    });

    // Get recent pending payments (last 5)
    const recentPendingPayments = await prisma.payment.findMany({
      where: { status: 'pending' },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true
          }
        },
        package: {
          select: {
            name: true,
            price: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 5
    });

    // Get upcoming classes (next 5)
    const upcomingClassesList = await prisma.classInstance.findMany({
      where: {
        startTime: {
          gte: now
        },
        isCancelled: false
      },
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
        },
        coach: {
          select: {
            firstName: true,
            lastName: true
          }
        },
        bookings: {
          where: {
            status: {
              not: 'cancelled'
            }
          },
          select: {
            id: true
          }
        }
      },
      orderBy: {
        startTime: 'asc'
      },
      take: 5
    });

    res.json({
      success: true,
      data: {
        overview: {
          totalMembers,
          totalCoaches,
          pendingPaymentsCount,
          totalBookings,
          todayBookings,
          weekBookings,
          upcomingClasses,
          todayClasses,
          totalRevenue: totalRevenue._sum.amount ? Number(totalRevenue._sum.amount).toFixed(2) : '0.00',
          thisMonthRevenue: thisMonthRevenue._sum.amount ? Number(thisMonthRevenue._sum.amount).toFixed(2) : '0.00'
        },
        recentPendingPayments: recentPendingPayments.map(payment => ({
          id: payment.id,
          member: `${payment.user.firstName} ${payment.user.lastName}`,
          email: payment.user.email,
          package: payment.package.name,
          amount: Number(payment.amount).toFixed(2),
          submittedAt: payment.createdAt
        })),
        upcomingClasses: upcomingClassesList.map(classInstance => ({
          id: classInstance.id,
          classType: classInstance.classType.name,
          location: classInstance.location.name,
          coach: `${classInstance.coach.firstName} ${classInstance.coach.lastName}`,
          startTime: classInstance.startTime,
          bookingCount: classInstance.bookings.length,
          capacity: classInstance.capacity
        }))
      }
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'An error occurred while fetching dashboard statistics'
      }
    });
  }
};

/**
 * GET /api/admin/members
 * Get all members with optional search and filters
 */
export const getAllMembers = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { search, status, sortBy, sortOrder } = req.query;

    // Build where clause
    const where: any = {
      role: 'member',
      deletedAt: null // Exclude soft-deleted members
    };

    // Search filter (name, email, phone)
    const searchConditions: any[] = [];
    if (search && typeof search === 'string') {
      const searchTerm = search.trim();
      if (searchTerm) {
        searchConditions.push(
          { firstName: { contains: searchTerm, mode: 'insensitive' } },
          { lastName: { contains: searchTerm, mode: 'insensitive' } },
          { email: { contains: searchTerm, mode: 'insensitive' } },
          { phone: { contains: searchTerm, mode: 'insensitive' } }
        );
      }
    }

    // Status filter (active/inactive based on memberPackages)
    if (status === 'active') {
      where.memberPackages = {
        some: {
          expiryDate: {
            gte: new Date()
          },
          sessionsRemaining: {
            gt: 0
          }
        }
      };
      // Add search conditions if they exist
      if (searchConditions.length > 0) {
        where.AND = [
          { OR: searchConditions },
          { memberPackages: where.memberPackages }
        ];
        delete where.memberPackages;
      }
    } else if (status === 'inactive') {
      const inactiveConditions = [
        { memberPackages: { none: {} } },
        {
          memberPackages: {
            every: {
              OR: [
                { expiryDate: { lt: new Date() } },
                { sessionsRemaining: { lte: 0 } }
              ]
            }
          }
        }
      ];
      
      if (searchConditions.length > 0) {
        where.AND = [
          { OR: searchConditions },
          { OR: inactiveConditions }
        ];
      } else {
        where.OR = inactiveConditions;
      }
    } else {
      // No status filter, just add search if exists
      if (searchConditions.length > 0) {
        where.OR = searchConditions;
      }
    }

    // Sort options
    let orderBy: any;
    if (sortBy === 'name') {
      // When sorting by name, use array format for multiple fields
      orderBy = [
        { firstName: sortOrder === 'desc' ? 'desc' : 'asc' },
        { lastName: sortOrder === 'desc' ? 'desc' : 'asc' }
      ];
    } else if (sortBy === 'email') {
      orderBy = { email: sortOrder === 'desc' ? 'desc' : 'asc' };
    } else if (sortBy === 'createdAt') {
      orderBy = { createdAt: sortOrder === 'desc' ? 'desc' : 'asc' };
    } else {
      // Default: sort by createdAt desc
      orderBy = { createdAt: 'desc' };
    }

    // Fetch members with basic info
    const members = await prisma.user.findMany({
      where,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        isPaused: true,
        isFrozen: true,
        deletedAt: true,
        createdAt: true,
        memberPackages: {
          where: {
            expiryDate: {
              gte: new Date()
            },
            sessionsRemaining: {
              gt: 0
            }
          },
          select: {
            id: true,
            package: {
              select: {
                name: true
              }
            },
            expiryDate: true,
            sessionsRemaining: true
          },
          orderBy: {
            expiryDate: 'desc'
          },
          take: 1
        },
        _count: {
          select: {
            bookings: true,
            payments: true,
            memberPackages: true
          }
        }
      },
      orderBy
    });

    // Format response
    const formattedMembers = members.map(member => {
      const activePackage = member.memberPackages[0] || null;
      return {
        id: member.id,
        name: `${member.firstName} ${member.lastName}`,
        firstName: member.firstName,
        lastName: member.lastName,
        email: member.email,
        phone: member.phone,
        createdAt: member.createdAt,
        isActive: !!activePackage,
        isPaused: member.isPaused,
        isFrozen: member.isFrozen,
        isDeleted: !!member.deletedAt,
        activePackage: activePackage ? {
          name: activePackage.package.name,
          expiryDate: activePackage.expiryDate,
          remainingSessions: activePackage.sessionsRemaining
        } : null,
        stats: {
          totalBookings: member._count.bookings,
          totalPayments: member._count.payments,
          totalPackages: member._count.memberPackages
        }
      };
    });

    res.json({
      success: true,
      data: {
        members: formattedMembers,
        total: formattedMembers.length
      }
    });
  } catch (error) {
    console.error('Get all members error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'An error occurred while fetching members'
      }
    });
  }
};

/**
 * PUT /api/admin/members/:id/pause
 * Pause a member account (temporarily disable access)
 */
export const pauseMember = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const memberId = parseInt(req.params.id);

    if (isNaN(memberId)) {
      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_MEMBER_ID',
          message: 'Valid member ID is required'
        }
      });
      return;
    }

    const member = await prisma.user.findUnique({
      where: { id: memberId }
    });

    if (!member || member.role !== 'member') {
      res.status(404).json({
        success: false,
        error: {
          code: 'MEMBER_NOT_FOUND',
          message: 'Member not found'
        }
      });
      return;
    }

    const updatedMember = await prisma.user.update({
      where: { id: memberId },
      data: { isPaused: true },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        isPaused: true,
        isFrozen: true
      }
    });

    res.json({
      success: true,
      data: {
        member: updatedMember,
        message: 'Member account has been paused'
      }
    });
  } catch (error) {
    console.error('Pause member error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'An error occurred while pausing member'
      }
    });
  }
};

/**
 * PUT /api/admin/members/:id/unpause
 * Unpause a member account
 */
export const unpauseMember = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const memberId = parseInt(req.params.id);

    if (isNaN(memberId)) {
      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_MEMBER_ID',
          message: 'Valid member ID is required'
        }
      });
      return;
    }

    const member = await prisma.user.findUnique({
      where: { id: memberId }
    });

    if (!member || member.role !== 'member') {
      res.status(404).json({
        success: false,
        error: {
          code: 'MEMBER_NOT_FOUND',
          message: 'Member not found'
        }
      });
      return;
    }

    const updatedMember = await prisma.user.update({
      where: { id: memberId },
      data: { isPaused: false },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        isPaused: true,
        isFrozen: true
      }
    });

    res.json({
      success: true,
      data: {
        member: updatedMember,
        message: 'Member account has been unpaused'
      }
    });
  } catch (error) {
    console.error('Unpause member error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'An error occurred while unpausing member'
      }
    });
  }
};

/**
 * PUT /api/admin/members/:id/freeze
 * Freeze a member account (prevent bookings and package purchases)
 */
export const freezeMember = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const memberId = parseInt(req.params.id);

    if (isNaN(memberId)) {
      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_MEMBER_ID',
          message: 'Valid member ID is required'
        }
      });
      return;
    }

    const member = await prisma.user.findUnique({
      where: { id: memberId }
    });

    if (!member || member.role !== 'member') {
      res.status(404).json({
        success: false,
        error: {
          code: 'MEMBER_NOT_FOUND',
          message: 'Member not found'
        }
      });
      return;
    }

    const updatedMember = await prisma.user.update({
      where: { id: memberId },
      data: { isFrozen: true },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        isPaused: true,
        isFrozen: true
      }
    });

    res.json({
      success: true,
      data: {
        member: updatedMember,
        message: 'Member account has been frozen'
      }
    });
  } catch (error) {
    console.error('Freeze member error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'An error occurred while freezing member'
      }
    });
  }
};

/**
 * PUT /api/admin/members/:id/unfreeze
 * Unfreeze a member account
 */
export const unfreezeMember = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const memberId = parseInt(req.params.id);

    if (isNaN(memberId)) {
      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_MEMBER_ID',
          message: 'Valid member ID is required'
        }
      });
      return;
    }

    const member = await prisma.user.findUnique({
      where: { id: memberId }
    });

    if (!member || member.role !== 'member') {
      res.status(404).json({
        success: false,
        error: {
          code: 'MEMBER_NOT_FOUND',
          message: 'Member not found'
        }
      });
      return;
    }

    const updatedMember = await prisma.user.update({
      where: { id: memberId },
      data: { isFrozen: false },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        isPaused: true,
        isFrozen: true
      }
    });

    res.json({
      success: true,
      data: {
        member: updatedMember,
        message: 'Member account has been unfrozen'
      }
    });
  } catch (error) {
    console.error('Unfreeze member error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'An error occurred while unfreezing member'
      }
    });
  }
};

/**
 * PUT /api/admin/members/:id
 * Update a member account
 */
export const updateMember = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const memberId = parseInt(req.params.id);
    const { email, firstName, lastName, phone, password } = req.body;

    if (isNaN(memberId)) {
      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_MEMBER_ID',
          message: 'Valid member ID is required'
        }
      });
      return;
    }

    const member = await prisma.user.findUnique({
      where: { id: memberId }
    });

    if (!member || member.role !== 'member') {
      res.status(404).json({
        success: false,
        error: {
          code: 'MEMBER_NOT_FOUND',
          message: 'Member not found'
        }
      });
      return;
    }

    // Build update data
    const updateData: any = {};
    if (email !== undefined) {
      const trimmedEmail = email.trim().toLowerCase();
      if (!trimmedEmail) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Email cannot be empty'
          }
        });
        return;
      }

      // Check if email is already taken by another user
      const emailExists = await prisma.user.findFirst({
        where: {
          email: trimmedEmail,
          id: { not: memberId }
        }
      });

      if (emailExists) {
        res.status(409).json({
          success: false,
          error: {
            code: 'EMAIL_EXISTS',
            message: 'Email is already taken by another user'
          }
        });
        return;
      }

      updateData.email = trimmedEmail;
    }

    if (firstName !== undefined) {
      updateData.firstName = firstName.trim();
    }

    if (lastName !== undefined) {
      updateData.lastName = lastName.trim();
    }

    if (phone !== undefined) {
      updateData.phone = phone || null;
    }

    if (password !== undefined && password.trim()) {
      updateData.passwordHash = await bcrypt.hash(password.trim(), 10);
    }

    const updatedMember = await prisma.user.update({
      where: { id: memberId },
      data: updateData,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        updatedAt: true
      }
    });

    res.json({
      success: true,
      data: {
        member: updatedMember,
        message: 'Member updated successfully'
      }
    });
  } catch (error) {
    console.error('Update member error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'An error occurred while updating member'
      }
    });
  }
};

/**
 * DELETE /api/admin/members/:id
 * Soft delete a member account
 */
export const deleteMember = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const memberId = parseInt(req.params.id);

    if (isNaN(memberId)) {
      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_MEMBER_ID',
          message: 'Valid member ID is required'
        }
      });
      return;
    }

    const member = await prisma.user.findUnique({
      where: { id: memberId }
    });

    if (!member || member.role !== 'member') {
      res.status(404).json({
        success: false,
        error: {
          code: 'MEMBER_NOT_FOUND',
          message: 'Member not found'
        }
      });
      return;
    }

    // Soft delete by setting deletedAt timestamp
    const deletedMember = await prisma.user.update({
      where: { id: memberId },
      data: { deletedAt: new Date() },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        deletedAt: true
      }
    });

    res.json({
      success: true,
      data: {
        member: deletedMember,
        message: 'Member account has been deleted'
      }
    });
  } catch (error) {
    console.error('Delete member error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'An error occurred while deleting member'
      }
    });
  }
};

/**
 * GET /api/admin/members/:id
 * Get detailed information about a specific member
 */
export const getMemberDetails = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const memberId = parseInt(req.params.id);

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

    // Fetch member with all related data
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
                    },
                    coach: {
                      select: {
                        firstName: true,
                        lastName: true
                      }
                    }
                  }
                }
              },
              orderBy: {
                bookedAt: 'desc'
              },
              take: 20
            }
          }
        },
        memberPackages: {
          include: {
            package: {
              select: {
                name: true,
                sessionCount: true,
                price: true,
                expiryDays: true
              }
            }
          },
          orderBy: {
            purchaseDate: 'desc'
          }
        },
        payments: {
          include: {
            package: {
              select: {
                name: true,
                sessionCount: true,
                price: true
              }
            },
            reviewer: {
              select: {
                firstName: true,
                lastName: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        },
        bookings: {
          where: {
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
                },
                coach: {
                  select: {
                    firstName: true,
                    lastName: true
                  }
                }
              }
            }
          },
          orderBy: {
            bookedAt: 'desc'
          },
          take: 20 // Limit to recent 20 bookings
        },
        creditTransactions: {
          orderBy: {
            createdAt: 'desc'
          },
          take: 20 // Limit to recent 20 transactions
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

    // Verify it's a member (not admin or coach)
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

    // Calculate statistics for parent only (excluding child bookings)
    const activePackages = member.memberPackages.filter(
      pkg => !pkg.isExpired && new Date(pkg.expiryDate) >= new Date()
    );
    const totalCredits = activePackages.reduce(
      (sum, pkg) => sum + pkg.sessionsRemaining,
      0
    );
    const parentBookings = member.bookings; // Already filtered to parent-only bookings
    const totalBookings = parentBookings.length;
    const confirmedBookings = parentBookings.filter(b => b.status === 'confirmed').length;
    const attendedBookings = parentBookings.filter(b => b.status === 'attended').length;
    const noShowBookings = parentBookings.filter(b => b.status === 'no_show').length;
    const cancelledBookings = parentBookings.filter(b => b.status === 'cancelled').length;

    // Format children with their own booking statistics
    const childrenWithStats = member.children.map(child => {
      const childBookings = child.bookings;
      const childTotalBookings = childBookings.length;
      const childConfirmedBookings = childBookings.filter(b => b.status === 'confirmed').length;
      const childAttendedBookings = childBookings.filter(b => b.status === 'attended').length;
      const childNoShowBookings = childBookings.filter(b => b.status === 'no_show').length;
      const childCancelledBookings = childBookings.filter(b => b.status === 'cancelled').length;

      return {
        id: child.id,
        firstName: child.firstName,
        lastName: child.lastName,
        age: child.age,
        createdAt: child.createdAt,
        statistics: {
          totalBookings: childTotalBookings,
          confirmedBookings: childConfirmedBookings,
          attendedBookings: childAttendedBookings,
          noShowBookings: childNoShowBookings,
          cancelledBookings: childCancelledBookings
        },
        recentBookings: childBookings.map(booking => ({
          id: booking.id,
          classType: booking.classInstance.classType.name,
          location: booking.classInstance.location.name,
          coach: `${booking.classInstance.coach.firstName} ${booking.classInstance.coach.lastName}`,
          startTime: booking.classInstance.startTime,
          status: booking.status,
          bookedAt: booking.bookedAt,
          attendanceMarkedAt: booking.attendanceMarkedAt
        }))
      };
    });

    // Format response
    const formattedMember = {
      id: member.id,
      email: member.email,
      firstName: member.firstName,
      lastName: member.lastName,
      phone: member.phone,
      role: member.role,
      isPaused: member.isPaused,
      isFrozen: member.isFrozen,
      deletedAt: member.deletedAt,
      createdAt: member.createdAt,
      updatedAt: member.updatedAt,
      statistics: {
        totalCredits,
        activePackagesCount: activePackages.length,
        totalPackagesCount: member.memberPackages.length,
        totalBookings,
        confirmedBookings,
        attendedBookings,
        noShowBookings,
        cancelledBookings,
        totalPayments: member.payments.length,
        approvedPayments: member.payments.filter(p => p.status === 'approved').length,
        pendingPayments: member.payments.filter(p => p.status === 'pending').length,
        rejectedPayments: member.payments.filter(p => p.status === 'rejected').length
      },
      children: childrenWithStats,
      packages: member.memberPackages.map(pkg => ({
        id: pkg.id,
        packageName: pkg.package.name,
        sessionsTotal: pkg.sessionsTotal,
        sessionsRemaining: pkg.sessionsRemaining,
        purchaseDate: pkg.purchaseDate,
        expiryDate: pkg.expiryDate,
        isExpired: pkg.isExpired,
        price: pkg.package.price
      })),
      payments: member.payments.map(payment => ({
        id: payment.id,
        packageName: payment.package.name,
        amount: Number(payment.amount),
        status: payment.status,
        screenshotUrl: getRelativeUploadPath(payment.screenshotPath),
        submittedAt: payment.createdAt,
        reviewedAt: payment.reviewedAt,
        reviewedBy: payment.reviewer
          ? `${payment.reviewer.firstName} ${payment.reviewer.lastName}`
          : null,
        rejectionReason: payment.rejectionReason
      })),
      recentBookings: parentBookings.map(booking => ({
        id: booking.id,
        classType: booking.classInstance.classType.name,
        location: booking.classInstance.location.name,
        coach: `${booking.classInstance.coach.firstName} ${booking.classInstance.coach.lastName}`,
        startTime: booking.classInstance.startTime,
        bookedFor: 'Self',
        status: booking.status,
        bookedAt: booking.bookedAt,
        attendanceMarkedAt: booking.attendanceMarkedAt
      })),
      recentTransactions: member.creditTransactions.map(transaction => ({
        id: transaction.id,
        transactionType: transaction.transactionType,
        creditsChange: transaction.creditsChange,
        balanceAfter: transaction.balanceAfter,
        notes: transaction.notes,
        createdAt: transaction.createdAt
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

/**
 * GET /api/admin/coaches/list
 * Get all coaches with filtering and sorting for management
 */
export const getAllCoachesForManagement = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { search, status, sortBy, sortOrder } = req.query;

    // Build where clause
    const where: any = {
      role: 'coach',
      deletedAt: null // Exclude soft-deleted coaches
    };

    // Search filter (name, email, phone)
    const searchConditions: any[] = [];
    if (search && typeof search === 'string') {
      const searchTerm = search.trim();
      if (searchTerm) {
        searchConditions.push(
          { firstName: { contains: searchTerm, mode: 'insensitive' } },
          { lastName: { contains: searchTerm, mode: 'insensitive' } },
          { email: { contains: searchTerm, mode: 'insensitive' } },
          { phone: { contains: searchTerm, mode: 'insensitive' } }
        );
      }
    }

    // Status filter (active/inactive based on classes)
    if (status === 'active') {
      where.classesAsCoach = {
        some: {
          startTime: {
            gte: new Date()
          },
          isCancelled: false
        }
      };
      if (searchConditions.length > 0) {
        where.AND = [
          { OR: searchConditions },
          { classesAsCoach: where.classesAsCoach }
        ];
        delete where.classesAsCoach;
      }
    } else if (status === 'inactive') {
      const inactiveConditions = [
        { classesAsCoach: { none: {} } },
        {
          classesAsCoach: {
            every: {
              OR: [
                { startTime: { lt: new Date() } },
                { isCancelled: true }
              ]
            }
          }
        }
      ];
      
      if (searchConditions.length > 0) {
        where.AND = [
          { OR: searchConditions },
          { OR: inactiveConditions }
        ];
      } else {
        where.OR = inactiveConditions;
      }
    } else {
      // No status filter, just add search if exists
      if (searchConditions.length > 0) {
        where.OR = searchConditions;
      }
    }

    // Sort options
    let orderBy: any;
    if (sortBy === 'name') {
      orderBy = [
        { firstName: sortOrder === 'desc' ? 'desc' : 'asc' },
        { lastName: sortOrder === 'desc' ? 'desc' : 'asc' }
      ];
    } else if (sortBy === 'email') {
      orderBy = { email: sortOrder === 'desc' ? 'desc' : 'asc' };
    } else if (sortBy === 'createdAt') {
      orderBy = { createdAt: sortOrder === 'desc' ? 'desc' : 'asc' };
    } else {
      // Default: sort by createdAt desc
      orderBy = { createdAt: 'desc' };
    }

    // Fetch coaches with basic info
    const coaches = await prisma.user.findMany({
      where,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        isPaused: true,
        isFrozen: true,
        deletedAt: true,
        createdAt: true,
        classesAsCoach: {
          where: {
            startTime: {
              gte: new Date()
            },
            isCancelled: false
          },
          select: {
            id: true,
            startTime: true,
            endTime: true,
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
          },
          orderBy: {
            startTime: 'asc'
          },
          take: 5
        },
        _count: {
          select: {
            classesAsCoach: true,
            bookings: true
          }
        }
      },
      orderBy
    });

    // Format response
    const formattedCoaches = coaches.map(coach => {
      const upcomingClasses = coach.classesAsCoach || [];
      return {
        id: coach.id,
        name: `${coach.firstName} ${coach.lastName}`,
        firstName: coach.firstName,
        lastName: coach.lastName,
        email: coach.email,
        phone: coach.phone,
        createdAt: coach.createdAt,
        isActive: !coach.isPaused && !coach.isFrozen && !coach.deletedAt,
        isPaused: coach.isPaused,
        isFrozen: coach.isFrozen,
        upcomingClasses: upcomingClasses.map(cls => ({
          id: cls.id,
          className: cls.classType.name,
          location: cls.location.name,
          startTime: cls.startTime,
          endTime: cls.endTime
        })),
        stats: {
          totalClasses: coach._count.classesAsCoach,
          totalBookings: coach._count.bookings
        }
      };
    });

    res.json({
      success: true,
      data: {
        coaches: formattedCoaches,
        total: formattedCoaches.length
      }
    });
  } catch (error) {
    console.error('Get all coaches error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'An error occurred while fetching coaches'
      }
    });
  }
};

/**
 * GET /api/admin/coaches/:id
 * Get coach details with all related data
 */
export const getCoachDetails = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const coachId = parseInt(req.params.id);

    if (!coachId || isNaN(coachId)) {
      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_COACH_ID',
          message: 'Valid coach ID is required'
        }
      });
      return;
    }

    // Fetch coach with all related data
    const coach = await prisma.user.findUnique({
      where: { id: coachId },
      include: {
        classesAsCoach: {
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
            bookings: {
              include: {
                user: {
                  select: {
                    firstName: true,
                    lastName: true,
                    email: true
                  }
                },
                child: {
                  select: {
                    firstName: true,
                    lastName: true,
                    age: true
                  }
                }
              }
            }
          },
          orderBy: {
            startTime: 'desc'
          }
        }
      }
    });

    if (!coach) {
      res.status(404).json({
        success: false,
        error: {
          code: 'COACH_NOT_FOUND',
          message: 'Coach not found'
        }
      });
      return;
    }

    if (coach.role !== 'coach') {
      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_ROLE',
          message: 'User is not a coach'
        }
      });
      return;
    }

    // Calculate statistics
    const totalClasses = coach.classesAsCoach.length;
    const upcomingClasses = coach.classesAsCoach.filter(
      cls => cls.startTime >= new Date() && !cls.isCancelled
    );
    const pastClasses = coach.classesAsCoach.filter(
      cls => cls.startTime < new Date() || cls.isCancelled
    );
    const totalBookings = coach.classesAsCoach.reduce(
      (sum, cls) => sum + cls.bookings.length,
      0
    );
    const totalAttendees = coach.classesAsCoach.reduce(
      (sum, cls) => sum + cls.bookings.filter(b => b.status === 'attended').length,
      0
    );

    res.json({
      success: true,
      data: {
        id: coach.id,
        firstName: coach.firstName,
        lastName: coach.lastName,
        email: coach.email,
        phone: coach.phone,
        isPaused: coach.isPaused,
        isFrozen: coach.isFrozen,
        deletedAt: coach.deletedAt,
        createdAt: coach.createdAt,
        classes: coach.classesAsCoach.map(cls => ({
          id: cls.id,
          className: cls.classType.name,
          classDescription: cls.classType.description,
          duration: cls.classType.durationMinutes,
          location: cls.location.name,
          locationAddress: cls.location.address,
          startTime: cls.startTime,
          endTime: cls.endTime,
          capacity: cls.capacity,
          isCancelled: cls.isCancelled,
          bookings: cls.bookings.map(booking => ({
            id: booking.id,
            memberName: booking.child
              ? `${booking.child.firstName} ${booking.child.lastName} (Age: ${booking.child.age})`
              : `${booking.user.firstName} ${booking.user.lastName}`,
            memberEmail: booking.user.email,
            status: booking.status,
            bookedAt: booking.bookedAt
          }))
        })),
        stats: {
          totalClasses,
          upcomingClasses: upcomingClasses.length,
          pastClasses: pastClasses.length,
          totalBookings,
          totalAttendees
        }
      }
    });
  } catch (error) {
    console.error('Get coach details error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'An error occurred while fetching coach details'
      }
    });
  }
};

/**
 * POST /api/admin/coaches
 * Create a new coach account
 */
export const createCoach = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { email, password, firstName, lastName, phone } = req.body;

    // Validate required fields
    if (!email || !password || !firstName || !lastName) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Email, password, first name, and last name are required'
        }
      });
      return;
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (existingUser) {
      res.status(409).json({
        success: false,
        error: {
          code: 'USER_EXISTS',
          message: 'A user with this email already exists'
        }
      });
      return;
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create coach
    const coach = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        passwordHash,
        firstName,
        lastName,
        phone: phone || null,
        role: 'coach'
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        createdAt: true
      }
    });

    res.status(201).json({
      success: true,
      data: {
        coach,
        message: 'Coach created successfully'
      }
    });
  } catch (error) {
    console.error('Create coach error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'An error occurred while creating the coach'
      }
    });
  }
};

/**
 * PUT /api/admin/coaches/:id
 * Update a coach account
 */
export const updateCoach = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const coachId = parseInt(req.params.id);
    const { email, firstName, lastName, phone, password } = req.body;

    if (isNaN(coachId)) {
      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_COACH_ID',
          message: 'Valid coach ID is required'
        }
      });
      return;
    }

    const coach = await prisma.user.findUnique({
      where: { id: coachId }
    });

    if (!coach || coach.role !== 'coach') {
      res.status(404).json({
        success: false,
        error: {
          code: 'COACH_NOT_FOUND',
          message: 'Coach not found'
        }
      });
      return;
    }

    // Build update data
    const updateData: any = {};
    if (email !== undefined) {
      const trimmedEmail = email.trim().toLowerCase();
      if (!trimmedEmail) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Email cannot be empty'
          }
        });
        return;
      }

      // Check if email is already taken by another user
      const emailExists = await prisma.user.findFirst({
        where: {
          email: trimmedEmail,
          id: { not: coachId }
        }
      });

      if (emailExists) {
        res.status(409).json({
          success: false,
          error: {
            code: 'EMAIL_EXISTS',
            message: 'Email is already taken by another user'
          }
        });
        return;
      }

      updateData.email = trimmedEmail;
    }

    if (firstName !== undefined) {
      updateData.firstName = firstName.trim();
    }

    if (lastName !== undefined) {
      updateData.lastName = lastName.trim();
    }

    if (phone !== undefined) {
      updateData.phone = phone || null;
    }

    if (password !== undefined && password.trim()) {
      updateData.passwordHash = await bcrypt.hash(password, 10);
    }

    const updatedCoach = await prisma.user.update({
      where: { id: coachId },
      data: updateData,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        isPaused: true,
        isFrozen: true,
        updatedAt: true
      }
    });

    res.json({
      success: true,
      data: {
        coach: updatedCoach,
        message: 'Coach updated successfully'
      }
    });
  } catch (error) {
    console.error('Update coach error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'An error occurred while updating the coach'
      }
    });
  }
};

/**
 * PUT /api/admin/coaches/:id/pause
 * Pause a coach account
 */
export const pauseCoach = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const coachId = parseInt(req.params.id);

    if (isNaN(coachId)) {
      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_COACH_ID',
          message: 'Valid coach ID is required'
        }
      });
      return;
    }

    const coach = await prisma.user.findUnique({
      where: { id: coachId }
    });

    if (!coach || coach.role !== 'coach') {
      res.status(404).json({
        success: false,
        error: {
          code: 'COACH_NOT_FOUND',
          message: 'Coach not found'
        }
      });
      return;
    }

    const updatedCoach = await prisma.user.update({
      where: { id: coachId },
      data: { isPaused: true },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        isPaused: true,
        isFrozen: true
      }
    });

    res.json({
      success: true,
      data: {
        coach: updatedCoach,
        message: 'Coach account has been paused'
      }
    });
  } catch (error) {
    console.error('Pause coach error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'An error occurred while pausing coach'
      }
    });
  }
};

/**
 * PUT /api/admin/coaches/:id/unpause
 * Unpause a coach account
 */
export const unpauseCoach = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const coachId = parseInt(req.params.id);

    if (isNaN(coachId)) {
      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_COACH_ID',
          message: 'Valid coach ID is required'
        }
      });
      return;
    }

    const coach = await prisma.user.findUnique({
      where: { id: coachId }
    });

    if (!coach || coach.role !== 'coach') {
      res.status(404).json({
        success: false,
        error: {
          code: 'COACH_NOT_FOUND',
          message: 'Coach not found'
        }
      });
      return;
    }

    const updatedCoach = await prisma.user.update({
      where: { id: coachId },
      data: { isPaused: false },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        isPaused: true,
        isFrozen: true
      }
    });

    res.json({
      success: true,
      data: {
        coach: updatedCoach,
        message: 'Coach account has been unpaused'
      }
    });
  } catch (error) {
    console.error('Unpause coach error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'An error occurred while unpausing coach'
      }
    });
  }
};

/**
 * PUT /api/admin/coaches/:id/freeze
 * Freeze a coach account
 */
export const freezeCoach = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const coachId = parseInt(req.params.id);

    if (isNaN(coachId)) {
      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_COACH_ID',
          message: 'Valid coach ID is required'
        }
      });
      return;
    }

    const coach = await prisma.user.findUnique({
      where: { id: coachId }
    });

    if (!coach || coach.role !== 'coach') {
      res.status(404).json({
        success: false,
        error: {
          code: 'COACH_NOT_FOUND',
          message: 'Coach not found'
        }
      });
      return;
    }

    const updatedCoach = await prisma.user.update({
      where: { id: coachId },
      data: { isFrozen: true },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        isPaused: true,
        isFrozen: true
      }
    });

    res.json({
      success: true,
      data: {
        coach: updatedCoach,
        message: 'Coach account has been frozen'
      }
    });
  } catch (error) {
    console.error('Freeze coach error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'An error occurred while freezing coach'
      }
    });
  }
};

/**
 * PUT /api/admin/coaches/:id/unfreeze
 * Unfreeze a coach account
 */
export const unfreezeCoach = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const coachId = parseInt(req.params.id);

    if (isNaN(coachId)) {
      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_COACH_ID',
          message: 'Valid coach ID is required'
        }
      });
      return;
    }

    const coach = await prisma.user.findUnique({
      where: { id: coachId }
    });

    if (!coach || coach.role !== 'coach') {
      res.status(404).json({
        success: false,
        error: {
          code: 'COACH_NOT_FOUND',
          message: 'Coach not found'
        }
      });
      return;
    }

    const updatedCoach = await prisma.user.update({
      where: { id: coachId },
      data: { isFrozen: false },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        isPaused: true,
        isFrozen: true
      }
    });

    res.json({
      success: true,
      data: {
        coach: updatedCoach,
        message: 'Coach account has been unfrozen'
      }
    });
  } catch (error) {
    console.error('Unfreeze coach error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'An error occurred while unfreezing coach'
      }
    });
  }
};

/**
 * DELETE /api/admin/coaches/:id
 * Soft delete a coach account
 */
export const deleteCoach = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const coachId = parseInt(req.params.id);

    if (isNaN(coachId)) {
      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_COACH_ID',
          message: 'Valid coach ID is required'
        }
      });
      return;
    }

    const coach = await prisma.user.findUnique({
      where: { id: coachId }
    });

    if (!coach || coach.role !== 'coach') {
      res.status(404).json({
        success: false,
        error: {
          code: 'COACH_NOT_FOUND',
          message: 'Coach not found'
        }
      });
      return;
    }

    // Soft delete by setting deletedAt timestamp
    const deletedCoach = await prisma.user.update({
      where: { id: coachId },
      data: { deletedAt: new Date() },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        deletedAt: true
      }
    });

    res.json({
      success: true,
      data: {
        coach: deletedCoach,
        message: 'Coach account has been deleted'
      }
    });
  } catch (error) {
    console.error('Delete coach error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'An error occurred while deleting coach'
      }
    });
  }
};

/**
 * POST /api/admin/schedules
 * Create a recurring class schedule
 */
export const createSchedule = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { classTypeId, coachId, locationId, dayOfWeek, startTime, capacity } = req.body;

    // Validate required fields
    if (!classTypeId || !coachId || !locationId || dayOfWeek === undefined || !startTime || !capacity) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Class type, coach, location, day of week, start time, and capacity are required'
        }
      });
      return;
    }

    // Validate dayOfWeek (0-6)
    if (dayOfWeek < 0 || dayOfWeek > 6) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Day of week must be between 0 (Sunday) and 6 (Saturday)'
        }
      });
      return;
    }

    // Validate time format (HH:MM)
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(startTime)) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Start time must be in HH:MM format'
        }
      });
      return;
    }

    const capacityNum = parseInt(capacity);
    if (isNaN(capacityNum) || capacityNum < 1) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Capacity must be a positive number'
        }
      });
      return;
    }

    // Verify class type exists
    const classType = await prisma.classType.findUnique({
      where: { id: parseInt(classTypeId) }
    });

    if (!classType) {
      res.status(404).json({
        success: false,
        error: {
          code: 'CLASS_TYPE_NOT_FOUND',
          message: 'Class type not found'
        }
      });
      return;
    }

    // Verify coach exists and has coach role
    const coach = await prisma.user.findFirst({
      where: {
        id: parseInt(coachId),
        role: 'coach'
      }
    });

    if (!coach) {
      res.status(404).json({
        success: false,
        error: {
          code: 'COACH_NOT_FOUND',
          message: 'Coach not found or user is not a coach'
        }
      });
      return;
    }

    // Verify location exists and is active
    const location = await prisma.location.findFirst({
      where: {
        id: parseInt(locationId),
        isActive: true
      }
    });

    if (!location) {
      res.status(404).json({
        success: false,
        error: {
          code: 'LOCATION_NOT_FOUND',
          message: 'Location not found or is inactive'
        }
      });
      return;
    }

    // Create schedule
    const schedule = await prisma.classSchedule.create({
      data: {
        classTypeId: parseInt(classTypeId),
        coachId: parseInt(coachId),
        locationId: parseInt(locationId),
        dayOfWeek: parseInt(dayOfWeek),
        startTime: startTime.trim(),
        capacity: capacityNum,
        isActive: true
      },
      include: {
        classType: {
          select: {
            name: true,
            durationMinutes: true
          }
        },
        location: {
          select: {
            name: true
          }
        },
        coach: {
          select: {
            firstName: true,
            lastName: true
          }
        }
      }
    });

    // Generate classes for the next 2 months
    const { generateClassesFromSchedules } = require('../services/scheduleService');
    await generateClassesFromSchedules(2);

    res.status(201).json({
      success: true,
      data: {
        schedule: {
          id: schedule.id,
          classType: schedule.classType.name,
          coach: `${schedule.coach.firstName} ${schedule.coach.lastName}`,
          location: schedule.location.name,
          dayOfWeek: schedule.dayOfWeek,
          startTime: schedule.startTime,
          capacity: schedule.capacity
        },
        message: 'Recurring schedule created successfully. Classes have been generated for the next 2 months.'
      }
    });
  } catch (error: any) {
    console.error('Create schedule error:', error);
    if (error.code === 'P2002') {
      res.status(409).json({
        success: false,
        error: {
          code: 'SCHEDULE_EXISTS',
          message: 'A schedule already exists for this class type, coach, location, day, and time'
        }
      });
      return;
    }
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'An error occurred while creating the schedule'
      }
    });
  }
};

/**
 * GET /api/admin/schedules
 * Get all recurring schedules
 */
export const getAllSchedules = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const schedules = await prisma.classSchedule.findMany({
      include: {
        classType: {
          select: {
            name: true,
            durationMinutes: true
          }
        },
        location: {
          select: {
            name: true
          }
        },
        coach: {
          select: {
            firstName: true,
            lastName: true,
            email: true
          }
        },
        _count: {
          select: {
            instances: true
          }
        }
      },
      orderBy: [
        { dayOfWeek: 'asc' },
        { startTime: 'asc' }
      ]
    });

    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    res.json({
      success: true,
      data: {
        schedules: schedules.map(schedule => ({
          id: schedule.id,
          classType: schedule.classType.name,
          classTypeId: schedule.classTypeId,
          coach: `${schedule.coach.firstName} ${schedule.coach.lastName}`,
          coachId: schedule.coachId,
          location: schedule.location.name,
          locationId: schedule.locationId,
          dayOfWeek: schedule.dayOfWeek,
          dayName: dayNames[schedule.dayOfWeek],
          startTime: schedule.startTime,
          capacity: schedule.capacity,
          isActive: schedule.isActive,
          instanceCount: schedule._count.instances,
          createdAt: schedule.createdAt,
          updatedAt: schedule.updatedAt
        })),
        total: schedules.length
      }
    });
  } catch (error) {
    console.error('Get all schedules error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'An error occurred while fetching schedules'
      }
    });
  }
};

/**
 * GET /api/admin/schedules/default
 * Get all recurring schedules grouped by location (for default schedule page)
 */
export const getDefaultSchedules = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // Get all locations with their schedules
    const locations = await prisma.location.findMany({
      where: {
        isActive: true
      },
      include: {
        classSchedules: {
          // Include both active and inactive schedules
          include: {
            classType: {
              select: {
                id: true,
                name: true,
                durationMinutes: true
              }
            },
            coach: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true
              }
            },
            _count: {
              select: {
                instances: true
              }
            }
          },
          orderBy: [
            { dayOfWeek: 'asc' },
            { startTime: 'asc' }
          ]
        }
      },
      orderBy: {
        name: 'asc'
      }
    });

    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    // Format response grouped by location
    const locationsWithSchedules = locations.map(location => ({
      locationId: location.id,
      locationName: location.name,
      locationAddress: location.address,
      schedules: location.classSchedules.map(schedule => ({
        id: schedule.id,
        classType: schedule.classType.name,
        classTypeId: schedule.classType.id,
        durationMinutes: schedule.classType.durationMinutes,
        coach: `${schedule.coach.firstName} ${schedule.coach.lastName}`,
        coachId: schedule.coach.id,
        coachEmail: schedule.coach.email,
        dayOfWeek: schedule.dayOfWeek,
        dayName: dayNames[schedule.dayOfWeek],
        startTime: schedule.startTime,
        capacity: schedule.capacity,
        isActive: schedule.isActive,
        instanceCount: schedule._count.instances,
        createdAt: schedule.createdAt,
        updatedAt: schedule.updatedAt
      }))
    }));

    res.json({
      success: true,
      data: {
        locations: locationsWithSchedules,
        totalLocations: locationsWithSchedules.length,
        totalSchedules: locationsWithSchedules.reduce((sum, loc) => sum + loc.schedules.length, 0)
      }
    });
  } catch (error) {
    console.error('Get default schedules error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'An error occurred while fetching default schedules'
      }
    });
  }
};

/**
 * PUT /api/admin/schedules/:id
 * Update a recurring schedule
 */
export const updateSchedule = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const scheduleId = parseInt(req.params.id);
    const { classTypeId, coachId, locationId, dayOfWeek, startTime, capacity, isActive, applyToCurrentMonth } = req.body;

    if (isNaN(scheduleId)) {
      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_SCHEDULE_ID',
          message: 'Valid schedule ID is required'
        }
      });
      return;
    }

    const schedule = await prisma.classSchedule.findUnique({
      where: { id: scheduleId }
    });

    if (!schedule) {
      res.status(404).json({
        success: false,
        error: {
          code: 'SCHEDULE_NOT_FOUND',
          message: 'Schedule not found'
        }
      });
      return;
    }

    const updateData: any = {};
    if (classTypeId !== undefined) updateData.classTypeId = parseInt(classTypeId);
    if (coachId !== undefined) updateData.coachId = parseInt(coachId);
    if (locationId !== undefined) updateData.locationId = parseInt(locationId);
    if (dayOfWeek !== undefined) {
      if (dayOfWeek < 0 || dayOfWeek > 6) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Day of week must be between 0 (Sunday) and 6 (Saturday)'
          }
        });
        return;
      }
      updateData.dayOfWeek = parseInt(dayOfWeek);
    }
    if (startTime !== undefined) {
      const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
      if (!timeRegex.test(startTime)) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Start time must be in HH:MM format'
          }
        });
        return;
      }
      updateData.startTime = startTime.trim();
    }
    if (capacity !== undefined) {
      const capacityNum = parseInt(capacity);
      if (isNaN(capacityNum) || capacityNum < 1) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Capacity must be a positive number'
          }
        });
        return;
      }
      updateData.capacity = capacityNum;
    }
    if (isActive !== undefined) updateData.isActive = Boolean(isActive);

    const updatedSchedule = await prisma.classSchedule.update({
      where: { id: scheduleId },
      data: updateData,
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
        },
        coach: {
          select: {
            firstName: true,
            lastName: true
          }
        }
      }
    });

    // If schedule was updated, regenerate classes based on applyToCurrentMonth flag
    const now = new Date();
    const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    
    // Determine the cutoff date based on applyToCurrentMonth
    const cutoffDate = applyToCurrentMonth ? startOfCurrentMonth : startOfNextMonth;
    
    // Delete instances that were generated from this schedule
    // Only delete instances that haven't started yet and have no bookings
    await prisma.classInstance.deleteMany({
      where: {
        scheduleId: scheduleId,
        startTime: {
          gte: cutoffDate
        },
        bookings: {
          none: {} // Only delete if no bookings exist
        }
      }
    });

    // Regenerate classes for future months (2 months ahead)
    const { generateClassesFromSchedules } = require('../services/scheduleService');
    await generateClassesFromSchedules(2);

    const message = applyToCurrentMonth
      ? 'Schedule updated successfully. Changes have been applied to this month and future months. Classes with existing bookings were not modified.'
      : 'Schedule updated successfully. Future classes have been regenerated (current and past months are unaffected).';

    res.json({
      success: true,
      data: {
        schedule: updatedSchedule,
        message: message
      }
    });
  } catch (error) {
    console.error('Update schedule error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'An error occurred while updating the schedule'
      }
    });
  }
};

/**
 * DELETE /api/admin/schedules/:id
 * Delete a recurring schedule (sets isActive to false)
 */
export const deleteSchedule = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const scheduleId = parseInt(req.params.id);

    if (isNaN(scheduleId)) {
      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_SCHEDULE_ID',
          message: 'Valid schedule ID is required'
        }
      });
      return;
    }

    const schedule = await prisma.classSchedule.findUnique({
      where: { id: scheduleId }
    });

    if (!schedule) {
      res.status(404).json({
        success: false,
        error: {
          code: 'SCHEDULE_NOT_FOUND',
          message: 'Schedule not found'
        }
      });
      return;
    }

    // Deactivate schedule instead of deleting
    const updatedSchedule = await prisma.classSchedule.update({
      where: { id: scheduleId },
      data: { isActive: false }
    });

    res.json({
      success: true,
      data: {
        schedule: updatedSchedule,
        message: 'Schedule deactivated successfully. No new classes will be generated from this schedule.'
      }
    });
  } catch (error) {
    console.error('Delete schedule error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'An error occurred while deleting the schedule'
      }
    });
  }
};

/**
 * POST /api/admin/schedules/generate
 * Manually trigger class generation from active schedules
 */
export const generateClassesFromSchedules = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const monthsAhead = req.body.monthsAhead ? parseInt(req.body.monthsAhead, 10) : 2;
    
    if (isNaN(monthsAhead) || monthsAhead < 1 || monthsAhead > 12) {
      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_MONTHS_AHEAD',
          message: 'monthsAhead must be between 1 and 12'
        }
      });
      return;
    }

    const { generateClassesFromSchedules: generateFunction } = require('../services/scheduleService');
    await generateFunction(monthsAhead);

    res.json({
      success: true,
      message: `Successfully generated classes from schedules for the next ${monthsAhead} month(s)`,
      data: {
        monthsAhead
      }
    });
  } catch (error) {
    console.error('Generate classes from schedules error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'An error occurred while generating classes from schedules'
      }
    });
  }
};
