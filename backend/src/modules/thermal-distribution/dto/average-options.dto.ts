import { IsNumber, IsOptional, IsString } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import type { AverageOptions } from '../type/average-options.type';
import type { GaussNodes } from '../type/gauss-nodes.type';

export class AverageOptionsDto {
  @ApiPropertyOptional({
    description: 'Volume averaging method',
    enum: ['series','gauss','auto'],
    default: 'series',
  })
  @IsOptional() @IsString()
  mode?: AverageOptions['mode'];

  @ApiPropertyOptional({
    description: 'Gauss-Legendre node count',
    enum: [8, 16, 32, 64],
    default: 32,
  })
  @IsOptional() @IsNumber()
  @Transform(({ value }) => value ?? 32)
  gaussNodes?: GaussNodes;

  @ApiPropertyOptional({
    description: 'Simpson quadrature nodes for arbitrary profile integrals',
    default: 128,
  })
  @IsOptional() @IsNumber()
  @Transform(({ value }) => value ?? 128)
  simpsonNodes?: number;
}
