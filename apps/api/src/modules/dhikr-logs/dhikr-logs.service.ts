import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Types, type Model } from 'mongoose';
import { Dhikr, type DhikrDocument } from '../dhikrs/schemas/dhikr.schema';
import { StreaksService } from '../streaks/streaks.service';
import { User, type UserDocument } from '../users/schemas/user.schema';
import { CreateDhikrLogBulkDto } from './dto/create-dhikr-log-bulk.dto';
import { CreateDhikrLogDto } from './dto/create-dhikr-log.dto';
import { DeleteDhikrLogsByDhikrDto } from './dto/delete-dhikr-logs-by-dhikr.dto';
import { QueryDhikrLogsDto } from './dto/query-dhikr-logs.dto';
import { SetDhikrFavoriteDto } from './dto/set-dhikr-favorite.dto';
import { DhikrLog, type DhikrLogDocument } from './schemas/dhikr-log.schema';

@Injectable()
export class DhikrLogsService {
  constructor(
    @InjectModel(DhikrLog.name)
    private readonly dhikrLogModel: Model<DhikrLogDocument>,
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    @InjectModel(Dhikr.name) private readonly dhikrModel: Model<DhikrDocument>,
    private readonly streaksService: StreaksService,
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
    } catch {
      // intentionally swallowed
    }
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

    const filter: Record<string, unknown> = {
      userId: userObjectId,
      date: payload.date,
    };
    if (dhikrObjectId) {
      filter.dhikrId = dhikrObjectId;
    } else if (customDhikrId) {
      filter.customDhikrId = customDhikrId;
    }

    const updateSet: Record<string, unknown> = {
      count: payload.count,
      targetCount: payload.targetCount,
      sessionDuration: payload.sessionDuration ?? 0,
      source: payload.source ?? 'manual',
      isCompleted: payload.isCompleted ?? false,
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

    const operations = payload.items.map((item, index) => ({
      updateOne: {
        filter: {
          userId: userObjectIds[index],
          dhikrId: dhikrObjectIds[index],
          date: item.date,
        },
        update: {
          $set: {
            count: item.count,
            targetCount: item.targetCount,
            sessionDuration: item.sessionDuration ?? 0,
            source: item.source ?? 'manual',
            isCompleted: item.isCompleted ?? false,
          },
          $setOnInsert: {
            userId: userObjectIds[index],
            dhikrId: dhikrObjectIds[index],
            date: item.date,
          },
        },
        upsert: true,
      },
    }));

    const result = await this.dhikrLogModel.bulkWrite(operations, {
      ordered: false,
    });

    const keys = payload.items.map((item, index) => ({
      userId: userObjectIds[index],
      dhikrId: dhikrObjectIds[index],
      date: item.date,
    }));
    const items = await this.dhikrLogModel.find({ $or: keys }).lean().exec();

    await this.safeRecalcStreak(payload.items[0]?.userId);

    return {
      insertedCount: result.upsertedCount,
      items,
    };
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
