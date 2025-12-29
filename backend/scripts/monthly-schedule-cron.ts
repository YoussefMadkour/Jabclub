import cron from 'node-cron';
import { exec } from 'node:child_process';
import { promisify } from 'node:util';

const execAsync = promisify(exec);

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
  }
}

// Schedule to run on the 25th of every month at 2:00 AM
// This gives time to make any manual adjustments before the next month starts
cron.schedule('0 2 25 * *', () => {
  console.log('Running monthly schedule generation cron job...');
  generateNextMonthSchedule();
});

console.log('Monthly schedule generation cron job scheduled to run on the 25th of each month at 2:00 AM');
console.log('Press Ctrl+C to exit');

// Keep the process running
process.stdin.resume();
