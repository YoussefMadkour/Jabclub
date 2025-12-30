import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import prisma from '../config/database';
import { Prisma } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { getRelativeUploadPath } from '../utils/filePath';
import { sendNotification, NotificationTemplates } from '../services/notificationService';

/**
 * GET /api/members/locations
 * Fetch all active locations available for package purchase
 */
export const getActiveLocations = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const locations = await prisma.location.findMany({
      where: {
        isActive: true
      },
      select: {
        id: true,
        name: true,
        address: true,
        isActive: true
      },
      orderBy: {
        name: 'asc'
      }
    });

    res.json({
      success: true,
      data: locations
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
 * GET /api/members/packages
 * Fetch all active session packages available for purchase
 * Query params: locationId (optional) - if provided, returns packages with location-specific prices
 */
export const getPackages = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { locationId } = req.query;
    const locationIdNum = locationId ? parseInt(locationId as string) : null;

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

    // Check if member has existing packages (indicates renewal scenario)
    const existingPackages = await prisma.memberPackage.findMany({
      where: {
        userId
      },
      orderBy: {
        purchaseDate: 'desc'
      },
      take: 1
    });

    const isRenewal = existingPackages.length > 0;

    // If locationId is provided, verify it exists and is active
    if (locationIdNum && !isNaN(locationIdNum)) {
      const location = await prisma.location.findFirst({
        where: {
          id: locationIdNum,
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
    }

    // Build include object conditionally
    const includeObj: any = {
      locationPackagePrices: {
        where: locationIdNum && !isNaN(locationIdNum)
          ? {
              locationId: locationIdNum,
              isActive: true
            }
          : {
              isActive: true
            },
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
    };

    if (isRenewal) {
      includeObj.memberPackagePrices = {
        where: {
          userId,
          isActive: true
        }
      };
    }

    // Fetch all active session packages with location prices and member-specific prices
    const packages = await prisma.sessionPackage.findMany({
      where: {
        isActive: true
      },
      include: includeObj,
      orderBy: {
        price: 'asc'
      }
    });

    // Check if member actually has special renewal prices set (not just existing packages)
    let hasSpecialRenewalPrices = false;
    if (isRenewal) {
      const memberPrices = await prisma.memberPackagePrice.findMany({
        where: {
          userId,
          isActive: true
        },
        take: 1
      });
      hasSpecialRenewalPrices = memberPrices.length > 0;
    }

    // Format packages with location-specific and member-specific prices
    const formattedPackages = packages.map(pkg => {
      // Priority: member-specific price (for renewals) > location-specific price > default price
      let displayPrice = pkg.price;
      let priceType: 'default' | 'location' | 'member' = 'default';

      // Type assertion for included relations
      type PackageWithRelations = typeof pkg & {
        locationPackagePrices: Array<{
          locationId: number;
          price: any;
          includeVat?: boolean;
          location: { id: number; name: string; isActive: boolean };
        }>;
        memberPackagePrices?: Array<{ price: any }>;
      };
      const pkgTyped = pkg as PackageWithRelations;

      // VAT priority: location-specific VAT > package-level VAT > no VAT
      let includeVat = (pkg as any).includeVat || false; // Default to package-level VAT

      // Check for member-specific price (only for renewals)
      if (isRenewal && pkgTyped.memberPackagePrices && pkgTyped.memberPackagePrices.length > 0) {
        const memberPrice = pkgTyped.memberPackagePrices[0];
        displayPrice = memberPrice.price;
        priceType = 'member';
        // Member prices don't override VAT - use package or location VAT
      }
      // Otherwise check for location-specific price
      else if (locationIdNum && !isNaN(locationIdNum)) {
        const locationPrice = pkgTyped.locationPackagePrices.find(
          (lp) => lp.locationId === locationIdNum
        );
        if (locationPrice) {
          displayPrice = locationPrice.price;
          priceType = 'location';
          // Location-specific VAT overrides package default
          includeVat = locationPrice.includeVat !== undefined ? locationPrice.includeVat : includeVat;
        }
        // If no location-specific price, keep package-level VAT
      }

      return {
        id: pkg.id,
        name: pkg.name,
        sessionCount: pkg.sessionCount,
        price: displayPrice,
        defaultPrice: pkg.price,
        priceType, // Indicates which price is being used
        isRenewal, // Indicates if this is a renewal scenario
        hasSpecialRenewalPrices, // Indicates if member has special prices set
        expiryDays: pkg.expiryDays,
        includeVat, // VAT setting from location price
        locationPrices: pkgTyped.locationPackagePrices.map((lp) => ({
          locationId: lp.locationId,
          locationName: lp.location.name,
          price: lp.price,
          includeVat: lp.includeVat || false
        })),
        memberPrice: isRenewal && pkgTyped.memberPackagePrices && pkgTyped.memberPackagePrices.length > 0
          ? pkgTyped.memberPackagePrices[0].price
          : null,
        createdAt: pkg.createdAt
      };
    });

    res.json({
      success: true,
      data: formattedPackages
    });
  } catch (error) {
    console.error('Package listing error:', error);
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
 * POST /api/members/purchase
 * Create a payment record with uploaded screenshot
 */
export const purchasePackage = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { packageId } = req.body;
    const file = req.file;

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

    // Validate required fields
    if (!packageId) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Package ID is required'
        }
      });
      return;
    }

    if (!file) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Payment screenshot is required'
        }
      });
      return;
    }

    const { locationId } = req.body;
    const locationIdNum = locationId ? parseInt(locationId) : null;

    // Check if this is a renewal (member has existing packages)
    const existingPackages = await prisma.memberPackage.findMany({
      where: {
        userId
      },
      orderBy: {
        purchaseDate: 'desc'
      },
      take: 1
    });

    const isRenewal = existingPackages.length > 0;

    // Build include object conditionally for purchase
    const purchaseIncludeObj: any = {};
    
    if (locationIdNum && !isNaN(locationIdNum)) {
      purchaseIncludeObj.locationPackagePrices = {
        where: {
          locationId: locationIdNum,
          isActive: true
        }
      };
    }
    
    if (isRenewal) {
      purchaseIncludeObj.memberPackagePrices = {
        where: {
          userId,
          isActive: true
        }
      };
    }

    // Verify package exists and is active
    const sessionPackage = await prisma.sessionPackage.findUnique({
      where: { id: parseInt(packageId) },
      include: purchaseIncludeObj
    });

    if (!sessionPackage) {
      res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Package not found'
        }
      });
      return;
    }

    if (!sessionPackage.isActive) {
      res.status(400).json({
        success: false,
        error: {
          code: 'PACKAGE_INACTIVE',
          message: 'This package is no longer available'
        }
      });
      return;
    }

    // Verify location exists and is active if provided
    if (locationIdNum && !isNaN(locationIdNum)) {
      const location = await prisma.location.findFirst({
        where: {
          id: locationIdNum,
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
    }

    // Determine price priority: member-specific (renewal) > location-specific > default
    let packagePrice = sessionPackage.price;
    let priceType = 'default';

    // Type assertion for included relations
    type SessionPackageWithRelations = typeof sessionPackage & {
      locationPackagePrices?: Array<{ locationId: number; price: any }>;
      memberPackagePrices?: Array<{ packageId: number; price: any }>;
    };
    const sessionPackageTyped = sessionPackage as SessionPackageWithRelations;

    // Check for member-specific price (only for renewals)
    if (isRenewal && sessionPackageTyped.memberPackagePrices && sessionPackageTyped.memberPackagePrices.length > 0) {
      const memberPrice = sessionPackageTyped.memberPackagePrices.find(mp => mp.packageId === parseInt(packageId));
      if (memberPrice) {
        packagePrice = memberPrice.price;
        priceType = 'member';
      }
    }

    // If no member-specific price, check for location-specific price
    // VAT priority: location-specific VAT > package-level VAT > no VAT
    let vatIncluded = false;
    if (priceType === 'default' && locationIdNum && !isNaN(locationIdNum) && sessionPackageTyped.locationPackagePrices) {
      const locationPrice = sessionPackageTyped.locationPackagePrices.find(
        lp => lp.locationId === locationIdNum
      );
      if (locationPrice) {
        packagePrice = locationPrice.price;
        priceType = 'location';
        // Use admin-configured VAT setting from location price (overrides package default)
        vatIncluded = (locationPrice as any).includeVat || false;
      } else {
        // No location-specific price, use package-level VAT setting
        vatIncluded = (sessionPackage as any).includeVat || false;
      }
    } else if (priceType === 'default') {
      // No location selected or no location-specific price, use package-level VAT
      vatIncluded = (sessionPackage as any).includeVat || false;
    }

    // Calculate VAT (14%) and total amount based on admin-configured setting
    const VAT_RATE = 0.14;
    const vatAmountDecimal = vatIncluded 
      ? new Decimal(Number(packagePrice)).mul(new Decimal(VAT_RATE))
      : new Decimal(0);
    const totalAmountDecimal = vatIncluded 
      ? new Decimal(Number(packagePrice)).add(vatAmountDecimal)
      : new Decimal(Number(packagePrice));

    // Create payment record with pending status
    const payment = await prisma.payment.create({
      data: {
        userId,
        packageId: parseInt(packageId),
        locationId: locationIdNum && !isNaN(locationIdNum) ? locationIdNum : null,
        amount: packagePrice,
        vatAmount: vatAmountDecimal,
        vatIncluded: vatIncluded,
        totalAmount: totalAmountDecimal,
        screenshotPath: file.path,
        status: 'pending'
      },
      include: {
        package: {
          select: {
            name: true,
            sessionCount: true,
            price: true,
            expiryDays: true
          }
        }
      }
    });

    res.status(201).json({
      success: true,
      data: {
        paymentId: payment.id,
        packageName: payment.package.name,
        amount: payment.amount,
        vatAmount: payment.vatAmount,
        vatIncluded: payment.vatIncluded,
        totalAmount: payment.totalAmount,
        status: payment.status,
        submittedAt: payment.createdAt,
        message: 'Payment submitted successfully. Your purchase will be reviewed by an administrator.'
      }
    });
  } catch (error) {
    console.error('Payment upload error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'An error occurred while processing your payment'
      }
    });
  }
};

