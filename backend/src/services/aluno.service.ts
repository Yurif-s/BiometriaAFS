import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { Aluno } from '@prisma/client';
import { AlunoRepository } from '../repositories/aluno.repository';
import { TurmaRepository } from '../repositories/turma.repository';
import { CreateAlunoDto } from '../dtos/create-aluno.dto';
import { UpdateAlunoDto } from '../dtos/update-aluno.dto';

@Injectable()
export class AlunoService {
  constructor(
    private readonly alunoRepository: AlunoRepository,
    private readonly turmaRepository: TurmaRepository,
  ) {}

  async create(createAlunoDto: CreateAlunoDto): Promise<Aluno> {
    const turma = await this.turmaRepository.findById(createAlunoDto.turma_id);
    if (!turma) {
      throw new NotFoundException(
        `Turma com ID ${createAlunoDto.turma_id} não encontrada`,
      );
    }

    const existingByMatricula = await this.alunoRepository.findByMatricula(
      createAlunoDto.matricula,
    );
    if (existingByMatricula) {
      throw new ConflictException(
        `Matrícula ${createAlunoDto.matricula} já cadastrada`,
      );
    }

    const existingByBiometria = await this.alunoRepository.findByBiometria(
      createAlunoDto.biometria,
    );
    if (existingByBiometria) {
      throw new ConflictException(
        `Biometria ${createAlunoDto.biometria} já cadastrada`,
      );
    }

    try {
      return await this.alunoRepository.create({
        id: 0, // gerado pelo banco
        matricula: createAlunoDto.matricula,
        nome: createAlunoDto.nome,
        biometria: createAlunoDto.biometria,
        entrada: createAlunoDto.entrada ? new Date(createAlunoDto.entrada) : undefined,
        saida: createAlunoDto.saida ? new Date(createAlunoDto.saida) : undefined,
        turma_id: createAlunoDto.turma_id,
      } as Aluno);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro desconhecido';
      throw new BadRequestException('Erro ao criar aluno: ' + message);
    }
  }

  async findAll(): Promise<Aluno[]> {
    return this.alunoRepository.findAll();
  }

  async findById(id: number): Promise<Aluno> {
    const aluno = await this.alunoRepository.findById(id);
    if (!aluno) {
      throw new NotFoundException(`Aluno com ID ${id} não encontrado`);
    }
    return aluno;
  }

  async findByMatricula(matricula: string): Promise<Aluno> {
    const aluno = await this.alunoRepository.findByMatricula(matricula);
    if (!aluno) {
      throw new NotFoundException(
        `Aluno com matrícula ${matricula} não encontrado`,
      );
    }
    return aluno;
  }

  /**
   * Chamado pelo ESP32 ao realizar leitura da digital.
   * Retorna os dados do aluno associado àquele template de biometria.
   */
  async findByBiometria(biometria: number): Promise<Aluno> {
    const aluno = await this.alunoRepository.findByBiometria(biometria);
    if (!aluno) {
      throw new NotFoundException(
        `Nenhum aluno encontrado para a biometria ${biometria}`,
      );
    }
    return aluno;
  }

  async findByTurmaId(turma_id: number): Promise<Aluno[]> {
    const turma = await this.turmaRepository.findById(turma_id);
    if (!turma) {
      throw new NotFoundException(
        `Turma com ID ${turma_id} não encontrada`,
      );
    }
    return this.alunoRepository.findByTurmaId(turma_id);
  }

  async update(id: number, updateAlunoDto: UpdateAlunoDto): Promise<Aluno> {
    await this.findById(id);

    if (updateAlunoDto.turma_id) {
      const turma = await this.turmaRepository.findById(
        updateAlunoDto.turma_id,
      );
      if (!turma) {
        throw new NotFoundException(
          `Turma com ID ${updateAlunoDto.turma_id} não encontrada`,
        );
      }
    }

    if (updateAlunoDto.matricula) {
      const existing = await this.alunoRepository.findByMatricula(
        updateAlunoDto.matricula,
      );
      if (existing && existing.id !== id) {
        throw new ConflictException(
          `Matrícula ${updateAlunoDto.matricula} já está em uso`,
        );
      }
    }

    if (updateAlunoDto.biometria !== undefined) {
      const existing = await this.alunoRepository.findByBiometria(
        updateAlunoDto.biometria,
      );
      if (existing && existing.id !== id) {
        throw new ConflictException(
          `Biometria ${updateAlunoDto.biometria} já está em uso`,
        );
      }
    }

    try {
      return await this.alunoRepository.update(id, {
        ...updateAlunoDto,
        entrada: updateAlunoDto.entrada
          ? new Date(updateAlunoDto.entrada)
          : undefined,
        saida: updateAlunoDto.saida
          ? new Date(updateAlunoDto.saida)
          : undefined,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro desconhecido';
      throw new BadRequestException(
        'Erro ao atualizar aluno: ' + message,
      );
    }
  }

  async delete(id: number): Promise<void> {
    await this.findById(id);

    try {
      await this.alunoRepository.delete(id);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro desconhecido';
      throw new BadRequestException('Erro ao deletar aluno: ' + message);
    }
  }
}