import { Module } from '@nestjs/common';

import { RecipesController } from './recipes.controller.ts';
import { RecipesService } from './recipes.service.ts';

@Module({
  controllers: [RecipesController],
  exports: [RecipesService],
  providers: [RecipesService],
})
export class RecipesModule {}