/**
 * GET /api/members/dashboard
 * Fetch member's dashboard data including active packages, credits, and bookings
 */
export const getDashboard = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;

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

    // Fetch active (non-expired) member packages
    const activePackages = await prisma.memberPackage.findMany({
      where: {
        userId,
        isExpired: false,
        expiryDate: {
          gte: new Date()
        }
      },
      include: {
        package: {
          select: {
            name: true,
            sessionCount: true,
            expiryDays: true
          }
        }
      },
      orderBy: {
        expiryDate: 'asc'
      }
    });

    // Fetch expired packages (for display purposes)
    const expiredPackages = await prisma.memberPackage.findMany({
      where: {
        userId,
        OR: [
          { isExpired: true },
          {
            expiryDate: {
              lt: new Date()
            }
          }
        ]
      },
      include: {
        package: {
          select: {
            name: true,
            sessionCount: true,
            expiryDays: true
          }
        }
      },
      orderBy: {
        expiryDate: 'desc'
      },
      take: 5 // Limit to last 5 expired packages
    });

    // Calculate total available credits
    const totalCredits = activePackages.reduce(
      (sum, pkg) => sum + pkg.sessionsRemaining,
      0
    );

    // Get next expiring package
    const nextExpiringPackage = activePackages.length > 0 ? {
      id: activePackages[0].id,
      packageName: activePackages[0].package.name,
      sessionsRemaining: activePackages[0].sessionsRemaining,
      expiryDate: activePackages[0].expiryDate,
      daysUntilExpiry: Math.ceil(
        (activePackages[0].expiryDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
      )
    } : null;

    // Fetch upcoming bookings (confirmed bookings for future classes)
    const upcomingBookings = await prisma.booking.findMany({
      where: {
        userId,
        status: 'confirmed',
        classInstance: {
          startTime: {
            gte: new Date()
          },
          isCancelled: false
        }
      },
      include: {
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
        child: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        }
      },
      orderBy: {
        classInstance: {
          startTime: 'asc'
        }
      }
    });

    // Fetch past bookings (attended or no-show)
    const pastBookings = await prisma.booking.findMany({
      where: {
        userId,
        OR: [
          { status: 'attended' },
          { status: 'no_show' },
          {
            status: 'confirmed',
            classInstance: {
              startTime: {
                lt: new Date()
              }
            }
          }
        ]
      },
      include: {
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
        child: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        }
      },
      orderBy: {
        classInstance: {
          startTime: 'desc'
        }
      },
      take: 10 // Limit to last 10 past bookings
    });

    // Format response
    const dashboardData = {
      credits: {
        total: totalCredits,
        packages: activePackages.map(pkg => {
          const daysUntilExpiry = Math.ceil(
            (pkg.expiryDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
          );
          return {
            id: pkg.id,
            packageName: pkg.package.name,
            sessionsRemaining: pkg.sessionsRemaining,
            sessionsTotal: pkg.sessionsTotal,
            purchaseDate: pkg.purchaseDate,
            expiryDate: pkg.expiryDate,
            daysUntilExpiry,
            isExpiringSoon: daysUntilExpiry <= 7,
            isExpired: false
          };
        })
      },
      expiredPackages: expiredPackages.map(pkg => ({
        id: pkg.id,
        packageName: pkg.package.name,
        sessionsRemaining: pkg.sessionsRemaining,
        sessionsTotal: pkg.sessionsTotal,
        purchaseDate: pkg.purchaseDate,
        expiryDate: pkg.expiryDate,
        daysExpired: Math.ceil(
          (new Date().getTime() - pkg.expiryDate.getTime()) / (1000 * 60 * 60 * 24)
        ),
        isExpired: true
      })),
      nextExpiringPackage,
      upcomingBookings: upcomingBookings.map(booking => ({
        id: booking.id,
        classType: booking.classInstance.classType.name,
        startTime: booking.classInstance.startTime,
        endTime: booking.classInstance.endTime,
        duration: booking.classInstance.classType.durationMinutes,
        location: booking.classInstance.location.name,
        locationAddress: booking.classInstance.location.address,
        coach: `${booking.classInstance.coach.firstName} ${booking.classInstance.coach.lastName}`,
        bookedFor: booking.child 
          ? `${booking.child.firstName} ${booking.child.lastName}` 
          : 'Self',
        isChildBooking: !!booking.child,
        bookedAt: booking.bookedAt
      })),
      pastBookings: pastBookings.map(booking => ({
        id: booking.id,
        classType: booking.classInstance.classType.name,
        startTime: booking.classInstance.startTime,
        endTime: booking.classInstance.endTime,
        location: booking.classInstance.location.name,
        coach: `${booking.classInstance.coach.firstName} ${booking.classInstance.coach.lastName}`,
        bookedFor: booking.child 
          ? `${booking.child.firstName} ${booking.child.lastName}` 
          : 'Self',
        status: booking.status,
        attendanceMarkedAt: booking.attendanceMarkedAt
      }))
    };

    res.json({
      success: true,
      data: dashboardData
    });
  } catch (error) {
    console.error('Dashboard fetch error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'An error occurred while fetching dashboard data'
      }
    });
  }
};

