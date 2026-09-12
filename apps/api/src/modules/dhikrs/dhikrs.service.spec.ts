import { NotFoundException } from '@nestjs/common';
import { Binary } from 'mongodb';
import { DhikrsService } from './dhikrs.service';

describe('DhikrsService', () => {
  const dhikrModel = {
    findOne: jest.fn(),
  };

  const embeddingService = {
    buildSourceText: jest.fn(),
    sourceHash: jest.fn(),
    embed: jest.fn(),
    toVectorBinary: jest.fn((vector: number[]) =>
      Binary.fromFloat32Array(Float32Array.from(vector)),
    ),
    model: 'text-embedding-3-large',
  };

  let service: DhikrsService;

  beforeEach(() => {
    dhikrModel.findOne.mockReset();
    embeddingService.buildSourceText.mockReset();
    embeddingService.sourceHash.mockReset();
    embeddingService.embed.mockReset();
    service = new DhikrsService(dhikrModel as never, embeddingService as never);
  });

  it('create() writes embedding as a float32 BSON Binary (subtype 9)', async () => {
    const vector = [0.1, 0.2, 0.3, 0.4];
    embeddingService.buildSourceText.mockReturnValue('Zikir: Test');
    embeddingService.sourceHash.mockReturnValue('hash-1');
    embeddingService.embed.mockResolvedValue(vector);

    const created = {
      toObject: jest.fn().mockReturnValue({ nameArabic: 'test' }),
    };
    const createModel = {
      ...dhikrModel,
      create: jest
        .fn<Promise<typeof created>, [{ embedding: Binary }]>()
        .mockResolvedValue(created),
    };
    const createService = new DhikrsService(
      createModel as never,
      embeddingService as never,
    );

    await createService.create({ nameArabic: 'اختبار' } as never);

    const payload = createModel.create.mock.calls[0][0];
    expect(payload.embedding).toBeInstanceOf(Binary);
    expect(payload.embedding.sub_type).toBe(9);
    // BSON vector subtype 9 formatı: 1 byte dtype + 1 byte padding + N*4
    // byte float32 veri.
    expect(payload.embedding.buffer.length).toBe(2 + vector.length * 4);
  });

  it('finds verified active dhikr by transliteration case-insensitively', async () => {
    const record = {
      _id: '507f1f77bcf86cd799439011',
      transliteration: { tr: 'Er-Rahmân', en: 'Ar-Rahman' },
      isVerified: true,
      isActive: true,
    };
    dhikrModel.findOne.mockReturnValue({
      lean: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(record),
      }),
    });

    await expect(
      service.findVerifiedActiveByTransliteration(' er-rahmân '),
    ).resolves.toEqual(record);
    expect(dhikrModel.findOne).toHaveBeenCalledWith({
      $or: [
        { 'transliteration.tr': /^er-rahmân$/i },
        { 'transliteration.en': /^er-rahmân$/i },
      ],
      isVerified: true,
      isActive: true,
    });
  });

  it('throws not found when transliteration lookup has no match', async () => {
    dhikrModel.findOne.mockReturnValue({
      lean: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      }),
    });

    await expect(
      service.findVerifiedActiveByTransliteration('Bilinmeyen'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
