import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { TurmaRepository } from '../repositories/turma.repository';
import { CreateTurmaDto } from '../dtos/create-turma.dto';
import { UpdateTurmaDto } from '../dtos/update-turma.dto';
import { Turma } from '@prisma/client';

@Injectable()
export class TurmaService {
  constructor(private readonly turmaRepository: TurmaRepository) {}

  async create(createTurmaDto: CreateTurmaDto): Promise<Turma> {
    try {
      return await this.turmaRepository.create({
        nome: createTurmaDto.nome,
        ano: createTurmaDto.ano,
      } as Turma);
    } catch (error) {
      throw new BadRequestException('Erro ao criar turma: ' + error.message);
    }
  }

  async findAll(): Promise<Turma[]> {
    return this.turmaRepository.findAll();
  }

  async findById(id: number): Promise<Turma> {
    const turma = await this.turmaRepository.findById(id);
    if (!turma) {
      throw new NotFoundException(`Turma com ID ${id} não encontrada`);
    }
    return turma;
  }

  async findByAno(ano: number): Promise<Turma[]> {
    return this.turmaRepository.findByAno(ano);
  }

  async update(id: number, updateTurmaDto: UpdateTurmaDto): Promise<Turma> {
    await this.findById(id);

    try {
      return await this.turmaRepository.update(id, updateTurmaDto as Partial<Turma>);
    } catch (error) {
      throw new BadRequestException('Erro ao atualizar turma: ' + error.message);
    }
  }

  async delete(id: number): Promise<void> {
    await this.findById(id);

    try {
      await this.turmaRepository.delete(id);
    } catch (error) {
      throw new BadRequestException('Erro ao deletar turma: ' + error.message);
    }
  }
}