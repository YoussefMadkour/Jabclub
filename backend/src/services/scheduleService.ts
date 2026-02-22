import prisma from '../config/database';

/**
 * Generate class instances from active recurring schedules
 * This should be run daily via cron job to create classes for the next N months
 * Defaults to 2 months ahead to ensure classes are always available
 */
export async function generateClassesFromSchedules(monthsAhead: number = 2): Promise<void> {
  try {
    // Get all active schedules (both base and override)
    const schedules = await prisma.classSchedule.findMany({
      where: {
        isActive: true
      },
      include: {
        classType: true,
        location: true,
        coach: true,
        baseSchedule: true
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

    // Separate base schedules and override schedules
    const baseSchedules = schedules.filter(s => !s.isOverride);
    const overrideSchedules = schedules.filter(s => s.isOverride);

    // Process base schedules first
    for (const schedule of baseSchedules) {
      // Generate classes for each week until endDate
      let currentDate = new Date(today);
      
      while (currentDate <= endDate) {
        // Get the date for this day of week
        const dayOfWeek = currentDate.getDay(); // 0 = Sunday, 1 = Monday, etc.
        
        if (dayOfWeek === schedule.dayOfWeek) {
          // Check if this date is covered by an override schedule
          const hasOverride = overrideSchedules.some(override => {
            if (override.locationId !== schedule.locationId ||
                override.dayOfWeek !== schedule.dayOfWeek ||
                override.startTime !== schedule.startTime) {
              return false;
            }
            
            const overrideStart = override.overrideStartDate ? new Date(override.overrideStartDate) : null;
            const overrideEnd = override.overrideEndDate ? new Date(override.overrideEndDate) : null;
            
            // Check if current date falls within override range
            if (overrideStart && overrideEnd) {
              const dateOnly = new Date(currentDate);
              dateOnly.setHours(0, 0, 0, 0);
              const startOnly = new Date(overrideStart);
              startOnly.setHours(0, 0, 0, 0);
              const endOnly = new Date(overrideEnd);
              endOnly.setHours(23, 59, 59, 999);
              
              return dateOnly >= startOnly && dateOnly <= endOnly;
            }
            
            return false;
          });
          
          // Skip if there's an override for this date
          if (hasOverride) {
            currentDate.setDate(currentDate.getDate() + 1);
            continue;
          }
          
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

    // Process override schedules (only generate within their date range)
    for (const schedule of overrideSchedules) {
      if (!schedule.overrideStartDate || !schedule.overrideEndDate) {
        continue; // Skip if override dates are not set
      }

      const overrideStart = new Date(schedule.overrideStartDate);
      const overrideEnd = new Date(schedule.overrideEndDate);
      
      // Ensure we don't go beyond the endDate
      const effectiveEndDate = overrideEnd > endDate ? endDate : overrideEnd;
      
      let currentDate = new Date(overrideStart);
      if (currentDate < today) {
        currentDate = new Date(today); // Start from today if override started in the past
      }
      
      while (currentDate <= effectiveEndDate) {
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
          
          // Check if a class instance already exists at this time (from base schedule or another override)
          const existingInstance = await prisma.classInstance.findFirst({
            where: {
              locationId: schedule.locationId,
              startTime: {
                gte: new Date(startTime.getTime() - 60000), // 1 minute before
                lt: new Date(startTime.getTime() + 60000) // 1 minute after
              }
            }
          });
          
          if (existingInstance) {
            // Update existing instance to use override schedule
            await prisma.classInstance.update({
              where: { id: existingInstance.id },
              data: {
                scheduleId: schedule.id,
                classTypeId: schedule.classTypeId,
                coachId: schedule.coachId,
                capacity: schedule.capacity,
                isCancelled: false
              }
            });
          } else {
            // Create new instance from override schedule
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





