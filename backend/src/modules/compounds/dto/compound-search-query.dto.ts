import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsBoolean, IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

export class CompoundSearchQueryDto {
  @ApiPropertyOptional({ description: 'Search query (name, synonym, CAS, or formula)', example: 'CO2' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  q?: string;

  @ApiPropertyOptional({ description: 'Max hits (1–50)', default: 20, minimum: 1, maximum: 50 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number;

  @ApiPropertyOptional({
    description: 'When true, only compounds with gas thermo + transport usable for fluid APIs',
    default: false,
  })
  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true' || value === '1')
  @IsBoolean()
  gasesOnly?: boolean;

  @ApiPropertyOptional({
    description: 'When true, only compounds with liquid μ, λ, ρ and Cp usable for liquid fluid / HTC APIs',
    default: false,
  })
  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true' || value === '1')
  @IsBoolean()
  liquidsOnly?: boolean;
}
