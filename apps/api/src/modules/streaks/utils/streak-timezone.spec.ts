import { Types } from 'mongoose';
import { als } from '../../../common/logging/request-context';
import { StreaksService } from '../streaks.service';

function withTimezone<T>(tz: string | undefined, fn: () => T): T {
  const headers = tz === undefined ? {} : { 'x-client-timezone': tz };
  return als.run({ requestId: 'test', req: { headers } as never }, fn);
}

// Sunucu serisi çağıranın "bugün"üyle (x-client-timezone) hesaplanır.
describe('StreaksService.recalculateForUser across timezones', () => {
  const userId = new Types.ObjectId().toHexString();
  const streakModel = { findOneAndUpdate: jest.fn() };
  const dhikrLogModel = { distinct: jest.fn() };
  const userModel = { exists: jest.fn() };

  let service: StreaksService;

  beforeEach(() => {
    jest.useFakeTimers();
    streakModel.findOneAndUpdate
      .mockReset()
      .mockImplementation((_filter: unknown, update: { $set: object }) => ({
        lean: () => ({ exec: () => Promise.resolve(update.$set) }),
      }));
    dhikrLogModel.distinct.mockReset();
    userModel.exists.mockReset().mockResolvedValue(true);
    service = new StreaksService(
      streakModel as never,
      dhikrLogModel as never,
      userModel as never,
      {} as never,
    );
  });

  afterEach(() => jest.useRealTimers());

  async function currentStreak(completed: string[], tz?: string) {
    dhikrLogModel.distinct.mockResolvedValue(completed);
    const result = (await withTimezone(tz, () =>
      service.recalculateForUser(userId),
    )) as { currentStreak: number };
    return result.currentStreak;
  }

  it('east of Istanbul: a log dated on the Auckland day counts as today', async () => {
    jest.setSystemTime(new Date('2026-09-28T20:30:00.000Z')); // İstanbul: 28'i
    expect(await currentStreak(['2026-09-29'], 'Pacific/Auckland')).toBe(1);
    // Başlıksız istek (yayındaki sürüm) eskisi gibi İstanbul'a göre.
    expect(await currentStreak(['2026-09-29'])).toBe(0);
  });

  it('west of Istanbul: the yesterday grace holds through the Los Angeles evening', async () => {
    // LA 28 Eylül 20:00; İstanbul çoktan 29'u. Son tamamlanan gün LA'da dün.
    jest.setSystemTime(new Date('2026-09-29T03:00:00.000Z'));
    const completed = ['2026-09-26', '2026-09-27'];
    expect(await currentStreak(completed, 'America/Los_Angeles')).toBe(2);
    expect(await currentStreak(completed)).toBe(0);
  });
});
