import fc from 'fast-check';
import { dateKeyInZone, shiftDateKey } from '../../../common/utils/date-keys';
import {
  calculateCompletionStreak,
  effectiveStreak,
} from './streak-calculator';

const TODAY = '2026-06-26';

describe('calculateCompletionStreak', () => {
  it('returns zeros for empty list', () => {
    expect(calculateCompletionStreak([], TODAY)).toEqual({
      currentStreak: 0,
      longestStreak: 0,
    });
  });

  it('counts the current streak when today is completed', () => {
    const result = calculateCompletionStreak(
      ['2026-06-24', '2026-06-25', '2026-06-26'],
      TODAY,
    );
    expect(result.currentStreak).toBe(3);
    expect(result.longestStreak).toBe(3);
  });

  it('keeps the streak when today is not yet done but yesterday is (grace)', () => {
    const result = calculateCompletionStreak(
      ['2026-06-24', '2026-06-25'],
      TODAY,
    );
    expect(result.currentStreak).toBe(2);
  });

  it('resets current streak to 0 when last completed day is older than yesterday', () => {
    const result = calculateCompletionStreak(
      ['2026-06-20', '2026-06-21', '2026-06-22'],
      TODAY,
    );
    expect(result.currentStreak).toBe(0);
    expect(result.longestStreak).toBe(3);
  });

  it('computes the longest run across gaps independent of current', () => {
    const result = calculateCompletionStreak(
      [
        '2026-05-01',
        '2026-05-02',
        '2026-05-03',
        '2026-05-04', // longest run of 4
        '2026-06-25',
        '2026-06-26', // current run of 2 (ends today)
      ],
      TODAY,
    );
    expect(result.longestStreak).toBe(4);
    expect(result.currentStreak).toBe(2);
  });

  it('ignores duplicate dates', () => {
    const result = calculateCompletionStreak(
      ['2026-06-26', '2026-06-26', '2026-06-25'],
      TODAY,
    );
    expect(result.currentStreak).toBe(2);
    expect(result.longestStreak).toBe(2);
  });
});

describe('effectiveStreak (okuma anı değerlendirmesi, API-STR-10)', () => {
  // Gerçek gün anahtarları: rastgele bir an + rastgele bir IANA bölgesi.
  const zones = [
    'Europe/Istanbul',
    'America/Los_Angeles',
    'Pacific/Kiritimati',
    'Pacific/Niue',
    'Asia/Tokyo',
  ];
  const dayKey = fc
    .tuple(
      fc.date({
        min: new Date('2020-01-01T00:00:00Z'),
        max: new Date('2030-12-31T00:00:00Z'),
        noInvalidDate: true,
      }),
      fc.constantFrom(...zones),
    )
    .map(([d, tz]) => dateKeyInZone(d, tz));
  const stored = fc
    .record({
      currentStreak: fc.nat(500),
      extraLongest: fc.nat(500),
      totalDaysActive: fc.nat(2000),
      lastCompletedDate: dayKey,
      virdCurrentStreak: fc.nat(500),
      virdLongestStreak: fc.nat(1000),
      virdLastCompleteDate: dayKey,
    })
    .map(({ extraLongest, ...s }) => ({
      ...s,
      longestStreak: s.currentStreak + extraLongest,
    }));

  it('son tamamlanan gün dünden eskiyse (bugün ≥ son + 2) seri 0', () => {
    fc.assert(
      fc.property(stored, fc.integer({ min: 2, max: 3000 }), (s, gap) => {
        const today = shiftDateKey(s.lastCompletedDate, gap);
        expect(effectiveStreak(s, today).currentStreak).toBe(0);
      }),
    );
  });

  it('bugün veya dün (ve saat kayması: gelecek) tamamlandıysa seri aynen kalır', () => {
    fc.assert(
      fc.property(stored, fc.integer({ min: -30, max: 1 }), (s, gap) => {
        const today = shiftDateKey(s.lastCompletedDate, gap);
        expect(effectiveStreak(s, today).currentStreak).toBe(s.currentStreak);
      }),
    );
  });

  it('saklıyı asla aşmaz; longest/total/tarihler değişmez; vird bağımsız', () => {
    fc.assert(
      fc.property(stored, dayKey, (s, today) => {
        const r = effectiveStreak(s, today);
        expect(r.currentStreak).toBeLessThanOrEqual(s.currentStreak);
        expect(r.virdCurrentStreak).toBeLessThanOrEqual(s.virdCurrentStreak);
        expect(r.longestStreak).toBe(s.longestStreak);
        expect(r.virdLongestStreak).toBe(s.virdLongestStreak);
        expect(r.totalDaysActive).toBe(s.totalDaysActive);
        expect(r.lastCompletedDate).toBe(s.lastCompletedDate);
        // vird yalnız kendi tarihine bakar
        const virdAlive = s.virdLastCompleteDate >= shiftDateKey(today, -1);
        expect(r.virdCurrentStreak).toBe(virdAlive ? s.virdCurrentStreak : 0);
      }),
    );
  });

  it('calculateCompletionStreak ile tutarlı: yazımda hesaplanan seri sonraki günlerde okunur', () => {
    // Yazım anı W'de hesaplanan seri, okuma anı T'de T'ye göre yeniden
    // hesaplananla aynı olmalı (W ≤ T, aradaki günlerde yeni tamamlanma yok).
    fc.assert(
      fc.property(
        dayKey,
        fc.array(fc.integer({ min: 0, max: 20 }), { maxLength: 15 }),
        fc.nat(4),
        fc.nat(6),
        (writeDay, offsets, writeLag, readLag) => {
          const completed = offsets.map((o) =>
            shiftDateKey(writeDay, -(o + writeLag)),
          );
          const atWrite = calculateCompletionStreak(completed, writeDay);
          const readDay = shiftDateKey(writeDay, readLag);
          const lastCompletedDate = completed.slice().sort().at(-1);
          const r = effectiveStreak({ ...atWrite, lastCompletedDate }, readDay);
          expect(r.currentStreak).toBe(
            calculateCompletionStreak(completed, readDay).currentStreak,
          );
        },
      ),
    );
  });

  it('tarih yoksa (hiç tamamlanmamış) seri 0', () => {
    expect(
      effectiveStreak({ currentStreak: 0, longestStreak: 0 }, TODAY),
    ).toEqual({ currentStreak: 0, longestStreak: 0, virdCurrentStreak: 0 });
  });
});
