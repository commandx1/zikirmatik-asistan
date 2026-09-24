import type { ArgumentsHost } from '@nestjs/common';
import { AiPipelineExceptionFilter } from './ai-pipeline.filter';
import { AiPipelineError, AI_UNAVAILABLE_CODE } from './ai-errors';

function hostFor(req: unknown, res: unknown): ArgumentsHost {
  return {
    switchToHttp: () => ({
      getRequest: () => req,
      getResponse: () => res,
    }),
  } as unknown as ArgumentsHost;
}

function getJsonPayload(json: jest.Mock): { message: string } {
  return (json.mock.calls[0] as [{ message: string }])[0];
}

describe('AiPipelineExceptionFilter', () => {
  let filter: AiPipelineExceptionFilter;

  beforeEach(() => {
    filter = new AiPipelineExceptionFilter();
    jest
      .spyOn(
        (filter as unknown as { logger: { error: (...a: unknown[]) => void } })
          .logger,
        'error',
      )
      .mockImplementation(() => undefined);
  });

  it('headersSent true ise gövdeyi değiştirmez (yalnızca loglar)', () => {
    const res = { headersSent: true, status: jest.fn(), json: jest.fn() };
    const req = { headers: {}, body: {} };
    const error = new AiPipelineError('provider_error', 'boom', false);

    filter.catch(error, hostFor(req, res));

    expect(res.status).not.toHaveBeenCalled();
    expect(res.json).not.toHaveBeenCalled();
  });

  it('headersSent false ise 503 + AI_UNAVAILABLE_CODE gövdesi döner', () => {
    const json = jest.fn();
    const status = jest.fn(() => ({ json }));
    const res = { headersSent: false, status };
    const req = { headers: {}, body: {} };
    const error = new AiPipelineError('timeout', 'zaman aşımı', true);

    filter.catch(error, hostFor(req, res));

    expect(status).toHaveBeenCalledWith(503);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({ code: AI_UNAVAILABLE_CODE, reason: 'timeout' }),
    );
  });

  it("x-request-id header'ı requestId olarak kullanılır", () => {
    const json = jest.fn();
    const status = jest.fn(() => ({ json }));
    const res = { headersSent: false, status };
    const req = { headers: { 'x-request-id': 'req-123' }, body: {} };
    const error = new AiPipelineError('provider_error', 'boom', false);

    filter.catch(error, hostFor(req, res));

    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({ requestId: 'req-123' }),
    );
  });

  it('x-request-id yoksa body.flowId requestId olarak kullanılır', () => {
    const json = jest.fn();
    const status = jest.fn(() => ({ json }));
    const res = { headersSent: false, status };
    const req = { headers: {}, body: { flowId: 'flow-456' } };
    const error = new AiPipelineError('provider_error', 'boom', false);

    filter.catch(error, hostFor(req, res));

    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({ requestId: 'flow-456' }),
    );
  });

  it('Accept-Language: en-US ise İngilizce mesaj (locale=en) kullanılır', () => {
    const json = jest.fn();
    const status = jest.fn(() => ({ json }));
    const res = { headersSent: false, status };
    const req = { headers: { 'accept-language': 'en-US,en;q=0.9' }, body: {} };
    const error = new AiPipelineError('provider_error', 'boom', false);

    filter.catch(error, hostFor(req, res));

    const payload = getJsonPayload(json);
    expect(payload.message).toContain('No credit was charged');
  });

  it('Accept-Language tanımsızsa Türkçe mesaja (varsayılan tr) düşer', () => {
    const json = jest.fn();
    const status = jest.fn(() => ({ json }));
    const res = { headersSent: false, status };
    const req = { headers: {}, body: {} };
    const error = new AiPipelineError('provider_error', 'boom', false);

    filter.catch(error, hostFor(req, res));

    const payload = getJsonPayload(json);
    expect(payload.message).toContain('Kredin düşülmedi');
  });
});
