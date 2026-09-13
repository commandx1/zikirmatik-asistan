import { AppController } from './app.controller';

describe('AppController', () => {
  let appController: AppController;
  const originalServerPushEnabled = process.env.SERVER_PUSH_ENABLED;

  beforeEach(() => {
    appController = new AppController();
  });

  afterEach(() => {
    if (originalServerPushEnabled === undefined) {
      delete process.env.SERVER_PUSH_ENABLED;
    } else {
      process.env.SERVER_PUSH_ENABLED = originalServerPushEnabled;
    }
  });

  describe('health', () => {
    it('should return health payload', () => {
      const result = appController.getHealth();
      expect(result.status).toBe('ok');
      expect(result.service).toBe('api');
      expect(typeof result.timestamp).toBe('string');
    });
  });

  describe('app-config', () => {
    it('returns serverPushEnabled=true when SERVER_PUSH_ENABLED=1', () => {
      process.env.SERVER_PUSH_ENABLED = '1';
      expect(appController.getAppConfig().serverPushEnabled).toBe(true);
    });

    it('returns serverPushEnabled=false when SERVER_PUSH_ENABLED is unset', () => {
      delete process.env.SERVER_PUSH_ENABLED;
      expect(appController.getAppConfig().serverPushEnabled).toBe(false);
    });

    it('returns serverPushEnabled=false for any other value (e.g. "0")', () => {
      process.env.SERVER_PUSH_ENABLED = '0';
      expect(appController.getAppConfig().serverPushEnabled).toBe(false);
    });

    it('still returns minVersion unchanged', () => {
      process.env.APP_MIN_VERSION = '42';
      expect(appController.getAppConfig().minVersion).toBe('42');
      delete process.env.APP_MIN_VERSION;
    });
  });
});
