import fc from 'fast-check';
import { dateKeyInZone, shiftDateKey } from '../../../common/utils/date-keys';
import {
  resolveKandilTargetDateKey,
  selectKandilCandidates,
  type KandilDeviceInput,
  type KandilSpecialDayInput,
} from './kandil.campaign';

describe('resolveKandilTargetDateKey', () => {
  const now = new Date('2026-06-15T07:00:00.000Z'); // 2026-06-15, 10:00 İstanbul

  it('resolves "eve" to tomorrow (İstanbul)', () => {
    expect(resolveKandilTargetDateKey('eve', now)).toBe('2026-06-16');
  });

  it('resolves "day" to today (İstanbul)', () => {
    expect(resolveKandilTargetDateKey('day', now)).toBe('2026-06-15');
  });

  it('rolls the month over correctly for "eve" on the last day of the month', () => {
    const endOfMonth = new Date('2026-06-30T07:00:00.000Z');
    expect(resolveKandilTargetDateKey('eve', endOfMonth)).toBe('2026-07-01');
  });
});

describe('resolveKandilTargetDateKey — cihaz saat dilimi (A-18)', () => {
  it('aynı an, farklı bölge: hedef gün cihazın yerel gününe göre', () => {
    const now = new Date('2026-10-10T18:30:00Z'); // İstanbul 21:30 10 Eki, Kiritimati 08:30 11 Eki
    expect(resolveKandilTargetDateKey('day', now, 'Europe/Istanbul')).toBe(
      '2026-10-10',
    );
    expect(resolveKandilTargetDateKey('day', now, 'Pacific/Kiritimati')).toBe(
      '2026-10-11',
    );
    expect(resolveKandilTargetDateKey('eve', now, 'Pacific/Kiritimati')).toBe(
      '2026-10-12',
    );
  });

  it('bölge yok/geçersiz → İstanbul', () => {
    const now = new Date('2026-10-10T22:30:00Z'); // İstanbul 11 Eki 01:30
    expect(resolveKandilTargetDateKey('day', now)).toBe('2026-10-11');
    expect(resolveKandilTargetDateKey('day', now, 'Not/AZone')).toBe(
      '2026-10-11',
    );
  });

  it('özellik: day = bölgenin yerel günü, eve = day + 1 (rastgele an + IANA bölge)', () => {
    const zones = [
      'Europe/Istanbul',
      'America/Los_Angeles',
      'Pacific/Kiritimati',
      'Pacific/Pago_Pago',
      'Asia/Kolkata',
      'Australia/Lord_Howe',
      'Europe/London',
    ];
    fc.assert(
      fc.property(
        fc.date({
          min: new Date('2024-01-01'),
          max: new Date('2030-12-31'),
          noInvalidDate: true,
        }),
        fc.constantFrom(...zones),
        (now, tz) => {
          const day = resolveKandilTargetDateKey('day', now, tz);
          const eve = resolveKandilTargetDateKey('eve', now, tz);
          return day === dateKeyInZone(now, tz) && eve === shiftDateKey(day, 1);
        },
      ),
    );
  });
});

describe('selectKandilCandidates', () => {
  const kandil: KandilSpecialDayInput = {
    id: '507f1f77bcf86cd799439011',
    nameTr: 'Regaib Kandili',
  };

  const device = (
    overrides: Partial<KandilDeviceInput> = {},
  ): KandilDeviceInput => ({
    deviceId: 'device-1',
    expoPushToken: 'ExponentPushToken[abc]',
    ...overrides,
  });

  it('returns candidates: 0 when there is no matching special day', () => {
    const result = selectKandilCandidates([], [device()], 'eve');
    expect(result).toEqual({ candidates: [], skippedPrefs: 0 });
  });

  it('builds an eve reminder with the special-day route', () => {
    const { candidates } = selectKandilCandidates([kandil], [device()], 'eve');
    expect(candidates).toHaveLength(1);
    expect(candidates[0]).toMatchObject({
      title: 'Regaib Kandili',
      body: 'Yarın Regaib Kandili. Hazırlık için özel gün rehberine göz at.',
      data: { route: `/special-days/${kandil.id}` },
    });
  });

  it('builds a day-of reminder with different wording than the eve reminder', () => {
    const { candidates } = selectKandilCandidates([kandil], [device()], 'day');
    expect(candidates[0].body).toBe(
      'Bugün Regaib Kandili. Gecenin faziletleri ve amelleri için rehbere dokun.',
    );
  });

  it('skips a device with prefs.specialDays === false and counts it', () => {
    const { candidates, skippedPrefs } = selectKandilCandidates(
      [kandil],
      [device({ prefs: { specialDays: false } })],
      'day',
    );
    expect(candidates).toHaveLength(0);
    expect(skippedPrefs).toBe(1);
  });

  it('fans out to every eligible device', () => {
    const { candidates } = selectKandilCandidates(
      [kandil],
      [device({ deviceId: 'd1' }), device({ deviceId: 'd2' })],
      'day',
    );
    expect(candidates.map((c) => c.deviceId)).toEqual(['d1', 'd2']);
  });
});
