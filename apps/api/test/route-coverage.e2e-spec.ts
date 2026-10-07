/**
 * Davranış kataloğu (Bölüm 1) ❌/🟡 satırlarını kapatan rota e2e'leri:
 * dhikr-logs GET /:id, DELETE by-dhikr, PATCH favorite/by-dhikr; streaks
 * recalculate; vird programs list/PATCH/DELETE; circles GET /v1/circles.
 * Etiketler: [HAPPY] mutlu yol, [EDGE] sınır, [CHAR] mevcut davranışı sabitler.
 * Önkoşul: pnpm db:test
 */
import { randomUUID } from 'node:crypto';
import { Types } from 'mongoose';
import request from 'supertest';
import { istanbulDateKey, shiftDateKey } from '../src/common/utils/date-keys';
import type { DhikrLogDocument } from '../src/modules/dhikr-logs/schemas/dhikr-log.schema';
import type { DhikrDocument } from '../src/modules/dhikrs/schemas/dhikr.schema';
import {
  User,
  type UserDocument,
} from '../src/modules/users/schemas/user.schema';
import { createTestApp, type TestApp } from './helpers/create-test-app';
import { clearCollections, syncIndexes } from './helpers/db';
import {
  bearer,
  data,
  makePremium,
  seedDhikr,
  signIn,
  type SignInResult,
} from './helpers/fixtures';

const today = istanbulDateKey(new Date());
const yesterday = shiftDateKey(today, -1);

