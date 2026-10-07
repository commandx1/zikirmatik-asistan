import { generateKeyPairSync, sign } from 'node:crypto';
import { AuthService } from './auth.service';

// Sağlayıcı doğrulama sınırı: global fetch (tokeninfo / Apple JWKS) taklit edilir.
describe('AuthService sağlayıcı token doğrulama', () => {
  const env: Record<string, string> = {
    GOOGLE_CLIENT_IDS: 'good-aud, other-aud',
    APPLE_AUDIENCES: 'app.good',
    NODE_ENV: 'production',
  };
  const config = { get: (k: string) => env[k] ?? '' };
  const make = () =>
    new AuthService(
      {} as never,
      config as never,
      {} as never,
      {} as never,
      {} as never,
    );
  const verify = (svc: AuthService, provider: 'google' | 'apple', t: string) =>
    (
      svc as unknown as {
        verifyProviderToken: (p: string, t: string) => Promise<unknown>;
      }
    ).verifyProviderToken(provider, t);

  const realFetch = global.fetch;
  const fetchMock = jest.fn();
  beforeEach(() => {
    fetchMock.mockReset();
    global.fetch = fetchMock as never;
    env.GOOGLE_CLIENT_IDS = 'good-aud, other-aud';
  });
  afterAll(() => {
    global.fetch = realFetch;
  });
  const reply = (body: unknown, ok = true) =>
    fetchMock.mockResolvedValue({ ok, json: () => Promise.resolve(body) });

  const future = () => Math.floor(Date.now() / 1000) + 600;
  const goodGoogle = () => ({
    sub: 's1',
    aud: 'good-aud',
    iss: 'https://accounts.google.com',
    exp: String(future()),
  });

  describe('Google (API-AUTH-08)', () => {
    it('geçerli token kabul edilir', async () => {
      reply(goodGoogle());
      await expect(verify(make(), 'google', 'x')).resolves.toMatchObject({
        sub: 's1',
      });
    });

    it.each([
      ['aud dışı', { aud: 'evil' }],
      ['iss yanlış', { iss: 'https://evil.com' }],
      ['exp geçmiş', { exp: String(Math.floor(Date.now() / 1000) - 10) }],
    ])('%s → 401', async (_n, patch) => {
      reply({ ...goodGoogle(), ...patch });
      await expect(verify(make(), 'google', 'x')).rejects.toMatchObject({
        status: 401,
      });
    });

    it('tokeninfo 4xx → 401', async () => {
      reply({ error: 'invalid_token' }, false);
      await expect(verify(make(), 'google', 'x')).rejects.toMatchObject({
        status: 401,
      });
    });

    it('GOOGLE_CLIENT_IDS boş → 500', async () => {
      env.GOOGLE_CLIENT_IDS = '';
      await expect(verify(make(), 'google', 'x')).rejects.toMatchObject({
        status: 500,
      });
    });
  });

  describe('Apple (API-AUTH-09)', () => {
    const { privateKey, publicKey } = generateKeyPairSync('rsa', {
      modulusLength: 2048,
    });
    const other = generateKeyPairSync('rsa', { modulusLength: 2048 });
    const jwk = { ...publicKey.export({ format: 'jwk' }), kid: 'k1' };
    const b64 = (o: unknown) =>
      Buffer.from(JSON.stringify(o)).toString('base64url');
    const token = (
      claims: Record<string, unknown>,
      opts: { kid?: string; key?: typeof privateKey } = {},
    ) => {
      const h = b64({ alg: 'RS256', kid: opts.kid ?? 'k1' });
      const p = b64({
        sub: 'a1',
        aud: 'app.good',
        iss: 'https://appleid.apple.com',
        exp: future(),
        ...claims,
      });
      const sig = sign(
        'RSA-SHA256',
        Buffer.from(`${h}.${p}`),
        opts.key ?? privateKey,
      );
      return `${h}.${p}.${sig.toString('base64url')}`;
    };
    beforeEach(() => reply({ keys: [jwk] }));

    it('geçerli token kabul edilir', async () => {
      await expect(verify(make(), 'apple', token({}))).resolves.toMatchObject({
        sub: 'a1',
      });
    });

    it.each([
      ['kid bulunamaz', () => token({}, { kid: 'nope' })],
      ['imza geçersiz', () => token({}, { key: other.privateKey })],
      ['iss hatalı', () => token({ iss: 'https://evil.com' })],
      ['aud hatalı', () => token({ aud: 'evil' })],
      ['exp geçmiş', () => token({ exp: Math.floor(Date.now() / 1000) - 10 })],
    ])('%s → 401', async (_n, make1) => {
      await expect(verify(make(), 'apple', make1())).rejects.toMatchObject({
        status: 401,
      });
    });

    it('JWKS 1 saat önbellekte (ikinci doğrulamada fetch yok)', async () => {
      const svc = make();
      await verify(svc, 'apple', token({}));
      await verify(svc, 'apple', token({}));
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });
  });
});
