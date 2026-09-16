import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Types, type Model } from 'mongoose';
import { Dhikr, type DhikrDocument } from '../dhikrs/schemas/dhikr.schema';
import { StreaksService } from '../streaks/streaks.service';
import { User, type UserDocument } from '../users/schemas/user.schema';
import { VirdProgressService } from '../vird/vird-progress.service';
import type { VirdSlotKey } from '../vird/vird.types';
import { CreateDhikrLogBulkDto } from './dto/create-dhikr-log-bulk.dto';
import { CreateDhikrLogDto } from './dto/create-dhikr-log.dto';
import { DeleteDhikrLogsByDhikrDto } from './dto/delete-dhikr-logs-by-dhikr.dto';
import { QueryDhikrLogsDto } from './dto/query-dhikr-logs.dto';
import { SetDhikrFavoriteDto } from './dto/set-dhikr-favorite.dto';
import { DhikrLog, type DhikrLogDocument } from './schemas/dhikr-log.schema';

type VirdLogRef = {
  virdProgramId: Types.ObjectId;
  virdSlot: VirdSlotKey;
  virdPrayerIndex?: number;
};

@Injectable()
export class DhikrLogsService {
  private readonly logger = new Logger(DhikrLogsService.name);

  constructor(
    @InjectModel(DhikrLog.name)
    private readonly dhikrLogModel: Model<DhikrLogDocument>,
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    @InjectModel(Dhikr.name) private readonly dhikrModel: Model<DhikrDocument>,
    private readonly streaksService: StreaksService,
    private readonly virdProgressService: VirdProgressService,
  ) {}

  /**
   * Best-effort streak refresh after a log write. Never throws — a streak
   * recalculation failure must not fail the dhikr log write itself.
   */
  private async safeRecalcStreak(userId?: string) {
    if (!userId) {
      return;
    }
    try {
      await this.streaksService.recalculateForUser(userId);
    } catch (error) {
      this.logger.warn(
        `safeRecalcStreak failed: ${error instanceof Error ? error.message : error}`,
      );
    }
  }

  /**
   * Best-effort vird ilerleme türetimi. safeRecalcStreak ile aynı desen:
   * asla throw etmez — bir vird türetim hatası dhikr log yazımını
   * etkilememelidir.
   */
  private async safeApplyVirdProgress(input?: {
    userId: string;
    virdProgramId: string;
    date: string;
  }) {
    if (!input) {
      return;
    }
    try {
      await this.virdProgressService.applyLogWrite(input);
    } catch (error) {
      this.logger.warn(
        `safeApplyVirdProgress failed: ${error instanceof Error ? error.message : error}`,
      );
    }
  }

  /**
   * dhikr_logs upsert anahtarını kurar. `vird` verilmişse (virdProgramId +
   * virdSlot) filtreye virdProgramId/virdSlot/virdPrayerIndex eklenir — aynı
   * zikrin farklı vird dilimlerinde (veya prayer diliminde farklı vakitlerde)
   * çakışmadan ayrı bir belge olarak tutulmasını sağlar. `vird` verilmezse
   * filtreye AYRICA `virdProgramId: {$exists:false}` eklenir — sade (vird
   * etiketsiz) bir yazımın, aynı gün aynı zikir için önceden yazılmış vird
   * etiketli bir belgeyle eşleşip onun üzerine yazmasını engeller (iki akış
   * her zaman ayrı belge kalır).
   */
  private buildLogFilter(
    userId: Types.ObjectId,
    date: string,
    dhikrRef: { dhikrObjectId?: Types.ObjectId; customDhikrId?: string },
    vird?: VirdLogRef,
  ): Record<string, unknown> {
    const filter: Record<string, unknown> = { userId, date };
    if (dhikrRef.dhikrObjectId) {
      filter.dhikrId = dhikrRef.dhikrObjectId;
    } else if (dhikrRef.customDhikrId) {
      filter.customDhikrId = dhikrRef.customDhikrId;
    }
    if (vird) {
      filter.virdProgramId = vird.virdProgramId;
      filter.virdSlot = vird.virdSlot;
      filter.virdPrayerIndex = vird.virdPrayerIndex ?? null;
    } else {
      filter.virdProgramId = { $exists: false };
    }
    return filter;
  }

