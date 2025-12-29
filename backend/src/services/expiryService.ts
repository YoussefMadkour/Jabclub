import cron from 'node-cron';
import prisma from '../config/database';
import { sendNotification, sendEmail, NotificationTemplates } from './notificationService';

/**
 * Check for expired packages and mark them as expired
 * This function runs daily to identify packages that have passed their expiry date
 */
export const checkExpiredPackages = async (): Promise<void> => {
  try {
    console.log('🔍 Running expiry check...');
    
    const now = new Date();
    
    // Find all packages that have expired but are not yet marked as expired
    const expiredPackages = await prisma.memberPackage.findMany({
      where: {
        isExpired: false,
        expiryDate: {
          lt: now
        }
      },
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

    if (expiredPackages.length === 0) {
      console.log('✅ No expired packages found');
      return;
    }

    console.log(`⚠️  Found ${expiredPackages.length} expired package(s)`);

    // Process each expired package
    for (const pkg of expiredPackages) {
      try {
        // Use transaction to mark package as expired and create credit transaction log
        await prisma.$transaction(async (tx) => {
          // Mark package as expired
          await tx.memberPackage.update({
            where: { id: pkg.id },
            data: {
              isExpired: true
            }
          });

          // Create credit transaction log entry for expired credits
          if (pkg.sessionsRemaining > 0) {
            await tx.creditTransaction.create({
              data: {
                userId: pkg.userId,
                memberPackageId: pkg.id,
                transactionType: 'expiry',
                creditsChange: -pkg.sessionsRemaining,
                balanceAfter: 0,
                notes: `${pkg.sessionsRemaining} credit(s) expired from package: ${pkg.package.name}. Expiry date: ${pkg.expiryDate.toISOString()}`
              }
            });
          }
        });

        console.log(
          `  ✓ Expired package ID ${pkg.id} for user ${pkg.user.email} ` +
          `(${pkg.sessionsRemaining} credits lost from ${pkg.package.name})`
        );
      } catch (error) {
        console.error(`  ✗ Error processing package ID ${pkg.id}:`, error);
      }
    }

    console.log('✅ Expiry check completed');
  } catch (error) {
    console.error('❌ Error during expiry check:', error);
  }
};

/**
 * Check for packages expiring within a week and send warning notifications
 * This function runs daily to notify members about upcoming expirations
 */
export const checkExpiringPackages = async (): Promise<void> => {
  try {
    console.log('🔔 Running expiry warning check...');
    
    const now = new Date();
    const oneWeekFromNow = new Date(now);
    oneWeekFromNow.setDate(oneWeekFromNow.getDate() + 7);
    
    // Find all packages expiring within the next 7 days that are not expired
    const expiringPackages = await prisma.memberPackage.findMany({
      where: {
        isExpired: false,
        expiryDate: {
          gte: now,
          lte: oneWeekFromNow
        },
        sessionsRemaining: {
          gt: 0 // Only notify if there are remaining sessions
        }
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
            name: true
          }
        }
      }
    });

    if (expiringPackages.length === 0) {
      console.log('✅ No packages expiring within a week');
      return;
    }

    console.log(`⚠️  Found ${expiringPackages.length} package(s) expiring within a week`);

    // Send notifications for each expiring package
    for (const pkg of expiringPackages) {
      try {
        const expiryDateFormatted = new Date(pkg.expiryDate).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });

        const template = NotificationTemplates.packageExpiryWarning(
          pkg.user.firstName,
          pkg.package.name,
          pkg.sessionsRemaining,
          expiryDateFormatted
        );

        await sendNotification(
          {
            email: pkg.user.email,
            name: `${pkg.user.firstName} ${pkg.user.lastName}`,
          },
          template.emailSubject,
          template.emailHtml
        );

        console.log(
          `  ✓ Sent expiry warning for package ID ${pkg.id} to user ${pkg.user.email} ` +
          `(${pkg.sessionsRemaining} sessions remaining, expires ${expiryDateFormatted})`
        );
      } catch (error) {
        console.error(`  ✗ Error sending expiry warning for package ID ${pkg.id}:`, error);
      }
    }

    console.log('✅ Expiry warning check completed');
  } catch (error) {
    console.error('❌ Error during expiry warning check:', error);
  }
};

/**
 * Check for packages expiring soon and send renewal reminders
 * This function runs daily to remind members to renew their packages
 */
export const checkRenewalReminders = async (): Promise<void> => {
  try {
    console.log('🔄 Running renewal reminder check...');
    
    const now = new Date();
    const threeDaysFromNow = new Date(now);
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
    
    // Find all packages expiring within the next 3 days that are not expired
    const expiringPackages = await prisma.memberPackage.findMany({
      where: {
        isExpired: false,
        expiryDate: {
          gte: now,
          lte: threeDaysFromNow
        }
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
            name: true
          }
        }
      }
    });

    if (expiringPackages.length === 0) {
      console.log('✅ No packages needing renewal reminders');
      return;
    }

    console.log(`🔄 Found ${expiringPackages.length} package(s) needing renewal reminders`);

    // Send renewal reminders for each expiring package
    for (const pkg of expiringPackages) {
      try {
        const expiryDate = new Date(pkg.expiryDate);
        const daysRemaining = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        
        const expiryDateFormatted = expiryDate.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });

        const template = NotificationTemplates.packageRenewalReminder(
          pkg.user.firstName,
          pkg.package.name,
          expiryDateFormatted,
          daysRemaining
        );

        // Send email
        await sendEmail(
          pkg.user.email,
          template.emailSubject,
          template.emailHtml
        ).catch((err) => {
          console.error(`  ✗ Error sending renewal reminder email for package ID ${pkg.id}:`, err);
        });

        console.log(
          `  ✓ Sent renewal reminder for package ID ${pkg.id} to user ${pkg.user.email} ` +
          `(expires in ${daysRemaining} day${daysRemaining !== 1 ? 's' : ''})`
        );
      } catch (error) {
        console.error(`  ✗ Error sending renewal reminder for package ID ${pkg.id}:`, error);
      }
    }

    console.log('✅ Renewal reminder check completed');
  } catch (error) {
    console.error('❌ Error during renewal reminder check:', error);
  }
};

/**
 * Initialize the scheduled job to check for expired packages daily
 * Runs every day at 00:00 (midnight)
 */
export const initializeExpiryScheduler = (): void => {
  // Schedule job to run daily at midnight (00:00) to check for expired packages
  cron.schedule('0 0 * * *', async () => {
    console.log('⏰ Scheduled expiry check triggered');
    await checkExpiredPackages();
  });

  // Schedule job to run daily at 09:00 (9 AM) to check for packages expiring within a week
  cron.schedule('0 9 * * *', async () => {
    console.log('⏰ Scheduled expiry warning check triggered');
    await checkExpiringPackages();
  });

  // Schedule job to run daily at 10:00 (10 AM) to send renewal reminders
  cron.schedule('0 10 * * *', async () => {
    console.log('⏰ Scheduled renewal reminder check triggered');
    await checkRenewalReminders();
  });

  console.log('📅 Expiry scheduler initialized:');
  console.log('   - Expiry check: daily at midnight (00:00)');
  console.log('   - Expiry warning: daily at 9 AM (09:00)');
  console.log('   - Renewal reminder: daily at 10 AM (10:00)');
  
  // Optionally run the checks immediately on startup
  // Uncomment the lines below if you want to check on server start
  // checkExpiredPackages();
  // checkExpiringPackages();
};
