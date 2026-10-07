/**
 * Vird Programı e2e — programs CRUD/activate, templates (public), ilerleme
 * (dhikr-logs → today/history), süresi geçmiş yolculuk otomatik tamamlanması.
 * Önkoşul: pnpm db:test
 */
import { randomUUID } from 'node:crypto';
import { Types } from 'mongoose';
import request from 'supertest';
import { istanbulDateKey, shiftDateKey } from '../src/common/utils/date-keys';
import type { DhikrDocument } from '../src/modules/dhikrs/schemas/dhikr.schema';
import {
  User,
  type UserDocument,
} from '../src/modules/users/schemas/user.schema';
import type { VirdDayProgressDocument } from '../src/modules/vird/schemas/vird-day-progress.schema';
import type { VirdProgramDocument } from '../src/modules/vird/schemas/vird-program.schema';
import type { VirdTemplateDocument } from '../src/modules/vird/schemas/vird-template.schema';
import {
  PREMIUM_MAX_ACTIVE_PROGRAMS,
  VIRD_ERROR_CODE,
  VIRD_FREE_LIMIT_DHIKRS,
} from '../src/modules/vird/vird.constants';
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

// bkz. ai.e2e-spec.ts errCode — ForbiddenException({code,message}) hem düz
// hem de Nest'in {message:{code,message}} sarmalamasıyla dönebilir.
type ErrorBody = { code?: string; message?: string | { code?: string } };
function errCode(res: { body: unknown }): string | undefined {
  const body = res.body as ErrorBody;
  return (
    body.code ??
    (typeof body.message === 'object' ? body.message?.code : undefined)
  );
}

