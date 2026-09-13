import {
  selectWinbackCandidates,
  type WinbackDeviceInput,
} from './winback.campaign';

describe('selectWinbackCandidates', () => {
  const now = new Date('2026-06-15T07:00:00.000Z'); // 10:00 İstanbul
  const MS_PER_DAY = 24 * 60 * 60 * 1000;

  function deviceSeenDaysAgo(
    days: number,
    overrides: Partial<WinbackDeviceInput> = {},
  ): WinbackDeviceInput {
    return {
      deviceId: `device-${days}`,
      expoPushToken: 'ExponentPushToken[abc]',
      lastSeenAt: new Date(now.getTime() - days * MS_PER_DAY),
      ...overrides,
    };
  }

  it('selects a device exactly at the start of the 3-day window', () => {
    const { candidates } = selectWinbackCandidates([deviceSeenDaysAgo(3)], now);
    expect(candidates).toHaveLength(1);
    expect(candidates[0].meta).toEqual({ window: 'day3' });
  });

  it('excludes a device just under 3 days inactive', () => {
    const { candidates } = selectWinbackCandidates(
      [deviceSeenDaysAgo(2.9)],
      now,
    );
    expect(candidates).toHaveLength(0);
  });

  it('excludes a device at the 4-day boundary (half-open window)', () => {
    const { candidates } = selectWinbackCandidates([deviceSeenDaysAgo(4)], now);
    expect(candidates).toHaveLength(0);
  });

  it('excludes the 4-7 day gap between the two windows', () => {
    const { candidates } = selectWinbackCandidates([deviceSeenDaysAgo(5)], now);
    expect(candidates).toHaveLength(0);
  });

  it('selects a device in the 7-day window with the shorter template', () => {
    const { candidates } = selectWinbackCandidates(
      [deviceSeenDaysAgo(7.5)],
      now,
    );
    expect(candidates).toHaveLength(1);
    expect(candidates[0].meta).toEqual({ window: 'day7' });
  });

  it('excludes a device past the 8-day window', () => {
    const { candidates } = selectWinbackCandidates([deviceSeenDaysAgo(8)], now);
    expect(candidates).toHaveLength(0);
  });

  it('skips a device with prefs.streak === false and counts it', () => {
    const { candidates, skippedPrefs } = selectWinbackCandidates(
      [deviceSeenDaysAgo(3, { prefs: { streak: false } })],
      now,
    );
    expect(candidates).toHaveLength(0);
    expect(skippedPrefs).toBe(1);
  });

  it('includes a device when prefs is missing (default opt-in)', () => {
    const { candidates } = selectWinbackCandidates(
      [deviceSeenDaysAgo(3, { prefs: undefined })],
      now,
    );
    expect(candidates).toHaveLength(1);
  });

  it('routes the notification to the home tab', () => {
    const { candidates } = selectWinbackCandidates([deviceSeenDaysAgo(3)], now);
    expect(candidates[0].data).toEqual({ route: '/(tabs)/home' });
  });
});
