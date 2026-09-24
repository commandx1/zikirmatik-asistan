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
