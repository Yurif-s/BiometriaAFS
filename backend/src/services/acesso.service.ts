import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { AcessoRepository } from '../repositories/acesso.repository';
import { AlunoRepository } from '../repositories/aluno.repository';
import { CreateAcessoDto } from '../dtos/create-acesso.dto';
import { UpdateAcessoDto } from '../dtos/update-acesso.dto';
import { Acesso } from '@prisma/client';

@Injectable()
export class AcessoService {
  constructor(
    private readonly acessoRepository: AcessoRepository,
    private readonly alunoRepository: AlunoRepository,
  ) {}

  async create(createAcessoDto: CreateAcessoDto): Promise<Acesso> {
    try {
      return await this.acessoRepository.create({
        tipo: createAcessoDto.tipo,
        aluno_id: createAcessoDto.aluno_id,
        horario: createAcessoDto.horario ? new Date(createAcessoDto.horario) : new Date(),
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro desconhecido';
      throw new BadRequestException('Erro ao registrar acesso: ' + message);
    }
  }

  async findAll(): Promise<Acesso[]> {
    return this.acessoRepository.findAll();
  }

  async findToday(): Promise<Acesso[]> {
    return this.acessoRepository.findToday();
  }

  async findById(id: number): Promise<Acesso> {
    const acesso = await this.acessoRepository.findById(id);
    if (!acesso) {
      throw new NotFoundException(`Acesso com ID ${id} não encontrado`);
    }
    return acesso;
  }

  async update(id: number, updateAcessoDto: UpdateAcessoDto): Promise<Acesso> {
    const acessoAntigo = await this.findById(id);

    try {
      const acessoAtualizado = await this.acessoRepository.update(id, {
        tipo: updateAcessoDto.tipo,
        horario: updateAcessoDto.horario ? new Date(updateAcessoDto.horario) : undefined,
      });

      await this.sincronizarPresencaSeHoje(acessoAntigo.aluno_id, acessoAntigo.horario);
      await this.sincronizarPresencaSeHoje(acessoAtualizado.aluno_id, acessoAtualizado.horario);

      return acessoAtualizado;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro desconhecido';
      throw new BadRequestException('Erro ao atualizar acesso: ' + message);
    }
  }

  async delete(id: number): Promise<void> {
    const acesso = await this.findById(id);
    try {
      await this.acessoRepository.delete(id);
      await this.sincronizarPresencaSeHoje(acesso.aluno_id, acesso.horario);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro desconhecido';
      throw new BadRequestException('Erro ao deletar acesso: ' + message);
    }
  }

  /**
   * Aluno.entrada/saida (usado pelos KPIs "Presentes Agora"/"Ausentes Hoje")
   * e o histórico de Acesso (usado nos Relatórios) são duas fontes de
   * presença independentes. Uma edição/exclusão manual de um Acesso de HOJE
   * precisa recalcular esses campos a partir do histórico do dia, senão o
   * dashboard e os relatórios divergem. Edições em dias passados não mexem
   * no estado "atual" do aluno.
   */
  private async sincronizarPresencaSeHoje(alunoId: number, diaAfetado: Date): Promise<void> {
    const hoje = new Date();
    if (!this.mesmoDia(diaAfetado, hoje)) {
      return;
    }

    const acessosDoDia = await this.acessoRepository.findByAlunoNoDia(
      alunoId,
      this.inicioDoDia(hoje),
      this.fimDoDia(hoje),
    );

    const ultimaEntrada = [...acessosDoDia].reverse().find((a) => a.tipo === 'Entrada');
    const ultimaSaida = [...acessosDoDia].reverse().find((a) => a.tipo === 'Saída');

    await this.alunoRepository.update(alunoId, {
      entrada: ultimaEntrada?.horario ?? null,
      saida: ultimaSaida?.horario ?? null,
    });
  }

  private mesmoDia(a: Date, b: Date): boolean {
    return (
      a.getFullYear() === b.getFullYear() &&
      a.getMonth() === b.getMonth() &&
      a.getDate() === b.getDate()
    );
  }

  private inicioDoDia(data: Date): Date {
    const d = new Date(data);
    d.setHours(0, 0, 0, 0);
    return d;
  }

  private fimDoDia(data: Date): Date {
    const d = new Date(data);
    d.setHours(23, 59, 59, 999);
    return d;
  }
}
