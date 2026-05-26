import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { AcessoRepository } from '../repositories/acesso.repository';
import { CreateAcessoDto } from '../dtos/create-acesso.dto';
import { UpdateAcessoDto } from '../dtos/update-acesso.dto';
import { Acesso } from '@prisma/client';

@Injectable()
export class AcessoService {
  constructor(private readonly acessoRepository: AcessoRepository) {}

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
    await this.findById(id);
    
    try {
      return await this.acessoRepository.update(id, {
        tipo: updateAcessoDto.tipo,
        horario: updateAcessoDto.horario ? new Date(updateAcessoDto.horario) : undefined,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro desconhecido';
      throw new BadRequestException('Erro ao atualizar acesso: ' + message);
    }
  }

  async delete(id: number): Promise<void> {
    await this.findById(id);
    try {
      await this.acessoRepository.delete(id);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro desconhecido';
      throw new BadRequestException('Erro ao deletar acesso: ' + message);
    }
  }
}
