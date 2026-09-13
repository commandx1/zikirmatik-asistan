import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Types, type Model } from 'mongoose';
import {
  DhikrLog,
  type DhikrLogDocument,
} from '../../dhikr-logs/schemas/dhikr-log.schema';
import {
  Device,
  type DeviceDocument,
} from '../../devices/schemas/device.schema';
import { User, type UserDocument } from '../../users/schemas/user.schema';
import { istanbulDateKey, shiftDateKey } from '../../../common/utils/date-keys';
import {
  weeklySummaryFreeTemplate,
  weeklySummaryPremiumTemplate,
} from '../templates';
import type {
  CampaignBuildResult,
  CampaignCandidate,
} from '../push-campaigns.types';

const STATS_ROUTE = '/(tabs)/stats';

export type WeeklySummaryUserStat = {
  userId: string;
  totalCount: number;
  activeDays: number;
  isPremium: boolean;
};

export type WeeklySummaryDeviceInput = {
  deviceId: string;
  expoPushToken?: string;
  userId: string;
};

/**
 * Pure seçim mantığı (DB'siz) — weekly-summary.campaign.spec.ts doğrudan
 * bunu test eder. Aggregation zaten sıfır aktiviteli kullanıcıları hariç
 * tuttuğu için (bkz. buildCandidates) totalCount<=0 kontrolü yalnızca
 * savunma amaçlıdır. Kullanıcının birden çok cihazı varsa hepsine bir aday
 * üretilir; günlük tekillik push_dispatches'ta cihaz bazlı sağlanır.
 */
export function selectWeeklySummaryCandidates(
  userStats: WeeklySummaryUserStat[],
  devices: WeeklySummaryDeviceInput[],
): CampaignBuildResult {
  const devicesByUser = new Map<string, WeeklySummaryDeviceInput[]>();
  for (const device of devices) {
    const list = devicesByUser.get(device.userId) ?? [];
    list.push(device);
    devicesByUser.set(device.userId, list);
  }

  const candidates: CampaignCandidate[] = [];

  for (const stat of userStats) {
    if (stat.totalCount <= 0) {
      continue;
    }

    const text = stat.isPremium
      ? weeklySummaryPremiumTemplate(stat.totalCount, stat.activeDays)
      : weeklySummaryFreeTemplate(stat.totalCount);

    const userDevices = devicesByUser.get(stat.userId) ?? [];
    for (const device of userDevices) {
      candidates.push({
        deviceId: device.deviceId,
        expoPushToken: device.expoPushToken ?? '',
        title: text.title,
        body: text.body,
        data: { route: STATS_ROUTE },
        meta: {
          userId: stat.userId,
          totalCount: stat.totalCount,
          activeDays: stat.activeDays,
        },
      });
    }
  }

  return { candidates, skippedPrefs: 0 };
}

// 0=Pazar..6=Cumartesi (Date#getUTCDay ile aynı sözleşim). date-keys.ts'teki
// shiftDateKey'in kullandığı "salt takvim günü -> UTC gece yarısı" hilesiyle
// tutarlı: anahtar zaten bir saat dilimi taşımadığından UTC'ye sabitlenebilir.
function istanbulDayOfWeek(dateKey: string): number {
  const [year, month, day] = dateKey.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day)).getUTCDay();
}

/** Şimdiki ana göre "geçen hafta" (İstanbul, Pazartesi–Pazar) anahtar aralığı. */
export function lastIstanbulWeekRange(now: Date): {
  startKey: string;
  endKey: string;
} {
  const todayKey = istanbulDateKey(now);
  const daysSinceMonday = (istanbulDayOfWeek(todayKey) + 6) % 7;
  const thisWeekMondayKey = shiftDateKey(todayKey, -daysSinceMonday);

  return {
    startKey: shiftDateKey(thisWeekMondayKey, -7),
    endKey: shiftDateKey(thisWeekMondayKey, -1),
  };
}

type WeeklyAggregateRow = {
  userId: Types.ObjectId;
  totalCount: number;
  activeDays: number;
};

@Injectable()
export class WeeklySummaryCampaign {
  constructor(
    @InjectModel(DhikrLog.name)
    private readonly dhikrLogModel: Model<DhikrLogDocument>,
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
    @InjectModel(Device.name)
    private readonly deviceModel: Model<DeviceDocument>,
  ) {}

  async buildCandidates(now: Date): Promise<CampaignBuildResult> {
    const { startKey, endKey } = lastIstanbulWeekRange(now);

    // Tüm kullanıcılar için tek $group agregasyonu (spesifikasyon gereği):
    // sıfır aktiviteli kullanıcılar $match'te hiç satır üretmediği için
    // sonuçta doğal olarak yer almaz.
    const rows = await this.dhikrLogModel
      .aggregate<WeeklyAggregateRow>([
        { $match: { date: { $gte: startKey, $lte: endKey } } },
        {
          $group: {
            _id: '$userId',
            totalCount: { $sum: '$count' },
            activeDates: { $addToSet: '$date' },
          },
        },
        {
          $project: {
            _id: 0,
            userId: '$_id',
            totalCount: 1,
            activeDays: { $size: '$activeDates' },
          },
        },
      ])
      .exec();

    if (rows.length === 0) {
      return { candidates: [], skippedPrefs: 0 };
    }

    const userIds = rows.map((row) => row.userId);

    const [users, devices] = await Promise.all([
      this.userModel
        .find({ _id: { $in: userIds } })
        .select('isPremium')
        .lean()
        .exec(),
      this.deviceModel
        .find({
          userId: { $in: userIds },
          isActive: true,
          expoPushToken: { $exists: true, $nin: [null, ''] },
        })
        .select('deviceId expoPushToken userId')
        .lean()
        .exec(),
    ]);

    const premiumByUserId = new Map(
      users.map((user) => [String(user._id), Boolean(user.isPremium)]),
    );

    const userStats: WeeklySummaryUserStat[] = rows.map((row) => ({
      userId: String(row.userId),
      totalCount: row.totalCount,
      activeDays: row.activeDays,
      isPremium: premiumByUserId.get(String(row.userId)) ?? false,
    }));

    const deviceInputs: WeeklySummaryDeviceInput[] = devices
      .filter((device) => device.userId !== null)
      .map((device) => ({
        deviceId: device.deviceId,
        expoPushToken: device.expoPushToken,
        userId: String(device.userId),
      }));

    return selectWeeklySummaryCandidates(userStats, deviceInputs);
  }
}
