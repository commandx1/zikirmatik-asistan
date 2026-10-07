import http from 'k6/http';
import { check, sleep } from 'k6';
import { Counter } from 'k6/metrics';
import { SharedArray } from 'k6/data';
import { BASE_URL, bearer, uuidv4 } from './lib/api.js';
import { signIn, refresh } from './lib/auth.js';
import { executorFor, THRESHOLDS, stagedExecutor, endpointThresholds } from './lib/config.js';
import { mixScenario as mixImpl, circleHeavyScenario as circleHeavyImpl, presign } from './lib/scenarios.js';

const PROFILE = __ENV.PROFILE ?? 'smoke';
const SCENARIO = __ENV.SCENARIO ?? 'all';

// load/seed.mjs çıktısı — circle/vird senaryoları bunu gerektirir.
const seed = new SharedArray('seed', () => {
  try {
    return [JSON.parse(open(__ENV.SEED_FILE ?? './out/seed.json'))];
  } catch (_err) {
    return [];
  }
})[0];

const today = new Date().toISOString().slice(0, 10);
const aiCreditExhausted = new Counter('ai_credit_exhausted');

// ai senaryosu kredi tükenince 403 döner — bunu http_req_failed'a saydırma.
http.setResponseCallback(http.expectedStatuses(200, 201, 403));

// --- dhikr: VU başına ayrı kullanıcı, artan count ile POST /v1/dhikr-logs.
let dhikrSession = null;
let dhikrCount = 0;
export function dhikrScenario() {
  if (!dhikrSession) {
    dhikrSession = signIn(`load-dhikr-${__VU}-${Date.now()}`);
  }
  dhikrCount += 1;
  const dhikrId = seed.dhikrIds[dhikrCount % seed.dhikrIds.length];
  const res = http.post(
    `${BASE_URL}/v1/dhikr-logs`,
    JSON.stringify({
      userId: dhikrSession.userId,
      dhikrId,
      count: dhikrCount,
      targetCount: 33,
      date: today,
      isCompleted: dhikrCount % 33 === 0,
    }),
    bearer(dhikrSession.accessToken),
  );
  check(res, { 'dhikr-log 201': (r) => r.status === 201 });
  sleep(1);
}

// --- circle: VU = seed.members[i], her iterasyonda kümülatif count gönderir.
let circleCount = 0;
export function circleScenario() {
  const member = seed.members[(__VU - 1) % seed.members.length];
  circleCount += 1;
  const res = http.post(
    `${BASE_URL}/v1/dhikr-logs`,
    JSON.stringify({
      userId: member.userId,
      dhikrId: seed.circle.dhikrId,
      circleId: seed.circle.id,
      source: 'circle',
      count: circleCount,
      targetCount: 10_000_000,
      date: today,
    }),
    bearer(member.accessToken),
  );
  check(res, { 'circle-log 201': (r) => r.status === 201 });
  sleep(1);
}

// --- vird: POST dhikr-logs (virdProgramId/slot/dayIndex) + GET /v1/vird/today.
let virdSession = null;
export function virdScenario() {
  if (!virdSession) {
    virdSession = seed.members[0];
  }
  const res = http.post(
    `${BASE_URL}/v1/dhikr-logs`,
    JSON.stringify({
      userId: virdSession.userId,
      dhikrId: seed.vird.dhikrId,
      virdProgramId: seed.vird.programId,
      virdSlot: seed.vird.slot,
      virdDayIndex: seed.vird.dayIndex,
      count: 1,
      targetCount: 33,
      date: today,
    }),
    bearer(virdSession.accessToken),
  );
  check(res, { 'vird-log 201': (r) => r.status === 201 });

  const virdTodayRes = http.get(`${BASE_URL}/v1/vird/today`, bearer(virdSession.accessToken));
  check(virdTodayRes, { 'vird-today 200': (r) => r.status === 200 });
  sleep(1);
}

// --- auth: refresh döngüsü, yeni çifti sakla.
let authSession = null;
export function authScenario() {
  if (!authSession) {
    authSession = signIn(`load-auth-${__VU}-${Date.now()}`);
  }
  const { res, body } = refresh(authSession.refreshToken);
  check(res, { 'refresh 200': (r) => r.status === 200 });
  if (body) authSession = { ...authSession, ...body };
  sleep(1);
}

// --- ai: kullanıcı başına 3 kredi, sonrası 403 (kredi düşmez).
let aiSession = null;
export function aiScenario() {
  if (!aiSession) {
    aiSession = signIn(`load-ai-${__VU}-${Date.now()}`);
  }
  const res = http.post(
    `${BASE_URL}/v1/ai/recommendations`,
    JSON.stringify({
      userId: aiSession.userId,
      freeText: 'k6 yük testi mesajı',
      flowId: uuidv4(),
    }),
    bearer(aiSession.accessToken),
  );
  if (res.status === 403) {
    aiCreditExhausted.add(1);
  } else {
    check(res, { 'ai-recommend 201': (r) => r.status === 201 });
  }
  sleep(1);
}

const SCENARIO_EXEC = {
  dhikr: dhikrScenario,
  circle: circleScenario,
  vird: virdScenario,
  auth: authScenario,
  ai: aiScenario,
};

// Gerçekçi senaryolar yalnız adıyla seçilir ('all' bunları içermez).
const STAGED = ['mix', 'circle-heavy'];

// PRESIGN=N: N oturum setup()'ta önceden açılır (mevcut kullanıcıların aynı anda
// uygulamayı açtığı ani yük; kayıt fırtınası değil).
export function setup() {
  const sessions = presign(Number(__ENV.PRESIGN ?? 0));
  console.log(`SETUP_DONE ${Date.now()}`); // run.sh analiz penceresini buradan başlatır
  return sessions;
}

export function mixScenario(pre) {
  mixImpl(seed, pre);
}
export function circleHeavyScenario() {
  circleHeavyImpl(seed);
}

function buildScenarios() {
  const names = SCENARIO === 'all' ? Object.keys(SCENARIO_EXEC) : [SCENARIO];
  const scenarios = {};
  for (const name of names) {
    if (!SCENARIO_EXEC[name] && !STAGED.includes(name)) {
      throw new Error(`Bilinmeyen SCENARIO='${name}'`);
    }
    const staged = STAGED.includes(name);
    scenarios[name] = {
      ...(staged ? stagedExecutor() : executorFor(PROFILE)),
      exec: name === 'circle-heavy' ? 'circleHeavyScenario' : `${name}Scenario`,
    };
  }
  return scenarios;
}

export const options = {
  scenarios: buildScenarios(),
  thresholds: STAGED.includes(SCENARIO) ? endpointThresholds() : THRESHOLDS,
  summaryTrendStats: ['avg', 'min', 'med', 'p(90)', 'p(95)', 'p(99)', 'max'],
};

export function handleSummary(summary) {
  const m = summary.metrics;
  const p95 = m.http_req_duration?.values?.['p(95)'];
  const failRate = m.http_req_failed?.values?.rate;
  const reqs = m.http_reqs?.values?.count;
  const rps = m.http_reqs?.values?.rate;
  console.log(
    `[load] PROFILE=${PROFILE} SCENARIO=${SCENARIO} reqs=${reqs} rps=${rps?.toFixed(1)} p95=${p95?.toFixed(1)}ms fail=${((failRate ?? 0) * 100).toFixed(2)}%`,
  );
  return {
    [__ENV.SUMMARY_OUT ?? 'load/out/summary.json']: JSON.stringify(summary, null, 2),
  };
}
