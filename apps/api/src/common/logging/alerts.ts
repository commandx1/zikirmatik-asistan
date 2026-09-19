const WINDOW_MS = 5 * 60 * 1000;
const DEDUPE_MS = 15 * 60 * 1000;

// Anahtar kökü (`key.split(':')[0]`) başına, WINDOW_MS içinde en az kaç hit
// olmalı ki alarm gitsin. Listede yoksa varsayılan 1 (her hit alarm).
const THRESHOLDS: Record<string, number> = {
  'ai.unavailable': 3,
};

type AlertState = { hits: number[]; lastSent: number; suppressed: number };

const state = new Map<string, AlertState>();

export function sendAlert(
  key: string,
  payload: Record<string, unknown>,
  requestId?: string,
  now = Date.now(),
) {
  const webhookUrl = process.env.SLACK_ALERT_WEBHOOK_URL;
  if (!webhookUrl) {
    return;
  }

  const threshold = THRESHOLDS[key.split(':')[0]] ?? 1;

  let entry = state.get(key);
  if (!entry) {
    entry = { hits: [], lastSent: 0, suppressed: 0 };
    state.set(key, entry);
  }

  entry.hits.push(now);
  entry.hits = entry.hits.filter((t) => now - t < WINDOW_MS);

  if (entry.hits.length < threshold) {
    return;
  }

  if (now - entry.lastSent < DEDUPE_MS) {
    entry.suppressed += 1;
    return;
  }

  const suppressed = entry.suppressed;
  entry.lastSent = now;
  entry.suppressed = 0;

  const message = typeof payload.message === 'string' ? payload.message : '';
  const text =
    `:rotating_light: [${process.env.NODE_ENV}] *${key}* ${message} requestId=${requestId ?? '-'}` +
    (suppressed > 0 ? ` (+${suppressed} suppressed)` : '');

  fetch(webhookUrl, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ text }),
    // 10 sn: açılış anında yavaş DNS çözümlemesi 5 sn'lik sınırla yarışabiliyor.
    signal: AbortSignal.timeout(10_000),
  }).catch(() => {});
}

export function __resetAlerts() {
  state.clear();
}
