import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron } from '@nestjs/schedule';
import { InjectModel } from '@nestjs/mongoose';
import type { Model } from 'mongoose';
import { User, type UserDocument } from '../users/schemas/user.schema';
import {
  PrayerTime,
  type PrayerTimeDocument,
} from './schemas/prayer-time.schema';

type CollectApiPrayerTime = {
  vakit: string;
  saat: string;
};

@Injectable()
export class PrayerTimesService {
  private readonly logger = new Logger(PrayerTimesService.name);

  constructor(
    private readonly configService: ConfigService,
    @InjectModel(PrayerTime.name)
    private readonly prayerTimeModel: Model<PrayerTimeDocument>,
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
  ) {}

  @Cron('0 1 0 * * *', { timeZone: 'Europe/Istanbul' })
  async syncPrayerTimesJob() {
    await this.syncPrayerTimesForAllCities();
  }

  async getByCity(city: string) {
    const normalizedCity = normalizeCity(city);
    if (!normalizedCity) {
      throw new BadRequestException('Şehir bilgisi zorunludur.');
    }

    const prayerTimes = await this.prayerTimeModel
      .findOne({ city: normalizedCity })
      .lean()
      .exec();

    if (!prayerTimes) {
      throw new NotFoundException(
        'Bu şehir için namaz vakti kaydı bulunamadı.',
      );
    }

    return {
      city: prayerTimes.city,
      times: prayerTimes.times,
      updatedAt: prayerTimes.updatedAt,
    };
  }

  async syncPrayerTimesForAllCities() {
    const apiKey = this.configService.get<string>('COLLECT_API_KEY');
    if (!apiKey) {
      this.logger.warn(
        'COLLECT_API_KEY tanımlı değil. Namaz vakti senkronu atlandı.',
      );
      return;
    }

    const distinctCities = await this.userModel.distinct('city', {
      city: { $type: 'string', $ne: '' },
    });
    const cities = Array.from(
      new Set(
        distinctCities.map((city) => normalizeCity(city)).filter(Boolean),
      ),
    );

    if (cities.length === 0) {
      this.logger.warn(
        'Users koleksiyonunda şehir bilgisi bulunamadı. Namaz vakti senkronu atlandı.',
      );
      return;
    }

    const existingRows = await this.prayerTimeModel
      .find({ city: { $in: cities } })
      .select({ city: 1, updatedAt: 1 })
      .lean()
      .exec();
    const updatedAtByCity = new Map(
      existingRows.map((item) => [item.city, item.updatedAt]),
    );

    const now = new Date();
    let successCount = 0;
    let failedCount = 0;
    let skippedCount = 0;
    let requestCount = 0;

    for (const city of cities) {
      const cityUpdatedAt = updatedAtByCity.get(city);
      if (cityUpdatedAt && isSameMonthByTimezone(cityUpdatedAt, now)) {
        skippedCount += 1;
        this.logger.log(
          `Bu ay zaten güncel. API isteği atlanıyor. city=${city}`,
        );
        continue;
      }

      requestCount += 1;
      const isSuccess = await this.syncSingleCity(city, apiKey);
      if (isSuccess) {
        successCount += 1;
      } else {
        failedCount += 1;
      }
    }

    this.logger.log(
      `Namaz vakti senkronu tamamlandı. total=${cities.length}, requested=${requestCount}, skipped=${skippedCount}, success=${successCount}, failed=${failedCount}`,
    );
  }

  private async syncSingleCity(city: string, apiKey: string) {
    const endpoint = `https://api.collectapi.com/pray/all?city=${encodeURIComponent(city)}`;

    try {
      const response = await fetch(endpoint, {
        method: 'GET',
        headers: {
          authorization: `apikey ${apiKey}`,
          'content-type': 'application/json',
        },
      });

      if (!response.ok) {
        this.logger.error(
          `CollectAPI namaz vakti isteği başarısız oldu. city=${city}, status=${response.status}`,
        );
        return false;
      }

      const payload = (await response.json()) as unknown;
      const times = this.normalizeTimes(payload);

      if (times.length === 0) {
        this.logger.warn(`CollectAPI yanıtı boş veya geçersiz. city=${city}`);
        return false;
      }

      await this.prayerTimeModel
        .findOneAndUpdate(
          { city },
          {
            $set: {
              city,
              times,
            },
          },
          {
            upsert: true,
            returnDocument: 'after',
          },
        )
        .exec();

      this.logger.log(
        `Namaz vakitleri güncellendi. city=${city}, count=${times.length}`,
      );
      return true;
    } catch (error) {
      this.logger.error(
        `Namaz vakti senkronunda beklenmeyen hata. city=${city}`,
        error instanceof Error ? error.stack : undefined,
      );
      return false;
    }
  }

  private normalizeTimes(payload: unknown) {
    const fromArray = Array.isArray(payload)
      ? payload
      : this.extractResultArray(payload);

    if (!Array.isArray(fromArray)) {
      return [] as CollectApiPrayerTime[];
    }

    return fromArray
      .map((item) => {
        if (!item || typeof item !== 'object') {
          return null;
        }

        const rawVakit = (item as { vakit?: unknown }).vakit;
        const rawSaat = (item as { saat?: unknown }).saat;

        if (typeof rawVakit !== 'string' || typeof rawSaat !== 'string') {
          return null;
        }

        return {
          vakit: rawVakit.trim(),
          saat: rawSaat.trim(),
        } satisfies CollectApiPrayerTime;
      })
      .filter((item): item is CollectApiPrayerTime => Boolean(item));
  }

  private extractResultArray(payload: unknown) {
    if (!payload || typeof payload !== 'object') {
      return null;
    }

    const result = (payload as { result?: unknown }).result;
    return Array.isArray(result) ? result : null;
  }
}

function normalizeCity(value: unknown) {
  if (typeof value !== 'string') {
    return '';
  }

  return value.trim().toLocaleLowerCase('tr-TR');
}

function isSameMonthByTimezone(a: Date, b: Date) {
  return toMonthKey(a) === toMonthKey(b);
}

function toMonthKey(value: Date) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Istanbul',
    year: 'numeric',
    month: '2-digit',
  }).formatToParts(value);

  const year = parts.find((item) => item.type === 'year')?.value ?? '0000';
  const month = parts.find((item) => item.type === 'month')?.value ?? '00';
  return `${year}-${month}`;
}
