import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as request from 'supertest';
import { GamesController } from './../src/games/games.controller';
import { GamesService } from './../src/games/games.service';
import { PracticeController } from './../src/practice/practice.controller';

describe('GamesController (e2e)', () => {
  let app: INestApplication;
  const gamesService = {
    create: jest
      .fn()
      .mockResolvedValue({ id: 'x', countdownMs: 3000, questions: [] }),
    answer: jest.fn().mockResolvedValue({ accepted: true, finished: false }),
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [GamesController, PracticeController],
      providers: [{ provide: GamesService, useValue: gamesService }],
    }).compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();
  });

  afterAll(() => app.close());

  it('POST /games starts a game', () => {
    return request(app.getHttpServer())
      .post('/games')
      .send({ name: 'Ana', operation: 'division', level: 'high' })
      .expect(201);
  });

  it('POST /games rejects an unknown level', () => {
    return request(app.getHttpServer())
      .post('/games')
      .send({ name: 'Ana', operation: 'addition', level: 'extreme' })
      .expect(400);
  });

  it('POST /games/:id/answers rejects a client-sent time', () => {
    return request(app.getHttpServer())
      .post('/games/7c6f2f6e-3b0e-4a8e-9d55-1f0f6d1c2a10/answers')
      .send({ index: 0, value: 5, timeMs: 1 })
      .expect(400);
  });

  it('GET /practice/questions returns questions without answers', async () => {
    const { body } = await request(app.getHttpServer())
      .get('/practice/questions?operation=multiplication&level=medium')
      .expect(200);

    expect(body).toHaveLength(10);
    expect(body[0]).not.toHaveProperty('answer');
  });

  it('GET /practice/questions rejects an unknown operation', () => {
    return request(app.getHttpServer())
      .get('/practice/questions?operation=power&level=low')
      .expect(400);
  });

  it('POST /games/:id/answers answers with 200', () => {
    return request(app.getHttpServer())
      .post('/games/7c6f2f6e-3b0e-4a8e-9d55-1f0f6d1c2a10/answers')
      .send({ index: 0, value: 5 })
      .expect(200);
  });
});
