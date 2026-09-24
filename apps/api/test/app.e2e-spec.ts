/**
 * Harness'ın referans kullanımı: createTestApp + syncIndexes (beforeAll),
 * clearCollections (beforeEach), close (afterAll).
 * Önkoşul: pnpm db:test
 */
import request from 'supertest';
import { createTestApp, type TestApp } from './helpers/create-test-app';
import { clearCollections, syncIndexes } from './helpers/db';
import { bearer, data, signIn } from './helpers/fixtures';

describe('App (e2e)', () => {
  let t: TestApp;

  beforeAll(async () => {
    t = await createTestApp();
    await syncIndexes(t.connection);
  });

  beforeEach(async () => {
    await clearCollections(t.connection);
  });

  afterAll(async () => {
    await t?.close();
  });

  it('GET /health → zarf içinde ok + mongo up', async () => {
    const res = await request(t.http).get('/health').expect(200);
    expect(res.body).toHaveProperty('success', true);
    const body = data<Record<string, string>>(res);
    expect(body).toMatchObject({ status: 'ok', service: 'api', mongo: 'up' });
    expect(Number.isNaN(Date.parse(body.timestamp))).toBe(false);
  });

  it('GET /app-config → minVersion + serverPushEnabled', async () => {
    const res = await request(t.http).get('/app-config').expect(200);
    expect(data(res)).toEqual({ minVersion: '0', serverPushEnabled: false });
  });

  it('signIn fixture: test-token ile yeni kullanıcı + geçerli access token', async () => {
    const first = await signIn(t.http, { sub: 'e2e-app-1', name: 'Test' });
    expect(first.isNewUser).toBe(true);
    expect(first.userId).toBeTruthy();
    expect(first.accessToken).toBeTruthy();
    expect(first.refreshToken).toBeTruthy();

    const again = await signIn(t.http, { sub: 'e2e-app-1' });
    expect(again.userId).toBe(first.userId);
    expect(again.isNewUser).toBe(false);

    // bearer() korumalı rotada kabul edilir; token'sız 401.
    const path = `/v1/users/${first.userId}`;
    await request(t.http).get(path).expect(401);
    await request(t.http).get(path).set(bearer(first.accessToken)).expect(200);
  });

  it('createTestApp prod-benzeri URI ile bağlanmayı reddeder', async () => {
    const original = process.env.MONGODB_URI;
    process.env.MONGODB_URI = 'mongodb+srv://x.mongodb.net/test';
    try {
      await expect(createTestApp()).rejects.toThrow(/Test DB koruması/);
    } finally {
      process.env.MONGODB_URI = original;
    }
  });
});
