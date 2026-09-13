import { Types } from 'mongoose';
import { VirdProgressService } from './vird-progress.service';

describe('VirdProgressService', () => {
  const virdProgramModel = { findOne: jest.fn() };
  const virdDayProgressModel = { findOneAndUpdate: jest.fn(), find: jest.fn() };
  const dhikrLogModel = { find: jest.fn() };
  const streaksService = {
    recalculateVirdForUser: jest.fn(),
    getByUser: jest.fn(),
  };

  let service: VirdProgressService;
  const userId = new Types.ObjectId().toHexString();
  const programId = new Types.ObjectId().toHexString();
  const dhikrId = new Types.ObjectId();

  function mockProgramLookup(program: unknown) {
    const leanExec = {
      lean: () => ({ exec: jest.fn().mockResolvedValue(program) }),
    };
    virdProgramModel.findOne.mockReturnValue({
      ...leanExec,
      sort: () => leanExec,
    });
  }

  function mockLogs(logs: unknown[]) {
    dhikrLogModel.find.mockReturnValue({
      select: () => ({
        lean: () => ({ exec: jest.fn().mockResolvedValue(logs) }),
      }),
    });
  }

  beforeEach(() => {
    virdProgramModel.findOne.mockReset();
    virdDayProgressModel.findOneAndUpdate.mockReset();
    virdDayProgressModel.find.mockReset();
    dhikrLogModel.find.mockReset();
    streaksService.recalculateVirdForUser
      .mockReset()
      .mockResolvedValue(undefined);
    streaksService.getByUser
      .mockReset()
      .mockResolvedValue({ virdCurrentStreak: 2, virdLongestStreak: 5 });

    virdDayProgressModel.findOneAndUpdate.mockReturnValue({
      exec: jest.fn().mockResolvedValue({}),
    });

    service = new VirdProgressService(
      virdProgramModel as never,
      virdDayProgressModel as never,
      dhikrLogModel as never,
      streaksService as never,
    );
  });

  const routineProgram = {
    _id: programId,
    startDate: '2026-01-01',
    prayerSelection: [1, 2, 3, 4, 5],
    phases: [
      {
        fromDay: 1,
        toDay: null,
        slots: { morning: [{ dhikrId, target: 33 }] },
      },
    ],
  };

  describe('applyLogWrite', () => {
    it('does nothing when the program cannot be found for this user', async () => {
      mockProgramLookup(null);

      await service.applyLogWrite({
        userId,
        virdProgramId: programId,
        date: '2026-01-01',
      });

      expect(virdDayProgressModel.findOneAndUpdate).not.toHaveBeenCalled();
      expect(streaksService.recalculateVirdForUser).not.toHaveBeenCalled();
    });

    it('upserts an incomplete day and does not touch the vird streak', async () => {
      mockProgramLookup(routineProgram);
      mockLogs([{ virdSlot: 'morning', dhikrId, count: 10 }]);

      await service.applyLogWrite({
        userId,
        virdProgramId: programId,
        date: '2026-01-01',
      });

      const [, update] = virdDayProgressModel.findOneAndUpdate.mock
        .calls[0] as [
        unknown,
        {
          $set: {
            isDayComplete: boolean;
            dayIndex: number;
            completedSlots: string[];
          };
        },
      ];
      expect(update.$set.isDayComplete).toBe(false);
      expect(update.$set.dayIndex).toBe(1);
      expect(update.$set.completedSlots).toEqual([]);
      expect(streaksService.recalculateVirdForUser).not.toHaveBeenCalled();
    });

    it('upserts a complete day and recalculates the vird streak', async () => {
      mockProgramLookup(routineProgram);
      mockLogs([{ virdSlot: 'morning', dhikrId, count: 33 }]);

      await service.applyLogWrite({
        userId,
        virdProgramId: programId,
        date: '2026-01-01',
      });

      const [, update] = virdDayProgressModel.findOneAndUpdate.mock
        .calls[0] as [
        unknown,
        { $set: { isDayComplete: boolean; completedSlots: string[] } },
      ];
      expect(update.$set.isDayComplete).toBe(true);
      expect(update.$set.completedSlots).toEqual(['morning']);
      expect(streaksService.recalculateVirdForUser).toHaveBeenCalledWith(
        userId,
      );
    });
  });

  describe('getToday', () => {
    it('returns an empty/default response when there is no active program', async () => {
      mockProgramLookup(null);

      const result = await service.getToday(userId, '2026-01-01');

      expect(result).toEqual({
        program: null,
        dayIndex: 0,
        slots: {},
        isDayComplete: false,
        virdStreak: { currentStreak: 2, longestStreak: 5 },
      });
    });

    it('expands the prayer slot per prayerSelection and reports per-item completion', async () => {
      const program = {
        _id: programId,
        startDate: '2026-01-01',
        prayerSelection: [1, 4],
        phases: [
          {
            fromDay: 1,
            toDay: null,
            slots: { prayer: [{ dhikrId, target: 10 }] },
          },
        ],
      };
      mockProgramLookup(program);
      mockLogs([
        { virdSlot: 'prayer', virdPrayerIndex: 1, dhikrId, count: 10 },
      ]);

      const result = await service.getToday(userId, '2026-01-01');

      expect(result.dayIndex).toBe(1);
      expect(result.slots.prayer?.items).toHaveLength(2);
      const byPrayerIndex = new Map(
        (result.slots.prayer?.items ?? []).map(
          (item) => [item.prayerIndex, item] as const,
        ),
      );
      expect(byPrayerIndex.get(1)).toMatchObject({
        count: 10,
        completed: true,
      });
      expect(byPrayerIndex.get(4)).toMatchObject({
        count: 0,
        completed: false,
      });
      expect(result.slots.prayer?.done).toBe(false);
      expect(result.isDayComplete).toBe(false);
    });
  });

  describe('getHistory', () => {
    it('fills the requested range using isDayComplete rows, defaulting missing days to false', async () => {
      virdDayProgressModel.find.mockReturnValue({
        select: () => ({
          lean: () => ({
            exec: jest.fn().mockResolvedValue([
              { date: '2026-01-05', isDayComplete: true },
              { date: '2026-01-06', isDayComplete: false },
            ]),
          }),
        }),
      });

      const result = await service.getHistory(
        userId,
        '2026-01-01',
        '2026-01-06',
      );

      expect(result.items).toHaveLength(6);
      expect(
        result.items.find((item) => item.date === '2026-01-05')?.isDayComplete,
      ).toBe(true);
      expect(
        result.items.find((item) => item.date === '2026-01-06')?.isDayComplete,
      ).toBe(false);
      expect(
        result.items.find((item) => item.date === '2026-01-01')?.isDayComplete,
      ).toBe(false);
    });
  });
});
