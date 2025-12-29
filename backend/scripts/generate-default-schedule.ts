import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Define the default schedule for each location
const defaultSchedules = [
  // Edge Fit Zayed Dunes Club House
  {
    locationName: 'Edge Fit Zayed Dunes Club House',
    schedules: [
      { dayOfWeek: 6, time: '18:00', classTypeName: 'Kids & Juniors MMA' }, // Saturday 6:00 PM
      { dayOfWeek: 6, time: '19:00', classTypeName: 'Adults Kickboxing' }, // Saturday 7:00 PM
      { dayOfWeek: 6, time: '20:00', classTypeName: 'MMA Pro' }, // Saturday 8:00 PM
      { dayOfWeek: 0, time: '18:00', classTypeName: 'Kids & Juniors MMA' }, // Sunday 6:00 PM
      { dayOfWeek: 0, time: '19:00', classTypeName: 'Adults Boxing' }, // Sunday 7:00 PM
      { dayOfWeek: 1, time: '18:00', classTypeName: 'Kids & Juniors MMA' }, // Monday 6:00 PM
      { dayOfWeek: 1, time: '19:00', classTypeName: 'Adults Kickboxing' }, // Monday 7:00 PM
      { dayOfWeek: 1, time: '20:00', classTypeName: 'MMA Pro' }, // Monday 8:00 PM
      { dayOfWeek: 2, time: '18:00', classTypeName: 'Kids & Juniors MMA' }, // Tuesday 6:00 PM
      { dayOfWeek: 2, time: '19:00', classTypeName: 'Adults Kickboxing' }, // Tuesday 7:00 PM
      { dayOfWeek: 3, time: '18:00', classTypeName: 'Kids & Juniors MMA' }, // Wednesday 6:00 PM
      { dayOfWeek: 3, time: '19:00', classTypeName: 'Adults Kickboxing' }, // Wednesday 7:00 PM
      { dayOfWeek: 3, time: '20:00', classTypeName: 'MMA Pro' }, // Wednesday 8:00 PM
      { dayOfWeek: 4, time: '18:00', classTypeName: 'Kids & Juniors MMA' }, // Thursday 6:00 PM
      { dayOfWeek: 4, time: '19:00', classTypeName: 'Adults Boxing' }, // Thursday 7:00 PM
    ]
  },
  // Gofit Arena Hadayek El-Ahram
  {
    locationName: 'Gofit Arena Hadayek El-Ahram',
    schedules: [
      { dayOfWeek: 6, time: '19:00', classTypeName: 'Kids & Juniors Kickboxing' }, // Saturday 7:00 PM
      { dayOfWeek: 6, time: '20:30', classTypeName: 'Teens & Adults Kickboxing' }, // Saturday 8:30 PM
      { dayOfWeek: 1, time: '19:00', classTypeName: 'Kids & Juniors Kickboxing' }, // Monday 7:00 PM
      { dayOfWeek: 1, time: '20:30', classTypeName: 'Teens & Adults Kickboxing' }, // Monday 8:30 PM
      { dayOfWeek: 3, time: '19:00', classTypeName: 'Kids & Juniors Kickboxing' }, // Wednesday 7:00 PM
      { dayOfWeek: 3, time: '20:30', classTypeName: 'Teens & Adults Kickboxing' }, // Wednesday 8:30 PM
      { dayOfWeek: 4, time: '19:00', classTypeName: 'Kids & Juniors Kickboxing' }, // Thursday 7:00 PM
      { dayOfWeek: 4, time: '20:30', classTypeName: 'Teens & Adults Kickboxing' }, // Thursday 8:30 PM
    ]
  },
  // CORE
  {
    locationName: 'CORE',
    schedules: [
      { dayOfWeek: 2, time: '20:30', classTypeName: 'Rumble Kickboxing' }, // Tuesday 8:30 PM
      { dayOfWeek: 3, time: '20:30', classTypeName: 'Rumble Kickboxing' }, // Wednesday 8:30 PM
    ]
  }
];

