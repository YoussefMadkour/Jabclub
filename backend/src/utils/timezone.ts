// Egypt observes DST again (since 2023): UTC+2 in winter, UTC+3 in summer.
// Day/week window helpers below use this as a coarse default; egyptTimeToUTC()
// resolves the exact offset per-date so generated class times are always correct.
export const EGYPT_UTC_OFFSET_HOURS = 2;

/**
 * Actual Africa/Cairo UTC offset (in hours) for a given instant — 2 in winter,
 * 3 during summer DST. Uses the IANA tz database via Intl so it stays correct
 * across DST rule changes.
 */
export function egyptOffsetHours(at: Date): number {
  try {
    const name = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Africa/Cairo',
      timeZoneName: 'shortOffset',
    })
      .formatToParts(at)
      .find((p) => p.type === 'timeZoneName')?.value ?? 'GMT+2';
    const m = name.match(/([+-]\d{1,2})/);
    return m ? parseInt(m[1], 10) : EGYPT_UTC_OFFSET_HOURS;
  } catch {
    return EGYPT_UTC_OFFSET_HOURS;
  }
}

/**
 * Build a UTC Date for a given calendar date + HH:MM entered in Egypt local time,
 * accounting for DST. e.g. 18:00 local → 16:00Z in winter, 15:00Z in summer.
 */
export function egyptTimeToUTC(date: Date, hours: number, minutes: number): Date {
  // Probe with a naive UTC time to determine the correct DST offset, then apply it.
  const probe = new Date(date);
  probe.setUTCHours(hours, minutes, 0, 0);
  const offset = egyptOffsetHours(probe);
  const utc = new Date(date);
  utc.setUTCHours(hours - offset, minutes, 0, 0);
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
