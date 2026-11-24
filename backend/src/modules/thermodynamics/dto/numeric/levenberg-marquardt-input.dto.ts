import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsInt, IsNumber, IsOptional, IsString, Min } from 'class-validator';

/**
 * Input for nonlinear least-squares curve fitting via the Levenberg-Marquardt algorithm.
 * Equivalent to scipy.optimize.curve_fit.
 *
 * The model must be provided as a curried JS arrow-function string:
 *   `([param1, param2, …]) => x => <expression>`
 */
export class LevenbergMarquardtInputDto {
  @ApiProperty({
    description: 'Independent variable values (x-axis).',
    example: [0, 1, 2, 3, 4],
  })
  @IsArray() @IsNumber({}, { each: true }) x: number[];

  @ApiProperty({
    description: 'Observed dependent values (y-axis), same length as x.',
    example: [1.0, 2.72, 7.39, 20.1, 54.6],
  })
  @IsArray() @IsNumber({}, { each: true }) y: number[];

  @ApiProperty({
    description:
      'Model as a curried JS arrow-function string: ' +
      '`([param1, param2, …]) => x => <expression>`. ' +
      'Example: "([A,B]) => x => A * Math.exp(B * x)".',
    example: '([A,B]) => x => A * Math.exp(B * x)',
  })
  @IsString() modelExpression: string;

  @ApiProperty({
    description:
      'Initial parameter guess vector. Length must match the number of parameters in the model.',
    example: [1, 1],
  })
  @IsArray() @IsNumber({}, { each: true }) initialValues: number[];

  @ApiPropertyOptional({
    description: 'Maximum number of Levenberg-Marquardt iterations. Default: 100.',
    default: 100,
    example: 200,
  })
  @IsOptional() @IsInt() @Min(1) maxIterations?: number;
}

