import { type GetRecipesQueryDto, getRecipesQuerySchema } from '@boozer/shared/dto';
import { Controller, Get, Query, UsePipes } from '@nestjs/common';

import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe.ts';
import { RecipesService } from './recipes.service.ts';

@Controller('api/recipes')
export class RecipesController {
  constructor(private readonly recipesService: RecipesService) {}

  @Get()
  @UsePipes(new ZodValidationPipe(getRecipesQuerySchema))
  async getRecipes(@Query() query: GetRecipesQueryDto) {
    return await this.recipesService.findAll(query);
  }
}
