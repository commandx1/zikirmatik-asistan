import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { Types } from 'mongoose';
import { als } from '../../common/logging/request-context';
import { CirclesService } from './circles.service';
import { CIRCLE_ERROR_CODE } from './circles.constants';

function chain(value: unknown) {
  const node = {
    select: () => node,
    lean: () => node,
    sort: () => node,
    exec: jest.fn().mockResolvedValue(value),
  };
  return node;
}

function withTimezone<T>(tz: string | undefined, fn: () => T): T {
  const headers = tz === undefined ? {} : { 'x-client-timezone': tz };
  return als.run({ requestId: 'test', req: { headers } as never }, fn);
}

describe('CirclesService — timezone, locale, guest name', () => {
  const circleModel = {
    create: jest.fn(),
    findOne: jest.fn(),
    findById: jest.fn(),
    findOneAndUpdate: jest.fn(),
    countDocuments: jest.fn(),
    find: jest.fn(),
    updateMany: jest.fn(),
  };
  const dhikrLogModel = {
    aggregate: jest.fn(),
    findOne: jest.fn(),
    distinct: jest.fn(),
  };
  const userModel = { find: jest.fn(), findById: jest.fn() };
  const dhikrModel = { findById: jest.fn() };
  const devicesService = { findActiveByUserIds: jest.fn() };
  const pushSender = { sendToDevices: jest.fn() };

  const userObjectId = new Types.ObjectId();
  const creatorObjectId = new Types.ObjectId();
  const circleObjectId = new Types.ObjectId();
  const dhikrObjectId = new Types.ObjectId();
  const userId = userObjectId.toHexString();

  const circle = {
    _id: circleObjectId,
    name: 'Salavat Halkası',
    dhikrId: dhikrObjectId,
    goalCount: 1000,
    creatorId: creatorObjectId,
    code: 'ABCDEFGH',
    memberIds: [creatorObjectId, userObjectId],
    memberLimit: 5,
    totalCount: 0,
    status: 'active',
  };

  let service: CirclesService;

  beforeEach(() => {
    jest.useFakeTimers();
    Object.values(circleModel).forEach((fn) => fn.mockReset());
    dhikrLogModel.aggregate.mockReset().mockReturnValue(chain([]));
    dhikrLogModel.findOne.mockReset().mockReturnValue(chain(null));
    dhikrLogModel.distinct.mockReset().mockResolvedValue([]);
    userModel.find.mockReset().mockReturnValue(chain([]));
    userModel.findById.mockReset().mockReturnValue(chain(null));
    dhikrModel.findById
      .mockReset()
      .mockReturnValue(
        chain({ _id: dhikrObjectId, name: { tr: 'Salavat', en: 'Salawat' } }),
      );
    devicesService.findActiveByUserIds.mockReset().mockResolvedValue([]);
    pushSender.sendToDevices.mockReset().mockResolvedValue({ sentCount: 1 });

    service = new CirclesService(
      circleModel as never,
      dhikrLogModel as never,
      userModel as never,
      dhikrModel as never,
      devicesService as never,
      pushSender as never,
    );
  });

  afterEach(() => jest.useRealTimers());

  describe('create endDate', () => {
    // LA'da 28 Eylül akşamı, İstanbul'da 29 Eylül.
    const NOW = new Date('2026-09-29T03:00:00.000Z');
    const dto = {
      dhikrId: dhikrObjectId.toHexString(),
      goalCount: 1000,
      endDate: '2026-09-28',
    };

    beforeEach(() => {
      jest.setSystemTime(NOW);
      userModel.findById.mockReturnValue(chain({ isPremium: true }));
      circleModel.countDocuments.mockResolvedValue(0);
      circleModel.create.mockImplementation((doc: Record<string, unknown>) => ({
        toObject: () => ({ _id: circleObjectId, ...doc }),
      }));
    });

    it("accepts an endDate equal to the caller's Los Angeles day", async () => {
      const summary = await withTimezone('America/Los_Angeles', () =>
        service.create(userId, dto),
      );
      expect(summary.endDate).toBe('2026-09-28');
    });

    it('still rejects it without the header (Istanbul), with a code', async () => {
      const error = await service.create(userId, dto).catch((e: unknown) => e);
      expect(error).toBeInstanceOf(BadRequestException);
      expect((error as BadRequestException).getResponse()).toEqual({
        code: CIRCLE_ERROR_CODE.END_DATE_PAST,
        message: 'Bitiş tarihi geçmiş bir gün olamaz.',
      });
    });
  });

  it('flags the default guest name in the member list without changing displayName', async () => {
    circleModel.findOne.mockReturnValue(chain(circle));
    userModel.find.mockReturnValue(
      chain([
        { _id: creatorObjectId, displayName: 'Ahmet' },
        { _id: userObjectId, displayName: 'Misafir Kullanıcı' },
      ]),
    );

    const detail = await service.findOne(userId, circleObjectId.toHexString());

    expect(detail.members).toEqual([
      { displayName: 'Ahmet', activeToday: false },
      {
        displayName: 'Misafir Kullanıcı',
        activeToday: false,
        defaultName: true,
      },
    ]);
  });

  it('sends the joined push once per device locale and hides the guest name', async () => {
    circleModel.findOne.mockReturnValue(
      chain({ ...circle, memberIds: [creatorObjectId] }),
    );
    circleModel.findOneAndUpdate.mockReturnValue(
      chain({ ...circle, memberIds: [creatorObjectId] }),
    );
    userModel.findById.mockReturnValue(
      chain({ displayName: 'Misafir Kullanıcı' }),
    );
    devicesService.findActiveByUserIds.mockResolvedValue([
      { deviceId: 'old', expoPushToken: 'ExponentPushToken[a]' },
      { deviceId: 'en', expoPushToken: 'ExponentPushToken[b]', locale: 'en' },
      { deviceId: 'tr', expoPushToken: 'ExponentPushToken[c]', locale: 'tr' },
    ]);

    await service.join(userId, 'ABCDEFGH');

    const calls = pushSender.sendToDevices.mock.calls as [
      { deviceId: string }[],
      { title: string; body: string },
    ][];
    expect(calls).toHaveLength(2);
    const byDevices = new Map(
      calls.map(([targets, message]) => [
        targets.map((t) => t.deviceId).join(','),
        message,
      ]),
    );
    expect(byDevices.get('old,tr')?.body).toBe(
      'Bir kardeşin, "Salavat Halkası" halkana katıldı.',
    );
    expect(byDevices.get('en')).toMatchObject({
      title: 'New member in your circle',
      body: 'Someone joined your "Salavat Halkası" circle.',
    });
  });

  describe("expiry in the creator's timezone", () => {
    type CircleDoc = Record<string, unknown> & {
      endDate?: string;
      expiresAt?: Date;
      timezone?: string;
    };

    beforeEach(() => {
      userModel.findById.mockReturnValue(chain({ isPremium: true }));
      circleModel.countDocuments.mockResolvedValue(0);
      circleModel.create.mockImplementation((doc: Record<string, unknown>) => ({
        toObject: () => ({ _id: circleObjectId, ...doc }),
      }));
      circleModel.find.mockReturnValue(chain([]));
      circleModel.updateMany.mockReturnValue(chain(undefined));
    });

    /** Verilen saat ve başlıkla halka kurar; create'e giden belgeyi döner. */
    async function createAs(
      tz: string | undefined,
      at: string,
      endDate: string,
    ): Promise<CircleDoc> {
      jest.setSystemTime(new Date(at));
      circleModel.create.mockClear();
      await withTimezone(tz, () =>
        service.create(userId, {
          dhikrId: dhikrObjectId.toHexString(),
          goalCount: 1000,
          endDate,
        }),
      );
      const [doc] = circleModel.create.mock.calls[0] as [CircleDoc];
      return { ...circle, ...doc };
    }

    async function canContribute(
      doc: CircleDoc,
      at: string,
      tz?: string,
    ): Promise<boolean> {
      jest.setSystemTime(new Date(at));
      circleModel.findOne.mockReturnValue(chain(doc));
      try {
        await withTimezone(tz, () =>
          service.assertCanContribute(
            userId,
            circleObjectId.toHexString(),
            dhikrObjectId.toHexString(),
          ),
        );
        return true;
      } catch (error) {
        expect((error as ForbiddenException).getResponse()).toMatchObject({
          code: CIRCLE_ERROR_CODE.NOT_ACTIVE,
        });
        return false;
      }
    }

    /** findMine'ın kapanış filtresini belgelere uygular ($or/$lt/$lte/$exists). */
    function matches(filter: Record<string, unknown>, doc: CircleDoc): boolean {
      return Object.entries(filter).every(([key, cond]) => {
        if (key === '$or') {
          return (cond as Record<string, unknown>[]).some((branch) =>
            matches(branch, doc),
          );
        }
        if (key === 'memberIds' || key === 'status') {
          return true;
        }
        const value = doc[key] as string | Date | undefined;
        const ops = cond as {
          $lt?: unknown;
          $lte?: unknown;
          $exists?: boolean;
        };
        if (ops.$exists === false && value !== undefined) return false;
        if (ops.$lt !== undefined && !(value !== undefined && value < ops.$lt))
          return false;
        if (
          ops.$lte !== undefined &&
          !(value !== undefined && value <= ops.$lte)
        )
          return false;
        return true;
      });
    }

    async function closedByFindMine(
      docs: Record<string, CircleDoc>,
      at: string,
    ): Promise<string[]> {
      jest.setSystemTime(new Date(at));
      circleModel.updateMany.mockClear();
      await withTimezone('Europe/Istanbul', () => service.findMine(userId));
      const [filter] = circleModel.updateMany.mock.calls[0] as [
        Record<string, unknown>,
      ];
      return Object.keys(docs).filter((name) => matches(filter, docs[name]));
    }

    it('Los Angeles creator: open at 23:30 LA (next day in Istanbul), closed at 00:30 LA', async () => {
      // 2026-10-05 12:00 LA'da, bitiş = LA'nın bugünü.
      const doc = await createAs(
        'America/Los_Angeles',
        '2026-10-05T19:00:00.000Z',
        '2026-10-05',
      );
      expect(doc.timezone).toBe('America/Los_Angeles');
      expect(doc.expiresAt).toEqual(new Date('2026-10-06T07:00:00.000Z'));

      // 23:30 LA = İstanbul 6 Ekim 09:30.
      const before = '2026-10-06T06:30:00.000Z';
      const after = '2026-10-06T07:30:00.000Z';
      expect(await canContribute(doc, before, 'America/Los_Angeles')).toBe(
        true,
      );
      expect(await canContribute(doc, before, 'Europe/Istanbul')).toBe(true);
      expect(await closedByFindMine({ la: doc }, before)).toEqual([]);
      expect(await canContribute(doc, after, 'America/Los_Angeles')).toBe(
        false,
      );
      expect(await closedByFindMine({ la: doc }, after)).toEqual(['la']);
    });

    it('Auckland creator: closes at Auckland midnight, still the previous day in Istanbul', async () => {
      const doc = await createAs(
        'Pacific/Auckland',
        '2026-10-04T23:00:00.000Z', // Auckland 5 Ekim 12:00
        '2026-10-05',
      );
      // 6 Ekim 00:00 NZDT (+13) = 5 Ekim 11:00Z = İstanbul 5 Ekim 14:00.
      expect(doc.expiresAt).toEqual(new Date('2026-10-05T11:00:00.000Z'));

      expect(
        await canContribute(doc, '2026-10-05T10:59:00.000Z', 'Europe/Istanbul'),
      ).toBe(true);
      expect(
        await canContribute(doc, '2026-10-05T11:01:00.000Z', 'Europe/Istanbul'),
      ).toBe(false);
    });

    it('a circle without a stored timezone/expiresAt keeps the Istanbul day', async () => {
      const legacy: CircleDoc = { ...circle, endDate: '2026-10-05' };
      // İstanbul 23:59 / 00:01; çağıranın başlığı sonucu değiştirmez.
      for (const tz of ['America/Los_Angeles', 'Pacific/Auckland', undefined]) {
        expect(
          await canContribute(legacy, '2026-10-05T20:59:00.000Z', tz),
        ).toBe(true);
        expect(
          await canContribute(legacy, '2026-10-05T21:01:00.000Z', tz),
        ).toBe(false);
      }
    });

    it('a creator without the header (published app) gets the Istanbul day', async () => {
      const doc = await createAs(
        undefined,
        '2026-10-05T09:00:00.000Z',
        '2026-10-05',
      );
      expect(doc.timezone).toBe('Europe/Istanbul');
      expect(doc.expiresAt).toEqual(new Date('2026-10-05T21:00:00.000Z'));
    });

    it('DST: expires at local midnight, not 24h after the previous midnight', async () => {
      // 1 Kasım 2026 LA'da 25 saat (PDT → PST). Gün başı 07:00Z; +24h 07:00Z
      // olurdu, gerçek gece yarısı 08:00Z.
      const fallBack = await createAs(
        'America/Los_Angeles',
        '2026-11-01T19:00:00.000Z',
        '2026-11-01',
      );
      expect(fallBack.expiresAt).toEqual(new Date('2026-11-02T08:00:00.000Z'));
      expect(await canContribute(fallBack, '2026-11-02T07:30:00.000Z')).toBe(
        true,
      );
      expect(await canContribute(fallBack, '2026-11-02T08:00:00.000Z')).toBe(
        false,
      );

      // 8 Mart 2026 LA'da 23 saat (PST → PDT): gece yarısı 07:00Z, +24h değil.
      const springForward = await createAs(
        'America/Los_Angeles',
        '2026-03-08T20:00:00.000Z',
        '2026-03-08',
      );
      expect(springForward.expiresAt).toEqual(
        new Date('2026-03-09T07:00:00.000Z'),
      );
      expect(
        await canContribute(springForward, '2026-03-09T07:30:00.000Z'),
      ).toBe(false);
    });

    it('findMine closes exactly the circles past their own expiry in one call', async () => {
      const docs: Record<string, CircleDoc> = {
        legacy: { ...circle, endDate: '2026-10-05' },
        legacyFuture: { ...circle, endDate: '2026-10-06' },
        noEndDate: { ...circle },
        la: await createAs(
          'America/Los_Angeles',
          '2026-10-05T19:00:00.000Z',
          '2026-10-05',
        ),
        auckland: await createAs(
          'Pacific/Auckland',
          '2026-10-04T23:00:00.000Z',
          '2026-10-05',
        ),
      };

      // İstanbul 6 Ekim 01:00, LA 5 Ekim 15:00, Auckland 6 Ekim 11:00.
      expect(await closedByFindMine(docs, '2026-10-05T22:00:00.000Z')).toEqual([
        'legacy',
        'auckland',
      ]);
      // LA gece yarısından sonra LA da kapanır; legacyFuture hâlâ açık.
      expect(await closedByFindMine(docs, '2026-10-06T07:00:00.000Z')).toEqual([
        'legacy',
        'la',
        'auckland',
      ]);
      expect(circleModel.updateMany).toHaveBeenCalledTimes(1);
    });

    it('exposes expiresAt additively in the summary', async () => {
      jest.setSystemTime(new Date('2026-10-05T19:00:00.000Z'));
      const summary = await withTimezone('America/Los_Angeles', () =>
        service.create(userId, {
          dhikrId: dhikrObjectId.toHexString(),
          goalCount: 1000,
          endDate: '2026-10-05',
        }),
      );
      expect(summary.expiresAt).toBe('2026-10-06T07:00:00.000Z');

      const unlimited = await service.create(userId, {
        dhikrId: dhikrObjectId.toHexString(),
        goalCount: 1000,
      });
      expect(unlimited).not.toHaveProperty('expiresAt');
    });
  });

  describe('findOne lazy expiry', () => {
    const NOW = new Date('2026-10-06T10:00:00.000Z');
    const updateOne = jest.fn();

    beforeEach(() => {
      jest.setSystemTime(NOW);
      updateOne.mockReset().mockReturnValue({ exec: jest.fn() });
      (circleModel as Record<string, unknown>).updateOne = updateOne;
    });

    const detailOf = (doc: Record<string, unknown>) => {
      circleModel.findOne.mockReturnValue(chain({ ...circle, ...doc }));
      return service.findOne(userId, circleObjectId.toHexString());
    };

    it('reports an expired active circle as closed with a guarded update', async () => {
      const detail = await detailOf({
        expiresAt: new Date('2026-10-06T07:00:00.000Z'),
        endDate: '2026-10-05',
      });
      expect(detail.status).toBe('closed');
      expect(updateOne).toHaveBeenCalledWith(
        { _id: circleObjectId, status: 'active' },
        { $set: { status: 'closed' } },
      );
    });

    it('keeps a not-yet-expired circle active without writing', async () => {
      const detail = await detailOf({
        expiresAt: new Date('2026-10-07T07:00:00.000Z'),
        endDate: '2026-10-06',
      });
      expect(detail.status).toBe('active');
      expect(updateOne).not.toHaveBeenCalled();
    });

    it('never touches a completed circle', async () => {
      const detail = await detailOf({
        status: 'completed',
        expiresAt: new Date('2026-10-06T07:00:00.000Z'),
        endDate: '2026-10-05',
      });
      expect(detail.status).toBe('completed');
      expect(updateOne).not.toHaveBeenCalled();
    });
  });
});
