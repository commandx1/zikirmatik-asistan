import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import type { Model } from 'mongoose';
import {
  Device,
  type DeviceDocument,
} from '../../devices/schemas/device.schema';
import {
  SpecialDay,
  type SpecialDayDocument,
} from '../../special-days/schemas/special-day.schema';
import { istanbulDateKey, shiftDateKey } from '../../../common/utils/date-keys';
import { kandilDayTemplate, kandilEveTemplate } from '../templates';
import type {
  CampaignBuildResult,
  CampaignCandidate,
} from '../push-campaigns.types';

export type KandilMode = 'eve' | 'day';

export type KandilSpecialDayInput = {
  id: string;
  nameTr: string;
};

export type KandilDeviceInput = {
  deviceId: string;
  expoPushToken?: string;
  prefs?: { specialDays?: boolean };
};

/**
 * Pure tarih eşleşmesi (DB'siz) — kandil.campaign.spec.ts doğrudan bunu test
 * eder. 'eve' yarının, 'day' bugünün İstanbul takvim gününü hedefler.
 */
export function resolveKandilTargetDateKey(
  mode: KandilMode,
  now: Date,
): string {
  const todayKey = istanbulDateKey(now);
  return mode === 'eve' ? shiftDateKey(todayKey, 1) : todayKey;
}

/**
 * Pure seçim mantığı (DB'siz) — kandil.campaign.spec.ts doğrudan bunu test
 * eder. Eşleşen kandil(ler) için prefs.specialDays !== false olan her cihaza
 * bir aday üretir. Birden fazla kandil aynı güne denk gelirse (pratikte
 * olmaz) her biri için ayrı aday üretilir; push_dispatches'taki günlük tekil
 * kısıt aynı cihaza en fazla birinin ulaşmasını garanti eder.
 */
export function selectKandilCandidates(
  specialDays: KandilSpecialDayInput[],
  devices: KandilDeviceInput[],
  mode: KandilMode,
): CampaignBuildResult {
  if (specialDays.length === 0) {
    return { candidates: [], skippedPrefs: 0 };
  }

  const candidates: CampaignCandidate[] = [];
  let skippedPrefs = 0;
  const buildText = mode === 'eve' ? kandilEveTemplate : kandilDayTemplate;

  for (const specialDay of specialDays) {
    const text = buildText(specialDay.nameTr);

    for (const device of devices) {
      if (device.prefs?.specialDays === false) {
        skippedPrefs += 1;
        continue;
      }

      candidates.push({
        deviceId: device.deviceId,
        expoPushToken: device.expoPushToken ?? '',
        title: text.title,
        body: text.body,
        data: { route: `/special-days/${specialDay.id}` },
        meta: { specialDayId: specialDay.id, mode },
      });
    }
  }

  return { candidates, skippedPrefs };
}

@Injectable()
export class KandilCampaign {
  constructor(
    @InjectModel(SpecialDay.name)
    private readonly specialDayModel: Model<SpecialDayDocument>,
    @InjectModel(Device.name)
    private readonly deviceModel: Model<DeviceDocument>,
  ) {}

  async buildCandidates(
    mode: KandilMode,
    now: Date,
  ): Promise<CampaignBuildResult> {
    const targetDateKey = resolveKandilTargetDateKey(mode, now);

    const specialDayDocs = await this.specialDayModel
      .find({ type: 'kandil', date: targetDateKey, isActive: true })
      .select('name')
      .lean()
      .exec();

    if (specialDayDocs.length === 0) {
      return { candidates: [], skippedPrefs: 0 };
    }

    const devices = await this.deviceModel
      .find({
        isActive: true,
        expoPushToken: { $exists: true, $nin: [null, ''] },
      })
      .select('deviceId expoPushToken prefs')
      .lean()
      .exec();

    return selectKandilCandidates(
      specialDayDocs.map((doc) => ({
        id: String(doc._id),
        nameTr: doc.name.tr,
      })),
      devices.map((device) => ({
        deviceId: device.deviceId,
        expoPushToken: device.expoPushToken,
        prefs: device.prefs,
      })),
      mode,
    );
  }
}
