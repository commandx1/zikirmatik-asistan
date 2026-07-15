export function validateEnv(config: Record<string, unknown>) {
  if (
    typeof config.MONGODB_URI !== 'string' ||
    config.MONGODB_URI.trim().length === 0
  ) {
    throw new Error(
      'MONGODB_URI ortam değişkeni zorunludur. apps/api/.env dosyasını kontrol et.',
    );
  }

  return config;
}
