import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString } from 'class-validator';

/**
 * Input for bracketed 1-D root finding (brentq) and bracketed minimisation (brent).
 * f(a) and f(b) must have opposite signs for root finding.
 */
export class BrentqInputDto {
  @ApiProperty({
    description: 'Left bracket bound. f(a) and f(b) must have opposite signs.',
    example: 0,
  })
  @IsNumber() a: number;

  @ApiProperty({
    description: 'Right bracket bound. f(a) and f(b) must have opposite signs.',
    example: 2,
  })
  @IsNumber() b: number;

  @ApiPropertyOptional({
    description: 'Absolute convergence tolerance. Default: 1e-10.',
    default: 1e-10,
    example: 1e-10,
  })
  @IsOptional() @IsNumber() tol?: number;

  @ApiProperty({
    description:
      'JavaScript expression for f(x) — use the variable name `x`. ' +
      'Example: "Math.cos(x) - x" finds the root of cos(x) = x.',
    example: 'Math.cos(x) - x',
  })
  @IsString() expression: string;
}

