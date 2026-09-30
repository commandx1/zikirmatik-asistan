import { als } from '../logging/request-context';

export const STATS_TIMEZONE = 'Europe/Istanbul';

/** Calendar day of the given instant in `timeZone`, as YYYY-MM-DD. */
export function dateKeyInZone(date: Date, timeZone: string): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

/** Local (Europe/Istanbul) calendar day for the given instant as YYYY-MM-DD. */
export function istanbulDateKey(date: Date): string {
  return dateKeyInZone(date, STATS_TIMEZONE);
}

/** IANA zone name or STATS_TIMEZONE when missing/unknown. */
export function validTimezone(value: unknown): string {
  if (typeof value !== 'string' || !value || value.length > 64) {
    return STATS_TIMEZONE;
  }
  try {
    // Kanonik ad döner ('america/los_angeles' → 'America/Los_Angeles');
    // Mongo'nun $hour timezone'u büyük/küçük harfe duyarlı.
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: value,
    }).resolvedOptions().timeZone;
  } catch {
    return STATS_TIMEZONE;
  }
}

/**
 * The caller's timezone from the `x-client-timezone` header. Falls back to
 * Istanbul when the header is missing/invalid or there is no request
 * (cron, scripts) — the published app sends no header.
 */
export function requestTimezone(): string {
  return validTimezone(als.getStore()?.req?.headers?.['x-client-timezone']);
}

/** "Today" in the caller's timezone (Istanbul outside a request). */
export function todayKey(now = new Date()): string {
  return dateKeyInZone(now, requestTimezone());
}

/**
 * The first instant of calendar day `dateKey` in `timeZone`. Uses the zone's
 * real UTC offset around that day (DST-safe) instead of adding 24h.
 */
export function startOfDayInZone(dateKey: string, timeZone: string): Date {
  const [year, month, day] = dateKey.split('-').map(Number);
  const utcMidnight = Date.UTC(year, month - 1, day);
  const first = new Date(utcMidnight - zoneOffsetMs(utcMidnight, timeZone));
  const second = new Date(
    utcMidnight - zoneOffsetMs(first.getTime(), timeZone),
  );
  // İlk tahmin o günün başka bir saatindeki offset'i kullanır; o gün DST
  // geçişi varsa ikinci aday düzeltir. Gece yarısında geçiş olan bölgelerde
  // ikisi de o güne düşebilir: en erkeni doğrudur.
  const onDay = [first, second].filter(
    (candidate) => dateKeyInZone(candidate, timeZone) === dateKey,
  );
  return onDay.length > 0 ? onDay.reduce((a, b) => (b < a ? b : a)) : second;
}

/** `timeZone`'un verilen anda UTC'den farkı (ms; doğusu pozitif). */
function zoneOffsetMs(instantMs: number, timeZone: string): number {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-US', {
      timeZone,
      hourCycle: 'h23',
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      second: 'numeric',
    })
      .formatToParts(new Date(instantMs))
      .map((part) => [part.type, Number(part.value)]),
  );
  const asUtc = Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour,
    parts.minute,
    parts.second,
  );
  return asUtc - Math.floor(instantMs / 1000) * 1000;
}

/** Shift a pure YYYY-MM-DD key by whole days (timezone independent). */
export function shiftDateKey(key: string, deltaDays: number): string {
  const [year, month, day] = key.split('-').map(Number);
  const dt = new Date(Date.UTC(year, month - 1, day));
  dt.setUTCDate(dt.getUTCDate() + deltaDays);
  return dt.toISOString().slice(0, 10);
}
