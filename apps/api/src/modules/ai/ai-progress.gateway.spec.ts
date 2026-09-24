import { AiProgressGateway } from './ai-progress.gateway';

describe('AiProgressGateway', () => {
  let gateway: AiProgressGateway;
  let emit: jest.Mock;
  let to: jest.Mock;

  beforeEach(() => {
    gateway = new AiProgressGateway();
    emit = jest.fn();
    to = jest.fn(() => ({ emit }));
    (gateway as unknown as { server: unknown }).server = { to };
  });

  it("emitStep, socketId'ye 'ai:step' event'i {key, message} payload'ıyla gönderir", () => {
    gateway.emitStep('socket-1', 'plan', 'Planlanıyor');

    expect(to).toHaveBeenCalledWith('socket-1');
    expect(emit).toHaveBeenCalledWith('ai:step', {
      key: 'plan',
      message: 'Planlanıyor',
    });
  });

  it("emitChatStep, socketId'ye 'ai-chat:step' event'i {key, message} payload'ıyla gönderir", () => {
    gateway.emitChatStep('socket-2', 'search', 'Aranıyor');

    expect(to).toHaveBeenCalledWith('socket-2');
    expect(emit).toHaveBeenCalledWith('ai-chat:step', {
      key: 'search',
      message: 'Aranıyor',
    });
  });
});