async function generateMonthlySchedule(year: number, month: number) {
  console.log(`Generating schedule for ${year}-${month.toString().padStart(2, '0')}...`);
  
  try {
    // Get all locations
    const locations = await prisma.location.findMany({
      where: { isActive: true }
    });
    
    // Get all class types
    const classTypes = await prisma.classType.findMany();
    
    // Get a default coach (we'll use the first coach we find)
    const defaultCoach = await prisma.user.findFirst({
      where: { role: 'coach' }
    });
    
    if (!defaultCoach) {
      console.error('No coach found in the database. Please create a coach first.');
      return;
    }
    
    // Get the first day of the month
    const firstDay = new Date(year, month - 1, 1);
    // Get the last day of the month
    const lastDay = new Date(year, month, 0);
    
    console.log(`Generating classes from ${firstDay.toISOString().split('T')[0]} to ${lastDay.toISOString().split('T')[0]}`);
    
    // For each location's default schedule
    for (const locationSchedule of defaultSchedules) {
      const location = locations.find(l => l.name === locationSchedule.locationName);
      
      if (!location) {
        console.warn(`Location "${locationSchedule.locationName}" not found. Skipping.`);
        continue;
      }
      
      console.log(`Processing location: ${location.name}`);
      
      // For each day in the month
      for (let day = 1; day <= lastDay.getDate(); day++) {
        const currentDate = new Date(year, month - 1, day);
        const dayOfWeek = currentDate.getDay(); // 0 = Sunday, 1 = Monday, etc.
        
        // For each schedule that matches this day of the week
        const daySchedules = locationSchedule.schedules.filter(s => s.dayOfWeek === dayOfWeek);
        
        for (const schedule of daySchedules) {
          // Parse the time (HH:MM format)
          const [hours, minutes] = schedule.time.split(':').map(Number);
          
          // Create the start time
          const startTime = new Date(year, month - 1, day, hours, minutes);
          
          // Find the class type
          const classType = classTypes.find(ct => ct.name === schedule.classTypeName);
          
          if (!classType) {
            console.warn(`Class type "${schedule.classTypeName}" not found. Skipping.`);
            continue;
          }
          
          // Calculate end time
          const endTime = new Date(startTime.getTime() + classType.durationMinutes * 60000);
          
          // Check if a class instance already exists at this time
          const existingInstance = await prisma.classInstance.findFirst({
            where: {
              locationId: location.id,
              classTypeId: classType.id,
              startTime: {
                gte: new Date(startTime.getTime() - 60000), // 1 minute before
                lt: new Date(startTime.getTime() + 60000) // 1 minute after
              }
            }
          });
          
          if (existingInstance) {
            console.log(`Class instance already exists for ${location.name} on ${startTime.toISOString()}. Skipping.`);
            continue;
          }
          
          // Create the class instance
          await prisma.classInstance.create({
            data: {
              classTypeId: classType.id,
              coachId: defaultCoach.id,
              locationId: location.id,
              startTime,
              endTime,
              capacity: location.capacity,
              isCancelled: false
            }
          });
          
          console.log(`Created class: ${classType.name} at ${location.name} on ${startTime.toISOString()}`);
        }
      }
    }
    
    console.log(`✅ Schedule generation completed for ${year}-${month.toString().padStart(2, '0')}!`);
  } catch (error) {
    console.error('Error generating schedule:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Get command line arguments
const args = process.argv.slice(2);
let year = new Date().getFullYear();
let month = new Date().getMonth() + 1; // Current month

if (args.length >= 1) {
  year = parseInt(args[0]);
  if (isNaN(year)) {
    console.error('Invalid year. Using current year.');
    year = new Date().getFullYear();
  }
}

if (args.length >= 2) {
  month = parseInt(args[1]);
  if (isNaN(month) || month < 1 || month > 12) {
    console.error('Invalid month. Using current month.');
    month = new Date().getMonth() + 1;
  }
}

// Run the function
generateMonthlySchedule(year, month);
