import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Types } from 'mongoose';
import { istanbulDateKey, shiftDateKey } from '../../common/utils/date-keys';
import { CirclesService } from './circles.service';
import {
  CIRCLE_CODE_ALPHABET,
  CIRCLE_CODE_LENGTH,
  CIRCLE_ERROR_CODE,
  CIRCLE_MAX_MEMBERS,
  generateCircleCode,
} from './circles.constants';

/** vird-programs.service.spec.ts'teki captureForbidden ile aynı desen. */
async function captureNotFound(
  promise: Promise<unknown>,
): Promise<{ code?: string; message?: string }> {
  try {
    await promise;
  } catch (error) {
    if (error instanceof NotFoundException) {
      return error.getResponse() as { code?: string; message?: string };
    }
    throw error;
  }
  throw new Error(
    'Promise beklenildiği gibi reddedilmedi (NotFoundException).',
  );
}

type ErrorPayload = { code?: string; message?: string };

/** vird-programs.service.spec.ts'teki captureForbidden ile aynı desen. */
async function captureForbidden(
  promise: Promise<unknown>,
): Promise<ErrorPayload> {
  try {
    await promise;
  } catch (error) {
    if (error instanceof ForbiddenException) {
      return error.getResponse() as ErrorPayload;
    }
    throw error;
  }
  throw new Error(
    'Promise beklenildiği gibi reddedilmedi (ForbiddenException).',
  );
}

type Chain = {
  select: () => Chain;
  lean: () => Chain;
  sort: () => Chain;
  exec: jest.Mock;
};

/** Mongoose zincirini (select/lean/sort/exec) taklit eder. */
function chain(value: unknown): Chain {
  const node: Chain = {
    select: () => node,
    lean: () => node,
    sort: () => node,
    exec: jest.fn().mockResolvedValue(value),
  };
  return node;
}

