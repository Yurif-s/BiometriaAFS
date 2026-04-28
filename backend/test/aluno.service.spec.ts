import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';

import { AlunoService } from '../src/services/aluno.service';
import { AlunoRepository } from '../src/repositories/aluno.repository';
import { TurmaRepository } from '../src/repositories/turma.repository';

describe('AlunoService', () => {
  let service: AlunoService;
  let alunoRepository: jest.Mocked<AlunoRepository>;
  let turmaRepository: jest.Mocked<TurmaRepository>;

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
      ],
    }).compile();

    service = module.get<AlunoService>(AlunoService);
    alunoRepository = module.get(AlunoRepository);
    turmaRepository = module.get(TurmaRepository);
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
      alunoRepository.findById.mockResolvedValue({ id: 1 } as any);

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