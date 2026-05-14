import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Types, type Model } from 'mongoose';
import {
  DhikrLog,
  type DhikrLogDocument,
} from '../dhikr-logs/schemas/dhikr-log.schema';
import { Dhikr, type DhikrDocument } from '../dhikrs/schemas/dhikr.schema';
import { User, type UserDocument } from '../users/schemas/user.schema';
import { CreateSpecialDayDto } from './dto/create-special-day.dto';
import { QuerySpecialDayDetailDto } from './dto/query-special-day-detail.dto';
import { QuerySpecialDaysDto } from './dto/query-special-days.dto';
import { QuerySpecialDaysHomeDto } from './dto/query-special-days-home.dto';
import { UpdateSpecialDayDto } from './dto/update-special-day.dto';
import { UpdateSpecialDayProgressDto } from './dto/update-special-day-progress.dto';
import {
  SpecialDayProgress,
  type SpecialDayProgressDocument,
} from './schemas/special-day-progress.schema';
import {
  SpecialDay,
  type SpecialDayDocument,
} from './schemas/special-day.schema';

type SpecialDayLean = {
  _id: Types.ObjectId;
  name: string;
  type: 'kandil' | 'ramazan' | 'bayram' | 'özel gün';
  date: string;
  hijriDate: string;
  description?: string;
  eventKey?: string;
  dayIndex?: number;
  dayCount?: number;
  priority?: number;
  recommendedDhikrIds: Types.ObjectId[];
  hasSpecialFlow?: boolean;
  notifyBeforeMinutes?: number[];
  isActive?: boolean;
};

const FREE_VISIBLE_TYPES: Array<SpecialDayLean['type']> = ['kandil', 'bayram'];
const MAX_SPECIAL_DAY_DHIKR_RECOMMENDATIONS = 5;

@Injectable()
export class SpecialDaysService {
  constructor(
    @InjectModel(SpecialDay.name)
    private readonly specialDayModel: Model<SpecialDayDocument>,
    @InjectModel(SpecialDayProgress.name)
    private readonly specialDayProgressModel: Model<SpecialDayProgressDocument>,
    @InjectModel(Dhikr.name)
    private readonly dhikrModel: Model<DhikrDocument>,
    @InjectModel(DhikrLog.name)
    private readonly dhikrLogModel: Model<DhikrLogDocument>,
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
  ) {}

  async create(payload: CreateSpecialDayDto) {
    const recommendedDhikrIds = payload.recommendedDhikrIds ?? [];
    await this.ensureDhikrsExist(recommendedDhikrIds);

    const created = await this.specialDayModel.create({
      ...payload,
      eventKey: normalizeEventKey(payload.eventKey),
      recommendedDhikrIds: recommendedDhikrIds.map(
        (id) => new Types.ObjectId(id),
      ),
      notifyBeforeMinutes: payload.notifyBeforeMinutes ?? [1440, 60],
      hasSpecialFlow: payload.hasSpecialFlow ?? false,
      priority: payload.priority ?? resolveDefaultPriority(payload.type),
      isActive: payload.isActive ?? true,
    });

    return created.toObject();
  }

  async findAll(query: QuerySpecialDaysDto) {
    const filter: Record<string, unknown> = {};

    if (query.type) {
      filter.type = query.type;
    }

    if (query.isActive !== undefined) {
      filter.isActive = query.isActive === 'true';
    }

    if (query.dateFrom || query.dateTo) {
      filter.date = {
        ...(query.dateFrom ? { $gte: query.dateFrom } : {}),
        ...(query.dateTo ? { $lte: query.dateTo } : {}),
      };
    }

    return this.specialDayModel.find(filter).sort({ date: 1 }).lean().exec();
  }

  async getHome(query: QuerySpecialDaysHomeDto) {
    const date = query.date ?? toDateKey(new Date());
    const isPremiumUser = await this.isPremiumUser(query.userId);

    const activeDays = await this.specialDayModel
      .find({
        isActive: true,
        date: { $gte: date },
      })
      .sort({ date: 1, priority: -1, createdAt: 1 })
      .lean()
      .exec();

    const todayItems = activeDays
      .filter((item) => item.date === date)
      .sort(compareSpecialDaysForHero);
    const heroSource = todayItems.length > 0 ? 'today' : 'upcoming';
    const hero = todayItems[0] ?? activeDays[0] ?? null;

    const upcoming = activeDays
      .filter((item) => item.date > date)
      .slice(0, 18)
      .map((item) => this.mapUpcoming(item as SpecialDayLean, isPremiumUser));

    return {
      referenceDate: date,
      hero: hero ? this.mapHero(hero, heroSource, isPremiumUser) : null,
      action: hero ? this.mapAction(hero, isPremiumUser) : null,
      upcoming,
    };
  }

