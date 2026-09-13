import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Types, type Model } from 'mongoose';
import {
  DhikrLog,
  type DhikrLogDocument,
} from '../dhikr-logs/schemas/dhikr-log.schema';
import { User, type UserDocument } from '../users/schemas/user.schema';
import { StreaksService } from '../streaks/streaks.service';
import {
  STATS_TIMEZONE,
  buildDateWindows,
  buildStatsSummary,
  type StatsFacetResult,
  type StatsSummary,
  type StreakSnapshot,
} from './utils/stats-aggregator';

@Injectable()
export class StatsService {
  constructor(
    @InjectModel(DhikrLog.name)
    private readonly dhikrLogModel: Model<DhikrLogDocument>,
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
    private readonly streaksService: StreaksService,
  ) {}

  async getSummary(userId: string): Promise<StatsSummary> {
    const objectId = this.asObjectId(userId);
    const windows = buildDateWindows(new Date());

    const [facetRows, streakDoc, isPremium] = await Promise.all([
      this.dhikrLogModel
        .aggregate<StatsFacetResult>([
          { $match: { userId: objectId } },
          {
            $facet: {
              totals: [
                {
                  $group: {
                    _id: null,
                    allTimeCount: { $sum: '$count' },
                    totalSessions: { $sum: 1 },
                    totalDuration: { $sum: '$sessionDuration' },
                    completedCount: {
                      $sum: { $cond: ['$isCompleted', 1, 0] },
                    },
                    favoriteCount: {
                      $sum: { $cond: ['$isFavorite', 1, 0] },
                    },
                  },
                },
              ],
              daily: [
                { $match: { date: { $gte: windows.heatmapStartKey } } },
                {
                  $group: {
                    _id: '$date',
                    count: { $sum: '$count' },
                    completed: { $sum: { $cond: ['$isCompleted', 1, 0] } },
                  },
                },
              ],
              weekday: [
                {
                  $group: {
                    _id: {
                      $dayOfWeek: {
                        date: {
                          $dateFromString: {
                            dateString: '$date',
                            format: '%Y-%m-%d',
                          },
                        },
                      },
                    },
                    count: { $sum: '$count' },
                  },
                },
              ],
              hourly: [
                {
                  $group: {
                    _id: {
                      $hour: { date: '$createdAt', timezone: STATS_TIMEZONE },
                    },
                    count: { $sum: '$count' },
                  },
                },
              ],
              source: [{ $group: { _id: '$source', count: { $sum: 1 } } }],
              topDhikrs: [
                {
                  $group: {
                    _id: {
                      dhikrId: '$dhikrId',
                      customDhikrId: '$customDhikrId',
                    },
                    totalCount: { $sum: '$count' },
                    sessions: { $sum: 1 },
                    customName: { $first: '$customDhikrName' },
                  },
                },
                { $sort: { totalCount: -1 } },
                { $limit: 10 },
                {
                  $lookup: {
                    from: 'dhikrs',
                    localField: '_id.dhikrId',
                    foreignField: '_id',
                    as: 'dhikr',
                  },
                },
                {
                  $project: {
                    _id: 0,
                    dhikrId: '$_id.dhikrId',
                    customDhikrId: '$_id.customDhikrId',
                    customName: 1,
                    totalCount: 1,
                    sessions: 1,
                    dhikrName: { $arrayElemAt: ['$dhikr.name.tr', 0] },
                  },
                },
              ],
            },
          },
        ])
        .exec(),
      this.streaksService.getByUser(userId),
      this.isPremiumUser(objectId),
    ]);

    const facet = facetRows[0] ?? this.emptyFacet();
    const streak: StreakSnapshot = {
      currentStreak: streakDoc?.currentStreak ?? 0,
      longestStreak: streakDoc?.longestStreak ?? 0,
      totalDaysActive: streakDoc?.totalDaysActive ?? 0,
      virdCurrentStreak: streakDoc?.virdCurrentStreak ?? 0,
      virdLongestStreak: streakDoc?.virdLongestStreak ?? 0,
    };

    return buildStatsSummary(facet, streak, windows, isPremium);
  }

  /** Detay bölümlerinin (heatmap, karşılaştırma, dağılımlar vb.) kilidini
   * açıp açmayacağımızı belirler. Kullanıcı bulunamazsa güvenli taraf:
   * kilitli (premium değil) kabul edilir. */
  private async isPremiumUser(objectId: Types.ObjectId): Promise<boolean> {
    const user = await this.userModel
      .findById(objectId)
      .select('isPremium')
      .lean()
      .exec();
    return Boolean(user?.isPremium);
  }

  private emptyFacet(): StatsFacetResult {
    return {
      totals: [],
      daily: [],
      weekday: [],
      hourly: [],
      source: [],
      topDhikrs: [],
    };
  }

  private asObjectId(rawId: string) {
    if (!Types.ObjectId.isValid(rawId)) {
      throw new NotFoundException('Geçersiz kullanıcı kimliği.');
    }
    return new Types.ObjectId(rawId);
  }
}
