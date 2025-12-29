import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function addManualSchedules() {
  console.log('Starting to add manual schedules...');

  try {
    // Find locations
    const edgeFitLocation = await prisma.location.findFirst({
      where: { name: { contains: 'Edge Fit Zayed Dunes', mode: 'insensitive' } }
    });
    
    const gofitLocation = await prisma.location.findFirst({
      where: { name: { contains: 'Gofit Arena', mode: 'insensitive' } }
    });

    if (!edgeFitLocation) {
      console.error('Edge Fit Zayed Dunes Club House location not found');
      return;
    }

    if (!gofitLocation) {
      console.error('Gofit Arena Hadayek El-Ahram location not found');
      return;
    }

    // Find class types
    const kidsJuniorsMMA = await prisma.classType.findFirst({
      where: { name: { contains: 'Kids & Juniors MMA', mode: 'insensitive' } }
    });
    
    const adultsKickboxing = await prisma.classType.findFirst({
      where: { name: { contains: 'Adults Kickboxing', mode: 'insensitive' } }
    });
    
    const mmaPro = await prisma.classType.findFirst({
      where: { name: { contains: 'MMA Pro', mode: 'insensitive' } }
    });
    
    const adultsBoxing = await prisma.classType.findFirst({
      where: { name: { contains: 'Adults Boxing', mode: 'insensitive' } }
    });
    
    const kidsJuniorsKickboxing = await prisma.classType.findFirst({
      where: { name: { contains: 'Kids & Juniors Kickboxing', mode: 'insensitive' } }
    });
    
    const teensAdultsKickboxing = await prisma.classType.findFirst({
      where: { name: { contains: 'Teens & Adults Kickboxing', mode: 'insensitive' } }
    });

    // Find a coach (use the first coach found)
    const coach = await prisma.user.findFirst({
      where: { role: 'coach' }
    });

    if (!coach) {
      console.error('No coach found. Please create a coach first.');
      return;
    }

    console.log(`Using coach: ${coach.firstName} ${coach.lastName}`);

    // Define schedules to create
    const schedulesToCreate = [];

    // Edge Fit Zayed Dunes Club House schedules
    if (edgeFitLocation && kidsJuniorsMMA) {
      // 6:00 PM - Every day (Saturday through Thursday) - Kids & Juniors MMA
      // Day mapping: 0=Sunday, 1=Monday, 2=Tuesday, 3=Wednesday, 4=Thursday, 5=Friday, 6=Saturday
      const daysForKidsMMA = [6, 0, 1, 2, 3, 4]; // Saturday, Sunday, Monday, Tuesday, Wednesday, Thursday
      for (const dayOfWeek of daysForKidsMMA) {
        schedulesToCreate.push({
          classTypeId: kidsJuniorsMMA.id,
          coachId: coach.id,
          locationId: edgeFitLocation.id,
          dayOfWeek: dayOfWeek,
          startTime: '18:00',
          capacity: edgeFitLocation.capacity,
          isActive: true
        });
      }
    }

    if (edgeFitLocation && adultsKickboxing) {
      // 7:00 PM - Saturday, Monday, Tuesday, Wednesday - Adults Kickboxing
      // Day mapping: 0=Sunday, 1=Monday, 2=Tuesday, 3=Wednesday, 4=Thursday, 5=Friday, 6=Saturday
      const daysForAdultsKickboxing = [6, 1, 2, 3]; // Saturday, Monday, Tuesday, Wednesday
      for (const dayOfWeek of daysForAdultsKickboxing) {
        schedulesToCreate.push({
          classTypeId: adultsKickboxing.id,
          coachId: coach.id,
          locationId: edgeFitLocation.id,
          dayOfWeek: dayOfWeek,
          startTime: '19:00',
          capacity: edgeFitLocation.capacity,
          isActive: true
        });
      }
    }

    if (edgeFitLocation && adultsBoxing) {
      // 7:00 PM - Sunday, Thursday - Adults Boxing
      // Day mapping: 0=Sunday, 1=Monday, 2=Tuesday, 3=Wednesday, 4=Thursday, 5=Friday, 6=Saturday
      const daysForAdultsBoxing7pm = [0, 4]; // Sunday, Thursday
      for (const dayOfWeek of daysForAdultsBoxing7pm) {
        schedulesToCreate.push({
          classTypeId: adultsBoxing.id,
          coachId: coach.id,
          locationId: edgeFitLocation.id,
          dayOfWeek: dayOfWeek,
          startTime: '19:00',
          capacity: edgeFitLocation.capacity,
          isActive: true
        });
      }
    }

    if (edgeFitLocation && mmaPro) {
      // 8:00 PM - Saturday, Monday - MMA Pro
      // Day mapping: 0=Sunday, 1=Monday, 2=Tuesday, 3=Wednesday, 4=Thursday, 5=Friday, 6=Saturday
      const daysForMMAPro = [6, 1]; // Saturday, Monday
      for (const dayOfWeek of daysForMMAPro) {
        schedulesToCreate.push({
          classTypeId: mmaPro.id,
          coachId: coach.id,
          locationId: edgeFitLocation.id,
          dayOfWeek: dayOfWeek,
          startTime: '20:00',
          capacity: edgeFitLocation.capacity,
          isActive: true
        });
      }
    }

    if (edgeFitLocation && adultsBoxing) {
      // 8:00 PM - Sunday, Wednesday - Boxing
      // Day mapping: 0=Sunday, 1=Monday, 2=Tuesday, 3=Wednesday, 4=Thursday, 5=Friday, 6=Saturday
      const daysForAdultsBoxing8pm = [0, 3]; // Sunday, Wednesday
      for (const dayOfWeek of daysForAdultsBoxing8pm) {
        schedulesToCreate.push({
          classTypeId: adultsBoxing.id,
          coachId: coach.id,
          locationId: edgeFitLocation.id,
          dayOfWeek: dayOfWeek,
          startTime: '20:00',
          capacity: edgeFitLocation.capacity,
          isActive: true
        });
      }
    }

    // Gofit Arena Hadayek El-Ahram schedules
    if (gofitLocation && kidsJuniorsKickboxing) {
      // 7:00 PM - Saturday, Monday, Wednesday - Kids & Juniors Kickboxing
      // Day mapping: 0=Sunday, 1=Monday, 2=Tuesday, 3=Wednesday, 4=Thursday, 5=Friday, 6=Saturday
      const daysForKidsKickboxing = [6, 1, 3]; // Saturday, Monday, Wednesday
      for (const dayOfWeek of daysForKidsKickboxing) {
        schedulesToCreate.push({
          classTypeId: kidsJuniorsKickboxing.id,
          coachId: coach.id,
          locationId: gofitLocation.id,
          dayOfWeek: dayOfWeek,
          startTime: '19:00',
          capacity: gofitLocation.capacity,
          isActive: true
        });
      }
    }

    if (gofitLocation && teensAdultsKickboxing) {
      // 8:30 PM - Saturday, Monday, Wednesday - Teens & Adults Kickboxing
      // Day mapping: 0=Sunday, 1=Monday, 2=Tuesday, 3=Wednesday, 4=Thursday, 5=Friday, 6=Saturday
      const daysForTeensAdultsKickboxing = [6, 1, 3]; // Saturday, Monday, Wednesday
      for (const dayOfWeek of daysForTeensAdultsKickboxing) {
        schedulesToCreate.push({
          classTypeId: teensAdultsKickboxing.id,
          coachId: coach.id,
          locationId: gofitLocation.id,
          dayOfWeek: dayOfWeek,
          startTime: '20:30',
          capacity: gofitLocation.capacity,
          isActive: true
        });
      }
    }

    // Create schedules (skip duplicates)
    let created = 0;
    let skipped = 0;

    for (const scheduleData of schedulesToCreate) {
      try {
        await prisma.classSchedule.create({
          data: scheduleData
        });
        created++;
        console.log(`✓ Created schedule: ${scheduleData.dayOfWeek} at ${scheduleData.startTime}`);
      } catch (error: any) {
        if (error.code === 'P2002') {
          // Unique constraint violation - schedule already exists
          skipped++;
          console.log(`⊘ Skipped duplicate schedule: ${scheduleData.dayOfWeek} at ${scheduleData.startTime}`);
        } else {
          console.error(`✗ Error creating schedule:`, error);
        }
      }
    }

    console.log(`\n✅ Schedule creation completed!`);
    console.log(`Created: ${created} schedules`);
    console.log(`Skipped (duplicates): ${skipped} schedules`);

    // Generate classes for the next 2 months
    console.log('\nGenerating classes for the next 2 months...');
    const { generateClassesFromSchedules } = require('../src/services/scheduleService');
    await generateClassesFromSchedules(2);
    console.log('✅ Classes generated successfully!');

  } catch (error) {
    console.error('Error adding schedules:', error);
    throw error;
  }
}

addManualSchedules()
  .catch((e) => {
    console.error('Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

