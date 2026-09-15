import { BadRequestException, Injectable } from '@nestjs/common';
import { adicionarDiasBR, dataBR, horarioBR, horarioNoDiaBR, inicioDoDiaBR, validarData } from '../utils/datas';
import { DashboardRepository } from '../repositories/dashboard.repository';
import {
  HORARIOS_AULAS,
  IntervaloPresenca,
  calcularTemposPorIntervalos,
} from '../constants/horarios-aulas';

@Injectable()
export class DashboardService {
  constructor(private readonly dashboardRepository: DashboardRepository) {}

  private validarInteiro(value: number, campo: string, max = Number.MAX_SAFE_INTEGER) {
    if (!Number.isSafeInteger(value) || value < 1 || value > max) {
      throw new BadRequestException(`${campo} deve ser um inteiro entre 1 e ${max}.`);
    }
  }

  private validarFiltros(params: { dataInicio?: string; dataFim?: string; turmaId?: number; tipo?: string }) {
    if (params.dataInicio !== undefined) validarData(params.dataInicio);
    if (params.dataFim !== undefined) validarData(params.dataFim);
    if (params.dataInicio && params.dataFim && params.dataInicio > params.dataFim) {
      throw new BadRequestException('Data inicial não pode ser posterior à data final.');
    }
    if (params.turmaId !== undefined) this.validarInteiro(params.turmaId, 'turmaId');
    if (params.tipo !== undefined && !['Entrada', 'Saída'].includes(params.tipo)) {
      throw new BadRequestException('Tipo deve ser Entrada ou Saída.');
    }
  }

  async getResumo(): Promise<{
    totalAlunos: number;
    totalTurmas: number;
    acessosHoje: { entrada: number; saida: number };
    presentesAgora: number;
    naoEntraram: number;
    slotsEmUso: number;
  }> {
    const totalAlunos = await this.dashboardRepository.countTotalAlunos();
    const totalTurmas = await this.dashboardRepository.countTotalTurmas();
    const acessosHoje = await this.dashboardRepository.countAcessosHoje();
    
    const presentes = await this.dashboardRepository.findPresentesAgora();
    const naoEntraram = await this.dashboardRepository.findNaoEntraramHoje();

    return {
      totalAlunos,
      totalTurmas,
      acessosHoje,
      presentesAgora: presentes.length,
      naoEntraram: naoEntraram.length,
      slotsEmUso: totalAlunos, // Slots biométricos em uso é igual ao total de alunos
    };
  }

  async getAcessosPorHora(dataStr?: string) {
    const data = inicioDoDiaBR(dataStr);
    const acessos = await this.dashboardRepository.findAcessosPorDia(data);
    const agora = new Date();

    // Inicializar horas do dia (das 06h às 22h por padrão para o gráfico ficar elegante, ou 24h)
    const horasMap = new Map<number, { hora: string; entrada: number; saida: number; total: number }>();
    for (let h = 6; h <= 22; h++) {
      horasMap.set(h, {
        hora: `${String(h).padStart(2, '0')}h`,
        entrada: 0,
        saida: 0,
        total: 0,
      });
    }

    acessos.forEach(acesso => {
      if (acesso.horario > agora) return;
      const hora = Number(horarioBR(acesso.horario).slice(0, 2));
      if (horasMap.has(hora)) {
        const item = horasMap.get(hora)!;
        if (acesso.tipo === 'Entrada') {
          item.entrada++;
        } else {
          item.saida++;
        }
        item.total++;
      }
    });

    return Array.from(horasMap.values());
  }

  async getTendencia(dias: number = 7) {
    this.validarInteiro(dias, 'dias', 365);
    const acessos = await this.dashboardRepository.findAcessosPeriodo(dias);

    // Inicializar os últimos N dias
    const tendenciaMap = new Map<string, { dataExibicao: string; dataOrdenacao: string; entrada: number; saida: number }>();
    const hoje = new Date();
    
    for (let i = dias - 1; i >= 0; i--) {
      const key = dataBR(adicionarDiasBR(hoje, -i));
      const [, mesStr, diaStr] = key.split('-');
      
      tendenciaMap.set(key, {
        dataExibicao: `${diaStr}/${mesStr}`,
        dataOrdenacao: key,
        entrada: 0,
        saida: 0,
      });
    }

    acessos.forEach(acesso => {
      const key = dataBR(acesso.horario);
      if (tendenciaMap.has(key)) {
        const item = tendenciaMap.get(key)!;
        if (acesso.tipo === 'Entrada') {
          item.entrada++;
        } else {
          item.saida++;
        }
      }
    });

    return Array.from(tendenciaMap.values()).sort((a, b) => a.dataOrdenacao.localeCompare(b.dataOrdenacao));
  }

