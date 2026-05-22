// backend/src/gateways/biometria.gateway.ts
import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
} from '@nestjs/websockets';
import { Server } from 'socket.io';

@WebSocketGateway({ cors: { origin: '*' } })
export class BiometriaGateway {
  @WebSocketServer()
  server: Server;

  // Chamado pelo AlunoService ao receber leitura do ESP32
  emitirBiometriaLida(biometriaId: number, alunoNome?: string) {
    this.server.emit('biometria-lida', { biometriaId, alunoNome });
  }
}