  async getDetail(id: string, userId?: QuerySpecialDayDetailDto['userId']) {
    const specialDayId = this.asObjectId(id);
    const specialDay = await this.specialDayModel
      .findById(specialDayId)
      .lean()
      .exec();

    if (!specialDay) {
      throw new NotFoundException('Özel gün kaydı bulunamadı.');
    }

    const isPremiumUser = await this.isPremiumUser(userId);
    if (!isPremiumUser && !FREE_VISIBLE_TYPES.includes(specialDay.type)) {
      throw new ForbiddenException(
        'Bu özel gün Premium üyelik ile görüntülenebilir.',
      );
    }

    const recommendedIds = specialDay.recommendedDhikrIds.map((value) =>
      value.toString(),
    );
    const recommendedItemsRaw =
      recommendedIds.length > 0
        ? await this.dhikrModel
            .find({ _id: { $in: specialDay.recommendedDhikrIds } })
            .lean()
            .exec()
        : [];

    const itemById = new Map(
      recommendedItemsRaw.map((item) => [item._id.toString(), item]),
    );

    let completedSet = new Set<string>();
    let latestLogByDhikrId = new Map<
      string,
      {
        count: number;
        targetCount: number;
      }
    >();
    if (userId) {
      const userObjectId = this.asObjectId(userId);
      const progress = await this.specialDayProgressModel
        .findOne({
          userId: userObjectId,
          specialDayId,
        })
        .lean()
        .exec();

      completedSet = new Set(
        (progress?.completedDhikrIds ?? []).map((value) => value.toString()),
      );

      if (specialDay.recommendedDhikrIds.length > 0) {
        const logs = await this.dhikrLogModel
          .find({
            userId: userObjectId,
            date: specialDay.date,
            dhikrId: { $in: specialDay.recommendedDhikrIds },
          })
          .sort({ createdAt: -1 })
          .lean()
          .exec();

        latestLogByDhikrId = new Map();
        for (const item of logs) {
          const key = item.dhikrId.toString();
          if (latestLogByDhikrId.has(key)) {
            continue;
          }

          latestLogByDhikrId.set(key, {
            count: item.count,
            targetCount: item.targetCount,
          });
        }
      }
    }

    const recommendedDhikrs = recommendedIds
      .map((dhikrId) => {
        const item = itemById.get(dhikrId);
        if (!item) {
          return null;
        }

        return {
          id: item._id.toString(),
          nameTurkish: item.nameTurkish,
          nameArabic: item.nameArabic,
          transliteration: item.transliteration,
          meaning: item.meaning,
          recommendedCount: item.recommendedCount,
          progressCount:
            latestLogByDhikrId.get(item._id.toString())?.count ?? 0,
          progressTarget:
            latestLogByDhikrId.get(item._id.toString())?.targetCount ??
            item.recommendedCount,
          isCompleted:
            completedSet.has(item._id.toString()) ||
            (latestLogByDhikrId.get(item._id.toString())?.count ?? 0) >=
              (latestLogByDhikrId.get(item._id.toString())?.targetCount ??
                item.recommendedCount),
        };
      })
      .filter((item) => Boolean(item));

    const completedTargetCount = this.getProgressTargetCount(specialDay);
    const completedRawCount = recommendedDhikrs.filter(
      (item) => item?.isCompleted,
    ).length;
    const completedCount = Math.min(completedRawCount, completedTargetCount);
    const totalCount = completedTargetCount;

    return {
      ...this.mapSpecialDayBase(specialDay, true),
      recommendedDhikrs,
      progress: {
        completedCount,
        totalCount,
        isCompleted: totalCount > 0 && completedRawCount >= totalCount,
      },
    };
  }

