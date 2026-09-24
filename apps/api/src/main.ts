import { LogLevel } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppLogger } from './common/logging/app-logger';
import { bootChecks, registerProcessHandlers } from './common/logging/boot';
import { AppModule } from './app.module';
import { configureApp } from './app.setup';

// LOG_LEVEL o seviye ve üzerini açar (bkz. isLogLevelEnabled: tek elemanlı
// dizi "bu seviye ve üstü" anlamına gelir). 'info' Nest'in 'log' seviyesine denk düşer.
const LOG_LEVEL_MAP: Record<string, LogLevel> = {
  error: 'error',
  warn: 'warn',
  info: 'log',
  debug: 'debug',
  verbose: 'verbose',
};

async function bootstrap() {
  const logger = new AppLogger({ json: process.env.NODE_ENV === 'production' });
  const app = await NestFactory.create(AppModule, { logger });

  const configuredLevel = process.env.LOG_LEVEL
    ? LOG_LEVEL_MAP[process.env.LOG_LEVEL]
    : undefined;
  const defaultLevel: LogLevel =
    process.env.NODE_ENV === 'production' ? 'log' : 'debug';
  logger.setLogLevels([configuredLevel ?? defaultLevel]);

  configureApp(app);

  bootChecks(logger);
  registerProcessHandlers(logger);

  await app.listen(process.env.PORT ?? 3000);
}

void bootstrap();
