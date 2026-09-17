import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Types, type Model } from 'mongoose';
import type { LocalizedText } from '../../common/types/localized-text';
import { istanbulDateKey } from '../../common/utils/date-keys';
import { DevicesService } from '../devices/devices.service';
import {
  DhikrLog,
  type DhikrLogDocument,
} from '../dhikr-logs/schemas/dhikr-log.schema';
import { Dhikr, type DhikrDocument } from '../dhikrs/schemas/dhikr.schema';
import { PushSenderService } from '../push/push-sender.service';
import { User, type UserDocument } from '../users/schemas/user.schema';
import {
  CIRCLE_ERROR_CODE,
  CIRCLE_ERROR_MESSAGE,
  CIRCLE_MAX_ACTIVE_PER_CREATOR,
  CIRCLE_MAX_MEMBERS,
  circleCompletedPush,
  circleMemberJoinedPush,
  generateCircleCode,
  type CircleErrorCode,
} from './circles.constants';
import { CreateCircleDto } from './dto/create-circle.dto';
import {
  Circle,
  type CircleDocument,
  type CircleStatus,
} from './schemas/circle.schema';

// packages/shared/src/types/circle.ts içindeki istemci tiplerinin sunucu
// aynası — yanıt şekilleri birebir bunlardır.
export type CircleDhikrSnapshot = {
  name: LocalizedText;
  nameArabic?: string;
  transliteration?: LocalizedText;
  meaning?: LocalizedText;
};

export type CirclePreview = {
  name: string;
  dhikr: CircleDhikrSnapshot;
  goalCount: number;
  totalCount: number;
  memberCount: number;
  status: CircleStatus;
};

export type CircleSummary = CirclePreview & {
  id: string;
  code: string;
  dhikrId: string;
  endDate?: string;
  myTotal: number;
  creatorId: string;
  isCreator: boolean;
};

export type CircleDetail = CircleSummary & {
  members: { displayName: string }[];
  myTodayCount: number;
};

type CircleLean = {
  _id: Types.ObjectId;
  name: string;
  dhikrId: Types.ObjectId;
  goalCount: number;
  endDate?: string;
  creatorId: Types.ObjectId;
  code: string;
  memberIds: Types.ObjectId[];
  totalCount: number;
  status: CircleStatus;
};

type DhikrSnapshotLean = {
  _id: Types.ObjectId;
  name?: LocalizedText;
  nameArabic?: string;
  transliteration?: LocalizedText;
  meaning?: LocalizedText;
};

const DHIKR_SNAPSHOT_FIELDS = 'name nameArabic transliteration meaning';
const CODE_ATTEMPTS = 3;

@Injectable()
export class CirclesService {
  private readonly logger = new Logger(CirclesService.name);

  constructor(
    @InjectModel(Circle.name)
    private readonly circleModel: Model<CircleDocument>,
    @InjectModel(DhikrLog.name)
    private readonly dhikrLogModel: Model<DhikrLogDocument>,
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    @InjectModel(Dhikr.name) private readonly dhikrModel: Model<DhikrDocument>,
    private readonly devicesService: DevicesService,
    private readonly pushSender: PushSenderService,
  ) {}

