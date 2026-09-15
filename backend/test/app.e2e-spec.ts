import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/modules/app.module';
import { PrismaService } from '../src/services/prisma.service';

describe('AppController (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).overrideProvider(PrismaService).useValue({
      aluno: { fields: { entrada: 'entrada' }, findMany: jest.fn().mockResolvedValue([]) },
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
  });

  afterEach(async () => { await app.close(); });

  it('/helloworld (GET)', () => {
    return request(app.getHttpServer())
      .get('/helloworld')
      .expect(200)
      .expect('Hello World!');
  });

  it.each([
    '/dashboard/acessos/por-hora?data=2026-02-30',
    '/dashboard/turmas/1/frequencia?data=15-09-2026',
    '/dashboard/acessos?page=1abc',
    '/dashboard/acessos?limit=-1',
    '/dashboard/acessos?dataInicio=2026-09-16&dataFim=2026-09-15',
    '/dashboard/tendencia?dias=7abc',
    '/dashboard/export?dataFim=2026-02-30',
    '/acessos/invalido',
  ])('retorna 400 para a consulta inválida %s', async url => {
    await request(app.getHttpServer()).get(url).expect(400);
  });

  it.each([{}, { biometria: '1' }, { biometria: 0 }, { biometria: 128 }])(
    'recusa leitura biométrica inválida %j antes de consultar alunos', async body => {
      await request(app.getHttpServer()).post('/alunos/biometria/leitura').send(body).expect(400);
    },
  );

  it('recusa tipos de acesso desconhecidos', async () => {
    await request(app.getHttpServer()).post('/acessos')
      .send({ aluno_id: 1, tipo: 'invalido' }).expect(400);
  });
});
