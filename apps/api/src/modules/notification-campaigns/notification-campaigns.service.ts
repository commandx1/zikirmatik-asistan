import {
  Injectable,
  Logger,
  type OnApplicationBootstrap,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Cron } from '@nestjs/schedule';
import type { Model } from 'mongoose';
import { DevicesService } from '../devices/devices.service';
import { PushSenderService } from '../push/push-sender.service';
import {
  SpecialDay,
  type SpecialDayDocument,
} from '../special-days/schemas/special-day.schema';
import {
  NotificationDispatch,
  type NotificationDispatchDocument,
} from './schemas/notification-dispatch.schema';

const ISTANBUL_TIME_ZONE = 'Europe/Istanbul';

// Quiet hours: never dispatch between 22:00 (inclusive) and 09:00
// (exclusive) Istanbul time. The fixed cron times below (20:00 and 09:30)
// already comply — this is a defense-in-depth guard for manual triggers,
// delayed cron ticks, or future callers.
const QUIET_HOURS_START = 22;
const QUIET_HOURS_END = 9;

export type CampaignRunResult = {
  status:
    | 'sent'
    | 'quiet-hours'
    | 'already-sent'
    | 'no-special-day'
    | 'no-targets';
  sentCount?: number;
};

@Injectable()
export class NotificationCampaignsService implements OnApplicationBootstrap {
  private readonly logger = new Logger(NotificationCampaignsService.name);

  constructor(
    @InjectModel(NotificationDispatch.name)
    private readonly dispatchModel: Model<NotificationDispatchDocument>,
    @InjectModel(SpecialDay.name)
    private readonly specialDayModel: Model<SpecialDayDocument>,
    private readonly devicesService: DevicesService,
    private readonly pushSenderService: PushSenderService,
  ) {}

  // Catch-up on boot: on Render Free the instance sleeps after ~15 min idle,
  // so the in-process @Cron ticks are missed entirely while asleep. Any
  // wake-up (external ping, GitHub Actions trigger, organic traffic) re-runs
  // the campaigns for today; claimDispatch's unique key makes this idempotent,
  // and the quiet-hours guard keeps late-night wake-ups silent.
  onApplicationBootstrap() {
    void this.runCatchUp().catch((error) => {
      this.logger.error('Campaign catch-up failed.', error);
    });
  }

  async runCatchUp(now = new Date()) {
    const { weekday, hour, minute } = getIstanbulParts(now);

    if (weekday === 'Fri' && (hour > 9 || (hour === 9 && minute >= 30))) {
      const result = await this.runFridayCampaign(now);
      this.logger.log(`Friday catch-up: ${result.status}`);
    }

    if (hour >= 20) {
      const result = await this.runSpecialDayEveCampaign(now);
      this.logger.log(`Special-day catch-up: ${result.status}`);
    }
  }

  // 20:00 Istanbul, daily. Sends the "eve of a special day" (arife) push when
  // tomorrow (Istanbul calendar) is a special day.
  @Cron('0 20 * * *', { timeZone: ISTANBUL_TIME_ZONE })
  async runSpecialDayEveCampaign(now = new Date()): Promise<CampaignRunResult> {
    const { dateKey, hour } = getIstanbulParts(now);

    if (isInQuietHours(hour)) {
      this.logger.warn(
        `Special-day campaign skipped: inside quiet hours (${hour}:00 Istanbul).`,
      );
      return { status: 'quiet-hours' };
    }

    const tomorrow = addDaysToDateKey(dateKey, 1);
    const specialDays = await this.specialDayModel
      .find({ isActive: true, date: tomorrow })
      .sort({ priority: -1, createdAt: 1 })
      .lean()
      .exec();

    // When multiple special days fall on the same date, notify only for the
    // highest-priority one (mirrors the hero selection on the home screen).
    const specialDay = specialDays[0];
    if (!specialDay) {
      return { status: 'no-special-day' };
    }

    const claimKey = `special-day:${dateKey}`;
    const claimed = await this.claimDispatch(claimKey, 'special-day');
    if (!claimed) {
      return { status: 'already-sent' };
    }

    return this.dispatch(claimKey, 'specialDays', {
      title: `Bu Gece ${specialDay.name} 🌙`,
      body:
        specialDay.description?.trim() ||
        `Bu geceyi zikir ve dua ile ihya etmek için önerilen zikirlere göz at.`,
      data: { route: `/special-days/${specialDay._id.toString()}` },
    });
  }

