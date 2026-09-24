import request from 'supertest';
import { createTestApp, type TestApp } from './helpers/create-test-app';
import { clearCollections, syncIndexes } from './helpers/db';
import { bearer, data, signIn } from './helpers/fixtures';

describe('UserDhikrs (e2e)', () => {
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

  it('POST /v1/user-dhikrs: aynı clientId ile ikinci POST upsert eder (tek belge, alanlar güncel)', async () => {
    const me = await signIn(t.http, { sub: 'e2e-ud-1' });

    const first = await request(t.http)
      .post('/v1/user-dhikrs')
      .set(bearer(me.accessToken))
      .send({ clientId: 'my-dhikr', name: 'İlk isim', target: 33 })
      .expect(201);
    const firstBody = data<{ _id: string; name: string; target: number }>(
      first,
    );
    expect(firstBody.name).toBe('İlk isim');

    const second = await request(t.http)
      .post('/v1/user-dhikrs')
      .set(bearer(me.accessToken))
      .send({ clientId: 'my-dhikr', name: 'Güncel isim', target: 99 })
      .expect(201);
    const secondBody = data<{ _id: string; name: string; target: number }>(
      second,
    );
    expect(secondBody._id).toBe(firstBody._id);
    expect(secondBody.name).toBe('Güncel isim');
    expect(secondBody.target).toBe(99);

    const list = await request(t.http)
      .get('/v1/user-dhikrs')
      .set(bearer(me.accessToken))
      .expect(200);
    expect(data<unknown[]>(list)).toHaveLength(1);
  });

  it('clientId gönderilmezse otomatik üretilir', async () => {
    const me = await signIn(t.http, { sub: 'e2e-ud-2' });

    const res = await request(t.http)
      .post('/v1/user-dhikrs')
      .set(bearer(me.accessToken))
      .send({ target: 10 })
      .expect(201);
    expect(data<{ clientId: string }>(res).clientId).toBeTruthy();
  });

  it('PATCH/DELETE /v1/user-dhikrs/:clientId: başka kullanıcının clientId değeri 404 döner', async () => {
    const owner = await signIn(t.http, { sub: 'e2e-ud-3' });
    const intruder = await signIn(t.http, { sub: 'e2e-ud-4' });

    await request(t.http)
      .post('/v1/user-dhikrs')
      .set(bearer(owner.accessToken))
      .send({ clientId: 'owner-dhikr', name: 'Sahibi' })
      .expect(201);

    await request(t.http)
      .patch('/v1/user-dhikrs/owner-dhikr')
      .set(bearer(intruder.accessToken))
      .send({ name: 'Ele geçirme denemesi' })
      .expect(404);

    const patched = await request(t.http)
      .patch('/v1/user-dhikrs/owner-dhikr')
      .set(bearer(owner.accessToken))
      .send({ name: 'Sahibi güncel' })
      .expect(200);
    expect(data<{ name: string }>(patched).name).toBe('Sahibi güncel');

    await request(t.http)
      .delete('/v1/user-dhikrs/owner-dhikr')
      .set(bearer(intruder.accessToken))
      .expect(404);

    await request(t.http)
      .delete('/v1/user-dhikrs/owner-dhikr')
      .set(bearer(owner.accessToken))
      .expect(200);
  });

  it('tokensız istekler 401 döner', async () => {
    await request(t.http).get('/v1/user-dhikrs').expect(401);
    await request(t.http)
      .post('/v1/user-dhikrs')
      .send({ name: 'x' })
      .expect(401);
  });
});
