export const STATS_TIMEZONE = 'Europe/Istanbul';

/** Local (Europe/Istanbul) calendar day for the given instant as YYYY-MM-DD. */
export function istanbulDateKey(date: Date): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: STATS_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

/** Shift a pure YYYY-MM-DD key by whole days (timezone independent). */
export function shiftDateKey(key: string, deltaDays: number): string {
  const [year, month, day] = key.split('-').map(Number);
  const dt = new Date(Date.UTC(year, month - 1, day));
  dt.setUTCDate(dt.getUTCDate() + deltaDays);
  return dt.toISOString().slice(0, 10);
}
