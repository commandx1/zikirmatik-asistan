import { NotFoundException } from '@nestjs/common';
import { DhikrsService } from './dhikrs.service';

describe('DhikrsService', () => {
  const dhikrModel = {
    findOne: jest.fn(),
  };

  const embeddingService = {
    buildSourceText: jest.fn(),
    sourceHash: jest.fn(),
    embed: jest.fn(),
  };

  let service: DhikrsService;

  beforeEach(() => {
    dhikrModel.findOne.mockReset();
    service = new DhikrsService(dhikrModel as never, embeddingService as never);
  });

  it('finds verified active dhikr by transliteration case-insensitively', async () => {
    const record = {
      _id: '507f1f77bcf86cd799439011',
      transliteration: 'Er-Rahmân',
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
      transliteration: /^er-rahmân$/i,
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
