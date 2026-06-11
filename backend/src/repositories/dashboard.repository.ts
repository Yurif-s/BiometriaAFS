import { Injectable } from '@nestjs/common';
import { PrismaService } from '../services/prisma.service';
import { Prisma, Acesso, Aluno } from '@prisma/client';

type AcessoComAlunoTurma = Prisma.AcessoGetPayload<{
  include: {
    aluno: {
      include: {
        turma: true;
      };
    };
  };
}>;

// Helpers para garantir que as datas usem o fuso de Brasília (UTC-3),
// independente do timezone do servidor cloud.
function startOfDayBR(date?: Date): Date {
  const d = date ? new Date(date) : new Date();
  const brString = d.toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' });
  return new Date(`${brString}T00:00:00-03:00`);
}

function endOfDayBR(date?: Date): Date {
  const d = date ? new Date(date) : new Date();
  const brString = d.toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' });
  return new Date(`${brString}T23:59:59.999-03:00`);
}

@Injectable()
export class DashboardRepository {
  constructor(private readonly prisma: PrismaService) {}

  async countTotalAlunos(): Promise<number> {
    return this.prisma.aluno.count();
  }

  async countTotalTurmas(): Promise<number> {
    return this.prisma.turma.count();
  }

  async countAcessosHoje(): Promise<{ entrada: number; saida: number }> {
    const startOfToday = startOfDayBR();
    const endOfToday = endOfDayBR();

    const entradas = await this.prisma.acesso.count({
      where: {
        tipo: 'Entrada',
        horario: {
          gte: startOfToday,
          lte: endOfToday,
        },
      },
    });

    const saidas = await this.prisma.acesso.count({
      where: {
        tipo: 'Saída',
        horario: {
          gte: startOfToday,
          lte: endOfToday,
        },
      },
    });

    return { entrada: entradas, saida: saidas };
  }

  async findPresentesAgora(): Promise<Aluno[]> {
    const startOfToday = startOfDayBR();

    // Presente hoje significa: entrada foi hoje, e ou não saiu hoje ou a última saída foi antes da entrada
    return this.prisma.aluno.findMany({
      where: {
        entrada: {
          gte: startOfToday,
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

  async findNaoEntraramHoje(): Promise<Aluno[]> {
    const startOfToday = startOfDayBR();

    return this.prisma.aluno.findMany({
      where: {
        OR: [
          { entrada: null },
          {
            entrada: {
              lt: startOfToday,
            },
          },
        ],
      },
      include: {
        turma: true,
      },
    });
  }

  async findAcessosPorDia(data: Date): Promise<Acesso[]> {
    const startOfDay = startOfDayBR(data);
    const endOfDay = endOfDayBR(data);

    return this.prisma.acesso.findMany({
      where: {
        horario: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      orderBy: {
        horario: 'asc',
      },
      include: {
        aluno: {
          include: {
            turma: true,
          },
        },
      },
    });
  }

  async findAcessosPeriodo(dias: number): Promise<Acesso[]> {
    const now = new Date();
    now.setDate(now.getDate() - dias);
    const startOfPeriod = startOfDayBR(now);

    return this.prisma.acesso.findMany({
      where: {
        horario: {
          gte: startOfPeriod,
        },
      },
      orderBy: {
        horario: 'asc',
      },
    });
  }

  async findAcessosPaginados(params: {
    dataInicio?: string;
    dataFim?: string;
    turmaId?: number;
    tipo?: string;
    busca?: string;
    page?: number;
    limit?: number;
  }): Promise<{ data: AcessoComAlunoTurma[]; total: number }> {
    const { dataInicio, dataFim, turmaId, tipo, busca, page = 1, limit = 10 } = params;

    const where: Prisma.AcessoWhereInput = {};

    if (dataInicio || dataFim) {
      where.horario = {};
      if (dataInicio) {
        where.horario.gte = new Date(`${dataInicio}T00:00:00-03:00`);
      }
      if (dataFim) {
        where.horario.lte = new Date(`${dataFim}T23:59:59.999-03:00`);
      }
    }

    if (tipo) {
      where.tipo = tipo;
    }

    if (turmaId) {
      where.aluno = {
        turma_id: turmaId,
      };
    }

    if (busca) {
      const alunoFilter = where.aluno as Prisma.AlunoWhereInput || {};
      where.aluno = {
        ...alunoFilter,
        OR: [
          { nome: { contains: busca, mode: 'insensitive' } },
          { matricula: { contains: busca } },
        ],
      };
    }

    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.acesso.findMany({
        where,
        orderBy: {
          horario: 'desc',
        },
        skip,
        take: limit,
        include: {
          aluno: {
            include: {
              turma: true,
            },
          },
        },
      }),
      this.prisma.acesso.count({ where }),
    ]);

    return { data, total };
  }

  async findAlunosPorTurma(turmaId: number): Promise<Aluno[]> {
    return this.prisma.aluno.findMany({
      where: {
        turma_id: turmaId,
      },
      orderBy: {
        nome: 'asc',
      },
    });
  }

  async findAcessosAlunosTurma(turmaId: number, data: Date): Promise<Acesso[]> {
    const startOfDay = startOfDayBR(data);
    const endOfDay = endOfDayBR(data);

    return this.prisma.acesso.findMany({
      where: {
        aluno: {
          turma_id: turmaId,
        },
        horario: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      orderBy: {
        horario: 'asc',
      },
      include: {
        aluno: true,
      },
    });
  }
}
