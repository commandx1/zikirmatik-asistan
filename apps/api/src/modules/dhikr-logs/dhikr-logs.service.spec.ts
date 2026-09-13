import { Types } from 'mongoose';
import { DhikrLogsService } from './dhikr-logs.service';

describe('DhikrLogsService.create', () => {
  const dhikrLogModel = {
    findOne: jest.fn(),
    findOneAndUpdate: jest.fn(),
  };

  const userModel = {
    countDocuments: jest.fn(),
  };

  const dhikrModel = {
    countDocuments: jest.fn(),
  };

  const streaksService = {
    recalculateForUser: jest.fn(),
  };

  const virdProgressService = {
    applyLogWrite: jest.fn(),
  };

  const userId = '507f1f77bcf86cd799439011';
  const dhikrId = '507f1f77bcf86cd799439012';

  let service: DhikrLogsService;

  const mockExistingLog = (existing: { isCompleted?: boolean } | null) => {
    dhikrLogModel.findOne.mockReturnValue({
      lean: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(existing),
      }),
    });
  };

  const savedIsCompleted = () => {
    const [, update] = dhikrLogModel.findOneAndUpdate.mock.calls[0] as [
      unknown,
      { $set: { isCompleted: boolean } },
    ];
    return update.$set.isCompleted;
  };

  beforeEach(() => {
    dhikrLogModel.findOne.mockReset();
    dhikrLogModel.findOneAndUpdate.mockReset();
    userModel.countDocuments.mockReset().mockResolvedValue(1);
    dhikrModel.countDocuments.mockReset().mockResolvedValue(1);
    streaksService.recalculateForUser.mockReset().mockResolvedValue(undefined);
    virdProgressService.applyLogWrite.mockReset().mockResolvedValue(undefined);

    dhikrLogModel.findOneAndUpdate.mockReturnValue({
      lean: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue({}),
      }),
    });

    service = new DhikrLogsService(
      dhikrLogModel as never,
      userModel as never,
      dhikrModel as never,
      streaksService as never,
      virdProgressService as never,
    );
  });

  it('stores a completed log for a first write of the day', async () => {
    mockExistingLog(null);

    await service.create({
      userId,
      dhikrId,
      count: 100,
      targetCount: 100,
      date: '2026-07-30',
      isCompleted: true,
    });

    expect(savedIsCompleted()).toBe(true);
  });

  it('keeps the day completed when a later partial session is saved', async () => {
    mockExistingLog({ isCompleted: true });

    await service.create({
      userId,
      dhikrId,
      count: 5,
      targetCount: 100,
      date: '2026-07-30',
      isCompleted: false,
    });

    // The streak for that day was already earned; a reset + partial save must
    // not revoke it.
    expect(savedIsCompleted()).toBe(true);
  });

  it('promotes an incomplete day to completed when the target is later reached', async () => {
    mockExistingLog({ isCompleted: false });

    await service.create({
      userId,
      dhikrId,
      count: 100,
      targetCount: 100,
      date: '2026-07-30',
      isCompleted: true,
    });

    expect(savedIsCompleted()).toBe(true);
  });

  it('leaves a day incomplete when neither write reached the target', async () => {
    mockExistingLog({ isCompleted: false });

    await service.create({
      userId,
      dhikrId,
      count: 12,
      targetCount: 100,
      date: '2026-07-30',
      isCompleted: false,
    });

    expect(savedIsCompleted()).toBe(false);
  });

  describe('vird fields', () => {
    const virdProgramId = '507f1f77bcf86cd799439099';

    function upsertFilter() {
      const [filter] = dhikrLogModel.findOneAndUpdate.mock.calls[0] as [
        Record<string, unknown>,
        unknown,
      ];
      return filter;
    }

    it('keeps the plain (vird-less) filter and skips vird progress when no vird fields are sent', async () => {
      mockExistingLog(null);

      await service.create({
        userId,
        dhikrId,
        count: 5,
        targetCount: 33,
        date: '2026-07-30',
      });

      // virdProgramId:{$exists:false} keeps a plain write from ever matching
      // (and overwriting) a vird-tagged document for the same user/dhikr/date
      // — see the next test.
      expect(upsertFilter()).toEqual({
        userId: new Types.ObjectId(userId),
        date: '2026-07-30',
        dhikrId: new Types.ObjectId(dhikrId),
        virdProgramId: { $exists: false },
      });
      expect(virdProgressService.applyLogWrite).not.toHaveBeenCalled();
    });

    it('uses disjoint upsert filters for a plain write and a vird-tagged write on the same day/dhikr, so they land as two separate documents', async () => {
      mockExistingLog(null);

      await service.create({
        userId,
        dhikrId,
        count: 5,
        targetCount: 33,
        date: '2026-07-30',
      });
      await service.create({
        userId,
        dhikrId,
        count: 5,
        targetCount: 33,
        date: '2026-07-30',
        virdProgramId,
        virdSlot: 'morning',
      });

      const [plainFilter] = dhikrLogModel.findOneAndUpdate.mock.calls[0] as [
        Record<string, unknown>,
        unknown,
      ];
      const [virdFilter] = dhikrLogModel.findOneAndUpdate.mock.calls[1] as [
        Record<string, unknown>,
        unknown,
      ];

      expect(plainFilter).toEqual({
        userId: new Types.ObjectId(userId),
        date: '2026-07-30',
        dhikrId: new Types.ObjectId(dhikrId),
        virdProgramId: { $exists: false },
      });
      expect(virdFilter).toEqual({
        userId: new Types.ObjectId(userId),
        date: '2026-07-30',
        dhikrId: new Types.ObjectId(dhikrId),
        virdProgramId: new Types.ObjectId(virdProgramId),
        virdSlot: 'morning',
        virdPrayerIndex: null,
      });
      // A single document can never satisfy both filters at once (one
      // requires virdProgramId to be absent, the other requires a specific
      // virdProgramId) — so the two writes can never collide into one doc.
      expect(plainFilter).not.toEqual(virdFilter);
    });

    it('adds virdProgramId/virdSlot/virdPrayerIndex to the upsert key so the same dhikr in a different slot is a separate document', async () => {
      mockExistingLog(null);

      await service.create({
        userId,
        dhikrId,
        count: 5,
        targetCount: 33,
        date: '2026-07-30',
        virdProgramId,
        virdSlot: 'morning',
      });

      expect(upsertFilter()).toEqual({
        userId: new Types.ObjectId(userId),
        date: '2026-07-30',
        dhikrId: new Types.ObjectId(dhikrId),
        virdProgramId: new Types.ObjectId(virdProgramId),
        virdSlot: 'morning',
        virdPrayerIndex: null,
      });
    });

    it('triggers a best-effort vird progress derivation for the written program/date', async () => {
      mockExistingLog(null);

      await service.create({
        userId,
        dhikrId,
        count: 5,
        targetCount: 33,
        date: '2026-07-30',
        virdProgramId,
        virdSlot: 'prayer',
        virdPrayerIndex: 2,
      });

      expect(virdProgressService.applyLogWrite).toHaveBeenCalledWith({
        userId,
        virdProgramId,
        date: '2026-07-30',
      });
    });

    it('never lets a vird progress derivation failure fail the log write', async () => {
      mockExistingLog(null);
      virdProgressService.applyLogWrite.mockRejectedValue(new Error('boom'));

      await expect(
        service.create({
          userId,
          dhikrId,
          count: 5,
          targetCount: 33,
          date: '2026-07-30',
          virdProgramId,
          virdSlot: 'evening',
        }),
      ).resolves.toBeDefined();
    });
  });
});

