import { Types } from 'mongoose';
import { completeExpiredJourneys } from './complete-expired-journeys';

describe('completeExpiredJourneys', () => {
  it('updates active journeys whose endDate is before today to completed', async () => {
    const exec = jest.fn().mockResolvedValue({});
    const updateMany = jest.fn().mockReturnValue({ exec });
    const model = { updateMany } as never;
    const userId = new Types.ObjectId();

    await completeExpiredJourneys(model, userId, '2026-06-10');

    expect(updateMany).toHaveBeenCalledWith(
      {
        userId,
        status: 'active',
        kind: 'journey',
        endDate: { $lt: '2026-06-10' },
      },
      { $set: { status: 'completed' } },
    );
    expect(exec).toHaveBeenCalled();
  });

  it('uses $lt (strictly before), so a journey ending exactly today is NOT completed yet', async () => {
    const exec = jest.fn().mockResolvedValue({});
    const updateMany = jest.fn().mockReturnValue({ exec });
    const model = { updateMany } as never;
    const userId = new Types.ObjectId();

    await completeExpiredJourneys(model, userId, '2026-06-10');

    const [filter] = updateMany.mock.calls[0] as [Record<string, unknown>];
    expect(filter.endDate).toEqual({ $lt: '2026-06-10' });
    expect(filter.endDate).not.toEqual({ $lte: '2026-06-10' });
  });

  it('is idempotent: calling it twice issues the exact same filter both times', async () => {
    const exec = jest.fn().mockResolvedValue({});
    const updateMany = jest.fn().mockReturnValue({ exec });
    const model = { updateMany } as never;
    const userId = new Types.ObjectId();

    await completeExpiredJourneys(model, userId, '2026-06-10');
    await completeExpiredJourneys(model, userId, '2026-06-10');

    expect(updateMany).toHaveBeenCalledTimes(2);
    expect(updateMany.mock.calls[0]).toEqual(updateMany.mock.calls[1]);
  });
});
