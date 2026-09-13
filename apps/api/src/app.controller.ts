import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  @Get('health')
  getHealth() {
    return {
      status: 'ok',
      service: 'api',
      timestamp: new Date().toISOString(),
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
