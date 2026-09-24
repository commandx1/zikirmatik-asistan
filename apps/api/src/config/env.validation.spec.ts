import { validateEnv } from './env.validation';

describe('validateEnv', () => {
  const baseConfig = { MONGODB_URI: 'mongodb://localhost:27017/test' };

  it('geçerli minimal config için configi olduğu gibi döner', () => {
    expect(validateEnv({ ...baseConfig })).toEqual(baseConfig);
  });

  describe('MONGODB_URI', () => {
    it('tanımsızsa hata fırlatır', () => {
      expect(() => validateEnv({})).toThrow(/MONGODB_URI/);
    });

    it('boş string ise hata fırlatır', () => {
      expect(() => validateEnv({ MONGODB_URI: '   ' })).toThrow(/MONGODB_URI/);
    });

    it('string olmayan bir değer ise hata fırlatır', () => {
      expect(() => validateEnv({ MONGODB_URI: 123 })).toThrow(/MONGODB_URI/);
    });
  });

  describe('CAMPAIGN_TRIGGER_SECRET', () => {
    it('tanımsız bırakılabilir', () => {
      expect(() => validateEnv({ ...baseConfig })).not.toThrow();
    });

    it('boş string ise hata fırlatır', () => {
      expect(() =>
        validateEnv({ ...baseConfig, CAMPAIGN_TRIGGER_SECRET: '' }),
      ).toThrow(/CAMPAIGN_TRIGGER_SECRET/);
    });

    it('geçerli string ise geçer', () => {
      expect(() =>
        validateEnv({ ...baseConfig, CAMPAIGN_TRIGGER_SECRET: 'secret' }),
      ).not.toThrow();
    });
  });

  describe('SERVER_PUSH_ENABLED', () => {
    it("'0' veya '1' geçerlidir", () => {
      expect(() =>
        validateEnv({ ...baseConfig, SERVER_PUSH_ENABLED: '0' }),
      ).not.toThrow();
      expect(() =>
        validateEnv({ ...baseConfig, SERVER_PUSH_ENABLED: '1' }),
      ).not.toThrow();
    });

    it('boş string veya tanımsız geçerlidir', () => {
      expect(() =>
        validateEnv({ ...baseConfig, SERVER_PUSH_ENABLED: '' }),
      ).not.toThrow();
    });

    it("'true' gibi diğer değerler hata fırlatır", () => {
      expect(() =>
        validateEnv({ ...baseConfig, SERVER_PUSH_ENABLED: 'true' }),
      ).toThrow(/SERVER_PUSH_ENABLED/);
    });
  });

  describe('LOG_LEVEL', () => {
    it('geçerli seviyeler kabul edilir', () => {
      for (const level of ['error', 'warn', 'info', 'debug', 'verbose']) {
        expect(() =>
          validateEnv({ ...baseConfig, LOG_LEVEL: level }),
        ).not.toThrow();
      }
    });

    it('geçersiz seviye hata fırlatır', () => {
      expect(() => validateEnv({ ...baseConfig, LOG_LEVEL: 'trace' })).toThrow(
        /LOG_LEVEL/,
      );
    });
  });

  describe('LOG_DRAIN_URL / SLACK_ALERT_WEBHOOK_URL', () => {
    it('http(s):// ile başlamayan değer hata fırlatır', () => {
      expect(() =>
        validateEnv({ ...baseConfig, LOG_DRAIN_URL: 'ftp://example.com' }),
      ).toThrow(/LOG_DRAIN_URL/);
    });

    it('http(s):// ile başlıyorsa geçerlidir (LOG_DRAIN_TOKEN ile birlikte)', () => {
      expect(() =>
        validateEnv({
          ...baseConfig,
          LOG_DRAIN_URL: 'https://logs.example.com',
          LOG_DRAIN_TOKEN: 'token',
        }),
      ).not.toThrow();
    });

    it('SLACK_ALERT_WEBHOOK_URL için de aynı kural geçerlidir', () => {
      expect(() =>
        validateEnv({
          ...baseConfig,
          SLACK_ALERT_WEBHOOK_URL: 'not-a-url',
        }),
      ).toThrow(/SLACK_ALERT_WEBHOOK_URL/);
    });
  });

  describe('LOG_DRAIN_URL + LOG_DRAIN_TOKEN bağımlılığı', () => {
    it('LOG_DRAIN_URL varken LOG_DRAIN_TOKEN yoksa hata fırlatır', () => {
      expect(() =>
        validateEnv({
          ...baseConfig,
          LOG_DRAIN_URL: 'https://logs.example.com',
        }),
      ).toThrow(/LOG_DRAIN_TOKEN/);
    });

    it('LOG_DRAIN_URL varken LOG_DRAIN_TOKEN boş string ise hata fırlatır', () => {
      expect(() =>
        validateEnv({
          ...baseConfig,
          LOG_DRAIN_URL: 'https://logs.example.com',
          LOG_DRAIN_TOKEN: '   ',
        }),
      ).toThrow(/LOG_DRAIN_TOKEN/);
    });
  });
});
