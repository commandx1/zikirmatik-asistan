// Ortak k6 HTTP yardımcıları: BASE_URL, header zarfları, envelope açıcı.
export const BASE_URL = __ENV.BASE_URL ?? 'http://127.0.0.1:3010';

export function json() {
  return { headers: { 'Content-Type': 'application/json' } };
}

export function bearer(token) {
  return {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  };
}

// ResponseTransformInterceptor: başarı gövdesi her zaman {success, data}.
export function data(res) {
  try {
    return JSON.parse(res.body).data;
  } catch (_err) {
    return undefined;
  }
}

// k6'da uuid jslib'i harici CDN'den çekmemek için minik yerel üretici
// (ai senaryosu flowId UUID v4 bekliyor — random.js: rastgele sürüm/varyant
// bitleri, kriptografik amaçlı değil).
export function uuidv4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
