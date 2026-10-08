// Gerçekçi kullanıcı oturumu: x-client-timezone, 401'de refresh (tek kullanımlık
// rotasyon — dönen refreshToken HER ZAMAN saklanır), uç nokta başına `ep` etiketi
// ve aşama (stage) etiketi.
import http from 'k6/http';
import exec from 'k6/execution';
import { Counter } from 'k6/metrics';
import { BASE_URL, json, data } from './api.js';
import { signIn, refresh } from './auth.js';

export const tokenRefreshes = new Counter('token_refreshes');
export const TIMEZONES = [
  'Europe/Istanbul',
  'Europe/Istanbul',
  'Europe/Berlin',
  'Europe/London',
  'America/New_York',
  'America/Los_Angeles',
  'Asia/Dubai',
  'Pacific/Kiritimati',
];

const ALLOWED = http.expectedStatuses(200, 201, 401, 403, 429);

// STAGES="25:90s,50:90s" → toplam süreye göre aşama indeksi (s0, s1, ...).
const STAGE_SECONDS = (__ENV.STAGES ?? '')
  .split(',')
  .filter(Boolean)
  .map((s) => parseInt(s.split(':')[1], 10));

export function tagStage() {
  if (STAGE_SECONDS.length === 0) return;
  const elapsed = (Date.now() - exec.scenario.startTime) / 1000;
  let acc = 0;
  let idx = STAGE_SECONDS.length - 1;
  for (let i = 0; i < STAGE_SECONDS.length; i += 1) {
    acc += STAGE_SECONDS[i];
    if (elapsed < acc) {
      idx = i;
      break;
    }
  }
  exec.vu.tags.stage = `s${idx}`;
}

export function openSession(sub, tz) {
  const res = http.post(
    `${BASE_URL}/v1/auth/provider/verify`,
    JSON.stringify({
      provider: 'google',
      platform: 'android',
      idToken: JSON.stringify({ sub, email: `${sub}@k6.local`, name: sub }),
      deviceId: `k6-device-${sub}`,
    }),
    {
      headers: { 'Content-Type': 'application/json', 'x-client-timezone': tz },
      tags: { ep: 'POST auth/verify' },
      responseCallback: ALLOWED,
    },
  );
  const body = data(res);
  if (!body) return null;
  return { ...body, tz };
}

// 401 → refresh → bir kez tekrar dene.
export function call(session, method, path, ep, payload) {
  const send = () =>
    http.request(
      method,
      `${BASE_URL}${path}`,
      payload === undefined ? null : JSON.stringify(payload),
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.accessToken}`,
          'x-client-timezone': session.tz,
        },
        tags: { ep },
        responseCallback: ALLOWED,
      },
    );
  let res = send();
  if (res.status === 401 && session.refreshToken) {
    const r = refresh(session.refreshToken);
    if (r.body && r.body.accessToken) {
      session.accessToken = r.body.accessToken;
      session.refreshToken = r.body.refreshToken ?? session.refreshToken;
      tokenRefreshes.add(1);
      res = send();
    }
  }
  return res;
}

export { signIn, json };
