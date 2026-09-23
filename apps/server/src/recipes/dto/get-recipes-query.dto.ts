export interface GetRecipesQueryDto {
  base?: string;
  flavor?: string;
  limit?: number;
  maxAbv?: number;
  minAbv?: number;
  page?: number;
  search?: string;
  sort?: 'abv_asc' | 'abv_desc' | 'newest' | 'oldest' | 'popular';
}

export interface PaginatedRecipesResult<T> {
  data: T[];
  meta: {
    limit: number;
    page: number;
    total: number;
    totalPages: number;
  };
}
