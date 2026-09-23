import { type GetRecipesQueryDto, getRecipesQuerySchema, recipeIdSchema } from '@boozer/shared/dto';
import { Controller, Get, Param, Query, UsePipes } from '@nestjs/common';

import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe.ts';
import { RecipesService } from './recipes.service.ts';

@Controller('api/recipes')
export class RecipesController {
  constructor(private readonly recipesService: RecipesService) {}

  @Get(':id')
  async getRecipe(@Param('id', new ZodValidationPipe(recipeIdSchema)) id: string) {
    return await this.recipesService.findOne(id);
  }

  @Get()
  @UsePipes(new ZodValidationPipe(getRecipesQuerySchema))
  async getRecipes(@Query() query: GetRecipesQueryDto) {
    return await this.recipesService.findAll(query);
  }
}
