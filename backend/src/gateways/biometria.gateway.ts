// backend/src/gateways/biometria.gateway.ts
import {
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server } from 'socket.io';

@WebSocketGateway({ cors: { origin: '*' } })
export class BiometriaGateway {
  @WebSocketServer()
  server: Server;

  // Chamado pelo AlunoService ao receber leitura do ESP32 com sucesso
  emitirBiometriaLida(
    biometriaId: number,
    alunoNome?: string,
    alunoMatricula?: string,
    alunoTurma?: string,
    entrada?: Date | null,
    saida?: Date | null,
  ) {
    this.server.emit('biometria-lida', {
      biometriaId,
      alunoNome,
      alunoMatricula,
      alunoTurma,
      entrada,
      saida,
    });
  }

  // Chamado pelo AlunoService ao receber uma falha de identificação no ESP32
  emitirBiometriaFalha() {
    this.server.emit('biometria-falha', {});
  }
}