import { Test, TestingModule } from '@nestjs/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { RecipesController } from './recipes.controller.ts';
import { RecipesService } from './recipes.service.ts';

describe('RecipesController', () => {
  let controller: RecipesController;
  let service: RecipesService;

  const mockRecipesService = {
    findAll: vi.fn().mockResolvedValue({
      data: [{ id: '1', nameEn: 'Negroni' }],
      meta: { limit: 10, page: 1, total: 1, totalPages: 1 },
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
    service = module.get<RecipesService>(RecipesService);
  });

  it('should delegate query parameters to RecipesService.findAll with parsed numbers', async () => {
    // Arrange
    const query = {
      base: 'Gin',
      limit: 5,
      page: 2,
      search: 'negroni',
    };

    // Act
    const result = await controller.getRecipes(query);

    // Assert
    expect(service.findAll).toHaveBeenCalledWith(query);
    expect(result.data.length).toBe(1);
    expect(result.data[0]?.nameEn).toBe('Negroni');
  });
});
