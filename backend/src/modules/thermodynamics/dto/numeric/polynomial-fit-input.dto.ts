import { ApiProperty } from '@nestjs/swagger';
import { IsInt, Min } from 'class-validator';
import { XYInputDto } from './xy-input.dto';

/** Input for polynomial curve fitting: y = c₀ + c₁x + … + cₙxⁿ */
export class PolynomialFitInputDto extends XYInputDto {
  @ApiProperty({
    description:
      'Polynomial degree n ≥ 1. Returns n+1 coefficients [c0, c1, …, cn] ' +
      'for y = c0 + c1·x + … + cn·xⁿ.',
    minimum: 1,
    example: 2,
  })
  @IsInt() @Min(1) degree: number;
}

