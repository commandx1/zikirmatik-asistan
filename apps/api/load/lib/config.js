// PROFILE=smoke|load|spike → k6 executor ayarları + ortak eşikler.
const PROFILES = {
  smoke: { executor: 'constant-vus', vus: 5, duration: '1m' },
  load: {
    executor: 'ramping-vus',
    startVUs: 0,
    stages: [
      { duration: '1m', target: 50 },
      { duration: '3m', target: 50 },
      { duration: '1m', target: 0 },
    ],
  },
  spike: {
    executor: 'ramping-vus',
    startVUs: 0,
    stages: [
      { duration: '10s', target: 200 },
      { duration: '20s', target: 200 },
      { duration: '10s', target: 0 },
    ],
  },
};

export function executorFor(profile) {
  const cfg = PROFILES[profile];
  if (!cfg) {
    throw new Error(
      `Bilinmeyen PROFILE='${profile}' (smoke|load|spike bekleniyor).`,
    );
  }
  return cfg;
}

export const THRESHOLDS = {
  http_req_duration: ['p(95)<500'],
  http_req_failed: ['rate<0.01'],
};

// --- Gerçekçi senaryolar (mix, circle-heavy) ---
// STAGES="25:90s,50:90s" → ramping-vus (hedef:süre); yoksa VUS/DURATION sabit.
export function stagedExecutor() {
  const stages = (__ENV.STAGES ?? '')
    .split(',')
    .filter(Boolean)
    .map((s) => {
      const [target, duration] = s.split(':');
      return { target: Number(target), duration };
    });
  if (stages.length > 0) {
    return {
      executor: 'ramping-vus',
      startVUs: 0,
      stages,
      gracefulRampDown: '5s',
      gracefulStop: '30s',
    };
  }
  return {
    executor: 'constant-vus',
    vus: Number(__ENV.VUS ?? 20),
    duration: __ENV.DURATION ?? '2m',
    gracefulStop: '30s',
  };
}

export const ENDPOINTS = [
  'POST auth/verify',
  'POST devices/register',
  'GET users/:id',
  'GET app-config',
  'GET special-days/home',
  'GET streaks/:id',
  'GET stats/summary',
  'GET vird/today',
  'GET ai/credits',
  'POST dhikr-logs',
  'POST dhikr-logs circle',
  'POST dhikr-logs vird',
  'POST vird/programs',
  'POST vird/activate',
  'GET circles/:id',
  'POST ai/recommendations',
];

// Alt metrik eşikleri yalnız özette görünsün diye bilgilendirme amaçlı ('max>=0' hep geçer).
export function endpointThresholds() {
  const t = {
    http_req_duration: ['p(95)<1000'],
    http_req_failed: ['rate<0.01'],
  };
  const stageCount = (__ENV.STAGES ?? '').split(',').filter(Boolean).length;
  for (let i = 0; i < stageCount; i += 1) {
    t[`http_req_duration{stage:s${i}}`] = ['max>=0'];
    t[`http_req_failed{stage:s${i}}`] = ['rate>=0'];
    t[`http_reqs{stage:s${i}}`] = ['count>=0'];
    t[`vus{stage:s${i}}`] = ['value>=0'];
  }
  for (const ep of ENDPOINTS) {
    t[`http_req_duration{ep:${ep}}`] = ['max>=0'];
  }
  return t;
}
