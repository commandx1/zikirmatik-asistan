import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Types, type Model } from 'mongoose';
import { Dhikr, type DhikrDocument } from '../dhikrs/schemas/dhikr.schema';
import { User, type UserDocument } from '../users/schemas/user.schema';
import { CreateDhikrLogBulkDto } from './dto/create-dhikr-log-bulk.dto';
import { CreateDhikrLogDto } from './dto/create-dhikr-log.dto';
import { QueryDhikrLogsDto } from './dto/query-dhikr-logs.dto';
import { DhikrLog, type DhikrLogDocument } from './schemas/dhikr-log.schema';

@Injectable()
export class DhikrLogsService {
  constructor(
    @InjectModel(DhikrLog.name)
    private readonly dhikrLogModel: Model<DhikrLogDocument>,
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    @InjectModel(Dhikr.name) private readonly dhikrModel: Model<DhikrDocument>,
  ) {}

  async create(payload: CreateDhikrLogDto) {
    const userObjectId = this.asObjectId(payload.userId);
    const dhikrObjectId = this.asObjectId(payload.dhikrId);
    await this.ensureReferencesExist([userObjectId], [dhikrObjectId]);

    const created = await this.dhikrLogModel
      .findOneAndUpdate(
        { userId: userObjectId, dhikrId: dhikrObjectId, date: payload.date },
        {
          $set: {
            count: payload.count,
            targetCount: payload.targetCount,
            sessionDuration: payload.sessionDuration ?? 0,
            mood: payload.mood,
            source: payload.source ?? 'manual',
            isCompleted: payload.isCompleted ?? false,
          },
          $setOnInsert: {
            userId: userObjectId,
            dhikrId: dhikrObjectId,
            date: payload.date,
          },
        },
        {
          upsert: true,
          returnDocument: 'after',
          setDefaultsOnInsert: true,
        },
      )
      .lean()
      .exec();

    return created;
  }

  async createBulk(payload: CreateDhikrLogBulkDto) {
    const userObjectIds = payload.items.map((item) =>
      this.asObjectId(item.userId),
    );
    const dhikrObjectIds = payload.items.map((item) =>
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
            mood: item.mood,
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

  async findById(id: string) {
    const log = await this.dhikrLogModel
      .findById(this.asObjectId(id))
      .lean()
      .exec();
    if (!log) {
      throw new NotFoundException('Zikir kaydı bulunamadı.');
    }

    return log;
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

    const [userCount, dhikrCount] = await Promise.all([
      this.userModel.countDocuments({ _id: { $in: uniqueUserIds } }),
      this.dhikrModel.countDocuments({ _id: { $in: uniqueDhikrIds } }),
    ]);

    if (userCount !== uniqueUserIds.length) {
      throw new NotFoundException(
        'Dhikr log kaydı için en az bir kullanıcı bulunamadı.',
      );
    }

    if (dhikrCount !== uniqueDhikrIds.length) {
      throw new NotFoundException(
        'Dhikr log kaydı için en az bir zikir bulunamadı.',
      );
    }
  }
}

function uniqueObjectIds(values: Types.ObjectId[]) {
  return Array.from(
    new Map(values.map((value) => [value.toHexString(), value])).values(),
  );
}
