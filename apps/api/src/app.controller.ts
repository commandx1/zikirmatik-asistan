import { Controller, Get } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { ConnectionStates, type Connection } from 'mongoose';

@Controller()
export class AppController {
  constructor(@InjectConnection() private readonly connection: Connection) {}

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