/**
 * GET /api/members/payments
 * Get all payments for the authenticated member
 */
export const getPaymentHistory = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;

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

    // Fetch all payments for the user
    const payments = await prisma.payment.findMany({
      where: {
        userId
      },
      include: {
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
        createdAt: 'desc' // Sort by submission date (newest first)
      }
    });

    // Format response
    const formattedPayments = payments.map(payment => ({
      id: payment.id,
      package: {
        id: payment.package.id,
        name: payment.package.name,
        sessionCount: payment.package.sessionCount,
        price: payment.package.price,
        expiryDays: payment.package.expiryDays
      },
      amount: payment.amount,
      screenshotUrl: getRelativeUploadPath(payment.screenshotPath),
      submittedAt: payment.createdAt,
      reviewedAt: payment.reviewedAt,
      status: payment.status,
      rejectionReason: payment.rejectionReason
    }));

    res.json({
      success: true,
      data: formattedPayments
    });
  } catch (error) {
    console.error('Payment history fetch error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'An error occurred while fetching payment history'
      }
    });
  }
};

/**
 * DELETE /api/members/bookings/:id
 * Cancel a booking with credit refund (outside 1-hour cancellation window)
 */
export const cancelBooking = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const bookingId = parseInt(req.params.id);

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
        memberPackage: true
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

    // Verify booking belongs to the user
    if (booking.userId !== userId) {
      res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'You do not have permission to cancel this booking'
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

    // Check if booking is for a past class
    if (booking.classInstance.startTime < new Date()) {
      res.status(400).json({
        success: false,
        error: {
          code: 'CLASS_IN_PAST',
          message: 'Cannot cancel a booking for a class that has already started'
        }
      });
      return;
    }

    // Calculate time until class start
    const now = new Date();
    const classStartTime = booking.classInstance.startTime;
    const timeUntilClass = classStartTime.getTime() - now.getTime();
    const hoursUntilClass = timeUntilClass / (1000 * 60 * 60);

    // Enforce 1-hour cancellation window
    if (hoursUntilClass < 1) {
      const minutesUntilClass = Math.floor(timeUntilClass / (1000 * 60));
      res.status(400).json({
        success: false,
        error: {
          code: 'CANCELLATION_WINDOW_PASSED',
          message: 'Cancellations must be made at least 1 hour before class start time',
          details: {
            classStartTime: classStartTime.toISOString(),
            minutesUntilClass,
            cancellationDeadline: new Date(classStartTime.getTime() - 60 * 60 * 1000).toISOString()
          }
        }
      });
      return;
    }

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
          userId,
          memberPackageId: booking.memberPackageId,
          bookingId: bookingId,
          transactionType: 'refund',
          creditsChange: 1,
          balanceAfter: updatedPackage.sessionsRemaining,
          notes: `Refund for cancelled booking: ${booking.classInstance.classType.name} on ${booking.classInstance.startTime.toISOString()}`
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
        status: result.cancelledBooking.status,
        cancelledAt: result.cancelledBooking.cancelledAt,
        creditRefunded: true,
        newCreditBalance: result.updatedPackage.sessionsRemaining,
        message: 'Booking cancelled successfully. One credit has been refunded to your account.'
      }
    });
  } catch (error) {
    console.error('Booking cancellation error:', error);
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
 * POST /api/members/bookings
 * Create a new booking with credit validation and capacity check
 */
export const createBooking = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { classInstanceId, childId } = req.body;

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

    // Validate required fields
    if (!classInstanceId) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Class instance ID is required'
        }
      });
      return;
    }

    // If childId is provided, verify it belongs to the user
    if (childId) {
      const child = await prisma.child.findFirst({
        where: {
          id: parseInt(childId),
          parentId: userId
        }
      });

      if (!child) {
        res.status(403).json({
          success: false,
          error: {
            code: 'INVALID_CHILD',
            message: 'Child not found or does not belong to you'
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

    // Check if class is in the past
    if (classInstance.startTime < new Date()) {
      res.status(400).json({
        success: false,
        error: {
          code: 'CLASS_IN_PAST',
          message: 'Cannot book a class that has already started'
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
        userId,
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
            : 'You are already booked for this class'
        }
      });
      return;
    }

    // Fetch active (non-expired) member packages with available credits
    const activePackages = await prisma.memberPackage.findMany({
      where: {
        userId,
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

    // Check if user has any packages at all (including expired ones)
    const allPackages = await prisma.memberPackage.findMany({
      where: {
        userId
      },
      include: {
        package: {
          select: {
            name: true
          }
        }
      }
    });

    if (activePackages.length === 0) {
      // Check if they have expired packages
      const expiredPackagesWithCredits = allPackages.filter(
        pkg => pkg.isExpired && pkg.sessionsRemaining > 0
      );

      if (expiredPackagesWithCredits.length > 0) {
        res.status(400).json({
          success: false,
          error: {
            code: 'CREDITS_EXPIRED',
            message: 'Your session credits have expired. Please purchase a new package to book classes.',
            details: {
              required: 1,
              available: 0,
              expiredCredits: expiredPackagesWithCredits.reduce((sum, pkg) => sum + pkg.sessionsRemaining, 0)
            }
          }
        });
        return;
      }

      res.status(400).json({
        success: false,
        error: {
          code: 'INSUFFICIENT_CREDITS',
          message: 'You do not have any available session credits. Please purchase a package to book classes.',
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
          userId,
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
          }
        }
      });

      // Create credit transaction log
      await tx.creditTransaction.create({
        data: {
          userId,
          memberPackageId: packageToUse.id,
          bookingId: booking.id,
          transactionType: 'booking',
          creditsChange: -1,
          balanceAfter: updatedPackage.sessionsRemaining,
          notes: `Booking for ${classInstance.classType.name} on ${classInstance.startTime.toISOString()}`
        }
      });

      return booking;
    });

    // Send booking confirmation notification (non-blocking)
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        firstName: true,
        lastName: true,
        email: true,
        phone: true
      }
    });

    if (user) {
      const classDate = new Date(result.classInstance.startTime).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      const classTime = new Date(result.classInstance.startTime).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
      const bookedFor = result.child 
        ? `${result.child.firstName} ${result.child.lastName}`
        : undefined;

      const template = NotificationTemplates.classBookingConfirmed(
        user.firstName,
        result.classInstance.classType.name,
        classDate,
        classTime,
        result.classInstance.location.name,
        bookedFor
      );

      sendNotification(
        {
          email: user.email,
          name: `${user.firstName} ${user.lastName}`,
        },
        template.emailSubject,
        template.emailHtml
      ).catch((err) => {
        console.error('Failed to send booking notification:', err);
        // Don't fail the booking if notification fails
      });
    }

    // Return booking confirmation
    res.status(201).json({
      success: true,
      data: {
        bookingId: result.id,
        classType: result.classInstance.classType.name,
        startTime: result.classInstance.startTime,
        endTime: result.classInstance.endTime,
        location: result.classInstance.location.name,
        coach: `${result.classInstance.coach.firstName} ${result.classInstance.coach.lastName}`,
        bookedFor: result.child 
          ? `${result.child.firstName} ${result.child.lastName}`
          : 'Self',
        bookedAt: result.bookedAt,
        message: 'Class booked successfully'
      }
    });
  } catch (error) {
    console.error('Booking creation error:', error);
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
 * GET /api/members/children
 * List all children profiles for the authenticated member
 */
export const getChildren = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;

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

    // Fetch all children for the user
    const children = await prisma.child.findMany({
      where: {
        parentId: userId
      },
      orderBy: {
        createdAt: 'asc'
      }
    });

    // For each child, get their upcoming bookings count
    const childrenWithBookings = await Promise.all(
      children.map(async (child) => {
        const upcomingBookingsCount = await prisma.booking.count({
          where: {
            childId: child.id,
            status: 'confirmed',
            classInstance: {
              startTime: {
                gte: new Date()
              },
              isCancelled: false
            }
          }
        });

        return {
          id: child.id,
          firstName: child.firstName,
          lastName: child.lastName,
          age: child.age,
          createdAt: child.createdAt,
          upcomingBookingsCount
        };
      })
    );

    res.json({
      success: true,
      data: childrenWithBookings
    });
  } catch (error) {
    console.error('Children listing error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'An error occurred while fetching children profiles'
      }
    });
  }
};

