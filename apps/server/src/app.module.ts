import { Module } from '@nestjs/common';

import { DrizzleModule } from './db/drizzle.module.js';
import { RecipesModule } from './recipes/recipes.module.ts';

@Module({
  imports: [DrizzleModule, RecipesModule],
})
export class AppModule {}