  async create(userId: string, dto: CreateCircleDto): Promise<CircleSummary> {
    const userObjectId = this.asObjectId(userId);

    if (!(await this.isPremiumUser(userObjectId))) {
      throw this.forbidden(CIRCLE_ERROR_CODE.PREMIUM_REQUIRED);
    }

    const dhikr = await this.dhikrModel
      .findById(this.asObjectId(dto.dhikrId))
      .select(`${DHIKR_SNAPSHOT_FIELDS} isActive`)
      .lean()
      .exec();
    if (!dhikr || dhikr.isActive === false) {
      throw new NotFoundException('Zikir bulunamadı.');
    }

    // Kurucu başına aktif halka tavanı. Not: sayım + insert tek bir atomik
    // işlem DEĞİLDİR (Mongo'da "koşullu insert" yok) — aynı anda gelen iki
    // istek tavanı bir aşabilir. Kabul edilen sapma: sonuç yalnız fazladan
    // bir halkadır, paylaşılan bir sayacı bozmaz.
    const activeCount = await this.circleModel.countDocuments({
      creatorId: userObjectId,
      status: 'active',
    });
    if (activeCount >= CIRCLE_MAX_ACTIVE_PER_CREATOR) {
      throw this.forbidden(CIRCLE_ERROR_CODE.MAX_ACTIVE);
    }

    if (dto.endDate && dto.endDate < istanbulDateKey(new Date())) {
      throw new BadRequestException('Bitiş tarihi geçmiş bir gün olamaz.');
    }

    const name = dto.name?.trim() || localizedTr(dhikr.name);

    for (let attempt = 0; attempt < CODE_ATTEMPTS; attempt += 1) {
      try {
        const created = await this.circleModel.create({
          name,
          dhikrId: dhikr._id,
          goalCount: dto.goalCount,
          endDate: dto.endDate,
          creatorId: userObjectId,
          code: generateCircleCode(),
          memberIds: [userObjectId],
        });
        return this.toSummary(created.toObject(), dhikr, 0, userObjectId);
      } catch (error) {
        // Kod çakışması (unique index): yeni kod üretip tekrar dener.
        if (!isDuplicateKeyError(error)) {
          throw error;
        }
      }
    }

    throw new ConflictException(
      'Halka davet kodu üretilemedi, lütfen tekrar dene.',
    );
  }

  async findMine(userId: string): Promise<CircleSummary[]> {
    const userObjectId = this.asObjectId(userId);
    const today = istanbulDateKey(new Date());

    // Tembel süre sonu: bitiş tarihi geçmiş aktif halkaları kapatır. Tek
    // atomik updateMany + koruyucu filtre — okuma/yazma ayrımı yok.
    await this.circleModel
      .updateMany(
        { memberIds: userObjectId, status: 'active', endDate: { $lt: today } },
        { $set: { status: 'closed' } },
      )
      .exec();

    const circles = (await this.circleModel
      .find({ memberIds: userObjectId })
      .sort({ createdAt: -1 })
      .lean()
      .exec()) as unknown as CircleLean[];
    if (circles.length === 0) {
      return [];
    }

    const [totals, dhikrs] = await Promise.all([
      this.myTotals(
        userObjectId,
        circles.map((circle) => circle._id),
      ),
      this.dhikrModel
        .find({ _id: { $in: circles.map((circle) => circle.dhikrId) } })
        .select(DHIKR_SNAPSHOT_FIELDS)
        .lean()
        .exec(),
    ]);
    const dhikrById = new Map(
      (dhikrs as unknown as DhikrSnapshotLean[]).map((dhikr) => [
        String(dhikr._id),
        dhikr,
      ]),
    );

    return circles.map((circle) =>
      this.toSummary(
        circle,
        dhikrById.get(String(circle.dhikrId)),
        totals.get(String(circle._id)) ?? 0,
        userObjectId,
      ),
    );
  }

  async findOne(userId: string, id: string): Promise<CircleDetail> {
    const userObjectId = this.asObjectId(userId);
    const circle = (await this.circleModel
      .findOne({ _id: this.asObjectId(id), memberIds: userObjectId })
      .lean()
      .exec()) as CircleLean | null;
    if (!circle) {
      throw this.notFound();
    }

    const [summary, members, todayLog] = await Promise.all([
      this.buildSummary(userObjectId, circle),
      this.userModel
        .find({ _id: { $in: circle.memberIds } })
        .select('displayName')
        .lean()
        .exec(),
      this.dhikrLogModel
        .findOne({
          userId: userObjectId,
          circleId: circle._id,
          date: istanbulDateKey(new Date()),
        })
        .select('count')
        .lean()
        .exec(),
    ]);

    return {
      ...summary,
      members: members.map((member) => ({ displayName: member.displayName })),
      myTodayCount: todayLog?.count ?? 0,
    };
  }

