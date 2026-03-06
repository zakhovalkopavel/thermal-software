import { IsNumber, IsOptional, IsArray, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class PackingCpmDto {
  @ApiProperty({
    example: [0.31, 0.28, 0.25, 0.16],
    description: 'Mass fractions of each size fraction (must sum to 1)',
  })
  @IsArray()
  @IsNumber({}, { each: true })
  massFractions: number[];

  @ApiProperty({
    example: [2700, 2700, 2700, 2700],
    description: 'Density of each fraction in kg/m³',
  })
  @IsArray()
  @IsNumber({}, { each: true })
  densities_kgm3: number[];

  @ApiProperty({
    example: [7.5, 3.0, 0.55, 0.055],
    description: 'Representative diameter of each fraction in mm',
  })
  @IsArray()
  @IsNumber({}, { each: true })
  diameters_mm: number[];

  @ApiProperty({
    example: 10,
    required: false,
    description: 'Applied compaction pressure in MPa (default: 0)',
  })
  @IsNumber()
  @Min(0)
  @IsOptional()
  compactionPressure_MPa?: number;
}

export class PackingFurnasDto {
  @ApiProperty({
    example: [0.31, 0.28, 0.25, 0.16],
    description: 'Mass fractions of each size fraction',
  })
  @IsArray()
  @IsNumber({}, { each: true })
  massFractions: number[];

  @ApiProperty({
    example: [2700, 2700, 2700, 2700],
    description: 'Density of each fraction in kg/m³',
  })
  @IsArray()
  @IsNumber({}, { each: true })
  densities_kgm3: number[];

  @ApiProperty({
    example: [7.5, 3.0, 0.55, 0.055],
    description: 'Representative diameter of each fraction in mm',
  })
  @IsArray()
  @IsNumber({}, { each: true })
  diameters_mm: number[];

  @ApiProperty({
    example: 0.75,
    required: false,
    description: 'Void filling efficiency factor (0–1, default: 0.75)',
  })
  @IsNumber()
  @Min(0)
  @Max(1)
  @IsOptional()
  efficiencyFactor?: number;
}

