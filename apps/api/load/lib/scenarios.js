// Gerçekçi senaryolar. mix: tek kullanıcı oturumu döngüsü (uygulamayı aç, birkaç
// kayıt, ara sıra AI, düşünme süresi 2–10 sn). circle-heavy: aynı halkada N üye,
// yeni buton modeli (Gönder 20-60 sn, Toplamı yenile 30-90 sn); CIRCLE_MODEL=old eski 3 sn/5 sn deseni.
import http from 'k6/http';
import { check, sleep } from 'k6';
import { Counter } from 'k6/metrics';
import { uuidv4, BASE_URL, data } from './api.js';
import { openSession, call, tagStage, TIMEZONES } from './session.js';

const aiOk = new Counter('ai_ok');
const aiNoCredit = new Counter('ai_no_credit');
const aiOther = new Counter('ai_other_status');
const aiBusy = new Counter('ai_429'); // AI_REQUEST_IN_FLIGHT / günlük ücretsiz limit: beklenen
const think = () => sleep(2 + Math.random() * 8);
const today = new Date().toISOString().slice(0, 10);
const RUN = __ENV.RUN_ID ?? String(Date.now());

let session = null;
const counts = {}; // dhikrId → kümülatif count (yükselen)

// %30 kullanıcı Vird kurar: iki program yaratıp AYNI ANDA aktifleştirir
// (ücretsiz limit 1 → biri reddedilmeli, "en fazla 1 aktif" doğrulayıcısı bunu yakalar).
function setupVird() {
  const mk = (n) =>
    call(session, 'POST', '/v1/vird/programs', 'POST vird/programs', {
      title: { tr: `k6 vird ${n}`, en: `k6 vird ${n}` },
      kind: 'routine',
      startDate: today,
      phases: [{ fromDay: 1, toDay: null, slots: { morning: [{ dhikrId: SEED.dhikrIds[1], target: 33 }] } }],
    });
  const ids = [mk('a'), mk('b')].map((r) => data(r)?._id).filter(Boolean);
  const params = {
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.accessToken}`, 'x-client-timezone': session.tz },
    tags: { ep: 'POST vird/activate' },
    responseCallback: http.expectedStatuses(200, 201, 400, 401, 403, 409),
  };
  http.batch(ids.map((id) => ['POST', `${BASE_URL}/v1/vird/programs/${id}/activate`, null, params]));
  const t = data(call(session, 'GET', '/v1/vird/today', 'GET vird/today'));
  session.vird = t?.program ? { programId: t.program._id, dayIndex: t.dayIndex || 1 } : null;
}

function saveVird() {
  if (!session.vird) return;
  counts.vird = (counts.vird ?? 0) + 5 + Math.floor(Math.random() * 15);
  const res = call(session, 'POST', '/v1/dhikr-logs', 'POST dhikr-logs vird', {
    dhikrId: SEED.dhikrIds[1],
    virdProgramId: session.vird.programId,
    virdSlot: 'morning',
    virdDayIndex: session.vird.dayIndex,
    count: counts.vird,
    targetCount: 33,
    date: today,
  });
  check(res, { 'vird-log 201': (r) => r.status === 201 });
}

let SEED = null;

function openApp() {
  const id = session.userId;
  call(session, 'GET', `/v1/users/${id}`, 'GET users/:id');
  call(session, 'GET', '/app-config', 'GET app-config');
  call(session, 'GET', '/v1/special-days/home', 'GET special-days/home');
  call(session, 'GET', `/v1/streaks/${id}`, 'GET streaks/:id');
  call(session, 'GET', '/v1/stats/summary', 'GET stats/summary');
  call(session, 'GET', '/v1/ai/credits', 'GET ai/credits');
  call(session, 'POST', '/v1/devices/register', 'POST devices/register', {
    deviceId: `k6-device-${RUN}-${__VU}`,
    platform: 'android',
    locale: 'tr',
    timezone: session.tz,
  });
}

function saveDhikr(seed) {
  const dhikrId = seed.dhikrIds[Math.floor(Math.random() * seed.dhikrIds.length)];
  counts[dhikrId] = (counts[dhikrId] ?? 0) + 10 + Math.floor(Math.random() * 24);
  const res = call(session, 'POST', '/v1/dhikr-logs', 'POST dhikr-logs', {
    dhikrId,
    count: counts[dhikrId],
    targetCount: 33,
    date: today,
    isCompleted: counts[dhikrId] >= 33,
  });
  check(res, { 'dhikr-log 201': (r) => r.status === 201 });
}

function askAi() {
  const flowId = uuidv4();
  const body = { userId: session.userId, freeText: 'huzur için bir zikir öner', flowId };
  const res = call(session, 'POST', '/v1/ai/recommendations', 'POST ai/recommendations', body);
  if (res.status === 201) aiOk.add(1);
  else if (res.status === 403) aiNoCredit.add(1);
  else if (res.status === 429) aiBusy.add(1);
  else aiOther.add(1);
  // %25: aynı flowId tekrar (ağ retry'ı) — kredi bir kez düşmeli.
  if (res.status === 201 && Math.random() < 0.25) {
    call(session, 'POST', '/v1/ai/recommendations', 'POST ai/recommendations', body);
  }
}

export function presign(n) {
  const out = [];
  for (let i = 1; i <= n; i += 1) {
    out.push(openSession(`load-pre-${RUN}-${i}`, TIMEZONES[i % TIMEZONES.length]));
  }
  return out;
}

export function mixScenario(seed, pre) {
  SEED = seed;
  tagStage();
  if (!session && pre && pre[__VU - 1]) session = pre[__VU - 1];
  if (!session) {
    const tz = TIMEZONES[__VU % TIMEZONES.length];
    session = openSession(`load-mix-${RUN}-${__VU}`, tz);
    if (!session) {
      sleep(5);
      return;
    }
    if (__VU % 10 < 3) setupVird();
  }
  openApp();
  think();
  const saves = 2 + Math.floor(Math.random() * 4);
  for (let i = 0; i < saves; i += 1) {
    saveDhikr(seed);
    think();
  }
  saveVird();
  call(session, 'GET', '/v1/vird/today', 'GET vird/today');
  think();
  if (Math.random() < 0.05) {
    askAi();
    think();
  }
}

// --- circle-heavy ---
let circleSession = null;
let circleCount = 0;

const rnd = (a, b) => a + Math.random() * (b - a);

function circleSend(C) {
  const res = call(circleSession, 'POST', '/v1/dhikr-logs', 'POST dhikr-logs circle', {
    dhikrId: C.dhikrId,
    circleId: C.id,
    source: 'circle',
    count: circleCount,
    targetCount: 10_000_000,
    date: today,
  });
  check(res, { 'circle-log 201': (r) => r.status === 201 });
}

function circleDetail(C) {
  const res = call(circleSession, 'GET', `/v1/circles/${C.id}`, 'GET circles/:id');
  check(res, { 'circle-detail 200': (r) => r.status === 200 });
}

// Yeni model (halka oturumu butonları): girişte 1 detay GET, yerelde dokunma,
// 20-60 sn'de bir "Gönder" (kümülatif POST), 30-90 sn'de bir "Toplamı yenile"
// (detay GET), çıkışta son gönderim. Oturum süresi CIRCLE_SESSION_S (vars. 300).
function circleSessionNew(C) {
  const len = Number(__ENV.CIRCLE_SESSION_S ?? 300);
  circleDetail(C);
  let sendAt = rnd(20, 60);
  let refreshAt = rnd(30, 90);
  for (let t = 1; t <= len; t += 1) {
    sleep(1);
    if (t % 10 === 0) tagStage(); // uzun oturumda aşama etiketi tazelensin
    circleCount += Math.floor(rnd(0, 3)); // yerel dokunmalar
    if (t >= sendAt) {
      circleSend(C);
      sendAt = t + rnd(20, 60);
    }
    if (t >= refreshAt) {
      circleDetail(C);
      refreshAt = t + rnd(30, 90);
    }
  }
  circleCount += 1;
  circleSend(C); // çıkışta son gönderim
}

// Eski model (CIRCLE_MODEL=old): 3 sn'de bir flush + 5 sn'de bir poll.
function circleSessionOld(C) {
  for (let t = 1; t <= 15; t += 1) {
    sleep(1);
    if (t % 3 === 0) {
      circleCount += 1 + Math.floor(Math.random() * 30);
      circleSend(C);
    }
    if (t % 5 === 0) circleDetail(C);
  }
}

export function circleHeavyScenario(seed) {
  tagStage();
  // Halka başına üye tavanı 200: seed-circles.mjs ek halka açtıysa VU'lar dağıtılır.
  const C = seed.circles ? seed.circles[(__VU - 1) % seed.circles.length] : seed.circle;
  if (!circleSession) {
    circleSession = openSession(`load-circle-${RUN}-${__VU}`, TIMEZONES[__VU % TIMEZONES.length]);
    if (!circleSession) {
      sleep(5);
      return;
    }
    call(circleSession, 'POST', '/v1/circles/join', 'POST circles/join', { code: C.code });
  }
  if (__ENV.CIRCLE_MODEL === 'old') circleSessionOld(C);
  else circleSessionNew(C);
}