  /** Herkese açık uç: kişisel hiçbir veri (üye listesi, kod, myTotal) dönmez. */
  async preview(code: string): Promise<CirclePreview> {
    const circle = (await this.circleModel
      .findOne({ code: normalizeCode(code) })
      .lean()
      .exec()) as CircleLean | null;
    if (!circle) {
      throw this.notFound();
    }
    const dhikr = await this.findDhikrSnapshot(circle.dhikrId);
    return {
      name: circle.name,
      dhikr: toSnapshot(dhikr),
      goalCount: circle.goalCount,
      totalCount: circle.totalCount,
      memberCount: circle.memberIds.length,
      status: circle.status,
    };
  }

  async join(userId: string, code: string): Promise<CircleSummary> {
    const userObjectId = this.asObjectId(userId);
    const circle = (await this.circleModel
      .findOne({ code: normalizeCode(code) })
      .lean()
      .exec()) as CircleLean | null;
    if (!circle) {
      throw this.notFound();
    }

    // Zaten üye: idempotent, yazım da push de yok.
    if (circle.memberIds.some((memberId) => memberId.equals(userObjectId))) {
      return this.buildSummary(userObjectId, circle);
    }
    if (circle.status !== 'active') {
      throw this.forbidden(CIRCLE_ERROR_CODE.NOT_ACTIVE);
    }

    // TEK atomik yazım: durum ve kapasite kontrolü filtrenin İÇİNDE. İki
    // eşzamanlı katılım isteği 200. sırayı paylaşamaz; $expr/$size sunucuda
    // değerlendirilir. returnDocument:'before' — dönen belge yazımdan
    // ÖNCEKİ halidir, yani memberIds'te kendimizi görmüyorsak üyeliği
    // gerçekten bu çağrı eklemiştir (push tam bir kez gider).
    const before = (await this.circleModel
      .findOneAndUpdate(
        {
          _id: circle._id,
          status: 'active',
          $expr: { $lt: [{ $size: '$memberIds' }, CIRCLE_MAX_MEMBERS] },
        },
        { $addToSet: { memberIds: userObjectId } },
        { returnDocument: 'before' },
      )
      .lean()
      .exec()) as CircleLean | null;

    if (!before) {
      const current = await this.circleModel
        .findById(circle._id)
        .select('status')
        .lean()
        .exec();
      throw this.forbidden(
        current?.status === 'active'
          ? CIRCLE_ERROR_CODE.FULL
          : CIRCLE_ERROR_CODE.NOT_ACTIVE,
      );
    }

    const wasMember = before.memberIds.some((memberId) =>
      memberId.equals(userObjectId),
    );
    if (!wasMember) {
      const joiner = await this.userModel
        .findById(userObjectId)
        .select('displayName')
        .lean()
        .exec();
      await this.notify(
        [String(before.creatorId)],
        circleMemberJoinedPush(
          joiner?.displayName ?? 'Bir kardeşin',
          before.name,
        ),
        String(before._id),
      );
    }

    return this.buildSummary(userObjectId, {
      ...before,
      memberIds: wasMember
        ? before.memberIds
        : [...before.memberIds, userObjectId],
    });
  }

  async leave(userId: string, id: string) {
    const userObjectId = this.asObjectId(userId);
    const circleId = this.asObjectId(id);
    const circle = await this.circleModel
      .findOne({ _id: circleId, memberIds: userObjectId })
      .select('creatorId')
      .lean()
      .exec();
    if (!circle) {
      throw this.notFound();
    }
    if (circle.creatorId.equals(userObjectId)) {
      throw this.forbidden(CIRCLE_ERROR_CODE.CREATOR_ONLY);
    }

    // Loglar ve totalCount'a dokunulmaz: ayrılan üyenin geçmiş katkısı
    // halkanın ortak toplamında kalır (totalCount monoton).
    await this.circleModel
      .updateOne(
        { _id: circleId, memberIds: userObjectId },
        { $pull: { memberIds: userObjectId } },
      )
      .exec();

    return { left: true };
  }

