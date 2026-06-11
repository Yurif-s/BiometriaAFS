import { Injectable } from '@nestjs/common';
import { DashboardRepository } from '../repositories/dashboard.repository';
import { HORARIOS_AULAS, calcularTempos } from '../constants/horarios-aulas';

@Injectable()
export class DashboardService {
  constructor(private readonly dashboardRepository: DashboardRepository) {}

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
    const data = dataStr ? new Date(dataStr) : new Date();
    const acessos = await this.dashboardRepository.findAcessosPorDia(data);

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
      const hora = acesso.horario.getHours();
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
    const acessos = await this.dashboardRepository.findAcessosPeriodo(dias);

    // Inicializar os últimos N dias
    const tendenciaMap = new Map<string, { dataExibicao: string; dataOrdenacao: string; entrada: number; saida: number }>();
    const hoje = new Date();
    
    for (let i = dias - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(hoje.getDate() - i);
      const key = d.toISOString().slice(0, 10); // YYYY-MM-DD
      const diaStr = String(d.getDate()).padStart(2, '0');
      const mesStr = String(d.getMonth() + 1).padStart(2, '0');
      
      tendenciaMap.set(key, {
        dataExibicao: `${diaStr}/${mesStr}`,
        dataOrdenacao: key,
        entrada: 0,
        saida: 0,
      });
    }

    acessos.forEach(acesso => {
      const key = acesso.horario.toISOString().slice(0, 10);
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
    const limitNum = params.limit ? Number(params.limit) : 10;
    const pageNum = params.page ? Number(params.page) : 1;

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
    const data = dataStr ? new Date(dataStr) : new Date();
    const alunos = await this.dashboardRepository.findAlunosPorTurma(turmaId);
    const acessos = await this.dashboardRepository.findAcessosAlunosTurma(turmaId, data);

    const helperFormatTime = (d: Date) => {
      const hh = String(d.getHours()).padStart(2, '0');
      const mm = String(d.getMinutes()).padStart(2, '0');
      return `${hh}:${mm}`;
    };

    return alunos.map(aluno => {
      const acessosAluno = acessos.filter(a => a.aluno_id === aluno.id);

      const entradaAcesso = acessosAluno.find(a => a.tipo === 'Entrada');
      // A última saída deve ser depois da primeira entrada, se houver
      const saidaAcesso = entradaAcesso 
        ? [...acessosAluno].reverse().find(a => a.tipo === 'Saída' && a.horario > entradaAcesso.horario)
        : null;

      const entrada = entradaAcesso ? helperFormatTime(entradaAcesso.horario) : null;
      const saida = saidaAcesso ? helperFormatTime(saidaAcesso.horario) : null;

      const periodosAusentes = calcularTempos(entrada, saida, HORARIOS_AULAS);

      let status = 'Ausente';
      if (entrada) {
        status = saida ? 'Saiu' : 'Presente';
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
    // Busca TODOS os registros sem paginação
    const { data } = await this.dashboardRepository.findAcessosPaginados({
      ...params,
      page: 1,
      limit: 100000, // Limite alto para exportar tudo
    });

    let csv = 'Aluno,Matrícula,Turma,Tipo de Acesso,Horário\n';
    
    data.forEach(a => {
      const nome = a.aluno.nome.replace(/"/g, '""');
      const matricula = a.aluno.matricula;
      const turma = a.aluno.turma?.nome || 'Sem Turma';
      const tipo = a.tipo;
      const horario = a.horario.toISOString().replace('T', ' ').slice(0, 19);

      csv += `"${nome}","${matricula}","${turma}","${tipo}","${horario}"\n`;
    });

    return csv;
  }
}
