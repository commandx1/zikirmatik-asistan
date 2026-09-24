import { NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';
import { UserDhikrsService } from './user-dhikrs.service';

describe('UserDhikrsService', () => {
  const userDhikrModel = {
    findOneAndUpdate: jest.fn(),
    find: jest.fn(),
    findOneAndDelete: jest.fn(),
  };

  const userId = new Types.ObjectId().toHexString();

  let service: UserDhikrsService;

  function leanExec(value: unknown) {
    return { lean: () => ({ exec: jest.fn().mockResolvedValue(value) }) };
  }

  beforeEach(() => {
    Object.values(userDhikrModel).forEach((fn) => fn.mockReset());
    service = new UserDhikrsService(userDhikrModel as never);
  });

  describe('createOrUpdate', () => {
    it('geçersiz userId için NotFoundException fırlatır', async () => {
      await expect(
        service.createOrUpdate('not-an-object-id', {}),
      ).rejects.toThrow(NotFoundException);
    });

    it('clientId verilmişse trim edilip kullanılır, upsert:true ile çağrılır', async () => {
      userDhikrModel.findOneAndUpdate.mockReturnValue(
        leanExec({ clientId: 'my-id' }),
      );

      await service.createOrUpdate(userId, {
        clientId: '  my-id  ',
        name: 'Zikrim',
      });

      const [filter, update, options] = userDhikrModel.findOneAndUpdate.mock
        .calls[0] as [
        { userId: Types.ObjectId; clientId: string },
        { $set: { name: string } },
        { upsert: boolean },
      ];
      expect(filter).toEqual({
        userId: expect.any(Types.ObjectId) as Types.ObjectId,
        clientId: 'my-id',
      });
      expect(update.$set.name).toBe('Zikrim');
      expect(options.upsert).toBe(true);
    });

    it("clientId verilmezse 'auto-' önekiyle üretilir", async () => {
      userDhikrModel.findOneAndUpdate.mockReturnValue(
        leanExec({ clientId: 'auto-x' }),
      );

      await service.createOrUpdate(userId, { name: 'Zikrim' });

      const [filter] = userDhikrModel.findOneAndUpdate.mock.calls[0] as [
        { clientId: string },
      ];
      expect(filter.clientId).toMatch(/^auto-/);
    });

    it("name verilmezse buildNextAutoTitle ile 'Başlık N' üretilir (mevcut başlıklardan max+1)", async () => {
      userDhikrModel.find.mockReturnValue(
        leanExec([
          { name: 'Başlık 1' },
          { name: 'Başlık 3' },
          { name: 'Özel' },
        ]),
      );
      userDhikrModel.findOneAndUpdate.mockReturnValue(leanExec({}));

      await service.createOrUpdate(userId, {});

      const [, update] = userDhikrModel.findOneAndUpdate.mock.calls[0] as [
        unknown,
        { $set: { name: string } },
      ];
      expect(update.$set.name).toBe('Başlık 4');
    });
  });

  describe('findAll', () => {
    it('geçersiz userId için NotFoundException fırlatır', async () => {
      await expect(service.findAll('bad-id')).rejects.toThrow(
        NotFoundException,
      );
    });

    it("userId'ye ait kayıtları updatedAt/createdAt desc sıralı döner", async () => {
      userDhikrModel.find.mockReturnValue({
        sort: () => leanExec([{ clientId: 'a' }]),
      });

      const result = await service.findAll(userId);

      expect(result).toEqual([{ clientId: 'a' }]);
    });
  });

  describe('updateByClientId', () => {
    it('kayıt bulunamazsa NotFoundException fırlatır', async () => {
      userDhikrModel.findOneAndUpdate.mockReturnValue(leanExec(null));

      await expect(
        service.updateByClientId(userId, 'clientA', {}),
      ).rejects.toThrow(NotFoundException);
    });

    it('yalnızca payload’da tanımlı alanlar $set edilir', async () => {
      userDhikrModel.findOneAndUpdate.mockReturnValue(
        leanExec({ clientId: 'clientA' }),
      );

      await service.updateByClientId(userId, 'clientA', { name: 'Yeni ad' });

      const [, update] = userDhikrModel.findOneAndUpdate.mock.calls[0] as [
        unknown,
        { $set: Record<string, unknown> },
      ];
      expect(update.$set).toEqual({ name: 'Yeni ad' });
    });
  });

  describe('removeByClientId', () => {
    it('kayıt bulunamazsa NotFoundException fırlatır', async () => {
      userDhikrModel.findOneAndDelete.mockReturnValue(leanExec(null));

      await expect(service.removeByClientId(userId, 'clientA')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('bulunursa { deleted: true, clientId } döner', async () => {
      userDhikrModel.findOneAndDelete.mockReturnValue(
        leanExec({ clientId: 'clientA' }),
      );

      const result = await service.removeByClientId(userId, 'clientA');

      expect(result).toEqual({ deleted: true, clientId: 'clientA' });
    });
  });
});
