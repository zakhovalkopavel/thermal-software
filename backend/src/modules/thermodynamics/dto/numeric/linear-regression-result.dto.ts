import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class LinearRegressionResultDto {
  @ApiProperty({ description: 'Slope of y = slope·x + intercept', example: 2.01 }) slope: number;
  @ApiProperty({ description: 'Intercept of y = slope·x + intercept', example: 0.05 }) intercept: number;
  @ApiPropertyOptional({ description: 'Coefficient of determination R² (omitted when the fitting library does not provide it)' }) r2?: number;
  @ApiProperty({ description: 'Fitted formula with substituted values', example: 'y = 2.01·x + 0.05' }) formula: string;
}
