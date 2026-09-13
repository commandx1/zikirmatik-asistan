import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import type { Model } from 'mongoose';
import { istanbulDateKey } from '../../common/utils/date-keys';
import { PushSenderService } from '../push/push-sender.service';
import {
  PushDispatch,
  type PushDispatchDocument,
} from './schemas/push-dispatch.schema';
import { WinbackCampaign } from './campaigns/winback.campaign';
import { KandilCampaign } from './campaigns/kandil.campaign';
import { WeeklySummaryCampaign } from './campaigns/weekly-summary.campaign';
import type {
  CampaignBuildResult,
  CampaignCandidate,
  CampaignKey,
  CampaignRunResult,
  CampaignSkipCounts,
  CampaignTriggerOptions,
} from './push-campaigns.types';

const CAMPAIGN_TIMEZONE = 'Europe/Istanbul';
// 22:00-08:00 İstanbul arası "sessiz saat" — force olmadan hiç gönderim yapılmaz.
const QUIET_HOURS_START_HOUR = 22;
const QUIET_HOURS_END_HOUR = 8;

@Injectable()
export class PushCampaignsService {
  private readonly logger = new Logger(PushCampaignsService.name);

  constructor(
    @InjectModel(PushDispatch.name)
    private readonly pushDispatchModel: Model<PushDispatchDocument>,
    private readonly pushSender: PushSenderService,
    private readonly winbackCampaign: WinbackCampaign,
    private readonly kandilCampaign: KandilCampaign,
    private readonly weeklySummaryCampaign: WeeklySummaryCampaign,
  ) {}

  async run(
    campaign: CampaignKey,
    options: CampaignTriggerOptions = {},
  ): Promise<CampaignRunResult> {
    const now = new Date();
    const dayKey = istanbulDateKey(now);
    const dryRun = Boolean(options.dryRun);
    const force = Boolean(options.force);

    const { candidates, skippedPrefs } = await this.buildCandidates(
      campaign,
      now,
    );

    const skipped: CampaignSkipCounts = {
      dedupe: 0,
      quietHours: 0,
      noToken: 0,
      prefs: skippedPrefs,
      error: 0,
    };

    if (!force && this.isQuietHours(now)) {
      skipped.quietHours = candidates.length;
      return {
        campaign,
        dayKey,
        candidates: candidates.length,
        sent: 0,
        skipped,
        dryRun,
      };
    }

    const sent = dryRun
      ? await this.previewDispatch(dayKey, candidates, skipped)
      : await this.dispatch(campaign, dayKey, candidates, skipped);

    return {
      campaign,
      dayKey,
      candidates: candidates.length,
      sent,
      skipped,
      dryRun,
    };
  }

  private async buildCandidates(
    campaign: CampaignKey,
    now: Date,
  ): Promise<CampaignBuildResult> {
    switch (campaign) {
      case 'winback':
        return this.winbackCampaign.buildCandidates(now);
      case 'kandil-eve':
        return this.kandilCampaign.buildCandidates('eve', now);
      case 'kandil-day':
        return this.kandilCampaign.buildCandidates('day', now);
      case 'weekly-summary':
        return this.weeklySummaryCampaign.buildCandidates(now);
    }
  }

  // Gerçek gönderim/rezervasyon YOK: yalnızca push_dispatches'ta bugün için
  // zaten bir kayıt olup olmadığına bakar (salt-okunur), Expo'ya hiç dokunmaz.
  private async previewDispatch(
    dayKey: string,
    candidates: CampaignCandidate[],
    skipped: CampaignSkipCounts,
  ): Promise<number> {
    const deviceIds = candidates.map((c) => c.deviceId);
    const alreadyDispatched = await this.findExistingDeviceIds(
      dayKey,
      deviceIds,
    );

    let sent = 0;
    for (const candidate of candidates) {
      if (!candidate.expoPushToken) {
        skipped.noToken += 1;
      } else if (alreadyDispatched.has(candidate.deviceId)) {
        skipped.dedupe += 1;
      } else {
        sent += 1;
      }
    }
    return sent;
  }

