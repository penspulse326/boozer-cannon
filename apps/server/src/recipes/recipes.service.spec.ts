import 'dotenv/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import type { DrizzleDB } from '../db/drizzle.provider.js';

import * as schema from '../db/schema.ts';
import { RecipesService } from './recipes.service.ts';

describe('RecipesService', () => {
  let pool: pg.Pool;
  let db: DrizzleDB;
  let service: RecipesService;

  beforeAll(() => {
    const connectionString =
      process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/boozer_cannon';
    pool = new pg.Pool({ connectionString });
    db = drizzle(pool, { schema });
    service = new RecipesService(db);
  });

  afterAll(async () => {
    await pool.end();
  });

  it('Scenario 1: should return paginated list with relations and metadata by default', async () => {
    const query = {};

    const result = await service.findAll(query);

    expect(result.data).toBeDefined();
    expect(result.data.length).toBe(4);
    expect(result.meta).toEqual({
      limit: 10,
      page: 1,
      total: 4,
      totalPages: 1,
    });

    const firstRecipe = result.data[0];
    expect(firstRecipe).toBeDefined();
    expect(firstRecipe?.ingredients.length).toBeGreaterThan(0);
    expect(firstRecipe?.recipeFlavors.length).toBeGreaterThan(0);
    expect(firstRecipe?.author).toBeDefined();
  });

  it('Scenario 2: should search recipes by case-insensitive nameZh or nameEn', async () => {
    const query = { search: 'negroni' };

    const result = await service.findAll(query);

    expect(result.data.length).toBe(1);
    expect(result.data[0]?.nameEn).toBe('Negroni');
    expect(result.meta.total).toBe(1);

    const zhQuery = { search: '琴通寧' };

    const zhResult = await service.findAll(zhQuery);

    expect(zhResult.data.length).toBe(1);
    expect(zhResult.data[0]?.nameZh).toBe('亨利爵士琴通寧');
  });

  it('Scenario 3: should filter recipes by base spirit', async () => {
    const query = { base: 'Gin' };

    const result = await service.findAll(query);

    expect(result.data.length).toBe(2);
    expect(result.data.every((r) => r.baseSpirit === 'Gin')).toBe(true);
    expect(result.meta.total).toBe(2);
  });

  it('Scenario 4: should filter recipes by flavor tag id', async () => {
    const query = { flavor: 'flavor_bitter' };

    const result = await service.findAll(query);

    expect(result.data.length).toBe(2);
    const names = result.data.map((r) => r.nameEn);
    expect(names).toContain('Negroni');
    expect(names).toContain('Old Fashioned');
    expect(result.meta.total).toBe(2);
  });

  it('Scenario 5: should sort by abv ascending and support page slice', async () => {
    const query = { limit: 2, page: 1, sort: 'abv_asc' as const };

    const page1 = await service.findAll(query);

    expect(page1.data.length).toBe(2);
    expect(page1.meta).toEqual({
      limit: 2,
      page: 1,
      total: 4,
      totalPages: 2,
    });

    const abv0 = Number(page1.data[0]?.calculatedAbv);
    const abv1 = Number(page1.data[1]?.calculatedAbv);
    expect(abv0).toBeLessThanOrEqual(abv1);

    const page2 = await service.findAll({ limit: 2, page: 2, sort: 'abv_asc' });

    expect(page2.data.length).toBe(2);
    expect(page2.meta.page).toBe(2);
    const abv2 = Number(page2.data[0]?.calculatedAbv);
    expect(abv1).toBeLessThanOrEqual(abv2);
  });

  it('Scenario 6: should return a recipe with complete relations by id', async () => {
    const negroniId = '10000000-0000-0000-0000-000000000001';

    const recipe = await service.findOne(negroniId);

    expect(recipe).toBeDefined();
    expect(recipe.id).toBe(negroniId);
    expect(recipe.nameEn).toBe('Negroni');
    expect(recipe.baseSpirit).toBe('Gin');
    expect(recipe.author).toBeDefined();
    expect(recipe.author.name).toBe('BarCraft 首席調酒師');
    expect(recipe.glassEntity?.id).toBe('glass_rocks');
    expect(recipe.iceEntity?.id).toBe('ice_cube');
    expect(recipe.garnishes.length).toBe(1);
    expect(recipe.recipeFlavors.length).toBe(3);
    expect(recipe.recipeFlavors[0]?.flavor).toBeDefined();
    expect(recipe.ingredients.length).toBe(3);
    expect(Array.isArray(recipe.instructions)).toBe(true);
  });

  it('Scenario 7: should throw NotFoundException when recipe id does not exist', async () => {
    const nonExistentId = '00000000-0000-0000-0000-000000000000';

    await expect(service.findOne(nonExistentId)).rejects.toThrow(
      `Recipe with ID "${nonExistentId}" not found`,
    );
  });
});
