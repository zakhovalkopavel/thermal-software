import {
  IsEnum, IsNumber, IsOptional, IsString, IsArray, ValidateNested, Min, Max,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { BoundaryConditionKind } from '../type/boundary-condition-kind.type';
import type { Geometry }              from '../type/geometry.type';
import type { InitialProfileKind }    from '../type/initial-profile-kind.type';
import type { RDistMode }             from '../type/r-dist-mode.type';
import type { AverageOptions }        from '../type/average-options.type';
import type { GaussNodes }            from '../type/gauss-nodes.type';

// ── Shape sub-DTO ─────────────────────────────────────────────────────────────

export class ShapeInputDto {
  @ApiProperty({
    description:
      'Body geometry. Use "auto" to derive the best 1D approximation from V/A ratio.',
    enum: ['plate','cylinder','sphere','hollow_cylinder','parallelepiped','finite_cylinder','auto'],
    example: 'cylinder',
  })
  @IsString()
  geometry: Geometry;

  @ApiPropertyOptional({ description: 'Half-thickness / outer radius (m)', example: 0.05 })
  @IsOptional() @IsNumber() radius?: number;

  @ApiPropertyOptional({ description: 'Inner radius for hollow cylinder (m)', example: 0.02 })
  @IsOptional() @IsNumber() innerRadius?: number;

  @ApiPropertyOptional({ description: 'Outer radius for hollow cylinder (m)', example: 0.05 })
  @IsOptional() @IsNumber() outerRadius?: number;

  @ApiPropertyOptional({ description: 'Parallelepiped half-length x₁ (m)', example: 0.05 })
  @IsOptional() @IsNumber() halfX?: number;

  @ApiPropertyOptional({ description: 'Parallelepiped half-length x₂ (m)', example: 0.05 })
  @IsOptional() @IsNumber() halfY?: number;

  @ApiPropertyOptional({ description: 'Parallelepiped half-length x₃ / finite cylinder half-height (m)', example: 0.05 })
  @IsOptional() @IsNumber() halfZ?: number;

  @ApiPropertyOptional({ description: 'Volume/surface-area ratio for "auto" mode (m)' })
  @IsOptional() @IsNumber() vOverA?: number;
}

// ── Average options sub-DTO ───────────────────────────────────────────────────

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

// ── Main request DTO ──────────────────────────────────────────────────────────

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

// ── Profile-at-depths request ─────────────────────────────────────────────────

export class ProfileAtDepthsRequestDto extends ProfileRequestDto {
  @ApiProperty({
    description: 'Normalised spatial coordinates (0 = centre, 1 = surface)',
    example: [0, 0.25, 0.5, 0.75, 1.0],
    type: [Number],
  })
  @IsArray() @IsNumber({}, { each: true })
  relativeDepths: number[];
}

// ── Response DTOs ─────────────────────────────────────────────────────────────

export class ThermalCriteriaDto {
  @ApiProperty({ description: 'Biot number' })        Bi: number;
  @ApiProperty({ description: 'Fourier number' })      Fo: number;
  @ApiProperty({ description: 'Rdist — heat-transfer characteristic length (m)' }) Rdist: number;
  @ApiProperty({ description: 'Rbi — Biot characteristic length (m)' })            Rbi: number;
}

export class TemperatureAtDepthResultDto {
  @ApiProperty({ description: 'Temperature T(x,τ) (°C)' })    temperature: number;
  @ApiProperty({ type: ThermalCriteriaDto })                   criteria: ThermalCriteriaDto;
}

export class TemperatureProfileResultDto {
  @ApiProperty({ description: 'Temperatures at requested depths (°C)', type: [Number] })
  temperatures: number[];
  @ApiProperty({ type: ThermalCriteriaDto }) criteria: ThermalCriteriaDto;
}

export class AverageTemperatureResultDto {
  @ApiProperty({ description: 'Volume-average temperature T̄(τ) (°C)' }) temperature: number;
  @ApiProperty({ type: ThermalCriteriaDto })                             criteria: ThermalCriteriaDto;
}