  private async dispatch(
    campaign: CampaignKey,
    dayKey: string,
    candidates: CampaignCandidate[],
    skipped: CampaignSkipCounts,
  ): Promise<number> {
    let sent = 0;

    for (const candidate of candidates) {
      if (!candidate.expoPushToken) {
        skipped.noToken += 1;
        continue;
      }

      const reserved = await this.reserve(
        campaign,
        candidate.deviceId,
        dayKey,
        candidate.meta,
      );
      if (!reserved) {
        skipped.dedupe += 1;
        continue;
      }

      try {
        await this.pushSender.sendToDevices(
          [
            {
              deviceId: candidate.deviceId,
              expoPushToken: candidate.expoPushToken,
            },
          ],
          {
            title: candidate.title,
            body: candidate.body,
            data: candidate.data,
          },
        );
        sent += 1;
      } catch (error) {
        skipped.error += 1;
        const message = (error as Error).message;
        this.logger.error(
          `Push gönderimi başarısız (campaign=${campaign} device=${candidate.deviceId}): ${message}`,
        );
        // Rezervasyon kasıtlı olarak kalır (retry fırtınası yok); yalnızca
        // teşhis için meta.error yazılır.
        await this.markDispatchError(
          campaign,
          candidate.deviceId,
          dayKey,
          message,
        );
      }
    }

    return sent;
  }

  // Rezervasyon-önce deseni: gönderimden ÖNCE insert edilir. E11000 (unique
  // index çakışması) "bugün zaten push aldı/alıyor" demektir — false döner.
  private async reserve(
    campaignKey: CampaignKey,
    deviceId: string,
    dayKey: string,
    meta: Record<string, unknown> | undefined,
  ): Promise<boolean> {
    try {
      await this.pushDispatchModel.create({
        campaignKey,
        deviceId,
        dayKey,
        sentAt: new Date(),
        meta,
      });
      return true;
    } catch (error) {
      if (isDuplicateKeyError(error)) {
        return false;
      }
      this.logger.error(
        `push_dispatches rezervasyon hatası (campaign=${campaignKey} device=${deviceId}): ${(error as Error).message}`,
      );
      return false;
    }
  }

  private async markDispatchError(
    campaignKey: CampaignKey,
    deviceId: string,
    dayKey: string,
    message: string,
  ): Promise<void> {
    try {
      await this.pushDispatchModel
        .updateOne(
          { campaignKey, deviceId, dayKey },
          { $set: { 'meta.error': message } },
        )
        .exec();
    } catch (error) {
      this.logger.error(
        `Dispatch meta.error güncellenemedi (device=${deviceId}): ${(error as Error).message}`,
      );
    }
  }

  private async findExistingDeviceIds(
    dayKey: string,
    deviceIds: string[],
  ): Promise<Set<string>> {
    if (deviceIds.length === 0) {
      return new Set();
    }

    const rows = await this.pushDispatchModel
      .find({ dayKey, deviceId: { $in: deviceIds } })
      .select('deviceId')
      .lean()
      .exec();

    return new Set(rows.map((row) => row.deviceId));
  }

  private isQuietHours(now: Date): boolean {
    const hour = istanbulHour(now);
    return hour >= QUIET_HOURS_START_HOUR || hour < QUIET_HOURS_END_HOUR;
  }
}

function istanbulHour(date: Date): number {
  const formatted = new Intl.DateTimeFormat('en-GB', {
    timeZone: CAMPAIGN_TIMEZONE,
    hourCycle: 'h23',
    hour: '2-digit',
  }).format(date);
  // Bazı ICU sürümleri gece yarısını "24" olarak biçimlendirebilir; %24 bunu
  // güvenle 0'a normalize eder.
  return Number(formatted) % 24;
}

function isDuplicateKeyError(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code?: number }).code === 11000
  );
}
