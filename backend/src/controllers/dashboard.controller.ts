import { Controller, Get, Param, Query, Header, ParseIntPipe } from '@nestjs/common';
import { DashboardService } from '../services/dashboard.service';

@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('resumo')
  async getResumo() {
    return this.dashboardService.getResumo();
  }

  @Get('acessos/por-hora')
  async getAcessosPorHora(@Query('data') data?: string) {
    return this.dashboardService.getAcessosPorHora(data);
  }

  @Get('tendencia')
  async getTendencia(@Query('dias') dias?: string) {
    const diasNum = dias === undefined ? 7 : Number(dias);
    return this.dashboardService.getTendencia(diasNum);
  }

  @Get('acessos')
  async getAcessosPaginados(
    @Query('dataInicio') dataInicio?: string,
    @Query('dataFim') dataFim?: string,
    @Query('turmaId') turmaId?: string,
    @Query('tipo') tipo?: string,
    @Query('busca') busca?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.dashboardService.getAcessosPaginados({
      dataInicio,
      dataFim,
      turmaId: turmaId === undefined ? undefined : Number(turmaId),
      tipo,
      busca,
      page: page === undefined ? undefined : Number(page),
      limit: limit === undefined ? undefined : Number(limit),
    });
  }

  @Get('turmas/:id/frequencia')
  async getFrequenciaTurma(
    @Param('id', ParseIntPipe) id: number,
    @Query('data') data?: string,
  ) {
    return this.dashboardService.getFrequenciaTurma(id, data);
  }

  @Get('export')
  @Header('Content-Type', 'text/csv; charset=utf-8')
  @Header('Content-Disposition', 'attachment; filename="relatorio_acessos.csv"')
  async exportCsv(
    @Query('dataInicio') dataInicio?: string,
    @Query('dataFim') dataFim?: string,
    @Query('turmaId') turmaId?: string,
    @Query('tipo') tipo?: string,
    @Query('busca') busca?: string,
  ) {
    return this.dashboardService.exportCsv({
      dataInicio,
      dataFim,
      turmaId: turmaId === undefined ? undefined : Number(turmaId),
      tipo,
      busca,
    });
  }
}
