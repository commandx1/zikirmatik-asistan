import { Types } from 'mongoose';
import { UsersService } from './users.service';

describe('UsersService', () => {
  const userModel = {
    exists: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    findByIdAndUpdate: jest.fn(),
  };

  let service: UsersService;

  beforeEach(() => {
    userModel.exists.mockReset();
    userModel.findOne.mockReset();
    userModel.create.mockReset();
    userModel.findByIdAndUpdate.mockReset();
    userModel.exists.mockResolvedValue(null);
    userModel.findOne.mockReturnValue({
      exec: jest.fn().mockResolvedValue(null),
    });
    userModel.create.mockImplementation((payload: unknown) => ({
      toObject: () => payload,
    }));

    const noopModel = {} as never;
    service = new UsersService(
      userModel as never,
      noopModel,
      noopModel,
      noopModel,
      noopModel,
      noopModel,
      noopModel,
      noopModel,
      noopModel,
      noopModel,
      noopModel,
      noopModel,
      noopModel,
      noopModel,
      noopModel,
      noopModel,
      noopModel,
      noopModel,
    );
  });

  it('creates new email users as non-premium by default', async () => {
    const result = await service.createUser({
      email: 'NewUser@example.com',
      displayName: 'New User',
    });

    expect(userModel.create).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'newuser@example.com',
        isPremium: false,
      }),
    );
    expect(result).toEqual(
      expect.objectContaining({
        email: 'newuser@example.com',
        isPremium: false,
      }),
    );
  });

  it('creates auth users as non-premium by default', async () => {
    await service.findOrCreateFromAuth({
      provider: 'google',
      email: 'GoogleUser@example.com',
      displayName: 'Google User',
    });

    expect(userModel.create).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'googleuser@example.com',
        isPremium: false,
      }),
    );
  });

  describe('savePreferences', () => {
    const userId = '507f1f77bcf86cd799439011';

    // findByIdAndUpdate's second argument, typed concretely so reading it
    // back out of jest's (otherwise `any`-typed) mock.calls doesn't trigger
    // @typescript-eslint/no-unsafe-assignment.
    type UpdateArg = { $set: Record<string, unknown> };

    function mockUpdateResult(updatedUser: Record<string, unknown> | null) {
      userModel.findByIdAndUpdate.mockReturnValue({
        lean: () => ({
          exec: jest.fn().mockResolvedValue(updatedUser),
        }),
      });
    }

    function getLastSetPayload(): Record<string, unknown> {
      const calls = userModel.findByIdAndUpdate.mock.calls as [
        unknown,
        UpdateArg,
        unknown,
      ][];
      return calls[calls.length - 1][1].$set;
    }

    it('merges hapticsPattern into the $set update and returns it', async () => {
      mockUpdateResult({ _id: userId, hapticsPattern: 'tesbih' });

      const result = await service.savePreferences(userId, {
        hapticsPattern: 'tesbih',
      });

      expect(getLastSetPayload()).toEqual(
        expect.objectContaining({ hapticsPattern: 'tesbih' }),
      );
      expect(result).toEqual(
        expect.objectContaining({ hapticsPattern: 'tesbih' }),
      );
    });

    it('leaves hapticsPattern out of the $set update when not provided', async () => {
      mockUpdateResult({ _id: userId, hapticsEnabled: false });

      await service.savePreferences(userId, { hapticsEnabled: false });

      const setPayload = getLastSetPayload();
      expect(setPayload).not.toHaveProperty('hapticsPattern');
      expect(setPayload).toEqual(
        expect.objectContaining({ hapticsEnabled: false }),
      );
    });

    it('keeps hapticsEnabled working independently for backward compatibility', async () => {
      mockUpdateResult({ _id: userId, hapticsEnabled: true });

      const result = await service.savePreferences(userId, {
        hapticsEnabled: true,
      });

      expect(getLastSetPayload()).toEqual(
        expect.objectContaining({ hapticsEnabled: true }),
      );
      expect(result).toEqual(expect.objectContaining({ hapticsEnabled: true }));
    });
  });

  describe('deleteUserAllData', () => {
    it('also deletes vird_programs, vird_day_progress and devices for the user', async () => {
      const userIdToDelete = '507f1f77bcf86cd799439011';
      const deleteMany = () => ({
        deleteMany: jest.fn().mockResolvedValue({}),
      });
      const userModelForDeletion = {
        findByIdAndDelete: jest.fn().mockResolvedValue({}),
      };
      const virdProgramModel = deleteMany();
      const virdDayProgressModel = deleteMany();
      const deviceModel = {
        ...deleteMany(),
        distinct: jest.fn().mockResolvedValue([]),
      };

      const deletionService = new UsersService(
        userModelForDeletion as never,
        deleteMany() as never,
        deleteMany() as never,
        deleteMany() as never,
        deleteMany() as never,
        deleteMany() as never,
        deleteMany() as never,
        virdProgramModel as never,
        virdDayProgressModel as never,
        deviceModel as never,
        deleteMany() as never,
        deleteMany() as never,
        deleteMany() as never,
        deleteMany() as never,
        deleteMany() as never,
        deleteMany() as never,
        { updateMany: jest.fn().mockResolvedValue({}) } as never,
        deleteMany() as never,
      );

      await deletionService.deleteUserAllData(userIdToDelete);

      expect(virdProgramModel.deleteMany).toHaveBeenCalledWith({
        userId: new Types.ObjectId(userIdToDelete),
      });
      expect(virdDayProgressModel.deleteMany).toHaveBeenCalledWith({
        userId: new Types.ObjectId(userIdToDelete),
      });
      expect(deviceModel.deleteMany).toHaveBeenCalledWith({
        userId: new Types.ObjectId(userIdToDelete),
      });
      expect(userModelForDeletion.findByIdAndDelete).toHaveBeenCalledWith(
        new Types.ObjectId(userIdToDelete),
      );
    });

    it('deletes AI, event and push data, pulls circle membership and deletes the user last', async () => {
      const id = '507f1f77bcf86cd799439011';
      const oid = new Types.ObjectId(id);
      const order: string[] = [];
      const dm = (name: string) => ({
        deleteMany: jest.fn().mockImplementation(() => {
          order.push(name);
          return Promise.resolve({});
        }),
      });
      const userM = {
        findByIdAndDelete: jest.fn().mockImplementation(() => {
          order.push('user');
          return Promise.resolve({});
        }),
      };
      const deviceM = {
        ...dm('device'),
        distinct: jest.fn().mockResolvedValue(['dev-1']),
      };
      const [msg, conv, ledger, wallet, usage, event, push] = [
        'msg',
        'conv',
        'ledger',
        'wallet',
        'usage',
        'event',
        'push',
      ].map(dm);
      const circle = { updateMany: jest.fn().mockResolvedValue({}) };

      const svc = new UsersService(
        userM as never,
        dm('a') as never,
        dm('b') as never,
        dm('c') as never,
        dm('d') as never,
        dm('e') as never,
        dm('f') as never,
        dm('g') as never,
        dm('h') as never,
        deviceM as never,
        msg as never,
        conv as never,
        ledger as never,
        wallet as never,
        usage as never,
        event as never,
        circle as never,
        push as never,
      );

      await svc.deleteUserAllData(id);

      for (const m of [msg, conv, ledger, wallet, usage]) {
        expect(m.deleteMany).toHaveBeenCalledWith({ userId: oid });
      }
      expect(event.deleteMany).toHaveBeenCalledWith({
        $or: [
          { userId: oid },
          { deviceId: { $in: ['dev-1'] }, userId: { $exists: false } },
        ],
      });
      expect(push.deleteMany).toHaveBeenCalledWith({
        deviceId: { $in: ['dev-1'] },
      });
      expect(circle.updateMany).toHaveBeenCalledWith(
        { memberIds: oid },
        { $pull: { memberIds: oid } },
      );
      expect(order[order.length - 1]).toBe('user');
    });
  });
});
