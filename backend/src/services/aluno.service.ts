import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ConflictException,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { Aluno } from '@prisma/client';
import { AlunoRepository, AlunoComTurma } from '../repositories/aluno.repository';
import { TurmaRepository } from '../repositories/turma.repository';
import { CreateAlunoDto } from '../dtos/create-aluno.dto';
import { UpdateAlunoDto } from '../dtos/update-aluno.dto';
import { BiometriaGateway } from '../gateways/biometria.gateway';
import { AcessoRepository } from '../repositories/acesso.repository';

@Injectable()
export class AlunoService implements OnModuleInit, OnModuleDestroy {
  private static readonly HORA_SAIDA_PADRAO = 16;
  private static readonly MINUTO_SAIDA_PADRAO = 35;

  private pendingEnrollmentId: number | null = null;
  private pendingEnrollmentAcked = false;
  private pendingEnrollmentTime = 0;
  private autoSaidaInterval: NodeJS.Timeout | null = null;

  private pendingDeletions: number[] = [];
  private reservedIds = new Map<number, number>(); // biometriaId -> timestamp

  constructor(
    private readonly alunoRepository: AlunoRepository,
    private readonly turmaRepository: TurmaRepository,
    private readonly biometriaGateway: BiometriaGateway,
    private readonly acessoRepository: AcessoRepository,
  ) { }

  onModuleInit() {
    this.autoSaidaInterval = setInterval(() => {
      void this.marcarSaidasPadraoSeNecessario();
    }, 60_000);

    void this.marcarSaidasPadraoSeNecessario();
  }

  onModuleDestroy() {
    if (this.autoSaidaInterval) {
      clearInterval(this.autoSaidaInterval);
    }
  }

  private inicioDoDia(data: Date): Date {
    const inicio = new Date(data);
    inicio.setHours(0, 0, 0, 0);
    return inicio;
  }

  private mesmoDia(a: Date | null, b: Date): boolean {
    return !!a && a >= this.inicioDoDia(b);
  }

  private deveMarcarSaidaPadrao(agora: Date): boolean {
    return agora >= this.saidaPadraoPara(agora);
  }

  private saidaPadraoPara(data: Date): Date {
    const saidaPadrao = new Date(data);
    saidaPadrao.setHours(
      AlunoService.HORA_SAIDA_PADRAO,
      AlunoService.MINUTO_SAIDA_PADRAO,
      0,
      0,
    );

    return saidaPadrao;
  }

  private ehSaidaPadrao(data: Date | null, referencia: Date): boolean {
    return !!data && data.getTime() === this.saidaPadraoPara(referencia).getTime();
  }

  private async registrarAcesso(
    alunoId: number,
    tipo: 'Entrada' | 'Saída',
    horario: Date,
  ) {
    await this.acessoRepository.create({
      aluno_id: alunoId,
      tipo,
      horario,
    });
  }

  private async atualizarOuCriarSaidaPadrao(
    alunoId: number,
    saidaPadrao: Date,
    saidaReal: Date,
  ) {
    const acessoSaidaPadrao = await this.acessoRepository.findSaidaByAlunoHorario(
      alunoId,
      saidaPadrao,
    );

    if (acessoSaidaPadrao) {
      await this.acessoRepository.update(acessoSaidaPadrao.id, {
        horario: saidaReal,
      });
      return;
    }

    await this.registrarAcesso(alunoId, 'Saída', saidaReal);
  }

  async marcarSaidasPadraoSeNecessario(agora = new Date()): Promise<void> {
    if (!this.deveMarcarSaidaPadrao(agora)) {
      return;
    }

    const presentes = await this.alunoRepository.findPresentesSemSaidaDesde(
      this.inicioDoDia(agora),
    );
    const saidaPadrao = this.saidaPadraoPara(agora);

    for (const aluno of presentes) {
      await this.alunoRepository.update(aluno.id, { saida: saidaPadrao });
      await this.registrarAcesso(aluno.id, 'Saída', saidaPadrao);
    }
  }

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
    console.log(`[AlunoService] queueDeletion chamado para o ID: ${id}`);
    console.trace('[AlunoService] Rastreio de quem chamou queueDeletion:');
    if (!this.pendingDeletions.includes(id)) {
      this.pendingDeletions.push(id);
    }
  }

  async cleanExpiredReservations() {
    const now = Date.now();
    const TIMEOUT = 600000; // 10 minutos
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

  /**
   * Registra a Entrada do dia (e a Saída padrão prevista, se ainda não passou)
   * em paralelo: são escritas independentes, não há motivo para serializar
   * os round-trips ao banco no caminho crítico da leitura biométrica.
   */
  private async registrarEntrada(
    alunoId: number,
    agora: Date,
    saidaPadrao: Date,
  ): Promise<AlunoComTurma> {
    const saida = agora < saidaPadrao ? saidaPadrao : null;

    const acessosPendentes: Promise<void>[] = [this.registrarAcesso(alunoId, 'Entrada', agora)];
    if (saida) {
      acessosPendentes.push(this.registrarAcesso(alunoId, 'Saída', saida));
    }

    const [alunoAtualizado] = await Promise.all([
      this.alunoRepository.update(alunoId, { entrada: agora, saida }),
      ...acessosPendentes,
    ]);

    return alunoAtualizado;
  }

  async registrarLeitura(biometria: number) {
    const aluno = await this.alunoRepository.findByBiometria(biometria);

    let updatedAluno = aluno;
    let tipoAcesso: 'Entrada' | 'Saída' = 'Entrada';
    const agora = new Date();

    if (aluno) {
      const entradaHoje = this.mesmoDia(aluno.entrada, agora);
      const saidaPadrao = this.saidaPadraoPara(agora);
      const saidaPadraoFutura = this.ehSaidaPadrao(aluno.saida, agora) && agora < saidaPadrao;
      const saidaDepoisDaEntrada =
        !!aluno.saida && !!aluno.entrada && aluno.saida > aluno.entrada;

      if (!entradaHoje) {
        updatedAluno = await this.registrarEntrada(aluno.id, agora, saidaPadrao);
        tipoAcesso = 'Entrada';
      } else if (!saidaDepoisDaEntrada || saidaPadraoFutura) {
        const [alunoAtualizado] = await Promise.all([
          this.alunoRepository.update(aluno.id, { saida: agora }),
          this.atualizarOuCriarSaidaPadrao(aluno.id, saidaPadrao, agora),
        ]);
        updatedAluno = alunoAtualizado;
        tipoAcesso = 'Saída';
      } else {
        updatedAluno = await this.registrarEntrada(aluno.id, agora, saidaPadrao);
        tipoAcesso = 'Entrada';
      }
    }

    // updatedAluno já vem com a turma incluída (ver AlunoRepository) — evita
    // um segundo round-trip ao banco só para buscar o nome da turma.
    const nomeTurma = updatedAluno?.turma?.nome;

    // Notifica o frontend via WebSocket independente de ter encontrado ou não
    this.biometriaGateway.emitirBiometriaLida(
      biometria,
      updatedAluno?.nome,
      updatedAluno?.matricula,
      nomeTurma,
      updatedAluno?.entrada,
      updatedAluno?.saida,
      aluno ? tipoAcesso : undefined,
      aluno ? agora : undefined,
    );

    return { encontrado: !!aluno, aluno: updatedAluno ?? undefined };
  }

  async registrarFalha() {
    this.biometriaGateway.emitirBiometriaFalha();
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