  private resolveVirdRef(payload: {
    virdProgramId?: string;
    virdSlot?: VirdSlotKey;
    virdPrayerIndex?: number;
  }): VirdLogRef | undefined {
    if (!hasNonEmptyString(payload.virdProgramId) || !payload.virdSlot) {
      return undefined;
    }
    return {
      virdProgramId: this.asObjectId(payload.virdProgramId),
      virdSlot: payload.virdSlot,
      virdPrayerIndex: payload.virdPrayerIndex,
    };
  }

  async create(payload: CreateDhikrLogDto) {
    const userObjectId = this.asObjectId(payload.userId);
    const dhikrId = hasNonEmptyString(payload.dhikrId)
      ? payload.dhikrId
      : undefined;
    const dhikrObjectId = dhikrId ? this.asObjectId(dhikrId) : undefined;
    const aiRecommendationObjectId = hasNonEmptyString(
      payload.aiRecommendationId,
    )
      ? this.asObjectId(payload.aiRecommendationId)
      : undefined;
    const customDhikrId: string | undefined = hasNonEmptyString(
      payload.customDhikrId,
    )
      ? payload.customDhikrId.trim()
      : undefined;

    if (!dhikrObjectId && !customDhikrId) {
      throw new BadRequestException(
        'dhikrId veya customDhikrId alanlarından biri zorunludur.',
      );
    }

    await this.ensureReferencesExist(
      [userObjectId],
      dhikrObjectId ? [dhikrObjectId] : [],
    );

    const vird = this.resolveVirdRef(payload);
    const filter = this.buildLogFilter(
      userObjectId,
      payload.date,
      { dhikrObjectId, customDhikrId },
      vird,
    );

    // A day holds at most one log per (user, dhikr), so a later write for the
    // same day overwrites the earlier one. `isCompleted` must not follow that
    // rule: once a target was reached that day the streak has been earned, and
    // a subsequent partial session (reset + save 5 of 100) must not revoke it.
    const existing = await this.dhikrLogModel
      .findOne(filter, { isCompleted: 1 })
      .lean()
      .exec();
    const isCompleted =
      existing?.isCompleted === true ? true : (payload.isCompleted ?? false);

    const updateSet: Record<string, unknown> = {
      count: payload.count,
      targetCount: payload.targetCount,
      sessionDuration: payload.sessionDuration ?? 0,
      source: payload.source ?? 'manual',
      isCompleted,
      customDhikrName: payload.customDhikrName?.trim() || undefined,
      customDhikrArabic: payload.customDhikrArabic?.trim() || undefined,
      aiRecommendationId: aiRecommendationObjectId,
      aiPrompt: payload.aiPrompt?.trim() || undefined,
      aiAssistantNote: payload.aiAssistantNote?.trim() || undefined,
    };
    if (typeof payload.isFavorite === 'boolean') {
      updateSet.isFavorite = payload.isFavorite;
    }
    const setOnInsert: Record<string, unknown> = {
      userId: userObjectId,
      date: payload.date,
    };
    if (dhikrObjectId) {
      setOnInsert.dhikrId = dhikrObjectId;
    }
    if (customDhikrId) {
      setOnInsert.customDhikrId = customDhikrId;
    }
    if (vird) {
      // Vird alanları YALNIZ $set'te olmalı: aynı yol hem $set hem $setOnInsert
      // içinde geçerse MongoDB upsert'te "would create a conflict" (kod 40)
      // fırlatır. Filtre zaten insert'te bu alanları tohumlar; $set hepsini
      // (prayerIndex için null dahil, filtreyle aynı değer) açıkça yazar.
      updateSet.virdProgramId = vird.virdProgramId;
      updateSet.virdSlot = vird.virdSlot;
      updateSet.virdPrayerIndex = vird.virdPrayerIndex ?? null;
      if (typeof payload.virdDayIndex === 'number') {
        updateSet.virdDayIndex = payload.virdDayIndex;
      }
    }

    const created = await this.dhikrLogModel
      .findOneAndUpdate(
        filter,
        {
          $set: updateSet,
          $setOnInsert: setOnInsert,
        },
        {
          upsert: true,
          returnDocument: 'after',
          setDefaultsOnInsert: true,
        },
      )
      .lean()
      .exec();

    await this.safeRecalcStreak(payload.userId);
    await this.safeApplyVirdProgress(
      vird
        ? {
            userId: payload.userId,
            virdProgramId: vird.virdProgramId.toString(),
            date: payload.date,
          }
        : undefined,
    );

    return created;
  }

