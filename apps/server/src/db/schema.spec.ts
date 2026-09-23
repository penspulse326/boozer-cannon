import 'dotenv/config';
import { eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import * as schema from './schema.ts';

describe('Database Schema & Seed Relations', () => {
  let pool: pg.Pool;
  let db: ReturnType<typeof drizzle<typeof schema>>;

  beforeAll(() => {
    const connectionString =
      process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/boozer_cannon';
    pool = new pg.Pool({ connectionString });
    db = drizzle(pool, { schema });
  });

  afterAll(async () => {
    await pool.end();
  });

  it('should query seeded taxonomy and canonical entities with aliases', async () => {
    // Arrange
    const brandId = 'brand_tanqueray';

    // Act
    const brand = await db.query.canonicalEntities.findFirst({
      where: eq(schema.canonicalEntities.id, brandId),
      with: { aliases: true },
    });

    // Assert
    expect(brand).toBeDefined();
    expect(brand?.nameZh).toBe('坦奎利 (Tanqueray)');
    expect(brand?.category).toBe('brand');
    expect(brand?.aliases.length).toBeGreaterThan(0);
    expect(brand?.aliases.map((a) => a.aliasText)).toContain('坦奎利');
  });

  it('should query seeded recipes with nested relations (ingredients, garnishes, flavors)', async () => {
    // Arrange
    const negroniId = '10000000-0000-0000-0000-000000000001';

    // Act
    const recipe = await db.query.recipes.findFirst({
      where: eq(schema.recipes.id, negroniId),
      with: {
        author: true,
        garnishes: true,
        glassEntity: true,
        iceEntity: true,
        ingredients: true,
        recipeFlavors: {
          with: { flavor: true },
        },
      },
    });

    // Assert
    expect(recipe).toBeDefined();
    expect(recipe?.nameEn).toBe('Negroni');
    expect(recipe?.baseSpirit).toBe('Gin');
    expect(recipe?.author.name).toBe('BarCraft 首席調酒師');
    expect(recipe?.glassEntity?.id).toBe('glass_rocks');
    expect(recipe?.iceEntity?.id).toBe('ice_cube');
    expect(recipe?.ingredients.length).toBe(3);
    expect(recipe?.garnishes.length).toBe(1);
    expect(recipe?.recipeFlavors.length).toBe(3);
    expect(recipe?.recipeFlavors.map((rf) => rf.flavor.id)).toContain('flavor_bitter');
  });

  it('should enforce cascade deletion for recipe ingredients and flavors', async () => {
    // Arrange: Create a temporary test author and recipe
    const [testAuthor] = await db
      .insert(schema.users)
      .values({
        email: 'cascade-test@boozer.io',
        name: 'Cascade Tester',
      })
      .returning();

    const [testRecipe] = await db
      .insert(schema.recipes)
      .values({
        authorId: testAuthor.id,
        baseSpirit: 'Tequila',
        method: 'Shake',
        nameEn: 'Cascade Test Recipe',
      })
      .returning();

    await db.insert(schema.recipeIngredients).values({
      amount: '50.00',
      name: 'Tequila Test',
      recipeId: testRecipe.id,
      unit: 'ml',
    });

    await db.insert(schema.recipeFlavors).values({
      flavorId: 'flavor_sour',
      recipeId: testRecipe.id,
    });

    // Act: Delete test recipe
    await db.delete(schema.recipes).where(eq(schema.recipes.id, testRecipe.id));

    // Assert: Dependent ingredients and flavors should be cascade deleted
    const ingredients = await db
      .select()
      .from(schema.recipeIngredients)
      .where(eq(schema.recipeIngredients.recipeId, testRecipe.id));
    const flavorsRel = await db
      .select()
      .from(schema.recipeFlavors)
      .where(eq(schema.recipeFlavors.recipeId, testRecipe.id));

    expect(ingredients.length).toBe(0);
    expect(flavorsRel.length).toBe(0);

    // Clean up author
    await db.delete(schema.users).where(eq(schema.users.id, testAuthor.id));
  });

  it('should set null on recipe foreign keys when canonical entity is deleted', async () => {
    // Arrange: Create a temporary author, canonical entity, and recipe
    const [testAuthor] = await db
      .insert(schema.users)
      .values({
        email: 'setnull-test@boozer.io',
        name: 'Set Null Tester',
      })
      .returning();

    const tempGlassId = 'glass_temp_test';
    await db.insert(schema.canonicalEntities).values({
      category: 'glass',
      id: tempGlassId,
      nameEn: 'Temporary Glass',
    });

    const [testRecipe] = await db
      .insert(schema.recipes)
      .values({
        authorId: testAuthor.id,
        baseSpirit: 'Vodka',
        glassEntityId: tempGlassId,
        method: 'Stir',
        nameEn: 'Set Null Test Recipe',
      })
      .returning();

    // Act: Delete canonical glass entity
    await db.delete(schema.canonicalEntities).where(eq(schema.canonicalEntities.id, tempGlassId));

    // Assert: GlassEntityId in recipe should be set to null
    const [updatedRecipe] = await db
      .select()
      .from(schema.recipes)
      .where(eq(schema.recipes.id, testRecipe.id));
    expect(updatedRecipe.glassEntityId).toBeNull();

    // Clean up
    await db.delete(schema.users).where(eq(schema.users.id, testAuthor.id));
  });
});
