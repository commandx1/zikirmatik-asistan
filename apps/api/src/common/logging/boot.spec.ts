import { bootChecks } from './boot';

// API-APP-09: prod'da güvensiz yapılandırma süreci durdurmaz, alarm üretir.
describe('bootChecks', () => {
  const saved = { ...process.env };
  afterEach(() => {
    process.env = { ...saved };
  });
  const run = () => {
    const logger = { error: jest.fn() };
    expect(() => bootChecks(logger as never)).not.toThrow();
    return logger.error;
  };

  it('prod + secret eksik → boot.insecure_config alarmı, fırlatmaz', () => {
    process.env.NODE_ENV = 'production';
    delete process.env.AUTH_ACCESS_TOKEN_SECRET;
    const error = run();
    expect(error).toHaveBeenCalledWith(
      expect.objectContaining({
        event: 'boot.insecure_config',
        alert: 'boot.insecure_config',
      }),
      'Boot',
    );
  });

  it('prod + AUTH_ALLOW_INSECURE_TEST_TOKENS=1 → alarm', () => {
    Object.assign(process.env, {
      NODE_ENV: 'production',
      AUTH_ACCESS_TOKEN_SECRET: 'a',
      AUTH_REFRESH_TOKEN_SECRET: 'a',
      REVENUECAT_WEBHOOK_SECRET: 'a',
      REVENUECAT_SECRET_API_KEY: 'a',
      AUTH_ALLOW_INSECURE_TEST_TOKENS: '1',
    });
    expect(run()).toHaveBeenCalledTimes(1);
  });

  it('prod + hepsi tamam → sessiz; prod dışı → sessiz', () => {
    Object.assign(process.env, {
      NODE_ENV: 'production',
      AUTH_ACCESS_TOKEN_SECRET: 'a',
      AUTH_REFRESH_TOKEN_SECRET: 'a',
      REVENUECAT_WEBHOOK_SECRET: 'a',
      REVENUECAT_SECRET_API_KEY: 'a',
      AUTH_ALLOW_INSECURE_TEST_TOKENS: '0',
    });
    expect(run()).not.toHaveBeenCalled();
    process.env.NODE_ENV = 'test';
    expect(run()).not.toHaveBeenCalled();
  });
});