describe('Rota kapsamı (e2e)', () => {
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

  const newUser = () => signIn(t.http, { sub: `e2e-rc-${randomUUID()}` });
  const newDhikr = (overrides: Record<string, unknown> = {}) =>
    seedDhikr(t.model<DhikrDocument>('Dhikr'), overrides);
  const logModel = () => t.model<DhikrLogDocument>('DhikrLog');

  function writeLog(
    user: SignInResult,
    body: Record<string, unknown>,
    expectStatus = 201,
  ) {
    return request(t.http)
      .post('/v1/dhikr-logs')
      .set(bearer(user.accessToken))
      .send({
        userId: user.userId,
        count: 5,
        targetCount: 33,
        date: today,
        ...body,
      })
      .expect(expectStatus);
  }

  // ===================================================================
  describe('dhikr-logs GET /:id', () => {
    it('[HAPPY] kendi logu 200 ve alanlar döner', async () => {
      const user = await newUser();
      const dhikrId = await newDhikr();
      const created = data<{ _id: string }>(
        await writeLog(user, { dhikrId, count: 7, targetCount: 33 }),
      );
      const res = await request(t.http)
        .get(`/v1/dhikr-logs/${created._id}`)
        .set(bearer(user.accessToken))
        .expect(200);
      expect(data(res)).toMatchObject({
        _id: created._id,
        userId: user.userId,
        dhikrId,
        count: 7,
        targetCount: 33,
        date: today,
      });
    });

    it('[EDGE] başkasının logu 404; var olmayan 404; ObjectId olmayan id 404 (500 değil)', async () => {
      const owner = await newUser();
      const other = await newUser();
      const dhikrId = await newDhikr();
      const created = data<{ _id: string }>(await writeLog(owner, { dhikrId }));
      const get = (id: string) =>
        request(t.http)
          .get(`/v1/dhikr-logs/${id}`)
          .set(bearer(other.accessToken));
      await get(created._id).expect(404);
      await get(new Types.ObjectId().toHexString()).expect(404);
      await get('not-an-object-id').expect(404);
    });
  });

  // ===================================================================
  describe('dhikr-logs DELETE /by-dhikr', () => {
    const del = (user: SignInResult, query: Record<string, string>) =>
      request(t.http)
        .delete('/v1/dhikr-logs/by-dhikr')
        .query(query)
        .set(bearer(user.accessToken));

    it('[BUG:B11] silme sonrası seri yeniden hesaplanır (currentStreak şişik kalmaz); longestStreak düşmez', async () => {
      const user = await newUser();
      const d1 = await newDhikr();
      const d2 = await newDhikr();
      await writeLog(user, { dhikrId: d1, date: today });
      await writeLog(user, { dhikrId: d1, date: yesterday });
      await writeLog(user, { dhikrId: d2, date: shiftDateKey(today, -5) });
      const streak = () =>
        request(t.http)
          .get(`/v1/streaks/${user.userId}`)
          .set(bearer(user.accessToken))
          .expect(200);
      expect(data(await streak())).toMatchObject({
        currentStreak: 2,
        longestStreak: 2,
      });

      await del(user, { dhikrId: d1 }).expect(200);

      expect(data(await streak())).toMatchObject({
        currentStreak: 0,
        longestStreak: 2,
        totalDaysActive: 1,
      });
    });

    it('[HAPPY] dhikrId: kullanıcının o zikre ait TÜM günlerini siler; diğer zikir ve diğer kullanıcı kalır', async () => {
      const user = await newUser();
      const other = await newUser();
      const d1 = await newDhikr();
      const d2 = await newDhikr();
      await writeLog(user, { dhikrId: d1, date: today });
      await writeLog(user, { dhikrId: d1, date: yesterday });
      await writeLog(user, { dhikrId: d2, date: today });
      await writeLog(other, { dhikrId: d1, date: today });

      const res = await del(user, { dhikrId: d1 }).expect(200);
      expect(data(res)).toEqual({ deleted: true, deletedCount: 2 });

      expect(
        await logModel().countDocuments({
          userId: new Types.ObjectId(user.userId),
        }),
      ).toBe(1);
      expect(
        await logModel().countDocuments({
          userId: new Types.ObjectId(other.userId),
          dhikrId: new Types.ObjectId(d1),
        }),
      ).toBe(1);
    });

    it('[HAPPY] customDhikrId (boşluklar kırpılır) kişisel zikir loglarını siler', async () => {
      const user = await newUser();
      await writeLog(user, {
        customDhikrId: 'my-custom',
        customDhikrName: 'X',
      });
      await writeLog(user, {
        customDhikrId: 'my-custom',
        customDhikrName: 'X',
        date: yesterday,
      });
      const res = await del(user, { customDhikrId: '  my-custom  ' }).expect(
        200,
      );
      expect(data<{ deletedCount: number }>(res).deletedCount).toBe(2);
    });

    it('[EDGE] eşleşen log yok → 200 deletedCount 0; id yok / bozuk id → 400', async () => {
      const user = await newUser();
      const res = await del(user, {
        dhikrId: new Types.ObjectId().toHexString(),
      }).expect(200);
      expect(data(res)).toEqual({ deleted: true, deletedCount: 0 });
      await del(user, {}).expect(400);
      await del(user, { dhikrId: 'xyz' }).expect(400);
    });
  });

  // ===================================================================
  describe('dhikr-logs PATCH /favorite/by-dhikr', () => {
    const fav = (user: SignInResult, body: Record<string, unknown>) =>
      request(t.http)
        .patch('/v1/dhikr-logs/favorite/by-dhikr')
        .set(bearer(user.accessToken))
        .send(body);

    it('[HAPPY] dhikrId: kullanıcının o zikre ait tüm loglarında isFavorite açılır ve geri kapanır', async () => {
      const user = await newUser();
      const other = await newUser();
      const d1 = await newDhikr();
      const d2 = await newDhikr();
      await writeLog(user, { dhikrId: d1, date: today });
      await writeLog(user, { dhikrId: d1, date: yesterday });
      await writeLog(user, { dhikrId: d2 });
      await writeLog(other, { dhikrId: d1 });

      const on = await fav(user, { dhikrId: d1, isFavorite: true }).expect(200);
      expect(data(on)).toMatchObject({
        updated: true,
        matchedCount: 2,
        modifiedCount: 2,
        isFavorite: true,
      });
      const favs = await logModel().find({ isFavorite: true }).lean();
      expect(favs).toHaveLength(2);
      expect(favs.every((l) => String(l.userId) === user.userId)).toBe(true);

      const off = await fav(user, { dhikrId: d1, isFavorite: false }).expect(
        200,
      );
      expect(data(off)).toMatchObject({ matchedCount: 2, isFavorite: false });
      expect(await logModel().countDocuments({ isFavorite: true })).toBe(0);
    });

    it('[HAPPY] customDhikrId varyantı', async () => {
      const user = await newUser();
      await writeLog(user, { customDhikrId: 'c1', customDhikrName: 'C' });
      const res = await fav(user, {
        customDhikrId: 'c1',
        isFavorite: true,
      }).expect(200);
      expect(data(res)).toMatchObject({ matchedCount: 1, modifiedCount: 1 });
    });

    it('[EDGE] log yok → 200 matchedCount 0; id yok / bozuk id / boolean olmayan → 400', async () => {
      const user = await newUser();
      const res = await fav(user, {
        dhikrId: new Types.ObjectId().toHexString(),
        isFavorite: true,
      }).expect(200);
      expect(data(res)).toMatchObject({ matchedCount: 0, modifiedCount: 0 });
      await fav(user, { isFavorite: true }).expect(400);
      await fav(user, { dhikrId: 'xyz', isFavorite: true }).expect(400);
      await fav(user, {
        dhikrId: new Types.ObjectId().toHexString(),
        isFavorite: 'yes',
      }).expect(400);
      await fav(user, { dhikrId: new Types.ObjectId().toHexString() }).expect(
        400,
      );
    });

    it('[CHAR] zaten favori olan loga tekrar true → modifiedCount 0 (idempotent)', async () => {
      const user = await newUser();
      const dhikrId = await newDhikr();
      await writeLog(user, { dhikrId, isFavorite: true });
      const res = await fav(user, { dhikrId, isFavorite: true }).expect(200);
      expect(data(res)).toMatchObject({ matchedCount: 1, modifiedCount: 0 });
    });
  });

  // ===================================================================
  describe('streaks POST /:userId/recalculate', () => {
    const recalc = (user: SignInResult, id = user.userId) =>
      request(t.http)
        .post(`/v1/streaks/${id}/recalculate`)
        .set(bearer(user.accessToken));

    it('[HAPPY] logsuz kullanıcı → 201 sıfır seri', async () => {
      const user = await newUser();
      const res = await recalc(user).expect(201);
      expect(data(res)).toMatchObject({
        currentStreak: 0,
        longestStreak: 0,
        totalDaysActive: 0,
      });
    });

    it('[HAPPY] bayat/şişkin saklı belgeyi loglardan yeniden türetir; longestStreak düşmez', async () => {
      const user = await newUser();
      const dhikrId = await newDhikr();
      await writeLog(user, { dhikrId, date: today });
      await writeLog(user, { dhikrId, date: yesterday });
      await t.model('Streak').updateOne(
        { userId: new Types.ObjectId(user.userId) },
        {
          $set: { currentStreak: 99, totalDaysActive: 99, longestStreak: 5 },
        },
      );
      const res = await recalc(user).expect(201);
      expect(data(res)).toMatchObject({
        currentStreak: 2,
        totalDaysActive: 2,
        longestStreak: 5, // A-15: asla düşmez
      });
    });

    it("[EDGE] başkasının id'si 403; ObjectId olmayan id 403 (kendi id'n değil)", async () => {
      const user = await newUser();
      const other = await newUser();
      await recalc(user, other.userId).expect(403);
      await recalc(user, 'xyz').expect(403);
    });

    it("[CHAR] hesabı silinmiş kullanıcının hâlâ geçerli token'ı → 404 (B14: guard varlığa bakmaz)", async () => {
      const user = await newUser();
      await t.model<UserDocument>(User.name).deleteOne({ _id: user.userId });
      await recalc(user).expect(404);
    });
  });

  // ===================================================================
  describe('vird programs', () => {
    const asUser = (user: SignInResult) => ({
      get: (path: string) =>
        request(t.http).get(path).set(bearer(user.accessToken)),
      post: (path: string) =>
        request(t.http).post(path).set(bearer(user.accessToken)),
      patch: (path: string) =>
        request(t.http).patch(path).set(bearer(user.accessToken)),
      del: (path: string) =>
        request(t.http).delete(path).set(bearer(user.accessToken)),
    });

    const payload = (
      dhikrId: string,
      overrides: Record<string, unknown> = {},
    ) => ({
      title: { tr: 'Program', en: 'Program' },
      kind: 'routine',
      startDate: today,
      phases: [
        {
          fromDay: 1,
          toDay: null,
          slots: { morning: [{ dhikrId, target: 3 }] },
        },
      ],
      ...overrides,
    });

    async function createProgram(
      user: SignInResult,
      dhikrId: string,
      overrides: Record<string, unknown> = {},
    ) {
      const res = await asUser(user)
        .post('/v1/vird/programs')
        .send(payload(dhikrId, overrides))
        .expect(201);
      return data<{ _id: string; status: string }>(res);
    }

    describe('GET /programs', () => {
      it('[EDGE] programı olmayan kullanıcı → 200 []', async () => {
        const user = await newUser();
        const res = await asUser(user).get('/v1/vird/programs').expect(200);
        expect(data(res)).toEqual([]);
      });

      it('[HAPPY] tüm durumlar listelenir, updatedAt azalan sıralı; yalnız kendi programları', async () => {
        const user = await newUser();
        const other = await newUser();
        const dhikrId = await newDhikr();
        const a = await createProgram(user, dhikrId, {
          title: { tr: 'A', en: 'A' },
        });
        const b = await createProgram(user, dhikrId, {
          title: { tr: 'B', en: 'B' },
        });
        const c = await createProgram(user, dhikrId, {
          title: { tr: 'C', en: 'C' },
        });
        await createProgram(other, dhikrId);
        // A'yı güncelle → en üste çıkmalı; B aktifleştirilir (durum filtresi yok).
        await new Promise((r) => setTimeout(r, 15));
        await asUser(user)
          .patch(`/v1/vird/programs/${b._id}`)
          .send({ title: { tr: 'B2', en: 'B2' } })
          .expect(200);
        await new Promise((r) => setTimeout(r, 15));
        await asUser(user)
          .post(`/v1/vird/programs/${a._id}/activate`)
          .expect(201);

        const res = await asUser(user).get('/v1/vird/programs').expect(200);
        const items = data<{ _id: string; status: string }[]>(res);
        expect(items.map((p) => p._id)).toEqual([a._id, b._id, c._id]);
        expect(items.map((p) => p.status)).toEqual([
          'active',
          'draft',
          'draft',
        ]);
      });

      it('[CHAR] ?status= sorgu parametresi yok: bilinmeyen alan sessizce yok sayılır, tüm programlar döner', async () => {
        const user = await newUser();
        const dhikrId = await newDhikr();
        await createProgram(user, dhikrId);
        await createProgram(user, dhikrId);
        const res = await asUser(user)
          .get('/v1/vird/programs')
          .query({ status: 'active' })
          .expect(200);
        expect(data<unknown[]>(res)).toHaveLength(2);
      });
    });

    describe('PATCH /programs/:id', () => {
      it('[HAPPY] başlık + dilim seçimi + hatırlatma güncellenir; kind/startDate/source değişmez; durum korunur', async () => {
        const user = await newUser();
        const dhikrId = await newDhikr();
        const program = await createProgram(user, dhikrId);

        const res = await asUser(user)
          .patch(`/v1/vird/programs/${program._id}`)
          .send({
            title: { tr: 'Yeni', en: 'New' },
            prayerSelection: [1, 3],
            reminders: {
              enabled: false,
              slots: {
                morning: true,
                prayer: false,
                evening: false,
                night: true,
              },
            },
            // değişmez alanlar: whitelist sessizce eler
            kind: 'journey',
            startDate: '2020-01-01',
            source: 'ai',
          })
          .expect(200);
        const body = data<Record<string, unknown>>(res);
        expect(body).toMatchObject({
          title: { tr: 'Yeni', en: 'New' },
          prayerSelection: [1, 3],
          kind: 'routine',
          startDate: today,
          source: 'manual',
          status: 'draft',
        });
        expect(body.reminders).toMatchObject({
          enabled: false,
          slots: { morning: true, night: true },
        });
      });

      it('[HAPPY] status draft→paused ve archived serbest; aktif program paused yapılabilir', async () => {
        const user = await newUser();
        const dhikrId = await newDhikr();
        const program = await createProgram(user, dhikrId);
        await asUser(user)
          .post(`/v1/vird/programs/${program._id}/activate`)
          .expect(201);
        const paused = await asUser(user)
          .patch(`/v1/vird/programs/${program._id}`)
          .send({ status: 'paused' })
          .expect(200);
        expect(data<{ status: string }>(paused).status).toBe('paused');
        const archived = await asUser(user)
          .patch(`/v1/vird/programs/${program._id}`)
          .send({ status: 'archived' })
          .expect(200);
        expect(data<{ status: string }>(archived).status).toBe('archived');
      });

      it('[EDGE] boş gövde 200 (değişiklik yok); bozuk status 400; 61 faz 400; target 0 400; var olmayan id 404', async () => {
        const user = await newUser();
        const dhikrId = await newDhikr();
        const program = await createProgram(user, dhikrId);
        const patch = (body: Record<string, unknown>, id = program._id) =>
          asUser(user).patch(`/v1/vird/programs/${id}`).send(body);

        const empty = await patch({}).expect(200);
        expect(data<{ title: unknown }>(empty).title).toMatchObject({
          tr: 'Program',
          en: 'Program',
        });
        await patch({ status: 'nope' }).expect(400);
        await patch({
          phases: Array.from({ length: 61 }, (_, i) => ({
            fromDay: i + 1,
            slots: {},
          })),
        }).expect(400);
        await patch({
          phases: [
            { fromDay: 1, slots: { morning: [{ dhikrId, target: 0 }] } },
          ],
        }).expect(400);
        await patch({}, new Types.ObjectId().toHexString()).expect(404);
      });
    });

    describe('DELETE /programs/:id', () => {
      it('[HAPPY] taslak silinir → {deleted:true}; sonra GET 404, ikinci DELETE 404, liste boş', async () => {
        const user = await newUser();
        const dhikrId = await newDhikr();
        const program = await createProgram(user, dhikrId);
        const res = await asUser(user)
          .del(`/v1/vird/programs/${program._id}`)
          .expect(200);
        expect(data(res)).toEqual({ deleted: true });
        await asUser(user).get(`/v1/vird/programs/${program._id}`).expect(404);
        await asUser(user).del(`/v1/vird/programs/${program._id}`).expect(404);
        expect(
          data<unknown[]>(
            await asUser(user).get('/v1/vird/programs').expect(200),
          ),
        ).toEqual([]);
      });

      it('[HAPPY] AKTİF program silinir: /today program:null döner, aktif slot serbest kalır (ücretsiz limit 1)', async () => {
        const user = await newUser();
        const dhikrId = await newDhikr();
        const active = await createProgram(user, dhikrId);
        await asUser(user)
          .post(`/v1/vird/programs/${active._id}/activate`)
          .expect(201);
        await asUser(user).del(`/v1/vird/programs/${active._id}`).expect(200);

        const today_ = await asUser(user).get('/v1/vird/today').expect(200);
        expect(data<{ program: unknown }>(today_).program).toBeNull();

        const next = await createProgram(user, dhikrId);
        await asUser(user)
          .post(`/v1/vird/programs/${next._id}/activate`)
          .expect(201);
      });

      it("[CHAR] silinen programın log yazımı 500 vermez; silinen programın tamamlanmış günü history'de kalır (ÜRÜN SORUSU: yetim vird_day_progress)", async () => {
        const user = await newUser();
        const dhikrId = await newDhikr();
        const program = await createProgram(user, dhikrId);
        await asUser(user)
          .post(`/v1/vird/programs/${program._id}/activate`)
          .expect(201);
        await writeLog(user, {
          dhikrId,
          count: 3,
          targetCount: 3,
          virdProgramId: program._id,
          virdSlot: 'morning',
          virdDayIndex: 1,
        });
        const before = data<{
          items: { date: string; isDayComplete: boolean }[];
        }>(
          await asUser(user)
            .get('/v1/vird/history')
            .query({ from: today, to: today })
            .expect(200),
        );
        expect(before.items).toEqual([{ date: today, isDayComplete: true }]);

        await asUser(user).del(`/v1/vird/programs/${program._id}`).expect(200);

        // Silinmiş programa log yazmak çökmez (best-effort türetim sessiz döner).
        await writeLog(
          user,
          {
            dhikrId,
            count: 1,
            targetCount: 3,
            date: yesterday,
            virdProgramId: program._id,
            virdSlot: 'morning',
            virdDayIndex: 1,
          },
          201,
        );
        const after = data<{
          items: { date: string; isDayComplete: boolean }[];
        }>(
          await asUser(user)
            .get('/v1/vird/history')
            .query({ from: today, to: today })
            .expect(200),
        );
        expect(after.items).toEqual([{ date: today, isDayComplete: true }]);
      });
    });
  });

  // ===================================================================
  describe('circles GET /v1/circles (HTTP)', () => {
    it('[EDGE] halkası olmayan kullanıcı → 200 []', async () => {
      const user = await newUser();
      const res = await request(t.http)
        .get('/v1/circles')
        .set(bearer(user.accessToken))
        .expect(200);
      expect(data(res)).toEqual([]);
    });

    it('[HAPPY] özet alanları, kurucu/üye bakışı, createdAt azalan sıra; yalnız üye olunanlar', async () => {
      const creator = await newUser();
      await makePremium(t.model<UserDocument>(User.name), creator.userId);
      const joiner = await newUser();
      const stranger = await newUser();
      const dhikrId = await newDhikr();
      const mk = async (name: string) =>
        data<{ id: string; code: string }>(
          await request(t.http)
            .post('/v1/circles')
            .set(bearer(creator.accessToken))
            .send({ dhikrId, goalCount: 100, name })
            .expect(201),
        );
      const first = await mk('Birinci');
      await new Promise((r) => setTimeout(r, 15));
      const second = await mk('İkinci');
      await request(t.http)
        .post('/v1/circles/join')
        .set(bearer(joiner.accessToken))
        .send({ code: first.code })
        .expect(201);
      await writeLog(creator, {
        dhikrId,
        count: 10,
        targetCount: 10,
        source: 'circle',
        circleId: first.id,
      });

      const list = async (u: SignInResult) =>
        data<Record<string, unknown>[]>(
          await request(t.http)
            .get('/v1/circles')
            .set(bearer(u.accessToken))
            .expect(200),
        );

      const mine = await list(creator);
      expect(mine.map((c) => c.id)).toEqual([second.id, first.id]);
      expect(mine[1]).toMatchObject({
        id: first.id,
        code: first.code,
        name: 'Birinci',
        dhikrId,
        goalCount: 100,
        totalCount: 10,
        myTotal: 10,
        memberCount: 2,
        status: 'active',
        creatorId: creator.userId,
        isCreator: true,
      });
      expect(mine[1]?.dhikr).toBeTruthy();

      const joined = await list(joiner);
      expect(joined).toHaveLength(1);
      expect(joined[0]).toMatchObject({
        id: first.id,
        isCreator: false,
        myTotal: 0,
        totalCount: 10,
      });
      expect(await list(stranger)).toEqual([]);
    });

    it('[HAPPY] kapatılan halka listede kalır (status closed)', async () => {
      const creator = await newUser();
      const dhikrId = await newDhikr();
      const circle = data<{ id: string }>(
        await request(t.http)
          .post('/v1/circles')
          .set(bearer(creator.accessToken))
          .send({ dhikrId, goalCount: 100 })
          .expect(201),
      );
      await request(t.http)
        .post(`/v1/circles/${circle.id}/close`)
        .set(bearer(creator.accessToken))
        .expect(201);
      const list = data<{ id: string; status: string }[]>(
        await request(t.http)
          .get('/v1/circles')
          .set(bearer(creator.accessToken))
          .expect(200),
      );
      expect(list).toMatchObject([{ id: circle.id, status: 'closed' }]);
    });

    it('[HAPPY] süresi geçmiş aktif halka okuma anında kapatılır (tembel süre sonu)', async () => {
      const creator = await newUser();
      const dhikrId = await newDhikr();
      const circle = data<{ id: string }>(
        await request(t.http)
          .post('/v1/circles')
          .set(bearer(creator.accessToken))
          .send({ dhikrId, goalCount: 100, endDate: shiftDateKey(today, 1) })
          .expect(201),
      );
      await t
        .model('Circle')
        .updateOne(
          { _id: circle.id },
          { $set: { expiresAt: new Date(Date.now() - 60_000) } },
        );
      const list = data<{ id: string; status: string }[]>(
        await request(t.http)
          .get('/v1/circles')
          .set(bearer(creator.accessToken))
          .expect(200),
      );
      expect(list[0]?.status).toBe('closed');
    });
  });
});
