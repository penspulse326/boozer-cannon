import type {
  GetRecipesQueryInput,
  PaginatedResult,
  ToggleFavoriteResponseDto,
  ToggleLikeResponseDto,
} from '@boozer/shared/dto';

import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { and, asc, count, desc, eq, ilike, inArray, or, type SQL } from 'drizzle-orm';

import { DRIZZLE, type DrizzleDB } from '../db/drizzle.provider.js';
import * as schema from '../db/schema.ts';

export const DEFAULT_USER_ID = '00000000-0000-0000-0000-000000000001';

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

  async toggleFavorite(
    recipeId: string,
    userId: string = DEFAULT_USER_ID,
  ): Promise<ToggleFavoriteResponseDto> {
    return await this.db.transaction(async (tx) => {
      const [recipe] = await tx
        .select({ favoritesCount: schema.recipes.favoritesCount, id: schema.recipes.id })
        .from(schema.recipes)
        .where(eq(schema.recipes.id, recipeId));

      if (!recipe) {
        throw new NotFoundException(`Recipe with ID "${recipeId}" not found`);
      }

      const [user] = await tx
        .select({ id: schema.users.id })
        .from(schema.users)
        .where(eq(schema.users.id, userId));

      if (!user) {
        throw new NotFoundException(`User with ID "${userId}" not found`);
      }

      const [existingFav] = await tx
        .select()
        .from(schema.recipeFavorites)
        .where(
          and(
            eq(schema.recipeFavorites.recipeId, recipeId),
            eq(schema.recipeFavorites.userId, userId),
          ),
        );

      if (existingFav) {
        await tx
          .delete(schema.recipeFavorites)
          .where(
            and(
              eq(schema.recipeFavorites.recipeId, recipeId),
              eq(schema.recipeFavorites.userId, userId),
            ),
          );

        const favoritesCount = Math.max(0, recipe.favoritesCount - 1);
        await tx
          .update(schema.recipes)
          .set({ favoritesCount })
          .where(eq(schema.recipes.id, recipeId));

        return {
          favoritesCount,
          isFavorite: false,
          recipeId,
        };
      }

      await tx.insert(schema.recipeFavorites).values({
        recipeId,
        userId,
      });

      const favoritesCount = recipe.favoritesCount + 1;
      await tx
        .update(schema.recipes)
        .set({ favoritesCount })
        .where(eq(schema.recipes.id, recipeId));

      return {
        favoritesCount,
        isFavorite: true,
        recipeId,
      };
    });
  }

  async toggleLike(
    recipeId: string,
    userId: string = DEFAULT_USER_ID,
  ): Promise<ToggleLikeResponseDto> {
    return await this.db.transaction(async (tx) => {
      const [recipe] = await tx
        .select({ id: schema.recipes.id, likesCount: schema.recipes.likesCount })
        .from(schema.recipes)
        .where(eq(schema.recipes.id, recipeId));

      if (!recipe) {
        throw new NotFoundException(`Recipe with ID "${recipeId}" not found`);
      }

      const [user] = await tx
        .select({ id: schema.users.id })
        .from(schema.users)
        .where(eq(schema.users.id, userId));

      if (!user) {
        throw new NotFoundException(`User with ID "${userId}" not found`);
      }

      const [existingLike] = await tx
        .select()
        .from(schema.recipeLikes)
        .where(
          and(eq(schema.recipeLikes.recipeId, recipeId), eq(schema.recipeLikes.userId, userId)),
        );

      if (existingLike) {
        await tx
          .delete(schema.recipeLikes)
          .where(
            and(eq(schema.recipeLikes.recipeId, recipeId), eq(schema.recipeLikes.userId, userId)),
          );

        const likesCount = Math.max(0, recipe.likesCount - 1);
        await tx.update(schema.recipes).set({ likesCount }).where(eq(schema.recipes.id, recipeId));

        return {
          isLiked: false,
          likesCount,
          recipeId,
        };
      }

      await tx.insert(schema.recipeLikes).values({
        recipeId,
        userId,
      });

      const likesCount = recipe.likesCount + 1;
      await tx.update(schema.recipes).set({ likesCount }).where(eq(schema.recipes.id, recipeId));

      return {
        isLiked: true,
        likesCount,
        recipeId,
      };
    });
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
