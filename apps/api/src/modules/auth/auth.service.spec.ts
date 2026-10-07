import { AuthService } from './auth.service';
import {
  BadRequestException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';

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

  const devicesService = {
    linkUser: jest.fn(),
  };

  // Minimal bellek içi auth_refresh_tokens (eşitlik filtresi; null = alan yok).
  type Row = Record<string, unknown>;
  let rows: Row[] = [];
  const matches = (row: Row, filter: Row) =>
    Object.entries(filter).every(([k, v]) =>
      v === null ? row[k] == null : `${row[k] as string}` === `${v as string}`,
    );
  const q = <T>(value: T) => ({
    lean: () => ({ exec: () => value }),
    exec: () => value,
  });
  const refreshTokenModel = {
    create: jest.fn((doc: Row) => {
      if (rows.some((r) => r.tokenHash === doc.tokenHash)) {
        throw Object.assign(new Error('E11000'), { code: 11000 });
      }
      const row = { usedAt: null, revokedAt: null, ...doc };
      rows.push(row);
      return { ...row, toObject: () => ({ ...row }) };
    }),
    exists: jest.fn((f: Row) => q(rows.some((r) => matches(r, f)) || null)),
    findOne: jest.fn((f: Row) => q(rows.find((r) => matches(r, f)) ?? null)),
    findOneAndUpdate: jest.fn((f: Row, u: { $set: Row }) => {
      const row = rows.find((r) => matches(r, f));
      if (row) Object.assign(row, u.$set);
      return q(row ? { ...row } : null);
    }),
    updateOne: jest.fn(
      (
        f: Row,
        u: { $set?: Row; $setOnInsert?: Row },
        o?: { upsert?: boolean },
      ) => {
        const row = rows.find((r) => matches(r, f));
        if (row && u.$set) Object.assign(row, u.$set);
        if (!row && o?.upsert) rows.push({ ...f, ...u.$setOnInsert });
        return q(null);
      },
    ),
    updateMany: jest.fn((f: Row, u: { $set: Row }) => {
      rows
        .filter((r) => matches(r, f))
        .forEach((r) => Object.assign(r, u.$set));
      return q(null);
    }),
  };

  let authService: AuthService;

  beforeEach(() => {
    usersService.findOrCreateFromAuth.mockReset();
    usersService.touchAuthUser.mockReset();
    authIdentityModel.findOne.mockReset();
    authIdentityModel.findOneAndUpdate.mockReset();
    authIdentityModel.updateOne.mockReset();
    devicesService.linkUser.mockReset();
    devicesService.linkUser.mockResolvedValue(null);

    authIdentityModel.findOne.mockImplementation(() => ({
      lean: () => ({ exec: () => null }),
    }));
    authIdentityModel.findOneAndUpdate.mockImplementation(() => ({
      lean: () => ({ exec: () => null }),
    }));
    authIdentityModel.updateOne.mockImplementation(() => ({
      exec: () => null,
    }));

    rows = [];
    authService = new AuthService(
      usersService as never,
      configService as never,
      devicesService as never,
      authIdentityModel as never,
      refreshTokenModel as never,
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
    expect(response.accessToken.split('.')).toHaveLength(3);
    expect(response.refreshToken.startsWith('rt.')).toBe(true);
    expect(usersService.findOrCreateFromAuth).toHaveBeenCalledWith(
      expect.objectContaining({
        provider: 'google',
        profileImageUrl: 'https://example.com/demo-user.jpg',
      }),
    );
    expect(devicesService.linkUser).toHaveBeenCalledWith(
      'android-device-local',
      '507f1f77bcf86cd799439011',
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
    // Refresh her zaman kullanıcının hâlâ var olduğunu doğrular (B14).
    usersService.touchAuthUser.mockResolvedValueOnce({
      id: '507f1f77bcf86cd799439099',
      displayName: 'Apple User',
    });

    const refreshed = await authService.refresh(session.refreshToken);
    expect(refreshed.userId).toBe('507f1f77bcf86cd799439099');
    expect(refreshed.displayName).toBe('Apple User');
    expect(refreshed.refreshToken).not.toBe(session.refreshToken);
  });

  it('recreates and relinks user when identity is stale', async () => {
    authIdentityModel.findOne.mockImplementationOnce(() => ({
      lean: () => ({
        exec: () => ({
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
        exec: () => ({
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

  it('AUTH-14: refreshes from the persisted token record (survives API restart)', async () => {
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

  it('verifies google provider on ios', async () => {
    usersService.findOrCreateFromAuth.mockResolvedValue({
      _id: '507f1f77bcf86cd799439077',
      displayName: 'Ios Google User',
      email: 'ios-google@example.com',
    });

    const response = await authService.verifyProvider({
      provider: 'google',
      platform: 'ios',
      deviceId: 'ios-device-local',
      idToken: JSON.stringify({
        sub: 'u-ios-google',
        name: 'Ios Google User',
        email: 'ios-google@example.com',
        picture: 'https://example.com/ios-google-user.jpg',
      }),
    });

    expect(response.userId).toBe('507f1f77bcf86cd799439077');
    expect(response.displayName).toBe('Ios Google User');
    expect(usersService.findOrCreateFromAuth).toHaveBeenCalledWith(
      expect.objectContaining({
        provider: 'google',
        profileImageUrl: 'https://example.com/ios-google-user.jpg',
      }),
    );
  });

  it('rejects apple provider on android', async () => {
    await expect(
      authService.verifyProvider({
        provider: 'apple',
        platform: 'android',
        deviceId: 'android-device-local',
        idToken: JSON.stringify({ sub: 'u-apple-android', name: 'Nope' }),
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects forged refresh tokens', async () => {
    await expect(
      authService.refresh(
        'rt.NTA3ZjFmNzdiY2Y4NmNkNzk5NDM5MDIyLjQxMDI0NDQ4MDAwMDAuZmFrZQ.invalid-signature',
      ),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });
  it('A-20: rotated refresh token is single-use (reuse → 401)', async () => {
    usersService.findOrCreateFromAuth.mockResolvedValueOnce({
      _id: '507f1f77bcf86cd799439033',
      displayName: 'Rot',
    });
    usersService.touchAuthUser.mockResolvedValue({
      id: '507f1f77bcf86cd799439033',
      displayName: 'Rot',
    });
    const session = await authService.verifyProvider({
      provider: 'google',
      platform: 'android',
      deviceId: 'd',
      idToken: JSON.stringify({ sub: 'u-rot' }),
    });
    const r1 = await authService.refresh(session.refreshToken);
    await authService.refresh(r1.refreshToken);
    await expect(
      authService.refresh(session.refreshToken),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    expect(rows.every((r) => r.revokedAt != null)).toBe(true);
  });

  it('AUTH-06: prod + bayrak yok → JSON test token kabul edilmez (Google doğrulamasına gider → 401)', async () => {
    const prodConfig = {
      get: jest.fn((key: string) =>
        key === 'NODE_ENV'
          ? 'production'
          : key === 'GOOGLE_CLIENT_IDS'
            ? 'client-1'
            : undefined,
      ),
    };
    const fetchSpy = jest
      .spyOn(global, 'fetch')
      .mockResolvedValue({ ok: false } as Response);
    try {
      const prodService = new AuthService(
        usersService as never,
        prodConfig as never,
        devicesService as never,
        authIdentityModel as never,
        refreshTokenModel as never,
      );
      await expect(
        prodService.verifyProvider({
          provider: 'google',
          platform: 'android',
          deviceId: 'd',
          idToken: JSON.stringify({ sub: 'attacker', email: 'x@y.z' }),
        }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
      expect(fetchSpy).toHaveBeenCalledTimes(1);
      expect(usersService.findOrCreateFromAuth).not.toHaveBeenCalled();
    } finally {
      fetchSpy.mockRestore();
    }
  });
});
