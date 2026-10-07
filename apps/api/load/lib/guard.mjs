// Yük araçlarının ortak güvenlik kapısı: yalnız yerel zikir_load*/zikir_e2e* DB.
export function assertLoadDbUri(uri) {
  if (!uri) throw new Error('[load] MONGODB_URI tanımsız.');
  const url = new URL(uri);
  const dbName = url.pathname.replace(/^\//, '');
  if (
    (url.hostname !== '127.0.0.1' && url.hostname !== 'localhost') ||
    !(dbName.startsWith('zikir_load') || dbName.startsWith('zikir_e2e'))
  ) {
    throw new Error(
      `[load] Güvenlik: ${url.hostname}/${dbName} yerel zikir_load*/zikir_e2e* DB değil — reddedildi.`,
    );
  }
}
