export function validateEnv(config: Record<string, unknown>) {
  if (
    typeof config.MONGODB_URI !== 'string' ||
    config.MONGODB_URI.trim().length === 0
  ) {
    throw new Error(
      'MONGODB_URI ortam değişkeni zorunludur. apps/api/.env dosyasını kontrol et.',
    );
  }

  // Opsiyonel: sunucu tetikli push kampanyaları (POST /internal/campaigns/:campaign)
  // için secret. Tanımsız bırakılabilir (controller production'da fail-closed
  // 401 döner, development'ta uyarı loglayıp geçer — bkz.
  // push-campaigns.controller.ts). Tanımlıysa boş string olmamalı; aksi halde
  // yanlışlıkla "CAMPAIGN_TRIGGER_SECRET=" bırakılmış bir production ortamı
  // sessizce dev-bypass'a düşer.
  if (
    config.CAMPAIGN_TRIGGER_SECRET !== undefined &&
    (typeof config.CAMPAIGN_TRIGGER_SECRET !== 'string' ||
      config.CAMPAIGN_TRIGGER_SECRET.trim().length === 0)
  ) {
    throw new Error(
      'CAMPAIGN_TRIGGER_SECRET tanımlıysa boş olmayan bir string olmalıdır.',
    );
  }

  // Opsiyonel: GET /app-config üzerinden mobile duyurulan sunucu-push devir
  // bayrağı (bkz. app.controller.ts, notification-campaigns-runbook.md
  // "Devreye alma sırası"). Tanımsız veya boş string bırakılabilir (varsayılan
  // false/kapalı); tanımlıysa yalnızca '0' veya '1' olmalıdır.
  if (
    config.SERVER_PUSH_ENABLED !== undefined &&
    config.SERVER_PUSH_ENABLED !== '' &&
    config.SERVER_PUSH_ENABLED !== '0' &&
    config.SERVER_PUSH_ENABLED !== '1'
  ) {
    throw new Error("SERVER_PUSH_ENABLED tanımlıysa '0' veya '1' olmalıdır.");
  }

  // Opsiyonel: e2e/k6 AI mock anahtarı (bkz. modules/ai/testing/ai-mocks.ts).
  // '1' iken LLM/embedding/retrieval sahteleriyle değişir; mock sınıfları
  // NODE_ENV=production'da kendiliğinden fırlatır.
  if (
    config.AI_RUNTIME_MOCK !== undefined &&
    config.AI_RUNTIME_MOCK !== '' &&
    config.AI_RUNTIME_MOCK !== '0' &&
    config.AI_RUNTIME_MOCK !== '1'
  ) {
    throw new Error("AI_RUNTIME_MOCK tanımlıysa '0' veya '1' olmalıdır.");
  }

  // Opsiyonel: gözlemlenebilirlik (bkz. apps/api/src/common/logging/).
  // Tanımsızsa varsayılanlar kullanılır — hiçbiri zorunlu değil.
  if (
    config.LOG_LEVEL !== undefined &&
    !['error', 'warn', 'info', 'debug', 'verbose'].includes(
      config.LOG_LEVEL as string,
    )
  ) {
    throw new Error(
      "LOG_LEVEL tanımlıysa 'error' | 'warn' | 'info' | 'debug' | 'verbose' olmalıdır.",
    );
  }

  for (const key of ['LOG_DRAIN_URL', 'SLACK_ALERT_WEBHOOK_URL']) {
    const value = config[key];
    if (
      value !== undefined &&
      value !== '' &&
      !/^https?:\/\//.test(value as string)
    ) {
      throw new Error(`${key} tanımlıysa http(s):// ile başlamalıdır.`);
    }
  }

  if (
    config.LOG_DRAIN_URL &&
    (typeof config.LOG_DRAIN_TOKEN !== 'string' ||
      config.LOG_DRAIN_TOKEN.trim().length === 0)
  ) {
    throw new Error('LOG_DRAIN_URL tanımlıysa LOG_DRAIN_TOKEN da zorunludur.');
  }

  return config;
}
