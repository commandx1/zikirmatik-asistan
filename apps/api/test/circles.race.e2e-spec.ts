/**
 * Zikir Halkası — GERÇEK MongoDB üzerinde eşzamanlılık (race) testleri.
 *
 * circles.service.spec.ts mock'lu birim testleridir; burada asıl amaç
 * atomik Mongo işlemlerinin (findOneAndUpdate + koruyucu filtre, $addToSet,
 * $max, {totalCount:{$lt}}) paralel yük altında gerçekten tuttuğunu
 * doğrulamaktır. Nest DI kullanılmaz: modeller doğrudan bir mongoose
 * bağlantısından üretilir, servisler elle new'lenir.
 *
 * Çalıştırma:
 *   MONGODB_TEST_URI=mongodb://127.0.0.1:27018/zikir_qa_circles \
 *     pnpm --filter api test:e2e
 *
 * MONGODB_TEST_URI yoksa tüm blok atlanır (CI yeşil kalır).
 */
import mongoose, { Types, type Connection, type Model } from 'mongoose';
import { istanbulDateKey, shiftDateKey } from '../src/common/utils/date-keys';
import * as circleConstants from '../src/modules/circles/circles.constants';
import {
  CIRCLE_ERROR_CODE,
  CIRCLE_MAX_ACTIVE_PER_CREATOR,
  CIRCLE_MAX_MEMBERS,
} from '../src/modules/circles/circles.constants';
import { CirclesService } from '../src/modules/circles/circles.service';
import {
  Circle,
  CircleSchema,
  type CircleDocument,
} from '../src/modules/circles/schemas/circle.schema';
import { DhikrLogsService } from '../src/modules/dhikr-logs/dhikr-logs.service';
import type { CreateDhikrLogDto } from '../src/modules/dhikr-logs/dto/create-dhikr-log.dto';
import {
  DhikrLog,
  DhikrLogSchema,
  type DhikrLogDocument,
} from '../src/modules/dhikr-logs/schemas/dhikr-log.schema';
import {
  Dhikr,
  DhikrSchema,
  type DhikrDocument,
} from '../src/modules/dhikrs/schemas/dhikr.schema';
import {
  User,
  UserSchema,
  type UserDocument,
} from '../src/modules/users/schemas/user.schema';
import type { DevicesService } from '../src/modules/devices/devices.service';
import type { PushSenderService } from '../src/modules/push/push-sender.service';
import type { StreaksService } from '../src/modules/streaks/streaks.service';
import type { VirdProgressService } from '../src/modules/vird/vird-progress.service';

const MONGODB_TEST_URI = process.env.MONGODB_TEST_URI;

if (!MONGODB_TEST_URI) {
  console.log(
    '[circles.race] MONGODB_TEST_URI yok — halka eşzamanlılık testleri atlandı. ' +
      'Çalıştırmak için: MONGODB_TEST_URI=mongodb://127.0.0.1:27018/zikir_qa_circles pnpm --filter api test:e2e',
  );
}

const describeRace = MONGODB_TEST_URI ? describe : describe.skip;

jest.setTimeout(60_000);

type PushCall = [unknown, { title: string; body: string }];

/** HttpException gövdesindeki `code` alanı (ForbiddenException({code,...})). */
function errorCode(error: unknown): string | undefined {
  const response = (error as { response?: unknown } | undefined)?.response;
  if (response && typeof response === 'object' && 'code' in response) {
    return String(response.code);
  }
  return undefined;
}

function errorStatus(error: unknown): number | undefined {
  const status = (error as { status?: unknown } | undefined)?.status;
  return typeof status === 'number' ? status : undefined;
}

/** Çekirdek Jest'te `.rejects.toSatisfy` yok (jest-extended) — elle kontrol. */
async function expectRejection(
  promise: Promise<unknown>,
  expected: { code?: string; status?: number },
) {
  let caught: unknown;
  try {
    await promise;
  } catch (error) {
    caught = error;
  }
  expect(caught).toBeDefined();
  if (expected.code !== undefined) {
    expect(errorCode(caught)).toBe(expected.code);
  }
  if (expected.status !== undefined) {
    expect(errorStatus(caught)).toBe(expected.status);
  }
}

