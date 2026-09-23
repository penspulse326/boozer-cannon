import { BadRequestException } from '@nestjs/common';
import { describe, expect, it } from 'vitest';
import { z } from 'zod';

import { ZodValidationPipe } from './zod-validation.pipe.ts';

describe('ZodValidationPipe', () => {
  const testSchema = z.object({
    limit: z.coerce.number().int().min(1).max(50).default(10),
    page: z.coerce.number().int().min(1).default(1),
    search: z.string().optional(),
    sort: z.enum(['newest', 'oldest']).default('newest'),
  });

  const pipe = new ZodValidationPipe(testSchema);

  it('should transform and apply defaults on valid input', () => {
    // Arrange
    const input = {
      limit: '5',
      page: '2',
      search: 'gin',
    };

    // Act
    const result = pipe.transform(input);

    // Assert
    expect(result).toEqual({
      limit: 5,
      page: 2,
      search: 'gin',
      sort: 'newest',
    });
  });

  it('should throw BadRequestException on invalid input', () => {
    // Arrange: invalid sort and negative page
    const invalidInput = {
      page: -1,
      sort: 'unknown_sort',
    };

    // Act & Assert
    expect(() => pipe.transform(invalidInput)).toThrow(BadRequestException);
  });
});
