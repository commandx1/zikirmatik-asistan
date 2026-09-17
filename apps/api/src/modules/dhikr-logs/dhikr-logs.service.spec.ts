import { BadRequestException, ForbiddenException } from '@nestjs/common';
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

  const circlesService = {
    assertCanContribute: jest.fn(),
    applyProgress: jest.fn(),
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
    circlesService.assertCanContribute.mockReset().mockResolvedValue(undefined);
    circlesService.applyProgress.mockReset().mockResolvedValue(undefined);

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
      circlesService as never,
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
        circleId: { $exists: false },
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
        circleId: { $exists: false },
      });
      expect(virdFilter).toEqual({
        userId: new Types.ObjectId(userId),
        date: '2026-07-30',
        dhikrId: new Types.ObjectId(dhikrId),
        virdProgramId: new Types.ObjectId(virdProgramId),
        virdSlot: 'morning',
        virdPrayerIndex: null,
        circleId: { $exists: false },
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
        circleId: { $exists: false },
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

  describe('circle fields', () => {
    const circleId = '507f1f77bcf86cd799439055';

    function upsertCall() {
      return dhikrLogModel.findOneAndUpdate.mock.calls[0] as [
        Record<string, unknown>,
        Record<string, unknown>,
      ];
    }

    it('puts circleId in the upsert key so a circle log never overwrites a plain log', async () => {
      mockExistingLog(null);

      await service.create({
        userId,
        dhikrId,
        count: 33,
        targetCount: 33,
        date: '2026-09-17',
        circleId,
        source: 'circle',
      });

      expect(upsertCall()[0]).toEqual({
        userId: new Types.ObjectId(userId),
        date: '2026-09-17',
        dhikrId: new Types.ObjectId(dhikrId),
        virdProgramId: { $exists: false },
        circleId: new Types.ObjectId(circleId),
      });
    });

    it('checks circle membership BEFORE writing the log', async () => {
      mockExistingLog(null);
      circlesService.assertCanContribute.mockRejectedValue(
        new Error('not a member'),
      );

      await expect(
        service.create({
          userId,
          dhikrId,
          count: 33,
          targetCount: 33,
          date: '2026-09-17',
          circleId,
        }),
      ).rejects.toThrow('not a member');
      expect(dhikrLogModel.findOneAndUpdate).not.toHaveBeenCalled();
    });

    it('uses $max for the shared count so a late write can never lower the circle total', async () => {
      mockExistingLog(null);

      await service.create({
        userId,
        dhikrId,
        count: 33,
        targetCount: 33,
        date: '2026-09-17',
        circleId,
      });

      const [, update] = upsertCall();
      expect(update.$max).toEqual({ count: 33 });
      expect((update.$set as Record<string, unknown>).count).toBeUndefined();
      expect((update.$set as Record<string, unknown>).circleId).toEqual(
        new Types.ObjectId(circleId),
      );
      expect(circlesService.applyProgress).toHaveBeenCalledWith(circleId);
    });

    it('never lets a circle progress derivation failure fail the log write', async () => {
      mockExistingLog(null);
      circlesService.applyProgress.mockRejectedValue(new Error('boom'));

      await expect(
        service.create({
          userId,
          dhikrId,
          count: 33,
          targetCount: 33,
          date: '2026-09-17',
          circleId,
        }),
      ).resolves.toBeDefined();
    });

    it('rejects a log that is both a vird and a circle log', async () => {
      mockExistingLog(null);

      await expect(
        service.create({
          userId,
          dhikrId,
          count: 33,
          targetCount: 33,
          date: '2026-09-17',
          circleId,
          virdProgramId: '507f1f77bcf86cd799439099',
          virdSlot: 'morning',
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(dhikrLogModel.findOneAndUpdate).not.toHaveBeenCalled();
    });

    it('propagates an assertCanContribute rejection and never calls findOneAndUpdate', async () => {
      mockExistingLog(null);
      circlesService.assertCanContribute.mockRejectedValue(
        new ForbiddenException({ code: 'CIRCLE_NOT_MEMBER' }),
      );

      await expect(
        service.create({
          userId,
          dhikrId,
          count: 33,
          targetCount: 33,
          date: '2026-09-17',
          circleId,
        }),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(dhikrLogModel.findOneAndUpdate).not.toHaveBeenCalled();
    });

    it('calls applyProgress with the circleId hex string AFTER the write', async () => {
      mockExistingLog(null);
      const order: string[] = [];
      dhikrLogModel.findOneAndUpdate.mockReturnValue({
        lean: jest.fn().mockReturnValue({
          exec: jest.fn().mockImplementation(() => {
            order.push('write');
            return Promise.resolve({});
          }),
        }),
      });
      circlesService.applyProgress.mockImplementation(() => {
        order.push('applyProgress');
        return Promise.resolve();
      });

      await service.create({
        userId,
        dhikrId,
        count: 33,
        targetCount: 33,
        date: '2026-09-17',
        circleId,
      });

      expect(order).toEqual(['write', 'applyProgress']);
      expect(circlesService.applyProgress).toHaveBeenCalledWith(circleId);
    });

    it('never puts circleId in $setOnInsert (only in the filter and $set)', async () => {
      mockExistingLog(null);

      await service.create({
        userId,
        dhikrId,
        count: 33,
        targetCount: 33,
        date: '2026-09-17',
        circleId,
      });

      const [, update] = upsertCall();
      expect(
        (update.$setOnInsert as Record<string, unknown>).circleId,
      ).toBeUndefined();
    });

    it('keeps circleId:{$exists:false} and skips assertCanContribute/applyProgress for a plain (non-circle) create', async () => {
      mockExistingLog(null);

      await service.create({
        userId,
        dhikrId,
        count: 5,
        targetCount: 33,
        date: '2026-09-17',
      });

      expect(upsertCall()[0]).toMatchObject({ circleId: { $exists: false } });
      expect(circlesService.assertCanContribute).not.toHaveBeenCalled();
      expect(circlesService.applyProgress).not.toHaveBeenCalled();
    });

    it('passes dhikrId undefined to assertCanContribute for a custom-dhikr circle log, and propagates a mismatch rejection', async () => {
      mockExistingLog(null);
      circlesService.assertCanContribute.mockRejectedValue(
        new BadRequestException({ code: 'CIRCLE_DHIKR_MISMATCH' }),
      );

      await expect(
        service.create({
          userId,
          customDhikrId: 'custom-1',
          count: 33,
          targetCount: 33,
          date: '2026-09-17',
          circleId,
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(circlesService.assertCanContribute).toHaveBeenCalledWith(
        userId,
        circleId,
        undefined,
      );
    });

    it('rejects circle logs sent through the bulk endpoint', async () => {
      await expect(
        service.createBulk({
          items: [
            {
              userId,
              dhikrId,
              count: 33,
              targetCount: 33,
              date: '2026-09-17',
              circleId,
            },
          ],
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
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
    const circlesService = {
      assertCanContribute: jest.fn().mockResolvedValue(undefined),
      applyProgress: jest.fn().mockResolvedValue(undefined),
    };
    const service = new DhikrLogsService(
      dhikrLogModel as never,
      userModel as never,
      dhikrModel as never,
      streaksService as never,
      virdProgressService as never,
      circlesService as never,
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

/**
 * uniq_log_key yarışı. upsert yalnız unique index ile atomiktir: aynı anahtara
 * giden eşzamanlı yazımda kaybeden taraf E11000 alır ve servis aynı
 * filtre/update ile bir kez daha dener (bkz. upsertLogOnce / bulkWriteWithRetry).
 */
describe('duplicate key (E11000) retry', () => {
  const userId = '507f1f77bcf86cd799439011';
  const dhikrId = '507f1f77bcf86cd799439012';

  const duplicateKeyError = () =>
    Object.assign(new Error('E11000 duplicate key error'), {
      code: 11000,
      codeName: 'DuplicateKey',
    });

  const buildService = (dhikrLogModel: unknown) =>
    new DhikrLogsService(
      dhikrLogModel as never,
      { countDocuments: jest.fn().mockResolvedValue(1) } as never,
      { countDocuments: jest.fn().mockResolvedValue(1) } as never,
      { recalculateForUser: jest.fn().mockResolvedValue(undefined) } as never,
      { applyLogWrite: jest.fn().mockResolvedValue(undefined) } as never,
      {
        assertCanContribute: jest.fn().mockResolvedValue(undefined),
        applyProgress: jest.fn().mockResolvedValue(undefined),
      } as never,
    );

  const chain = (exec: jest.Mock) => ({
    lean: jest.fn().mockReturnValue({ exec }),
  });

  const createPayload = {
    userId,
    dhikrId,
    count: 33,
    targetCount: 33,
    date: '2026-09-17',
  };

  it('retries the upsert once with the SAME filter and update, then succeeds', async () => {
    const exec = jest
      .fn()
      .mockRejectedValueOnce(duplicateKeyError())
      .mockResolvedValueOnce({ _id: 'log1', count: 33 });
    const findOneAndUpdate = jest.fn().mockReturnValue(chain(exec));
    const dhikrLogModel = {
      findOne: jest
        .fn()
        .mockReturnValue(chain(jest.fn().mockResolvedValue(null))),
      findOneAndUpdate,
    };

    const created = await buildService(dhikrLogModel).create(createPayload);

    expect(created).toEqual({ _id: 'log1', count: 33 });
    expect(findOneAndUpdate).toHaveBeenCalledTimes(2);
    // Yeniden deneme AYNI anahtarla gider; belge artık var, update'e düşer.
    expect(findOneAndUpdate.mock.calls[1]).toEqual(
      findOneAndUpdate.mock.calls[0],
    );
  });

  it('throws when the second attempt also hits E11000', async () => {
    const exec = jest
      .fn()
      .mockRejectedValueOnce(duplicateKeyError())
      .mockRejectedValueOnce(duplicateKeyError());
    const findOneAndUpdate = jest.fn().mockReturnValue(chain(exec));
    const dhikrLogModel = {
      findOne: jest
        .fn()
        .mockReturnValue(chain(jest.fn().mockResolvedValue(null))),
      findOneAndUpdate,
    };

    await expect(
      buildService(dhikrLogModel).create(createPayload),
    ).rejects.toMatchObject({ code: 11000 });
    expect(findOneAndUpdate).toHaveBeenCalledTimes(2);
  });

  it('does not retry a non-duplicate error', async () => {
    const exec = jest.fn().mockRejectedValue(new Error('network down'));
    const findOneAndUpdate = jest.fn().mockReturnValue(chain(exec));
    const dhikrLogModel = {
      findOne: jest
        .fn()
        .mockReturnValue(chain(jest.fn().mockResolvedValue(null))),
      findOneAndUpdate,
    };

    await expect(
      buildService(dhikrLogModel).create(createPayload),
    ).rejects.toThrow('network down');
    expect(findOneAndUpdate).toHaveBeenCalledTimes(1);
  });

  it('resends only the E11000 operations of a bulk write', async () => {
    const bulkError = Object.assign(new Error('bulk write error'), {
      writeErrors: [{ index: 1, code: 11000 }],
      result: { upsertedCount: 2 },
    });
    const bulkWrite = jest
      .fn()
      .mockRejectedValueOnce(bulkError)
      .mockResolvedValueOnce({ upsertedCount: 0 });
    const dhikrLogModel = {
      bulkWrite,
      find: jest.fn().mockReturnValue(chain(jest.fn().mockResolvedValue([]))),
    };

    const items = [0, 1, 2].map((index) => ({
      userId,
      dhikrId,
      count: index + 1,
      targetCount: 33,
      date: '2026-09-17',
    }));
    const result = await buildService(dhikrLogModel).createBulk({ items });

    expect(bulkWrite).toHaveBeenCalledTimes(2);
    const [firstOps] = bulkWrite.mock.calls[0] as [unknown[]];
    const [retryOps] = bulkWrite.mock.calls[1] as [unknown[]];
    expect(firstOps).toHaveLength(3);
    // Yalnız E11000 alan op (index 1) yeniden gönderilir.
    expect(retryOps).toEqual([firstOps[1]]);
    // Dönen sayaç korunur: ilk turda yazılan 2 + tekrar turunda 0.
    expect(result.insertedCount).toBe(2);
  });

  it('rethrows a bulk write error that is not purely duplicate-key', async () => {
    const bulkError = Object.assign(new Error('bulk write error'), {
      writeErrors: [
        { index: 0, code: 11000 },
        { index: 1, code: 121 },
      ],
    });
    const bulkWrite = jest.fn().mockRejectedValue(bulkError);
    const dhikrLogModel = {
      bulkWrite,
      find: jest.fn().mockReturnValue(chain(jest.fn().mockResolvedValue([]))),
    };

    await expect(
      buildService(dhikrLogModel).createBulk({
        items: [
          { userId, dhikrId, count: 1, targetCount: 33, date: '2026-09-17' },
          { userId, dhikrId, count: 2, targetCount: 33, date: '2026-09-17' },
        ],
      }),
    ).rejects.toThrow('bulk write error');
    expect(bulkWrite).toHaveBeenCalledTimes(1);
  });
});
