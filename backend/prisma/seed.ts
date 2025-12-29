import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting database seed...');

  // Create admin user
  const adminPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@jabclub.com' },
    update: {},
    create: {
      email: 'admin@jabclub.com',
      passwordHash: adminPassword,
      firstName: 'Admin',
      lastName: 'User',
      phone: '+1234567890',
      role: 'admin',
    },
  });
  console.log('✓ Created admin user:', admin.email);

  // Create sample coach
  const coachPassword = await bcrypt.hash('coach123', 10);
  const coach = await prisma.user.upsert({
    where: { email: 'coach@jabclub.com' },
    update: {},
    create: {
      email: 'coach@jabclub.com',
      passwordHash: coachPassword,
      firstName: 'Zakaria',
      lastName: 'Coach',
      phone: '+1234567891',
      role: 'coach',
    },
  });
  console.log('✓ Created coach user:', coach.email);

  // Create sample member
  const memberPassword = await bcrypt.hash('member123', 10);
  const member = await prisma.user.upsert({
    where: { email: 'member@jabclub.com' },
    update: {},
    create: {
      email: 'member@jabclub.com',
      passwordHash: memberPassword,
      firstName: 'Jane',
      lastName: 'Member',
      phone: '+1234567892',
      role: 'member',
    },
  });
  console.log('✓ Created member user:', member.email);

  // Create locations
  // First delete existing locations to avoid conflicts
  await prisma.location.deleteMany({});
  
  const locations = await Promise.all([
    prisma.location.create({
      data: {
        name: 'Edge Fit Zayed Dunes Club House',
        address: 'Zayed Dunes Club House, Egypt',
        capacity: 20,
        isActive: true,
      },
    }),
    prisma.location.create({
      data: {
        name: 'Gofit Arena Hadayek El-Ahram',
        address: 'Hadayek El-Ahram, Egypt',
        capacity: 15,
        isActive: true,
      },
    }),
    prisma.location.create({
      data: {
        name: 'CORE',
        address: 'CORE, Egypt',
        capacity: 25,
        isActive: true,
      },
    }),
  ]);
  console.log(`✓ Created ${locations.length} locations`);

  // Create class types
  // First delete existing class types to avoid conflicts
  await prisma.classType.deleteMany({});
  
  const classTypes = await Promise.all([
    // Edge Fit Zayed Dunes Club House class types
    prisma.classType.create({
      data: {
        name: 'Kids & Juniors MMA',
        description: 'MMA training for kids and juniors',
        durationMinutes: 60,
      },
    }),
    prisma.classType.create({
      data: {
        name: 'Adults Kickboxing',
        description: 'Kickboxing classes for adults',
        durationMinutes: 60,
      },
    }),
    prisma.classType.create({
      data: {
        name: 'MMA Pro',
        description: 'Professional MMA training',
        durationMinutes: 60,
      },
    }),
    prisma.classType.create({
      data: {
        name: 'Adults Boxing',
        description: 'Boxing classes for adults',
        durationMinutes: 60,
      },
    }),
    // Gofit Arena Hadayek El-Ahram class types
    prisma.classType.create({
      data: {
        name: 'Kids & Juniors Kickboxing',
        description: 'Kickboxing training for kids and juniors',
        durationMinutes: 60,
      },
    }),
    prisma.classType.create({
      data: {
        name: 'Teens & Adults Kickboxing',
        description: 'Kickboxing classes for teens and adults',
        durationMinutes: 60,
      },
    }),
    // CORE class types
    prisma.classType.create({
      data: {
        name: 'Rumble Kickboxing',
        description: 'Rumble kickboxing classes',
        durationMinutes: 60,
      },
    }),
  ]);
  console.log(`✓ Created ${classTypes.length} class types`);

  // Create session packages
  // First delete existing data in correct order to avoid foreign key constraints
  await prisma.payment.deleteMany({});
  await prisma.booking.deleteMany({});
  await prisma.creditTransaction.deleteMany({});
  await prisma.memberPackage.deleteMany({});
  await prisma.classInstance.deleteMany({});
  await prisma.sessionPackage.deleteMany({});
  
  const packages = await Promise.all([
    prisma.sessionPackage.create({
      data: {
        name: 'Starter Pack',
        sessionCount: 5,
        price: 1500.00,
        expiryDays: 30,
        isActive: true,
      },
    }),
    prisma.sessionPackage.create({
      data: {
        name: 'Regular Pack',
        sessionCount: 10,
        price: 2700.00,
        expiryDays: 60,
        isActive: true,
      },
    }),
    prisma.sessionPackage.create({
      data: {
        name: 'Premium Pack',
        sessionCount: 20,
        price: 4800.00,
        expiryDays: 90,
        isActive: true,
      },
    }),
    prisma.sessionPackage.create({
      data: {
        name: 'Unlimited Monthly',
        sessionCount: 30,
        price: 6000.00,
        expiryDays: 30,
        isActive: true,
      },
    }),
  ]);
  console.log(`✓ Created ${packages.length} session packages`);

  console.log('\n✅ Database seeding completed successfully!');
  console.log('\nTest Credentials:');
  console.log('Admin: admin@jabclub.com / admin123');
  console.log('Coach: coach@jabclub.com / coach123');
  console.log('Member: member@jabclub.com / member123');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