/**
 * POST /api/members/children
 * Create a new child profile
 */
export const createChild = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { firstName, lastName, age } = req.body;

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

    // Validate required fields
    if (!firstName || !lastName || !age) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'First name, last name, and age are required'
        }
      });
      return;
    }

    // Validate age is a positive number
    const ageNum = parseInt(age);
    if (isNaN(ageNum) || ageNum < 1 || ageNum > 100) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Age must be a valid number between 1 and 100'
        }
      });
      return;
    }

    // Create child profile
    const child = await prisma.child.create({
      data: {
        parentId: userId,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        age: ageNum
      }
    });

    res.status(201).json({
      success: true,
      data: {
        id: child.id,
        firstName: child.firstName,
        lastName: child.lastName,
        age: child.age,
        createdAt: child.createdAt,
        message: 'Child profile created successfully'
      }
    });
  } catch (error) {
    console.error('Child creation error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'An error occurred while creating the child profile'
      }
    });
  }
};

/**
 * PUT /api/members/children/:id
 * Update a child profile
 */
export const updateChild = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const childId = parseInt(req.params.id);
    const { firstName, lastName, age } = req.body;

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

    if (!childId || isNaN(childId)) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Valid child ID is required'
        }
      });
      return;
    }

    // Verify child exists and belongs to the user
    const existingChild = await prisma.child.findFirst({
      where: {
        id: childId,
        parentId: userId
      }
    });

    if (!existingChild) {
      res.status(404).json({
        success: false,
        error: {
          code: 'CHILD_NOT_FOUND',
          message: 'Child not found or does not belong to you'
        }
      });
      return;
    }

    // Build update data object
    const updateData: any = {};

    if (firstName !== undefined) {
      if (!firstName.trim()) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'First name cannot be empty'
          }
        });
        return;
      }
      updateData.firstName = firstName.trim();
    }

    if (lastName !== undefined) {
      if (!lastName.trim()) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Last name cannot be empty'
          }
        });
        return;
      }
      updateData.lastName = lastName.trim();
    }

    if (age !== undefined) {
      const ageNum = parseInt(age);
      if (isNaN(ageNum) || ageNum < 1 || ageNum > 100) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Age must be a valid number between 1 and 100'
          }
        });
        return;
      }
      updateData.age = ageNum;
    }

    // Update child profile
    const updatedChild = await prisma.child.update({
      where: { id: childId },
      data: updateData
    });

    res.json({
      success: true,
      data: {
        id: updatedChild.id,
        firstName: updatedChild.firstName,
        lastName: updatedChild.lastName,
        age: updatedChild.age,
        updatedAt: updatedChild.updatedAt,
        message: 'Child profile updated successfully'
      }
    });
  } catch (error) {
    console.error('Child update error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'An error occurred while updating the child profile'
      }
    });
  }
};

