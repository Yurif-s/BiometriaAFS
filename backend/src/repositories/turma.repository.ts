import { Injectable } from '@nestjs/common';
import { Turma, Prisma } from '@prisma/client';
import { PrismaService } from '../services/prisma.service';
import { IRepository } from './interfaces/repository.interface';

@Injectable()
export class TurmaRepository implements IRepository<Turma, Prisma.TurmaCreateInput, Prisma.TurmaUpdateInput> {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: Prisma.TurmaCreateInput): Promise<Turma> {
    return this.prisma.turma.create({
      data,
      include: { alunos: true },
    });
  }

  async findById(id: number): Promise<Turma | null> {
    return this.prisma.turma.findUnique({
      where: { id },
      include: { alunos: true },
    });
  }

  async findAll(): Promise<Turma[]> {
    return this.prisma.turma.findMany({
      include: { alunos: true },
    });
  }

  async findByAno(ano: number): Promise<Turma[]> {
    return this.prisma.turma.findMany({
      where: { ano },
      include: { alunos: true },
    });
  }

  async update(id: number, data: Prisma.TurmaUpdateInput): Promise<Turma> {
    return this.prisma.turma.update({
      where: { id },
      data,
      include: { alunos: true },
    });
  }

  async delete(id: number): Promise<void> {
    await this.prisma.turma.delete({ where: { id } });
  }
}
