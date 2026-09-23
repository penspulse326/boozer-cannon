import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';

import { AppModule } from './../src/app.module.js';

describe('AppController (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('/ (GET)', () => {
    return request(app.getHttpServer()).get('/').expect(200).expect('Hello World!');
  });

  it('/api/recipes (GET)', async () => {
    const res = await request(app.getHttpServer()).get('/api/recipes').expect(200);
    expect(res.body.data).toBeDefined();
    expect(res.body.data.length).toBeGreaterThan(0);
    expect(res.body.meta).toBeDefined();
  });

  it('/api/recipes/:id (GET) - 200 for valid existing recipe', async () => {
    const negroniId = '10000000-0000-0000-0000-000000000001';
    const res = await request(app.getHttpServer()).get(`/api/recipes/${negroniId}`).expect(200);
    expect(res.body.id).toBe(negroniId);
    expect(res.body.nameEn).toBe('Negroni');
    expect(res.body.ingredients.length).toBe(3);
  });

  it('/api/recipes/:id (GET) - 404 for non-existent recipe', async () => {
    const nonExistentId = '00000000-0000-0000-0000-000000000000';
    await request(app.getHttpServer()).get(`/api/recipes/${nonExistentId}`).expect(404);
  });

  it('/api/recipes/:id (GET) - 400 for invalid uuid format', async () => {
    await request(app.getHttpServer()).get('/api/recipes/invalid-uuid-123').expect(400);
  });

  afterEach(async () => {
    await app.close();
  });
});
