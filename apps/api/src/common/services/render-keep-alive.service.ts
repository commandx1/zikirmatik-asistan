import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

const DEFAULT_INTERVAL_MINUTES = 10;
const DEFAULT_TIMEOUT_MS = 8_000;

@Injectable()
export class RenderKeepAliveService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RenderKeepAliveService.name);
  private intervalId?: NodeJS.Timeout;

  constructor(private readonly configService: ConfigService) {}

  onModuleInit() {
    const isProduction =
      this.configService.get<string>('NODE_ENV') === 'production';
    const url = this.configService.get<string>('RENDER_KEEP_ALIVE_URL')?.trim();
    const enabled =
      this.toBoolean(
        this.configService.get<string>('RENDER_KEEP_ALIVE_ENABLED'),
      ) ?? Boolean(url);

    if (!isProduction || !enabled || !url) {
      return;
    }

    const intervalMinutes =
      this.parsePositiveInt(
        this.configService.get<string>('RENDER_KEEP_ALIVE_INTERVAL_MINUTES'),
      ) ?? DEFAULT_INTERVAL_MINUTES;
    const intervalMs = intervalMinutes * 60_000;

    void this.ping(url, 'startup');
    this.intervalId = setInterval(() => {
      void this.ping(url, 'interval');
    }, intervalMs);

    this.logger.log(
      `Render keep-alive aktif. Her ${intervalMinutes} dk bir ${url} pinglenecek.`,
    );
  }

  onModuleDestroy() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = undefined;
    }
  }

  private async ping(url: string, reason: 'startup' | 'interval') {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);

    try {
      const response = await fetch(url, {
        method: 'GET',
        signal: controller.signal,
        headers: {
          'user-agent': 'zikirmatik-keep-alive',
          'x-keep-alive-reason': reason,
        },
      });

      if (!response.ok) {
        this.logger.warn(
          `Keep-alive ping başarısız (${response.status} ${response.statusText}).`,
        );
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Bilinmeyen hata';
      this.logger.warn(`Keep-alive ping hatası: ${message}`);
    } finally {
      clearTimeout(timeout);
    }
  }

  private toBoolean(value: string | undefined) {
    if (!value) {
      return undefined;
    }

    const normalized = value.trim().toLowerCase();
    if (normalized === '1' || normalized === 'true' || normalized === 'yes') {
      return true;
    }
    if (normalized === '0' || normalized === 'false' || normalized === 'no') {
      return false;
    }

    return undefined;
  }

  private parsePositiveInt(value: string | undefined) {
    if (!value) {
      return undefined;
    }

    const parsed = Number.parseInt(value, 10);
    if (Number.isNaN(parsed) || parsed <= 0) {
      return undefined;
    }

    return parsed;
  }
}