describe('vird upsert operator safety', () => {
  it('does not put vird fields in both $set and $setOnInsert (MongoDB conflict)', async () => {
    const findOneAndUpdate = jest.fn().mockReturnValue({
      lean: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue({ _id: 'log1' }),
      }),
    });
    const dhikrLogModel = {
      findOne: jest.fn().mockReturnValue({
        lean: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(null),
        }),
      }),
      findOneAndUpdate,
    };
    const userModel = { countDocuments: jest.fn().mockResolvedValue(1) };
    const dhikrModel = { countDocuments: jest.fn().mockResolvedValue(1) };
    const streaksService = {
      recalculateForUser: jest.fn().mockResolvedValue(undefined),
    };
    const virdProgressService = {
      applyLogWrite: jest.fn().mockResolvedValue(undefined),
    };
    const service = new DhikrLogsService(
      dhikrLogModel as never,
      userModel as never,
      dhikrModel as never,
      streaksService as never,
      virdProgressService as never,
    );

    await service.create({
      userId: '6a5a1b24b296d78de0b4e74a',
      dhikrId: '6aa56aabf99ceba173278657',
      count: 40,
      targetCount: 40,
      date: '2026-09-13',
      isCompleted: true,
      virdProgramId: '6aa6686143c70877fe3c66b4',
      virdSlot: 'morning',
      virdDayIndex: 1,
    } as never);

    expect(findOneAndUpdate).toHaveBeenCalledTimes(1);
    const [, update] = findOneAndUpdate.mock.calls[0] as [
      unknown,
      { $set: Record<string, unknown>; $setOnInsert: Record<string, unknown> },
    ];
    const overlap = Object.keys(update.$set).filter(
      (key) => key in update.$setOnInsert,
    );
    expect(overlap).toEqual([]);
    expect(update.$set.virdSlot).toBe('morning');
    expect(update.$set.virdPrayerIndex).toBeNull();
    expect(virdProgressService.applyLogWrite).toHaveBeenCalledTimes(1);
  });
});
