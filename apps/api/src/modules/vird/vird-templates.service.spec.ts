import { NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';
import { istanbulDateKey, shiftDateKey } from '../../common/utils/date-keys';
import { VirdTemplatesService } from './vird-templates.service';

describe('VirdTemplatesService', () => {
  const virdTemplateModel = {
    find: jest.fn(),
    findOne: jest.fn(),
  };

  const dhikrModel = {
    find: jest.fn(),
  };

  const specialDayModel = {
    find: jest.fn(),
  };

  let service: VirdTemplatesService;

  function mockFindAllTemplates(docs: Record<string, unknown>[]) {
    virdTemplateModel.find.mockReturnValue({
      select: () => ({
        sort: () => ({
          lean: () => ({ exec: jest.fn().mockResolvedValue(docs) }),
        }),
      }),
    });
  }

  function mockFindOneTemplate(doc: Record<string, unknown> | null) {
    virdTemplateModel.findOne.mockReturnValue({
      lean: () => ({ exec: jest.fn().mockResolvedValue(doc) }),
    });
  }

  function mockDhikrDocs(docs: Record<string, unknown>[]) {
    dhikrModel.find.mockReturnValue({
      select: () => ({
        lean: () => ({ exec: jest.fn().mockResolvedValue(docs) }),
      }),
    });
  }

  /** special_days'ten dönen "1. gün" adaylarını simüle eder — bkz.
   * VirdTemplatesService.findUpcomingAnchorDate (find→select→sort→lean→exec). */
  function mockSpecialDayCandidates(docs: Record<string, unknown>[]) {
    specialDayModel.find.mockReturnValue({
      select: () => ({
        sort: () => ({
          lean: () => ({ exec: jest.fn().mockResolvedValue(docs) }),
        }),
      }),
    });
  }

  function dhikrDoc(overrides: { _id: Types.ObjectId; key: string }) {
    return {
      _id: overrides._id,
      key: overrides.key,
      name: { tr: 'İsim', en: 'Name' },
      nameArabic: 'عربي',
      transliteration: { tr: 'okunuş', en: 'transliteration' },
      meaning: { tr: 'anlam', en: 'meaning' },
    };
  }

  beforeEach(() => {
    virdTemplateModel.find.mockReset();
    virdTemplateModel.findOne.mockReset();
    dhikrModel.find.mockReset();
    specialDayModel.find.mockReset();
    service = new VirdTemplatesService(
      virdTemplateModel as never,
      dhikrModel as never,
      specialDayModel as never,
    );
  });

  describe('findAllActive', () => {
    it('maps active templates to their summary shape and queries only active ones', async () => {
      mockFindAllTemplates([
        {
          key: 'klasik-sabah',
          kind: 'routine',
          title: { tr: 'Sabah Zikirleri', en: 'Morning Dhikrs' },
          description: { tr: 'd', en: 'd' },
          isPremium: false,
        },
      ]);

      await expect(service.findAllActive()).resolves.toEqual([
        {
          key: 'klasik-sabah',
          kind: 'routine',
          title: { tr: 'Sabah Zikirleri', en: 'Morning Dhikrs' },
          description: { tr: 'd', en: 'd' },
          isPremium: false,
          dayCount: undefined,
          anchorDate: undefined,
        },
      ]);
      expect(virdTemplateModel.find).toHaveBeenCalledWith({ isActive: true });
    });

    it('hides a template whose anchorDate + dayCount has already passed', async () => {
      mockFindAllTemplates([
        {
          key: 'gecmis-ozel-gun',
          kind: 'journey',
          isPremium: false,
          anchorDate: '2020-01-01',
          dayCount: 3,
        },
      ]);

      await expect(service.findAllActive()).resolves.toEqual([]);
    });

    it('keeps a template whose anchorDate + dayCount has not passed yet', async () => {
      mockFindAllTemplates([
        {
          key: 'gelecek-ozel-gun',
          kind: 'journey',
          isPremium: false,
          anchorDate: '2099-01-01',
          dayCount: 3,
        },
      ]);

      const result = await service.findAllActive();
      expect(result).toHaveLength(1);
      expect(result[0].key).toBe('gelecek-ozel-gun');
    });

    it('never hides a classic (routine, anchor-less) template', async () => {
      mockFindAllTemplates([
        { key: 'klasik-gunluk-tesbih', kind: 'routine', isPremium: false },
      ]);

      const result = await service.findAllActive();
      expect(result).toHaveLength(1);
    });
  });

  describe('findByKey', () => {
    it('throws NotFoundException when the template does not exist', async () => {
      mockFindOneTemplate(null);

      await expect(service.findByKey('yok')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('throws NotFoundException when the template has expired', async () => {
      mockFindOneTemplate({
        key: 'gecmis-ozel-gun',
        kind: 'journey',
        isPremium: false,
        anchorDate: '2020-01-01',
        dayCount: 1,
        phases: [],
      });

      await expect(service.findByKey('gecmis-ozel-gun')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('reconciles a missing dayCount from phases (max toDay) and still treats an expired journey template as not found', async () => {
      mockFindOneTemplate({
        key: 'gecmis-ozel-gun-dayCount-siz',
        kind: 'journey',
        isPremium: false,
        anchorDate: '2020-01-01',
        // dayCount kasıtlı olarak eksik — fazlardan (max toDay=3) geri
        // hesaplanmalı (bkz. VirdTemplatesService.resolveDayCount).
        phases: [
          { fromDay: 1, toDay: 1, slots: {} },
          { fromDay: 2, toDay: 3, slots: {} },
        ],
      });

      await expect(
        service.findByKey('gecmis-ozel-gun-dayCount-siz'),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('resolves each phase item to full dhikr content and skips unknown dhikrKeys', async () => {
      mockFindOneTemplate({
        key: 'klasik-sabah',
        kind: 'routine',
        title: { tr: 'Sabah Zikirleri', en: 'Morning Dhikrs' },
        isPremium: false,
        phases: [
          {
            fromDay: 1,
            toDay: null,
            slots: {
              morning: [
                { dhikrKey: 'bilinen-key', target: 100 },
                { dhikrKey: 'bilinmeyen-key', target: 10 },
              ],
            },
          },
        ],
      });
      const dhikrObjectId = new Types.ObjectId();
      mockDhikrDocs([dhikrDoc({ _id: dhikrObjectId, key: 'bilinen-key' })]);

      const detail = await service.findByKey('klasik-sabah');

      expect(detail.phases).toEqual([
        {
          fromDay: 1,
          toDay: null,
          note: undefined,
          slots: {
            morning: [
              {
                dhikrId: dhikrObjectId.toString(),
                key: 'bilinen-key',
                name: { tr: 'İsim', en: 'Name' },
                nameArabic: 'عربي',
                transliteration: { tr: 'okunuş', en: 'transliteration' },
                meaning: { tr: 'anlam', en: 'meaning' },
                target: 100,
              },
            ],
          },
        },
      ]);
      expect(dhikrModel.find).toHaveBeenCalledWith({
        key: { $in: ['bilinen-key', 'bilinmeyen-key'] },
      });
    });

    it('drops a slot entirely when none of its items resolve', async () => {
      mockFindOneTemplate({
        key: 'klasik-sabah',
        kind: 'routine',
        isPremium: false,
        phases: [
          {
            fromDay: 1,
            toDay: null,
            slots: { morning: [{ dhikrKey: 'hic-bulunamayan', target: 5 }] },
          },
        ],
      });
      mockDhikrDocs([]);

      const detail = await service.findByKey('klasik-sabah');

      expect(detail.phases).toEqual([
        { fromDay: 1, toDay: null, note: undefined, slots: {} },
      ]);
    });
  });

  describe('resolveForProgram', () => {
    it('returns null when the template does not exist or is inactive', async () => {
      mockFindOneTemplate(null);

      await expect(service.resolveForProgram('yok')).resolves.toBeNull();
    });

    it('returns null when the template has expired', async () => {
      mockFindOneTemplate({
        key: 'gecmis-ozel-gun',
        kind: 'journey',
        isPremium: false,
        anchorDate: '2020-01-01',
        dayCount: 1,
        phases: [],
      });

      await expect(
        service.resolveForProgram('gecmis-ozel-gun'),
      ).resolves.toBeNull();
    });

    it('resolves dhikrKey items to an ObjectId dhikrId, drops unresolved items, and drops phases left empty', async () => {
      mockFindOneTemplate({
        key: 'klasik-sabah',
        kind: 'routine',
        title: { tr: 'Sabah Zikirleri', en: 'Morning Dhikrs' },
        isPremium: false,
        phases: [
          {
            fromDay: 1,
            toDay: null,
            slots: {
              morning: [
                { dhikrKey: 'bilinen-key', target: 100 },
                { dhikrKey: 'bilinmeyen-key', target: 10 },
              ],
            },
          },
          {
            // Bu faz hiçbir zikri çözemeyecek — sonuçtan tamamen düşmeli.
            fromDay: 2,
            toDay: null,
            slots: { evening: [{ dhikrKey: 'hic-bulunamayan', target: 5 }] },
          },
        ],
      });
      const dhikrObjectId = new Types.ObjectId();
      mockDhikrDocs([dhikrDoc({ _id: dhikrObjectId, key: 'bilinen-key' })]);

      const resolved = await service.resolveForProgram('klasik-sabah');

      expect(resolved).not.toBeNull();
      expect(resolved?.template).toEqual({
        key: 'klasik-sabah',
        kind: 'routine',
        title: { tr: 'Sabah Zikirleri', en: 'Morning Dhikrs' },
        isPremium: false,
        dayCount: undefined,
        anchorDate: undefined,
      });
      expect(resolved?.phases).toEqual([
        {
          fromDay: 1,
          toDay: null,
          note: undefined,
          slots: { morning: [{ dhikrId: dhikrObjectId, target: 100 }] },
        },
      ]);
    });

    it('returns an empty phases array (never throws) when nothing resolves — the caller decides how to respond (422)', async () => {
      mockFindOneTemplate({
        key: 'klasik-sabah',
        kind: 'routine',
        isPremium: false,
        phases: [
          {
            fromDay: 1,
            toDay: null,
            slots: { morning: [{ dhikrKey: 'hic-bulunamayan', target: 5 }] },
          },
        ],
      });
      mockDhikrDocs([]);

      const resolved = await service.resolveForProgram('klasik-sabah');

      expect(resolved?.phases).toEqual([]);
    });
  });

  describe('dhikr resolution cache (10 dk TTL)', () => {
    afterEach(() => {
      jest.restoreAllMocks();
    });

    function mockSingleItemTemplate() {
      mockFindOneTemplate({
        key: 'klasik-sabah',
        kind: 'routine',
        isPremium: false,
        phases: [
          {
            fromDay: 1,
            toDay: null,
            slots: { morning: [{ dhikrKey: 'k1', target: 10 }] },
          },
        ],
      });
      mockDhikrDocs([dhikrDoc({ _id: new Types.ObjectId(), key: 'k1' })]);
    }

    it('reuses the cached dhikr lookup within the TTL window instead of re-querying', async () => {
      mockSingleItemTemplate();

      await service.findByKey('klasik-sabah');
      await service.findByKey('klasik-sabah');

      expect(dhikrModel.find).toHaveBeenCalledTimes(1);
    });

    it('re-queries once the 10 minute cache window has elapsed', async () => {
      mockSingleItemTemplate();
      const nowSpy = jest.spyOn(Date, 'now').mockReturnValue(1_000_000);

      await service.findByKey('klasik-sabah');
      expect(dhikrModel.find).toHaveBeenCalledTimes(1);

      nowSpy.mockReturnValue(1_000_000 + 10 * 60 * 1000 + 1);
      await service.findByKey('klasik-sabah');
      expect(dhikrModel.find).toHaveBeenCalledTimes(2);
    });
  });

  describe('sourceEventKey → anchorDate çözümü (special_days)', () => {
    afterEach(() => {
      jest.restoreAllMocks();
    });

    const kandilTemplate = {
      key: 'kandil-kadir',
      kind: 'journey',
      isPremium: true,
      dayCount: 1,
      sourceEventKey: 'kadir-gecesi',
    };

    it('findAllActive: gelecekte bir özel gün kaydı varsa anchorDate o kaydın tarihine çözülür', async () => {
      mockFindAllTemplates([kandilTemplate]);
      mockSpecialDayCandidates([{ date: '2099-05-01' }]);

      const result = await service.findAllActive();

      expect(result).toEqual([
        expect.objectContaining({
          key: 'kandil-kadir',
          anchorDate: '2099-05-01',
        }),
      ]);
    });

    it('findAllActive: özel günden gelecekte/sürmekte olan bir kayıt bulunamazsa şablon gizlenir', async () => {
      mockFindAllTemplates([kandilTemplate]);
      mockSpecialDayCandidates([]);

      await expect(service.findAllActive()).resolves.toEqual([]);
    });

    it('findAllActive: sourceEventKey YOK ise (klasik/statik anchorDate) special_days hiç sorgulanmaz', async () => {
      mockFindAllTemplates([
        { key: 'klasik-sabah', kind: 'routine', isPremium: false },
      ]);

      const result = await service.findAllActive();

      expect(result).toHaveLength(1);
      expect(specialDayModel.find).not.toHaveBeenCalled();
    });

    it("special_days sorgusu family+yıl regex'i, isActive:true ve dayIndex:{$in:[1,null]} filtresini birlikte kullanır", async () => {
      mockFindAllTemplates([
        {
          ...kandilTemplate,
          key: 'ramazan-1448',
          sourceEventKey: 'ramazan-gunleri',
        },
      ]);
      mockSpecialDayCandidates([{ date: '2099-01-01', dayCount: 29 }]);

      await service.findAllActive();

      expect(specialDayModel.find).toHaveBeenCalledTimes(1);
      const firstCallArgs = specialDayModel.find.mock.calls[0] as unknown[];
      const filter = firstCallArgs[0] as {
        eventKey: RegExp;
        isActive: boolean;
        dayIndex: { $in: unknown[] };
      };
      expect(filter.isActive).toBe(true);
      // $in:[1,null] hem dayIndex'i hiç olmayan (undefined) hem de bilerek
      // null yazılmış (tek günlük kandil) kayıtları yakalar.
      expect(filter.dayIndex).toEqual({ $in: [1, null] });
      expect(filter.eventKey).toBeInstanceOf(RegExp);
      // Aile önekiyle başlayıp TAM 4 haneli bir yıl soneki ile bitmeli.
      expect(filter.eventKey.test('ramazan-gunleri-2026')).toBe(true);
      expect(filter.eventKey.test('ramazan-gunleri-2026-ekstra')).toBe(false);
      expect(filter.eventKey.test('kadir-gecesi-2026')).toBe(false);
    });

    it('Ramazan senaryosu (dayIndex:1): bitmiş bir tekrarı atlar, bitişi henüz gelmemiş EN ERKEN kaydı anchor yapar', async () => {
      const todayKey = istanbulDateKey(new Date());
      const bittiTekrar = shiftDateKey(todayKey, -400); // 400 gün önce başlamış, 29 günlük — çok önce bitti
      const gelecekTekrar = shiftDateKey(todayKey, 10); // henüz başlamamış

      mockFindAllTemplates([
        {
          ...kandilTemplate,
          key: 'ramazan-1448',
          dayCount: 29,
          sourceEventKey: 'ramazan-gunleri',
        },
      ]);
      // special_days'ten dönen adaylar HER ZAMAN dayIndex:1 (ya da dayIndex'siz)
      // satırlardır — servis kendi tarafında tekrar dayIndex filtrelemez, bkz.
      // yukarıdaki sorgu testi.
      mockSpecialDayCandidates([
        { date: bittiTekrar, dayCount: 29 },
        { date: gelecekTekrar, dayCount: 29 },
      ]);

      const result = await service.findAllActive();

      expect(result[0].anchorDate).toBe(gelecekTekrar);
    });

    it('Ramazan senaryosu: yolculuğun ORTASINDAYSA (1. gün tarihi geçmiş ama bitiş günü gelecekte) anchor bir sonraki yıla KAYMAZ', async () => {
      const todayKey = istanbulDateKey(new Date());
      const dayOne = shiftDateKey(todayKey, -5); // 5 gün önce başladı, 29 gün sürüyor — bitişi hâlâ ileride

      mockFindAllTemplates([
        {
          ...kandilTemplate,
          key: 'ramazan-1448',
          dayCount: 29,
          sourceEventKey: 'ramazan-gunleri',
        },
      ]);
      mockSpecialDayCandidates([{ date: dayOne, dayCount: 29 }]);

      const result = await service.findAllActive();

      expect(result[0].anchorDate).toBe(dayOne);
    });

    it('resolveForProgram: özel günden çözülen anchorDate template.anchorDate olarak döner', async () => {
      mockFindOneTemplate({
        ...kandilTemplate,
        phases: [
          {
            fromDay: 1,
            toDay: 1,
            slots: { night: [{ dhikrKey: 'k1', target: 10 }] },
          },
        ],
      });
      mockSpecialDayCandidates([{ date: '2099-05-01' }]);
      mockDhikrDocs([dhikrDoc({ _id: new Types.ObjectId(), key: 'k1' })]);

      const resolved = await service.resolveForProgram('kandil-kadir');

      expect(resolved?.template.anchorDate).toBe('2099-05-01');
    });

    it("resolveForProgram: özel günden kayıt bulunamazsa null döner (404'e çevirmek çağıranın işi)", async () => {
      mockFindOneTemplate({ ...kandilTemplate, phases: [] });
      mockSpecialDayCandidates([]);

      await expect(
        service.resolveForProgram('kandil-kadir'),
      ).resolves.toBeNull();
    });

    it('findByKey: özel günden kayıt bulunamazsa NotFoundException fırlatır', async () => {
      mockFindOneTemplate({ ...kandilTemplate, phases: [] });
      mockSpecialDayCandidates([]);

      await expect(service.findByKey('kandil-kadir')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('cache: aynı sourceEventKey için 10 dk TTL penceresinde special_days tekrar sorgulanmaz', async () => {
      mockFindAllTemplates([kandilTemplate]);
      mockSpecialDayCandidates([{ date: '2099-05-01' }]);

      await service.findAllActive();
      await service.findAllActive();

      expect(specialDayModel.find).toHaveBeenCalledTimes(1);
    });

    it('cache: 10 dakikalık pencere geçince special_days tekrar sorgulanır', async () => {
      mockFindAllTemplates([kandilTemplate]);
      mockSpecialDayCandidates([{ date: '2099-05-01' }]);
      const nowSpy = jest.spyOn(Date, 'now').mockReturnValue(1_000_000);

      await service.findAllActive();
      expect(specialDayModel.find).toHaveBeenCalledTimes(1);

      nowSpy.mockReturnValue(1_000_000 + 10 * 60 * 1000 + 1);
      await service.findAllActive();
      expect(specialDayModel.find).toHaveBeenCalledTimes(2);
    });

    it('cache: farklı sourceEventKey ailesi için ayrıca sorgular (aile başına bağımsız cache girdisi)', async () => {
      mockFindAllTemplates([
        kandilTemplate,
        {
          ...kandilTemplate,
          key: 'kandil-berat',
          sourceEventKey: 'berat-kandili',
        },
      ]);
      mockSpecialDayCandidates([{ date: '2099-05-01' }]);

      await service.findAllActive();

      expect(specialDayModel.find).toHaveBeenCalledTimes(2);
    });
  });
});
