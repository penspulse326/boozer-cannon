import { Controller, Get, Query } from '@nestjs/common';

import type { GetRecipesQueryDto } from './dto/get-recipes-query.dto.ts';

import { RecipesService } from './recipes.service.ts';

@Controller('api/recipes')
export class RecipesController {
  constructor(private readonly recipesService: RecipesService) {}

  @Get()
  async getRecipes(@Query() query: GetRecipesQueryDto) {
    return await this.recipesService.findAll({
      ...query,
      limit: query.limit ? Number(query.limit) : undefined,
      maxAbv: query.maxAbv ? Number(query.maxAbv) : undefined,
      minAbv: query.minAbv ? Number(query.minAbv) : undefined,
      page: query.page ? Number(query.page) : undefined,
    });
  }
}
