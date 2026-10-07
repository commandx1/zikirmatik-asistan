import fc from 'fast-check';
import { als } from '../logging/request-context';
import {
  dateKeyInZone,
  istanbulDateKey,
  requestTimezone,
  shiftDateKey,
  startOfDayInZone,
  todayKey,
} from './date-keys';

/** Verilen x-client-timezone başlığıyla bir istek bağlamında çalıştırır. */
function withTimezone<T>(tz: string | undefined, fn: () => T): T {
  const headers = tz === undefined ? {} : { 'x-client-timezone': tz };
  return als.run({ requestId: 'test', req: { headers } as never }, fn);
}

describe('date-keys timezone helpers', () => {
  const LA_EVENING = new Date('2026-09-29T03:00:00.000Z');
  const NZ_MORNING = new Date('2026-09-28T20:30:00.000Z');

  it('computes the calendar day in an arbitrary zone', () => {
    expect(dateKeyInZone(LA_EVENING, 'America/Los_Angeles')).toBe('2026-09-28');
    expect(dateKeyInZone(NZ_MORNING, 'Pacific/Auckland')).toBe('2026-09-29');
  });

  it('todayKey follows the x-client-timezone header', () => {
    expect(
      withTimezone('America/Los_Angeles', () => todayKey(LA_EVENING)),
    ).toBe('2026-09-28');
    expect(withTimezone('Pacific/Auckland', () => todayKey(NZ_MORNING))).toBe(
      '2026-09-29',
    );
  });

  it.each([
    ['missing header', undefined],
    ['unknown zone', 'Mars/Olympus_Mons'],
    ['empty string', ''],
    ['over-long value', `Europe/${'x'.repeat(80)}`],
  ])('falls back to Istanbul for %s', (_label, tz) => {
    expect(withTimezone(tz, () => todayKey(LA_EVENING))).toBe(
      istanbulDateKey(LA_EVENING),
    );
    expect(withTimezone(tz, () => requestTimezone())).toBe('Europe/Istanbul');
  });

  it('falls back to Istanbul outside a request (cron/scripts)', () => {
    expect(requestTimezone()).toBe('Europe/Istanbul');
    expect(todayKey(NZ_MORNING)).toBe('2026-09-28');
  });

  it('startOfDayInZone returns local midnight across DST transitions', () => {
    // LA: 2026-03-08 ileri (23 saatlik gün), 2026-11-01 geri (25 saatlik gün).
    expect(startOfDayInZone('2026-03-08', 'America/Los_Angeles')).toEqual(
      new Date('2026-03-08T08:00:00.000Z'),
    );
    expect(startOfDayInZone('2026-03-09', 'America/Los_Angeles')).toEqual(
      new Date('2026-03-09T07:00:00.000Z'),
    );
    expect(startOfDayInZone('2026-11-02', 'America/Los_Angeles')).toEqual(
      new Date('2026-11-02T08:00:00.000Z'),
    );
    // Auckland: 2026-09-27 02:00'de +12 → +13.
    expect(startOfDayInZone('2026-09-27', 'Pacific/Auckland')).toEqual(
      new Date('2026-09-26T12:00:00.000Z'),
    );
    expect(startOfDayInZone('2026-09-28', 'Pacific/Auckland')).toEqual(
      new Date('2026-09-27T11:00:00.000Z'),
    );
  });

  it.each([
    'America/Los_Angeles',
    'Pacific/Auckland',
    'Europe/Istanbul',
    'America/Santiago', // DST geçişi gece yarısında
    'Australia/Lord_Howe', // 30 dakikalık DST
    'Asia/Kolkata',
  ])('startOfDayInZone is the first instant of every 2026 day in %s', (tz) => {
    for (let offset = 0; offset < 366; offset += 1) {
      const key = shiftDateKey('2026-01-01', offset);
      const start = startOfDayInZone(key, tz);
      expect(dateKeyInZone(start, tz)).toBe(key);
      expect(dateKeyInZone(new Date(start.getTime() - 1000), tz) < key).toBe(
        true,
      );
    }
  });

  it('canonicalises the zone name (Mongo $hour is case-sensitive)', () => {
    expect(withTimezone('america/los_angeles', () => requestTimezone())).toBe(
      'America/Los_Angeles',
    );
  });

  // API-TZ-03: rastgele an × bölge değişmezleri.
  it('property: dateKey(startOfDay(k)) = k ve startOfDay(k+1) > startOfDay(k)', () => {
    const zones = [
      'Europe/Istanbul',
      'Europe/Berlin',
      'America/New_York',
      'Pacific/Auckland',
      'Pacific/Kiritimati',
    ];
    fc.assert(
      fc.property(
        fc.constantFrom(...zones),
        fc.date({
          min: new Date('2020-01-01T00:00:00Z'),
          max: new Date('2035-12-31T00:00:00Z'),
          noInvalidDate: true,
        }),
        (zone, instant) => {
          const key = dateKeyInZone(instant, zone);
          const start = startOfDayInZone(key, zone);
          const next = startOfDayInZone(shiftDateKey(key, 1), zone);
          expect(dateKeyInZone(start, zone)).toBe(key);
          expect(next.getTime()).toBeGreaterThan(start.getTime());
          // an kendi günü içinde: start <= instant < next
          expect(start.getTime()).toBeLessThanOrEqual(instant.getTime());
          expect(instant.getTime()).toBeLessThan(next.getTime());
        },
      ),
      { numRuns: 300 },
    );
  });
});
