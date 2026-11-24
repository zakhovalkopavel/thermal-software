import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PolynomialFitResultDto {
  @ApiProperty({
    description: 'Coefficients c0…cn in ascending degree order (c0 = constant term)',
    type: 'object',
    additionalProperties: { type: 'number' },
    example: { c0: 1.0, c1: -0.1, c2: 1.0 },
  })
  coefficients: Record<string, number>;

  @ApiPropertyOptional({ description: 'Coefficient of determination R² (omitted when the fitting library does not provide it)' }) r2?: number;
  @ApiProperty({ description: 'Fitted formula with substituted values' }) formula: string;
}
