import type { GetRecipesQueryInput, PaginatedResult } from '@boozer/shared/dto';

import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { and, asc, count, desc, eq, ilike, inArray, or, type SQL } from 'drizzle-orm';

import { DRIZZLE, type DrizzleDB } from '../db/drizzle.provider.js';
import * as schema from '../db/schema.ts';

export type RecipeWithRelations = schema.Recipe & {
  author: schema.User;
  garnishes: (schema.RecipeGarnish & { garnishEntity: null | schema.CanonicalEntity })[];
  glassEntity: null | schema.CanonicalEntity;
  iceEntity: null | schema.CanonicalEntity;
  ingredients: (schema.RecipeIngredient & {
    brandEntity: null | schema.CanonicalEntity;
    ingredientEntity: null | schema.CanonicalEntity;
  })[];
  recipeFlavors: (schema.RecipeFlavor & { flavor: schema.Flavor })[];
};

@Injectable()
export class RecipesService {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  async findAll(query: GetRecipesQueryInput = {}): Promise<PaginatedResult<RecipeWithRelations>> {
    const page = Math.max(1, query.page || 1);
    const limit = Math.min(50, Math.max(1, query.limit || 10));
    const offset = (page - 1) * limit;

    const whereClause = this.buildWhereConditions(query);
    const orderByClause = this.buildOrderBy(query.sort);

    const [countResult] = await this.db
      .select({ total: count() })
      .from(schema.recipes)
      .where(whereClause);

    const total = Number(countResult?.total || 0);

    const data = await this.db.query.recipes.findMany({
      limit,
      offset,
      orderBy: orderByClause,
      where: whereClause,
      with: {
        author: true,
        garnishes: {
          with: { garnishEntity: true },
        },
        glassEntity: true,
        iceEntity: true,
        ingredients: {
          with: {
            brandEntity: true,
            ingredientEntity: true,
          },
        },
        recipeFlavors: {
          with: { flavor: true },
        },
      },
    });

    return {
      data,
      meta: {
        limit,
        page,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  async findOne(id: string): Promise<RecipeWithRelations> {
    const recipe = await this.db.query.recipes.findFirst({
      where: eq(schema.recipes.id, id),
      with: {
        author: true,
        garnishes: {
          with: { garnishEntity: true },
        },
        glassEntity: true,
        iceEntity: true,
        ingredients: {
          with: {
            brandEntity: true,
            ingredientEntity: true,
          },
        },
        recipeFlavors: {
          with: { flavor: true },
        },
      },
    });

    if (!recipe) {
      throw new NotFoundException(`Recipe with ID "${id}" not found`);
    }

    return recipe;
  }

  private buildOrderBy(sort?: GetRecipesQueryInput['sort']) {
    switch (sort) {
      case 'abv_asc':
        return [asc(schema.recipes.calculatedAbv)];
      case 'abv_desc':
        return [desc(schema.recipes.calculatedAbv)];
      case 'oldest':
        return [asc(schema.recipes.createdAt)];
      case 'popular':
        return [desc(schema.recipes.likesCount)];
      case 'newest':
      default:
        return [desc(schema.recipes.createdAt)];
    }
  }

  private buildWhereConditions(query: GetRecipesQueryInput): SQL | undefined {
    const conditions: SQL[] = [];

    if (query.search?.trim()) {
      const pattern = `%${query.search.trim()}%`;
      conditions.push(
        or(ilike(schema.recipes.nameEn, pattern), ilike(schema.recipes.nameZh, pattern))!,
      );
    }

    if (query.base?.trim()) {
      conditions.push(eq(schema.recipes.baseSpirit, query.base.trim()));
    }

    if (query.flavor?.trim()) {
      const flavorSubquery = this.db
        .select({ recipeId: schema.recipeFlavors.recipeId })
        .from(schema.recipeFlavors)
        .where(eq(schema.recipeFlavors.flavorId, query.flavor.trim()));

      conditions.push(inArray(schema.recipes.id, flavorSubquery));
    }

    return conditions.length > 0 ? and(...conditions) : undefined;
  }
}