describe('CirclesService', () => {
  const circleModel = {
    create: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    findById: jest.fn(),
    findOneAndUpdate: jest.fn(),
    updateOne: jest.fn(),
    updateMany: jest.fn(),
    countDocuments: jest.fn(),
  };
  const dhikrLogModel = {
    aggregate: jest.fn(),
    findOne: jest.fn(),
    distinct: jest.fn(),
  };
  const userModel = { find: jest.fn(), findById: jest.fn() };
  const dhikrModel = { find: jest.fn(), findById: jest.fn() };
  const devicesService = { findActiveByUserIds: jest.fn() };
  const pushSender = { sendToDevices: jest.fn() };

  const userObjectId = new Types.ObjectId();
  const creatorObjectId = new Types.ObjectId();
  const circleObjectId = new Types.ObjectId();
  const dhikrObjectId = new Types.ObjectId();
  const userId = userObjectId.toHexString();

  let service: CirclesService;

  function mockPremium(isPremium: boolean) {
    userModel.findById.mockReturnValue(chain({ isPremium }));
  }

  function activeCircle(overrides: Record<string, unknown> = {}) {
    return {
      _id: circleObjectId,
      name: 'Salavat Halkası',
      dhikrId: dhikrObjectId,
      goalCount: 1000,
      creatorId: creatorObjectId,
      code: 'ABCDEFGH',
      memberIds: [creatorObjectId],
      totalCount: 0,
      status: 'active',
      ...overrides,
    };
  }

  beforeEach(() => {
    Object.values(circleModel).forEach((fn) => fn.mockReset());
    dhikrLogModel.aggregate.mockReset().mockReturnValue(chain([]));
    dhikrLogModel.findOne.mockReset().mockReturnValue(chain(null));
    dhikrLogModel.distinct.mockReset().mockResolvedValue([]);
    userModel.find.mockReset().mockReturnValue(chain([]));
    userModel.findById.mockReset().mockReturnValue(chain(null));
    dhikrModel.find.mockReset().mockReturnValue(chain([]));
    dhikrModel.findById
      .mockReset()
      .mockReturnValue(
        chain({ _id: dhikrObjectId, name: { tr: 'Salavat', en: 'Salawat' } }),
      );
    devicesService.findActiveByUserIds
      .mockReset()
      .mockResolvedValue([
        { deviceId: 'd1', expoPushToken: 'ExponentPushToken[abc]' },
      ]);
    pushSender.sendToDevices.mockReset().mockResolvedValue({ sentCount: 1 });
    circleModel.updateOne.mockReturnValue(chain(undefined));
    circleModel.updateMany.mockReturnValue(chain(undefined));

    service = new CirclesService(
      circleModel as never,
      dhikrLogModel as never,
      userModel as never,
      dhikrModel as never,
      devicesService as never,
      pushSender as never,
    );
  });

  describe('create', () => {
    it('rejects a non-premium user', async () => {
      mockPremium(false);

      await expect(
        captureForbidden(
          service.create(userId, {
            dhikrId: dhikrObjectId.toHexString(),
            goalCount: 1000,
          }),
        ),
      ).resolves.toMatchObject({
        code: CIRCLE_ERROR_CODE.PREMIUM_REQUIRED,
      });
      expect(circleModel.create).not.toHaveBeenCalled();
    });

    it('rejects an eleventh active circle', async () => {
      mockPremium(true);
      circleModel.countDocuments.mockResolvedValue(10);

      await expect(
        captureForbidden(
          service.create(userId, {
            dhikrId: dhikrObjectId.toHexString(),
            goalCount: 1000,
          }),
        ),
      ).resolves.toMatchObject({ code: CIRCLE_ERROR_CODE.MAX_ACTIVE });
      expect(circleModel.create).not.toHaveBeenCalled();
    });

    it('falls back to the dhikr name and seeds the creator as the first member', async () => {
      mockPremium(true);
      circleModel.countDocuments.mockResolvedValue(0);
      circleModel.create.mockImplementation((doc: Record<string, unknown>) => ({
        toObject: () => ({ _id: circleObjectId, ...doc }),
      }));

      const summary = await service.create(userId, {
        dhikrId: dhikrObjectId.toHexString(),
        goalCount: 1000,
      });

      expect(summary.name).toBe('Salavat');
      expect(summary.memberCount).toBe(1);
      expect(summary.isCreator).toBe(true);
      expect(summary.code).toHaveLength(CIRCLE_CODE_LENGTH);
    });

    it('rejects an unknown dhikr', async () => {
      mockPremium(true);
      dhikrModel.findById.mockReturnValue(chain(null));

      await expect(
        service.create(userId, {
          dhikrId: dhikrObjectId.toHexString(),
          goalCount: 1000,
        }),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(circleModel.create).not.toHaveBeenCalled();
    });

    it('rejects an inactive dhikr', async () => {
      mockPremium(true);
      dhikrModel.findById.mockReturnValue(
        chain({ _id: dhikrObjectId, name: { tr: 'Salavat' }, isActive: false }),
      );

      await expect(
        service.create(userId, {
          dhikrId: dhikrObjectId.toHexString(),
          goalCount: 1000,
        }),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(circleModel.create).not.toHaveBeenCalled();
    });

    it('rejects an endDate before today', async () => {
      mockPremium(true);
      circleModel.countDocuments.mockResolvedValue(0);
      const yesterday = shiftDateKey(istanbulDateKey(new Date()), -1);

      await expect(
        service.create(userId, {
          dhikrId: dhikrObjectId.toHexString(),
          goalCount: 1000,
          endDate: yesterday,
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(circleModel.create).not.toHaveBeenCalled();
    });

    it('accepts an endDate of today', async () => {
      mockPremium(true);
      circleModel.countDocuments.mockResolvedValue(0);
      circleModel.create.mockImplementation((doc: Record<string, unknown>) => ({
        toObject: () => ({ _id: circleObjectId, ...doc }),
      }));
      const today = istanbulDateKey(new Date());

      const summary = await service.create(userId, {
        dhikrId: dhikrObjectId.toHexString(),
        goalCount: 1000,
        endDate: today,
      });

      expect(summary.endDate).toBe(today);
    });

    it('trims an explicit name with surrounding whitespace', async () => {
      mockPremium(true);
      circleModel.countDocuments.mockResolvedValue(0);
      circleModel.create.mockImplementation((doc: Record<string, unknown>) => ({
        toObject: () => ({ _id: circleObjectId, ...doc }),
      }));

      const summary = await service.create(userId, {
        dhikrId: dhikrObjectId.toHexString(),
        goalCount: 1000,
        name: '  Benim Halkam  ',
      });

      expect(summary.name).toBe('Benim Halkam');
      const [createdDoc] = circleModel.create.mock.calls[0] as [
        Record<string, unknown>,
      ];
      expect(createdDoc.name).toBe('Benim Halkam');
    });

    it('uses a plain-string dhikr name as-is (not {tr,en})', async () => {
      mockPremium(true);
      circleModel.countDocuments.mockResolvedValue(0);
      dhikrModel.findById.mockReturnValue(
        chain({ _id: dhikrObjectId, name: 'PlainName' }),
      );
      circleModel.create.mockImplementation((doc: Record<string, unknown>) => ({
        toObject: () => ({ _id: circleObjectId, ...doc }),
      }));

      const summary = await service.create(userId, {
        dhikrId: dhikrObjectId.toHexString(),
        goalCount: 1000,
      });

      expect(summary.name).toBe('PlainName');
    });

    it('retries with a new code on a duplicate-key error and succeeds', async () => {
      mockPremium(true);
      circleModel.countDocuments.mockResolvedValue(0);
      circleModel.create
        .mockRejectedValueOnce({ code: 11000 })
        .mockImplementationOnce((doc: Record<string, unknown>) => ({
          toObject: () => ({ _id: circleObjectId, ...doc }),
        }));

      const summary = await service.create(userId, {
        dhikrId: dhikrObjectId.toHexString(),
        goalCount: 1000,
      });

      expect(circleModel.create).toHaveBeenCalledTimes(2);
      expect(summary.code).toMatch(/^[A-HJ-NP-Z2-9]{8}$/);
    });

    it('gives up after repeated duplicate-key errors instead of looping forever', async () => {
      mockPremium(true);
      circleModel.countDocuments.mockResolvedValue(0);
      circleModel.create.mockRejectedValue({ code: 11000 });

      await expect(
        service.create(userId, {
          dhikrId: dhikrObjectId.toHexString(),
          goalCount: 1000,
        }),
      ).rejects.toThrow();
      expect(circleModel.create).toHaveBeenCalledTimes(3);
    });

    it('returns a fully-shaped summary for the creator', async () => {
      mockPremium(true);
      circleModel.countDocuments.mockResolvedValue(0);
      circleModel.create.mockImplementation((doc: Record<string, unknown>) => ({
        toObject: () => ({ _id: circleObjectId, status: 'active', ...doc }),
      }));

      const summary = await service.create(userId, {
        dhikrId: dhikrObjectId.toHexString(),
        goalCount: 1000,
      });

      expect(summary.isCreator).toBe(true);
      expect(summary.memberCount).toBe(1);
      expect(summary.myTotal).toBe(0);
      expect(summary.status).toBe('active');
      expect(summary.code).toMatch(/^[A-HJ-NP-Z2-9]{8}$/);
    });
  });

  describe('findMine', () => {
    function findChain(value: unknown) {
      const node = {
        sort: jest.fn(),
        lean: () => node,
        exec: jest.fn().mockResolvedValue(value),
      };
      node.sort.mockReturnValue(node);
      return node;
    }

    it('runs the lazy-expiry updateMany BEFORE reading the circles', async () => {
      circleModel.find.mockReturnValue(findChain([]));

      await service.findMine(userId);

      const today = istanbulDateKey(new Date());
      expect(circleModel.updateMany).toHaveBeenCalledWith(
        {
          memberIds: userObjectId,
          status: 'active',
          endDate: { $lt: today },
        },
        { $set: { status: 'closed' } },
      );
      const updateManyOrder =
        circleModel.updateMany.mock.invocationCallOrder[0];
      const findOrder = circleModel.find.mock.invocationCallOrder[0];
      expect(updateManyOrder).toBeLessThan(findOrder);
    });

    it('returns [] when the user has no circles (no aggregate call)', async () => {
      circleModel.find.mockReturnValue(findChain([]));

      const result = await service.findMine(userId);

      expect(result).toEqual([]);
      expect(dhikrLogModel.aggregate).not.toHaveBeenCalled();
    });

    it('maps myTotal per circle and defaults to 0 for circles without an aggregate row, and reports isCreator per circle', async () => {
      const otherCircleId = new Types.ObjectId();
      const circles = [
        activeCircle({ creatorId: userObjectId }),
        activeCircle({
          _id: otherCircleId,
          creatorId: creatorObjectId,
          memberIds: [creatorObjectId, userObjectId],
        }),
      ];
      circleModel.find.mockReturnValue(findChain(circles));
      dhikrLogModel.aggregate.mockReturnValue(
        chain([{ _id: circleObjectId, total: 42 }]),
      );
      dhikrModel.find.mockReturnValue(
        chain([{ _id: dhikrObjectId, name: { tr: 'Salavat' } }]),
      );

      const [mine, other] = await service.findMine(userId);

      expect(mine.myTotal).toBe(42);
      expect(mine.isCreator).toBe(true);
      expect(other.myTotal).toBe(0);
      expect(other.isCreator).toBe(false);
    });

    it('sorts circles by createdAt descending', async () => {
      const node = findChain([]);
      circleModel.find.mockReturnValue(node);

      await service.findMine(userId);

      expect(node.sort).toHaveBeenCalledWith({ createdAt: -1 });
    });
  });

  describe('findOne', () => {
    it('rejects a non-member with CIRCLE_NOT_FOUND', async () => {
      circleModel.findOne.mockReturnValue(chain(null));

      await expect(
        captureNotFound(service.findOne(userId, circleObjectId.toHexString())),
      ).resolves.toMatchObject({ code: CIRCLE_ERROR_CODE.NOT_FOUND });
    });

    it('builds the member list from userModel.find({_id:{$in: memberIds}}) with only displayName', async () => {
      circleModel.findOne.mockReturnValue(activeCircleFindOneChain());
      userModel.find.mockReturnValue(
        chain([
          { _id: creatorObjectId, displayName: 'Ahmet' },
          { _id: userObjectId, displayName: 'Mehmet' },
        ]),
      );

      const detail = await service.findOne(
        userId,
        circleObjectId.toHexString(),
      );

      expect(userModel.find).toHaveBeenCalledWith({
        _id: { $in: [creatorObjectId] },
      });
      expect(detail.members).toEqual([
        { displayName: 'Ahmet', activeToday: false },
        { displayName: 'Mehmet', activeToday: false },
      ]);
    });

    it('flags members with a today log (count>0) as activeToday and counts only current members', async () => {
      const leftMemberObjectId = new Types.ObjectId();
      circleModel.findOne.mockReturnValue(
        chain(
          activeCircle({
            memberIds: [creatorObjectId, userObjectId, leftMemberObjectId],
          }),
        ),
      );
      userModel.find.mockReturnValue(
        chain([
          { _id: creatorObjectId, displayName: 'Ahmet' },
          { _id: userObjectId, displayName: 'Mehmet' },
          { _id: leftMemberObjectId, displayName: 'Ayrılan' },
        ]),
      );
      // Ayrılmış bir üyenin (memberIds dışında) o günkü logu da distinct'e
      // dahil olabilir; sayım yalnız mevcut memberIds üzerinden yapılmalı.
      const departedNonMemberObjectId = new Types.ObjectId();
      dhikrLogModel.distinct.mockResolvedValue([
        creatorObjectId,
        userObjectId,
        departedNonMemberObjectId,
      ]);

      const detail = await service.findOne(
        userId,
        circleObjectId.toHexString(),
      );

      expect(detail.members).toEqual([
        { displayName: 'Ahmet', activeToday: true },
        { displayName: 'Mehmet', activeToday: true },
        { displayName: 'Ayrılan', activeToday: false },
      ]);
      expect(detail.activeTodayCount).toBe(2);
      expect(JSON.stringify(detail.members)).not.toMatch(/count/i);
    });

    it('reports myTodayCount 0 when there is no log for today', async () => {
      circleModel.findOne.mockReturnValue(activeCircleFindOneChain());
      dhikrLogModel.findOne.mockReturnValue(chain(null));

      const detail = await service.findOne(
        userId,
        circleObjectId.toHexString(),
      );

      expect(detail.myTodayCount).toBe(0);
    });

    it('reports myTodayCount equal to the log count when present', async () => {
      circleModel.findOne.mockReturnValue(activeCircleFindOneChain());
      dhikrLogModel.findOne.mockReturnValue(chain({ count: 17 }));

      const detail = await service.findOne(
        userId,
        circleObjectId.toHexString(),
      );

      expect(detail.myTodayCount).toBe(17);
    });

    it('reads the log with the given date when provided', async () => {
      circleModel.findOne.mockReturnValue(activeCircleFindOneChain());
      dhikrLogModel.findOne.mockReturnValue(chain({ count: 7 }));

      await service.findOne(userId, circleObjectId.toHexString(), '2026-09-10');

      expect(dhikrLogModel.findOne).toHaveBeenCalledWith(
        expect.objectContaining({ date: '2026-09-10' }),
      );
    });

    it('falls back to the Istanbul day when no date is given', async () => {
      circleModel.findOne.mockReturnValue(activeCircleFindOneChain());
      dhikrLogModel.findOne.mockReturnValue(chain(null));

      await service.findOne(userId, circleObjectId.toHexString());

      expect(dhikrLogModel.findOne).toHaveBeenCalledWith(
        expect.objectContaining({ date: istanbulDateKey(new Date()) }),
      );
    });

    it('rejects a malformed date with BadRequestException', async () => {
      await expect(
        service.findOne(userId, circleObjectId.toHexString(), '10-09-2026'),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(circleModel.findOne).not.toHaveBeenCalled();
    });

    function activeCircleFindOneChain() {
      return chain(activeCircle({ memberIds: [creatorObjectId] }));
    }
  });

  describe('preview', () => {
    it('rejects an unknown code', async () => {
      circleModel.findOne.mockReturnValue(chain(null));

      await expect(
        captureNotFound(service.preview('ABCDEFGH')),
      ).resolves.toMatchObject({ code: CIRCLE_ERROR_CODE.NOT_FOUND });
    });

    it('normalizes the code (trim + separators + uppercase) before querying', async () => {
      circleModel.findOne.mockReturnValue(chain(activeCircle()));

      await service.preview('  abcd-ef gh  ');

      expect(circleModel.findOne).toHaveBeenCalledWith({ code: 'ABCDEFGH' });
    });

    it('never returns memberIds, creatorId, code or myTotal', async () => {
      circleModel.findOne.mockReturnValue(chain(activeCircle()));

      const preview = await service.preview('ABCDEFGH');

      expect(preview).not.toHaveProperty('memberIds');
      expect(preview).not.toHaveProperty('creatorId');
      expect(preview).not.toHaveProperty('code');
      expect(preview).not.toHaveProperty('myTotal');
    });
  });

  describe('join', () => {
    it('reports FULL when the guarded update matches nothing on a still-active circle', async () => {
      circleModel.findOne.mockReturnValue(chain(activeCircle()));
      circleModel.findOneAndUpdate.mockReturnValue(chain(null));
      circleModel.findById.mockReturnValue(chain({ status: 'active' }));

      await expect(
        captureForbidden(service.join(userId, 'abcdefgh')),
      ).resolves.toMatchObject({ code: CIRCLE_ERROR_CODE.FULL });

      // Kapasite kontrolü filtrenin İÇİNDE — okuma/yazma arası boşluk yok.
      const [filter] = circleModel.findOneAndUpdate.mock.calls[0] as [
        Record<string, unknown>,
      ];
      expect(filter).toMatchObject({ status: 'active' });
      expect(filter.$expr).toBeDefined();
    });

    it('does not push when the before-document already contains the user (concurrent join won the race)', async () => {
      circleModel.findOne.mockReturnValue(chain(activeCircle()));
      circleModel.findOneAndUpdate.mockReturnValue(
        chain(activeCircle({ memberIds: [creatorObjectId, userObjectId] })),
      );

      await service.join(userId, 'abcdefgh');

      expect(pushSender.sendToDevices).not.toHaveBeenCalled();
    });

    it('pushes the creator exactly once for a genuinely new member', async () => {
      circleModel.findOne.mockReturnValue(chain(activeCircle()));
      circleModel.findOneAndUpdate.mockReturnValue(chain(activeCircle()));
      userModel.findById.mockReturnValue(chain({ displayName: 'Ahmet' }));

      const summary = await service.join(userId, 'abcdefgh');

      expect(devicesService.findActiveByUserIds).toHaveBeenCalledWith([
        String(creatorObjectId),
      ]);
      expect(pushSender.sendToDevices).toHaveBeenCalledTimes(1);
      expect(summary.memberCount).toBe(2);
    });

    it('is idempotent for an existing member: no write, no push', async () => {
      circleModel.findOne.mockReturnValue(
        chain(activeCircle({ memberIds: [creatorObjectId, userObjectId] })),
      );

      await service.join(userId, 'abcdefgh');

      expect(circleModel.findOneAndUpdate).not.toHaveBeenCalled();
      expect(pushSender.sendToDevices).not.toHaveBeenCalled();
    });

    it('rejects an unknown code', async () => {
      circleModel.findOne.mockReturnValue(chain(null));

      await expect(
        captureNotFound(service.join(userId, 'abcdefgh')),
      ).resolves.toMatchObject({ code: CIRCLE_ERROR_CODE.NOT_FOUND });
    });

    it('rejects a non-member joining a completed circle without touching findOneAndUpdate', async () => {
      circleModel.findOne.mockReturnValue(
        chain(activeCircle({ status: 'completed' })),
      );

      await expect(
        captureForbidden(service.join(userId, 'abcdefgh')),
      ).resolves.toMatchObject({ code: CIRCLE_ERROR_CODE.NOT_ACTIVE });
      expect(circleModel.findOneAndUpdate).not.toHaveBeenCalled();
    });

    it('reports NOT_ACTIVE when the guarded update returns null and the re-read status is closed', async () => {
      circleModel.findOne.mockReturnValue(chain(activeCircle()));
      circleModel.findOneAndUpdate.mockReturnValue(chain(null));
      circleModel.findById.mockReturnValue(chain({ status: 'closed' }));

      await expect(
        captureForbidden(service.join(userId, 'abcdefgh')),
      ).resolves.toMatchObject({ code: CIRCLE_ERROR_CODE.NOT_ACTIVE });
    });

    it('does not fail the join when the push send fails', async () => {
      circleModel.findOne.mockReturnValue(chain(activeCircle()));
      circleModel.findOneAndUpdate.mockReturnValue(chain(activeCircle()));
      userModel.findById.mockReturnValue(chain({ displayName: 'Ahmet' }));
      pushSender.sendToDevices.mockRejectedValue(new Error('push down'));

      await expect(service.join(userId, 'abcdefgh')).resolves.toBeDefined();
    });

    it('falls back to a generic name in the push body when the joiner has no displayName', async () => {
      circleModel.findOne.mockReturnValue(chain(activeCircle()));
      circleModel.findOneAndUpdate.mockReturnValue(chain(activeCircle()));
      userModel.findById.mockReturnValue(chain(null));

      await service.join(userId, 'abcdefgh');

      const [, message] = pushSender.sendToDevices.mock.calls[0] as [
        unknown,
        { body: string },
      ];
      expect(message.body).toContain('Bir kardeşin');
    });

    it('guards the update with status:active and a $expr member-count check, returnDocument:before', async () => {
      circleModel.findOne.mockReturnValue(chain(activeCircle()));
      circleModel.findOneAndUpdate.mockReturnValue(chain(activeCircle()));
      userModel.findById.mockReturnValue(chain({ displayName: 'Ahmet' }));

      await service.join(userId, 'abcdefgh');

      const [filter, , options] = circleModel.findOneAndUpdate.mock
        .calls[0] as [
        Record<string, unknown>,
        unknown,
        Record<string, unknown>,
      ];
      expect(filter.status).toBe('active');
      expect(filter.$expr).toEqual({
        $lt: [{ $size: '$memberIds' }, CIRCLE_MAX_MEMBERS],
      });
      expect(options).toMatchObject({ returnDocument: 'before' });
    });
  });

  describe('leave', () => {
    it('rejects the creator with CIRCLE_CREATOR_ONLY and never calls updateOne', async () => {
      circleModel.findOne.mockReturnValue(chain({ creatorId: userObjectId }));

      await expect(
        captureForbidden(service.leave(userId, circleObjectId.toHexString())),
      ).resolves.toMatchObject({ code: CIRCLE_ERROR_CODE.CREATOR_ONLY });
      expect(circleModel.updateOne).not.toHaveBeenCalled();
    });

    it('pulls the member for a non-creator', async () => {
      circleModel.findOne.mockReturnValue(
        chain({ creatorId: creatorObjectId }),
      );

      await service.leave(userId, circleObjectId.toHexString());

      expect(circleModel.updateOne).toHaveBeenCalledWith(
        { _id: circleObjectId, memberIds: userObjectId },
        { $pull: { memberIds: userObjectId } },
      );
    });

    it('rejects an unknown circle with NotFound', async () => {
      circleModel.findOne.mockReturnValue(chain(null));

      await expect(
        captureNotFound(service.leave(userId, circleObjectId.toHexString())),
      ).resolves.toMatchObject({ code: CIRCLE_ERROR_CODE.NOT_FOUND });
    });
  });

  describe('close', () => {
    it('filters by _id, creatorId and status:active', async () => {
      circleModel.findOneAndUpdate.mockReturnValue(chain(activeCircle()));

      await service.close(userId, circleObjectId.toHexString());

      const [filter] = circleModel.findOneAndUpdate.mock.calls[0] as [
        Record<string, unknown>,
      ];
      expect(filter).toEqual({
        _id: circleObjectId,
        creatorId: userObjectId,
        status: 'active',
      });
    });

    it('rejects when nothing matched (not the creator, already closed, or unknown)', async () => {
      circleModel.findOneAndUpdate.mockReturnValue(chain(null));

      await expect(
        captureNotFound(service.close(userId, circleObjectId.toHexString())),
      ).resolves.toMatchObject({ code: CIRCLE_ERROR_CODE.NOT_FOUND });
    });

    it('returns the closed circle in the summary', async () => {
      circleModel.findOneAndUpdate.mockReturnValue(
        chain(activeCircle({ status: 'closed' })),
      );

      const summary = await service.close(userId, circleObjectId.toHexString());

      expect(summary.status).toBe('closed');
    });
  });

  describe('assertCanContribute', () => {
    it('rejects a log for a different dhikr', async () => {
      circleModel.findOne.mockReturnValue(
        chain({ status: 'active', dhikrId: dhikrObjectId }),
      );

      await expect(
        service.assertCanContribute(
          userId,
          circleObjectId.toHexString(),
          new Types.ObjectId().toHexString(),
        ),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('rejects a non-member', async () => {
      circleModel.findOne.mockReturnValue(chain(null));

      await expect(
        captureForbidden(
          service.assertCanContribute(
            userId,
            circleObjectId.toHexString(),
            dhikrObjectId.toHexString(),
          ),
        ),
      ).resolves.toMatchObject({ code: CIRCLE_ERROR_CODE.NOT_MEMBER });
    });

    it('rejects a closed circle with NOT_ACTIVE', async () => {
      circleModel.findOne.mockReturnValue(
        chain({ status: 'closed', dhikrId: dhikrObjectId }),
      );

      await expect(
        captureForbidden(
          service.assertCanContribute(
            userId,
            circleObjectId.toHexString(),
            dhikrObjectId.toHexString(),
          ),
        ),
      ).resolves.toMatchObject({ code: CIRCLE_ERROR_CODE.NOT_ACTIVE });
    });

    it('rejects an active circle whose endDate is yesterday', async () => {
      const yesterday = shiftDateKey(istanbulDateKey(new Date()), -1);
      circleModel.findOne.mockReturnValue(
        chain({ status: 'active', dhikrId: dhikrObjectId, endDate: yesterday }),
      );

      await expect(
        captureForbidden(
          service.assertCanContribute(
            userId,
            circleObjectId.toHexString(),
            dhikrObjectId.toHexString(),
          ),
        ),
      ).resolves.toMatchObject({ code: CIRCLE_ERROR_CODE.NOT_ACTIVE });
    });

    it('accepts an active circle whose endDate is today', async () => {
      const today = istanbulDateKey(new Date());
      circleModel.findOne.mockReturnValue(
        chain({ status: 'active', dhikrId: dhikrObjectId, endDate: today }),
      );

      await expect(
        service.assertCanContribute(
          userId,
          circleObjectId.toHexString(),
          dhikrObjectId.toHexString(),
        ),
      ).resolves.toBeUndefined();
    });

    it('rejects a missing dhikrId (custom dhikr) with CIRCLE_DHIKR_MISMATCH', async () => {
      circleModel.findOne.mockReturnValue(
        chain({ status: 'active', dhikrId: dhikrObjectId }),
      );

      await expect(
        service.assertCanContribute(
          userId,
          circleObjectId.toHexString(),
          undefined,
        ),
      ).rejects.toMatchObject({
        response: { code: CIRCLE_ERROR_CODE.DHIKR_MISMATCH },
      });
    });

    it('queries with {_id, memberIds: uid} on the happy path', async () => {
      circleModel.findOne.mockReturnValue(
        chain({ status: 'active', dhikrId: dhikrObjectId }),
      );

      await service.assertCanContribute(
        userId,
        circleObjectId.toHexString(),
        dhikrObjectId.toHexString(),
      );

      expect(circleModel.findOne).toHaveBeenCalledWith({
        _id: circleObjectId,
        memberIds: userObjectId,
      });
    });
  });

  describe('applyProgress', () => {
    beforeEach(() => {
      dhikrLogModel.aggregate.mockReturnValue(
        chain([{ _id: null, total: 120 }]),
      );
      circleModel.findById.mockReturnValue(
        chain({
          goalCount: 100,
          name: 'Salavat Halkası',
          memberIds: [creatorObjectId, userObjectId],
        }),
      );
    });

    it('caches the total monotonically and completes + pushes exactly once', async () => {
      circleModel.findOneAndUpdate.mockReturnValue(
        chain({ _id: circleObjectId }),
      );

      await service.applyProgress(circleObjectId.toHexString());

      const [filter, update] = circleModel.updateOne.mock.calls[0] as [
        Record<string, unknown>,
        Record<string, unknown>,
      ];
      // Monoton önbellek: $inc yok, koşulsuz $set yok.
      expect(filter).toMatchObject({ totalCount: { $lt: 120 } });
      expect(update).toEqual({ $set: { totalCount: 120 } });
      expect(update.$inc).toBeUndefined();

      const [completeFilter] = circleModel.findOneAndUpdate.mock.calls[0] as [
        Record<string, unknown>,
      ];
      expect(completeFilter).toMatchObject({
        status: 'active',
        completedAt: null,
      });
      expect(pushSender.sendToDevices).toHaveBeenCalledTimes(1);
    });

    it('does not push when a concurrent call already completed the circle', async () => {
      circleModel.findOneAndUpdate.mockReturnValue(chain(null));

      await service.applyProgress(circleObjectId.toHexString());

      expect(pushSender.sendToDevices).not.toHaveBeenCalled();
    });

    it('skips completion while the goal is not reached', async () => {
      dhikrLogModel.aggregate.mockReturnValue(
        chain([{ _id: null, total: 40 }]),
      );

      await service.applyProgress(circleObjectId.toHexString());

      expect(circleModel.findOneAndUpdate).not.toHaveBeenCalled();
      expect(pushSender.sendToDevices).not.toHaveBeenCalled();
    });

    it('caches a total of 0 when there are no log rows and skips completion', async () => {
      dhikrLogModel.aggregate.mockReturnValue(chain([]));

      await service.applyProgress(circleObjectId.toHexString());

      const [filter, update] = circleModel.updateOne.mock.calls[0] as [
        Record<string, unknown>,
        Record<string, unknown>,
      ];
      expect(filter).toMatchObject({ totalCount: { $lt: 0 } });
      expect(update).toEqual({ $set: { totalCount: 0 } });
      expect(circleModel.findOneAndUpdate).not.toHaveBeenCalled();
    });

    it('returns the computed total quietly when the circle is gone after the aggregate/update', async () => {
      circleModel.findById.mockReturnValue(chain(null));

      await expect(
        service.applyProgress(circleObjectId.toHexString()),
      ).resolves.toBe(120);
      expect(circleModel.findOneAndUpdate).not.toHaveBeenCalled();
      expect(pushSender.sendToDevices).not.toHaveBeenCalled();
    });

    it('does not throw when the push send rejects, and still returns the total', async () => {
      circleModel.findOneAndUpdate.mockReturnValue(
        chain({ _id: circleObjectId }),
      );
      pushSender.sendToDevices.mockRejectedValue(new Error('push down'));

      await expect(
        service.applyProgress(circleObjectId.toHexString()),
      ).resolves.toBe(120);
    });

    it('returns the computed total', async () => {
      circleModel.findOneAndUpdate.mockReturnValue(
        chain({ _id: circleObjectId }),
      );

      await expect(
        service.applyProgress(circleObjectId.toHexString()),
      ).resolves.toBe(120);
    });

    it('notifies every memberId as a string with data.route pointing at the circle', async () => {
      circleModel.findOneAndUpdate.mockReturnValue(
        chain({ _id: circleObjectId }),
      );

      await service.applyProgress(circleObjectId.toHexString());

      expect(devicesService.findActiveByUserIds).toHaveBeenCalledWith([
        String(creatorObjectId),
        String(userObjectId),
      ]);
      const [, message] = pushSender.sendToDevices.mock.calls[0] as [
        unknown,
        { data: { route: string } },
      ];
      expect(message.data.route).toBe(
        `/circle/${circleObjectId.toHexString()}`,
      );
    });

    it('completes when the total exactly equals the goal', async () => {
      dhikrLogModel.aggregate.mockReturnValue(
        chain([{ _id: null, total: 100 }]),
      );
      circleModel.findOneAndUpdate.mockReturnValue(
        chain({ _id: circleObjectId }),
      );

      await service.applyProgress(circleObjectId.toHexString());

      expect(circleModel.findOneAndUpdate).toHaveBeenCalledTimes(1);
      expect(pushSender.sendToDevices).toHaveBeenCalledTimes(1);
    });
  });
});

describe('generateCircleCode', () => {
  it('produces codes of the configured length using only the safe alphabet', () => {
    for (let index = 0; index < 50; index += 1) {
      const code = generateCircleCode();
      expect(code).toHaveLength(CIRCLE_CODE_LENGTH);
      expect(
        [...code].every((char) => CIRCLE_CODE_ALPHABET.includes(char)),
      ).toBe(true);
    }
  });
});
