import { NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';
import { StatsService } from './stats.service';

describe('StatsService', () => {
  const dhikrLogModel = { aggregate: jest.fn() };
  const userModel = { findById: jest.fn() };
  const streaksService = { getByUser: jest.fn() };

  const userId = new Types.ObjectId().toHexString();

  let service: StatsService;

  function selectChain(value: unknown) {
    return {
      select: () => ({
        lean: () => ({ exec: jest.fn().mockResolvedValue(value) }),
      }),
    };
  }

  beforeEach(() => {
    dhikrLogModel.aggregate.mockReset();
    userModel.findById.mockReset();
    streaksService.getByUser.mockReset();

    dhikrLogModel.aggregate.mockReturnValue({
      exec: jest.fn().mockResolvedValue([
        {
          totals: [],
          daily: [],
          weekday: [],
          hourly: [],
          source: [],
          topDhikrs: [],
        },
      ]),
    });
    streaksService.getByUser.mockResolvedValue({
      currentStreak: 3,
      longestStreak: 5,
      totalDaysActive: 10,
      virdCurrentStreak: 1,
      virdLongestStreak: 2,
    });
    userModel.findById.mockReturnValue(selectChain({ isPremium: true }));

    service = new StatsService(
      dhikrLogModel as never,
      userModel as never,
      streaksService as never,
    );
  });

  it('getSummary geçersiz userId için NotFoundException fırlatır', async () => {
    await expect(service.getSummary('not-an-object-id')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('getSummary aggregate/streaksService.getByUser/userModel.findById paralel çağrılır ve streak alanları yansır', async () => {
    const result = await service.getSummary(userId);

    expect(dhikrLogModel.aggregate).toHaveBeenCalledTimes(1);
    expect(streaksService.getByUser).toHaveBeenCalledWith(userId);
    expect(userModel.findById).toHaveBeenCalled();
    expect(result.streak).toEqual(
      expect.objectContaining({
        currentStreak: 3,
        longestStreak: 5,
        totalDaysActive: 10,
        virdCurrentStreak: 1,
        virdLongestStreak: 2,
      }),
    );
  });

  it('aggregate boş dizi döndürürse (facet yok) boş facet ile devam eder, hata fırlatmaz', async () => {
    dhikrLogModel.aggregate.mockReturnValue({
      exec: jest.fn().mockResolvedValue([]),
    });

    await expect(service.getSummary(userId)).resolves.toBeDefined();
  });

  it('streak dokümanı yoksa (null) tüm streak alanları 0 olur', async () => {
    streaksService.getByUser.mockResolvedValue(null);

    const result = await service.getSummary(userId);

    expect(result.streak).toEqual(
      expect.objectContaining({
        currentStreak: 0,
        longestStreak: 0,
        totalDaysActive: 0,
        virdCurrentStreak: 0,
        virdLongestStreak: 0,
      }),
    );
  });

  it('kullanıcı bulunamazsa (null) premium olmayan taraf kilitli kabul edilir', async () => {
    userModel.findById.mockReturnValue(selectChain(null));

    const result = await service.getSummary(userId);

    expect(result.locked).toBe(true);
  });
});
