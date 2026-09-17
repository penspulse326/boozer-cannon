import { Global, Module } from '@nestjs/common';

import { DRIZZLE, drizzleProvider } from './drizzle.provider.js';

@Global()
@Module({
  exports: [DRIZZLE],
  providers: [drizzleProvider],
})
export class DrizzleModule {}
