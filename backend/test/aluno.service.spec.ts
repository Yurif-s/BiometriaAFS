import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';

import { AlunoService } from '../src/services/aluno.service';
import { AlunoRepository } from '../src/repositories/aluno.repository';
import { TurmaRepository } from '../src/repositories/turma.repository';
import { BiometriaGateway } from '../src/gateways/biometria.gateway';
import { AcessoRepository } from '../src/repositories/acesso.repository';

describe('AlunoService', () => {
  let service: AlunoService;
  let alunoRepository: jest.Mocked<AlunoRepository>;
  let turmaRepository: jest.Mocked<TurmaRepository>;
  let biometriaGateway: jest.Mocked<BiometriaGateway>;
  let acessoRepository: jest.Mocked<AcessoRepository>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AlunoService,
        {
          provide: AlunoRepository,
          useValue: {
            create: jest.fn(),
            findAll: jest.fn(),
            findById: jest.fn(),
            findByMatricula: jest.fn(),
            findByBiometria: jest.fn(),
            findByTurmaId: jest.fn(),
            findPresentesSemSaidaDesde: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
          },
        },
        {
          provide: TurmaRepository,
          useValue: {
            findById: jest.fn(),
          },
        },
        {
          provide: BiometriaGateway,
          useValue: {
            emitirBiometriaLida: jest.fn(),
            emitirBiometriaFalha: jest.fn(),
          },
        },
        {
          provide: AcessoRepository,
          useValue: {
            create: jest.fn(),
            findAll: jest.fn(),
            findToday: jest.fn(),
            findById: jest.fn(),
            findSaidaByAlunoHorario: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AlunoService>(AlunoService);
    alunoRepository = module.get(AlunoRepository);
    turmaRepository = module.get(TurmaRepository);
    biometriaGateway = module.get(BiometriaGateway);
    acessoRepository = module.get(AcessoRepository);
    jest.useRealTimers();
  });

  // =========================
  // REGISTRAR LEITURA
  // =========================
  describe('registrarLeitura', () => {
    it('deve registrar leitura de um aluno cadastrado e emitir evento', async () => {
      jest.useFakeTimers().setSystemTime(new Date('2026-06-11T07:20:00'));
      const alunoMock = { id: 1, nome: 'João', biometria: 123, entrada: null, saida: null, turma_id: 1 } as any;
      const updatedAlunoMock = {
        ...alunoMock,
        entrada: new Date('2026-06-11T07:20:00'),
        saida: new Date('2026-06-11T16:35:00'),
      };
      alunoRepository.findByBiometria.mockResolvedValue(alunoMock);
      alunoRepository.update.mockResolvedValue(updatedAlunoMock);
      turmaRepository.findById.mockResolvedValue({ id: 1, nome: 'Turma A' } as any);

      const result = await service.registrarLeitura(123);

      expect(result).toEqual({ encontrado: true, aluno: updatedAlunoMock });
      expect(alunoRepository.findByBiometria).toHaveBeenCalledWith(123);
      expect(biometriaGateway.emitirBiometriaLida).toHaveBeenCalledWith(
        123,
        'João',
        undefined,
        'Turma A',
        expect.any(Date),
        new Date('2026-06-11T16:35:00')
      );
      expect(acessoRepository.create).toHaveBeenCalledWith({
        aluno_id: 1,
        tipo: 'Entrada',
        horario: new Date('2026-06-11T07:20:00'),
      });
      expect(acessoRepository.create).toHaveBeenCalledWith({
        aluno_id: 1,
        tipo: 'Saída',
        horario: new Date('2026-06-11T16:35:00'),
      });
    });

    it('deve registrar entrada no dia seguinte mesmo se o aluno saiu no dia anterior', async () => {
      jest.useFakeTimers().setSystemTime(new Date('2026-06-11T07:20:00'));
      const ontemEntrada = new Date('2026-06-10T07:15:00');
      const ontemSaida = new Date('2026-06-10T16:35:00');
      const alunoMock = {
        id: 1,
        nome: 'João',
        biometria: 123,
        entrada: ontemEntrada,
        saida: ontemSaida,
        turma_id: 1,
      } as any;
      const updatedAlunoMock = {
        ...alunoMock,
        entrada: new Date('2026-06-11T07:20:00'),
        saida: new Date('2026-06-11T16:35:00'),
      };
      alunoRepository.findByBiometria.mockResolvedValue(alunoMock);
      alunoRepository.update.mockResolvedValue(updatedAlunoMock);
      turmaRepository.findById.mockResolvedValue({ id: 1, nome: 'Turma A' } as any);

      await service.registrarLeitura(123);

      expect(alunoRepository.update).toHaveBeenCalledWith(1, {
        entrada: new Date('2026-06-11T07:20:00'),
        saida: new Date('2026-06-11T16:35:00'),
      });
      expect(acessoRepository.create).toHaveBeenCalledWith({
        aluno_id: 1,
        tipo: 'Entrada',
        horario: new Date('2026-06-11T07:20:00'),
      });
      expect(acessoRepository.create).toHaveBeenCalledWith({
        aluno_id: 1,
        tipo: 'Saída',
        horario: new Date('2026-06-11T16:35:00'),
      });
    });

    it('deve substituir a saída padrão pelo horário real quando sair antes das 16:35', async () => {
      jest.useFakeTimers().setSystemTime(new Date('2026-06-11T10:15:00'));
      const saidaPadrao = new Date('2026-06-11T16:35:00');
      const alunoMock = {
        id: 1,
        nome: 'João',
        biometria: 123,
        entrada: new Date('2026-06-11T07:20:00'),
        saida: saidaPadrao,
        turma_id: 1,
      } as any;
      const updatedAlunoMock = {
        ...alunoMock,
        saida: new Date('2026-06-11T10:15:00'),
      };
      alunoRepository.findByBiometria.mockResolvedValue(alunoMock);
      alunoRepository.update.mockResolvedValue(updatedAlunoMock);
      turmaRepository.findById.mockResolvedValue({ id: 1, nome: 'Turma A' } as any);
      acessoRepository.findSaidaByAlunoHorario.mockResolvedValue({
        id: 10,
        aluno_id: 1,
        tipo: 'Saída',
        horario: saidaPadrao,
      } as any);

      await service.registrarLeitura(123);

      expect(alunoRepository.update).toHaveBeenCalledWith(1, {
        saida: new Date('2026-06-11T10:15:00'),
      });
      expect(acessoRepository.update).toHaveBeenCalledWith(10, {
        horario: new Date('2026-06-11T10:15:00'),
      });
    });

    it('deve registrar leitura de biometria não cadastrada e emitir evento com nome indefinido', async () => {
      alunoRepository.findByBiometria.mockResolvedValue(null);

      const result = await service.registrarLeitura(456);

      expect(result).toEqual({ encontrado: false, aluno: undefined });
      expect(alunoRepository.findByBiometria).toHaveBeenCalledWith(456);
      expect(biometriaGateway.emitirBiometriaLida).toHaveBeenCalledWith(
        456,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined
      );
    });
  });

  describe('marcarSaidasPadraoSeNecessario', () => {
    it('não deve marcar saída automática antes das 16:35', async () => {
      await service.marcarSaidasPadraoSeNecessario(new Date('2026-06-11T16:34:00'));

      expect(alunoRepository.findPresentesSemSaidaDesde).not.toHaveBeenCalled();
    });

    it('deve marcar saída automática às 16:35 para alunos presentes sem saída', async () => {
      const alunoMock = {
        id: 1,
        nome: 'Maria',
        entrada: new Date('2026-06-11T07:10:00'),
        saida: null,
      } as any;
      alunoRepository.findPresentesSemSaidaDesde.mockResolvedValue([alunoMock]);
      alunoRepository.update.mockResolvedValue({
        ...alunoMock,
        saida: new Date('2026-06-11T16:35:00'),
      });

      await service.marcarSaidasPadraoSeNecessario(new Date('2026-06-11T16:35:10'));

      expect(alunoRepository.findPresentesSemSaidaDesde).toHaveBeenCalledWith(
        new Date('2026-06-11T00:00:00'),
      );
      expect(alunoRepository.update).toHaveBeenCalledWith(1, {
        saida: new Date('2026-06-11T16:35:00'),
      });
      expect(acessoRepository.create).toHaveBeenCalledWith({
        aluno_id: 1,
        tipo: 'Saída',
        horario: new Date('2026-06-11T16:35:00'),
      });
    });
  });

  // =========================
  // CREATE
  // =========================
  describe('create', () => {
    it('deve criar um aluno com sucesso', async () => {
      turmaRepository.findById.mockResolvedValue({ id: 1 } as any);
      alunoRepository.findByMatricula.mockResolvedValue(null);
      alunoRepository.findByBiometria.mockResolvedValue(null);

      alunoRepository.create.mockResolvedValue({
        id: 1,
        nome: 'João',
      } as any);

      const dto = {
        nome: 'João',
        matricula: '123',
        biometria: 1,
        turma_id: 1,
        entrada: new Date(),
        saida: new Date(),
      };

      const result = await service.create(dto as any);

      expect(result).toHaveProperty('id');
      expect(alunoRepository.create).toHaveBeenCalled();
    });

    it('deve lançar NotFoundException se turma não existir', async () => {
      turmaRepository.findById.mockResolvedValue(null);

      await expect(
        service.create({ turma_id: 1 } as any),
      ).rejects.toThrow(NotFoundException);
    });

    it('deve lançar ConflictException se matrícula já existir', async () => {
      turmaRepository.findById.mockResolvedValue({ id: 1 } as any);
      alunoRepository.findByMatricula.mockResolvedValue({ id: 1 } as any);

      await expect(
        service.create({
          matricula: '123',
          biometria: 1,
          turma_id: 1,
        } as any),
      ).rejects.toThrow(ConflictException);
    });

    it('deve lançar ConflictException se biometria já existir', async () => {
      turmaRepository.findById.mockResolvedValue({ id: 1 } as any);
      alunoRepository.findByMatricula.mockResolvedValue(null);
      alunoRepository.findByBiometria.mockResolvedValue({ id: 1 } as any);

      await expect(
        service.create({
          matricula: '123',
          biometria: 1,
          turma_id: 1,
        } as any),
      ).rejects.toThrow(ConflictException);
    });
  });

  // =========================
  // FIND ALL
  // =========================
  describe('findAll', () => {
    it('deve retornar lista de alunos', async () => {
      alunoRepository.findAll.mockResolvedValue([{ id: 1 }] as any);

      const result = await service.findAll();

      expect(result).toHaveLength(1);
    });
  });

  // =========================
  // FIND BY ID
  // =========================
  describe('findById', () => {
    it('deve retornar aluno por id', async () => {
      alunoRepository.findById.mockResolvedValue({ id: 1 } as any);

      const result = await service.findById(1);

      expect(result.id).toBe(1);
    });

    it('deve lançar NotFoundException se aluno não existir', async () => {
      alunoRepository.findById.mockResolvedValue(null);

      await expect(service.findById(1)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // =========================
  // UPDATE
  // =========================
  describe('update', () => {
    it('deve atualizar aluno com sucesso', async () => {
      alunoRepository.findById.mockResolvedValue({ id: 1 } as any);
      alunoRepository.findByMatricula.mockResolvedValue(null);
      alunoRepository.findByBiometria.mockResolvedValue(null);

      alunoRepository.update.mockResolvedValue({
        id: 1,
        nome: 'Novo Nome',
      } as any);

      const result = await service.update(1, {
        nome: 'Novo Nome',
      } as any);

      expect(result.nome).toBe('Novo Nome');
    });

    it('deve lançar NotFoundException se aluno não existir', async () => {
      alunoRepository.findById.mockResolvedValue(null);

      await expect(
        service.update(1, {}),
      ).rejects.toThrow(NotFoundException);
    });

    it('deve lançar ConflictException se matrícula já estiver em uso', async () => {
      alunoRepository.findById.mockResolvedValue({ id: 1 } as any);
      alunoRepository.findByMatricula.mockResolvedValue({ id: 2 } as any);

      await expect(
        service.update(1, { matricula: '123' } as any),
      ).rejects.toThrow(ConflictException);
    });

    it('deve lançar ConflictException se biometria já estiver em uso', async () => {
      alunoRepository.findById.mockResolvedValue({ id: 1 } as any);
      alunoRepository.findByMatricula.mockResolvedValue(null);
      alunoRepository.findByBiometria.mockResolvedValue({ id: 2 } as any);

      await expect(
        service.update(1, { biometria: 10 } as any),
      ).rejects.toThrow(ConflictException);
    });
  });

  // =========================
  // DELETE
  // =========================
  describe('delete', () => {
    it('deve deletar aluno com sucesso', async () => {
      alunoRepository.findById.mockResolvedValue({ id: 1, biometria: 1 } as any);

      await service.delete(1);

      expect(alunoRepository.delete).toHaveBeenCalledWith(1);
    });

    it('deve lançar NotFoundException se aluno não existir', async () => {
      alunoRepository.findById.mockResolvedValue(null);

      await expect(service.delete(1)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
