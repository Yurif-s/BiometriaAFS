import { Injectable } from '@nestjs/common';
import { Aluno, Prisma } from '@prisma/client';
import { PrismaService } from '../services/prisma.service';
import { IRepository } from './interfaces/repository.interface';

@Injectable()
export class AlunoRepository implements IRepository<Aluno, Prisma.AlunoCreateInput, Prisma.AlunoUpdateInput> {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: Prisma.AlunoCreateInput): Promise<Aluno> {
    return this.prisma.aluno.create({
      data,
      include: { turma: true },
    });
  }

  async findById(id: number): Promise<Aluno | null> {
    return this.prisma.aluno.findUnique({
      where: { id },
      include: {
        turma: true,
      },
    });
  }

  async findAll(): Promise<Aluno[]> {
    return this.prisma.aluno.findMany({
      include: {
        turma: true,
      },
    });
  }

  async findByMatricula(matricula: string): Promise<Aluno | null> {
    return this.prisma.aluno.findUnique({
      where: { matricula },
      include: {
        turma: true,
      },
    });
  }

  async findByTurmaId(turma_id: number): Promise<Aluno[]> {
    return this.prisma.aluno.findMany({
      where: { turma_id },
      include: {
        turma: true,
      },
    });
  }

  async update(id: number, data: Prisma.AlunoUpdateInput): Promise<Aluno> {
    return this.prisma.aluno.update({
      where: { id },
      data,
      include: { turma: true },
    });
  }

  async delete(id: number): Promise<void> {
    await this.prisma.aluno.delete({
      where: { id },
    });
  }
}