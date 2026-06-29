import { Platform } from 'react-native';
import { io, type Socket } from 'socket.io-client';

export type AiStepEvent = { key: string; message: string };

function resolveSocketBaseUrl() {
  const configured = process.env.EXPO_PUBLIC_API_BASE_URL?.trim();
  if (configured) return configured.replace(/\/+$/, '');
  const port = process.env.EXPO_PUBLIC_API_PORT?.trim() || '3000';
  const host = Platform.OS === 'android' ? '10.0.2.2' : '127.0.0.1';
  return `http://${host}:${port}`;
}

export function createAiProgressSocket() {
  let socket: Socket | null = null;

  function connect(): Promise<string> {
    return new Promise((resolve, reject) => {
      const url = `${resolveSocketBaseUrl()}/ai-progress`;
      socket = io(url, { transports: ['websocket'], timeout: 5000 });
      socket.once('connect', () => resolve(socket!.id!));
      socket.once('connect_error', (err) => reject(err));
    });
  }

  function onStep(cb: (event: AiStepEvent) => void) {
    socket?.on('ai:step', cb);
  }

  function disconnect() {
    socket?.disconnect();
    socket = null;
  }

  return { connect, onStep, disconnect };
}
