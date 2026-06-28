import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Types, type Model } from 'mongoose';
import {
  DhikrLog,
  type DhikrLogDocument,
} from '../dhikr-logs/schemas/dhikr-log.schema';
import { User, type UserDocument } from '../users/schemas/user.schema';
import { istanbulDateKey } from '../../common/utils/date-keys';
import { Streak, type StreakDocument } from './schemas/streak.schema';
import { calculateCompletionStreak } from './utils/streak-calculator';

@Injectable()
export class StreaksService {
  constructor(
    @InjectModel(Streak.name)
    private readonly streakModel: Model<StreakDocument>,
    @InjectModel(DhikrLog.name)
    private readonly dhikrLogModel: Model<DhikrLogDocument>,
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
  ) {}

  async getByUser(userId: string) {
    const objectId = this.asObjectId(userId, 'Geçersiz kullanıcı kimliği.');

    const streak = await this.streakModel
      .findOne({ userId: objectId })
      .lean()
      .exec();

    if (streak) {
      return streak;
    }

    // Lazy backfill: a user can have logs but no streak document yet (the
    // collection was previously never written). Compute & persist on first read.
    const hasLogs = await this.dhikrLogModel.exists({ userId: objectId });
    if (hasLogs) {
      return this.recalculateForUser(userId);
    }

    return {
      userId,
      currentStreak: 0,
      longestStreak: 0,
      totalDaysActive: 0,
    };
  }

  async recalculateForUser(userId: string) {
    const objectId = this.asObjectId(userId, 'Geçersiz kullanıcı kimliği.');
    await this.ensureUserExists(objectId);

    const [allDates, completedDates] = await Promise.all([
      this.dhikrLogModel.distinct('date', { userId: objectId }),
      this.dhikrLogModel.distinct('date', {
        userId: objectId,
        isCompleted: true,
      }),
    ]);

    const todayKey = istanbulDateKey(new Date());
    const { currentStreak, longestStreak } = calculateCompletionStreak(
      completedDates,
      todayKey,
    );
    const sortedActive = allDates.slice().sort();
    const totalDaysActive = sortedActive.length;
    const lastActiveDate =
      sortedActive.length > 0
        ? sortedActive[sortedActive.length - 1]
        : undefined;

    const updated = await this.streakModel
      .findOneAndUpdate(
        { userId: objectId },
        {
          $set: {
            userId: objectId,
            currentStreak,
            longestStreak,
            totalDaysActive,
            lastActiveDate,
          },
        },
        { upsert: true, returnDocument: 'after' },
      )
      .lean()
      .exec();

    return this.toPlain(updated);
  }

  async recalculateAll() {
    const userIds = await this.userModel.find({}, { _id: 1 }).lean().exec();

    const items: unknown[] = [];

    for (const user of userIds) {
      const updated = await this.recalculateForUser(user._id.toString());
      items.push(updated);
    }

    return {
      processedUserCount: items.length,
      items,
    };
  }

  private async ensureUserExists(userId: Types.ObjectId) {
    const exists = await this.userModel.exists({ _id: userId });
    if (!exists) {
      throw new NotFoundException('Kullanıcı bulunamadı.');
    }
  }

  private asObjectId(rawId: string, message: string) {
    if (!Types.ObjectId.isValid(rawId)) {
      throw new NotFoundException(message);
    }

    return new Types.ObjectId(rawId);
  }

  private toPlain<T>(value: T): T {
    if (
      value &&
      typeof value === 'object' &&
      'toObject' in (value as Record<string, unknown>)
    ) {
      return (value as unknown as { toObject: () => T }).toObject();
    }

    return value;
  }
}
