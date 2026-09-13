import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { Types, type Model } from 'mongoose';
import {
  MAX_EVENTS_PER_REQUEST,
  TrackEventItemDto,
  TrackEventsDto,
} from './dto/track-events.dto';
import {
  AppEvent,
  type AppEventDocument,
  type AppEventPropValue,
} from './schemas/app-event.schema';

const MAX_PROP_KEYS = 20;
const MAX_PROP_STRING_LENGTH = 200;

type AppEventInsert = {
  deviceId: string;
  userId?: Types.ObjectId;
  name: string;
  props?: Record<string, AppEventPropValue>;
  clientTs: Date;
  createdAt: Date;
};

@Injectable()
export class EventsService {
  private readonly logger = new Logger(EventsService.name);

  constructor(
    @InjectModel(AppEvent.name)
    private readonly appEventModel: Model<AppEventDocument>,
  ) {}

  // Hatalı olaylar tek tek atlanır; istek her zaman 200 döner (bkz.
  // EventsController) — analitik ana akışı asla bozmamalı.
  async track(payload: TrackEventsDto, userId?: string) {
    const userObjectId =
      userId && Types.ObjectId.isValid(userId)
        ? new Types.ObjectId(userId)
        : undefined;
    const receivedAt = new Date();

    const docs = payload.events
      .slice(0, MAX_EVENTS_PER_REQUEST)
      .map((raw) =>
        this.toValidDocument(raw, payload.deviceId, userObjectId, receivedAt),
      )
      .filter((doc): doc is AppEventInsert => doc !== null);

    if (docs.length === 0) {
      return { accepted: 0 };
    }

    try {
      const inserted = await this.appEventModel.insertMany(docs, {
        ordered: false,
      });
      return { accepted: inserted.length };
    } catch (error) {
      // ordered:false ile bazı belgeler yine de yazılmış olabilir; Mongoose
      // bunu insertedDocs üzerinden raporlar. Ne olursa olsun burada da
      // isteği 200 ile kapatırız, hata yalnızca loglanır.
      const insertedCount = this.extractInsertedCount(error);
      this.logger.warn(
        `app_events insertMany kısmi/başarısız (${docs.length} aday): ${extractMessage(error)}`,
      );
      return { accepted: insertedCount };
    }
  }

  private toValidDocument(
    raw: unknown,
    deviceId: string,
    userId: Types.ObjectId | undefined,
    receivedAt: Date,
  ): AppEventInsert | null {
    if (!raw || typeof raw !== 'object') {
      return null;
    }

    const item = plainToInstance(TrackEventItemDto, raw, {
      excludeExtraneousValues: false,
    });
    const errors = validateSync(item, {
      whitelist: true,
      forbidNonWhitelisted: false,
    });
    if (errors.length > 0) {
      return null;
    }

    const clientTs = new Date(item.ts);
    if (Number.isNaN(clientTs.getTime())) {
      return null;
    }

    if (!isValidEventProps(item.props)) {
      return null;
    }

    return {
      deviceId,
      ...(userId ? { userId } : {}),
      name: item.name,
      ...(item.props ? { props: item.props } : {}),
      clientTs,
      createdAt: receivedAt,
    };
  }

  private extractInsertedCount(error: unknown): number {
    const withDetails = error as {
      insertedDocs?: unknown[];
      result?: { insertedCount?: number };
    };
    if (Array.isArray(withDetails?.insertedDocs)) {
      return withDetails.insertedDocs.length;
    }
    if (typeof withDetails?.result?.insertedCount === 'number') {
      return withDetails.result.insertedCount;
    }
    return 0;
  }
}

// `props`, en fazla ~20 anahtar taşıyabilir ve string değerler 200
// karakterle sınırlıdır; bunu ihlal eden olay tek tek atlanır (bkz.
// EventsService.toValidDocument). Diziler ve iç içe nesneler kabul edilmez.
function isValidEventProps(
  props: unknown,
): props is Record<string, AppEventPropValue> | undefined {
  if (props === undefined) {
    return true;
  }

  if (typeof props !== 'object' || props === null || Array.isArray(props)) {
    return false;
  }

  const entries = Object.entries(props as Record<string, unknown>);
  if (entries.length > MAX_PROP_KEYS) {
    return false;
  }

  return entries.every(([, value]) => {
    if (typeof value === 'boolean') {
      return true;
    }
    if (typeof value === 'number') {
      return Number.isFinite(value);
    }
    if (typeof value === 'string') {
      return value.length <= MAX_PROP_STRING_LENGTH;
    }
    return false;
  });
}

function extractMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
