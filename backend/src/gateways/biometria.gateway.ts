// backend/src/gateways/biometria.gateway.ts
import {
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server } from 'socket.io';

const allowedOrigins = process.env.FRONTEND_URL
  ? process.env.FRONTEND_URL.split(',').map((url) => url.trim())
  : ['http://localhost:5173'];

const vercelUrlWithHyphen = 'https://biometria-afs.vercel.app';
const vercelUrlNoHyphen = 'https://biometriaafs.vercel.app';
if (!allowedOrigins.includes(vercelUrlWithHyphen)) {
  allowedOrigins.push(vercelUrlWithHyphen);
}
if (!allowedOrigins.includes(vercelUrlNoHyphen)) {
  allowedOrigins.push(vercelUrlNoHyphen);
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