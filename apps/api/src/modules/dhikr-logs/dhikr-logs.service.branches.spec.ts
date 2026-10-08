import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';
import { DhikrLogsService } from './dhikr-logs.service';

const USER = new Types.ObjectId().toString();
const DHIKR = new Types.ObjectId().toString();
const exec = (v: unknown) => ({
  lean: () => ({ exec: () => Promise.resolve(v) }),
  sort: () => ({ lean: () => ({ exec: () => Promise.resolve(v) }) }),
  exec: () => Promise.resolve(v),
});

describe('DhikrLogsService dallar', () => {
  const logModel = {
    findOne: jest.fn(),
    findOneAndUpdate: jest.fn(),
    exists: jest.fn(),
    find: jest.fn(),
    bulkWrite: jest.fn(),
    deleteMany: jest.fn(),
    updateMany: jest.fn(),
  };
  const userModel = { countDocuments: jest.fn() };
  const dhikrModel = { countDocuments: jest.fn() };
  const streaks = { recalculateForUser: jest.fn() };
  const vird = { applyLogWrite: jest.fn() };
  const circles = { assertCanContribute: jest.fn(), applyProgress: jest.fn() };
  let svc: DhikrLogsService;

  beforeEach(() => {
    Object.values({
      ...logModel,
      ...userModel,
      ...dhikrModel,
      ...streaks,
      ...vird,
      ...circles,
    }).forEach((m) => m.mockReset());
    userModel.countDocuments.mockResolvedValue(1);
    dhikrModel.countDocuments.mockResolvedValue(1);
    logModel.findOne.mockReturnValue(exec(null));
    logModel.exists.mockResolvedValue(null);
    logModel.findOneAndUpdate.mockReturnValue(exec({ _id: 'l' }));
    streaks.recalculateForUser.mockResolvedValue(undefined);
    vird.applyLogWrite.mockResolvedValue(undefined);
    svc = new DhikrLogsService(
      logModel as never,
      userModel as never,
      dhikrModel as never,
      streaks as never,
      vird as never,
      circles as never,
    );
  });

  const base = { userId: USER, count: 5, targetCount: 10, date: '2026-09-17' };

  describe('create doğrulamaları', () => {
    it('ne dhikrId ne customDhikrId → 400', async () => {
      await expect(svc.create({ ...base })).rejects.toThrow(
        BadRequestException,
      );
      await expect(
        svc.create({ ...base, dhikrId: '  ', customDhikrId: ' ' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('geçersiz takvim günü ve gelecek tarih → 400', async () => {
      await expect(
        svc.create({ ...base, dhikrId: DHIKR, date: '2026-02-30' }),
      ).rejects.toThrow('Geçersiz tarih');
      await expect(
        svc.create({ ...base, dhikrId: DHIKR, date: '2999-01-01' }),
      ).rejects.toThrow('Gelecek');
    });

    it('bilinmeyen kullanıcı veya zikir → 404; geçersiz ObjectId → 404', async () => {
      userModel.countDocuments.mockResolvedValueOnce(0);
      await expect(svc.create({ ...base, dhikrId: DHIKR })).rejects.toThrow(
        NotFoundException,
      );
      dhikrModel.countDocuments.mockResolvedValueOnce(0);
      await expect(svc.create({ ...base, dhikrId: DHIKR })).rejects.toThrow(
        'zikir bulunamadı',
      );
      await expect(svc.create({ ...base, dhikrId: 'bad' })).rejects.toThrow(
        NotFoundException,
      );
    });

    it('özel zikir: dhikr varlık sorgusu yapılmaz, customDhikrId kırpılıp filtreye ve insert’e girer; metinler kırpılır', async () => {
      await svc.create({
        ...base,
        customDhikrId: '  my-1 ',
        customDhikrName: '  Ad ',
        customDhikrArabic: '   ',
        aiPrompt: ' p ',
        aiAssistantNote: ' ',
        aiRecommendationId: new Types.ObjectId().toString(),
        sessionDuration: 12,
        source: 'ai',
        isFavorite: true,
      } as never);
      expect(dhikrModel.countDocuments).not.toHaveBeenCalled();
      const [filter, update] = logModel.findOneAndUpdate.mock.calls[0] as [
        Record<string, unknown>,
        {
          $set: Record<string, unknown>;
          $setOnInsert: Record<string, unknown>;
        },
      ];
      expect(filter.customDhikrId).toBe('my-1');
      expect(update.$setOnInsert.customDhikrId).toBe('my-1');
      expect(update.$set).toMatchObject({
        customDhikrName: 'Ad',
        customDhikrArabic: undefined,
        aiPrompt: 'p',
        aiAssistantNote: undefined,
        sessionDuration: 12,
        source: 'ai',
        isFavorite: true,
      });
    });

    it('sayım 0 yazımı tamamlanmış mevcut kaydı ezmez (M-04) ve hiçbir şey yazmaz', async () => {
      const existing = { _id: 'e', isCompleted: true, count: 10 };
      logModel.findOne.mockReturnValue(exec(existing));
      await expect(
        svc.create({ ...base, dhikrId: DHIKR, count: 0 }),
      ).resolves.toBe(existing);
      expect(logModel.findOneAndUpdate).not.toHaveBeenCalled();
    });

    it('sayım > 0 → 0 düşüşünde seri yeniden hesaplanır; günde zaten sayımlı log varsa hesaplanmaz', async () => {
      logModel.exists.mockResolvedValue({ _id: 'x' });
      await svc.create({ ...base, dhikrId: DHIKR });
      expect(streaks.recalculateForUser).not.toHaveBeenCalled();
      logModel.findOne.mockReturnValue(exec({ count: 4, isCompleted: false }));
      await svc.create({ ...base, dhikrId: DHIKR, count: 0 });
      expect(streaks.recalculateForUser).toHaveBeenCalledTimes(1);
    });

    it('seri hesaplama Error olmayan bir değerle patlasa da yazım başarılı döner', async () => {
      streaks.recalculateForUser.mockRejectedValue('düz metin');
      await expect(svc.create({ ...base, dhikrId: DHIKR })).resolves.toEqual({
        _id: 'l',
      });
      streaks.recalculateForUser.mockRejectedValue(new Error('x'));
      await expect(
        svc.create({ ...base, dhikrId: DHIKR }),
      ).resolves.toBeDefined();
    });

    it('vird ve halka ilerleme hataları (Error olmayan) yazımı bozmaz', async () => {
      vird.applyLogWrite.mockRejectedValue('v');
      circles.assertCanContribute.mockResolvedValue(undefined);
      circles.applyProgress.mockRejectedValue('c');
      const circleId = new Types.ObjectId().toString();
      await expect(
        svc.create({ ...base, dhikrId: DHIKR, circleId }),
      ).resolves.toEqual({ _id: 'l' });
      const virdId = new Types.ObjectId().toString();
      await expect(
        svc.create({
          ...base,
          dhikrId: DHIKR,
          virdProgramId: virdId,
          virdSlot: 'morning',
        } as never),
      ).resolves.toBeDefined();
    });

    it('vird alanı yalnız programId ile (slot yok) gelirse sade log sayılır', async () => {
      await svc.create({
        ...base,
        dhikrId: DHIKR,
        virdProgramId: new Types.ObjectId().toString(),
      });
      const [filter] = logModel.findOneAndUpdate.mock.calls[0] as [
        Record<string, unknown>,
      ];
      expect(filter.virdProgramId).toEqual({ $exists: false });
      expect(vird.applyLogWrite).not.toHaveBeenCalled();
    });

    it('vird logu virdDayIndex ve prayerIndex taşır', async () => {
      await svc.create({
        ...base,
        dhikrId: DHIKR,
        virdProgramId: new Types.ObjectId().toString(),
        virdSlot: 'prayer',
        virdPrayerIndex: 2,
        virdDayIndex: 3,
      } as never);
      const [filter, update] = logModel.findOneAndUpdate.mock.calls[0] as [
        Record<string, unknown>,
        { $set: Record<string, unknown> },
      ];
      expect(filter.virdPrayerIndex).toBe(2);
      expect(update.$set.virdDayIndex).toBe(3);
    });
  });

  describe('createBulk', () => {
    const item = (over: Record<string, unknown> = {}) => ({
      userId: USER,
      dhikrId: DHIKR,
      count: 3,
      targetCount: 10,
      date: '2026-09-17',
      ...over,
    });
    beforeEach(() => {
      logModel.find.mockReturnValue(exec([]));
      logModel.bulkWrite.mockResolvedValue({ upsertedCount: 1 });
    });

    it('dhikrId eksik item → 400', async () => {
      await expect(
        svc.createBulk({ items: [item({ dhikrId: '' })] }),
      ).rejects.toThrow('dhikrId zorunludur');
    });

    it('tamamlanmış kayda 0 yazımı atlanır; hiç op kalmazsa bulkWrite çağrılmaz', async () => {
      logModel.findOne.mockReturnValue(exec({ isCompleted: true }));
      const res = await svc.createBulk({
        items: [item({ count: 0 })],
      });
      expect(logModel.bulkWrite).not.toHaveBeenCalled();
      expect(res.insertedCount).toBe(0);
    });

    it('vird itemları: aynı (kullanıcı, program, gün) için ilerleme bir kez türetilir; virdDayIndex yazılır', async () => {
      dhikrModel.countDocuments.mockResolvedValue(2);
      const program = new Types.ObjectId().toString();
      const v = {
        virdProgramId: program,
        virdSlot: 'morning',
        virdDayIndex: 2,
      };
      await svc.createBulk({
        items: [
          item(v),
          item({ ...v, dhikrId: new Types.ObjectId().toString() }),
          item({ date: '2026-09-16' }),
        ],
      });
      expect(vird.applyLogWrite).toHaveBeenCalledTimes(1);
      const [ops] = logModel.bulkWrite.mock.calls[0] as [
        { updateOne: { update: { $set: Record<string, unknown> } } }[],
      ];
      expect(ops[0].updateOne.update.$set.virdDayIndex).toBe(2);
    });

    it('bulk tekrar turunda da E11000 sürerse hata fırlar; tuhaf writeErrors biçimleri okunur', async () => {
      const dup = Object.assign(new Error('bulk'), {
        writeErrors: { err: { index: 0, code: 11000 } },
        result: {},
      });
      logModel.bulkWrite.mockRejectedValue(dup);
      await expect(svc.createBulk({ items: [item()] })).rejects.toThrow('bulk');
      expect(logModel.bulkWrite).toHaveBeenCalledTimes(2);
    });

    it('writeErrors yoksa veya biçimsizse (index/code sayı değil) gerçek hata olarak fırlar', async () => {
      logModel.bulkWrite.mockRejectedValueOnce(new Error('ağ'));
      await expect(svc.createBulk({ items: [item()] })).rejects.toThrow('ağ');
      logModel.bulkWrite.mockRejectedValueOnce(
        Object.assign(new Error('x'), {
          writeErrors: [{ index: 'a', code: 'b' }],
        }),
      );
      await expect(svc.createBulk({ items: [item()] })).rejects.toThrow('x');
    });

    it('tekrar turu başarılı ve ilk tur sayısı yoksa 0 sayılır', async () => {
      const dup = Object.assign(new Error('bulk'), {
        writeErrors: [{ index: 0, code: 11000 }],
      });
      logModel.bulkWrite.mockRejectedValueOnce(dup).mockResolvedValueOnce({});
      const res = await svc.createBulk({ items: [item()] });
      expect(res.insertedCount).toBe(0);
    });
  });

  describe('sorgu ve toplu işlemler', () => {
    it('findAll: tarih aralığı yalnız verilen uçları uygular', async () => {
      logModel.find.mockReturnValue(exec([]));
      await svc.findAll({
        userId: USER,
        dhikrId: DHIKR,
        dateFrom: '2026-01-01',
      });
      let [f] = logModel.find.mock.calls[0] as [Record<string, unknown>];
      expect(f.date).toEqual({ $gte: '2026-01-01' });
      expect(f.dhikrId).toEqual(new Types.ObjectId(DHIKR));
      await svc.findAll({ dateTo: '2026-02-01' });
      [f] = logModel.find.mock.calls[1] as [Record<string, unknown>];
      expect(f).toEqual({ date: { $lte: '2026-02-01' } });
      await svc.findAll({});
      expect(logModel.find.mock.calls[2] as unknown[]).toEqual([{}]);
    });

    it('findById: sahiplik filtresi ve 404', async () => {
      await expect(svc.findById(DHIKR, USER)).rejects.toThrow(
        NotFoundException,
      );
      expect(
        (logModel.findOne.mock.calls[0] as [Record<string, unknown>])[0].userId,
      ).toEqual(new Types.ObjectId(USER));
      logModel.findOne.mockReturnValue(exec({ _id: 1 }));
      await expect(svc.findById(DHIKR)).resolves.toEqual({ _id: 1 });
    });

    it('removeByDhikr / setFavoriteByDhikr: customDhikrId kırpılır, ikisi de yoksa 400, sayaçlar yoksa 0', async () => {
      logModel.deleteMany.mockReturnValue(exec({}));
      await expect(
        svc.removeByDhikr(USER, { customDhikrId: ' c ' }),
      ).resolves.toEqual({ deleted: true, deletedCount: 0 });
      expect(logModel.deleteMany).toHaveBeenCalledWith({
        userId: new Types.ObjectId(USER),
        customDhikrId: 'c',
      });
      await expect(svc.removeByDhikr(USER, {})).rejects.toThrow(
        BadRequestException,
      );

      logModel.updateMany.mockReturnValue(exec({}));
      await expect(
        svc.setFavoriteByDhikr(USER, {
          customDhikrId: ' c ',
          isFavorite: true,
        }),
      ).resolves.toEqual({
        updated: true,
        matchedCount: 0,
        modifiedCount: 0,
        isFavorite: true,
      });
      await svc.setFavoriteByDhikr(USER, {
        dhikrId: DHIKR,
        isFavorite: false,
      });
      expect(
        (logModel.updateMany.mock.calls[1] as [Record<string, unknown>])[0]
          .dhikrId,
      ).toEqual(new Types.ObjectId(DHIKR));
      await expect(
        svc.setFavoriteByDhikr(USER, { isFavorite: true }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  it('upsert E11000 dışı hata aynen fırlar; DuplicateKey codeName ile tekrar denenir', async () => {
    logModel.findOneAndUpdate
      .mockReturnValueOnce({
        lean: () => ({
          exec: () =>
            Promise.reject(
              Object.assign(new Error('d'), { codeName: 'DuplicateKey' }),
            ),
        }),
      })
      .mockReturnValueOnce(exec({ _id: 'ok' }));
    await expect(svc.create({ ...base, dhikrId: DHIKR })).resolves.toEqual({
      _id: 'ok',
    });
    logModel.findOneAndUpdate.mockReturnValueOnce({
      lean: () => ({ exec: () => Promise.reject(new TypeError('str')) }),
    });
    await expect(svc.create({ ...base, dhikrId: DHIKR })).rejects.toThrow(
      'str',
    );
  });
});