describe('Vird Programı (e2e)', () => {
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

  async function newUser() {
    return signIn(t.http, { sub: `e2e-vird-${randomUUID()}` });
  }

  async function seedVirdTemplate(
    overrides: Partial<{
      key: string;
      isPremium: boolean;
      isActive: boolean;
      dhikrKey: string;
    }> = {},
  ) {
    const dhikrModel = t.model<DhikrDocument>('Dhikr');
    const dhikrKey = overrides.dhikrKey ?? `e2e-tpl-dhikr-${randomUUID()}`;
    await seedDhikr(dhikrModel, { key: dhikrKey });

    const templateModel = t.model<VirdTemplateDocument>('VirdTemplate');
    const key = overrides.key ?? `e2e-template-${randomUUID()}`;
    const template = await templateModel.create({
      key,
      kind: 'routine',
      title: { tr: `Şablon ${key}`, en: `Template ${key}` },
      description: { tr: 'açıklama', en: 'description' },
      isPremium: overrides.isPremium ?? false,
      isActive: overrides.isActive ?? true,
      phases: [
        {
          fromDay: 1,
          toDay: null,
          slots: { morning: [{ dhikrKey, target: 33 }] },
        },
      ],
    });
    return { key: template.key, dhikrKey };
  }

  function createManualPayload(
    dhikrIds: string[],
    overrides: Record<string, unknown> = {},
  ) {
    return {
      title: { tr: 'Test Vird', en: 'Test Vird' },
      kind: 'routine',
      startDate: istanbulDateKey(new Date()),
      phases: [
        {
          fromDay: 1,
          toDay: null,
          slots: {
            morning: dhikrIds.map((dhikrId) => ({ dhikrId, target: 10 })),
          },
        },
      ],
      ...overrides,
    };
  }

  describe('templates (public)', () => {
    it('GET /v1/vird/templates tokensız 200, isActive:false görünmez', async () => {
      const active = await seedVirdTemplate({ key: 'e2e-active' });
      await seedVirdTemplate({ key: 'e2e-inactive', isActive: false });

      const res = await request(t.http).get('/v1/vird/templates').expect(200);
      const body = data<{ key: string }[]>(res);
      const keys = body.map((tpl) => tpl.key);
      expect(keys).toContain(active.key);
      expect(keys).not.toContain('e2e-inactive');
    });

    it('GET /v1/vird/templates/:key inaktif şablon için 404', async () => {
      await seedVirdTemplate({ key: 'e2e-hidden', isActive: false });
      await request(t.http).get('/v1/vird/templates/e2e-hidden').expect(404);
    });
  });

  describe('ücretsiz plan', () => {
    let user: SignInResult;
    let dhikrIds: string[];

    beforeEach(async () => {
      user = await newUser();
      const dhikrModel = t.model<DhikrDocument>('Dhikr');
      dhikrIds = await Promise.all(
        Array.from({ length: 4 }, () => seedDhikr(dhikrModel)),
      );
    });

    it('manuel: 3 farklı zikir OK, 4. → 403 VIRD_FREE_LIMIT_DHIKRS', async () => {
      await request(t.http)
        .post('/v1/vird/programs')
        .set(bearer(user.accessToken))
        .send(createManualPayload(dhikrIds.slice(0, VIRD_FREE_LIMIT_DHIKRS)))
        .expect(201);

      const res = await request(t.http)
        .post('/v1/vird/programs')
        .set(bearer(user.accessToken))
        .send(createManualPayload(dhikrIds))
        .expect(403);
      expect(errCode(res)).toBe(VIRD_ERROR_CODE.FREE_LIMIT_DHIKRS);
    });

    it('reminders.enabled:true → 403 VIRD_PREMIUM_REQUIRED', async () => {
      const res = await request(t.http)
        .post('/v1/vird/programs')
        .set(bearer(user.accessToken))
        .send(
          createManualPayload(dhikrIds.slice(0, 1), {
            reminders: {
              enabled: true,
              slots: {
                morning: true,
                prayer: false,
                evening: false,
                night: false,
              },
            },
          }),
        )
        .expect(403);
      expect(errCode(res)).toBe(VIRD_ERROR_CODE.PREMIUM_REQUIRED);
    });

    it('ikinci program activate → 403 VIRD_FREE_LIMIT_ACTIVE', async () => {
      const first = await request(t.http)
        .post('/v1/vird/programs')
        .set(bearer(user.accessToken))
        .send(createManualPayload(dhikrIds.slice(0, 1)))
        .expect(201);
      await request(t.http)
        .post(`/v1/vird/programs/${data<{ _id: string }>(first)._id}/activate`)
        .set(bearer(user.accessToken))
        .expect(201);

      const second = await request(t.http)
        .post('/v1/vird/programs')
        .set(bearer(user.accessToken))
        .send(createManualPayload(dhikrIds.slice(1, 2)))
        .expect(201);
      const res = await request(t.http)
        .post(`/v1/vird/programs/${data<{ _id: string }>(second)._id}/activate`)
        .set(bearer(user.accessToken))
        .expect(403);
      expect(errCode(res)).toBe(VIRD_ERROR_CODE.FREE_LIMIT_ACTIVE);
    });

    it('eşzamanlı iki activate (ücretsiz) → en fazla 1 aktif, en az biri 403', async () => {
      const ids: string[] = [];
      for (const i of [0, 1]) {
        const created = await request(t.http)
          .post('/v1/vird/programs')
          .set(bearer(user.accessToken))
          .send(createManualPayload(dhikrIds.slice(i, i + 1)))
          .expect(201);
        ids.push(data<{ _id: string }>(created)._id);
      }

      for (let round = 0; round < 5; round++) {
        await t
          .model<VirdProgramDocument>('VirdProgram')
          .updateMany(
            { userId: new Types.ObjectId(user.userId) },
            { $set: { status: 'paused' } },
          );
        const results = await Promise.all(
          ids.map((id) =>
            request(t.http)
              .post(`/v1/vird/programs/${id}/activate`)
              .set(bearer(user.accessToken)),
          ),
        );
        const forbidden = results.filter((r) => r.status === 403);
        expect(forbidden.length).toBeGreaterThanOrEqual(1);
        forbidden.forEach((r) =>
          expect(errCode(r)).toBe(VIRD_ERROR_CODE.FREE_LIMIT_ACTIVE),
        );
        const programs = await t
          .model<VirdProgramDocument>('VirdProgram')
          .find({ _id: { $in: ids } })
          .lean();
        expect(
          programs.filter((p) => p.status === 'active').length,
        ).toBeLessThanOrEqual(1);
        // Geri alınan program önceki durumuna (paused) döner.
        programs
          .filter((p) => p.status !== 'active')
          .forEach((p) => expect(p.status).toBe('paused'));
      }
    });

    it('source:template + premium şablon → 403; ücretsiz şablon → 201', async () => {
      const premiumTpl = await seedVirdTemplate({
        key: 'e2e-premium-tpl',
        isPremium: true,
      });
      const freeTpl = await seedVirdTemplate({ key: 'e2e-free-tpl' });

      const forbidden = await request(t.http)
        .post('/v1/vird/programs')
        .set(bearer(user.accessToken))
        .send({
          title: { tr: 'x', en: 'x' },
          kind: 'routine',
          source: 'template',
          templateKey: premiumTpl.key,
        })
        .expect(403);
      expect(errCode(forbidden)).toBe(VIRD_ERROR_CODE.PREMIUM_REQUIRED);

      await request(t.http)
        .post('/v1/vird/programs')
        .set(bearer(user.accessToken))
        .send({
          title: { tr: 'x', en: 'x' },
          kind: 'routine',
          source: 'template',
          templateKey: freeTpl.key,
        })
        .expect(201);
    });

    it("başkasının program id'si → 404", async () => {
      const other = await newUser();
      const created = await request(t.http)
        .post('/v1/vird/programs')
        .set(bearer(other.accessToken))
        .send(createManualPayload(dhikrIds.slice(0, 1)))
        .expect(201);
      const id = data<{ _id: string }>(created)._id;

      await request(t.http)
        .get(`/v1/vird/programs/${id}`)
        .set(bearer(user.accessToken))
        .expect(404);
    });

    it('PATCH status:active → 400 (activate ucunu kullan)', async () => {
      const created = await request(t.http)
        .post('/v1/vird/programs')
        .set(bearer(user.accessToken))
        .send(createManualPayload(dhikrIds.slice(0, 1)))
        .expect(201);
      const id = data<{ _id: string }>(created)._id;

      await request(t.http)
        .patch(`/v1/vird/programs/${id}`)
        .set(bearer(user.accessToken))
        .send({ status: 'active' })
        .expect(400);
    });
  });

  describe('premium plan', () => {
    it('10 aktif OK, 11. → 403 PREMIUM_MAX_ACTIVE_PROGRAMS', async () => {
      const user = await newUser();
      await makePremium(t.model<UserDocument>(User.name), user.userId);
      const dhikrModel = t.model<DhikrDocument>('Dhikr');
      const dhikrId = await seedDhikr(dhikrModel);

      for (let i = 0; i < PREMIUM_MAX_ACTIVE_PROGRAMS; i++) {
        const created = await request(t.http)
          .post('/v1/vird/programs')
          .set(bearer(user.accessToken))
          .send(
            createManualPayload([dhikrId], {
              title: { tr: `p${i}`, en: `p${i}` },
            }),
          )
          .expect(201);
        await request(t.http)
          .post(
            `/v1/vird/programs/${data<{ _id: string }>(created)._id}/activate`,
          )
          .set(bearer(user.accessToken))
          .expect(201);
      }

      const extra = await request(t.http)
        .post('/v1/vird/programs')
        .set(bearer(user.accessToken))
        .send(
          createManualPayload([dhikrId], {
            title: { tr: 'extra', en: 'extra' },
          }),
        )
        .expect(201);
      const res = await request(t.http)
        .post(`/v1/vird/programs/${data<{ _id: string }>(extra)._id}/activate`)
        .set(bearer(user.accessToken))
        .expect(403);
      expect(errCode(res)).toBe(VIRD_ERROR_CODE.PREMIUM_MAX_ACTIVE_PROGRAMS);
    });

    it('eşzamanlı iki activate (premium) → ikisi de aktif', async () => {
      const user = await newUser();
      await makePremium(t.model<UserDocument>(User.name), user.userId);
      const dhikrId = await seedDhikr(t.model<DhikrDocument>('Dhikr'));
      const ids: string[] = [];
      for (const i of [0, 1]) {
        const created = await request(t.http)
          .post('/v1/vird/programs')
          .set(bearer(user.accessToken))
          .send(
            createManualPayload([dhikrId], {
              title: { tr: `c${i}`, en: `c${i}` },
            }),
          )
          .expect(201);
        ids.push(data<{ _id: string }>(created)._id);
      }

      const results = await Promise.all(
        ids.map((id) =>
          request(t.http)
            .post(`/v1/vird/programs/${id}/activate`)
            .set(bearer(user.accessToken)),
        ),
      );
      expect(results.map((r) => r.status)).toEqual([201, 201]);
      const active = await t
        .model<VirdProgramDocument>('VirdProgram')
        .countDocuments({ _id: { $in: ids }, status: 'active' });
      expect(active).toBe(2);
    });
  });

  describe('ilerleme (today/history)', () => {
    it('log yazımı → today slot done → tüm slotlar → isDayComplete; history?from&to', async () => {
      const user = await newUser();
      const dhikrModel = t.model<DhikrDocument>('Dhikr');
      const dhikrIds = await Promise.all([
        seedDhikr(dhikrModel),
        seedDhikr(dhikrModel),
      ]);
      const today = istanbulDateKey(new Date());

      const created = await request(t.http)
        .post('/v1/vird/programs')
        .set(bearer(user.accessToken))
        .send({
          title: { tr: 'İlerleme', en: 'Progress' },
          kind: 'routine',
          startDate: today,
          phases: [
            {
              fromDay: 1,
              toDay: null,
              slots: {
                morning: [{ dhikrId: dhikrIds[0], target: 5 }],
                evening: [{ dhikrId: dhikrIds[1], target: 5 }],
              },
            },
          ],
        })
        .expect(201);
      const programId = data<{ _id: string }>(created)._id;
      await request(t.http)
        .post(`/v1/vird/programs/${programId}/activate`)
        .set(bearer(user.accessToken))
        .expect(201);

      await request(t.http)
        .post('/v1/dhikr-logs')
        .set(bearer(user.accessToken))
        .send({
          userId: user.userId,
          dhikrId: dhikrIds[0],
          count: 5,
          targetCount: 5,
          date: today,
          virdProgramId: programId,
          virdSlot: 'morning',
          virdDayIndex: 1,
        })
        .expect(201);

      const afterMorning = await request(t.http)
        .get(`/v1/vird/today?date=${today}`)
        .set(bearer(user.accessToken))
        .expect(200);
      const morningView = data<{
        slots: Record<string, { done: boolean }>;
        isDayComplete: boolean;
      }>(afterMorning);
      expect(morningView.slots.morning.done).toBe(true);
      expect(morningView.isDayComplete).toBe(false);

      await request(t.http)
        .post('/v1/dhikr-logs')
        .set(bearer(user.accessToken))
        .send({
          userId: user.userId,
          dhikrId: dhikrIds[1],
          count: 5,
          targetCount: 5,
          date: today,
          virdProgramId: programId,
          virdSlot: 'evening',
          virdDayIndex: 1,
        })
        .expect(201);

      const complete = await request(t.http)
        .get(`/v1/vird/today?date=${today}`)
        .set(bearer(user.accessToken))
        .expect(200);
      expect(data<{ isDayComplete: boolean }>(complete).isDayComplete).toBe(
        true,
      );

      const history = await request(t.http)
        .get(`/v1/vird/history?from=${today}&to=${today}`)
        .set(bearer(user.accessToken))
        .expect(200);
      expect(
        data<{ items: { date: string; isDayComplete: boolean }[] }>(history),
      ).toEqual({
        items: [{ date: today, isDayComplete: true }],
      });
    });

    it('süresi geçmiş journey → GET /today tetikler → program completed', async () => {
      const user = await newUser();
      const dhikrModel = t.model<DhikrDocument>('Dhikr');
      const dhikrId = await seedDhikr(dhikrModel);
      const startDate = istanbulDateKey(new Date());

      const created = await request(t.http)
        .post('/v1/vird/programs')
        .set(bearer(user.accessToken))
        .send({
          title: { tr: 'Yolculuk', en: 'Journey' },
          kind: 'journey',
          startDate,
          phases: [
            {
              fromDay: 1,
              toDay: 3,
              slots: { morning: [{ dhikrId, target: 1 }] },
            },
          ],
        })
        .expect(201);
      const programId = data<{ _id: string; endDate?: string }>(created)._id;

      await request(t.http)
        .post(`/v1/vird/programs/${programId}/activate`)
        .set(bearer(user.accessToken))
        .expect(201);

      // Aktivasyon sonrası endDate'i manuel olarak dünle sınırlandır (kurulan
      // faz endDate'i zaten geçmişte olsa da netlik için tekrar zorluyoruz).
      const programModel = t.model<VirdProgramDocument>('VirdProgram');
      await programModel.updateOne(
        { _id: new Types.ObjectId(programId) },
        {
          $set: {
            startDate: shiftDateKey(startDate, -10),
            endDate: shiftDateKey(startDate, -1),
          },
        },
      );

      await request(t.http)
        .get('/v1/vird/today')
        .set(bearer(user.accessToken))
        .expect(200);

      const stored = await programModel.findById(programId).lean().exec();
      expect(stored?.status).toBe('completed');
    });
  });

  describe('QA kararları (A-23, A-24, M-22, M-23)', () => {
    const journey = (
      dhikrId: string,
      overrides: Record<string, unknown> = {},
    ) => ({
      title: { tr: 'Yolculuk', en: 'Journey' },
      kind: 'journey',
      startDate: istanbulDateKey(new Date()),
      phases: [
        { fromDay: 1, toDay: 3, slots: { morning: [{ dhikrId, target: 1 }] } },
      ],
      ...overrides,
    });
    const phase = (fromDay: number, toDay: number | null, dhikrId: string) => ({
      fromDay,
      toDay,
      slots: { morning: [{ dhikrId, target: 1 }] },
    });

    // API-VRD-28 (A-23): bitişi geçmiş journey başlatılamaz
    it('süresi dolmuş journey activate → 400 VIRD_PROGRAM_EXPIRED, taslak kalır', async () => {
      const user = await newUser();
      const dhikrId = await seedDhikr(t.model<DhikrDocument>('Dhikr'));
      const created = await request(t.http)
        .post('/v1/vird/programs')
        .set(bearer(user.accessToken))
        .send(
          journey(dhikrId, {
            startDate: shiftDateKey(istanbulDateKey(new Date()), -10),
          }),
        )
        .expect(201);
      const id = data<{ _id: string }>(created)._id;

      const res = await request(t.http)
        .post(`/v1/vird/programs/${id}/activate`)
        .set(bearer(user.accessToken))
        .expect(400);
      expect(errCode(res)).toBe(VIRD_ERROR_CODE.PROGRAM_EXPIRED);
      expect(JSON.stringify(res.body)).toContain(
        'Bu programın süresi doldu, kopyalayıp yeniden başlat.',
      );
      const stored = await t
        .model<VirdProgramDocument>('VirdProgram')
        .findById(id)
        .lean()
        .exec();
      expect(stored?.status).toBe('draft');
    });

    // API-VRD-28: "bugün" istek saat diliminde (Pago_Pago UTC-11 ile
    // Kiritimati UTC+14 arası 25 saat: takvim günleri her zaman farklı)
    it('bitiş günü = istek tz bugünü → activate OK; ileri tz ile 400', async () => {
      const user = await newUser();
      const dhikrId = await seedDhikr(t.model<DhikrDocument>('Dhikr'));
      const behind = 'Pacific/Pago_Pago';
      const ahead = 'Pacific/Kiritimati';
      const dayIn = (tz: string) =>
        new Intl.DateTimeFormat('en-CA', { timeZone: tz }).format(new Date());
      // endDate = startDate + 2 = geri bölgenin bugünü
      const create = async () =>
        data<{ _id: string }>(
          await request(t.http)
            .post('/v1/vird/programs')
            .set(bearer(user.accessToken))
            .send(
              journey(dhikrId, {
                startDate: shiftDateKey(dayIn(behind), -2),
                clientId: randomUUID(),
              }),
            )
            .expect(201),
        )._id;
      expect(dayIn(ahead) > dayIn(behind)).toBe(true);
      await request(t.http)
        .post(`/v1/vird/programs/${await create()}/activate`)
        .set(bearer(user.accessToken))
        .set('x-client-timezone', ahead)
        .expect(400);
      await request(t.http)
        .post(`/v1/vird/programs/${await create()}/activate`)
        .set(bearer(user.accessToken))
        .set('x-client-timezone', behind)
        .expect(201);
    });

    // API-VRD-27 (A-24)
    it.each([
      ['1. günden başlamıyor', (d: string) => [phase(2, 3, d)]],
      ['boşluk', (d: string) => [phase(1, 2, d), phase(4, 5, d)]],
      ['çakışma', (d: string) => [phase(1, 3, d), phase(3, 5, d)]],
      ['toDay < fromDay', (d: string) => [phase(1, 3, d), phase(4, 2, d)]],
    ])(
      'manuel journey fazları: %s → 400 VIRD_PHASES_INVALID',
      async (_n, build) => {
        const user = await newUser();
        const dhikrId = await seedDhikr(t.model<DhikrDocument>('Dhikr'));
        const res = await request(t.http)
          .post('/v1/vird/programs')
          .set(bearer(user.accessToken))
          .send(journey(dhikrId, { phases: build(dhikrId) }))
          .expect(400);
        expect(errCode(res)).toBe(VIRD_ERROR_CODE.PHASES_INVALID);
      },
    );

    it('manuel journey: boşluksuz fazlar 201; PATCH ile bozuk faz → 400', async () => {
      const user = await newUser();
      const dhikrId = await seedDhikr(t.model<DhikrDocument>('Dhikr'));
      const created = await request(t.http)
        .post('/v1/vird/programs')
        .set(bearer(user.accessToken))
        .send(
          journey(dhikrId, {
            phases: [phase(1, 2, dhikrId), phase(3, 5, dhikrId)],
          }),
        )
        .expect(201);
      const id = data<{ _id: string }>(created)._id;
      const res = await request(t.http)
        .patch(`/v1/vird/programs/${id}`)
        .set(bearer(user.accessToken))
        .send({ phases: [phase(1, 2, dhikrId), phase(4, 5, dhikrId)] })
        .expect(400);
      expect(errCode(res)).toBe(VIRD_ERROR_CODE.PHASES_INVALID);
    });

    // M-22 (sunucu yarısı): içerik düzenleme durumu değiştirmez
    it('duraklatılmış programın içeriği PATCH ile düzenlenince paused kalır', async () => {
      const user = await newUser();
      const dhikrId = await seedDhikr(t.model<DhikrDocument>('Dhikr'));
      const created = await request(t.http)
        .post('/v1/vird/programs')
        .set(bearer(user.accessToken))
        .send(createManualPayload([dhikrId]))
        .expect(201);
      const id = data<{ _id: string }>(created)._id;
      await request(t.http)
        .post(`/v1/vird/programs/${id}/activate`)
        .set(bearer(user.accessToken))
        .expect(201);
      await request(t.http)
        .patch(`/v1/vird/programs/${id}`)
        .set(bearer(user.accessToken))
        .send({ status: 'paused' })
        .expect(200);

      const res = await request(t.http)
        .patch(`/v1/vird/programs/${id}`)
        .set(bearer(user.accessToken))
        .send({
          title: { tr: 'Yeni', en: 'New' },
          phases: createManualPayload([dhikrId]).phases,
        })
        .expect(200);
      expect(data<{ status: string }>(res).status).toBe('paused');
    });

    // M-23 (sunucu yarısı): ilerleme programa bağlı
    it('aynı zikir iki programda: A programının logu B/today sayacına taşınmaz', async () => {
      const user = await newUser();
      await makePremium(t.model<UserDocument>(User.name), user.userId);
      const dhikrId = await seedDhikr(t.model<DhikrDocument>('Dhikr'));
      const today = istanbulDateKey(new Date());
      const ids: string[] = [];
      for (let i = 0; i < 2; i += 1) {
        const created = await request(t.http)
          .post('/v1/vird/programs')
          .set(bearer(user.accessToken))
          .send(createManualPayload([dhikrId], { clientId: `m23-${i}` }))
          .expect(201);
        const id = data<{ _id: string }>(created)._id;
        await request(t.http)
          .post(`/v1/vird/programs/${id}/activate`)
          .set(bearer(user.accessToken))
          .expect(201);
        ids.push(id);
      }
      await request(t.http)
        .post('/v1/dhikr-logs')
        .set(bearer(user.accessToken))
        .send({
          userId: user.userId,
          dhikrId,
          count: 10,
          targetCount: 10,
          date: today,
          virdProgramId: ids[0],
          virdSlot: 'morning',
          virdDayIndex: 1,
        })
        .expect(201);

      const view = async (id: string) =>
        data<{
          isDayComplete: boolean;
          slots: { morning?: { items: { count: number }[] } };
        }>(
          await request(t.http)
            .get(`/v1/vird/today?date=${today}&programId=${id}`)
            .set(bearer(user.accessToken))
            .expect(200),
        );
      const a = await view(ids[0]);
      const b = await view(ids[1]);
      expect(a.slots.morning?.items[0].count).toBe(10);
      expect(a.isDayComplete).toBe(true);
      expect(b.slots.morning?.items[0].count).toBe(0);
      expect(b.isDayComplete).toBe(false);
    });
  });

  describe('QA boşlukları (VRD-16/18/22/25/29/33, VPR-12/13)', () => {
    const post = (u: SignInResult, body: Record<string, unknown>) =>
      request(t.http)
        .post('/v1/vird/programs')
        .set(bearer(u.accessToken))
        .send(body);
    const activate = (u: SignInResult, id: string) =>
      request(t.http)
        .post(`/v1/vird/programs/${id}/activate`)
        .set(bearer(u.accessToken));
    const patch = (
      u: SignInResult,
      id: string,
      body: Record<string, unknown>,
    ) =>
      request(t.http)
        .patch(`/v1/vird/programs/${id}`)
        .set(bearer(u.accessToken))
        .send(body);
    const stored = (id: string) =>
      t.model<VirdProgramDocument>('VirdProgram').findById(id).lean().exec();
    const setup = async (premium = false) => {
      const user = await newUser();
      if (premium)
        await makePremium(t.model<UserDocument>(User.name), user.userId);
      const dhikrId = await seedDhikr(t.model<DhikrDocument>('Dhikr'));
      return { user, dhikrId };
    };
    const idOf = (res: { body: unknown }) =>
      data<{ _id: string }>(res as { body: { data: unknown } })._id;

    it('VRD-16: manuel startDate yok → 400', async () => {
      const { user, dhikrId } = await setup();
      const { startDate: _omit, ...body } = createManualPayload([dhikrId]);
      void _omit;
      await post(user, body).expect(400);
      await post(user, { ...body, startDate: '   ' }).expect(400);
    });

    it('VRD-18: clientId yoksa srv-… üretilir, iki clientId’siz program çakışmaz', async () => {
      const { user, dhikrId } = await setup();
      const a = await post(user, createManualPayload([dhikrId])).expect(201);
      const b = await post(user, createManualPayload([dhikrId])).expect(201);
      const ca = data<{ clientId: string }>(a).clientId;
      const cb = data<{ clientId: string }>(b).clientId;
      expect(ca).toMatch(/^srv-/);
      expect(cb).toMatch(/^srv-/);
      expect(ca).not.toBe(cb);
    });

    it('VRD-22: aynı programa eşzamanlı çift activate → ikisi de aktif programı döner', async () => {
      const { user, dhikrId } = await setup();
      for (let round = 0; round < 5; round++) {
        const id = idOf(
          await post(
            user,
            createManualPayload([dhikrId], { clientId: `r${round}` }),
          ).expect(201),
        );
        const [x, y] = await Promise.all([
          activate(user, id),
          activate(user, id),
        ]);
        expect([x.status, y.status]).toEqual([201, 201]);
        expect(data<{ status: string }>(x).status).toBe('active');
        expect(data<{ status: string }>(y).status).toBe('active');
        expect((await stored(id))?.status).toBe('active');
        await t
          .model<VirdProgramDocument>('VirdProgram')
          .updateOne({ _id: id }, { $set: { status: 'archived' } });
      }
    });

    it('VRD-25: paused/completed/archived → expiresAt temizlenir; active→draft süreyi yeniden kurmaz', async () => {
      const { user, dhikrId } = await setup();
      for (const status of ['paused', 'completed', 'archived']) {
        const id = idOf(
          await post(
            user,
            createManualPayload([dhikrId], { clientId: `s-${status}` }),
          ).expect(201),
        );
        expect((await stored(id))?.expiresAt).toBeDefined();
        await patch(user, id, { status }).expect(200);
        expect((await stored(id))?.expiresAt).toBeUndefined();
      }
      const id = idOf(
        await post(
          user,
          createManualPayload([dhikrId], { clientId: 's-draft' }),
        ).expect(201),
      );
      await activate(user, id).expect(201);
      expect((await stored(id))?.expiresAt).toBeUndefined();
      await patch(user, id, { status: 'draft' }).expect(200);
      const back = await stored(id);
      expect(back?.status).toBe('draft');
      expect(back?.expiresAt).toBeUndefined();
    });

    it('VRD-29: aynı dilimde aynı zikir tekrarı → ilki tutulur', async () => {
      const { user, dhikrId } = await setup();
      const res = await post(
        user,
        createManualPayload([dhikrId], {
          phases: [
            {
              fromDay: 1,
              toDay: null,
              slots: {
                morning: [
                  { dhikrId, target: 7 },
                  { dhikrId, target: 99 },
                ],
              },
            },
          ],
        }),
      ).expect(201);
      const morning = (await stored(idOf(res)))?.phases[0].slots.morning ?? [];
      expect(morning).toHaveLength(1);
      expect(morning[0].target).toBe(7);
    });

    it('VRD-33: manuel ve şablon taslak ~30 gün sonra silinmek üzere işaretlenir (TTL index)', async () => {
      const { user, dhikrId } = await setup();
      const tpl = await seedVirdTemplate();
      const manual = await post(user, createManualPayload([dhikrId])).expect(
        201,
      );
      const fromTpl = await post(user, {
        title: { tr: 'x', en: 'x' },
        kind: 'routine',
        source: 'template',
        templateKey: tpl.key,
      }).expect(201);
      for (const res of [manual, fromTpl]) {
        const exp = (await stored(idOf(res)))?.expiresAt as Date;
        const days = (exp.getTime() - Date.now()) / 86_400_000;
        expect(days).toBeGreaterThan(29.9);
        expect(days).toBeLessThan(30.1);
      }
      const idx = await t
        .model<VirdProgramDocument>('VirdProgram')
        .collection.indexes();
      expect(
        idx.some((i) => i.key.expiresAt === 1 && i.expireAfterSeconds === 0),
      ).toBe(true);
    });

    describe('vird logu', () => {
      const writeLog = (
        u: SignInResult,
        dhikrId: string,
        programId: string,
        count: number,
      ) =>
        request(t.http)
          .post('/v1/dhikr-logs')
          .set(bearer(u.accessToken))
          .send({
            userId: u.userId,
            dhikrId,
            count,
            targetCount: 10,
            date: istanbulDateKey(new Date()),
            virdProgramId: programId,
            virdSlot: 'morning',
            virdDayIndex: 1,
          })
          .expect(201);
      const todayView = async (u: SignInResult, programId: string) =>
        data<{ isDayComplete: boolean }>(
          await request(t.http)
            .get(
              `/v1/vird/today?date=${istanbulDateKey(new Date())}&programId=${programId}`,
            )
            .set(bearer(u.accessToken))
            .expect(200),
        );
      const streak = async (u: SignInResult) =>
        data<{ virdCurrentStreak: number }>(
          await request(t.http)
            .get(`/v1/streaks/${u.userId}`)
            .set(bearer(u.accessToken))
            .expect(200),
        ).virdCurrentStreak;

      it('VPR-12: tamamlanmış gün daha düşük sayımla geri dönmez, seri düşmez', async () => {
        const { user, dhikrId } = await setup();
        const id = idOf(
          await post(user, createManualPayload([dhikrId])).expect(201),
        );
        await activate(user, id).expect(201);
        await writeLog(user, dhikrId, id, 10);
        expect((await todayView(user, id)).isDayComplete).toBe(true);
        expect(await streak(user)).toBe(1);
        await writeLog(user, dhikrId, id, 3);
        expect((await todayView(user, id)).isDayComplete).toBe(true);
        expect(await streak(user)).toBe(1);
      });

      it.each(['draft', 'paused', 'completed'])(
        'VPR-13: %s programa yazılan log kabul edilir, genel seriye sayılır; vird ilerleme/serisi yazılmaz',
        async (status) => {
          const { user, dhikrId } = await setup();
          const id = idOf(
            await post(user, createManualPayload([dhikrId])).expect(201),
          );
          if (status !== 'draft') await patch(user, id, { status }).expect(200);
          await writeLog(user, dhikrId, id, 10);
          const progress = await t
            .model<VirdDayProgressDocument>('VirdDayProgress')
            .findOne({ programId: new Types.ObjectId(id) })
            .lean();
          expect(progress).toBeNull();
          expect(await streak(user)).toBe(0);
          const general = data<{ currentStreak: number }>(
            await request(t.http)
              .get(`/v1/streaks/${user.userId}`)
              .set(bearer(user.accessToken))
              .expect(200),
          );
          expect(general.currentStreak).toBe(1);
        },
      );
    });
  });
});
