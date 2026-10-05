import { Controller, Get, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectConnection } from '@nestjs/mongoose';
import { ConnectionStates, type Connection } from 'mongoose';

@Controller()
export class AppController {
  private readonly logger = new Logger(AppController.name);

  constructor(@InjectConnection() private readonly connection: Connection) {}

  // Render free 15 dk boşta uyur (localhost sayılmaz → public URL); GH Actions cron güvenilmez.
  @Cron('*/10 * * * *')
  async keepAlive() {
    const url = process.env.RENDER_EXTERNAL_URL; // Render otomatik set eder; lokalde yok → no-op
    if (!url) return;
    await fetch(`${url}/health`, { signal: AbortSignal.timeout(30_000) }).catch(
      (err: unknown) =>
        this.logger.warn(`keep-alive ping başarısız: ${String(err)}`),
    );
  }

  @Get('health')
  getHealth() {
    return {
      status: 'ok',
      service: 'api',
      timestamp: new Date().toISOString(),
      // Uptime monitörü bu anahtara bakar — 503 dönmüyoruz, Render'ı
      // restart döngüsüne sokmamak için HTTP durumu her zaman 200.
      mongo:
        this.connection.readyState === ConnectionStates.connected
          ? 'up'
          : 'down',
    };
  }

  @Get('app-config')
  getAppConfig() {
    return {
      minVersion: process.env.APP_MIN_VERSION ?? '0',
      // Mobilin kandil/özel gün bildirimlerini yerelden sunucu push'una
      // devretmesini kontrol eden rollout bayrağı — varsayılan false (kapalı).
      // bkz. apps/api/docs/notification-campaigns-runbook.md "Devreye alma sırası".
      serverPushEnabled: process.env.SERVER_PUSH_ENABLED === '1',
    };
  }
}
