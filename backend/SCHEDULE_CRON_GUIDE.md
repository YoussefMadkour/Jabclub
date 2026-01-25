# Schedule Generation Cron Job Guide

## Overview

The schedule generation system automatically creates class instances from recurring schedules. This guide explains when the cron job runs and how to manually trigger it.

## When Does the Cron Job Run?

### Local Development
- **Schedule**: Daily at 2:00 AM (`0 2 * * *`)
- **Location**: Runs automatically when you start the backend server locally
- **Note**: Only runs if `VERCEL !== '1'` and `VERCEL_ENV !== 'production'`

### Production (Vercel)
- **Schedule**: Daily at 2:00 AM UTC (`0 2 * * *`)
- **Location**: Configured in `vercel.json` as a Vercel Cron Job
- **Endpoint**: `/api/cron/generate-classes`
- **Note**: Vercel automatically handles the cron execution

## How to Manually Run Schedule Generation

### Option 1: Using the Script (Recommended for Local)

```bash
cd backend
npm run schedule:generate-classes [monthsAhead]
```

**Examples:**
```bash
# Generate classes for the next 2 months (default)
npm run schedule:generate-classes

# Generate classes for the next 3 months
npm run schedule:generate-classes 3

# Generate classes for the next 1 month
npm run schedule:generate-classes 1
```

### Option 2: Using the Admin API Endpoint

**Endpoint**: `POST /api/admin/schedules/generate`

**Request:**
```bash
curl -X POST https://api.jabclubegy.com/api/admin/schedules/generate \
  -H "Content-Type: application/json" \
  -H "Cookie: jabclub.sid=your-session-cookie" \
  -d '{"monthsAhead": 2}'
```

**Or using the frontend:**
- Navigate to Admin Dashboard → Schedules
- Click "Generate Classes" button (if available in UI)
- Or use the API directly from browser console

**Response:**
```json
{
  "success": true,
  "message": "Successfully generated classes from schedules for the next 2 month(s)",
  "data": {
    "monthsAhead": 2
  }
}
```

### Option 3: Direct Function Call (For Development)

Create a temporary script:

```typescript
// temp-generate.ts
import { generateClassesFromSchedules } from './src/services/scheduleService';

generateClassesFromSchedules(2)
  .then(() => {
    console.log('✅ Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error:', error);
    process.exit(1);
  });
```

Run it:
```bash
ts-node temp-generate.ts
```

## Vercel Cron Job Setup

The cron job is already configured in `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/generate-classes",
      "schedule": "0 2 * * *"
    }
  ]
}
```

### To Verify Cron Job is Running:

1. **Check Vercel Dashboard**:
   - Go to your project → Settings → Cron Jobs
   - You should see "generate-classes" listed
   - Check the logs to see execution history

2. **Check Logs**:
   - Go to your project → Deployments → Functions
   - Look for `/api/cron/generate-classes` function logs
   - Should show execution at 2 AM UTC daily

3. **Manual Test**:
   - You can manually trigger the cron job from Vercel Dashboard
   - Or call the endpoint directly (requires authentication)

## What Gets Generated?

The system:
1. Fetches all **active** schedules from the database
2. For each schedule, generates class instances for the next N months
3. Skips classes that already exist (prevents duplicates)
4. Creates classes based on:
   - Day of week (from schedule)
   - Start time (from schedule)
   - Class type, coach, location (from schedule)
   - Capacity (from schedule)

## Troubleshooting

### Cron Job Not Running

1. **Check Vercel Configuration**:
   - Verify `vercel.json` has the cron configuration
   - Ensure the path matches the actual endpoint

2. **Check Environment Variables**:
   - Ensure `DATABASE_URL` is set correctly
   - Verify database connection is working

3. **Check Logs**:
   - Look for errors in Vercel function logs
   - Check for database connection issues

### Manual Generation Fails

1. **Check Database Connection**:
   ```bash
   cd backend
   npx prisma studio
   ```
   Verify you can connect to the database

2. **Check Schedules Exist**:
   ```bash
   # Query schedules
   npx prisma studio
   # Navigate to class_schedules table
   ```

3. **Check Logs**:
   - Run with verbose logging:
   ```bash
   DEBUG=* npm run schedule:generate-classes
   ```

## Best Practices

1. **Run Manually After Schedule Changes**:
   - After creating/updating schedules, manually trigger generation
   - This ensures new classes are created immediately

2. **Monitor Generation**:
   - Check logs regularly to ensure cron is running
   - Verify classes are being created as expected

3. **Adjust Months Ahead**:
   - Default is 2 months ahead
   - Increase if you need more advance booking
   - Decrease if you want less database storage

## Related Files

- `backend/src/services/scheduleService.ts` - Core generation logic
- `backend/scripts/generate-classes-from-schedules.ts` - Manual script
- `backend/api/cron/generate-classes.ts` - Vercel cron endpoint
- `backend/src/controllers/adminController.ts` - Admin API endpoint
- `backend/vercel.json` - Vercel cron configuration
