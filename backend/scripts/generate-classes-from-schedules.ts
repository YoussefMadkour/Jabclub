#!/usr/bin/env ts-node
/**
 * Manual script to generate class instances from active schedules
 * Usage: npm run schedule:generate-classes [monthsAhead]
 * Example: npm run schedule:generate-classes 2
 */

import { generateClassesFromSchedules } from '../src/services/scheduleService';

async function main() {
  const monthsAhead = process.argv[2] ? parseInt(process.argv[2], 10) : 2;
  
  if (isNaN(monthsAhead) || monthsAhead < 1) {
    console.error('❌ Error: monthsAhead must be a positive number');
    console.log('Usage: npm run schedule:generate-classes [monthsAhead]');
    console.log('Example: npm run schedule:generate-classes 2');
    process.exit(1);
  }

  console.log(`🔄 Generating classes from schedules for the next ${monthsAhead} month(s)...`);
  
  try {
    await generateClassesFromSchedules(monthsAhead);
    console.log(`✅ Successfully generated classes for the next ${monthsAhead} month(s)`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Error generating classes:', error);
    process.exit(1);
  }
}

main();
