import {
  IsEnum, IsNumber, IsOptional, IsString, IsArray, ValidateNested, Min, Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { BoundaryConditionKind } from '../type/boundary-condition-kind.type';
import type { InitialProfileKind }    from '../type/initial-profile-kind.type';
import type { RDistMode }             from '../type/r-dist-mode.type';
import { ShapeInputDto } from './shape-input.dto';
import { AverageOptionsDto } from './average-options.dto';

export class ProfileRequestDto {
  @ApiProperty({
    enum: ['BC_I','BC_III'],
    description: 'Boundary condition type. BC_I: prescribed surface temperature. BC_III: convective.',
    example: 'BC_III',
  })
  @IsEnum(['BC_I','BC_III'])
  bcType: BoundaryConditionKind;

  @ApiProperty({ description: 'Ambient / quenching medium temperature Tc (°C)', example: 20 })
  @IsNumber() Tc: number;

  @ApiProperty({ description: 'Initial body temperature T₀ (°C)', example: 850 })
  @IsNumber() T0: number;

  @ApiProperty({ description: 'Time elapsed τ (s)', example: 60, minimum: 0 })
  @IsNumber() @Min(0) tau: number;

  @ApiPropertyOptional({
    description: 'Heat transfer coefficient α (W/(m²·K)). Required for BC_III.',
    example: 1200,
  })
  @IsOptional() @IsNumber() alpha?: number;

  @ApiProperty({ description: 'Thermal conductivity λ (W/(m·K))', example: 45 })
  @IsNumber() lambda: number;

  @ApiProperty({ description: 'Thermal diffusivity a (m²/s)', example: 1.2e-5 })
  @IsNumber() thermalDiffusivity: number;

  @ApiProperty({ type: ShapeInputDto })
  @ValidateNested() @Type(() => ShapeInputDto)
  shape: ShapeInputDto;

  @ApiPropertyOptional({
    enum: ['true_dimension','V_over_A'],
    description: 'Characteristic length derivation mode. Default: true_dimension.',
    default: 'true_dimension',
  })
  @IsOptional() @IsString() rDistMode?: RDistMode;

  @ApiPropertyOptional({
    enum: ['uniform','parabolic','arbitrary'],
    description: 'Initial temperature profile kind. Default: uniform.',
    default: 'uniform',
  })
  @IsOptional() @IsString() initialProfile?: InitialProfileKind;

  @ApiPropertyOptional({ description: 'Parabolic profile: centre temperature T₀ᶜ (°C)' })
  @IsOptional() @IsNumber() T0Ctr?: number;

  @ApiPropertyOptional({ description: 'Parabolic profile: surface temperature T₀ˢ (°C)' })
  @IsOptional() @IsNumber() T0Surf?: number;

  @ApiPropertyOptional({
    description: 'BC_III parallelepiped: Biot per axis pair [Bi₁, Bi₂, Bi₃]',
    example: [5, 5, 10],
  })
  @IsOptional() @IsArray() biPerAxis?: [number, number, number];

  @ApiPropertyOptional({
    description: 'BC_III finite cylinder: [Bi_lateral, Bi_endface]',
    example: [5, 10],
  })
  @IsOptional() @IsArray() biCylinder?: [number, number];

  @ApiPropertyOptional({ description: 'Fourier series terms N. Default: 100', default: 100 })
  @IsOptional() @IsNumber() @Min(1) @Max(500) seriesTerms?: number;

  @ApiPropertyOptional({ type: AverageOptionsDto })
  @IsOptional() @ValidateNested() @Type(() => AverageOptionsDto)
  avg?: AverageOptionsDto;
}
