import { NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';
import { StreaksService } from './streaks.service';

describe('StreaksService', () => {
  const streakModel = { findOne: jest.fn(), findOneAndUpdate: jest.fn() };
  const dhikrLogModel = { exists: jest.fn(), distinct: jest.fn() };
  const userModel = { exists: jest.fn(), find: jest.fn() };
  const virdDayProgressModel = { distinct: jest.fn() };

  const userId = new Types.ObjectId().toHexString();

  let service: StreaksService;

  function leanExec(value: unknown) {
    return { lean: () => ({ exec: jest.fn().mockResolvedValue(value) }) };
  }

  beforeEach(() => {
    Object.values(streakModel).forEach((fn) => fn.mockReset());
    Object.values(dhikrLogModel).forEach((fn) => fn.mockReset());
    Object.values(userModel).forEach((fn) => fn.mockReset());
    Object.values(virdDayProgressModel).forEach((fn) => fn.mockReset());

    service = new StreaksService(
      streakModel as never,
      dhikrLogModel as never,
      userModel as never,
      virdDayProgressModel as never,
    );
  });

  describe('getByUser', () => {
    it('geçersiz userId için NotFoundException fırlatır', async () => {
      await expect(service.getByUser('not-an-object-id')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('mevcut streak dokümanı varsa doğrudan döner', async () => {
      streakModel.findOne.mockReturnValue(
        leanExec({ userId, currentStreak: 4 }),
      );

      const result = await service.getByUser(userId);

      expect(result).toEqual({ userId, currentStreak: 4 });
    });

    it('doküman yok ama log varsa lazy backfill (recalculateForUser) tetiklenir', async () => {
      streakModel.findOne.mockReturnValue(leanExec(null));
      dhikrLogModel.exists.mockResolvedValue(true);
      userModel.exists.mockResolvedValue(true);
      dhikrLogModel.distinct
        .mockResolvedValueOnce(['2026-01-01', '2026-01-02'])
        .mockResolvedValueOnce(['2026-01-02']);
      streakModel.findOneAndUpdate.mockReturnValue(
        leanExec({
          userId,
          currentStreak: 1,
          longestStreak: 1,
          totalDaysActive: 2,
        }),
      );

      const result = await service.getByUser(userId);

      expect(streakModel.findOneAndUpdate).toHaveBeenCalled();
      expect(result).toEqual(expect.objectContaining({ totalDaysActive: 2 }));
    });

    it('doküman yok ve log da yoksa sıfırlanmış varsayılan döner', async () => {
      streakModel.findOne.mockReturnValue(leanExec(null));
      dhikrLogModel.exists.mockResolvedValue(false);

      const result = await service.getByUser(userId);

      expect(result).toEqual({
        userId,
        currentStreak: 0,
        longestStreak: 0,
        totalDaysActive: 0,
        virdCurrentStreak: 0,
        virdLongestStreak: 0,
      });
      expect(streakModel.findOneAndUpdate).not.toHaveBeenCalled();
    });
  });

  describe('recalculateForUser', () => {
    it('kullanıcı yoksa NotFoundException fırlatır', async () => {
      userModel.exists.mockResolvedValue(false);

      await expect(service.recalculateForUser(userId)).rejects.toThrow(
        NotFoundException,
      );
    });

    it("allDates/completedDates'ten streak hesaplayıp upsert eder", async () => {
      userModel.exists.mockResolvedValue(true);
      dhikrLogModel.distinct
        .mockResolvedValueOnce(['2026-01-01', '2026-01-02'])
        .mockResolvedValueOnce(['2026-01-01']);
      streakModel.findOneAndUpdate.mockReturnValue(
        leanExec({ userId, totalDaysActive: 2 }),
      );

      const result = await service.recalculateForUser(userId);

      const [filter, update, options] = streakModel.findOneAndUpdate.mock
        .calls[0] as [
        { userId: Types.ObjectId },
        { $set: { totalDaysActive: number } },
        { upsert: boolean; returnDocument: string },
      ];
      expect(filter.userId).toBeInstanceOf(Types.ObjectId);
      expect(update.$set.totalDaysActive).toBe(2);
      expect(options).toEqual({ upsert: true, returnDocument: 'after' });
      expect(result).toEqual({ userId, totalDaysActive: 2 });
    });
  });

  describe('recalculateVirdForUser', () => {
    it('virdDayProgressModel.distinct sonuçlarından vird streak alanlarını set eder', async () => {
      userModel.exists.mockResolvedValue(true);
      virdDayProgressModel.distinct.mockResolvedValue(['2026-01-01']);
      streakModel.findOneAndUpdate.mockReturnValue(
        leanExec({ userId, virdCurrentStreak: 1 }),
      );

      const result = await service.recalculateVirdForUser(userId);

      expect(virdDayProgressModel.distinct).toHaveBeenCalledWith('date', {
        userId: expect.any(Types.ObjectId) as Types.ObjectId,
        isDayComplete: true,
      });
      expect(result).toEqual({ userId, virdCurrentStreak: 1 });
    });
  });

  describe('recalculateAll', () => {
    it('tüm kullanıcılar için recalculateForUser çağırır ve özet döner', async () => {
      const id1 = new Types.ObjectId();
      const id2 = new Types.ObjectId();
      userModel.find.mockReturnValue(leanExec([{ _id: id1 }, { _id: id2 }]));
      userModel.exists.mockResolvedValue(true);
      dhikrLogModel.distinct.mockResolvedValue([]);
      streakModel.findOneAndUpdate.mockReturnValue(leanExec({ ok: true }));

      const result = await service.recalculateAll();

      expect(result.processedUserCount).toBe(2);
      expect(result.items).toHaveLength(2);
    });
  });
});
