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
import {
  STATS_TIMEZONE,
  dateKeyInZone,
  isValidDateKey,
  requestTimezone,
  shiftDateKey,
  startOfDayInZone,
  todayKey,
} from '../../common/utils/date-keys';
import { DevicesService } from '../devices/devices.service';
import {
  DhikrLog,
  type DhikrLogDocument,
} from '../dhikr-logs/schemas/dhikr-log.schema';
import { Dhikr, type DhikrDocument } from '../dhikrs/schemas/dhikr.schema';
import type { PushLocale } from '../push-campaigns/templates';
import { PushSenderService } from '../push/push-sender.service';
import {
  GUEST_DISPLAY_NAME,
  User,
  type UserDocument,
} from '../users/schemas/user.schema';
import {
  CIRCLE_ERROR_CODE,
  CIRCLE_ERROR_MESSAGE,
  CIRCLE_FREE_MAX_ACTIVE_PER_CREATOR,
  CIRCLE_FREE_MAX_MEMBERS,
  CIRCLE_MAX_ACTIVE_PER_CREATOR,
  CIRCLE_MAX_MEMBERS,
  circleCompletedPush,
  circleFounderTransferredPush,
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
  // null: kullanıcı ad vermedi; istemci dhikr.name'den yerel etiket üretir.
  name: string | null;
  dhikr: CircleDhikrSnapshot;
  goalCount: number;
  totalCount: number;
  memberCount: number;
  memberLimit: number;
  status: CircleStatus;
};

export type CircleSummary = CirclePreview & {
  id: string;
  code: string;
  dhikrId: string;
  endDate?: string;
  expiresAt?: string;
  myTotal: number;
  creatorId: string;
  isCreator: boolean;
};

export type CircleDetail = CircleSummary & {
  // defaultName: displayName kullanıcının seçmediği varsayılan ad; istemci
  // kendi dilinde genel bir ad gösterir. displayName eski sürümler için
  // aynen döner.
  members: {
    displayName: string;
    activeToday: boolean;
    defaultName?: true;
  }[];
  activeTodayCount: number;
  myTodayCount: number;
};

