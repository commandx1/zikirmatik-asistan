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

  return config;
}
