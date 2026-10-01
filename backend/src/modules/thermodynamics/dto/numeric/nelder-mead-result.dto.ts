import { ApiProperty } from '@nestjs/swagger';

export class NelderMeadResultDto {
  @ApiProperty({
    description: 'Minimiser by variable name (same keys as the request `variables`)',
    type: 'object',
    additionalProperties: { type: 'number' },
    example: { x1: 2, x2: 3 },
  })
  variables: Record<string, number>;

  @ApiProperty({ description: 'Function value at the minimum', example: 0 }) fval: number;
}
