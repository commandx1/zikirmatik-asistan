import { io, type Socket } from 'socket.io-client';
import { API_BASE_URL } from '../../../lib/env';

const CONNECT_TIMEOUT_MS = 6000;

export type AiStepEvent = { key: string; message: string };

export function createAiProgressSocket() {
  let socket: Socket | null = null;

  function connect(): Promise<string> {
    return new Promise((resolve, reject) => {
      const url = `${API_BASE_URL}/ai-progress`;
      socket = io(url, { transports: ['websocket'], timeout: 5000 });
      // socket.io's own `timeout` only covers the manager's connect_error path;
      // a never-acknowledged namespace connect would hang, so cap it ourselves.
      const timer = setTimeout(() => {
        disconnect();
        reject(new Error('ai-progress connect timeout'));
      }, CONNECT_TIMEOUT_MS);
      socket.once('connect', () => {
        clearTimeout(timer);
        resolve(socket!.id!);
      });
      socket.once('connect_error', (err) => {
        clearTimeout(timer);
        reject(err);
      });
    });
  }

  function onStep(cb: (event: AiStepEvent) => void) {
    socket?.on('ai:step', cb);
  }

  /**
   * Çok turlu sohbet akışı (ai-chat modülü) ayrı bir event adı kullanır
   * (bkz. AiProgressGateway.emitChatStep) — mevcut 'ai:step' dinleyicisiyle
   * karışmaması için. Aynı socket bağlantısı üzerinden dinlenir.
   */
  function onChatStep(cb: (event: AiStepEvent) => void) {
    socket?.on('ai-chat:step', cb);
  }

  function disconnect() {
    socket?.disconnect();
    socket = null;
  }

  return { connect, onStep, onChatStep, disconnect };
}
