import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/modules/app.module';
import { AlunoRepository } from '../src/repositories/aluno.repository';
import { TurmaRepository } from '../src/repositories/turma.repository';
import { BiometriaGateway } from '../src/gateways/biometria.gateway';
import { PrismaService } from '../src/services/prisma.service';

describe('Aluno Enrollment Flow (e2e)', () => {
  let app: INestApplication<App>;
  let biometriaGateway: jest.Mocked<any>;

  const db = {
    alunos: [] as any[],
    turmas: [
      { id: 1, nome: '1º Ano A', ano: 2026, alunos: [] }
    ] as any[]
  };

  const mockTurmaRepository = {
    findById: jest.fn().mockImplementation(async (id: number) => {
      return db.turmas.find(t => t.id === id) || null;
    }),
  };

  const mockAlunoRepository = {
    findAll: jest.fn().mockImplementation(async () => {
      return db.alunos;
    }),
    create: jest.fn().mockImplementation(async (data: any) => {
      const newAluno = {
        ...data,
        id: db.alunos.length + 1,
      };
      db.alunos.push(newAluno);
      return newAluno;
    }),
    findByMatricula: jest.fn().mockImplementation(async (matricula: string) => {
      return db.alunos.find(a => a.matricula === matricula) || null;
    }),
    findByBiometria: jest.fn().mockImplementation(async (biometria: number) => {
      return db.alunos.find(a => a.biometria === biometria) || null;
    }),
  };

  const mockPrismaService = {
    $connect: jest.fn().mockResolvedValue(undefined),
    $disconnect: jest.fn().mockResolvedValue(undefined),
  };

  const mockBiometriaGateway = {
    emitirBiometriaLida: jest.fn(),
  };

  beforeEach(async () => {
    // Reset db state between runs
    db.alunos = [];

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue(mockPrismaService)
      .overrideProvider(TurmaRepository)
      .useValue(mockTurmaRepository)
      .overrideProvider(AlunoRepository)
      .useValue(mockAlunoRepository)
      .overrideProvider(BiometriaGateway)
      .useValue(mockBiometriaGateway)
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    biometriaGateway = moduleFixture.get(BiometriaGateway);
  });

  afterEach(async () => {
    await app.close();
  });

  it('deve passar por todo o fluxo de cadastro: iniciar-cadastro, polling do leitor, leitura e salvar o aluno', async () => {
    // 1. Ao clicar em coletar a digital no frontend:
    // POST /alunos/biometria/iniciar-cadastro
    // Deve retornar o próximo ID disponível no sensor (como o banco está vazio, deve ser 1)
    const initResponse = await request(app.getHttpServer())
      .post('/alunos/biometria/iniciar-cadastro')
      .expect(201);

    expect(initResponse.body).toEqual({ id: 1 });

    // 2. O leitor biométrico faz polling buscando a solicitação pendente:
    // GET /alunos/biometria/solicitacao
    // Deve retornar cadastrar=true com o ID gerado
    const pollResponse = await request(app.getHttpServer())
      .get('/alunos/biometria/solicitacao')
      .expect(200);

    expect(pollResponse.body).toEqual({ cadastrar: true, id: 1 });

    // 3. Uma segunda chamada de polling deve retornar cadastrar=false (leitura destrutiva)
    const secondPollResponse = await request(app.getHttpServer())
      .get('/alunos/biometria/solicitacao')
      .expect(200);

    expect(secondPollResponse.body).toEqual({ cadastrar: false });

    // 4. O leitor grava a biometria sob o ID 1 e envia a leitura para notificar o frontend:
    // POST /alunos/biometria/leitura
    // O backend deve retornar que o aluno não está cadastrado e disparar evento WebSocket para o front
    const readResponse = await request(app.getHttpServer())
      .post('/alunos/biometria/leitura')
      .send({ biometria: 1 })
      .expect(201);

    expect(readResponse.body).toEqual({ encontrado: false, aluno: undefined });
    expect(biometriaGateway.emitirBiometriaLida).toHaveBeenCalledWith(1, undefined);

    // 5. O frontend recebe a notificação, preenche o ID e salva o aluno:
    // POST /alunos
    // Salvando o aluno preenchido (João, Matrícula 202601) com a biometria 1
    const createResponse = await request(app.getHttpServer())
      .post('/alunos')
      .send({
        nome: 'João Silva',
        matricula: '202601',
        biometria: 1,
        turma_id: 1,
      })
      .expect(201);

    expect(createResponse.body).toHaveProperty('id');
    expect(createResponse.body.nome).toBe('João Silva');
    expect(createResponse.body.biometria).toBe(1);

    // 6. Validar que o aluno foi inserido corretamente no repositório de dados
    expect(db.alunos).toHaveLength(1);
    expect(db.alunos[0].nome).toBe('João Silva');
    expect(db.alunos[0].biometria).toBe(1);
  });
});
