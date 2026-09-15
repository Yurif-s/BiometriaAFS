import { BadRequestException } from '@nestjs/common';
import { DashboardService } from '../src/services/dashboard.service';
import { DashboardRepository } from '../src/repositories/dashboard.repository';

describe('Dashboard: consultas e datas', () => {
  const aluno = { id: 1, nome: 'Aluno', matricula: '123' };
  let repository: any;
  let service: DashboardService;

  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(new Date('2026-09-16T02:30:00Z'));
    repository = {
      findAlunosPorTurma: jest.fn().mockResolvedValue([aluno]),
      findAcessosAlunosTurma: jest.fn().mockResolvedValue([]),
      findAcessosPorDia: jest.fn().mockResolvedValue([]),
      findAcessosPeriodo: jest.fn().mockResolvedValue([]),
      findAcessosPaginados: jest.fn().mockResolvedValue({ data: [], total: 0 }),
    };
    service = new DashboardService(repository);
  });

  afterEach(() => jest.useRealTimers());

  it('consulta o dia selecionado e calcula os períodos em UTC-3', async () => {
    repository.findAcessosAlunosTurma.mockResolvedValue([
      { aluno_id: 1, tipo: 'Entrada', horario: new Date('2026-09-15T10:20:00Z') },
      { aluno_id: 1, tipo: 'Saída', horario: new Date('2026-09-15T19:35:00Z') },
    ]);
    const [result] = await service.getFrequenciaTurma(1, '2026-09-15');
    expect(repository.findAcessosAlunosTurma).toHaveBeenCalledWith(1, new Date('2026-09-15T03:00:00Z'));
    expect(result).toMatchObject({ entrada: '07:20', saida: '16:35', periodosAusentes: [], status: 'Saiu' });
  });

  it('agrupa o acesso noturno no dia brasileiro correto', async () => {
    repository.findAcessosPeriodo.mockResolvedValue([
      { tipo: 'Entrada', horario: new Date('2026-09-16T02:00:00Z') },
    ]);
    expect(await service.getTendencia(1)).toEqual([
      { dataExibicao: '15/09', dataOrdenacao: '2026-09-15', entrada: 1, saida: 0 },
    ]);
  });

  it('não conta uma saída prevista como movimentação já ocorrida', async () => {
    jest.setSystemTime(new Date('2026-09-15T11:00:00Z'));
    repository.findAcessosPorDia.mockResolvedValue([
      { tipo: 'Entrada', horario: new Date('2026-09-15T10:20:00Z') },
      { tipo: 'Saída', horario: new Date('2026-09-15T19:35:00Z') },
    ]);
    const result = await service.getAcessosPorHora('2026-09-15');
    expect(result.find(item => item.hora === '07h')?.entrada).toBe(1);
    expect(result.find(item => item.hora === '16h')?.saida).toBe(0);
  });

  it.each([{ page: 0 }, { page: NaN }, { limit: -1 }, { limit: 1.5 }, { turmaId: NaN },
    { dataInicio: '2026-02-30' }, { dataInicio: '2026-09-16', dataFim: '2026-09-15' }, { tipo: 'outro' }])(
    'rejeita filtros inválidos: %j', async params => {
      await expect(service.getAcessosPaginados(params)).rejects.toThrow(BadRequestException);
      expect(repository.findAcessosPaginados).not.toHaveBeenCalled();
    },
  );

  it('exporta o mesmo horário da interface e escapa aspas em todas as colunas', async () => {
    repository.findAcessosPaginados.mockResolvedValue({ total: 1, data: [{
      tipo: 'Entrada', horario: new Date('2026-09-16T02:00:00Z'),
      aluno: { ...aluno, turma: { nome: 'Turma "A"' } },
    }] });
    expect(await service.exportCsv({})).toContain('"Turma ""A""","Entrada","2026-09-15 23:00:00"');
  });
});

describe('DashboardRepository: presença e limites de consulta', () => {
  afterEach(() => jest.useRealTimers());

  it('inclui o aluno cuja saída prevista ainda não aconteceu', async () => {
    const agora = new Date('2026-09-15T11:00:00Z');
    jest.useFakeTimers().setSystemTime(agora);
    // Exercita os critérios sobre dados reais em memória, incluindo entrada futura.
    const students = [
      { id: 1, entrada: new Date('2026-09-15T10:20:00Z'), saida: new Date('2026-09-15T19:35:00Z') },
      { id: 2, entrada: new Date('2026-09-15T10:20:00Z'), saida: new Date('2026-09-15T10:50:00Z') },
      { id: 3, entrada: new Date('2026-09-15T12:00:00Z'), saida: null },
    ];
    const prisma: any = { aluno: { fields: { entrada: 'entrada' }, findMany: jest.fn(({ where }) =>
      students.filter(a => a.entrada >= where.entrada.gte && (!where.entrada.lte || a.entrada <= where.entrada.lte)
        && where.OR.some(condition => condition.saida === null ? a.saida === null
          : a.saida && (condition.saida.gt ? a.saida > condition.saida.gt : a.saida < a.entrada))),
    ) } };
    expect(await new DashboardRepository(prisma).findPresentesAgora()).toEqual([students[0]]);
  });

  it('consulta exatamente N dias até agora, sem saídas futuras', async () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-09-16T02:30:00Z'));
    const prisma: any = { acesso: { findMany: jest.fn().mockResolvedValue([]) } };
    await new DashboardRepository(prisma).findAcessosPeriodo(7);
    expect(prisma.acesso.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { horario: {
      gte: new Date('2026-09-09T03:00:00Z'), lte: new Date('2026-09-16T02:30:00Z'),
    } } }));
  });
});
