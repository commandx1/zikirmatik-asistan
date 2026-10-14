import { test } from 'node:test';
import assert from 'node:assert/strict';
import { classifySource, computeCohorts, computeSourceRetention, isoWeekKey } from './kpi-report.mjs';

test('isoWeekKey aynı ISO haftasındaki günleri aynı Pazartesi\'ye eşler', () => {
  assert.equal(isoWeekKey(new Date('2026-09-21T10:00:00Z')), '2026-09-21'); // Pazartesi
  assert.equal(isoWeekKey(new Date('2026-09-27T23:00:00Z')), '2026-09-21'); // Pazar
});

test('computeCohorts: retained device D1/D7 sayılır, retained olmayan sayılmaz', () => {
  const now = new Date('2026-09-25T00:00:00Z');
  const devices = [
    { deviceId: 'a', platform: 'ios', createdAt: new Date('2026-09-01T00:00:00Z') },
    { deviceId: 'b', platform: 'android', createdAt: new Date('2026-09-01T00:00:00Z') },
  ];
  const opens = new Map([
    ['a', [new Date('2026-09-03T00:00:00Z'), new Date('2026-09-10T00:00:00Z')]], // D1 ve D7 sağlıyor
    // b hiç açılmamış
  ]);
  const cohorts = computeCohorts(devices, opens, now);
  assert.equal(cohorts.length, 1);
  const c = cohorts[0];
  assert.equal(c.installs, 2);
  assert.equal(c.ios, 1);
  assert.equal(c.android, 1);
  assert.equal(c.d1, 50);
  assert.equal(c.d7, 50);
});

test('computeCohorts: retention lastSeenAt VEYA app_opened birleşimidir', () => {
  const now = new Date('2026-09-25T00:00:00Z');
  const devices = [
    // app_opened olayı yok ama lastSeenAt eşiği geçiyor -> D7 retained sayılmalı.
    { deviceId: 'a', platform: 'ios', createdAt: new Date('2026-09-01T00:00:00Z'), lastSeenAt: new Date('2026-09-10T00:00:00Z') },
    // ne app_opened ne de yeterli lastSeenAt -> retained DEĞİL.
    { deviceId: 'b', platform: 'android', createdAt: new Date('2026-09-01T00:00:00Z'), lastSeenAt: new Date('2026-09-02T00:00:00Z') },
  ];
  const cohorts = computeCohorts(devices, new Map(), now);
  const c = cohorts[0];
  assert.equal(c.d7, 50);
  assert.equal(c.retainedD7, 1);
});

test('computeCohorts: henüz ölçülemeyen Dn için null döner', () => {
  const now = new Date('2026-09-25T00:00:00Z');
  const devices = [
    { deviceId: 'a', platform: 'ios', createdAt: new Date('2026-09-24T00:00:00Z') }, // 1 gün önce
  ];
  const cohorts = computeCohorts(devices, new Map(), now);
  assert.equal(cohorts[0].d1, 0); // D1 ölçülebilir (createdAt+1g <= now) ama açılış yok
  assert.equal(cohorts[0].d7, null); // henüz 7 gün geçmemiş
  assert.equal(cohorts[0].d30, null);
});

test('classifySource: gclid -> google-ads, google-play -> organic, olay yok -> unknown', () => {
  assert.equal(classifySource({ hasGclid: true, source: 'google-play' }), 'google-ads');
  assert.equal(classifySource({ hasGclid: false, source: 'google-play' }), 'organic');
  assert.equal(classifySource({ hasGclid: false }), 'organic');
  assert.equal(classifySource({ hasGclid: false, source: 'instagram' }), 'instagram');
  assert.equal(classifySource(undefined), 'unknown');
});

test('computeSourceRetention: kaynak başına D1/D7', () => {
  const now = new Date('2026-09-25T00:00:00Z');
  const created = new Date('2026-09-01T00:00:00Z');
  const devices = [
    { deviceId: 'a', platform: 'android', createdAt: created },
    { deviceId: 'b', platform: 'android', createdAt: created },
    { deviceId: 'c', platform: 'ios', createdAt: created },
  ];
  const opens = new Map([['a', [new Date('2026-09-10T00:00:00Z')]]]);
  const refs = new Map([
    ['a', { hasGclid: true }],
    ['b', { hasGclid: false, source: 'google-play' }],
  ]);
  const rows = computeSourceRetention(devices, opens, refs, now);
  const by = Object.fromEntries(rows.map((r) => [r.source, r]));
  assert.equal(by['google-ads'].d7, 100);
  assert.equal(by.organic.d7, 0);
  assert.equal(by.unknown.installs, 1);
});
