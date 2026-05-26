// backend/src/gateways/biometria.gateway.ts
import {
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server } from 'socket.io';

const allowedOrigins = process.env.FRONTEND_URL
  ? process.env.FRONTEND_URL.split(',').map((url) => url.trim())
  : ['http://localhost:5173'];

if (!allowedOrigins.includes('https://biometria-afs.vercel.app')) {
  allowedOrigins.push('https://biometria-afs.vercel.app');
}

@WebSocketGateway({
  cors: {
    origin: allowedOrigins,
    credentials: true,
  },
})
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