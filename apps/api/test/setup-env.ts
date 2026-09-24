// jest setupFiles: AppModule import edilmeden ÖNCE çalışır.
// @nestjs/config .env değerini yalnız `key in process.env` false ise yazar;
// bu yüzden burada KOŞULSUZ atıyoruz (apps/api/.env prod Atlas URI'si içerir).
const workerId = process.env.JEST_WORKER_ID ?? '1';

Object.assign(process.env, {
  NODE_ENV: 'test',
  TZ: 'Europe/Istanbul',
  MONGODB_URI: `mongodb://127.0.0.1:27018/zikir_e2e_w${workerId}_p${process.pid}?directConnection=true`,
  AUTH_ALLOW_INSECURE_TEST_TOKENS: '1',
  AUTH_ACCESS_TOKEN_SECRET: 'e2e-access',
  AUTH_REFRESH_TOKEN_SECRET: 'e2e-refresh',
  AUTH_ACCESS_TOKEN_TTL_MINUTES: '60',
  REVENUECAT_WEBHOOK_SECRET: 'test-rc-secret',
  CAMPAIGN_TRIGGER_SECRET: 'test-campaign-secret',
  SERVER_PUSH_ENABLED: '0',
  LOG_LEVEL: 'error',
  OPENAI_API_KEY: 'test-key',
  // Modül tanımı process.env'i import anında okur — AppModule'den önce olmalı.
  AI_RUNTIME_MOCK: '1',
  APP_MIN_VERSION: '0',
  // `delete` yetmez: .env'de varsa ConfigModule geri yazar. Boş string =
  // drain/Slack kapalı (app-logger `!url`, alerts `!webhookUrl`).
  LOG_DRAIN_URL: '',
  LOG_DRAIN_TOKEN: '',
  SLACK_ALERT_WEBHOOK_URL: '',
});
