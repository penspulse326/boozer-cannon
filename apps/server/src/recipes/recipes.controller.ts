import {
  type CreateRecipeDto,
  createRecipeSchema,
  type GetRecipesQueryDto,
  getRecipesQuerySchema,
  recipeIdSchema,
  type RecipeInteractionDto,
  recipeInteractionDtoSchema,
} from '@boozer/shared/dto';
import { Body, Controller, Get, Param, Post, Query, UsePipes } from '@nestjs/common';

import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe.ts';
import { RecipesService } from './recipes.service.ts';

@Controller('api/recipes')
export class RecipesController {
  constructor(private readonly recipesService: RecipesService) {}

  @Post()
  @UsePipes(new ZodValidationPipe(createRecipeSchema))
  async createRecipe(@Body() dto: CreateRecipeDto) {
    return await this.recipesService.create(dto);
  }

  @Get(':id')
  async getRecipe(@Param('id', new ZodValidationPipe(recipeIdSchema)) id: string) {
    return await this.recipesService.findOne(id);
  }

  @Get()
  @UsePipes(new ZodValidationPipe(getRecipesQuerySchema))
  async getRecipes(@Query() query: GetRecipesQueryDto) {
    return await this.recipesService.findAll(query);
  }

  @Post(':id/favorite')
  async toggleFavorite(
    @Param('id', new ZodValidationPipe(recipeIdSchema)) id: string,
    @Body(new ZodValidationPipe(recipeInteractionDtoSchema)) dto?: RecipeInteractionDto,
  ) {
    return await this.recipesService.toggleFavorite(id, dto?.userId);
  }

  @Post(':id/like')
  async toggleLike(
    @Param('id', new ZodValidationPipe(recipeIdSchema)) id: string,
    @Body(new ZodValidationPipe(recipeInteractionDtoSchema)) dto?: RecipeInteractionDto,
  ) {
    return await this.recipesService.toggleLike(id, dto?.userId);
  }
}