  async updateProgress(id: string, payload: UpdateSpecialDayProgressDto) {
    const specialDayId = this.asObjectId(id);
    const userId = this.asObjectId(payload.userId);
    const dhikrId = this.asObjectId(payload.dhikrId);
    const completed = payload.completed ?? true;

    await this.ensureUserExists(userId);
    const specialDay = await this.specialDayModel
      .findById(specialDayId)
      .lean()
      .exec();
    if (!specialDay) {
      throw new NotFoundException('Özel gün kaydı bulunamadı.');
    }

    const recommendedDhikrIdSet = new Set(
      specialDay.recommendedDhikrIds.map((item) => item.toString()),
    );
    const isRecommendedDhikr = recommendedDhikrIdSet.has(dhikrId.toString());
    if (!isRecommendedDhikr) {
      throw new BadRequestException(
        'İlerleme sadece önerilen zikirler için güncellenebilir.',
      );
    }

    const updated = await this.specialDayProgressModel
      .findOneAndUpdate(
        { userId, specialDayId },
        {
          ...(completed
            ? { $addToSet: { completedDhikrIds: dhikrId } }
            : { $pull: { completedDhikrIds: dhikrId } }),
        },
        {
          upsert: true,
          returnDocument: 'after',
          setDefaultsOnInsert: true,
        },
      )
      .lean()
      .exec();

    const completedSet = new Set(
      (updated?.completedDhikrIds ?? []).map((item) => item.toString()),
    );
    const progressTargetCount = this.getProgressTargetCount(specialDay);
    const completedRawCount = Array.from(completedSet).filter((id) =>
      recommendedDhikrIdSet.has(id),
    ).length;
    const isDayCompleted =
      progressTargetCount > 0 && completedRawCount >= progressTargetCount;

    const normalized = await this.specialDayProgressModel
      .findOneAndUpdate(
        { userId, specialDayId },
        {
          $set: {
            isCompleted: isDayCompleted,
            completedAt: isDayCompleted ? new Date() : null,
          },
        },
        {
          returnDocument: 'after',
        },
      )
      .lean()
      .exec();

    const normalizedCompletedCountRaw = (
      normalized?.completedDhikrIds ?? []
    ).filter((item) => recommendedDhikrIdSet.has(item.toString())).length;
    const completedCount = Math.min(
      normalizedCompletedCountRaw,
      progressTargetCount,
    );
    return {
      userId: userId.toString(),
      specialDayId: specialDayId.toString(),
      completedDhikrIds:
        normalized?.completedDhikrIds?.map((item) => item.toString()) ?? [],
      completedCount,
      totalCount: progressTargetCount,
      isCompleted: Boolean(normalized?.isCompleted),
      completedAt: normalized?.completedAt ?? undefined,
    };
  }

  async findById(id: string) {
    const specialDay = await this.specialDayModel
      .findById(this.asObjectId(id))
      .lean()
      .exec();

    if (!specialDay) {
      throw new NotFoundException('Özel gün kaydı bulunamadı.');
    }

    return specialDay;
  }

  async update(id: string, payload: UpdateSpecialDayDto) {
    if (payload.recommendedDhikrIds) {
      await this.ensureDhikrsExist(payload.recommendedDhikrIds);
    }

    const specialDay = await this.specialDayModel
      .findByIdAndUpdate(
        this.asObjectId(id),
        {
          $set: {
            ...payload,
            ...(payload.eventKey !== undefined
              ? { eventKey: normalizeEventKey(payload.eventKey) }
              : {}),
            ...(payload.priority === undefined && payload.type
              ? { priority: resolveDefaultPriority(payload.type) }
              : {}),
            ...(payload.recommendedDhikrIds
              ? {
                  recommendedDhikrIds: payload.recommendedDhikrIds.map(
                    (item) => new Types.ObjectId(item),
                  ),
                }
              : {}),
          },
        },
        { returnDocument: 'after' },
      )
      .lean()
      .exec();

    if (!specialDay) {
      throw new NotFoundException('Güncellenecek özel gün kaydı bulunamadı.');
    }

    return specialDay;
  }

  async remove(id: string) {
    const deleted = await this.specialDayModel
      .findByIdAndDelete(this.asObjectId(id))
      .lean()
      .exec();

    if (!deleted) {
      throw new NotFoundException('Silinecek özel gün kaydı bulunamadı.');
    }

    await this.specialDayProgressModel.deleteMany({
      specialDayId: this.asObjectId(id),
    });

    return {
      deleted: true,
      id,
    };
  }