  async createBulk(payload: CreateDhikrLogBulkDto) {
    if (payload.items.some((item) => !hasNonEmptyString(item.dhikrId))) {
      throw new BadRequestException(
        'Bulk dhikr log kaydı için tüm itemlarda dhikrId zorunludur.',
      );
    }

    const itemsWithDhikrId = payload.items.filter(hasDhikrId);
    const userObjectIds = payload.items.map((item) =>
      this.asObjectId(item.userId),
    );
    const dhikrObjectIds = itemsWithDhikrId.map((item) =>
      this.asObjectId(item.dhikrId),
    );
    await this.ensureReferencesExist(userObjectIds, dhikrObjectIds);

    const virdRefs = payload.items.map((item) => this.resolveVirdRef(item));
    const filters = payload.items.map((item, index) =>
      this.buildLogFilter(
        userObjectIds[index],
        item.date,
        { dhikrObjectId: dhikrObjectIds[index] },
        virdRefs[index],
      ),
    );

    const operations = payload.items.map((item, index) => {
      const vird = virdRefs[index];
      const set: Record<string, unknown> = {
        count: item.count,
        targetCount: item.targetCount,
        sessionDuration: item.sessionDuration ?? 0,
        source: item.source ?? 'manual',
        isCompleted: item.isCompleted ?? false,
      };
      const setOnInsert: Record<string, unknown> = {
        userId: userObjectIds[index],
        dhikrId: dhikrObjectIds[index],
        date: item.date,
      };
      if (vird) {
        set.virdProgramId = vird.virdProgramId;
        set.virdSlot = vird.virdSlot;
        set.virdPrayerIndex = vird.virdPrayerIndex;
        if (typeof item.virdDayIndex === 'number') {
          set.virdDayIndex = item.virdDayIndex;
        }
        setOnInsert.virdProgramId = vird.virdProgramId;
        setOnInsert.virdSlot = vird.virdSlot;
        setOnInsert.virdPrayerIndex = vird.virdPrayerIndex;
      }
      return {
        updateOne: {
          filter: filters[index],
          update: { $set: set, $setOnInsert: setOnInsert },
          upsert: true,
        },
      };
    });

    const result = await this.dhikrLogModel.bulkWrite(operations, {
      ordered: false,
    });

    const items = await this.dhikrLogModel.find({ $or: filters }).lean().exec();

    await this.safeRecalcStreak(payload.items[0]?.userId);
    await this.applyVirdProgressForBulk(payload.items, virdRefs);

    return {
      insertedCount: result.upsertedCount,
      items,
    };
  }

  /** Bulk yazımdaki distinct (userId, virdProgramId, date) üçlüleri için
   * tek tek (best-effort) vird ilerlemesi türetir. */
  private async applyVirdProgressForBulk(
    items: CreateDhikrLogDto[],
    virdRefs: (VirdLogRef | undefined)[],
  ) {
    const seen = new Set<string>();
    for (let index = 0; index < items.length; index += 1) {
      const vird = virdRefs[index];
      if (!vird) {
        continue;
      }
      const item = items[index];
      const key = `${item.userId}:${vird.virdProgramId.toString()}:${item.date}`;
      if (seen.has(key)) {
        continue;
      }
      seen.add(key);
      await this.safeApplyVirdProgress({
        userId: item.userId,
        virdProgramId: vird.virdProgramId.toString(),
        date: item.date,
      });
    }
  }

