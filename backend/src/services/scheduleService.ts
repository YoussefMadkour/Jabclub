import prisma from '../config/database';

/**
 * Generate class instances from active recurring schedules
 * This should be run daily via cron job to create classes for the next N months
 * Defaults to 2 months ahead to ensure classes are always available
 */
export async function generateClassesFromSchedules(monthsAhead: number = 2): Promise<void> {
  try {
    // Get all active schedules
    const schedules = await prisma.classSchedule.findMany({
      where: {
        isActive: true
      },
      include: {
        classType: true,
        location: true,
        coach: true
      }
    });

    const today = new Date();
    const endDate = new Date(today);
    endDate.setMonth(endDate.getMonth() + monthsAhead);

    const classesToCreate: Array<{
      classTypeId: number;
      coachId: number;
      locationId: number;
      scheduleId: number;
      startTime: Date;
      endTime: Date;
      capacity: number;
      isCancelled: boolean;
    }> = [];

    for (const schedule of schedules) {
      // Generate classes for each week until endDate
      let currentDate = new Date(today);
      
      while (currentDate <= endDate) {
        // Get the date for this day of week
        const dayOfWeek = currentDate.getDay(); // 0 = Sunday, 1 = Monday, etc.
        
        if (dayOfWeek === schedule.dayOfWeek) {
          // Parse the time (HH:MM format)
          const [hours, minutes] = schedule.startTime.split(':').map(Number);
          
          // Create the start time for this occurrence
          const startTime = new Date(currentDate);
          startTime.setHours(hours, minutes, 0, 0);
          
          // Calculate end time based on class duration
          const endTime = new Date(startTime.getTime() + schedule.classType.durationMinutes * 60000);
          
          // Check if a class instance already exists at this time
          const existingInstance = await prisma.classInstance.findFirst({
            where: {
              scheduleId: schedule.id,
              startTime: {
                gte: new Date(startTime.getTime() - 60000), // 1 minute before
                lt: new Date(startTime.getTime() + 60000) // 1 minute after
              }
            }
          });
          
          if (!existingInstance) {
            classesToCreate.push({
              classTypeId: schedule.classTypeId,
              coachId: schedule.coachId,
              locationId: schedule.locationId,
              scheduleId: schedule.id,
              startTime,
              endTime,
              capacity: schedule.capacity,
              isCancelled: false
            });
          }
        }
        
        // Move to next day
        currentDate.setDate(currentDate.getDate() + 1);
      }
    }

    // Create all classes in batch
    if (classesToCreate.length > 0) {
      await prisma.classInstance.createMany({
        data: classesToCreate,
        skipDuplicates: true
      });
      console.log(`Generated ${classesToCreate.length} class instances from schedules`);
    }
  } catch (error) {
    console.error('Error generating classes from schedules:', error);
    throw error;
  }
}





