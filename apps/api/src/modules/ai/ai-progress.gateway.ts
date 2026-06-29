import { Injectable } from '@nestjs/common';
import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import type { Server } from 'socket.io';

@Injectable()
@WebSocketGateway({ cors: { origin: '*' }, namespace: '/ai-progress' })
export class AiProgressGateway {
  @WebSocketServer() private readonly server: Server;

  emitStep(socketId: string, key: string, message: string) {
    this.server.to(socketId).emit('ai:step', { key, message });
  }
}
