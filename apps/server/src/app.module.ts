import { Module } from '@nestjs/common';

import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { DrizzleModule } from './db/drizzle.module.js';
import { RecipesModule } from './recipes/recipes.module.ts';

@Module({
  controllers: [AppController],
  imports: [DrizzleModule, RecipesModule],
  providers: [AppService],
})
export class AppModule {}
