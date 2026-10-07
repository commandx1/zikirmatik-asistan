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
import {
  dateKeyInZone,
  shiftDateKey,
  validTimezone,
} from '../../../common/utils/date-keys';
import {
  kandilDayTemplate,
  kandilEveTemplate,
  type PushLocale,
} from '../templates';
import type {
  CampaignBuildResult,
  CampaignCandidate,
} from '../push-campaigns.types';

export type KandilMode = 'eve' | 'day';

export type KandilSpecialDayInput = {
  id: string;
  nameTr: string;
  // EN cihazlar için; boşsa TR ad kullanılır.
  nameEn?: string;
};

export type KandilDeviceInput = {
  deviceId: string;
  expoPushToken?: string;
  prefs?: { specialDays?: boolean };
  locale?: PushLocale;
  timezone?: string;
};

/**
 * Pure tarih eşleşmesi (DB'siz) — kandil.campaign.spec.ts doğrudan bunu test
 * eder. 'eve' yarının, 'day' bugünün takvim gününü hedefler; "bugün" cihazın
 * kayıtlı IANA bölgesine göre (yok/geçersizse İstanbul) hesaplanır.
 */
export function resolveKandilTargetDateKey(
  mode: KandilMode,
  now: Date,
  timezone?: string,
): string {
  const todayKey = dateKeyInZone(now, validTimezone(timezone));
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
    for (const device of devices) {
      if (device.prefs?.specialDays === false) {
        skippedPrefs += 1;
        continue;
      }

      const text =
        device.locale === 'en'
          ? buildText(specialDay.nameEn || specialDay.nameTr, 'en')
          : buildText(specialDay.nameTr);

      candidates.push({
        deviceId: device.deviceId,
        expoPushToken: device.expoPushToken ?? '',
        title: text.title,
        body: text.body,
        data: { route: `/special-days/${specialDay.id}` },
        timezone: device.timezone,
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
    // Cihaz bölgeleri UTC-12..+14 aralığında "bugün"ü ±1 gün kaydırır; geniş
    // aralıkla çek, eşleşmeyi cihaz başına yap.
    const utcToday = dateKeyInZone(now, 'UTC');
    const specialDayDocs = await this.specialDayModel
      .find({
        type: 'kandil',
        date: {
          $gte: shiftDateKey(utcToday, -2),
          $lte: shiftDateKey(utcToday, 3),
        },
        isActive: true,
      })
      .select('name date')
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
      .select('deviceId expoPushToken prefs locale timezone')
      .lean()
      .exec();

    const deviceInputs: KandilDeviceInput[] = devices.map((device) => ({
      deviceId: device.deviceId,
      expoPushToken: device.expoPushToken,
      prefs: device.prefs,
      locale: device.locale,
      timezone: device.timezone,
    }));

    const result: CampaignBuildResult = { candidates: [], skippedPrefs: 0 };
    for (const doc of specialDayDocs) {
      const { candidates, skippedPrefs } = selectKandilCandidates(
        [{ id: String(doc._id), nameTr: doc.name.tr, nameEn: doc.name.en }],
        deviceInputs.filter(
          (device) =>
            resolveKandilTargetDateKey(mode, now, device.timezone) === doc.date,
        ),
        mode,
      );
      result.candidates.push(...candidates);
      result.skippedPrefs += skippedPrefs;
    }
    return result;
  }
}
