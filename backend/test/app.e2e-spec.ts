import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as request from 'supertest';
import { QuestionsModule } from './../src/questions/questions.module';

describe('QuestionsController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [QuestionsModule],
    }).compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true }),
    );
    await app.init();
  });

  afterAll(() => app.close());

  it('GET /questions returns 10 exact divisions', async () => {
    const { body } = await request(app.getHttpServer())
      .get('/questions?operation=division&level=high')
      .expect(200);

    expect(body).toHaveLength(10);
    for (const q of body) {
      expect(q.a / q.b).toBe(q.answer);
    }
  });

  it('GET /questions rejects an unknown level', () => {
    return request(app.getHttpServer())
      .get('/questions?operation=addition&level=extreme')
      .expect(400);
  });
});
