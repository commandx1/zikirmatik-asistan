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
    it('also deletes vird_programs and vird_day_progress documents for the user', async () => {
      const userIdToDelete = '507f1f77bcf86cd799439011';
      const deleteMany = () => ({
        deleteMany: jest.fn().mockResolvedValue({}),
      });
      const userModelForDeletion = {
        findByIdAndDelete: jest.fn().mockResolvedValue({}),
      };
      const virdProgramModel = deleteMany();
      const virdDayProgressModel = deleteMany();

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
      );

      await deletionService.deleteUserAllData(userIdToDelete);

      expect(virdProgramModel.deleteMany).toHaveBeenCalledWith({
        userId: new Types.ObjectId(userIdToDelete),
      });
      expect(virdDayProgressModel.deleteMany).toHaveBeenCalledWith({
        userId: new Types.ObjectId(userIdToDelete),
      });
      expect(userModelForDeletion.findByIdAndDelete).toHaveBeenCalledWith(
        new Types.ObjectId(userIdToDelete),
      );
    });
  });
});
