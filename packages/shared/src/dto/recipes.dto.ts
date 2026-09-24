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

export const recipeIdSchema = z.string().uuid({ message: 'Invalid recipe ID format' });

export const recipeIdParamSchema = z.object({
  id: recipeIdSchema,
});

export type ApiRecipeAuthor = RecipeAuthorDto;

export type ApiRecipeEntity = RecipeEntityDto;

export type ApiRecipeFlavorRelation = RecipeFlavorDto;

export type ApiRecipeGarnish = RecipeGarnishDto;

export type ApiRecipeIngredient = RecipeIngredientDto;

export type ApiRecipeItem = RecipeDto;

export type GetRecipesQueryDto = z.infer<typeof getRecipesQuerySchema>;
export type GetRecipesQueryInput = z.input<typeof getRecipesQuerySchema>;
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
export interface RecipeAuthorDto {
  avatarUrl: null | string;
  id: string;
  name: string;
}
export interface RecipeDto {
  author: RecipeAuthorDto;
  authorId: string;
  baseSpirit: string;
  calculatedAbv: null | number | string;
  createdAt: Date | string;
  dilutionRatio: null | number | string;
  favoritesCount: number;
  garnishes: RecipeGarnishDto[];
  glassCustom: null | string;
  glassEntity: null | RecipeEntityDto;
  glassEntityId: null | string;
  iceCustom: null | string;
  iceEntity: null | RecipeEntityDto;
  iceEntityId: null | string;
  id: string;
  imageUrl: null | string;
  ingredients: RecipeIngredientDto[];
  instructions: null | string[];
  likesCount: number;
  method: string;
  nameEn: null | string;
  nameZh: null | string;
  recipeFlavors: RecipeFlavorDto[];
  story: null | string;
  updatedAt: Date | string;
}

export interface RecipeEntityDto {
  id: string;
  nameEn: string;
  nameZh: null | string;
}

export interface RecipeFlavorDto {
  flavor: null | {
    id: string;
    nameEn: string;
    nameZh: string;
  };
  flavorId: string;
}

export interface RecipeGarnishDto {
  garnishCustom: null | string;
  garnishEntity: null | RecipeEntityDto;
  garnishEntityId: null | string;
  id: string;
}

export type RecipeIdParamDto = z.infer<typeof recipeIdParamSchema>;

export interface RecipeIngredientDto {
  abv: null | number | string;
  amount: number | string;
  brandCustom: null | string;
  brandEntity: null | RecipeEntityDto;
  brandEntityId: null | string;
  id: string;
  ingredientEntity: null | RecipeEntityDto;
  ingredientEntityId: null | string;
  name: string;
  unit: string;
}
