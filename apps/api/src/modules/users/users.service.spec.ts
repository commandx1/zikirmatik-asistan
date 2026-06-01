import { UsersService } from './users.service';

describe('UsersService', () => {
  const userModel = {
    exists: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
  };

  let service: UsersService;

  beforeEach(() => {
    userModel.exists.mockReset();
    userModel.findOne.mockReset();
    userModel.create.mockReset();
    userModel.exists.mockResolvedValue(null);
    userModel.findOne.mockReturnValue({
      exec: jest.fn().mockResolvedValue(null),
    });
    userModel.create.mockImplementation((payload: unknown) => ({
      toObject: () => payload,
    }));

    service = new UsersService(userModel as never);
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
});
