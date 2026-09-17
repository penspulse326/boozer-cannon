import { Module } from '@nestjs/common';

import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { DrizzleModule } from './db/drizzle.module.js';

@Module({
  controllers: [AppController],
  imports: [DrizzleModule],
  providers: [AppService],
})
export class AppModule {}
