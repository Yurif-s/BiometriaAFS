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
import { BiometriaGateway } from '../gateways/biometria.gateway';

@Injectable()
export class AlunoService {
  private pendingEnrollmentId: number | null = null;
  private pendingEnrollmentAcked = false;
  private pendingEnrollmentTime = 0;

  private pendingDeletions: number[] = [];
  private reservedIds = new Map<number, number>(); // biometriaId -> timestamp

  constructor(
    private readonly alunoRepository: AlunoRepository,
    private readonly turmaRepository: TurmaRepository,
    private readonly biometriaGateway: BiometriaGateway,
  ) { }

  async iniciarCadastro(): Promise<{ id: number }> {
    const alunos = await this.alunoRepository.findAll();
    const ocupados = new Set(alunos.map(a => a.biometria));

    let proximoId = -1;
    for (let i = 1; i <= 127; i++) {
      if (!ocupados.has(i) && !this.reservedIds.has(i)) {
        proximoId = i;
        break;
      }
    }

    if (proximoId === -1) {
      throw new BadRequestException(
        'Limite de biometrias cadastradas no sensor atingido (máx. 127).'
      );
    }

    this.pendingEnrollmentId = proximoId;
    this.pendingEnrollmentAcked = false;
    this.pendingEnrollmentTime = Date.now();
    this.reservedIds.set(proximoId, Date.now());

    return { id: proximoId };
  }

  queueDeletion(id: number) {
    if (!this.pendingDeletions.includes(id)) {
      this.pendingDeletions.push(id);
    }
  }

  async cleanExpiredReservations() {
    const now = Date.now();
    const TIMEOUT = 120000; // 2 minutos
    const expiredIds: number[] = [];
    for (const [id, timestamp] of this.reservedIds.entries()) {
      if (now - timestamp > TIMEOUT) {
        expiredIds.push(id);
      }
    }

    for (const id of expiredIds) {
      this.reservedIds.delete(id);
      const aluno = await this.alunoRepository.findByBiometria(id);
      if (!aluno) {
        this.queueDeletion(id);
      }
    }
  }

  async obterSolicitacaoCadastro(): Promise<{ cadastrar: boolean; deletar: boolean; id?: number }> {
    await this.cleanExpiredReservations();

    // 1. Verificar se há exclusões pendentes
    if (this.pendingDeletions.length > 0) {
      const id = this.pendingDeletions.shift();
      return { cadastrar: false, deletar: true, id };
    }

    // 2. Verificar se há cadastro pendente
    if (this.pendingEnrollmentId !== null) {
      if (Date.now() - this.pendingEnrollmentTime > 30000) {
        this.pendingEnrollmentId = null;
        this.pendingEnrollmentAcked = false;
        return { cadastrar: false, deletar: false };
      }

      if (!this.pendingEnrollmentAcked) {
        return { cadastrar: true, deletar: false, id: this.pendingEnrollmentId };
      }
    }

    return { cadastrar: false, deletar: false };
  }

  confirmarSolicitacao(): void {
    if (this.pendingEnrollmentId !== null) {
      this.pendingEnrollmentAcked = true;
    }
  }

  async cancelarCadastro(id: number): Promise<void> {
    this.reservedIds.delete(id);
    if (this.pendingEnrollmentId === id) {
      this.pendingEnrollmentId = null;
      this.pendingEnrollmentAcked = false;
    }
    this.queueDeletion(id);
  }

  async registrarLeitura(biometria: number) {
    const aluno = await this.alunoRepository.findByBiometria(biometria);

    // Notifica o frontend via WebSocket independente de ter encontrado ou não
    this.biometriaGateway.emitirBiometriaLida(
      biometria,
      aluno?.nome,
    );

    return { encontrado: !!aluno, aluno: aluno ?? undefined };
  }

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
      const novoAluno = await this.alunoRepository.create({
        id: 0, // gerado pelo banco
        matricula: createAlunoDto.matricula,
        nome: createAlunoDto.nome,
        biometria: createAlunoDto.biometria,
        entrada: createAlunoDto.entrada ? new Date(createAlunoDto.entrada) : undefined,
        saida: createAlunoDto.saida ? new Date(createAlunoDto.saida) : undefined,
        turma_id: createAlunoDto.turma_id,
      } as Aluno);

      // Remove das reservas e limpa solicitação pendente
      this.reservedIds.delete(createAlunoDto.biometria);
      if (this.pendingEnrollmentId === createAlunoDto.biometria) {
        this.pendingEnrollmentId = null;
        this.pendingEnrollmentAcked = false;
      }

      return novoAluno;
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
    const aluno = await this.findById(id);

    try {
      await this.alunoRepository.delete(id);
      this.queueDeletion(aluno.biometria);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro desconhecido';
      throw new BadRequestException('Erro ao deletar aluno: ' + message);
    }
  }
}