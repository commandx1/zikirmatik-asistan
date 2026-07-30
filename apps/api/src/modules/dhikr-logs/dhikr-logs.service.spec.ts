import { DhikrLogsService } from './dhikr-logs.service';

describe('DhikrLogsService.create', () => {
  const dhikrLogModel = {
    findOne: jest.fn(),
    findOneAndUpdate: jest.fn(),
  };

  const userModel = {
    countDocuments: jest.fn(),
  };

  const dhikrModel = {
    countDocuments: jest.fn(),
  };

  const streaksService = {
    recalculateForUser: jest.fn(),
  };

  const userId = '507f1f77bcf86cd799439011';
  const dhikrId = '507f1f77bcf86cd799439012';

  let service: DhikrLogsService;

  const mockExistingLog = (existing: { isCompleted?: boolean } | null) => {
    dhikrLogModel.findOne.mockReturnValue({
      lean: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(existing),
      }),
    });
  };

  const savedIsCompleted = () => {
    const [, update] = dhikrLogModel.findOneAndUpdate.mock.calls[0] as [
      unknown,
      { $set: { isCompleted: boolean } },
    ];
    return update.$set.isCompleted;
  };

  beforeEach(() => {
    dhikrLogModel.findOne.mockReset();
    dhikrLogModel.findOneAndUpdate.mockReset();
    userModel.countDocuments.mockReset().mockResolvedValue(1);
    dhikrModel.countDocuments.mockReset().mockResolvedValue(1);
    streaksService.recalculateForUser.mockReset().mockResolvedValue(undefined);

    dhikrLogModel.findOneAndUpdate.mockReturnValue({
      lean: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue({}),
      }),
    });

    service = new DhikrLogsService(
      dhikrLogModel as never,
      userModel as never,
      dhikrModel as never,
      streaksService as never,
    );
  });

  it('stores a completed log for a first write of the day', async () => {
    mockExistingLog(null);

    await service.create({
      userId,
      dhikrId,
      count: 100,
      targetCount: 100,
      date: '2026-07-30',
      isCompleted: true,
    });

    expect(savedIsCompleted()).toBe(true);
  });

  it('keeps the day completed when a later partial session is saved', async () => {
    mockExistingLog({ isCompleted: true });

    await service.create({
      userId,
      dhikrId,
      count: 5,
      targetCount: 100,
      date: '2026-07-30',
      isCompleted: false,
    });

    // The streak for that day was already earned; a reset + partial save must
    // not revoke it.
    expect(savedIsCompleted()).toBe(true);
  });

  it('promotes an incomplete day to completed when the target is later reached', async () => {
    mockExistingLog({ isCompleted: false });

    await service.create({
      userId,
      dhikrId,
      count: 100,
      targetCount: 100,
      date: '2026-07-30',
      isCompleted: true,
    });

    expect(savedIsCompleted()).toBe(true);
  });

  it('leaves a day incomplete when neither write reached the target', async () => {
    mockExistingLog({ isCompleted: false });

    await service.create({
      userId,
      dhikrId,
      count: 12,
      targetCount: 100,
      date: '2026-07-30',
      isCompleted: false,
    });

    expect(savedIsCompleted()).toBe(false);
  });
});
