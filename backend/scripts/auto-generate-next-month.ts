import { PrismaClient } from '@prisma/client';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);
const prisma = new PrismaClient();

async function generateNextMonthSchedule() {
  try {
    console.log('Auto-generating schedule for next month...');
    
    // Get current date
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1; // JavaScript months are 0-indexed
    
    // Calculate next month
    let nextYear = currentYear;
    let nextMonth = currentMonth + 1;
    
    if (nextMonth > 12) {
      nextMonth = 1;
      nextYear = currentYear + 1;
    }
    
    console.log(`Generating schedule for ${nextYear}-${nextMonth.toString().padStart(2, '0')}...`);
    
    // Run the schedule generation script
    const { stdout, stderr } = await execAsync(`npm run schedule:generate -- ${nextYear} ${nextMonth}`, {
      cwd: process.cwd()
    });
    
    if (stdout) console.log(stdout);
    if (stderr) console.error(stderr);
    
    console.log(`✅ Successfully generated schedule for ${nextYear}-${nextMonth.toString().padStart(2, '0')}!`);
  } catch (error) {
    console.error('Error auto-generating next month schedule:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the function
generateNextMonthSchedule();
