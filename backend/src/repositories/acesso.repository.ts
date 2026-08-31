import { Injectable } from '@nestjs/common';
import { PrismaService } from '../services/prisma.service';
import { Acesso } from '@prisma/client';

@Injectable()
export class AcessoRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: Omit<Acesso, 'id'>): Promise<Acesso> {
    return this.prisma.acesso.create({
      data,
      include: {
        aluno: {
          include: {
            turma: true,
          }
        }
      }
    });
  }

  async findSaidaByAlunoHorario(alunoId: number, horario: Date): Promise<Acesso | null> {
    return this.prisma.acesso.findFirst({
      where: {
        aluno_id: alunoId,
        tipo: 'Saída',
        horario,
      },
      orderBy: {
        id: 'desc',
      },
    });
  }

  async findAll(): Promise<Acesso[]> {
    return this.prisma.acesso.findMany({
      orderBy: {
        horario: 'desc',
      },
      include: {
        aluno: {
          include: {
            turma: true,
          }
        }
      }
    });
  }

  async findToday(): Promise<Acesso[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return this.prisma.acesso.findMany({
      where: {
        horario: {
          gte: today,
        },
      },
      orderBy: {
        horario: 'desc',
      },
      include: {
        aluno: {
          include: {
            turma: true,
          }
        }
      }
    });
  }

  async findByAlunoNoDia(alunoId: number, inicioDoDia: Date, fimDoDia: Date): Promise<Acesso[]> {
    return this.prisma.acesso.findMany({
      where: {
        aluno_id: alunoId,
        horario: {
          gte: inicioDoDia,
          lte: fimDoDia,
        },
      },
      orderBy: {
        horario: 'asc',
      },
    });
  }

  async findById(id: number): Promise<Acesso | null> {
    return this.prisma.acesso.findUnique({
      where: { id },
      include: {
        aluno: {
          include: {
            turma: true,
          }
        }
      }
    });
  }

  async update(id: number, data: Partial<Acesso>): Promise<Acesso> {
    return this.prisma.acesso.update({
      where: { id },
      data,
      include: {
        aluno: {
          include: {
            turma: true,
          }
        }
      }
    });
  }

  async delete(id: number): Promise<Acesso> {
    return this.prisma.acesso.delete({
      where: { id },
    });
  }
}
