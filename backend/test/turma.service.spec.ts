// Evita que o Jest tente carregar o binário do Prisma (não gerado no ambiente de testes)
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn().mockImplementation(() => ({})),
}));

import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { TurmaService } from 'services/turma.service';
import { TurmaRepository } from 'repositories/turma.repository';
import { CreateTurmaDto } from 'dtos/create-turma.dto';
import { UpdateTurmaDto } from 'dtos/update-turma.dto';
import { Turma } from '@prisma/client';

// ─── Fixtures ────────────────────────────────────────────────────────────────

const makeTurma = (overrides: Partial<Turma> = {}): Turma => ({
  id: 1,
  nome: 'Turma A',
  ano: 2025,
  ...overrides,
});

const makeTurmaList = (): Turma[] => [
  makeTurma({ id: 1, nome: 'Turma A', ano: 2025 }),
  makeTurma({ id: 2, nome: 'Turma B', ano: 2025 }),
  makeTurma({ id: 3, nome: 'Turma C', ano: 2026 }),
];

// ─── Mock do Repository ───────────────────────────────────────────────────────

const mockTurmaRepository = () => ({
  create: jest.fn(),
  findAll: jest.fn(),
  findById: jest.fn(),
  findByAno: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
});

// ─── Suite ───────────────────────────────────────────────────────────────────

describe('TurmaService', () => {
  let service: TurmaService;
  let repository: ReturnType<typeof mockTurmaRepository>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TurmaService,
        { provide: TurmaRepository, useFactory: mockTurmaRepository },
      ],
    }).compile();

    service = module.get<TurmaService>(TurmaService);
    repository = module.get(TurmaRepository);
  });

  afterEach(() => jest.clearAllMocks());

  // ── create ────────────────────────────────────────────────────────────────

  describe('create', () => {
    it('deve criar uma turma e retorná-la', async () => {
      const dto: CreateTurmaDto = { nome: 'Turma A', ano: 2025 };
      const turma = makeTurma();
      repository.create.mockResolvedValue(turma);

      const result = await service.create(dto);

      expect(repository.create).toHaveBeenCalledWith({ nome: dto.nome, ano: dto.ano });
      expect(result).toEqual(turma);
    });

    it('deve lançar BadRequestException quando o repositório falhar', async () => {
      const dto: CreateTurmaDto = { nome: 'Turma A', ano: 2025 };
      repository.create.mockRejectedValue(new Error('DB error'));

      await expect(service.create(dto)).rejects.toThrow(BadRequestException);
      await expect(service.create(dto)).rejects.toThrow('Erro ao criar turma: DB error');
    });
  });

  // ── findAll ───────────────────────────────────────────────────────────────

  describe('findAll', () => {
    it('deve retornar todas as turmas', async () => {
      const turmas = makeTurmaList();
      repository.findAll.mockResolvedValue(turmas);

      const result = await service.findAll();

      expect(repository.findAll).toHaveBeenCalledTimes(1);
      expect(result).toEqual(turmas);
      expect(result).toHaveLength(3);
    });

    it('deve retornar array vazio quando não houver turmas', async () => {
      repository.findAll.mockResolvedValue([]);

      const result = await service.findAll();

      expect(result).toEqual([]);
    });
  });

  // ── findById ──────────────────────────────────────────────────────────────

  describe('findById', () => {
    it('deve retornar a turma quando o ID existir', async () => {
      const turma = makeTurma();
      repository.findById.mockResolvedValue(turma);

      const result = await service.findById(1);

      expect(repository.findById).toHaveBeenCalledWith(1);
      expect(result).toEqual(turma);
    });

    it('deve lançar NotFoundException quando o ID não existir', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(service.findById(99)).rejects.toThrow(NotFoundException);
      await expect(service.findById(99)).rejects.toThrow('Turma com ID 99 não encontrada');
    });
  });

  // ── findByAno ─────────────────────────────────────────────────────────────

  describe('findByAno', () => {
    it('deve retornar as turmas do ano informado', async () => {
      const turmasDe2025 = makeTurmaList().filter((t) => t.ano === 2025);
      repository.findByAno.mockResolvedValue(turmasDe2025);

      const result = await service.findByAno(2025);

      expect(repository.findByAno).toHaveBeenCalledWith(2025);
      expect(result).toHaveLength(2);
      expect(result.every((t) => t.ano === 2025)).toBe(true);
    });

    it('deve retornar array vazio quando nenhuma turma pertencer ao ano', async () => {
      repository.findByAno.mockResolvedValue([]);

      const result = await service.findByAno(1999);

      expect(result).toEqual([]);
    });
  });

  // ── update ────────────────────────────────────────────────────────────────

  describe('update', () => {
    it('deve atualizar e retornar a turma', async () => {
      const turmaOriginal = makeTurma();
      const dto: UpdateTurmaDto = { nome: 'Turma Z' };
      const turmaAtualizada = makeTurma({ nome: 'Turma Z' });

      repository.findById.mockResolvedValue(turmaOriginal);
      repository.update.mockResolvedValue(turmaAtualizada);

      const result = await service.update(1, dto);

      expect(repository.findById).toHaveBeenCalledWith(1);
      expect(repository.update).toHaveBeenCalledWith(1, dto);
      expect(result.nome).toBe('Turma Z');
    });

    it('deve lançar NotFoundException quando a turma não existir', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(service.update(99, { nome: 'X' })).rejects.toThrow(NotFoundException);
      expect(repository.update).not.toHaveBeenCalled();
    });

    it('deve lançar BadRequestException quando o repositório falhar na atualização', async () => {
      repository.findById.mockResolvedValue(makeTurma());
      repository.update.mockRejectedValue(new Error('DB error'));

      await expect(service.update(1, { nome: 'X' })).rejects.toThrow(BadRequestException);
      await expect(service.update(1, { nome: 'X' })).rejects.toThrow('Erro ao atualizar turma: DB error');
    });
  });

  // ── delete ────────────────────────────────────────────────────────────────

  describe('delete', () => {
    it('deve deletar a turma sem retornar valor', async () => {
      repository.findById.mockResolvedValue(makeTurma());
      repository.delete.mockResolvedValue(undefined);

      const result = await service.delete(1);

      expect(repository.findById).toHaveBeenCalledWith(1);
      expect(repository.delete).toHaveBeenCalledWith(1);
      expect(result).toBeUndefined();
    });

    it('deve lançar NotFoundException quando a turma não existir', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(service.delete(99)).rejects.toThrow(NotFoundException);
      expect(repository.delete).not.toHaveBeenCalled();
    });

    it('deve lançar BadRequestException quando o repositório falhar na deleção', async () => {
      repository.findById.mockResolvedValue(makeTurma());
      repository.delete.mockRejectedValue(new Error('DB error'));

      await expect(service.delete(1)).rejects.toThrow(BadRequestException);
      await expect(service.delete(1)).rejects.toThrow('Erro ao deletar turma: DB error');
    });
  });
});