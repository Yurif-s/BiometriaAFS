import { PrismaClient } from "@prisma/client/extension";
import { Aluno } from "@prisma/client"; 

const prisma = new PrismaClient();

export interface IRepository<T> {
  create(data: T): Promise<T>;
  findById(id: number): Promise<T | null>;
  findAll(): Promise<T[]>;
  update(id: number, data: Partial<T>): Promise<T>;
  delete(id: number): Promise<void>;
}

export class AlunoRepository implements IRepository<Aluno> {
  async create(data: Aluno): Promise<Aluno> {
    return prisma.aluno.create({
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
    return prisma.aluno.findUnique({
      where: { id },
      include: {
        turma: true,
      },
    });
  }

  async findAll(): Promise<Aluno[]> {
    return prisma.aluno.findMany({
      include: {
        turma: true,
      },
    });
  }

  async findByMatricula(matricula: string): Promise<Aluno | null> {
    return prisma.aluno.findUnique({
      where: { matricula },
      include: {
        turma: true,
      },
    });
  }

  async findByTurmaId(turma_id: number): Promise<Aluno[]> {
    return prisma.aluno.findMany({
      where: { turma_id },
      include: {
        turma: true,
      },
    });
  }

  async update(id: number, data: Partial<Aluno>): Promise<Aluno> {
    return prisma.aluno.update({
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
    await prisma.aluno.delete({
      where: { id },
    });
  }
}