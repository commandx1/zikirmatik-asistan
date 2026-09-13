import {
  lastIstanbulWeekRange,
  selectWeeklySummaryCandidates,
  type WeeklySummaryDeviceInput,
  type WeeklySummaryUserStat,
} from './weekly-summary.campaign';

describe('lastIstanbulWeekRange', () => {
  it('resolves last Monday-Sunday for a Monday morning run', () => {
    const now = new Date('2026-06-15T07:00:00.000Z'); // Pazartesi, 10:00 İstanbul
    expect(lastIstanbulWeekRange(now)).toEqual({
      startKey: '2026-06-08',
      endKey: '2026-06-14',
    });
  });

  it('uses the İstanbul calendar day, not the UTC day, near midnight', () => {
    // UTC tarafı hâlâ Pazar (2026-06-14) ama İstanbul'da zaten Pazartesi
    // (2026-06-15) 01:00 — sonuç UTC'ye göre değil İstanbul'a göre hesaplanmalı.
    const now = new Date('2026-06-14T22:00:00.000Z');
    expect(lastIstanbulWeekRange(now)).toEqual({
      startKey: '2026-06-08',
      endKey: '2026-06-14',
    });
  });

  it('resolves the same last week regardless of which day this week the job runs', () => {
    const sunday = new Date('2026-06-21T12:00:00.000Z'); // Pazar, İstanbul
    expect(lastIstanbulWeekRange(sunday)).toEqual({
      startKey: '2026-06-08',
      endKey: '2026-06-14',
    });
  });
});

describe('selectWeeklySummaryCandidates', () => {
  const device = (
    overrides: Partial<WeeklySummaryDeviceInput> = {},
  ): WeeklySummaryDeviceInput => ({
    deviceId: 'device-1',
    expoPushToken: 'ExponentPushToken[abc]',
    userId: 'user-1',
    ...overrides,
  });

  const stat = (
    overrides: Partial<WeeklySummaryUserStat> = {},
  ): WeeklySummaryUserStat => ({
    userId: 'user-1',
    totalCount: 120,
    activeDays: 5,
    isPremium: false,
    ...overrides,
  });

  it('uses the premium template (count + active days) for a premium user', () => {
    const { candidates } = selectWeeklySummaryCandidates(
      [stat({ isPremium: true, totalCount: 120, activeDays: 5 })],
      [device()],
    );
    expect(candidates).toHaveLength(1);
    expect(candidates[0].body).toBe(
      'Geçen hafta 120 zikir, 5 aktif gün. Böyle devam!',
    );
  });

  it('uses the free template (count only, premium upsell) for a free user', () => {
    const { candidates } = selectWeeklySummaryCandidates(
      [stat({ isPremium: false, totalCount: 42 })],
      [device()],
    );
    expect(candidates[0].body).toBe(
      "Geçen hafta 42 zikir. Detaylı haftalık raporun Premium'da.",
    );
  });

  it('routes the notification to the stats tab', () => {
    const { candidates } = selectWeeklySummaryCandidates([stat()], [device()]);
    expect(candidates[0].data).toEqual({ route: '/(tabs)/stats' });
  });

  it('fans out to every device belonging to the user (dedupe stays device-based)', () => {
    const { candidates } = selectWeeklySummaryCandidates(
      [stat()],
      [device({ deviceId: 'd1' }), device({ deviceId: 'd2' })],
    );
    expect(candidates.map((c) => c.deviceId).sort()).toEqual(['d1', 'd2']);
  });

  it('skips a user with zero activity (defensive; aggregation already excludes them)', () => {
    const { candidates } = selectWeeklySummaryCandidates(
      [stat({ totalCount: 0 })],
      [device()],
    );
    expect(candidates).toHaveLength(0);
  });

  it('produces no candidates for a user with no registered devices', () => {
    const { candidates } = selectWeeklySummaryCandidates([stat()], []);
    expect(candidates).toHaveLength(0);
  });

  it('never reports a prefs skip (weekly-summary has no prefs gate)', () => {
    const { skippedPrefs } = selectWeeklySummaryCandidates(
      [stat()],
      [device()],
    );
    expect(skippedPrefs).toBe(0);
  });
});
