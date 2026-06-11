import { Injectable } from '@nestjs/common';
import { Aluno, Prisma } from '@prisma/client';
import { PrismaService } from '../services/prisma.service';

export interface IRepository<T> {
  create(data: T): Promise<T>;
  findById(id: number): Promise<T | null>;
  findAll(): Promise<T[]>;
  update(id: number, data: Partial<T>): Promise<T>;
  delete(id: number): Promise<void>;
}

@Injectable()
export class AlunoRepository implements IRepository<Aluno> {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: Aluno): Promise<Aluno> {
    return this.prisma.aluno.create({
      data: {
        matricula: data.matricula,
        nome: data.nome,
        biometria: data.biometria,
        entrada: data.entrada,
        saida: data.saida,
        turma_id: data.turma_id,
      },
      include: {
        turma: true,
      },
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

  async findByBiometria(biometria: number): Promise<Aluno | null> {
    return this.prisma.aluno.findFirst({
      where: { biometria },
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

  async findPresentesSemSaidaDesde(inicio: Date): Promise<Aluno[]> {
    return this.prisma.aluno.findMany({
      where: {
        entrada: {
          gte: inicio,
        },
        OR: [
          { saida: null },
          {
            saida: {
              lt: this.prisma.aluno.fields.entrada,
            },
          },
        ],
      },
      include: {
        turma: true,
      },
    });
  }

  async update(id: number, data: Partial<Aluno>): Promise<Aluno> {
    return this.prisma.aluno.update({
      where: { id },
      data: {
        matricula: data.matricula,
        nome: data.nome,
        biometria: data.biometria,
        entrada: data.entrada,
        saida: data.saida,
        turma_id: data.turma_id,
      },
      include: {
        turma: true,
      },
    });
  }

  async delete(id: number): Promise<void> {
    await this.prisma.aluno.delete({
      where: { id },
    });
  }
}
