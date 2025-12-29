import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

async function initialSetup() {
  try {
    console.log('Running initial setup for JAB Club...');
    
    // Step 1: Seed the database with locations, class types, and users
    console.log('Step 1: Seeding database...');
    const { stdout: seedOutput, stderr: seedError } = await execAsync('npm run prisma:seed');
    
    if (seedOutput) console.log(seedOutput);
    if (seedError) console.error(seedError);
    
    // Step 2: Generate schedule for current month
    console.log('\nStep 2: Generating schedule for current month...');
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1; // JavaScript months are 0-indexed
    
    const { stdout: scheduleOutput, stderr: scheduleError } = await execAsync(
      `npm run schedule:generate -- ${currentYear} ${currentMonth}`
    );
    
    if (scheduleOutput) console.log(scheduleOutput);
    if (scheduleError) console.error(scheduleError);
    
    console.log('\n✅ Initial setup completed successfully!');
    console.log('\nNext steps:');
    console.log('1. Review the generated schedule in the admin interface');
    console.log('2. Make any manual adjustments if needed');
    console.log('3. Set up automation for future months (optional):');
    console.log('   - Run "npm run schedule:next-month" to generate next month manually');
    console.log('   - Run "npm run schedule:cron" to start automatic monthly generation');
  } catch (error) {
    console.error('Error during initial setup:', error);
  }
}

// Run the function
initialSetup();
