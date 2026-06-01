import { Types } from 'mongoose';
import { SubscriptionsService } from './subscriptions.service';

describe('SubscriptionsService', () => {
  const subscriptionModel = {
    updateMany: jest.fn(),
    exists: jest.fn(),
  };
  const userModel = {
    exists: jest.fn(),
    findById: jest.fn(),
    updateOne: jest.fn(),
  };

  let service: SubscriptionsService;

  beforeEach(() => {
    subscriptionModel.updateMany.mockReset();
    subscriptionModel.exists.mockReset();
    userModel.exists.mockReset();
    userModel.findById.mockReset();
    userModel.updateOne.mockReset();

    subscriptionModel.updateMany.mockReturnValue({ exec: jest.fn() });
    subscriptionModel.exists.mockResolvedValue(null);
    userModel.exists.mockResolvedValue({ _id: 'user' });
    userModel.findById.mockReturnValue({
      lean: () => ({
        exec: () => ({ _id: '507f1f77bcf86cd799439011', isPremium: false }),
      }),
    });
    userModel.updateOne.mockResolvedValue({ acknowledged: true });

    service = new SubscriptionsService(
      subscriptionModel as never,
      userModel as never,
    );
  });

  it('expires active premium subscriptions when RevenueCat reports no active entitlement', async () => {
    const userId = '507f1f77bcf86cd799439011';

    const result = await service.syncPremiumForUser(userId, {
      hasActivePremiumEntitlement: false,
      provider: 'google',
    });

    expect(subscriptionModel.updateMany).toHaveBeenCalledWith(
      {
        userId: new Types.ObjectId(userId),
        plan: 'premium',
        status: 'active',
        provider: 'google',
      },
      {
        $set: {
          status: 'expired',
          endDate: expect.any(Date),
        },
      },
    );
    expect(userModel.updateOne).toHaveBeenCalledWith(
      { _id: new Types.ObjectId(userId) },
      { $set: { isPremium: false } },
    );
    expect(result).toEqual({ userId, isPremium: false });
  });
});
