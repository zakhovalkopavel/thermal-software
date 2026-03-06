import {
  IsNumber,
  IsOptional,
  IsArray,
  ValidateNested,
  IsBoolean,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class PsdFractionDto {
  @ApiProperty({ example: 1.0, description: 'Lower sieve size in mm' })
  @IsNumber()
  @Min(0)
  dMin_mm: number;

  @ApiProperty({ example: 5.0, description: 'Upper sieve size in mm' })
  @IsNumber()
  @Min(0)
  dMax_mm: number;

  @ApiProperty({ example: false, required: false, description: 'Lock this fraction' })
  @IsBoolean()
  @IsOptional()
  isFixed?: boolean;

  @ApiProperty({ example: 0.25, required: false, description: 'Fixed mass fraction (required if isFixed=true)' })
  @IsNumber()
  @Min(0)
  @Max(1)
  @IsOptional()
  massFraction?: number;
}

export class AndreasenPsdDto {
  @ApiProperty({ type: [PsdFractionDto], description: 'Particle size fractions' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PsdFractionDto)
  fractions: PsdFractionDto[];

  @ApiProperty({ example: 0.26, description: 'Distribution modulus q (0.2–0.4)' })
  @IsNumber()
  @Min(0.01)
  @Max(1)
  q: number;

  @ApiProperty({ example: null, required: false, description: 'Override Dmin in mm' })
  @IsNumber()
  @Min(0)
  @IsOptional()
  Dmin_mm?: number;

  @ApiProperty({ example: null, required: false, description: 'Override Dmax in mm' })
  @IsNumber()
  @Min(0)
  @IsOptional()
  Dmax_mm?: number;
}

export class FunkDingerPsdDto {
  @ApiProperty({ type: [PsdFractionDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PsdFractionDto)
  fractions: PsdFractionDto[];

  @ApiProperty({ example: 0.26 })
  @IsNumber()
  @Min(0.01)
  @Max(1)
  q: number;

  @ApiProperty({ example: 0.001, required: false, description: 'Minimum diameter in mm (default: 0.001)' })
  @IsNumber()
  @Min(0)
  @IsOptional()
  Dmin_mm?: number;

  @ApiProperty({ example: null, required: false })
  @IsNumber()
  @Min(0)
  @IsOptional()
  Dmax_mm?: number;
}

