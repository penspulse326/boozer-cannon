import { z } from 'zod';

export const RECIPE_SORT_OPTIONS = ['newest', 'oldest', 'abv_asc', 'abv_desc', 'popular'] as const;

export type RecipeSortOption = (typeof RECIPE_SORT_OPTIONS)[number];

export const getRecipesQuerySchema = z.object({
  base: z.string().trim().optional(),
  flavor: z.string().trim().optional(),
  limit: z.coerce.number().int().min(1).max(50).default(10),
  maxAbv: z.coerce.number().min(0).max(100).optional(),
  minAbv: z.coerce.number().min(0).max(100).optional(),
  page: z.coerce.number().int().min(1).default(1),
  search: z.string().trim().optional(),
  sort: z.enum(RECIPE_SORT_OPTIONS).default('newest'),
});

export interface ApiRecipeAuthor {
  avatarUrl?: null | string;
  id: string;
  name: string;
}

export interface ApiRecipeEntity {
  id?: string;
  nameEn?: null | string;
  nameZh?: null | string;
}

export interface ApiRecipeFlavorRelation {
  flavor?: null | {
    id: string;
    nameEn?: null | string;
    nameZh?: null | string;
  };
  flavorId: string;
}

export interface ApiRecipeGarnish {
  garnishCustom?: null | string;
  garnishEntity?: ApiRecipeEntity | null;
  garnishEntityId?: null | string;
  id?: string;
}

export interface ApiRecipeIngredient {
  abv?: null | number | string;
  amount: number | string;
  brandCustom?: null | string;
  brandEntity?: ApiRecipeEntity | null;
  brandEntityId?: null | string;
  id?: string;
  ingredientEntity?: ApiRecipeEntity | null;
  ingredientEntityId?: null | string;
  name: string;
  unit: string;
}

export interface ApiRecipeItem {
  author?: ApiRecipeAuthor | null;
  authorId?: string;
  baseSpirit: string;
  calculatedAbv?: null | number | string;
  createdAt?: Date | string;
  dilutionRatio?: null | number | string;
  favoritesCount?: number;
  garnishes?: ApiRecipeGarnish[];
  glassCustom?: null | string;
  glassEntity?: ApiRecipeEntity | null;
  glassEntityId?: null | string;
  iceCustom?: null | string;
  iceEntity?: ApiRecipeEntity | null;
  iceEntityId?: null | string;
  id: string;
  imageUrl?: null | string;
  ingredients?: ApiRecipeIngredient[];
  instructions?: null | string[];
  likesCount?: number;
  method: string;
  nameEn?: null | string;
  nameZh?: null | string;
  recipeFlavors?: ApiRecipeFlavorRelation[];
  story?: null | string;
  updatedAt?: Date | string;
}

export type GetRecipesQueryDto = z.infer<typeof getRecipesQuerySchema>;

export interface PaginatedResult<T> {
  data: T[];
  meta: PaginationMeta;
}

export interface PaginationMeta {
  limit: number;
  page: number;
  total: number;
  totalPages: number;
}
