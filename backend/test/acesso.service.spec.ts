import { AcessoService } from '../src/services/acesso.service';

describe('AcessoService: sincronização de presença', () => {
  let service: AcessoService;
  let acessos: any;
  let alunos: any;
  const horario = new Date('2026-09-16T02:00:00Z'); // ainda dia 15 no Ceará

  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(new Date('2026-09-16T02:30:00Z'));
    alunos = { update: jest.fn() };
    acessos = {
      create: jest.fn().mockResolvedValue({ id: 1, aluno_id: 1, tipo: 'Entrada', horario }),
      findById: jest.fn().mockResolvedValue({ id: 1, aluno_id: 1, tipo: 'Entrada', horario }),
      findByAlunoNoDia: jest.fn().mockResolvedValue([{ id: 1, aluno_id: 1, tipo: 'Entrada', horario }]),
      update: jest.fn(), delete: jest.fn(),
    };
    service = new AcessoService(acessos, alunos);
  });
  afterEach(() => jest.useRealTimers());

  it('a entrada manual atualiza a presença no dia brasileiro correto', async () => {
    await service.create({ aluno_id: 1, tipo: 'Entrada', horario: horario.toISOString() });
    expect(acessos.findByAlunoNoDia).toHaveBeenCalledWith(1,
      new Date('2026-09-15T03:00:00Z'), new Date('2026-09-16T02:59:59.999Z'));
    expect(alunos.update).toHaveBeenCalledWith(1, { entrada: horario, saida: null });
  });

  it('aceita horário local manual sem depender do fuso do servidor', async () => {
    await service.create({ aluno_id: 1, tipo: 'Entrada', horario: '2026-09-15T23:00' });
    expect(acessos.create).toHaveBeenCalledWith({ aluno_id: 1, tipo: 'Entrada', horario });
  });

  it('mover o último acesso para outro dia remove a presença de hoje', async () => {
    acessos.update.mockResolvedValue({ id: 1, aluno_id: 1, tipo: 'Entrada', horario: new Date('2026-09-14T10:00:00Z') });
    acessos.findByAlunoNoDia.mockResolvedValue([]);
    await service.update(1, { horario: '2026-09-14T10:00:00Z' });
    expect(alunos.update).toHaveBeenCalledWith(1, { entrada: null, saida: null });
    expect(alunos.update).toHaveBeenCalledTimes(1);
  });

  it('excluir uma saída restaura a presença do aluno', async () => {
    acessos.findById.mockResolvedValue({ id: 2, aluno_id: 1, tipo: 'Saída', horario });
    await service.delete(2);
    expect(alunos.update).toHaveBeenCalledWith(1, { entrada: horario, saida: null });
  });
});