/**
 * DELETE /api/members/children/:id
 * Delete a child profile and cancel all future bookings
 */
export const deleteChild = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const childId = parseInt(req.params.id);

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

    if (!childId || isNaN(childId)) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Valid child ID is required'
        }
      });
      return;
    }

    // Verify child exists and belongs to the user
    const existingChild = await prisma.child.findFirst({
      where: {
        id: childId,
        parentId: userId
      }
    });

    if (!existingChild) {
      res.status(404).json({
        success: false,
        error: {
          code: 'CHILD_NOT_FOUND',
          message: 'Child not found or does not belong to you'
        }
      });
      return;
    }

    // Use transaction to cancel future bookings and delete child
    const result = await prisma.$transaction(async (tx) => {
      // Find all future confirmed bookings for this child
      const futureBookings = await tx.booking.findMany({
        where: {
          childId,
          status: 'confirmed',
          classInstance: {
            startTime: {
              gte: new Date()
            }
          }
        },
        include: {
          memberPackage: true,
          classInstance: {
            include: {
              classType: true
            }
          }
        }
      });

      // Cancel each booking and refund credits
      for (const booking of futureBookings) {
        // Update booking status to cancelled
        await tx.booking.update({
          where: { id: booking.id },
          data: {
            status: 'cancelled',
            cancelledAt: new Date()
          }
        });

        // Refund credit to member package
        const updatedPackage = await tx.memberPackage.update({
          where: { id: booking.memberPackageId },
          data: {
            sessionsRemaining: booking.memberPackage.sessionsRemaining + 1
          }
        });

        // Create credit transaction log
        await tx.creditTransaction.create({
          data: {
            userId,
            memberPackageId: booking.memberPackageId,
            bookingId: booking.id,
            transactionType: 'refund',
            creditsChange: 1,
            balanceAfter: updatedPackage.sessionsRemaining,
            notes: `Refund for cancelled booking due to child profile deletion: ${booking.classInstance.classType.name} on ${booking.classInstance.startTime.toISOString()}`
          }
        });
      }

      // Delete the child (cascade will handle remaining bookings)
      await tx.child.delete({
        where: { id: childId }
      });

      return {
        cancelledBookingsCount: futureBookings.length,
        refundedCredits: futureBookings.length
      };
    });

    res.json({
      success: true,
      data: {
        childId,
        cancelledBookingsCount: result.cancelledBookingsCount,
        refundedCredits: result.refundedCredits,
        message: `Child profile deleted successfully. ${result.cancelledBookingsCount} future booking(s) cancelled and ${result.refundedCredits} credit(s) refunded.`
      }
    });
  } catch (error) {
    console.error('Child deletion error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'An error occurred while deleting the child profile'
      }
    });
  }
}
