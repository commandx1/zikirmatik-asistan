import {
  AiNotConfiguredError,
  AiPipelineError,
  AiProviderError,
} from './ai-errors';
import { AiRuntimeService } from './ai-runtime.service';

describe('AiRuntimeService', () => {
  const configService = { get: jest.fn() };
  let service: AiRuntimeService;

  beforeEach(() => {
    configService.get.mockReset();
    configService.get.mockReturnValue(undefined);
    service = new AiRuntimeService(configService as never);
  });

  describe('isConfigured / provider', () => {
    it('OPENAI_API_KEY yoksa isConfigured false döner', () => {
      expect(service.isConfigured()).toBe(false);
    });

    it('provider() OPENAI_API_KEY yoksa AiNotConfiguredError fırlatır', () => {
      expect(() => service.provider()).toThrow(AiNotConfiguredError);
    });

    it('OPENAI_API_KEY varsa isConfigured true döner ve provider() tembel/tek seferlik oluşturulur', () => {
      configService.get.mockImplementation((key: string) =>
        key === 'OPENAI_API_KEY' ? 'sk-test' : undefined,
      );

      expect(service.isConfigured()).toBe(true);
      const first = service.provider();
      const second = service.provider();
      expect(first).toBe(second);
    });
  });

  describe('modelName', () => {
    it('env tanımsızsa fallback model adını döner', () => {
      expect(service.modelName('select')).toBe('gpt-5');
      expect(service.modelName('classify')).toBe('gpt-5-mini');
    });

    it('env tanımlıysa onu döner', () => {
      configService.get.mockImplementation((key: string) =>
        key === 'AI_SELECT_MODEL' ? 'custom-model' : undefined,
      );
      expect(service.modelName('select')).toBe('custom-model');
    });
  });

  describe('isReasoningModel', () => {
    it('gpt-5* (gpt-5-chat hariç) reasoning modeldir', () => {
      expect(service.isReasoningModel('gpt-5')).toBe(true);
      expect(service.isReasoningModel('gpt-5-mini')).toBe(true);
      expect(service.isReasoningModel('gpt-5-chat')).toBe(false);
      expect(service.isReasoningModel('gpt-5-chat-latest')).toBe(false);
    });

    it('o1/o3/o4 reasoning modeldir, diğerleri değildir', () => {
      expect(service.isReasoningModel('o1-mini')).toBe(true);
      expect(service.isReasoningModel('o3')).toBe(true);
      expect(service.isReasoningModel('o4-mini')).toBe(true);
      expect(service.isReasoningModel('gpt-4o')).toBe(false);
    });
  });

  describe('settings', () => {
    it('reasoning model için providerOptions.openai döner, temperature yok', () => {
      const settings = service.settings('select');
      expect(settings.providerOptions).toEqual({
        openai: { reasoningEffort: 'minimal', textVerbosity: 'low' },
      });
      expect(settings.temperature).toBeUndefined();
      expect(settings.maxOutputTokens).toBe(3000);
      expect(settings.maxRetries).toBe(1);
    });

    it('reasoning olmayan model için temperature:0 döner, providerOptions yok', () => {
      configService.get.mockImplementation((key: string) =>
        key === 'AI_SELECT_MODEL' ? 'gpt-4o' : undefined,
      );
      const settings = service.settings('select');
      expect(settings.temperature).toBe(0);
      expect(settings.providerOptions).toBeUndefined();
    });

    it('stream:true iken timeout.chunkMs=15000 eklenir', () => {
      const settings = service.settings('chat', { stream: true });
      expect(settings.timeout.chunkMs).toBe(15000);
    });

    it('stream verilmezse chunkMs set edilmez', () => {
      const settings = service.settings('chat');
      expect(settings.timeout.chunkMs).toBeUndefined();
    });

    it('timeout env geçerli sayı değilse fallback kullanılır', () => {
      configService.get.mockImplementation((key: string) =>
        key === 'AI_SELECT_TIMEOUT_MS' ? 'not-a-number' : undefined,
      );
      expect(service.settings('select').timeout.totalMs).toBe(30000);
    });

    it('timeout env negatifse fallback kullanılır', () => {
      configService.get.mockImplementation((key: string) =>
        key === 'AI_SELECT_TIMEOUT_MS' ? '-5' : undefined,
      );
      expect(service.settings('select').timeout.totalMs).toBe(30000);
    });

    it('timeout env geçerliyse kullanılır', () => {
      configService.get.mockImplementation((key: string) =>
        key === 'AI_SELECT_TIMEOUT_MS' ? '12345' : undefined,
      );
      expect(service.settings('select').timeout.totalMs).toBe(12345);
    });
  });

  describe('withAiRetry', () => {
    it('retryable hata attempts=2 default ile 2 kez denenir, ikinci başarıyla döner', async () => {
      const fn = jest
        .fn()
        .mockRejectedValueOnce(new AiProviderError('geçici hata', true))
        .mockResolvedValueOnce('ok');

      const result = await service.withAiRetry('test', fn);

      expect(result).toBe('ok');
      expect(fn).toHaveBeenCalledTimes(2);
    });

    it('non-retryable hata tek seferde fırlatılır (tekrar denenmez)', async () => {
      const fn = jest
        .fn()
        .mockRejectedValue(new AiProviderError('kalıcı hata', false));

      await expect(service.withAiRetry('test', fn)).rejects.toThrow(
        AiPipelineError,
      );
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('canRetry:false verilirse retryable hata olsa bile tekrar denenmez', async () => {
      const fn = jest
        .fn()
        .mockRejectedValue(new AiProviderError('geçici hata', true));

      await expect(
        service.withAiRetry('test', fn, { canRetry: () => false }),
      ).rejects.toThrow(AiPipelineError);
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('tüm denemeler tükenirse son hatayı fırlatır', async () => {
      const fn = jest
        .fn()
        .mockRejectedValue(new AiProviderError('sürekli hata', true));

      await expect(
        service.withAiRetry('test', fn, { attempts: 3 }),
      ).rejects.toThrow(AiPipelineError);
      expect(fn).toHaveBeenCalledTimes(3);
    });
  });

  describe('flowLog', () => {
    it("flowId'nin ilk 8 karakterini önek olarak kullanır", () => {
      const logSpy = jest
        .spyOn(
          (service as unknown as { logger: { log: (m: string) => void } })
            .logger,
          'log',
        )
        .mockImplementation(() => undefined);

      service.flowLog('abcdefgh12345').log('merhaba');

      expect(logSpy).toHaveBeenCalledWith('[flow=abcdefgh] merhaba');
      logSpy.mockRestore();
    });

    it("flowId yoksa '-' öneki kullanılır", () => {
      const logSpy = jest
        .spyOn(
          (service as unknown as { logger: { log: (m: string) => void } })
            .logger,
          'log',
        )
        .mockImplementation(() => undefined);

      service.flowLog().log('merhaba');

      expect(logSpy).toHaveBeenCalledWith('[flow=-] merhaba');
      logSpy.mockRestore();
    });
  });
});