  async findAll(query: QueryDhikrLogsDto) {
    const filter: Record<string, unknown> = {};

    if (query.userId) {
      filter.userId = this.asObjectId(query.userId);
    }

    if (query.dhikrId) {
      filter.dhikrId = this.asObjectId(query.dhikrId);
    }

    if (query.dateFrom || query.dateTo) {
      filter.date = {
        ...(query.dateFrom ? { $gte: query.dateFrom } : {}),
        ...(query.dateTo ? { $lte: query.dateTo } : {}),
      };
    }

    return this.dhikrLogModel
      .find(filter)
      .sort({ date: -1, createdAt: -1 })
      .lean()
      .exec();
  }

  async findById(id: string, userId?: string) {
    const filter: Record<string, unknown> = {
      _id: this.asObjectId(id),
    };
    if (userId) {
      filter.userId = this.asObjectId(userId);
    }

    const log = await this.dhikrLogModel.findOne(filter).lean().exec();
    if (!log) {
      throw new NotFoundException('Zikir kaydı bulunamadı.');
    }

    return log;
  }

  async removeByDhikr(userId: string, payload: DeleteDhikrLogsByDhikrDto) {
    const filter: Record<string, unknown> = {
      userId: this.asObjectId(userId),
    };

    if (hasNonEmptyString(payload.dhikrId)) {
      filter.dhikrId = this.asObjectId(payload.dhikrId);
    } else if (hasNonEmptyString(payload.customDhikrId)) {
      filter.customDhikrId = payload.customDhikrId.trim();
    } else {
      throw new BadRequestException(
        'dhikrId veya customDhikrId alanlarından biri zorunludur.',
      );
    }

    const result = await this.dhikrLogModel.deleteMany(filter).exec();

    return {
      deleted: true,
      deletedCount: result.deletedCount ?? 0,
    };
  }

  async setFavoriteByDhikr(userId: string, payload: SetDhikrFavoriteDto) {
    const filter: Record<string, unknown> = {
      userId: this.asObjectId(userId),
    };

    if (hasNonEmptyString(payload.dhikrId)) {
      filter.dhikrId = this.asObjectId(payload.dhikrId);
    } else if (hasNonEmptyString(payload.customDhikrId)) {
      filter.customDhikrId = payload.customDhikrId.trim();
    } else {
      throw new BadRequestException(
        'dhikrId veya customDhikrId alanlarından biri zorunludur.',
      );
    }

    const result = await this.dhikrLogModel
      .updateMany(filter, { $set: { isFavorite: payload.isFavorite } })
      .exec();

    return {
      updated: true,
      matchedCount: result.matchedCount ?? 0,
      modifiedCount: result.modifiedCount ?? 0,
      isFavorite: payload.isFavorite,
    };
  }

  private asObjectId(rawId: string) {
    if (!Types.ObjectId.isValid(rawId)) {
      throw new NotFoundException('Geçersiz ObjectId değeri.');
    }

    return new Types.ObjectId(rawId);
  }

  private async ensureReferencesExist(
    userIds: Types.ObjectId[],
    dhikrIds: Types.ObjectId[],
  ) {
    const uniqueUserIds = uniqueObjectIds(userIds);
    const uniqueDhikrIds = uniqueObjectIds(dhikrIds);

    const userCount = await this.userModel.countDocuments({
      _id: { $in: uniqueUserIds },
    });

    if (userCount !== uniqueUserIds.length) {
      throw new NotFoundException(
        'Dhikr log kaydı için en az bir kullanıcı bulunamadı.',
      );
    }

    if (uniqueDhikrIds.length > 0) {
      const dhikrCount = await this.dhikrModel.countDocuments({
        _id: { $in: uniqueDhikrIds },
      });

      if (dhikrCount !== uniqueDhikrIds.length) {
        throw new NotFoundException(
          'Dhikr log kaydı için en az bir zikir bulunamadı.',
        );
      }
    }
  }
}

function uniqueObjectIds(values: Types.ObjectId[]) {
  return Array.from(
    new Map(values.map((value) => [value.toHexString(), value])).values(),
  );
}

function hasNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function hasDhikrId(
  item: CreateDhikrLogDto,
): item is CreateDhikrLogDto & { dhikrId: string } {
  return hasNonEmptyString(item.dhikrId);
}
