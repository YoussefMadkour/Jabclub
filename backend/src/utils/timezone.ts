// Egypt is treated as a fixed UTC+2 offset across the app (matches scheduleService).
// Centralising the conversion here so cleanup, generation, reports and notifications
// all agree on how a local Egypt time maps to the UTC values stored in the DB.
export const EGYPT_UTC_OFFSET_HOURS = 2;

/**
 * Build a UTC Date for a given calendar date + HH:MM entered in Egypt local time.
 * e.g. date=2026-03-01, hours=20, minutes=0 → 2026-03-01T18:00:00.000Z
 */
export function egyptTimeToUTC(date: Date, hours: number, minutes: number): Date {
  const utc = new Date(date);
  utc.setUTCHours(hours - EGYPT_UTC_OFFSET_HOURS, minutes, 0, 0);
  return utc;
}

/**
 * The UTC weekday (0=Sun..6=Sat) that a class scheduled at Egypt-local `dayOfWeek`/HH:MM
 * actually falls on once stored as UTC. Late-evening/early-morning Egypt classes can
 * cross the UTC date boundary, so this must be derived from a real UTC Date — never by
 * reusing the local dayOfWeek (that was the orphan-cleanup data-loss bug).
 */
export function utcWeekdayForEgyptSchedule(localDayOfWeek: number, startTime: string): number {
  const [hours, minutes] = startTime.split(':').map(Number);
  // Anchor on a known Sunday (2024-01-07 was a Sunday), advance to the local weekday,
  // then convert to UTC and read the UTC weekday.
  const anchor = new Date(Date.UTC(2024, 0, 7)); // Sunday
  anchor.setUTCDate(anchor.getUTCDate() + localDayOfWeek);
  const utc = egyptTimeToUTC(anchor, hours, minutes);
  return utc.getUTCDay();
}

/** The HH:MM (zero-padded) in UTC for an Egypt-local HH:MM. */
export function utcHHMMForEgyptTime(startTime: string): string {
  const [hours, minutes] = startTime.split(':').map(Number);
  const utc = egyptTimeToUTC(new Date(Date.UTC(2024, 0, 7)), hours, minutes);
  return `${String(utc.getUTCHours()).padStart(2, '0')}:${String(utc.getUTCMinutes()).padStart(2, '0')}`;
}

/** Start/end of an Egypt-local day, expressed as UTC Date objects, for `now`. */
export function egyptDayBoundsUTC(now: Date = new Date()): { start: Date; end: Date } {
  // Shift "now" into Egypt local wall-clock, take that calendar day, map back to UTC.
  const egyptNow = new Date(now.getTime() + EGYPT_UTC_OFFSET_HOURS * 3600_000);
  const y = egyptNow.getUTCFullYear();
  const m = egyptNow.getUTCMonth();
  const d = egyptNow.getUTCDate();
  const start = new Date(Date.UTC(y, m, d, 0 - EGYPT_UTC_OFFSET_HOURS, 0, 0, 0));
  const end = new Date(Date.UTC(y, m, d, 24 - EGYPT_UTC_OFFSET_HOURS, 0, 0, -1));
  return { start, end };
}

/** Start of the Egypt-local week (Saturday) and `weeksAhead` end bound, as UTC Dates. */
export function egyptWeekBoundsUTC(now: Date = new Date()): { start: Date; end: Date } {
  const egyptNow = new Date(now.getTime() + EGYPT_UTC_OFFSET_HOURS * 3600_000);
  // Week starts Saturday (Egypt convention used elsewhere in the app).
  const day = egyptNow.getUTCDay(); // 0=Sun..6=Sat
  const daysSinceSaturday = (day + 1) % 7;
  const y = egyptNow.getUTCFullYear();
  const m = egyptNow.getUTCMonth();
  const d = egyptNow.getUTCDate() - daysSinceSaturday;
  const start = new Date(Date.UTC(y, m, d, 0 - EGYPT_UTC_OFFSET_HOURS, 0, 0, 0));
  const end = new Date(start.getTime() + 7 * 24 * 3600_000 - 1);
  return { start, end };
}

/** Format a UTC Date for display/email in Egypt local time. */
export function formatEgyptDateTime(date: Date): { date: string; time: string } {
  return {
    date: date.toLocaleDateString('en-US', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
      timeZone: 'Africa/Cairo',
    }),
    time: date.toLocaleTimeString('en-US', {
      hour: '2-digit', minute: '2-digit', timeZone: 'Africa/Cairo',
    }),
  };
}
