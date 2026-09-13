import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { Types } from 'mongoose';
import { VirdProgramsService } from './vird-programs.service';
import { VIRD_ERROR_CODE } from './vird.constants';

type ForbiddenPayload = { code?: string; message?: string };

async function captureForbidden(
  promise: Promise<unknown>,
): Promise<ForbiddenPayload> {
  try {
    await promise;
  } catch (error) {
    if (error instanceof ForbiddenException) {
      return error.getResponse() as ForbiddenPayload;
    }
    throw error;
  }
  throw new Error(
    'Promise beklenildiği gibi reddedilmedi (ForbiddenException).',
  );
}

describe('VirdProgramsService', () => {
  const virdProgramModel = {
    find: jest.fn(),
    findOne: jest.fn(),
    findOneAndUpdate: jest.fn(),
    create: jest.fn(),
    deleteOne: jest.fn(),
    deleteMany: jest.fn(),
    countDocuments: jest.fn(),
  };

  const userModel = {
    findById: jest.fn(),
  };

  const templatesService = {
    resolveForProgram: jest.fn(),
  };

  let service: VirdProgramsService;
  const userId = new Types.ObjectId().toHexString();
  const dhikrIds = Array.from({ length: 5 }, () =>
    new Types.ObjectId().toHexString(),
  );

  function mockPremium(isPremium: boolean) {
    userModel.findById.mockReturnValue({
      select: () => ({
        lean: () => ({ exec: jest.fn().mockResolvedValue({ isPremium }) }),
      }),
    });
  }

  function phasesWithDhikrs(ids: string[]) {
    return [
      {
        fromDay: 1,
        toDay: null,
        slots: { morning: ids.map((id) => ({ dhikrId: id, target: 33 })) },
      },
    ];
  }

  /** VirdTemplatesService.resolveForProgram'ın gerçek çıktı şeklini taklit
   * eder: dhikrId burada (DTO'daki phasesWithDhikrs'in aksine) zaten çözülmüş
   * bir Types.ObjectId'dir, string değil (bkz. vird-templates.service.ts
   * resolveSlotsForProgram). */
  function resolvedPhases() {
    return [
      {
        fromDay: 1,
        toDay: null,
        slots: { morning: [{ dhikrId: new Types.ObjectId(), target: 33 }] },
      },
    ];
  }

  /** VirdTemplatesService.resolveForProgram'ın döndürdüğü şekli taklit eder
   * (bkz. vird-templates.service.ts ResolvedTemplateForProgram). */
  function resolvedTemplate(
    overrides: {
      key?: string;
      isPremium?: boolean;
      kind?: 'routine' | 'journey';
      title?: { tr: string; en: string };
      dayCount?: number;
      anchorDate?: string;
      phases?: unknown[];
    } = {},
  ) {
    return {
      template: {
        key: overrides.key ?? 'klasik-sabah',
        kind: overrides.kind ?? 'routine',
        title: overrides.title ?? {
          tr: 'Sabah Zikirleri',
          en: 'Morning Dhikrs',
        },
        isPremium: overrides.isPremium ?? false,
        dayCount: overrides.dayCount,
        anchorDate: overrides.anchorDate,
      },
      phases: overrides.phases ?? resolvedPhases(),
    };
  }

  beforeEach(() => {
    Object.values(virdProgramModel).forEach((fn) => fn.mockReset());
    userModel.findById.mockReset();
    templatesService.resolveForProgram.mockReset();
    service = new VirdProgramsService(
      virdProgramModel as never,
      userModel as never,
      templatesService as never,
    );
  });

  describe('create', () => {
    it('rejects a manual program above the free distinct-dhikr limit', async () => {
      mockPremium(false);

      const payload = captureForbidden(
        service.create(userId, {
          title: { tr: 't', en: 't' },
          kind: 'routine',
          startDate: '2026-01-01',
          phases: phasesWithDhikrs(dhikrIds),
        } as never),
      );

      await expect(payload).resolves.toMatchObject({
        code: VIRD_ERROR_CODE.FREE_LIMIT_DHIKRS,
      });
      expect(virdProgramModel.create).not.toHaveBeenCalled();
    });

    it('allows a premium user above the free distinct-dhikr limit', async () => {
      mockPremium(true);
      virdProgramModel.create.mockResolvedValue({
        toObject: () => ({ _id: 'created' }),
      });

      await expect(
        service.create(userId, {
          title: { tr: 't', en: 't' },
          kind: 'routine',
          startDate: '2026-01-01',
          phases: phasesWithDhikrs(dhikrIds),
        } as never),
      ).resolves.toEqual({ _id: 'created' });
    });

    it('rejects reminders.enabled for a free user', async () => {
      mockPremium(false);

      const payload = captureForbidden(
        service.create(userId, {
          title: { tr: 't', en: 't' },
          kind: 'routine',
          startDate: '2026-01-01',
          phases: phasesWithDhikrs([dhikrIds[0]]),
          reminders: {
            enabled: true,
            slots: {
              morning: true,
              prayer: false,
              evening: false,
              night: false,
            },
          },
        } as never),
      );

      await expect(payload).resolves.toMatchObject({
        code: VIRD_ERROR_CODE.PREMIUM_REQUIRED,
      });
    });

    it('rejects a template/ai source for a free user even without reminders', async () => {
      mockPremium(false);

      const payload = captureForbidden(
        service.create(userId, {
          title: { tr: 't', en: 't' },
          kind: 'routine',
          startDate: '2026-01-01',
          source: 'template',
        } as never),
      );

      await expect(payload).resolves.toMatchObject({
        code: VIRD_ERROR_CODE.PREMIUM_REQUIRED,
      });
    });

    it('accepts a premium template source without requiring phases in the body (resolved server-side from the template)', async () => {
      mockPremium(true);
      templatesService.resolveForProgram.mockResolvedValue(
        resolvedTemplate({
          key: 'ramazan-viri',
          isPremium: true,
          kind: 'journey',
        }),
      );
      virdProgramModel.create.mockResolvedValue({
        toObject: () => ({ _id: 'created' }),
      });

      await expect(
        service.create(userId, {
          title: { tr: 't', en: 't' },
          kind: 'journey',
          startDate: '2026-01-01',
          source: 'template',
          templateKey: 'ramazan-viri',
        } as never),
      ).resolves.toEqual({ _id: 'created' });
      expect(templatesService.resolveForProgram).toHaveBeenCalledWith(
        'ramazan-viri',
      );
    });

    describe('templateKey resolution', () => {
      it('creates a draft program from a classic (non-premium) template even for a free user, with phases resolved from the template', async () => {
        mockPremium(false);
        const resolved = resolvedTemplate({
          key: 'klasik-sabah',
          isPremium: false,
          kind: 'routine',
        });
        templatesService.resolveForProgram.mockResolvedValue(resolved);
        virdProgramModel.create.mockResolvedValue({
          toObject: () => ({ _id: 'created' }),
        });

        await expect(
          service.create(userId, {
            title: { tr: 'x', en: 'x' },
            kind: 'routine',
            startDate: '2026-01-01',
            source: 'template',
            templateKey: 'klasik-sabah',
          } as never),
        ).resolves.toEqual({ _id: 'created' });

        const [createArgs] = virdProgramModel.create.mock.calls[0] as [
          Record<string, unknown>,
        ];
        expect(createArgs).toMatchObject({
          source: 'template',
          templateKey: 'klasik-sabah',
          status: 'draft',
          kind: 'routine',
          title: resolved.template.title,
          startDate: '2026-01-01',
          phases: resolved.phases,
        });
      });

      it('rejects a premium template for a free user with VIRD_PREMIUM_REQUIRED', async () => {
        mockPremium(false);
        templatesService.resolveForProgram.mockResolvedValue(
          resolvedTemplate({ key: 'premium-sablon', isPremium: true }),
        );

        const payload = captureForbidden(
          service.create(userId, {
            title: { tr: 't', en: 't' },
            kind: 'routine',
            startDate: '2026-01-01',
            source: 'template',
            templateKey: 'premium-sablon',
          } as never),
        );

        await expect(payload).resolves.toMatchObject({
          code: VIRD_ERROR_CODE.PREMIUM_REQUIRED,
        });
        expect(virdProgramModel.create).not.toHaveBeenCalled();
      });

      it('returns 404 when the template does not exist or is not active', async () => {
        mockPremium(true);
        templatesService.resolveForProgram.mockResolvedValue(null);

        await expect(
          service.create(userId, {
            title: { tr: 't', en: 't' },
            kind: 'routine',
            startDate: '2026-01-01',
            source: 'template',
            templateKey: 'bilinmeyen-sablon',
          } as never),
        ).rejects.toBeInstanceOf(NotFoundException);
      });

      it('returns 422 when none of the template dhikrs could be resolved', async () => {
        mockPremium(true);
        templatesService.resolveForProgram.mockResolvedValue(
          resolvedTemplate({ phases: [] }),
        );

        await expect(
          service.create(userId, {
            title: { tr: 't', en: 't' },
            kind: 'routine',
            startDate: '2026-01-01',
            source: 'template',
            templateKey: 'klasik-sabah',
          } as never),
        ).rejects.toBeInstanceOf(UnprocessableEntityException);
      });

      it('falls back to the template anchorDate, then to today, when startDate is omitted from the body', async () => {
        mockPremium(true);
        templatesService.resolveForProgram.mockResolvedValue(
          resolvedTemplate({ anchorDate: '2026-03-10' }),
        );
        virdProgramModel.create.mockResolvedValue({
          toObject: () => ({ _id: 'created' }),
        });

        await service.create(userId, {
          title: { tr: 't', en: 't' },
          kind: 'routine',
          source: 'template',
          templateKey: 'klasik-sabah',
        } as never);

        const [createArgs] = virdProgramModel.create.mock.calls[0] as [
          Record<string, unknown>,
        ];
        expect(createArgs).toMatchObject({ startDate: '2026-03-10' });
      });
    });

    it('requires at least one phase for a manual program', async () => {
      mockPremium(true);

      await expect(
        service.create(userId, {
          title: { tr: 't', en: 't' },
          kind: 'routine',
          startDate: '2026-01-01',
        } as never),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe('activate', () => {
    function mockProgram(status: string) {
      virdProgramModel.findOne.mockReturnValue({
        lean: () => ({
          exec: jest.fn().mockResolvedValue({ _id: userId, status }),
        }),
      });
    }

    it('rejects activation past the free active-program limit', async () => {
      mockPremium(false);
      mockProgram('draft');
      virdProgramModel.countDocuments.mockResolvedValue(1);

      const payload = captureForbidden(service.activate(userId, userId));
      await expect(payload).resolves.toMatchObject({
        code: VIRD_ERROR_CODE.FREE_LIMIT_ACTIVE,
      });
    });

    it('rejects activation past the premium active-program limit', async () => {
      mockPremium(true);
      mockProgram('draft');
      virdProgramModel.countDocuments.mockResolvedValue(10);

      const payload = captureForbidden(service.activate(userId, userId));
      await expect(payload).resolves.toMatchObject({
        code: VIRD_ERROR_CODE.PREMIUM_MAX_ACTIVE_PROGRAMS,
      });
    });

    it('activates a draft under the limit and clears expiresAt', async () => {
      mockPremium(false);
      mockProgram('draft');
      virdProgramModel.countDocuments.mockResolvedValue(0);
      virdProgramModel.findOneAndUpdate.mockReturnValue({
        lean: () => ({
          exec: jest.fn().mockResolvedValue({ status: 'active' }),
        }),
      });

      await expect(service.activate(userId, userId)).resolves.toEqual({
        status: 'active',
      });

      const [filter, update] = virdProgramModel.findOneAndUpdate.mock
        .calls[0] as [
        unknown,
        { $set: Record<string, unknown>; $unset: Record<string, unknown> },
      ];
      expect(filter).toMatchObject({ userId: new Types.ObjectId(userId) });
      expect(update.$set).toEqual({ status: 'active' });
      expect(update.$unset).toEqual({ expiresAt: 1 });
    });

    it('rejects activating a program that is not draft/paused', async () => {
      mockPremium(false);
      mockProgram('completed');

      await expect(service.activate(userId, userId)).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });
  });

  describe('update', () => {
    function mockExisting(doc: Record<string, unknown>) {
      virdProgramModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(doc),
      });
    }

    it('rejects setting status directly to active', async () => {
      mockPremium(false);
      mockExisting({
        source: 'manual',
        kind: 'routine',
        startDate: '2026-01-01',
        reminders: { enabled: false },
      });

      await expect(
        service.update(userId, userId, { status: 'active' } as never),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('rejects a phases update that exceeds the free dhikr limit on a manual program', async () => {
      mockPremium(false);
      mockExisting({
        source: 'manual',
        kind: 'routine',
        startDate: '2026-01-01',
        reminders: { enabled: false },
      });

      const payload = captureForbidden(
        service.update(userId, userId, {
          phases: phasesWithDhikrs(dhikrIds),
        }),
      );
      await expect(payload).resolves.toMatchObject({
        code: VIRD_ERROR_CODE.FREE_LIMIT_DHIKRS,
      });
    });

    it('rejects enabling reminders for a free user via PATCH', async () => {
      mockPremium(false);
      mockExisting({
        source: 'manual',
        kind: 'routine',
        startDate: '2026-01-01',
        reminders: { enabled: false },
      });

      const payload = captureForbidden(
        service.update(userId, userId, {
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
      );
      await expect(payload).resolves.toMatchObject({
        code: VIRD_ERROR_CODE.PREMIUM_REQUIRED,
      });
    });

    it('archives a program and evicts the oldest archived ones beyond the cap of 20', async () => {
      mockPremium(true);
      mockExisting({
        source: 'manual',
        kind: 'routine',
        startDate: '2026-01-01',
        reminders: { enabled: false },
      });
      virdProgramModel.findOneAndUpdate.mockReturnValue({
        lean: () => ({
          exec: jest.fn().mockResolvedValue({ status: 'archived' }),
        }),
      });
      const archivedDocs = Array.from({ length: 22 }, (_, index) => ({
        _id: `id-${index}`,
      }));
      virdProgramModel.find.mockReturnValue({
        sort: () => ({
          select: () => ({
            lean: () => ({ exec: jest.fn().mockResolvedValue(archivedDocs) }),
          }),
        }),
      });
      virdProgramModel.deleteMany.mockReturnValue({
        exec: jest.fn().mockResolvedValue({}),
      });

      await service.update(userId, userId, { status: 'archived' } as never);

      expect(virdProgramModel.deleteMany).toHaveBeenCalledWith({
        _id: { $in: ['id-0', 'id-1'] },
      });
    });

    it('does not evict archived programs when under the cap', async () => {
      mockPremium(true);
      mockExisting({
        source: 'manual',
        kind: 'routine',
        startDate: '2026-01-01',
        reminders: { enabled: false },
      });
      virdProgramModel.findOneAndUpdate.mockReturnValue({
        lean: () => ({
          exec: jest.fn().mockResolvedValue({ status: 'archived' }),
        }),
      });
      virdProgramModel.find.mockReturnValue({
        sort: () => ({
          select: () => ({
            lean: () => ({
              exec: jest.fn().mockResolvedValue([{ _id: 'id-0' }]),
            }),
          }),
        }),
      });

      await service.update(userId, userId, { status: 'archived' } as never);

      expect(virdProgramModel.deleteMany).not.toHaveBeenCalled();
    });
  });
});
