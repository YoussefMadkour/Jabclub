import prisma from '../config/database';

// Egypt is always UTC+2 (no DST). Schedule times are entered in Egypt local time,
// so we subtract 2 hours when building UTC Date objects for storage.
const EGYPT_UTC_OFFSET_HOURS = 2;

/**
 * Build a UTC Date for a given local date + HH:MM time entered in Egypt time.
 * e.g. date=2026-03-01, hours=20, minutes=0 → 2026-03-01T18:00:00.000Z
 */
function egyptTimeToUTC(date: Date, hours: number, minutes: number): Date {
  const utc = new Date(date);
  utc.setUTCHours(hours - EGYPT_UTC_OFFSET_HOURS, minutes, 0, 0);
  return utc;
}

/**
 * Generate class instances from active recurring schedules.
 * Optimised: fetches all existing instances in ONE query upfront instead of
 * one findFirst per candidate date (eliminates the N+1 that caused timeouts).
 */
export async function generateClassesFromSchedules(monthsAhead: number = 2, fromDate?: Date): Promise<void> {
  try {
    const schedules = await prisma.classSchedule.findMany({
      where: { isActive: true },
      include: { classType: true, location: true, coach: true, baseSchedule: true }
    });

    // fromDate lets callers start from earlier than today (e.g. start of current week)
    // so past days in the current week also get class instances
    const today = fromDate ?? new Date();
    const endDate = new Date(today);
    endDate.setMonth(endDate.getMonth() + monthsAhead);

    // ── Batch-fetch all existing instances in the window (one query) ──────────
    // Key: "scheduleId|YYYY-MM-DD HH:MM" for base schedules
    // Key: "locationId|YYYY-MM-DD HH:MM" for override duplicate check
    const existingInstances = await prisma.classInstance.findMany({
      where: { startTime: { gte: today, lte: endDate } },
      select: { scheduleId: true, locationId: true, startTime: true, id: true }
    });

    // Build lookup sets for O(1) existence checks
    const existingByScheduleDate = new Set<string>(); // "scheduleId|YYYY-MM-DDTHH:MM"
    const existingByLocationDate = new Map<string, number>(); // "locationId|YYYY-MM-DDTHH:MM" → id

    for (const inst of existingInstances) {
      const dt = inst.startTime;
      const dateKey = `${dt.getUTCFullYear()}-${String(dt.getUTCMonth()+1).padStart(2,'0')}-${String(dt.getUTCDate()).padStart(2,'0')}T${String(dt.getUTCHours()).padStart(2,'0')}:${String(dt.getUTCMinutes()).padStart(2,'0')}`;
      if (inst.scheduleId !== null) {
        existingByScheduleDate.add(`${inst.scheduleId}|${dateKey}`);
      }
      existingByLocationDate.set(`${inst.locationId}|${dateKey}`, inst.id);
    }

    const baseSchedules = schedules.filter(s => !s.isOverride);
    const overrideSchedules = schedules.filter(s => s.isOverride);

    const classesToCreate: Array<{
      classTypeId: number; coachId: number; locationId: number;
      scheduleId: number; startTime: Date; endTime: Date;
      capacity: number; isCancelled: boolean;
    }> = [];

    const overrideUpdates: Array<{ id: number; data: object }> = [];

    // ── Base schedules ────────────────────────────────────────────────────────
    for (const schedule of baseSchedules) {
      const [hours, minutes] = schedule.startTime.split(':').map(Number);
      let currentDate = new Date(today);

      while (currentDate <= endDate) {
        if (currentDate.getDay() === schedule.dayOfWeek) {
          // Convert Egypt local time to UTC for storage
          const startTime = egyptTimeToUTC(currentDate, hours, minutes);

          const dateKey = `${startTime.getUTCFullYear()}-${String(startTime.getUTCMonth()+1).padStart(2,'0')}-${String(startTime.getUTCDate()).padStart(2,'0')}T${String(startTime.getUTCHours()).padStart(2,'0')}:${String(startTime.getUTCMinutes()).padStart(2,'0')}`;

          // Check if covered by an override (in-memory, no DB query)
          const hasOverride = overrideSchedules.some(override => {
            if (override.locationId !== schedule.locationId ||
                override.dayOfWeek !== schedule.dayOfWeek ||
                override.startTime !== schedule.startTime) return false;
            const os = override.overrideStartDate ? new Date(override.overrideStartDate) : null;
            const oe = override.overrideEndDate   ? new Date(override.overrideEndDate)   : null;
            if (!os || !oe) return false;
            const d = new Date(currentDate); d.setHours(0,0,0,0);
            const s2 = new Date(os); s2.setHours(0,0,0,0);
            const e2 = new Date(oe); e2.setHours(23,59,59,999);
            return d >= s2 && d <= e2;
          });

          if (!hasOverride && !existingByScheduleDate.has(`${schedule.id}|${dateKey}`)) {
            const endTime = new Date(startTime.getTime() + schedule.classType.durationMinutes * 60000);
            classesToCreate.push({
              classTypeId: schedule.classTypeId, coachId: schedule.coachId,
              locationId: schedule.locationId, scheduleId: schedule.id,
              startTime, endTime, capacity: schedule.capacity, isCancelled: false
            });
            // Mark as seen so we don't double-create within this run
            existingByScheduleDate.add(`${schedule.id}|${dateKey}`);
          }
        }
        currentDate.setDate(currentDate.getDate() + 1);
      }
    }

    // ── Override schedules ────────────────────────────────────────────────────
    for (const schedule of overrideSchedules) {
      if (!schedule.overrideStartDate || !schedule.overrideEndDate) continue;

      const [hours, minutes] = schedule.startTime.split(':').map(Number);
      const overrideStart = new Date(schedule.overrideStartDate);
      const overrideEnd   = new Date(schedule.overrideEndDate);
      const effectiveEnd  = overrideEnd > endDate ? endDate : overrideEnd;

      let currentDate = overrideStart < today ? new Date(today) : new Date(overrideStart);

      while (currentDate <= effectiveEnd) {
        if (currentDate.getDay() === schedule.dayOfWeek) {
          const startTime = egyptTimeToUTC(currentDate, hours, minutes);

          const dateKey = `${startTime.getUTCFullYear()}-${String(startTime.getUTCMonth()+1).padStart(2,'0')}-${String(startTime.getUTCDate()).padStart(2,'0')}T${String(startTime.getUTCHours()).padStart(2,'0')}:${String(startTime.getUTCMinutes()).padStart(2,'0')}`;
          const locKey = `${schedule.locationId}|${dateKey}`;
          const existingId = existingByLocationDate.get(locKey);

          if (existingId !== undefined) {
            overrideUpdates.push({
              id: existingId,
              data: { scheduleId: schedule.id, classTypeId: schedule.classTypeId, coachId: schedule.coachId, capacity: schedule.capacity, isCancelled: false }
            });
          } else {
            const endTime = new Date(startTime.getTime() + schedule.classType.durationMinutes * 60000);
            classesToCreate.push({
              classTypeId: schedule.classTypeId, coachId: schedule.coachId,
              locationId: schedule.locationId, scheduleId: schedule.id,
              startTime, endTime, capacity: schedule.capacity, isCancelled: false
            });
            existingByLocationDate.set(locKey, -1); // prevent double-create
          }
        }
        currentDate.setDate(currentDate.getDate() + 1);
      }
    }

    // ── Batch write ───────────────────────────────────────────────────────────
    const ops: Promise<any>[] = [];

    if (classesToCreate.length > 0) {
      ops.push(
        prisma.classInstance.createMany({ data: classesToCreate, skipDuplicates: true })
          .then(r => console.log(`Generated ${r.count} class instances`))
      );
    }

    // Run override updates in parallel (each is a single-row update)
    for (const { id, data } of overrideUpdates) {
      ops.push(prisma.classInstance.update({ where: { id }, data }));
    }

    await Promise.all(ops);
  } catch (error) {
    console.error('Error generating classes from schedules:', error);
    throw error;
  }
}





