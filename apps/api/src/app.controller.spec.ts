import { AppController } from './app.controller';

describe('AppController', () => {
  let appController: AppController;
  const originalServerPushEnabled = process.env.SERVER_PUSH_ENABLED;

  beforeEach(() => {
    appController = new AppController({ readyState: 1 } as never);
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
      expect(result.mongo).toBe('up');
    });

    it('returns mongo=down when the connection is not ready', () => {
      const controller = new AppController({ readyState: 0 } as never);
      expect(controller.getHealth().mongo).toBe('down');
    });
  });

  describe('keepAlive', () => {
    afterEach(() => {
      delete process.env.RENDER_EXTERNAL_URL;
      jest.restoreAllMocks();
    });

    it('is a no-op without RENDER_EXTERNAL_URL and pings /health when set', async () => {
      const fetchSpy = jest
        .spyOn(global, 'fetch')
        .mockResolvedValue({} as Response);
      delete process.env.RENDER_EXTERNAL_URL;
      await appController.keepAlive();
      expect(fetchSpy).not.toHaveBeenCalled();

      process.env.RENDER_EXTERNAL_URL = 'https://x.onrender.com';
      await appController.keepAlive();
      expect(fetchSpy).toHaveBeenCalledWith(
        'https://x.onrender.com/health',
        expect.anything(),
      );
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
