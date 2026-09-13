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
