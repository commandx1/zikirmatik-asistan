import { Types } from 'mongoose';
import { DevicesService } from './devices.service';

describe('DevicesService', () => {
  const deviceModel = {
    findOneAndUpdate: jest.fn(),
    find: jest.fn(),
    updateMany: jest.fn(),
  };

  let service: DevicesService;
  const userId = new Types.ObjectId().toHexString();

  beforeEach(() => {
    deviceModel.findOneAndUpdate.mockReset();
    deviceModel.find.mockReset();
    deviceModel.updateMany.mockReset();

    deviceModel.findOneAndUpdate.mockReturnValue({
      lean: () => ({
        exec: jest.fn().mockResolvedValue({ deviceId: 'device-1' }),
      }),
    });
    deviceModel.find.mockReturnValue({
      lean: () => ({ exec: jest.fn().mockResolvedValue([]) }),
    });
    deviceModel.updateMany.mockReturnValue({
      exec: jest.fn().mockResolvedValue({ modifiedCount: 1 }),
    });

    service = new DevicesService(deviceModel as never);
  });

  it('upserts a device by deviceId on register', async () => {
    await service.register({
      deviceId: 'device-1',
      expoPushToken: 'ExponentPushToken[abc]',
      platform: 'ios',
    });

    const updatePayload = getRegisterUpdatePayload();
    expect(updatePayload.$set).toMatchObject({
      platform: 'ios',
      expoPushToken: 'ExponentPushToken[abc]',
      isActive: true,
    });
    expect(deviceModel.findOneAndUpdate).toHaveBeenCalledWith(
      { deviceId: 'device-1' },
      expect.anything(),
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
  });

  it('links the caller userId when register carries a valid auth token', async () => {
    await service.register(
      { deviceId: 'device-1', platform: 'android' },
      userId,
    );

    const updatePayload = getRegisterUpdatePayload();
    expect(updatePayload.$set.userId).toEqual(new Types.ObjectId(userId));
  });

  it('does not set userId when register is called without auth (guest)', async () => {
    await service.register({ deviceId: 'device-1', platform: 'android' });

    const updatePayload = getRegisterUpdatePayload();
    expect(updatePayload.$set.userId).toBeUndefined();
  });

  it('links a device to a user on login', async () => {
    await service.linkUser('device-1', userId);

    expect(deviceModel.findOneAndUpdate).toHaveBeenCalledWith(
      { deviceId: 'device-1' },
      expect.anything(),
      { new: true },
    );

    const calls = deviceModel.findOneAndUpdate.mock.calls as unknown[][];
    const [, updatePayload] = calls[0] ?? [];
    const set = (updatePayload as { $set: Record<string, unknown> }).$set;
    expect(set.userId).toEqual(new Types.ObjectId(userId));
    expect(set.lastSeenAt).toBeInstanceOf(Date);
  });

  it('unlinks a device from its user on logout without deleting it', async () => {
    await service.unlinkUser('device-1');

    expect(deviceModel.findOneAndUpdate).toHaveBeenCalledWith(
      { deviceId: 'device-1' },
      { $set: { userId: null } },
      { new: true },
    );
  });

  it('finds active devices with a pref enabled and a push token present', async () => {
    await service.findActiveByPref('friday');

    expect(deviceModel.find).toHaveBeenCalledWith({
      isActive: true,
      'prefs.friday': true,
      expoPushToken: { $exists: true, $nin: [null, ''] },
    });
  });

  it('deactivates devices by id and clears their push token', async () => {
    const result = await service.deactivateByIds(['device-1', 'device-2']);

    expect(deviceModel.updateMany).toHaveBeenCalledWith(
      { deviceId: { $in: ['device-1', 'device-2'] } },
      { $set: { isActive: false }, $unset: { expoPushToken: '' } },
    );
    expect(result).toEqual({ modifiedCount: 1 });
  });

  it('skips the update call when deactivating an empty id list', async () => {
    const result = await service.deactivateByIds([]);

    expect(deviceModel.updateMany).not.toHaveBeenCalled();
    expect(result).toEqual({ modifiedCount: 0 });
  });

  function getRegisterUpdatePayload() {
    const calls = deviceModel.findOneAndUpdate.mock.calls as unknown[][];
    const [, updatePayload] = calls[0] ?? [];
    return updatePayload as { $set: Record<string, unknown> };
  }
});