  private mapHero(
    item: SpecialDayLean,
    source: 'today' | 'upcoming',
    isPremiumUser: boolean,
  ) {
    const diff = calculateDateDiff(item.date);
    const isLocked = !isPremiumUser && !FREE_VISIBLE_TYPES.includes(item.type);

    return {
      ...this.mapSpecialDayBase(item, isPremiumUser),
      source,
      badge: source === 'today' ? 'Bugünün Özel Günü 🌙' : 'Yaklaşıyor 🌙',
      countdown: [
        { value: pad2(Math.max(diff.days, 0)), label: 'Gün' },
        { value: pad2(Math.max(diff.hours, 0)), label: 'Sa' },
        { value: pad2(Math.max(diff.minutes, 0)), label: 'Dk' },
      ],
      isLocked,
      remainingLabel:
        source === 'today' ? 'Bugün' : `${Math.max(diff.days, 0)} gün`,
    };
  }

  private mapAction(item: SpecialDayLean, isPremiumUser: boolean) {
    const isLocked = !isPremiumUser && !FREE_VISIBLE_TYPES.includes(item.type);
    return {
      specialDayId: item._id.toString(),
      title: 'Bugün Ne Yapabilirim?',
      subtitle: isLocked
        ? `${item.name} içeriği Premium üyelik ile açılır.`
        : item.description?.trim() ||
          `${item.name} için önerilen zikir ve hazırlıkları inceleyebilirsin.`,
      ctaLabel: isLocked ? 'Premium ile Aç' : 'Detaya git',
      isLocked,
    };
  }

  private mapUpcoming(item: SpecialDayLean, isPremiumUser: boolean) {
    const diff = calculateDateDiff(item.date);
    const isLocked = !isPremiumUser && !FREE_VISIBLE_TYPES.includes(item.type);
    return {
      ...this.mapSpecialDayBase(item, isPremiumUser),
      isLocked,
      remainingLabel:
        diff.totalMs <= 0 ? 'Bugün' : `${Math.max(diff.days, 0)} gün`,
    };
  }

  private mapSpecialDayBase(item: SpecialDayLean, isPremiumUser: boolean) {
    const theme = resolveSpecialDayTheme(item);
    const isLocked = !isPremiumUser && !FREE_VISIBLE_TYPES.includes(item.type);
    const effectiveRecommendedDhikrCount = this.getProgressTargetCount(item);
    return {
      id: item._id.toString(),
      name: item.name,
      type: item.type,
      date: item.date,
      hijriDate: item.hijriDate,
      description: item.description,
      eventKey: item.eventKey,
      dayIndex: item.dayIndex,
      dayCount: item.dayCount,
      dateLabel: formatDayLabel(item.date),
      hasSpecialFlow: Boolean(item.hasSpecialFlow),
      recommendedDhikrCount: effectiveRecommendedDhikrCount,
      themeTitle: theme.title,
      themeSummary: theme.summary,
      isLocked,
    };
  }

  private getProgressTargetCount(item: SpecialDayLean) {
    return Math.min(
      item.recommendedDhikrIds?.length ?? 0,
      MAX_SPECIAL_DAY_DHIKR_RECOMMENDATIONS,
    );
  }

  private async ensureDhikrsExist(ids: string[]) {
    if (ids.length === 0) {
      return;
    }

    const objectIds = ids.map((id) => this.asObjectId(id));
    const uniqueIds = uniqueObjectIds(objectIds);

    const count = await this.dhikrModel.countDocuments({
      _id: { $in: uniqueIds },
    });
    if (count !== uniqueIds.length) {
      throw new NotFoundException(
        'recommendedDhikrIds içinde bulunamayan zikir(ler) var.',
      );
    }
  }

  private async ensureUserExists(userId: Types.ObjectId) {
    const exists = await this.userModel.exists({ _id: userId });
    if (!exists) {
      throw new NotFoundException('Kullanıcı bulunamadı.');
    }
  }

  private asObjectId(rawId: string) {
    if (!Types.ObjectId.isValid(rawId)) {
      throw new NotFoundException('Geçersiz ObjectId değeri.');
    }

    return new Types.ObjectId(rawId);
  }

