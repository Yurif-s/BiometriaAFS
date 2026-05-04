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

@Module({
  imports: [],
  controllers: [AppController, TurmaController, AlunoController],
  providers: [AppService, PrismaService, TurmaService, TurmaRepository, AlunoService, AlunoRepository],
})
export class AppModule {}