# Schedule Generation

This document explains how to generate default class schedules for your JAB Club locations.

## Overview

The system includes scripts to automatically generate class instances based on predefined schedules for each location. This allows you to quickly populate calendar with recurring classes for any month.

## Default Schedules

The system includes default schedules for three locations:

### Edge Fit Zayed Dunes Club House
- Saturday: 6:00 PM (Kids & Juniors MMA), 7:00 PM (Adults Kickboxing), 8:00 PM (MMA Pro)
- Sunday: 6:00 PM (Kids & Juniors MMA), 7:00 PM (Adults Boxing)
- Monday: 6:00 PM (Kids & Juniors MMA), 7:00 PM (Adults Kickboxing), 8:00 PM (MMA Pro)
- Tuesday: 6:00 PM (Kids & Juniors MMA), 7:00 PM (Adults Kickboxing)
- Wednesday: 6:00 PM (Kids & Juniors MMA), 7:00 PM (Adults Kickboxing), 8:00 PM (MMA Pro)
- Thursday: 6:00 PM (Kids & Juniors MMA), 7:00 PM (Adults Boxing)

### Gofit Arena Hadayek El-Ahram
- Saturday: 7:00 PM (Kids & Juniors Kickboxing), 8:30 PM (Teens & Adults Kickboxing)
- Monday: 7:00 PM (Kids & Juniors Kickboxing), 8:30 PM (Teens & Adults Kickboxing)
- Wednesday: 7:00 PM (Kids & Juniors Kickboxing), 8:30 PM (Teens & Adults Kickboxing)
- Thursday: 7:00 PM (Kids & Juniors Kickboxing), 8:30 PM (Teens & Adults Kickboxing)

### CORE
- Tuesday: 8:30 PM (Rumble Kickboxing)
- Wednesday: 8:30 PM (Rumble Kickboxing)

## Usage

### Generate Schedule for Current Month

```bash
npm run schedule:generate
```

### Generate Schedule for Specific Month

```bash
npm run schedule:generate -- [year] [month]
```

Examples:
- Generate schedule for January 2025: `npm run schedule:generate -- 2025 1`
- Generate schedule for December 2024: `npm run schedule:generate -- 2024 12`

### Generate Schedule for Next Month

```bash
npm run schedule:next-month
```

This automatically calculates the next month based on the current date and generates the schedule for it.

### Run Monthly Schedule Generation Cron Job

```bash
npm run schedule:cron
```

This starts a cron job that automatically generates the next month's schedule on the 25th of each month at 2:00 AM. This gives you time to make any manual adjustments before the next month starts.

## Automation Options

You have several options for automating schedule generation:

1. **Manual Generation**: Run `npm run schedule:next-month` when you need to generate the next month's schedule
2. **Cron Job**: Run `npm run schedule:cron` to start a persistent process that handles monthly generation
3. **System Cron**: Set up a system cron job to run `npm run schedule:next-month` on your preferred schedule

For production deployment, it's recommended to use a system cron job or a process manager like PM2 to ensure the cron process continues running.

## Manual Changes

If you need to make changes to a specific month's schedule (e.g., for holidays or special events), you can:

1. Generate the default schedule first
2. Make manual adjustments through the admin interface
3. These manual changes will not affect other months

## Important Notes

- The script checks for existing class instances before creating new ones to avoid duplicates
- All generated classes will be assigned to the first coach found in the database
- Class capacity is determined by the location's capacity setting
- The script will skip any class types or locations that don't exist in the database
- The cron job runs on the 25th of each month to give time for manual adjustments before the next month starts

## Customization

To modify the default schedules, edit the `defaultSchedules` array in `scripts/generate-default-schedule.ts`. Each schedule entry requires:

- `dayOfWeek`: Day of week (0 = Sunday, 1 = Monday, etc.)
- `time`: Time in HH:MM format (24-hour)
- `classTypeName`: Exact name of the class type

## Troubleshooting

- If you get a "No coach found" error, make sure you have at least one user with the "coach" role in your database
- If class types are not found, verify they exist in the database by running the seed script
- If locations are not found, verify they exist in the database by running the seed script
- If the cron job doesn't run, check that the process is still running and that the system time is correct
