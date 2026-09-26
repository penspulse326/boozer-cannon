import 'dotenv/config';
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import pg from 'pg';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { AppModule } from './../src/app.module.js';

describe('AppController (e2e)', () => {
  let app: INestApplication;
  let pool: pg.Pool;

  beforeAll(async () => {
    const connectionString =
      process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/boozer_cannon';
    pool = new pg.Pool({ connectionString });

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
    await pool.end();
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

  it('/api/recipes (POST) - 201 for valid custom recipe creation', async () => {
    const payload = {
      baseSpirit: 'Tequila',
      calculatedAbv: 18.5,
      flavors: ['flavor_sour'],
      garnishes: [{ garnishCustom: '鹽口與青檸片' }],
      ingredients: [
        {
          abv: 40,
          amount: 50,
          brandCustom: 'Patrón Silver',
          name: '龍舌蘭',
          sortOrder: 1,
          unit: 'ml',
        },
        { abv: 0, amount: 25, name: '新鮮青檸汁', sortOrder: 2, unit: 'ml' },
      ],
      instructions: ['加入冰塊搖盪均勻', '濾入鹽口杯中'],
      method: 'Shake',
      nameEn: 'E2E Test Margarita',
      nameZh: '端到端測試瑪格麗特',
      story: 'E2E 測試用經典特調',
    };

    const res = await request(app.getHttpServer()).post('/api/recipes').send(payload).expect(201);

    expect(res.body.id).toBeDefined();
    expect(res.body.nameZh).toBe('端到端測試瑪格麗特');
    expect(res.body.nameEn).toBe('E2E Test Margarita');
    expect(res.body.ingredients.length).toBe(2);
    expect(res.body.garnishes.length).toBe(1);
    expect(res.body.author).toBeDefined();

    await pool.query('DELETE FROM recipes WHERE id = $1', [res.body.id]);
  });

  it('/api/recipes (POST) - 400 for invalid recipe with no ingredients', async () => {
    const payload = {
      baseSpirit: 'Vodka',
      ingredients: [],
      method: 'Shake',
      nameEn: 'Empty Ingredient Cocktail',
    };

    await request(app.getHttpServer()).post('/api/recipes').send(payload).expect(400);
  });

  it('/api/recipes/:id/like (POST) - 201 toggles like status on and off', async () => {
    const negroniId = '10000000-0000-0000-0000-000000000001';
    const res1 = await request(app.getHttpServer())
      .post(`/api/recipes/${negroniId}/like`)
      .send({})
      .expect(201);

    expect(res1.body.recipeId).toBe(negroniId);
    expect(res1.body.isLiked).toBe(true);

    const res2 = await request(app.getHttpServer())
      .post(`/api/recipes/${negroniId}/like`)
      .send({})
      .expect(201);

    expect(res2.body.recipeId).toBe(negroniId);
    expect(res2.body.isLiked).toBe(false);
  });

  it('/api/recipes/:id/favorite (POST) - 201 toggles favorite status on and off', async () => {
    const negroniId = '10000000-0000-0000-0000-000000000001';
    const res1 = await request(app.getHttpServer())
      .post(`/api/recipes/${negroniId}/favorite`)
      .send({})
      .expect(201);

    expect(res1.body.recipeId).toBe(negroniId);
    expect(res1.body.isFavorite).toBe(true);

    const res2 = await request(app.getHttpServer())
      .post(`/api/recipes/${negroniId}/favorite`)
      .send({})
      .expect(201);

    expect(res2.body.recipeId).toBe(negroniId);
    expect(res2.body.isFavorite).toBe(false);
  });
});
