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
