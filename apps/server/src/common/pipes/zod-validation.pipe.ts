import type { ZodSchema } from 'zod';

import { BadRequestException, Injectable, type PipeTransform } from '@nestjs/common';

@Injectable()
export class ZodValidationPipe implements PipeTransform {
  constructor(private readonly schema: ZodSchema) {}

  transform(value: unknown) {
    const result = this.schema.safeParse(value);
    if (!result.success) {
      throw new BadRequestException({
        errors: result.error.flatten(),
        message: 'Validation failed',
      });
    }
    return result.data;
  }
}
