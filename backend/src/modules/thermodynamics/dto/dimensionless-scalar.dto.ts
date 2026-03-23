import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNumber, IsOptional, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { FlowGeometry } from '../enums/flow-geometry.enum';
import { GeometryDimsDto } from './dimensionless.dto';
import { Species } from '../enums/species.enum';

// ── Shared fluid input ───────────────────────────────────────────────────────

/**
 * Fluid state for dimensionless number calculation.
 * Either supply raw properties (Mode A) or a named species + T (Mode B).
 */
export class FluidStateDto {
  // Mode A — raw properties
  @ApiPropertyOptional({ description: 'Density [kg/m³]' })
  @IsOptional() @IsNumber() rho_kg_m3?: number;

  @ApiPropertyOptional({ description: 'Dynamic viscosity [Pa·s]' })
  @IsOptional() @IsNumber() mu_Pa_s?: number;

  @ApiPropertyOptional({ description: 'Isobaric specific heat [J/(kg·K)]' })
  @IsOptional() @IsNumber() Cp_J_kgK?: number;

  @ApiPropertyOptional({ description: 'Thermal conductivity [W/(m·K)]' })
  @IsOptional() @IsNumber() lambda_W_mK?: number;

  // Mode B — species + temperature
  @ApiPropertyOptional({ enum: Species, description: 'Named species (auto-resolves properties)' })
  @IsOptional() @IsEnum(Species) species?: Species;

  @ApiPropertyOptional({ description: 'Fluid temperature [K]' })
  @IsOptional() @IsNumber() @Min(1) T_K?: number;

  @ApiPropertyOptional({ description: 'Pressure [Pa], default 101325' })
  @IsOptional() @IsNumber() P_Pa?: number;
}

// ── Re ───────────────────────────────────────────────────────────────────────

export class ReynoldsInputDto {
  @ApiProperty({ description: 'Flow velocity [m/s]' }) @IsNumber() w_m_s: number;
  @ApiProperty({ enum: FlowGeometry }) @IsEnum(FlowGeometry) geometry: FlowGeometry;
  @ApiProperty({ type: GeometryDimsDto }) @ValidateNested() @Type(() => GeometryDimsDto) dims: GeometryDimsDto;
  @ApiProperty({ type: FluidStateDto }) @ValidateNested() @Type(() => FluidStateDto) fluid: FluidStateDto;
}

// ── Pr ───────────────────────────────────────────────────────────────────────

export class PrandtlInputDto {
  @ApiProperty({ enum: FlowGeometry }) @IsEnum(FlowGeometry) geometry: FlowGeometry;
  @ApiPropertyOptional({ type: GeometryDimsDto }) @IsOptional() @ValidateNested() @Type(() => GeometryDimsDto) dims?: GeometryDimsDto;
  @ApiProperty({ type: FluidStateDto }) @ValidateNested() @Type(() => FluidStateDto) fluid: FluidStateDto;
}

// ── Gr ───────────────────────────────────────────────────────────────────────

export class GrashofInputDto {
  @ApiProperty({ description: 'Hot-side (surface) temperature [K]' })  @IsNumber() @Min(1) T_hot_K: number;
  @ApiProperty({ description: 'Cold-side (fluid bulk) temperature [K]' }) @IsNumber() @Min(1) T_cold_K: number;
  @ApiProperty({ enum: FlowGeometry }) @IsEnum(FlowGeometry) geometry: FlowGeometry;
  @ApiProperty({ type: GeometryDimsDto }) @ValidateNested() @Type(() => GeometryDimsDto) dims: GeometryDimsDto;
  @ApiProperty({ type: FluidStateDto }) @ValidateNested() @Type(() => FluidStateDto) fluid: FluidStateDto;
  @ApiPropertyOptional({ description: 'Local gravitational acceleration [m/s²], default 9.80665' })
  @IsOptional() @IsNumber() g_m_s2?: number;
}

// ── Ra ───────────────────────────────────────────────────────────────────────

export class RayleighInputDto extends GrashofInputDto {}

// ── Nu → h ───────────────────────────────────────────────────────────────────

export class NusseltToHInputDto {
  @ApiProperty({ description: 'Nusselt number' }) @IsNumber() Nu: number;
  @ApiProperty({ description: 'Thermal conductivity [W/(m·K)]' }) @IsNumber() lambda_W_mK: number;
  @ApiProperty({ enum: FlowGeometry }) @IsEnum(FlowGeometry) geometry: FlowGeometry;
  @ApiProperty({ type: GeometryDimsDto }) @ValidateNested() @Type(() => GeometryDimsDto) dims: GeometryDimsDto;
}

// ── Result ───────────────────────────────────────────────────────────────────

export class ScalarDimensionlessResultDto {
  @ApiProperty({ description: 'Computed value' }) value: number;
  @ApiProperty({ description: 'Symbol name (Re, Pr, Gr, Ra, h…)' }) symbol: string;
  @ApiProperty({ description: 'Characteristic length used [m]' }) L_m: number;
  @ApiPropertyOptional({ description: 'Resolved fluid properties used in calculation' }) resolvedFluid?: {
    rho_kg_m3?: number; mu_Pa_s?: number; Cp_J_kgK?: number; lambda_W_mK?: number; nu_m2s?: number;
  };
}

