import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import type { Model } from 'mongoose';
import {
  Device,
  type DeviceDocument,
} from '../../devices/schemas/device.schema';
import { WINBACK_TEMPLATES } from '../templates';
import type {
  CampaignBuildResult,
  CampaignCandidate,
} from '../push-campaigns.types';

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const HOME_ROUTE = '/(tabs)/home';

export type WinbackDeviceInput = {
  deviceId: string;
  expoPushToken?: string;
  lastSeenAt: Date;
  prefs?: { streak?: boolean };
};

/**
 * Pure seçim mantığı (DB'siz) — winback.campaign.spec.ts doğrudan bunu test
 * eder. lastSeenAt'e göre cihazın [3,4) veya [7,8) günlük pasiflik
 * penceresinden hangisine düştüğünü belirler; prefs.streak === false olan
 * cihazları eler (en yakın tercih: geri kazanım bildirimleri seri/streak
 * hatırlatmalarıyla aynı anlamsal kapıyı paylaşır).
 */
export function selectWinbackCandidates(
  devices: WinbackDeviceInput[],
  now: Date,
): CampaignBuildResult {
  const candidates: CampaignCandidate[] = [];
  let skippedPrefs = 0;

  for (const device of devices) {
    const diffDays = (now.getTime() - device.lastSeenAt.getTime()) / MS_PER_DAY;
    const isDay3Window = diffDays >= 3 && diffDays < 4;
    const isDay7Window = diffDays >= 7 && diffDays < 8;

    if (!isDay3Window && !isDay7Window) {
      continue;
    }

    if (device.prefs?.streak === false) {
      skippedPrefs += 1;
      continue;
    }

    const template = isDay3Window
      ? WINBACK_TEMPLATES.day3
      : WINBACK_TEMPLATES.day7;

    candidates.push({
      deviceId: device.deviceId,
      expoPushToken: device.expoPushToken ?? '',
      title: template.title,
      body: template.body,
      data: { route: HOME_ROUTE },
      meta: { window: isDay3Window ? 'day3' : 'day7' },
    });
  }

  return { candidates, skippedPrefs };
}

@Injectable()
export class WinbackCampaign {
  constructor(
    @InjectModel(Device.name)
    private readonly deviceModel: Model<DeviceDocument>,
  ) {}

  async buildCandidates(now: Date): Promise<CampaignBuildResult> {
    // [7,8) penceresinin alt sınırından biraz geniş bir aralık çekip kesin
    // filtreyi (pencere ayrımı + prefs) pure fonksiyona bırakıyoruz.
    const lowerBoundExclusive = new Date(now.getTime() - 8 * MS_PER_DAY);
    const upperBoundInclusive = new Date(now.getTime() - 3 * MS_PER_DAY);

    const devices = await this.deviceModel
      .find({
        isActive: true,
        expoPushToken: { $exists: true, $nin: [null, ''] },
        lastSeenAt: { $gt: lowerBoundExclusive, $lte: upperBoundInclusive },
      })
      .select('deviceId expoPushToken lastSeenAt prefs')
      .lean()
      .exec();

    return selectWinbackCandidates(
      devices.map((device) => ({
        deviceId: device.deviceId,
        expoPushToken: device.expoPushToken,
        lastSeenAt: device.lastSeenAt,
        prefs: device.prefs,
      })),
      now,
    );
  }
}