/** Promise.allSettled özeti: kaç başarı, hangi hata kodları kaç kez. */
function summarize<T>(results: PromiseSettledResult<T>[]) {
  const fulfilled = results.filter(
    (result): result is PromiseFulfilledResult<T> =>
      result.status === 'fulfilled',
  );
  const codes = new Map<string, number>();
  for (const result of results) {
    if (result.status === 'rejected') {
      const code = errorCode(result.reason) ?? 'UNKNOWN';
      codes.set(code, (codes.get(code) ?? 0) + 1);
    }
  }
  return { ok: fulfilled.length, values: fulfilled.map((r) => r.value), codes };
}

describeRace('Zikir Halkası — gerçek Mongo eşzamanlılık', () => {
  let connection: Connection;
  let circleModel: Model<CircleDocument>;
  let dhikrLogModel: Model<DhikrLogDocument>;
  let userModel: Model<UserDocument>;
  let dhikrModel: Model<DhikrDocument>;
  let circlesService: CirclesService;
  let dhikrLogsService: DhikrLogsService;

  const devicesService = {
    findActiveByUserIds: jest
      .fn()
      .mockResolvedValue([
        { deviceId: 'd1', expoPushToken: 'ExponentPushToken[x]' },
      ]),
  };
  const pushSender = { sendToDevices: jest.fn().mockResolvedValue({}) };
  const streaksService = { recalculateForUser: jest.fn() };
  const virdProgressService = { applyLogWrite: jest.fn() };

  const today = istanbulDateKey(new Date());

  beforeAll(async () => {
    connection = await mongoose
      .createConnection(MONGODB_TEST_URI as string)
      .asPromise();

    circleModel = connection.model<CircleDocument>(Circle.name, CircleSchema);
    dhikrLogModel = connection.model<DhikrLogDocument>(
      DhikrLog.name,
      DhikrLogSchema,
    );
    userModel = connection.model<UserDocument>(User.name, UserSchema);
    dhikrModel = connection.model<DhikrDocument>(Dhikr.name, DhikrSchema);

    // unique `code` ve partial index'ler testten ÖNCE var olmalı.
    await circleModel.syncIndexes();
    await dhikrLogModel.syncIndexes();
    await userModel.syncIndexes();

    circlesService = new CirclesService(
      circleModel,
      dhikrLogModel,
      userModel,
      dhikrModel,
      devicesService as unknown as DevicesService,
      pushSender as unknown as PushSenderService,
    );
    dhikrLogsService = new DhikrLogsService(
      dhikrLogModel,
      userModel,
      dhikrModel,
      streaksService as unknown as StreaksService,
      virdProgressService as unknown as VirdProgressService,
      circlesService,
    );
  });

  afterAll(async () => {
    await Promise.all([
      circleModel.deleteMany({}),
      dhikrLogModel.deleteMany({}),
      userModel.deleteMany({}),
      dhikrModel.deleteMany({}),
    ]);
    await connection.close();
  });

  beforeEach(async () => {
    jest.clearAllMocks();
    devicesService.findActiveByUserIds.mockResolvedValue([
      { deviceId: 'd1', expoPushToken: 'ExponentPushToken[x]' },
    ]);
    pushSender.sendToDevices.mockResolvedValue({});
    await Promise.all([
      circleModel.deleteMany({}),
      dhikrLogModel.deleteMany({}),
      userModel.deleteMany({}),
      dhikrModel.deleteMany({}),
    ]);
  });

  // --- seed helpers ---

  async function seedUser(displayName: string, isPremium = false) {
    const user = await userModel.create({ displayName, isPremium });
    return String(user._id);
  }

  async function seedUsers(count: number, prefix = 'Uye') {
    const docs = await userModel.insertMany(
      Array.from({ length: count }, (_, index) => ({
        displayName: `${prefix}-${index}`,
        isPremium: false,
      })),
    );
    return docs.map((doc) => String(doc._id));
  }

  async function seedDhikr(key: string) {
    const localized = { tr: `tr-${key}`, en: `en-${key}` };
    const dhikr = await dhikrModel.create({
      key,
      nameArabic: 'سبحان الله',
      name: localized,
      transliteration: localized,
      meaning: localized,
      virtue: localized,
      source: localized,
      isActive: true,
    });
    return String(dhikr._id);
  }

  function logDto(
    overrides: Partial<CreateDhikrLogDto> & {
      userId: string;
      count: number;
    },
  ): CreateDhikrLogDto {
    return {
      date: today,
      targetCount: 100,
      source: 'circle',
      ...overrides,
    };
  }

  /** Premium kurucu + zikir + halka. */
  async function seedCircle(options?: { goalCount?: number; name?: string }) {
    const creatorId = await seedUser('Kurucu', true);
    const dhikrId = await seedDhikr(`dhikr-${new Types.ObjectId().toString()}`);
    const circle = await circlesService.create(creatorId, {
      name: options?.name ?? 'Test Halkası',
      dhikrId,
      goalCount: options?.goalCount ?? 1_000_000,
    });
    return { creatorId, dhikrId, circle };
  }

  function pushTitles(): string[] {
    return (pushSender.sendToDevices.mock.calls as PushCall[]).map(
      (call) => call[1].title,
    );
  }

  function countPush(titlePart: string): number {
    return pushTitles().filter((title) => title.includes(titlePart)).length;
  }

  // ------------------------------------------------------------------
  // 1) Katılım tavanı yarışı
  // ------------------------------------------------------------------
  it('1) 230 eşzamanlı katılım: tam CIRCLE_MAX_MEMBERS üye, gerisi CIRCLE_FULL', async () => {
    const { circle } = await seedCircle();
    const memberIds = await seedUsers(230);

    const results = await Promise.allSettled(
      memberIds.map((userId) => circlesService.join(userId, circle.code)),
    );
    const { ok, codes } = summarize(results);

    const doc = await circleModel.findById(circle.id).lean().exec();
    const ids = (doc?.memberIds ?? []).map(String);

    expect(ids).toHaveLength(CIRCLE_MAX_MEMBERS);
    expect(new Set(ids).size).toBe(CIRCLE_MAX_MEMBERS); // duplicate yok
    expect(ok).toBe(CIRCLE_MAX_MEMBERS - 1); // kurucu zaten üye
    expect(codes.get(CIRCLE_ERROR_CODE.FULL)).toBe(230 - ok);
    expect([...codes.keys()]).toEqual([CIRCLE_ERROR_CODE.FULL]);
    // "yeni katılım" push'u = başarılı YENİ katılım sayısı (fazlası duplicate demek)
    expect(countPush('yeni katılım')).toBe(ok);
  });

  // ------------------------------------------------------------------
  // 2) Aynı kullanıcı 20 kez paralel
  // ------------------------------------------------------------------
  it('2) aynı kullanıcı 20 paralel katılım: 1 üyelik, en fazla 1 push', async () => {
    const { circle } = await seedCircle();
    const [userId] = await seedUsers(1);

    const results = await Promise.allSettled(
      Array.from({ length: 20 }, () =>
        circlesService.join(userId, circle.code),
      ),
    );
    expect(summarize(results).ok).toBe(20); // idempotent

    const doc = await circleModel.findById(circle.id).lean().exec();
    const mine = (doc?.memberIds ?? []).filter((id) => String(id) === userId);
    expect(mine).toHaveLength(1);
    expect(doc?.memberIds).toHaveLength(2); // kurucu + o
    expect(countPush('yeni katılım')).toBe(1);
  });

  // ------------------------------------------------------------------
  // 3) Katılım vs kapatma yarışı
  // ------------------------------------------------------------------
  it('3) 50 katılım + eşzamanlı close: üyeler yalnız aktifken eklendi', async () => {
    const { creatorId, circle } = await seedCircle();
    const memberIds = await seedUsers(50);

    const [joinResults] = await Promise.all([
      Promise.allSettled(
        memberIds.map((userId) => circlesService.join(userId, circle.code)),
      ),
      // Küçük gecikme: close'un katılımları HEP kazanmasını engeller, böylece
      // gerçek bir örtüşme yaşanır (yarışın hangi tarafı kazandığı
      // belirsizdir — testin doğruladığı şey bookkeeping'in tutarlılığı).
      (async () => {
        await new Promise((resolve) => setTimeout(resolve, 12));
        return circlesService.close(creatorId, circle.id);
      })(),
    ]);
    const { ok, codes } = summarize(joinResults);

    const doc = await circleModel.findById(circle.id).lean().exec();
    expect(doc?.status).toBe('closed');
    // Atomik filtre status:'active' içerdiği için her BAŞARILI katılım
    // yazımı halka aktifken gerçekleşmiştir; sayı birebir tutmalı.
    expect(doc?.memberIds).toHaveLength(ok + 1);
    for (const code of codes.keys()) {
      expect(code).toBe(CIRCLE_ERROR_CODE.NOT_ACTIVE);
    }

    // Kapandıktan sonra hiçbir katılım geçmez.
    const [late] = await seedUsers(1, 'Gec');
    await expectRejection(circlesService.join(late, circle.code), {
      code: CIRCLE_ERROR_CODE.NOT_ACTIVE,
      status: 403,
    });
  });

  // ------------------------------------------------------------------
  // 4) Aynı kullanıcı, aynı gün, sırasız paralel flush'lar
  // ------------------------------------------------------------------
  it('4) sırasız paralel flush: tek belge, count = max (66), geç yazım düşürmez', async () => {
    const { creatorId, dhikrId, circle } = await seedCircle();

    const counts = [5, 33, 12, 66, 40];
    const waves = [...counts, ...counts, ...counts];
    await Promise.all(
      waves.map((count) =>
        dhikrLogsService.create(
          logDto({ userId: creatorId, dhikrId, count, circleId: circle.id }),
        ),
      ),
    );

    const logs = await dhikrLogModel
      .find({ circleId: new Types.ObjectId(circle.id) })
      .lean()
      .exec();
    expect(logs.map((log) => log.count)).toEqual([66]);

    let doc = await circleModel.findById(circle.id).lean().exec();
    expect(doc?.totalCount).toBe(66);

    // Geç kalan küçük yazım: $max + {totalCount:{$lt}} ikisini de korur.
    await dhikrLogsService.create(
      logDto({ userId: creatorId, dhikrId, count: 10, circleId: circle.id }),
    );
    const after = await dhikrLogModel
      .find({ circleId: new Types.ObjectId(circle.id) })
      .lean()
      .exec();
    expect(after.map((log) => log.count)).toEqual([66]);
    doc = await circleModel.findById(circle.id).lean().exec();
    expect(doc?.totalCount).toBe(66);
  });

  // ------------------------------------------------------------------
  // 5) Çok üyeli paralel katkı + monotonluk
  // ------------------------------------------------------------------
  /**
   * DİKKAT: bu test GERÇEK bir hatayı yakalar (bkz. rapor). dhikr_logs
   * upsert anahtarını (userId + dhikrId + date + circleId) destekleyen UNIQUE
   * bir index YOK; MongoDB'de upsert yalnız unique index varsa atomiktir.
   * Eşzamanlı yazımlarda aynı anahtar için BİRDEN FAZLA belge insert edilir,
   * applyProgress hepsini toplayınca totalCount gerçek Σ max(üye) değerini
   * aşar ($max'ın "sayı düşmez" garantisi de belge bazında delinir).
   * Ham sürücü ölçümü: 5 paralel upsert'te bile 10 turun 7-8'inde duplicate.
   */
  it('5) 100 üye × 3 flush: totalCount = Σ max(üye) ve asla azalmaz', async () => {
    const { dhikrId, circle } = await seedCircle();
    const memberIds = await seedUsers(100);
    await Promise.all(
      memberIds.map((userId) => circlesService.join(userId, circle.code)),
    );

    const perMember = [10, 20, 30];
    const expectedTotal = memberIds.length * Math.max(...perMember);

    const samples: number[] = [];
    let sampling = true;
    const sampler = (async () => {
      while (sampling) {
        const doc = await circleModel
          .findById(circle.id)
          .select('totalCount')
          .lean()
          .exec();
        samples.push(doc?.totalCount ?? 0);
        await new Promise((resolve) => setTimeout(resolve, 5));
      }
    })();

    await Promise.all(
      memberIds.flatMap((userId) =>
        perMember.map((count) =>
          dhikrLogsService.create(
            logDto({ userId, dhikrId, count, circleId: circle.id }),
          ),
        ),
      ),
    );
    sampling = false;
    await sampler;

    const doc = await circleModel.findById(circle.id).lean().exec();
    const logs = await dhikrLogModel
      .find({ circleId: new Types.ObjectId(circle.id) })
      .lean()
      .exec();

    if (logs.length !== memberIds.length) {
      const perCount = logs.reduce((acc: Record<string, number>, log) => {
        acc[String(log.count)] = (acc[String(log.count)] ?? 0) + 1;
        return acc;
      }, {});

      console.error(
        `[halka BUG] ${logs.length} log belgesi (beklenen ${memberIds.length}), ` +
          `totalCount=${String(doc?.totalCount)} (beklenen ${expectedTotal}), ` +
          `count dagilimi=${JSON.stringify(perCount)} — eszamanli upsert duplicate belge yaratti.`,
      );
    }
    expect(logs.length).toBe(memberIds.length);
    expect(logs.every((log) => log.count === 30)).toBe(true);
    expect(doc?.totalCount).toBe(expectedTotal);

    for (let index = 1; index < samples.length; index += 1) {
      expect(samples[index]).toBeGreaterThanOrEqual(samples[index - 1]);
    }
    expect(samples.length).toBeGreaterThan(1);
  });

  // ------------------------------------------------------------------
  // 6) Hedef geçme yarışı
  // ------------------------------------------------------------------
  it('6) hedef 100, 20 üye × 10 paralel: completed, tek completedAt, tek push', async () => {
    const { dhikrId, circle } = await seedCircle({ goalCount: 100 });
    const memberIds = await seedUsers(20);
    await Promise.all(
      memberIds.map((userId) => circlesService.join(userId, circle.code)),
    );

    pushSender.sendToDevices.mockClear(); // katılım push'larını say dışı bırak

    const results = await Promise.allSettled(
      memberIds.map((userId) =>
        dhikrLogsService.create(
          logDto({ userId, dhikrId, count: 10, circleId: circle.id }),
        ),
      ),
    );
    const { ok } = summarize(results);

    const doc = await circleModel.findById(circle.id).lean().exec();
    expect(doc?.status).toBe('completed');
    expect(doc?.completedAt).toBeInstanceOf(Date);
    expect(doc?.totalCount).toBeGreaterThanOrEqual(100);
    expect(doc?.totalCount).toBe(ok * 10);
    expect(countPush('hedefini tamamladı')).toBe(1);
    expect(pushTitles()).toHaveLength(1);
  });

  // ------------------------------------------------------------------
  // 7) Tamamlanmış / kapalı / süresi geçmiş halkaya katkı
  // ------------------------------------------------------------------
  it('7) completed / closed / endDate geçmiş: CIRCLE_NOT_ACTIVE, yeni log yok', async () => {
    const { creatorId, dhikrId, circle } = await seedCircle({ goalCount: 10 });
    const circleObjectId = new Types.ObjectId(circle.id);

    // hedefi doldur → completed
    await dhikrLogsService.create(
      logDto({ userId: creatorId, dhikrId, count: 10, circleId: circle.id }),
    );
    const completed = await circleModel.findById(circle.id).lean().exec();
    expect(completed?.status).toBe('completed');

    const totalBefore = completed?.totalCount ?? 0;
    const logsBefore = await dhikrLogModel.countDocuments({
      circleId: circleObjectId,
    });

    await expectRejection(
      dhikrLogsService.create(
        logDto({ userId: creatorId, dhikrId, count: 99, circleId: circle.id }),
      ),
      { code: CIRCLE_ERROR_CODE.NOT_ACTIVE },
    );
    expect(
      await dhikrLogModel.countDocuments({ circleId: circleObjectId }),
    ).toBe(logsBefore);
    expect(
      (await circleModel.findById(circle.id).lean().exec())?.totalCount,
    ).toBe(totalBefore);

    // closed
    const closed = await seedCircleFor(creatorId, dhikrId);
    await circlesService.close(creatorId, closed.id);
    await expectRejection(
      dhikrLogsService.create(
        logDto({ userId: creatorId, dhikrId, count: 5, circleId: closed.id }),
      ),
      { code: CIRCLE_ERROR_CODE.NOT_ACTIVE },
    );

    // endDate dün (create ileri tarih ister; doğrudan DB'ye yazıyoruz)
    const expired = await seedCircleFor(creatorId, dhikrId);
    await circleModel
      .updateOne(
        { _id: new Types.ObjectId(expired.id) },
        { $set: { endDate: shiftDateKey(today, -1) } },
      )
      .exec();
    await expectRejection(
      dhikrLogsService.create(
        logDto({ userId: creatorId, dhikrId, count: 5, circleId: expired.id }),
      ),
      { code: CIRCLE_ERROR_CODE.NOT_ACTIVE },
    );
    expect(
      await dhikrLogModel.countDocuments({
        circleId: new Types.ObjectId(expired.id),
      }),
    ).toBe(0);
  });

  async function seedCircleFor(creatorId: string, dhikrId: string) {
    return circlesService.create(creatorId, {
      name: `Halka ${new Types.ObjectId().toString().slice(-6)}`,
      dhikrId,
      goalCount: 1_000_000,
    });
  }

  // ------------------------------------------------------------------
  // 8) Yetki / doğrulama hataları
  // ------------------------------------------------------------------
  it('8) üye değil / zikir uyuşmuyor / vird+halka / bulk+circleId', async () => {
    const { creatorId, dhikrId, circle } = await seedCircle();
    const [outsider] = await seedUsers(1, 'Yabanci');
    const otherDhikrId = await seedDhikr('baska-zikir');

    await expectRejection(
      dhikrLogsService.create(
        logDto({ userId: outsider, dhikrId, count: 5, circleId: circle.id }),
      ),
      { code: CIRCLE_ERROR_CODE.NOT_MEMBER },
    );

    await expectRejection(
      dhikrLogsService.create(
        logDto({
          userId: creatorId,
          dhikrId: otherDhikrId,
          count: 5,
          circleId: circle.id,
        }),
      ),
      { code: CIRCLE_ERROR_CODE.DHIKR_MISMATCH, status: 400 },
    );

    await expectRejection(
      dhikrLogsService.create(
        logDto({
          userId: creatorId,
          dhikrId,
          count: 5,
          circleId: circle.id,
          virdProgramId: new Types.ObjectId().toString(),
          virdSlot: 'morning',
        }),
      ),
      { status: 400 },
    );

    await expectRejection(
      dhikrLogsService.createBulk({
        items: [
          logDto({ userId: creatorId, dhikrId, count: 5, circleId: circle.id }),
        ],
      }),
      { status: 400 },
    );

    expect(await dhikrLogModel.countDocuments({})).toBe(0);
  });

  // ------------------------------------------------------------------
  // 9) Sade log vs halka logu izolasyonu
  // ------------------------------------------------------------------
  it('9) sade log (999) ve halka logu (5) ayrı belgelerdir; toplam 5', async () => {
    const { creatorId, dhikrId, circle } = await seedCircle();

    await dhikrLogsService.create(
      logDto({ userId: creatorId, dhikrId, count: 999, source: 'manual' }),
    );
    await dhikrLogsService.create(
      logDto({ userId: creatorId, dhikrId, count: 5, circleId: circle.id }),
    );

    const logs = await dhikrLogModel
      .find({ userId: new Types.ObjectId(creatorId), date: today })
      .lean()
      .exec();
    expect(logs).toHaveLength(2);
    expect(logs.filter((log) => log.circleId)).toHaveLength(1);
    expect(logs.find((log) => !log.circleId)?.count).toBe(999);

    const doc = await circleModel.findById(circle.id).lean().exec();
    expect(doc?.totalCount).toBe(5);
  });

  // ------------------------------------------------------------------
  // 10) Ayrılan üyenin katkısı kalır
  // ------------------------------------------------------------------
  it('10) leave: üye listesi küçülür, totalCount ve log korunur', async () => {
    const { dhikrId, circle } = await seedCircle();
    const [memberId] = await seedUsers(1, 'Ayrilan');
    await circlesService.join(memberId, circle.code);
    await dhikrLogsService.create(
      logDto({ userId: memberId, dhikrId, count: 20, circleId: circle.id }),
    );

    await circlesService.leave(memberId, circle.id);

    const doc = await circleModel.findById(circle.id).lean().exec();
    expect(doc?.memberIds).toHaveLength(1);
    expect(doc?.totalCount).toBe(20);

    const log = await dhikrLogModel
      .findOne({ userId: new Types.ObjectId(memberId) })
      .lean()
      .exec();
    expect(String(log?.circleId)).toBe(circle.id);
    expect(log?.count).toBe(20);
  });

  // ------------------------------------------------------------------
  // 11) Kod benzersizliği + E11000 retry yolu
  // ------------------------------------------------------------------
  it('11) 30 paralel create: tüm kodlar benzersiz ve alfabeye uygun', async () => {
    const dhikrId = await seedDhikr('kod-zikri');
    // Kurucu başına CIRCLE_MAX_ACTIVE_PER_CREATOR tavanı var → 3 kurucu × 10.
    const creators = await Promise.all([
      seedUser('K1', true),
      seedUser('K2', true),
      seedUser('K3', true),
    ]);
    const jobs = creators.flatMap((creatorId) =>
      Array.from({ length: CIRCLE_MAX_ACTIVE_PER_CREATOR }, () =>
        circlesService.create(creatorId, { dhikrId, goalCount: 1000 }),
      ),
    );

    const results = await Promise.allSettled(jobs);
    const { ok, values } = summarize(results);
    expect(ok).toBe(30);

    const codes = values.map((summary) => summary.code);
    expect(new Set(codes).size).toBe(30);
    for (const code of codes) {
      expect(code).toMatch(/^[A-HJ-NP-Z2-9]{8}$/);
    }
  });

  it('11b) E11000 retry: çakışan ilk kod atlanır, ikinci kodla kurulur', async () => {
    const dhikrId = await seedDhikr('retry-zikri');
    const creatorId = await seedUser('Retry', true);
    const taken = 'ZZZZZZZZ';
    await circleModel.create({
      name: 'Çakışan',
      dhikrId: new Types.ObjectId(dhikrId),
      goalCount: 10,
      creatorId: new Types.ObjectId(creatorId),
      code: taken,
      memberIds: [new Types.ObjectId(creatorId)],
    });

    const spy = jest
      .spyOn(circleConstants, 'generateCircleCode')
      .mockReturnValueOnce(taken);
    try {
      const created = await circlesService.create(creatorId, {
        dhikrId,
        goalCount: 10,
      });
      expect(spy).toHaveBeenCalledTimes(2); // 1. deneme E11000, 2. deneme başarılı
      expect(created.code).not.toBe(taken);
      expect(created.code).toMatch(/^[A-HJ-NP-Z2-9]{8}$/);
    } finally {
      spy.mockRestore();
    }
  });

  // ------------------------------------------------------------------
  // 12) Kurucu başına aktif halka tavanı
  // ------------------------------------------------------------------
  it('12) 10 aktif halka → 11. CIRCLE_MAX_ACTIVE; kapatınca yeni açılır', async () => {
    const dhikrId = await seedDhikr('tavan-zikri');
    const creatorId = await seedUser('Tavan', true);

    const created: { id: string }[] = [];
    for (let index = 0; index < CIRCLE_MAX_ACTIVE_PER_CREATOR; index += 1) {
      created.push(
        await circlesService.create(creatorId, { dhikrId, goalCount: 100 }),
      );
    }
    await expectRejection(
      circlesService.create(creatorId, { dhikrId, goalCount: 100 }),
      { code: CIRCLE_ERROR_CODE.MAX_ACTIVE },
    );

    await circlesService.close(creatorId, created[0].id);
    await expect(
      circlesService.create(creatorId, { dhikrId, goalCount: 100 }),
    ).resolves.toBeDefined();
  });

  it('12b) BİLİNEN SAPMA: 9 aktifken 5 paralel create tavanı aşabilir (sayım+insert atomik değil)', async () => {
    const dhikrId = await seedDhikr('sapma-zikri');
    const creatorId = await seedUser('Sapma', true);
    for (let index = 0; index < CIRCLE_MAX_ACTIVE_PER_CREATOR - 1; index += 1) {
      await circlesService.create(creatorId, { dhikrId, goalCount: 100 });
    }

    const results = await Promise.allSettled(
      Array.from({ length: 5 }, () =>
        circlesService.create(creatorId, { dhikrId, goalCount: 100 }),
      ),
    );
    // Kabul edilen sapma (bkz. circles.service.ts create yorumu): tavan bir
    // miktar aşılabilir. Bozulmaması gereken: çökme yok, kodlar benzersiz.
    const { values, codes } = summarize(results);
    for (const code of codes.keys()) {
      expect(code).toBe(CIRCLE_ERROR_CODE.MAX_ACTIVE);
    }
    const all = await circleModel
      .find({ creatorId: new Types.ObjectId(creatorId) })
      .lean()
      .exec();
    expect(new Set(all.map((doc) => doc.code)).size).toBe(all.length);
    expect(all.length).toBeGreaterThanOrEqual(
      CIRCLE_MAX_ACTIVE_PER_CREATOR - 1 + values.length,
    );
  });

  // ------------------------------------------------------------------
  // 13) preview
  // ------------------------------------------------------------------
  it('13) preview kişisel veri sızdırmaz; kod normalize edilir; bilinmeyen kod 404', async () => {
    const { circle } = await seedCircle({ name: 'Önizleme' });

    const preview = await circlesService.preview(
      `  ${circle.code.toLowerCase()}  `,
    );
    expect(Object.keys(preview).sort()).toEqual([
      'dhikr',
      'goalCount',
      'memberCount',
      'name',
      'status',
      'totalCount',
    ]);
    expect(preview.memberCount).toBe(1);
    expect(preview.name).toBe('Önizleme');

    await expectRejection(circlesService.preview('QQQQQQQQ'), {
      status: 404,
    });
    await expectRejection(circlesService.preview('abc!'), { status: 404 });
  });

  // ------------------------------------------------------------------
  // 15) uniq_log_key: sade ve vird anahtarları da duplicate üretmemeli
  // ------------------------------------------------------------------
  it('15) sade log, 40 paralel yazım: tek belge (son yazan kazanır)', async () => {
    const creatorId = await seedUser('Sade', true);
    const dhikrId = await seedDhikr('sade-zikri');
    const counts = Array.from({ length: 40 }, (_, index) => index + 1);

    await Promise.all(
      counts.map((count) =>
        dhikrLogsService.create(
          logDto({ userId: creatorId, dhikrId, count, source: 'manual' }),
        ),
      ),
    );

    const logs = await dhikrLogModel.find({}).lean().exec();
    expect(logs.length).toBe(1);
    // Halka logundan FARKLI: sade yolda count $set'tir ($max değil), yani son
    // yazan kazanır. Garanti edilen tek şey belgenin tek olmasıdır.
    expect(counts).toContain(logs[0].count);
    expect(logs[0].circleId).toBeUndefined();
  });

  it('15b) vird anahtarlı log, 40 paralel yazım: tek belge', async () => {
    const creatorId = await seedUser('Vird', true);
    const dhikrId = await seedDhikr('vird-zikri');
    const virdProgramId = new Types.ObjectId().toString();

    await Promise.all(
      Array.from({ length: 40 }, (_, index) =>
        dhikrLogsService.create(
          logDto({
            userId: creatorId,
            dhikrId,
            count: index + 1,
            source: 'manual',
            virdProgramId,
            virdSlot: 'morning',
          }),
        ),
      ),
    );

    const logs = await dhikrLogModel.find({}).lean().exec();
    expect(logs.length).toBe(1);
    expect(String(logs[0].virdProgramId)).toBe(virdProgramId);
    expect(logs[0].virdPrayerIndex).toBeNull();
  });

  it('15c) ham sürücü kalibrasyonu: uniq_log_key ile hiç duplicate belge oluşmuyor', async () => {
    const collection = dhikrLogModel.collection;
    const userId = new Types.ObjectId();
    const dhikrId = new Types.ObjectId();

    for (const parallel of [5, 20, 80]) {
      for (let round = 0; round < 5; round += 1) {
        await collection.deleteMany({});
        const key = { userId, date: today, dhikrId };
        const results = await Promise.allSettled(
          Array.from({ length: parallel }, (_, index) =>
            collection.findOneAndUpdate(
              key,
              {
                $max: { count: index },
                $setOnInsert: { targetCount: 100, source: 'manual' },
              },
              { upsert: true, returnDocument: 'after' },
            ),
          ),
        );

        // Index ÖNCESİ bu ölçüm 5 paralelde bile 10 turun 7-8'inde İKİNCİ bir
        // belge yaratıyordu. Şimdi belge her turda tam 1: yarışı kaybeden
        // insert E11000 ile reddediliyor. Ham sürücüde tekrar deneme yok —
        // servis tarafındaki upsertLogOnce tam olarak bu E11000'i yutup aynı
        // filtreyle yeniden yazdığı için çağıran hata görmez.
        expect(await collection.countDocuments({})).toBe(1);
        for (const result of results) {
          if (result.status === 'rejected') {
            expect((result.reason as { code?: number } | undefined)?.code).toBe(
              11000,
            );
          }
        }
      }
    }
    await collection.deleteMany({});
  });

  // ------------------------------------------------------------------
  // 14) Tembel süre sonu
  // ------------------------------------------------------------------
  it('14) endDate dün olan halka findMine ile kapanır; katkı reddedilir', async () => {
    const { creatorId, dhikrId, circle } = await seedCircle();
    await circleModel
      .updateOne(
        { _id: new Types.ObjectId(circle.id) },
        { $set: { endDate: shiftDateKey(today, -1) } },
      )
      .exec();

    const mine = await circlesService.findMine(creatorId);
    expect(mine.find((item) => item.id === circle.id)?.status).toBe('closed');
    expect((await circleModel.findById(circle.id).lean().exec())?.status).toBe(
      'closed',
    );

    await expectRejection(
      dhikrLogsService.create(
        logDto({ userId: creatorId, dhikrId, count: 5, circleId: circle.id }),
      ),
      { code: CIRCLE_ERROR_CODE.NOT_ACTIVE },
    );
  });
});
