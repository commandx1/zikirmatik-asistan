import { Logger } from '@nestjs/common';
import { istanbulDateKey, shiftDateKey } from '../../common/utils/date-keys';
import { SPECIAL_DAYS_MIN_COVERAGE_DAYS } from './special-days.constants';
import {
  SpecialDaysService,
  type SpecialDaysCoverage,
} from './special-days.service';

// Mongoose'un findOne(...).sort(...).select(...).lean().exec() zincirini
// taklit eden minimal sahte nesneler. Gerçek kodun çağırdığı sıra ile
// eşleşir (bkz. SpecialDaysService.getCoverage).
function createFindOneChain(result: unknown) {
  return {
    sort: () => ({
      select: () => ({
        lean: () => ({
          exec: () => Promise.resolve(result),
        }),
      }),
    }),
  };
}

function createRejectedFindOneChain(error: Error) {
  return {
    sort: () => ({
      select: () => ({
        lean: () => ({
          exec: () => Promise.reject(error),
        }),
      }),
    }),
  };
}

// onApplicationBootstrap() kasıtlı olarak await edilmez (bootstrap'ı
// bloklamamak için); .then/.catch zincirinin çalışması için microtask
// kuyruğunun boşalmasını beklememiz gerekir. setImmediate, Node'da tüm
// bekleyen Promise callback'lerinden sonra çalışır.
const flushMicrotasks = () =>
  new Promise<void>((resolve) => setImmediate(resolve));

describe('SpecialDaysService', () => {
  const specialDayModel = {
    findOne: jest.fn(),
  };

  let service: SpecialDaysService;
  const originalNodeEnv = process.env.NODE_ENV;

  beforeEach(() => {
    specialDayModel.findOne.mockReset();
    service = new SpecialDaysService(specialDayModel as never);
  });

  afterEach(() => {
    process.env.NODE_ENV = originalNodeEnv;
    jest.restoreAllMocks();
  });

  describe('getCoverage', () => {
    it('aktif kayıt yoksa ok:false ve null alanlar döner', async () => {
      specialDayModel.findOne.mockReturnValue(createFindOneChain(null));

      const coverage = await service.getCoverage();

      expect(coverage).toEqual({
        lastKnownDate: null,
        daysAhead: null,
        ok: false,
      });
      expect(specialDayModel.findOne).toHaveBeenCalledWith({
        isActive: true,
      });
    });

    it('son tarih eşikten (180 gün) daha ileriyse ok:true döner', async () => {
      const lastKnownDate = shiftDateKey(
        istanbulDateKey(new Date()),
        SPECIAL_DAYS_MIN_COVERAGE_DAYS + 20, // 200 gün ileri
      );
      specialDayModel.findOne.mockReturnValue(
        createFindOneChain({ date: lastKnownDate }),
      );

      const coverage = await service.getCoverage();

      expect(coverage).toEqual({
        lastKnownDate,
        daysAhead: SPECIAL_DAYS_MIN_COVERAGE_DAYS + 20,
        ok: true,
      });
    });

    it('son tarih eşikten (180 gün) daha yakınsa ok:false döner', async () => {
      const lastKnownDate = shiftDateKey(
        istanbulDateKey(new Date()),
        SPECIAL_DAYS_MIN_COVERAGE_DAYS - 80, // 100 gün ileri
      );
      specialDayModel.findOne.mockReturnValue(
        createFindOneChain({ date: lastKnownDate }),
      );

      const coverage = await service.getCoverage();

      expect(coverage).toEqual({
        lastKnownDate,
        daysAhead: SPECIAL_DAYS_MIN_COVERAGE_DAYS - 80,
        ok: false,
      });
    });

    it('sorgu hata verirse throw etmez, ok:false döner', async () => {
      jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
      specialDayModel.findOne.mockReturnValue(
        createRejectedFindOneChain(new Error('mongo bağlantı hatası')),
      );

      await expect(service.getCoverage()).resolves.toEqual({
        lastKnownDate: null,
        daysAhead: null,
        ok: false,
      });
    });
  });

  describe('onApplicationBootstrap', () => {
    it('NODE_ENV=test iken kapsama kontrolünü çalıştırmaz', async () => {
      process.env.NODE_ENV = 'test';
      const getCoverageSpy = jest.spyOn(service, 'getCoverage');
      const warnSpy = jest
        .spyOn(Logger.prototype, 'warn')
        .mockImplementation(() => undefined);

      service.onApplicationBootstrap();
      await flushMicrotasks();

      expect(getCoverageSpy).not.toHaveBeenCalled();
      expect(warnSpy).not.toHaveBeenCalled();
    });

    it('kapsama yetersizken (ok:false) açılışta Logger.warn tek satır çağrılır', async () => {
      process.env.NODE_ENV = 'production';
      const coverage: SpecialDaysCoverage = {
        lastKnownDate: '2027-05-19',
        daysAhead: 120,
        ok: false,
      };
      jest.spyOn(service, 'getCoverage').mockResolvedValue(coverage);
      const warnSpy = jest
        .spyOn(Logger.prototype, 'warn')
        .mockImplementation(() => undefined);

      service.onApplicationBootstrap();
      await flushMicrotasks();

      expect(warnSpy).toHaveBeenCalledTimes(1);
      const [message] = warnSpy.mock.calls[0] as [string];
      expect(message).toContain('[special-days] veri ufku yetersiz');
      expect(message).toContain('2027-05-19');
      expect(message).toContain('120 gün kaldı (<180)');
      expect(message).toContain('hijri-calendar.mjs');
      expect(message).toContain('seed:special-days');
    });

    it('kapsama yeterliyken (ok:true) açılışta Logger.warn çağrılmaz', async () => {
      process.env.NODE_ENV = 'production';
      const coverage: SpecialDaysCoverage = {
        lastKnownDate: '2027-05-19',
        daysAhead: 200,
        ok: true,
      };
      jest.spyOn(service, 'getCoverage').mockResolvedValue(coverage);
      const warnSpy = jest
        .spyOn(Logger.prototype, 'warn')
        .mockImplementation(() => undefined);

      service.onApplicationBootstrap();
      await flushMicrotasks();

      expect(warnSpy).not.toHaveBeenCalled();
    });
  });
});
