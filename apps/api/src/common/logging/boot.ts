import type { AppLogger } from './app-logger';
import { flushDrain } from './app-logger';

/**
 * Prod'da açılışta kritik secret'lar eksikse ya da test-token bypass'ı açıksa
 * haber verir — durdurmaz (Render'da tek instance, çökme=downtime).
 */
export function bootChecks(logger: AppLogger) {
  if (process.env.NODE_ENV !== 'production') {
    return;
  }

  const requiredSecrets = [
    'AUTH_ACCESS_TOKEN_SECRET',
    'AUTH_REFRESH_TOKEN_SECRET',
    'REVENUECAT_WEBHOOK_SECRET',
    // Kampanya secret'ı yalnız sunucu push'u açıkken zorunlu (yoksa uç zaten fail-closed).
    ...(process.env.SERVER_PUSH_ENABLED === '1'
      ? ['CAMPAIGN_TRIGGER_SECRET']
      : []),
  ];

  const missing = requiredSecrets.filter((name) => !process.env[name]?.trim());
  const insecureTestTokens =
    process.env.AUTH_ALLOW_INSECURE_TEST_TOKENS === '1';

  if (missing.length > 0 || insecureTestTokens) {
    // Slack'e yalnız `message` gider — değişken ADLARI (değerleri değil) mesajda.
    const details = [
      ...missing.map((name) => `${name} eksik`),
      ...(insecureTestTokens ? ['AUTH_ALLOW_INSECURE_TEST_TOKENS=1'] : []),
    ].join(', ');
    logger.error(
      {
        event: 'boot.insecure_config',
        message: `Prod açılışta güvensiz yapılandırma: ${details}`,
        missing,
        insecureTestTokens,
        alert: 'boot.insecure_config',
      },
      'Boot',
    );
  }
}

export function registerProcessHandlers(logger: AppLogger) {
  process.on('unhandledRejection', (reason) => {
    logger.error({
      event: 'process.unhandledRejection',
      message: reason instanceof Error ? reason.message : String(reason),
      alert: 'process.unhandledRejection',
      ...(reason instanceof Error && { stack: reason.stack }),
    });
  });

  process.on('uncaughtException', (error) => {
    logger.fatal({
      event: 'process.uncaughtException',
      message: error.message,
      stack: error.stack,
      alert: 'process.uncaughtException',
    });

    void Promise.race([
      flushDrain(),
      new Promise((resolve) => setTimeout(resolve, 3000)),
    ]).finally(() => process.exit(1));
  });
}
