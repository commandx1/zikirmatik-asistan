import { NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';
import { DhikrCollectionsService } from './dhikr-collections.service';

describe('DhikrCollectionsService', () => {
  const collectionModel = { find: jest.fn(), findOne: jest.fn() };
  const dhikrModel = { find: jest.fn() };

  let service: DhikrCollectionsService;

  function chain(value: unknown) {
    return {
      sort: () => ({
        lean: () => ({ exec: jest.fn().mockResolvedValue(value) }),
      }),
      lean: () => ({ exec: jest.fn().mockResolvedValue(value) }),
    };
  }

  beforeEach(() => {
    collectionModel.find.mockReset();
    collectionModel.findOne.mockReset();
    dhikrModel.find.mockReset();
    service = new DhikrCollectionsService(
      collectionModel as never,
      dhikrModel as never,
    );
  });

  describe('findAll', () => {
    it('isActive:true filtresiyle sorgular, category verilmezse eklenmez', async () => {
      collectionModel.find.mockReturnValue(chain([]));

      await service.findAll({});

      expect(collectionModel.find).toHaveBeenCalledWith(
        { isActive: true },
        expect.any(Object),
      );
    });

    it('category verilirse filtreye eklenir', async () => {
      collectionModel.find.mockReturnValue(chain([]));

      await service.findAll({ category: 'ramazan' });

      expect(collectionModel.find).toHaveBeenCalledWith(
        { isActive: true, category: 'ramazan' },
        expect.any(Object),
      );
    });

    it('bulunan koleksiyonları döner', async () => {
      const rows = [{ key: 'sabah' }, { key: 'aksam' }];
      collectionModel.find.mockReturnValue(chain(rows));

      const result = await service.findAll({});

      expect(result).toEqual(rows);
    });
  });

  describe('getDetail', () => {
    it('koleksiyon bulunamazsa NotFoundException fırlatır', async () => {
      collectionModel.findOne.mockReturnValue(chain(null));

      await expect(service.getDetail('yok')).rejects.toThrow(NotFoundException);
    });

    it('koleksiyon bulunursa isActive:true filtresiyle findOne çağrılır', async () => {
      collectionModel.findOne.mockReturnValue(chain(null));

      await expect(service.getDetail('sabah')).rejects.toThrow(
        NotFoundException,
      );
      expect(collectionModel.findOne).toHaveBeenCalledWith({
        key: 'sabah',
        isActive: true,
      });
    });

    it('dhikrIds sırasını (seed sırası) korur, $in sırasını değil', async () => {
      const id1 = new Types.ObjectId();
      const id2 = new Types.ObjectId();
      const id3 = new Types.ObjectId();
      collectionModel.findOne.mockReturnValue(
        chain({ key: 'sabah', dhikrIds: [id1, id2, id3] }),
      );
      // dhikrModel.find $in sonucu farklı sırada dönebilir
      dhikrModel.find.mockReturnValue(
        chain([{ _id: id3 }, { _id: id1 }, { _id: id2 }]),
      );

      const result = await service.getDetail('sabah');

      expect(result.dhikrs.map((d: { _id: Types.ObjectId }) => d._id)).toEqual([
        id1,
        id2,
        id3,
      ]);
    });
  });
});