  async close(userId: string, id: string): Promise<CircleSummary> {
    const userObjectId = this.asObjectId(userId);
    const closed = (await this.circleModel
      .findOneAndUpdate(
        {
          _id: this.asObjectId(id),
          creatorId: userObjectId,
          status: 'active',
        },
        { $set: { status: 'closed' } },
        { returnDocument: 'after' },
      )
      .lean()
      .exec()) as CircleLean | null;
    if (!closed) {
      throw this.notFound();
    }
    return this.buildSummary(userObjectId, closed);
  }

  /**
   * Bir dhikr log'u halkaya yazılmadan ÖNCE çağrılır (bkz.
   * dhikr-logs.service.ts create).
   */
  async assertCanContribute(
    userId: string,
    circleId: string,
    dhikrId?: string,
  ) {
    const userObjectId = this.asObjectId(userId);
    const circle = await this.circleModel
      .findOne({ _id: this.asObjectId(circleId), memberIds: userObjectId })
      .select('status dhikrId endDate')
      .lean()
      .exec();
    if (!circle) {
      throw this.forbidden(CIRCLE_ERROR_CODE.NOT_MEMBER);
    }
    if (
      circle.status !== 'active' ||
      (circle.endDate && circle.endDate < istanbulDateKey(new Date()))
    ) {
      throw this.forbidden(CIRCLE_ERROR_CODE.NOT_ACTIVE);
    }
    if (!dhikrId || !circle.dhikrId.equals(dhikrId)) {
      throw new BadRequestException({
        code: CIRCLE_ERROR_CODE.DHIKR_MISMATCH,
        message: CIRCLE_ERROR_MESSAGE[CIRCLE_ERROR_CODE.DHIKR_MISMATCH],
      });
    }
  }

  /**
   * Log yazımından sonra (best-effort, çağıran yutar) ortak toplamı tazeler
   * ve hedef dolduysa halkayı tamamlar.
   */
  async applyProgress(circleId: string) {
    const circleObjectId = this.asObjectId(circleId);
    const rows = await this.dhikrLogModel
      .aggregate<{
        _id: null;
        total: number;
      }>([
        { $match: { circleId: circleObjectId } },
        { $group: { _id: null, total: { $sum: '$count' } } },
      ])
      .exec();
    const total = rows[0]?.total ?? 0;

    // MONOTON önbellek. $inc DEĞİL (eşzamanlı iki çağrı aynı toplamı iki kez
    // eklerdi) ve koşulsuz $set DEĞİL (geç kalan bir çağrı daha küçük bir
    // toplamı geri yazardı). {totalCount:{$lt: total}} filtresi yazımı
    // sunucuda tek bir atomik adımda koşula bağlar.
    await this.circleModel
      .updateOne(
        { _id: circleObjectId, totalCount: { $lt: total } },
        { $set: { totalCount: total } },
      )
      .exec();

    const circle = await this.circleModel
      .findById(circleObjectId)
      .select('goalCount name memberIds')
      .lean()
      .exec();
    if (!circle || total < circle.goalCount) {
      return;
    }

    // Tamamlanma da tek atomik adım: {status:'active', completedAt:null}
    // filtresi yarışan ikinci çağrıya null döndürür — push tam bir kez gider.
    const completed = await this.circleModel
      .findOneAndUpdate(
        { _id: circleObjectId, status: 'active', completedAt: null },
        { $set: { status: 'completed', completedAt: new Date() } },
        { returnDocument: 'after' },
      )
      .lean()
      .exec();
    if (!completed) {
      return;
    }

    await this.notify(
      circle.memberIds.map(String),
      circleCompletedPush(circle.name),
      String(circleObjectId),
    );
  }

  // --- helpers ---

  private async isPremiumUser(objectId: Types.ObjectId): Promise<boolean> {
    const user = await this.userModel
      .findById(objectId)
      .select('isPremium')
      .lean()
      .exec();
    return Boolean(user?.isPremium);
  }

  private async buildSummary(
    userObjectId: Types.ObjectId,
    circle: CircleLean,
  ): Promise<CircleSummary> {
    const [dhikr, totals] = await Promise.all([
      this.findDhikrSnapshot(circle.dhikrId),
      this.myTotals(userObjectId, [circle._id]),
    ]);
    return this.toSummary(
      circle,
      dhikr,
      totals.get(String(circle._id)) ?? 0,
      userObjectId,
    );
  }

