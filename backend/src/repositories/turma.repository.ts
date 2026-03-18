import { PrismaClient } from "@prisma/client/extension";
import { Turma } from "generated/prisma/browser";


const prisma = new PrismaClient();

export interface IRepository<T> {
  create(data: T): Promise<T>;
  findById(id: number): Promise<T | null>;
  findAll(): Promise<T[]>;
  update(id: number, data: Partial<T>): Promise<T>;
  delete(id: number): Promise<void>;
}

export class TurmaRepository implements IRepository<Turma> {
  async create(data: Turma): Promise<Turma> {
    return prisma.turma.create({
      data: {
        nome: data.nome,
        ano: data.ano,
      },
      include: {
        alunos: true,
      },
    });
  }

  async findById(id: number): Promise<Turma | null> {
    return prisma.turma.findUnique({
      where: { id },
      include: {
        alunos: true,
      },
    });
  }

  async findAll(): Promise<Turma[]> {
    return prisma.turma.findMany({
      include: {
        alunos: true,
      },
    });
  }

  async findByAno(ano: number): Promise<Turma[]> {
    return prisma.turma.findMany({
      where: { ano },
      include: {
        alunos: true,
      },
    });
  }

  async update(id: number, data: Partial<Turma>): Promise<Turma> {
    return prisma.turma.update({
      where: { id },
      data: {
        nome: data.nome,
        ano: data.ano,
      },
      include: {
        alunos: true,
      },
    });
  }

  async delete(id: number): Promise<void> {
    await prisma.turma.delete({
      where: { id },
    });
  }
}