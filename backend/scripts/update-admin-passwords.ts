import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import * as readline from 'readline';

const prisma = new PrismaClient();

// Generate secure random password
function generateSecurePassword(length: number = 16): string {
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
  let password = '';
  const randomValues = new Uint32Array(length);
  crypto.getRandomValues(randomValues);
  
  for (let i = 0; i < length; i++) {
    password += charset[randomValues[i] % charset.length];
  }
  
  // Ensure at least one uppercase, one lowercase, one number, and one special char
  if (!/[a-z]/.test(password)) password = password.slice(0, -1) + 'a';
  if (!/[A-Z]/.test(password)) password = password.slice(0, -1) + 'A';
  if (!/[0-9]/.test(password)) password = password.slice(0, -1) + '1';
  if (!/[!@#$%^&*]/.test(password)) password = password.slice(0, -1) + '!';
  
  return password;
}

async function updatePasswords() {
  console.log('🔐 Updating Admin and Coach Passwords');
  console.log('=====================================\n');

  // Generate secure passwords
  const adminPassword = generateSecurePassword(20);
  const coachPassword = generateSecurePassword(20);

  // Hash passwords
  const adminPasswordHash = await bcrypt.hash(adminPassword, 10);
  const coachPasswordHash = await bcrypt.hash(coachPassword, 10);

  try {
    // Update admin password
    const admin = await prisma.user.update({
      where: { email: 'admin@jabclub.com' },
      data: { passwordHash: adminPasswordHash },
    });
    console.log('✅ Updated admin password');

    // Update coach password
    const coach = await prisma.user.update({
      where: { email: 'coach@jabclub.com' },
      data: { passwordHash: coachPasswordHash },
    });
    console.log('✅ Updated coach password');

    console.log('\n📋 New Credentials:');
    console.log('==================');
    console.log(`Admin: admin@jabclub.com`);
    console.log(`Password: ${adminPassword}`);
    console.log('');
    console.log(`Coach: coach@jabclub.com`);
    console.log(`Password: ${coachPassword}`);
    console.log('\n⚠️  IMPORTANT: Save these passwords securely!');
    console.log('   They will not be shown again.\n');

    // Save to file
    const fs = require('fs');
    const credentials = {
      admin: {
        email: 'admin@jabclub.com',
        password: adminPassword,
      },
      coach: {
        email: 'coach@jabclub.com',
        password: coachPassword,
      },
      updatedAt: new Date().toISOString(),
    };

    fs.writeFileSync(
      '.admin-credentials.json',
      JSON.stringify(credentials, null, 2)
    );
    console.log('💾 Credentials saved to: .admin-credentials.json');
    console.log('   (This file is in .gitignore and will not be committed)\n');

  } catch (error: any) {
    if (error.code === 'P2025') {
      console.error('❌ Error: User not found. Make sure the database is seeded.');
      console.error('   Run: npm run prisma:seed');
    } else {
      console.error('❌ Error updating passwords:', error.message);
    }
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

updatePasswords();

