import { Module } from '@nestjs/common';
import { AppController } from '../controllers/app.controller';
import { AppService } from '../services/app.service';
import { PrismaService } from '../services/prisma.service';
import { TurmaController } from '../controllers/turma.controller';
import { TurmaService } from '../services/turma.service';
import { TurmaRepository } from '../repositories/turma.repository';

@Module({
  imports: [],
  controllers: [AppController, TurmaController],
  providers: [AppService, PrismaService, TurmaService, TurmaRepository],
})
export class AppModule {}