type CircleLean = {
  _id: Types.ObjectId;
  name?: string | null;
  dhikrId: Types.ObjectId;
  goalCount: number;
  endDate?: string;
  expiresAt?: Date;
  creatorId: Types.ObjectId;
  code: string;
  memberIds: Types.ObjectId[];
  memberLimit: number;
  totalCount: number;
  status: CircleStatus;
  expiredAt?: Date;
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
// Süre sonu halka başına TEK bir andır (tüm üyeler için ortak): endDate
// gününün kurucunun saat dilimindeki sonu, kuruluşta expiresAt olarak
// saklanır. expiresAt'i olmayan eski belgeler İstanbul günüyle kapanır.
const LEGACY_CIRCLE_EXPIRY_TIMEZONE = STATS_TIMEZONE;

function circleExpiresAt(endDate: string, timeZone: string): Date {
  return startOfDayInZone(shiftDateKey(endDate, 1), timeZone);
}

function isCircleExpired(
  circle: { endDate?: string; expiresAt?: Date },
  now: Date,
): boolean {
  if (circle.expiresAt) {
    return circle.expiresAt <= now;
  }
  return Boolean(
    circle.endDate &&
    circle.endDate < dateKeyInZone(now, LEGACY_CIRCLE_EXPIRY_TIMEZONE),
  );
}

// isCircleExpired'in Mongo karşılığı (tek kaynak): süresi geçmiş belgeler.
function expiredFilter(now: Date) {
  return [
    { expiresAt: { $lte: now } },
    {
      expiresAt: { $exists: false },
      endDate: { $lt: dateKeyInZone(now, LEGACY_CIRCLE_EXPIRY_TIMEZONE) },
    },
  ];
}

// Push/etiket için halka adı; ad yoksa zikrin cihaz dilindeki adı.
function circleLabel(
  name: string | null | undefined,
  dhikr: DhikrSnapshotLean | null | undefined,
  locale: PushLocale,
): string {
  return name || dhikr?.name?.[locale] || dhikr?.name?.tr || '';
}

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
    const premium = await this.isPremiumUser(userObjectId);

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
    // Süresi geçmiş ama henüz kapanmamış halka pasif sayılır.
    const activeCount = await this.circleModel.countDocuments({
      creatorId: userObjectId,
      status: 'active',
      $nor: expiredFilter(new Date()),
    });
    const activeLimit = premium
      ? CIRCLE_MAX_ACTIVE_PER_CREATOR
      : CIRCLE_FREE_MAX_ACTIVE_PER_CREATOR;
    if (activeCount >= activeLimit) {
      // Ücretsiz kullanıcı zaten 1 aktif halkaya sahipse premium gerekir
      // (uygulama paywall'ı açar); premium kullanıcı kendi tavanına
      // ulaştıysa mevcut MAX_ACTIVE hatası kalır.
      throw this.forbidden(
        premium
          ? CIRCLE_ERROR_CODE.MAX_ACTIVE
          : CIRCLE_ERROR_CODE.PREMIUM_REQUIRED,
      );
    }
    const memberLimit = premium ? CIRCLE_MAX_MEMBERS : CIRCLE_FREE_MAX_MEMBERS;

    if (dto.endDate && dto.endDate < todayKey()) {
      throw new BadRequestException({
        code: CIRCLE_ERROR_CODE.END_DATE_PAST,
        message: CIRCLE_ERROR_MESSAGE[CIRCLE_ERROR_CODE.END_DATE_PAST],
      });
    }

    // Sunucu varsayılan ad YAZMAZ (A-21); boşsa alan hiç yazılmaz.
    const name = dto.name?.trim() || undefined;
    const timezone = requestTimezone();

    for (let attempt = 0; attempt < CODE_ATTEMPTS; attempt += 1) {
      try {
        const created = await this.circleModel.create({
          ...(name && { name }),
          dhikrId: dhikr._id,
          goalCount: dto.goalCount,
          endDate: dto.endDate,
          timezone,
          ...(dto.endDate && {
            expiresAt: circleExpiresAt(dto.endDate, timezone),
          }),
          creatorId: userObjectId,
          code: generateCircleCode(),
          memberIds: [userObjectId],
          memberLimit,
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
    const now = new Date();

    // Tembel süre sonu: süresi geçmiş aktif halkaları kapatır. Tek atomik
    // updateMany + koruyucu filtre — okuma/yazma ayrımı yok. İki kol
    // isCircleExpired ile birebir: expiresAt'li yeni belgeler kendi anında,
    // eski belgeler endDate'in İstanbul gününe göre.
    await this.circleModel
      .updateMany(
        {
          memberIds: userObjectId,
          status: 'active',
          $or: expiredFilter(now),
        },
        { $set: { status: 'closed', expiredAt: now } },
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

  async findOne(
    userId: string,
    id: string,
    date?: string,
  ): Promise<CircleDetail> {
    if (date !== undefined && !isValidDateKey(date)) {
      throw new BadRequestException('date YYYY-MM-DD biçiminde olmalı.');
    }
    const userObjectId = this.asObjectId(userId);
    const circle = (await this.circleModel
      .findOne({ _id: this.asObjectId(id), memberIds: userObjectId })
      .lean()
      .exec()) as CircleLean | null;
    if (!circle) {
      throw this.notFound();
    }

    // findMine'daki tembel kapanışın tek halka karşılığı: süresi geçmiş aktif
    // halka burada da kapalı görünür. status: 'active' filtresi sayesinde
    // tamamlanmış halkanın üzerine asla yazılmaz.
    if (circle.status === 'active' && isCircleExpired(circle, new Date())) {
      await this.circleModel
        .updateOne(
          { _id: circle._id, status: 'active' },
          { $set: { status: 'closed', expiredAt: new Date() } },
        )
        .exec();
      circle.status = 'closed';
    }

    const dayKey = date ?? todayKey();
    const [summary, members, todayLog, activeTodayIds] = await Promise.all([
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
          date: dayKey,
        })
        .select('count')
        .lean()
        .exec(),
      this.dhikrLogModel.distinct('userId', {
        circleId: circle._id,
        date: dayKey,
        count: { $gt: 0 },
      }),
    ]);

    // Yalnız bayrak + toplu sayı — üye başına sayı ASLA dönmez (bireysel
    // sayılar gizli kalır). Ayrılmış üyelerin logları memberIds'te olmadığı
    // için sayıma girmez.
    const activeTodaySet = new Set(activeTodayIds.map(String));
    const memberFlags = members.map((member) => ({
      displayName: member.displayName,
      activeToday: activeTodaySet.has(String(member._id)),
      ...(isDefaultName(member.displayName) && { defaultName: true as const }),
    }));

    return {
      ...summary,
      members: memberFlags,
      activeTodayCount: memberFlags.filter((member) => member.activeToday)
        .length,
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
      name: circle.name ?? null,
      dhikr: toSnapshot(dhikr),
      goalCount: circle.goalCount,
      totalCount: circle.totalCount,
      memberCount: circle.memberIds.length,
      memberLimit: circle.memberLimit ?? CIRCLE_MAX_MEMBERS,
      // Süresi geçmiş ama kimse açmadığı için hâlâ 'active' görünen halka.
      status:
        circle.status === 'active' && isCircleExpired(circle, new Date())
          ? 'closed'
          : circle.status,
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
    if (circle.status === 'active' && isCircleExpired(circle, new Date())) {
      await this.circleModel
        .updateOne(
          { _id: circle._id, status: 'active' },
          { $set: { status: 'closed', expiredAt: new Date() } },
        )
        .exec();
      throw this.forbidden(CIRCLE_ERROR_CODE.NOT_ACTIVE);
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
          $expr: {
            $lt: [
              { $size: '$memberIds' },
              { $ifNull: ['$memberLimit', CIRCLE_MAX_MEMBERS] },
            ],
          },
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
      // (halka, üye) başına bir kez: bayrak atomik $addToSet ile alınır;
      // yarışan/yinelenen katılımlarda yalnız bir çağrı modified görür.
      const claimed = await this.circleModel
        .updateOne(
          { _id: before._id, joinNotifiedIds: { $ne: userObjectId } },
          { $addToSet: { joinNotifiedIds: userObjectId } },
        )
        .exec();
      if (claimed.modifiedCount > 0) {
        const [joiner, dhikr] = await Promise.all([
          this.userModel
            .findById(userObjectId)
            .select('displayName')
            .lean()
            .exec(),
          this.findDhikrSnapshot(before.dhikrId),
        ]);
        await this.notify(
          [String(before.creatorId)],
          (locale) =>
            circleMemberJoinedPush(
              isDefaultName(joiner?.displayName)
                ? undefined
                : joiner?.displayName,
              circleLabel(before.name, dhikr, locale),
              locale,
            ),
          String(before._id),
        );
      }
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
    date?: string,
  ) {
    const userObjectId = this.asObjectId(userId);
    const circle = await this.circleModel
      .findOne({ _id: this.asObjectId(circleId), memberIds: userObjectId })
      .select('status dhikrId expiredAt createdAt timezone')
      .lean()
      .exec();
    if (!circle) {
      throw this.forbidden(CIRCLE_ERROR_CODE.NOT_MEMBER);
    }
    // A-01: hedef dolmuş (completed) ve süresi dolmuş halkaya geç katkı
    // KABUL edilir. Yalnız kurucunun kapattığı halka (expiredAt yok) reddeder.
    if (circle.status === 'closed' && !circle.expiredAt) {
      throw this.forbidden(CIRCLE_ERROR_CODE.NOT_ACTIVE);
    }
    if (!dhikrId || !circle.dhikrId.equals(dhikrId)) {
      throw new BadRequestException({
        code: CIRCLE_ERROR_CODE.DHIKR_MISMATCH,
        message: CIRCLE_ERROR_MESSAGE[CIRCLE_ERROR_CODE.DHIKR_MISMATCH],
      });
    }
    // A-03: kayıt günü halkanın kuruluş gününden (kurucunun saat dilimi,
    // yoksa İstanbul) önce olamaz. Üst sınır (bugün+1) A-12 genel kuralındadır.
    if (
      date &&
      date < dateKeyInZone(circle.createdAt, circle.timezone ?? STATS_TIMEZONE)
    ) {
      throw new BadRequestException(
        'Kayıt tarihi halkanın kuruluş gününden önce olamaz.',
      );
    }
  }

  /**
   * Log yazımından sonra (best-effort, çağıran yutar) ortak toplamı tazeler
   * ve hedef dolduysa halkayı tamamlar.
   */
  // ponytail: her flush O(halka log sayısı) aggregate; istemci 3 sn'de bir
  // flush ediyor. Tavan ~200 eşzamanlı üye × Atlas M0. Yükseltme yolu: halka
  // başına throttle.
  async applyProgress(circleId: string): Promise<number | undefined> {
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
      .select('goalCount name memberIds dhikrId')
      .lean()
      .exec();
    if (!circle || total < circle.goalCount) {
      return total;
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
      return total;
    }

    const dhikr = await this.findDhikrSnapshot(circle.dhikrId);
    await this.notify(
      circle.memberIds.map(String),
      (locale) =>
        circleCompletedPush(circleLabel(circle.name, dhikr, locale), locale),
      String(circleObjectId),
    );
    return total;
  }

  /**
   * A-04: kurucu hesabını silerken (deleteUserAllData) açık halkalarının
   * kuruculuğu en eski aktif üyeye (memberIds sırası = katılım sırası) geçer;
   * üye yoksa halka kapanır. Limitler geriye dönük uygulanmaz.
   */
  async transferFounderOnDelete(userId: string): Promise<void> {
    const userObjectId = this.asObjectId(userId);
    const open = await this.circleModel
      .find({ creatorId: userObjectId, status: 'active' })
      .select('_id')
      .lean()
      .exec();
    for (const { _id } of open) {
      await this.transferOne(_id, userObjectId);
    }
  }

  private async transferOne(circleId: Types.ObjectId, from: Types.ObjectId) {
    // Aday, okuma ile yazma arasında ayrılabilir: yazım filtresi adayın hâlâ
    // üye olmasını ister, olmazsa yeniden okunur (sınırlı deneme).
    for (let attempt = 0; attempt < 5; attempt += 1) {
      const circle = await this.circleModel
        .findOne({ _id: circleId, creatorId: from, status: 'active' })
        .select('memberIds name dhikrId')
        .lean()
        .exec();
      if (!circle) {
        return;
      }
      const next = circle.memberIds.find((id) => !id.equals(from));
      if (!next) {
        await this.circleModel
          .updateOne(
            { _id: circleId, creatorId: from, status: 'active' },
            { $set: { status: 'closed' } },
          )
          .exec();
        return;
      }
      const moved = await this.circleModel
        .updateOne(
          { _id: circleId, creatorId: from, status: 'active', memberIds: next },
          { $set: { creatorId: next }, $pull: { memberIds: from } },
        )
        .exec();
      if (moved.modifiedCount === 0) {
        continue;
      }
      const dhikr = await this.findDhikrSnapshot(circle.dhikrId);
      await this.notify(
        [String(next)],
        (locale) =>
          circleFounderTransferredPush(
            circleLabel(circle.name, dhikr, locale),
            locale,
          ),
        String(circleId),
      );
      return;
    }
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
      name: circle.name ?? null,
      dhikrId: String(circle.dhikrId),
      dhikr: toSnapshot(dhikr),
      goalCount: circle.goalCount,
      totalCount: circle.totalCount,
      memberCount: circle.memberIds.length,
      memberLimit: circle.memberLimit ?? CIRCLE_MAX_MEMBERS,
      status: circle.status,
      endDate: circle.endDate,
      // Eklemeli: süre sonu anı (ISO). Yalnız yeni halkalarda vardır.
      ...(circle.expiresAt && { expiresAt: circle.expiresAt.toISOString() }),
      myTotal,
      creatorId: String(circle.creatorId),
      isCreator: circle.creatorId.equals(userObjectId),
    };
  }

  /** Push gönderimi asla akışı bozmaz (bkz. safeApplyVirdProgress deseni). */
  private async notify(
    userIds: string[],
    buildMessage: (locale: PushLocale) => { title: string; body: string },
    circleId: string,
  ) {
    try {
      const devices = await this.devicesService.findActiveByUserIds(userIds);
      // Dil başına tek gönderim; locale'i olmayan cihaz (eski sürüm) 'tr'.
      const targetsByLocale = new Map<
        PushLocale,
        { deviceId: string; expoPushToken: string }[]
      >();
      for (const device of devices) {
        if (!device.expoPushToken) {
          continue;
        }
        const locale = device.locale ?? 'tr';
        const list = targetsByLocale.get(locale) ?? [];
        list.push({
          deviceId: device.deviceId,
          expoPushToken: device.expoPushToken,
        });
        targetsByLocale.set(locale, list);
      }
      for (const [locale, targets] of targetsByLocale) {
        await this.pushSender.sendToDevices(targets, {
          ...buildMessage(locale),
          data: { route: `/circle/${circleId}` },
        });
      }
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

function isDefaultName(displayName: string | undefined): boolean {
  return displayName === GUEST_DISPLAY_NAME;
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
