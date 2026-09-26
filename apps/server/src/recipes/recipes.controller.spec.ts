import type { GetRecipesQueryDto } from '@boozer/shared/dto';

import { Test, TestingModule } from '@nestjs/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { RecipesController } from './recipes.controller.ts';
import { RecipesService } from './recipes.service.ts';

describe('RecipesController', () => {
  let controller: RecipesController;

  const mockRecipesService = {
    findAll: vi.fn().mockResolvedValue({
      data: [{ id: '1', nameEn: 'Negroni' }],
      meta: { limit: 10, page: 1, total: 1, totalPages: 1 },
    }),
    findOne: vi.fn().mockResolvedValue({
      id: '10000000-0000-0000-0000-000000000001',
      nameEn: 'Negroni',
    }),
    toggleFavorite: vi.fn().mockResolvedValue({
      favoritesCount: 1,
      isFavorite: true,
      recipeId: '10000000-0000-0000-0000-000000000001',
    }),
    toggleLike: vi.fn().mockResolvedValue({
      isLiked: true,
      likesCount: 1,
      recipeId: '10000000-0000-0000-0000-000000000001',
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RecipesController],
      providers: [
        {
          provide: RecipesService,
          useValue: mockRecipesService,
        },
      ],
    }).compile();

    controller = module.get<RecipesController>(RecipesController);
  });

  it('should delegate query parameters to RecipesService.findAll with parsed numbers', async () => {
    const query: GetRecipesQueryDto = {
      base: 'Gin',
      limit: 5,
      page: 2,
      search: 'negroni',
      sort: 'newest',
    };

    const result = await controller.getRecipes(query);

    expect(mockRecipesService.findAll).toHaveBeenCalledWith(query);
    expect(result.data.length).toBe(1);
    expect(result.data[0]?.nameEn).toBe('Negroni');
  });

  it('should delegate id to RecipesService.findOne', async () => {
    const recipeId = '10000000-0000-0000-0000-000000000001';

    const result = await controller.getRecipe(recipeId);

    expect(mockRecipesService.findOne).toHaveBeenCalledWith(recipeId);
    expect(result).toBeDefined();
    expect(result.id).toBe(recipeId);
  });

  it('should delegate id and optional userId to RecipesService.toggleLike', async () => {
    const recipeId = '10000000-0000-0000-0000-000000000001';
    const userId = '00000000-0000-0000-0000-000000000002';

    const result = await controller.toggleLike(recipeId, { userId });

    expect(mockRecipesService.toggleLike).toHaveBeenCalledWith(recipeId, userId);
    expect(result).toEqual({
      isLiked: true,
      likesCount: 1,
      recipeId,
    });
  });

  it('should delegate id and optional userId to RecipesService.toggleFavorite', async () => {
    const recipeId = '10000000-0000-0000-0000-000000000001';
    const userId = '00000000-0000-0000-0000-000000000002';

    const result = await controller.toggleFavorite(recipeId, { userId });

    expect(mockRecipesService.toggleFavorite).toHaveBeenCalledWith(recipeId, userId);
    expect(result).toEqual({
      favoritesCount: 1,
      isFavorite: true,
      recipeId,
    });
  });
});
