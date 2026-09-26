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

export const recipeInteractionDtoSchema = z
  .object({
    userId: z.string().uuid({ message: 'Invalid user ID format' }).optional(),
  })
  .default({});

export const createRecipeIngredientSchema = z.object({
  abv: z.coerce.number().min(0).max(100).default(0),
  amount: z.coerce.number().positive(),
  brandCustom: z.string().trim().max(100).optional().nullable(),
  brandEntityId: z.string().trim().max(50).optional().nullable(),
  brandId: z.string().trim().max(50).optional().nullable(),
  brandText: z.string().trim().max(100).optional().nullable(),
  ingredientEntityId: z.string().trim().max(50).optional().nullable(),
  name: z.string().trim().min(1, 'Ingredient name is required').max(100),
  sortOrder: z.coerce.number().int().default(0),
  unit: z.string().trim().min(1, 'Unit is required').max(20).default('ml'),
});

export const createRecipeGarnishSchema = z.object({
  garnishCustom: z.string().trim().max(100).optional().nullable(),
  garnishEntityId: z.string().trim().max(50).optional().nullable(),
});

export const createRecipeSchema = z
  .object({
    authorId: z.string().uuid().optional(),
    base: z.string().trim().max(50).optional(),
    baseSpirit: z.string().trim().max(50).optional(),
    calculatedAbv: z.coerce.number().min(0).max(100).optional().nullable(),
    desc: z.string().trim().optional().nullable(),
    dilutionRatio: z.coerce.number().min(0).max(10).optional().nullable(),
    flavors: z.array(z.string().trim().max(50)).default([]),
    garnish: z.string().trim().max(100).optional().nullable(),
    garnishes: z.array(createRecipeGarnishSchema).default([]),
    glass: z.string().trim().max(100).optional().nullable(),
    glassCustom: z.string().trim().max(100).optional().nullable(),
    glassEntityId: z.string().trim().max(50).optional().nullable(),
    ice: z.string().trim().max(100).optional().nullable(),
    iceCustom: z.string().trim().max(100).optional().nullable(),
    iceEntityId: z.string().trim().max(50).optional().nullable(),
    image: z.string().trim().max(500).optional().nullable(),
    imageUrl: z.string().trim().max(500).optional().nullable(),
    ingredients: z
      .array(createRecipeIngredientSchema)
      .min(1, 'At least one ingredient is required'),
    instructions: z.array(z.string().trim()).default([]),
    method: z.string().trim().min(1, 'Method is required').max(50),
    nameEn: z.string().trim().max(150).optional().nullable(),
    nameZh: z.string().trim().max(150).optional().nullable(),
    steps: z.array(z.string().trim()).default([]),
    story: z.string().trim().optional().nullable(),
  })
  .refine(
    (data) =>
      Boolean(
        (data.baseSpirit && data.baseSpirit.length > 0) || (data.base && data.base.length > 0),
      ),
    { message: 'Base spirit is required' },
  )
  .refine(
    (data) =>
      Boolean((data.nameZh && data.nameZh.length > 0) || (data.nameEn && data.nameEn.length > 0)),
    { message: 'Either nameZh or nameEn must be provided' },
  );

export type CreateRecipeDto = z.infer<typeof createRecipeSchema>;
export type CreateRecipeGarnishDto = z.infer<typeof createRecipeGarnishSchema>;
export type CreateRecipeIngredientDto = z.infer<typeof createRecipeIngredientSchema>;
export type CreateRecipeInput = z.input<typeof createRecipeSchema>;

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

export type RecipeInteractionDto = z.infer<typeof recipeInteractionDtoSchema>;

export interface ToggleFavoriteResponseDto {
  favoritesCount: number;
  isFavorite: boolean;
  recipeId: string;
}

export interface ToggleLikeResponseDto {
  isLiked: boolean;
  likesCount: number;
  recipeId: string;
}
