import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsObject, IsOptional, IsString, Min } from 'class-validator';

/** Input for Nelder-Mead gradient-free N-variable minimisation. */
export class NelderMeadInputDto {
  @ApiProperty({
    description:
      'Objective function expression. Use the variable names defined in `variables` ' +
      '(e.g. x1, x2, x3). Example: "(x1-2)**2 + (x2-3)**2" minimises at x1=2, x2=3.',
    example: '(x1-2)**2 + (x2-3)**2',
  })
  @IsString() expression: string;

  @ApiProperty({
    description:
      'Named initial guess values. Keys define the variable names used in `expression` ' +
      '(e.g. x1, x2). Values are the starting points. The number of entries defines the ' +
      'dimensionality of the problem.',
    example: { x1: 0, x2: 0 },
  })
  @IsObject() variables: Record<string, number>;

  @ApiPropertyOptional({
    description: 'Maximum number of Nelder-Mead iterations. Default: 1000.',
    default: 1000,
    example: 500,
  })
  @IsOptional() @IsInt() @Min(1) maxIterations?: number;
}