  private async isPremiumUser(userId?: string) {
    if (!userId || !Types.ObjectId.isValid(userId)) {
      return false;
    }

    const user = await this.userModel
      .findById(new Types.ObjectId(userId), { isPremium: 1 })
      .lean()
      .exec();

    return Boolean(user?.isPremium);
  }
}

function uniqueObjectIds(values: Types.ObjectId[]) {
  return Array.from(
    new Map(values.map((value) => [value.toHexString(), value])).values(),
  );
}

function resolveDefaultPriority(type: SpecialDayLean['type']) {
  if (type === 'bayram') {
    return 100;
  }
  if (type === 'kandil') {
    return 80;
  }
  if (type === 'ramazan') {
    return 70;
  }
  return 60;
}

function normalizeEventKey(value?: string) {
  if (!value?.trim()) {
    return undefined;
  }

  return value.trim().toLocaleLowerCase('tr-TR').replace(/\s+/g, '-');
}

function toDateKey(value: Date) {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const day = String(value.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function calculateDateDiff(isoDate: string) {
  const target = new Date(`${isoDate}T00:00:00`);
  const now = new Date();
  const totalMs = target.getTime() - now.getTime();

  const totalMinutes = Math.floor(totalMs / 1000 / 60);
  const days = Math.floor(totalMinutes / (60 * 24));
  const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
  const minutes = totalMinutes % 60;

  return { totalMs, days, hours, minutes };
}

function pad2(value: number) {
  return String(value).padStart(2, '0');
}

function formatDayLabel(isoDate: string, includeYear = true) {
  const date = new Date(`${isoDate}T00:00:00`);
  if (Number.isNaN(date.getTime())) {
    return isoDate;
  }

  const formatter = new Intl.DateTimeFormat('tr-TR', {
    day: 'numeric',
    month: 'long',
    ...(includeYear ? { year: 'numeric' } : {}),
  });
  return formatter.format(date);
}

function compareSpecialDaysForHero(a: SpecialDayLean, b: SpecialDayLean) {
  const priorityDiff = (b.priority ?? 0) - (a.priority ?? 0);
  if (priorityDiff !== 0) {
    return priorityDiff;
  }

  return resolveTypeRank(b.type) - resolveTypeRank(a.type);
}

function resolveTypeRank(type: SpecialDayLean['type']) {
  if (type === 'bayram') {
    return 4;
  }
  if (type === 'kandil') {
    return 3;
  }
  if (type === 'ramazan') {
    return 2;
  }
  return 1;
}

function resolveSpecialDayTheme(item: SpecialDayLean) {
  if (item.eventKey === 'kurban-bayrami-2026') {
    if (item.name.toLocaleLowerCase('tr-TR').includes('arefe')) {
      return {
        title: 'Arefe Hazırlığı',
        summary:
          'Tevbe, istiğfar ve yoğun tefekkür ile bayrama kalbi hazırlama günü.',
      };
    }

    if (item.dayIndex === 1) {
      return {
        title: 'Bayram Başlangıcı',
        summary: 'Teşrik tekbirleri ve şükür merkezli bir başlangıç akışı.',
      };
    }
    if (item.dayIndex === 2) {
      return {
        title: 'Tevhid ve Tevekkül',
        summary: 'Salavat, tevhid ve hasbiye ile iç dengeyi koruma günü.',
      };
    }
    if (item.dayIndex === 3) {
      return {
        title: 'Sabır ve Arınma',
        summary: 'Dua, istiğfar ve teslimiyet vurgusuyla manevi arınma günü.',
      };
    }
    if (item.dayIndex === 4) {
      return {
        title: 'Kapanış ve Sabitleme',
        summary:
          'Bayram ritmini tamamlayıp kazanımları günlük hayata taşıma günü.',
      };
    }
  }

  if (item.eventKey === 'mevlid-kandili-2026') {
    return {
      title: 'Mevlid Kandili',
      summary:
        'Salavat, tevhid, istiğfar ve dua ile Peygamber sevgisini tazeleme gecesi.',
    };
  }

  return {
    title: 'Günün Teması',
    summary:
      item.description?.trim() ||
      `${item.name} için önerilen zikir akışını takip edebilirsin.`,
  };
}
