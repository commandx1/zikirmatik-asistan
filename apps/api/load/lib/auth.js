import http from 'k6/http';
import { check } from 'k6';
import { BASE_URL, json, data } from './api.js';

// AUTH_ALLOW_INSECURE_TEST_TOKENS=1: idToken JSON.stringify(claims) olarak
// okunur (auth.service.ts). apps/api/test/helpers/fixtures.ts signIn ile aynı sözleşme.
export function signIn(sub, extra = {}) {
  const res = http.post(
    `${BASE_URL}/v1/auth/provider/verify`,
    JSON.stringify({
      provider: 'google',
      platform: 'android',
      idToken: JSON.stringify({ sub, email: `${sub}@k6.local`, name: sub }),
      deviceId: `k6-device-${sub}`,
    }),
    Object.assign(json(), extra),
  );
  check(res, { 'signIn 200': (r) => r.status === 200 });
  return data(res);
}

export function refresh(refreshToken) {
  const res = http.post(
    `${BASE_URL}/v1/auth/refresh`,
    JSON.stringify({ refreshToken }),
    json(),
  );
  return { res, body: data(res) };
}
