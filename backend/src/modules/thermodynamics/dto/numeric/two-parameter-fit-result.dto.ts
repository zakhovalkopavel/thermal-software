import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/** Result of the exponential (y = A·eᴮˣ) and power (y = A·xᴮ) fits */
export class TwoParameterFitResultDto {
  @ApiProperty({ description: 'Coefficient A', example: 1.0 }) A: number;
  @ApiProperty({ description: 'Exponent B', example: 1.0 }) B: number;
  @ApiPropertyOptional({ description: 'Coefficient of determination R² (omitted when the fitting library does not provide it)' }) r2?: number;
  @ApiProperty({ description: 'Fitted formula with substituted values' }) formula: string;
}
