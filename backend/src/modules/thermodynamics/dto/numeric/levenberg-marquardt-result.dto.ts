import { ApiProperty } from '@nestjs/swagger';

export class LevenbergMarquardtResultDto {
  @ApiProperty({ type: [Number], description: 'Fitted parameter values in the order of `initialValues`', example: [1.0, 1.0] }) parameterValues: number[];
  @ApiProperty({ description: 'Residual error of the fit (sum of squared residuals)', example: 0.0012 }) parameterError: number;
  @ApiProperty({ description: 'Iterations performed', example: 12 }) iterations: number;
  @ApiProperty({ description: 'Model expression with substituted parameter values' }) formula: string;
}