  async getAcessosPaginados(params: {
    dataInicio?: string;
    dataFim?: string;
    turmaId?: number;
    tipo?: string;
    busca?: string;
    page?: number;
    limit?: number;
  }) {
    this.validarFiltros(params);
    const limitNum = params.limit ?? 10;
    const pageNum = params.page ?? 1;
    this.validarInteiro(limitNum, 'limit', 500);
    this.validarInteiro(pageNum, 'page');
    if (!Number.isSafeInteger((pageNum - 1) * limitNum)) {
      throw new BadRequestException('Página fora do intervalo permitido.');
    }

    const { data, total } = await this.dashboardRepository.findAcessosPaginados({
      ...params,
      page: pageNum,
      limit: limitNum,
    });

    return {
      data,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
    };
  }

  async getFrequenciaTurma(turmaId: number, dataStr?: string) {
    this.validarInteiro(turmaId, 'turmaId');
    const data = inicioDoDiaBR(dataStr);
    const alunos = await this.dashboardRepository.findAlunosPorTurma(turmaId);
    const acessos = await this.dashboardRepository.findAcessosAlunosTurma(turmaId, data);

    const helperFormatTime = horarioBR;

    const montarIntervalosPresenca = (acessosAluno: typeof acessos): IntervaloPresenca[] => {
      const intervalos: IntervaloPresenca[] = [];
      let entradaAtual: Date | null = null;

      acessosAluno.forEach(acesso => {
        if (acesso.tipo === 'Entrada') {
          entradaAtual ??= acesso.horario;
          return;
        }

        if (acesso.tipo === 'Saída' && entradaAtual && acesso.horario > entradaAtual) {
          intervalos.push({
            entrada: helperFormatTime(entradaAtual),
            saida: helperFormatTime(acesso.horario),
          });
          entradaAtual = null;
        }
      });

      if (entradaAtual) {
        intervalos.push({
          entrada: helperFormatTime(entradaAtual),
          saida: null,
        });
      }

      return intervalos;
    };

    return alunos.map(aluno => {
      const acessosAluno = acessos.filter(a => a.aluno_id === aluno.id);

      const entradaAcesso = acessosAluno.find(a => a.tipo === 'Entrada');
      const saidaAcesso = [...acessosAluno].reverse().find(a => a.tipo === 'Saída');
      const intervalosPresenca = montarIntervalosPresenca(acessosAluno);

      const entrada = entradaAcesso ? helperFormatTime(entradaAcesso.horario) : null;
      const saida = saidaAcesso ? helperFormatTime(saidaAcesso.horario) : null;

      const periodosAusentes = calcularTemposPorIntervalos(intervalosPresenca, HORARIOS_AULAS);

      let status = 'Ausente';
      if (intervalosPresenca.length > 0) {
        const ultimoIntervalo = intervalosPresenca[intervalosPresenca.length - 1];
        const saidaUltimoIntervalo = ultimoIntervalo.saida
          ? horarioNoDiaBR(data, `${ultimoIntervalo.saida}:00`)
          : null;

        status = !saidaUltimoIntervalo || saidaUltimoIntervalo > new Date()
          ? 'Presente'
          : 'Saiu';
      }

      return {
        alunoId: aluno.id,
        nome: aluno.nome,
        matricula: aluno.matricula,
        entrada,
        saida,
        periodosAusentes,
        status, // 'Presente', 'Saiu', 'Ausente'
      };
    });
  }

  async exportCsv(params: {
    dataInicio?: string;
    dataFim?: string;
    turmaId?: number;
    tipo?: string;
    busca?: string;
  }): Promise<string> {
    this.validarFiltros(params);
    // Busca TODOS os registros sem paginação
    const { data } = await this.dashboardRepository.findAcessosPaginados({
      ...params,
      page: 1,
      limit: 100000, // Limite alto para exportar tudo
    });

    let csv = 'Aluno,Matrícula,Turma,Tipo de Acesso,Horário\n';
    
    data.forEach(a => {
      const matricula = a.aluno.matricula;
      const turma = a.aluno.turma?.nome || 'Sem Turma';
      const tipo = a.tipo;
      const horario = `${dataBR(a.horario)} ${horarioBR(a.horario, true)}`;

      csv += [a.aluno.nome, matricula, turma, tipo, horario]
        .map(value => `"${value.replace(/"/g, '""')}"`).join(',') + '\n';
    });

    return csv;
  }
}
