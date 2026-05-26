import { Module } from '@nestjs/common';
import { AppController } from '../controllers/app.controller';
import { AppService } from '../services/app.service';
import { PrismaService } from '../services/prisma.service';
import { TurmaController } from '../controllers/turma.controller';
import { TurmaService } from '../services/turma.service';
import { TurmaRepository } from '../repositories/turma.repository';
import { AlunoController } from '../controllers/aluno.controller';
import { AlunoService } from 'services/aluno.service';
import { AlunoRepository } from 'repositories/aluno.repository';
import { BiometriaGateway } from '../gateways/biometria.gateway';
import { AcessoController } from '../controllers/acesso.controller';
import { AcessoService } from '../services/acesso.service';
import { AcessoRepository } from '../repositories/acesso.repository';

@Module({
  imports: [],
  controllers: [AppController, TurmaController, AlunoController, AcessoController],
  providers: [
    AppService, 
    PrismaService, 
    TurmaService, 
    TurmaRepository, 
    AlunoService, 
    AlunoRepository, 
    BiometriaGateway,
    AcessoService,
    AcessoRepository
  ],
})
export class AppModule {}