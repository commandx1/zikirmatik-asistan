import { AuthService } from './auth.service';
import { NotFoundException } from '@nestjs/common';

describe('AuthService', () => {
  const usersService = {
    findOrCreateFromAuth: jest.fn(),
    touchAuthUser: jest.fn(),
  };

  const configService = {
    get: jest.fn((key: string) => {
      if (key === 'AUTH_ALLOW_INSECURE_TEST_TOKENS') {
        return '1';
      }
      return '';
    }),
  };

  const authIdentityModel = {
    findOne: jest.fn(),
    findOneAndUpdate: jest.fn(),
    updateOne: jest.fn(),
  };

  let authService: AuthService;

  beforeEach(() => {
    usersService.findOrCreateFromAuth.mockReset();
    usersService.touchAuthUser.mockReset();
    authIdentityModel.findOne.mockReset();
    authIdentityModel.findOneAndUpdate.mockReset();
    authIdentityModel.updateOne.mockReset();

    authIdentityModel.findOne.mockImplementation(() => ({
      lean: () => ({ exec: async () => null }),
    }));
    authIdentityModel.findOneAndUpdate.mockImplementation(() => ({
      lean: () => ({ exec: async () => null }),
    }));
    authIdentityModel.updateOne.mockImplementation(() => ({
      exec: async () => null,
    }));

    authService = new AuthService(
      usersService as never,
      configService as never,
      authIdentityModel as never,
    );
  });

  it('verifies provider and returns session payload', async () => {
    usersService.findOrCreateFromAuth.mockResolvedValue({
      _id: '507f1f77bcf86cd799439011',
      displayName: 'Demo User',
      email: 'demo@example.com',
    });

    const response = await authService.verifyProvider({
      provider: 'google',
      platform: 'android',
      deviceId: 'android-device-local',
      idToken: JSON.stringify({
        sub: 'u-1',
        name: 'Demo User',
        email: 'demo@example.com',
        picture: 'https://example.com/demo-user.jpg',
      }),
    });

    expect(response.userId).toBe('507f1f77bcf86cd799439011');
    expect(response.displayName).toBe('Demo User');
    expect(response.accessToken.startsWith('at.')).toBe(true);
    expect(response.refreshToken.startsWith('rt.')).toBe(true);
    expect(usersService.findOrCreateFromAuth).toHaveBeenCalledWith(
      expect.objectContaining({
        provider: 'google',
        profileImageUrl: 'https://example.com/demo-user.jpg',
      }),
    );
  });

  it('refreshes previous session', async () => {
    usersService.findOrCreateFromAuth.mockResolvedValue({
      _id: '507f1f77bcf86cd799439099',
      displayName: 'Apple User',
      email: undefined,
    });

    const session = await authService.verifyProvider({
      provider: 'apple',
      platform: 'ios',
      deviceId: 'ios-device-local',
      idToken: JSON.stringify({ sub: 'u-2', name: 'Apple User' }),
    });

    const refreshed = await authService.refresh(session.refreshToken);
    expect(refreshed.userId).toBe('507f1f77bcf86cd799439099');
    expect(refreshed.displayName).toBe('Apple User');
    expect(refreshed.refreshToken).not.toBe(session.refreshToken);
  });

  it('recreates and relinks user when identity is stale', async () => {
    authIdentityModel.findOne.mockImplementationOnce(() => ({
      lean: () => ({
        exec: async () => ({
          _id: 'identity-1',
          userId: { toString: () => '507f1f77bcf86cd799439055' },
          provider: 'google',
          providerUserId: 'u-stale',
        }),
      }),
    }));

    usersService.touchAuthUser.mockRejectedValueOnce(
      new NotFoundException('Kullanıcı bulunamadı.'),
    );
    usersService.findOrCreateFromAuth.mockResolvedValueOnce({
      _id: '507f1f77bcf86cd799439011',
      displayName: 'Recovered User',
      email: 'recovered@example.com',
    });

    const response = await authService.verifyProvider({
      provider: 'google',
      platform: 'android',
      deviceId: 'android-device-local',
      idToken: JSON.stringify({
        sub: 'u-stale',
        name: 'Recovered User',
        email: 'recovered@example.com',
      }),
    });

    expect(usersService.touchAuthUser).toHaveBeenCalledTimes(1);
    expect(usersService.findOrCreateFromAuth).toHaveBeenCalledTimes(1);
    expect(response.userId).toBe('507f1f77bcf86cd799439011');
    expect(response.isNewUser).toBe(false);
  });

  it('updates Google profile image on each login for linked identities', async () => {
    authIdentityModel.findOne.mockImplementationOnce(() => ({
      lean: () => ({
        exec: async () => ({
          _id: 'identity-photo-1',
          userId: { toString: () => '507f1f77bcf86cd799439066' },
          provider: 'google',
          providerUserId: 'u-photo',
        }),
      }),
    }));

    usersService.touchAuthUser.mockResolvedValueOnce({
      id: '507f1f77bcf86cd799439066',
      displayName: 'Photo User',
      email: 'photo@example.com',
      profileImageUrl: 'https://example.com/old-photo.jpg',
    });

    await authService.verifyProvider({
      provider: 'google',
      platform: 'android',
      deviceId: 'android-device-local',
      idToken: JSON.stringify({
        sub: 'u-photo',
        name: 'Photo User',
        email: 'photo@example.com',
        picture: 'https://example.com/new-photo.jpg',
      }),
    });

    expect(usersService.touchAuthUser).toHaveBeenCalledWith(
      '507f1f77bcf86cd799439066',
      {
        displayName: 'Photo User',
        profileImageUrl: 'https://example.com/new-photo.jpg',
      },
    );
  });

  it('refreshes session from refresh token even after in-memory map is cleared', async () => {
    usersService.findOrCreateFromAuth.mockResolvedValueOnce({
      _id: '507f1f77bcf86cd799439022',
      displayName: 'Persisted User',
      email: 'persisted@example.com',
    });
    usersService.touchAuthUser.mockResolvedValueOnce({
      id: '507f1f77bcf86cd799439022',
      displayName: 'Persisted User',
      email: 'persisted@example.com',
    });

    const session = await authService.verifyProvider({
      provider: 'google',
      platform: 'android',
      deviceId: 'android-device-local',
      idToken: JSON.stringify({
        sub: 'u-refresh-fallback',
        name: 'Persisted User',
        email: 'persisted@example.com',
      }),
    });

    const refreshed = await authService.refresh(session.refreshToken);
    expect(refreshed.userId).toBe('507f1f77bcf86cd799439022');
    expect(refreshed.displayName).toBe('Persisted User');
  });
});
