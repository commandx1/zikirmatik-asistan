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
    };
  }
}
