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
      const startDate = shiftDateKey(istanbulDateKey(new Date()), -10);

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
        { $set: { endDate: shiftDateKey(istanbulDateKey(new Date()), -1) } },
      );

      await request(t.http)
        .get('/v1/vird/today')
        .set(bearer(user.accessToken))
        .expect(200);

      const stored = await programModel.findById(programId).lean().exec();
      expect(stored?.status).toBe('completed');
    });
  });
});
