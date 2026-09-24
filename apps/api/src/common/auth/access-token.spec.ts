import { createAccessToken, verifyAccessToken } from './access-token';

describe('access-token', () => {
  const secret = 'test-secret';

  it('createAccessToken → verifyAccessToken round-trip döner (sub korunur)', () => {
    const token = createAccessToken({
      userId: '507f1f77bcf86cd799439011',
      secret,
      ttlSeconds: 3600,
    });

    const claims = verifyAccessToken({ token, secret });

    expect(claims).not.toBeNull();
    expect(claims?.sub).toBe('507f1f77bcf86cd799439011');
    expect(typeof claims?.iat).toBe('number');
    expect(typeof claims?.exp).toBe('number');
  });

  it('ttlSeconds 60 altındaysa en az 60 saniyeye yuvarlanır', () => {
    const now = Math.floor(Date.now() / 1000);
    const token = createAccessToken({
      userId: '507f1f77bcf86cd799439011',
      secret,
      ttlSeconds: 5,
    });

    const claims = verifyAccessToken({ token, secret });

    expect(claims?.exp).toBeGreaterThanOrEqual(now + 60 - 1);
  });

  it('yanlış secret ile doğrulanamaz (imza uyuşmazlığı)', () => {
    const token = createAccessToken({
      userId: '507f1f77bcf86cd799439011',
      secret,
      ttlSeconds: 3600,
    });

    expect(verifyAccessToken({ token, secret: 'other-secret' })).toBeNull();
  });

  it('bozulmuş imza segmenti ile doğrulanamaz', () => {
    const token = createAccessToken({
      userId: '507f1f77bcf86cd799439011',
      secret,
      ttlSeconds: 3600,
    });
    const [header, payload] = token.split('.');
    const tampered = `${header}.${payload}.deadbeef`;

    expect(verifyAccessToken({ token: tampered, secret })).toBeNull();
  });

  it('segment eksikse (2 parça) doğrulanamaz', () => {
    expect(verifyAccessToken({ token: 'onlyone.parttwo', secret })).toBeNull();
  });

  it('boş segmentli token doğrulanamaz', () => {
    expect(verifyAccessToken({ token: '..', secret })).toBeNull();
  });

  it('geçersiz base64url payload doğrulanamaz', () => {
    const token = createAccessToken({
      userId: '507f1f77bcf86cd799439011',
      secret,
      ttlSeconds: 3600,
    });
    const [header, , signature] = token.split('.');
    const tampered = `${header}.not-valid-json-base64!!!.${signature}`;

    expect(verifyAccessToken({ token: tampered, secret })).toBeNull();
  });

  it('süresi geçmiş token doğrulanamaz', () => {
    const nowSpy = jest.spyOn(Date, 'now').mockReturnValue(1_000_000_000);
    const token = createAccessToken({
      userId: '507f1f77bcf86cd799439011',
      secret,
      ttlSeconds: 60,
    });

    nowSpy.mockReturnValue(1_000_000_000 + 120_000);
    const claims = verifyAccessToken({ token, secret });

    nowSpy.mockRestore();
    expect(claims).toBeNull();
  });
});