  private async findDhikrSnapshot(dhikrId: Types.ObjectId) {
    return (await this.dhikrModel
      .findById(dhikrId)
      .select(DHIKR_SNAPSHOT_FIELDS)
      .lean()
      .exec()) as DhikrSnapshotLean | null;
  }

  /** İsteği yapan kullanıcının halka başına kendi toplamı. */
  private async myTotals(
    userObjectId: Types.ObjectId,
    circleIds: Types.ObjectId[],
  ): Promise<Map<string, number>> {
    if (circleIds.length === 0) {
      return new Map();
    }
    const rows = await this.dhikrLogModel
      .aggregate<{
        _id: Types.ObjectId;
        total: number;
      }>([
        { $match: { userId: userObjectId, circleId: { $in: circleIds } } },
        { $group: { _id: '$circleId', total: { $sum: '$count' } } },
      ])
      .exec();
    return new Map(rows.map((row) => [String(row._id), row.total]));
  }

  private toSummary(
    circle: CircleLean,
    dhikr: DhikrSnapshotLean | null | undefined,
    myTotal: number,
    userObjectId: Types.ObjectId,
  ): CircleSummary {
    return {
      id: String(circle._id),
      code: circle.code,
      name: circle.name,
      dhikrId: String(circle.dhikrId),
      dhikr: toSnapshot(dhikr),
      goalCount: circle.goalCount,
      totalCount: circle.totalCount,
      memberCount: circle.memberIds.length,
      status: circle.status,
      endDate: circle.endDate,
      myTotal,
      creatorId: String(circle.creatorId),
      isCreator: circle.creatorId.equals(userObjectId),
    };
  }

  /** Push gönderimi asla akışı bozmaz (bkz. safeApplyVirdProgress deseni). */
  private async notify(
    userIds: string[],
    message: { title: string; body: string },
    circleId: string,
  ) {
    try {
      const devices = await this.devicesService.findActiveByUserIds(userIds);
      const targets = devices
        .filter((device) => Boolean(device.expoPushToken))
        .map((device) => ({
          deviceId: device.deviceId,
          expoPushToken: device.expoPushToken as string,
        }));
      if (targets.length === 0) {
        return;
      }
      await this.pushSender.sendToDevices(targets, {
        ...message,
        data: { route: `/circle/${circleId}` },
      });
    } catch (error) {
      this.logger.warn(
        `circle push failed: ${error instanceof Error ? error.message : error}`,
      );
    }
  }

  private forbidden(code: CircleErrorCode) {
    return new ForbiddenException({
      code,
      message: CIRCLE_ERROR_MESSAGE[code],
    });
  }

  private notFound() {
    return new NotFoundException({
      code: CIRCLE_ERROR_CODE.NOT_FOUND,
      message: CIRCLE_ERROR_MESSAGE[CIRCLE_ERROR_CODE.NOT_FOUND],
    });
  }

  private asObjectId(rawId: string) {
    if (!Types.ObjectId.isValid(rawId)) {
      throw this.notFound();
    }
    return new Types.ObjectId(rawId);
  }
}

function normalizeCode(code: string) {
  // Tire/boşluk gibi ayraçlar atılır ("ABCD-EFGH", "abcd efgh"): istemci de
  // aynı toleransı uygular (parseCircleCode), sunucu ham girdiyi de kabul eder.
  return code.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
}

function localizedTr(value: LocalizedText | string | undefined): string {
  if (!value) {
    return '';
  }
  return typeof value === 'string' ? value : value.tr;
}

function toSnapshot(
  dhikr: DhikrSnapshotLean | null | undefined,
): CircleDhikrSnapshot {
  return {
    name: dhikr?.name ?? { tr: '', en: '' },
    nameArabic: dhikr?.nameArabic,
    transliteration: dhikr?.transliteration,
    meaning: dhikr?.meaning,
  };
}

function isDuplicateKeyError(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    (error as { code?: number }).code === 11000
  );
}