  // 09:30 Istanbul, every Friday. Kehf suresi / salavat reminder.
  @Cron('30 9 * * 5', { timeZone: ISTANBUL_TIME_ZONE })
  async runFridayCampaign(now = new Date()): Promise<CampaignRunResult> {
    const { dateKey, hour } = getIstanbulParts(now);

    if (isInQuietHours(hour)) {
      this.logger.warn(
        `Friday campaign skipped: inside quiet hours (${hour}:00 Istanbul).`,
      );
      return { status: 'quiet-hours' };
    }

    const claimKey = `friday:${dateKey}`;
    const claimed = await this.claimDispatch(claimKey, 'friday');
    if (!claimed) {
      return { status: 'already-sent' };
    }

    return this.dispatch(claimKey, 'friday', {
      title: 'Hayırlı Cumalar 🕌',
      body: 'Bugün Kehf suresi okumayı ve bol bol salavat getirmeyi unutma.',
      data: { route: '/(tabs)/special-days' },
    });
  }

  private async dispatch(
    claimKey: string,
    pref: 'specialDays' | 'friday',
    message: { title: string; body: string; data: Record<string, unknown> },
  ): Promise<CampaignRunResult> {
    const devices = await this.devicesService.findActiveByPref(pref);
    const targets = devices
      .filter((device) => Boolean(device.expoPushToken))
      .map((device) => ({
        deviceId: device.deviceId,
        expoPushToken: device.expoPushToken as string,
      }));

    if (targets.length === 0) {
      // Release the claim: an empty audience is usually transient (devices
      // registering later the same day), so the next trigger should retry
      // instead of the campaign being permanently marked as sent.
      this.logger.warn(`Campaign "${pref}" had no targets; claim released.`);
      await this.releaseDispatchClaim(claimKey);
      return { status: 'no-targets', sentCount: 0 };
    }

    let result;
    try {
      result = await this.pushSenderService.sendToDevices(targets, message);
    } catch (error) {
      // Nothing reached Expo (network/config failure before any chunk was
      // accepted). Release the claim so the next cron run can retry instead
      // of the campaign being silently marked as sent.
      await this.releaseDispatchClaim(claimKey);
      throw error;
    }

    this.logger.log(
      `Campaign "${pref}" dispatched: ${result.sentCount} sent, ${result.ticketErrorCount} ticket errors, ${result.skippedCount} skipped, ${result.deactivatedDeviceIds.length} deactivated.`,
    );

    await this.recordDispatchResult(claimKey, {
      targetCount: targets.length,
      sentCount: result.sentCount,
      ticketErrorCount: result.ticketErrorCount,
    });

    return { status: 'sent', sentCount: result.sentCount };
  }

  // Best-effort observability: a claim row without a result means the send
  // crashed midway. Failures here must never fail the campaign itself.
  private async recordDispatchResult(
    key: string,
    result: { targetCount: number; sentCount: number; ticketErrorCount: number },
  ) {
    try {
      await this.dispatchModel.updateOne(
        { key },
        { $set: { result: { ...result, finishedAt: new Date() } } },
      );
    } catch (error) {
      this.logger.error(
        `Failed to record dispatch result for "${key}": ${String(error)}`,
      );
    }
  }

  private async releaseDispatchClaim(key: string) {
    try {
      await this.dispatchModel.deleteOne({ key });
    } catch (error) {
      this.logger.error(
        `Failed to release dispatch claim "${key}" after send error: ${String(error)}`,
      );
    }
  }

  // Insert-first claim on the unique key. Duplicate-key (11000) means another
  // run (or a re-run after restart) already sent this campaign. Per-device
  // send failures never roll this back — campaign-level dedup only.
  private async claimDispatch(key: string, type: 'special-day' | 'friday') {
    try {
      await this.dispatchModel.create({ key, type, sentAt: new Date() });
      return true;
    } catch (error) {
      if ((error as { code?: number }).code === 11000) {
        return false;
      }
      throw error;
    }
  }
}

export function isInQuietHours(hour: number) {
  return hour >= QUIET_HOURS_START || hour < QUIET_HOURS_END;
}

// Returns the wall-clock date key (YYYY-MM-DD) and hour in Istanbul,
// regardless of the server's own timezone. Uses Intl (no date library).
export function getIstanbulParts(now: Date) {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: ISTANBUL_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  });

  const parts = new Map(
    formatter.formatToParts(now).map((part) => [part.type, part.value]),
  );

  // en-US short weekday is period-free ("Fri"), unlike en-CA ("Fri.").
  const weekday = new Intl.DateTimeFormat('en-US', {
    timeZone: ISTANBUL_TIME_ZONE,
    weekday: 'short',
  }).format(now);

  return {
    dateKey: `${parts.get('year')}-${parts.get('month')}-${parts.get('day')}`,
    hour: Number(parts.get('hour')),
    minute: Number(parts.get('minute')),
    weekday,
  };
}

// Pure calendar-day arithmetic on a YYYY-MM-DD key (UTC internally, so no
// DST edge cases can shift the date).
export function addDaysToDateKey(dateKey: string, days: number) {
  const [year, month, day] = dateKey.split('-').map(Number);
  const shifted = new Date(Date.UTC(year, month - 1, day + days));
  return shifted.toISOString().slice(0, 10);
}
