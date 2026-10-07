import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Types, type Model } from 'mongoose';
import {
  DhikrLog,
  type DhikrLogDocument,
} from '../dhikr-logs/schemas/dhikr-log.schema';
import { User, type UserDocument } from '../users/schemas/user.schema';
import {
  VirdDayProgress,
  type VirdDayProgressDocument,
} from '../vird/schemas/vird-day-progress.schema';
import { todayKey } from '../../common/utils/date-keys';
import { Streak, type StreakDocument } from './schemas/streak.schema';
import {
  calculateCompletionStreak,
  effectiveStreak,
  type StoredStreak,
} from './utils/streak-calculator';

/** Seri kuralı sürümü: 2 = sayımı > 0 olan gün (M-21). Eski belgede yok. */
const STREAK_RULE = 2;

@Injectable()
export class StreaksService {
  constructor(
    @InjectModel(Streak.name)
    private readonly streakModel: Model<StreakDocument>,
    @InjectModel(DhikrLog.name)
    private readonly dhikrLogModel: Model<DhikrLogDocument>,
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    @InjectModel(VirdDayProgress.name)
    private readonly virdDayProgressModel: Model<VirdDayProgressDocument>,
  ) {}

  async getByUser(userId: string) {
    const objectId = this.asObjectId(userId, 'Geçersiz kullanıcı kimliği.');

    const streak = await this.streakModel
      .findOne({ userId: objectId })
      .lean()
      .exec();

    // M-21 öncesi (tamamlanma tabanlı) yazılmış belge: "sayımı > 0" kuralıyla
    // bir kez yeniden hesapla (STREAK_RULE'u da yazar).
    const legacy = streak && streak.streakRule !== STREAK_RULE;
    if (streak && !legacy) {
      return this.present(streak);
    }

    // Lazy backfill: a user can have logs but no streak document yet (the
    // collection was previously never written). Compute & persist on first read.
    const hasLogs =
      legacy || (await this.dhikrLogModel.exists({ userId: objectId }));
    if (hasLogs) {
      return this.recalculateForUser(userId);
    }

    return {
      userId,
      currentStreak: 0,
      longestStreak: 0,
      totalDaysActive: 0,
      virdCurrentStreak: 0,
      virdLongestStreak: 0,
    };
  }

  async recalculateForUser(userId: string) {
    const objectId = this.asObjectId(userId, 'Geçersiz kullanıcı kimliği.');
    await this.ensureUserExists(objectId);

    // M-21: gün, o gün sayımı > 0 olan bir log varsa sayılır (hedef şartı yok).
    const [allDates, activeDates] = await Promise.all([
      this.dhikrLogModel.distinct('date', { userId: objectId }),
      this.dhikrLogModel.distinct('date', {
        userId: objectId,
        count: { $gt: 0 },
      }),
    ]);

    const { currentStreak, longestStreak } = calculateCompletionStreak(
      activeDates,
      todayKey(),
    );
    // Alan adı geriye uyum için aynı: artık "sayımı > 0 olan son gün".
    const lastCompletedDate = activeDates.slice().sort().at(-1);
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
            totalDaysActive,
            lastActiveDate,
            lastCompletedDate,
            streakRule: STREAK_RULE,
          },
          // A-15: kazanılan en uzun seri asla düşmez (rozetler geri alınmaz).
          $max: { longestStreak },
        },
        { upsert: true, returnDocument: 'after' },
      )
      .lean()
      .exec();

    return this.present(updated);
  }

  /**
   * Vird Programı serisi — genel zikir serisinden (recalculateForUser)
   * bağımsız, vird_day_progress.isDayComplete günlerinden türetilir. Aynı
   * calculateCompletionStreak yardımcı fonksiyonunu kullanır; mevcut genel
   * seri hesabı değişmez (currentStreak/longestStreak/totalDaysActive bu
   * $set'e dahil değildir).
   */
  async recalculateVirdForUser(userId: string) {
    const objectId = this.asObjectId(userId, 'Geçersiz kullanıcı kimliği.');
    await this.ensureUserExists(objectId);

    const completedDates = await this.virdDayProgressModel.distinct('date', {
      userId: objectId,
      isDayComplete: true,
    });

    const { currentStreak, longestStreak } = calculateCompletionStreak(
      completedDates,
      todayKey(),
    );
    const sortedCompleted = completedDates.slice().sort();
    const virdLastCompleteDate =
      sortedCompleted.length > 0
        ? sortedCompleted[sortedCompleted.length - 1]
        : undefined;

    const updated = await this.streakModel
      .findOneAndUpdate(
        { userId: objectId },
        {
          $set: {
            userId: objectId,
            virdCurrentStreak: currentStreak,
            virdLastCompleteDate,
          },
          // A-15: vird_day_progress 400 gün TTL ile silinse de düşmez.
          $max: { virdLongestStreak: longestStreak },
        },
        { upsert: true, returnDocument: 'after' },
      )
      .lean()
      .exec();

    return this.present(updated);
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

  /** Dışarı verilen her seri, isteğin "bugün"üne göre değerlendirilir. */
  private present<T extends StoredStreak | null>(value: T): T {
    const plain = this.toPlain(value);
    return plain && effectiveStreak(plain, todayKey());
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
