import {
  IsEnum, IsNumber, IsObject, IsOptional, IsBoolean,
  IsString, ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { FlowGeometry } from '../enums/flow-geometry.enum';
import { BodyGeometry } from '../enums/body-geometry.enum';
import { CorrelationName } from '../types/correlation-name.type';
import { KnownFluid } from '../types/known-fluid.type';
import { FlowRegime } from '../types/flow-regime.type';

export { CorrelationName } from '../types/correlation-name.type';
export { KnownFluid } from '../types/known-fluid.type';
export { FlowRegime } from '../types/flow-regime.type';

export class GeometryDimsDto {
  @ApiPropertyOptional() @IsOptional() @IsNumber() a?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() b?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() c?: number;
  @ApiPropertyOptional({ description: 'Explicit characteristic length override [m]' })
  @IsOptional() @IsNumber() L?: number;
  @ApiPropertyOptional({ description: 'Porosity (packed bed)' })
  @IsOptional() @IsNumber() epsilon?: number;
  @ApiPropertyOptional({ description: 'Transverse pitch (tube bank) [m]' })
  @IsOptional() @IsNumber() S_T?: number;
  @ApiPropertyOptional({ description: 'Longitudinal pitch (tube bank) [m]' })
  @IsOptional() @IsNumber() S_L?: number;
  @ApiPropertyOptional({ description: 'Inclination from vertical [°]' })
  @IsOptional() @IsNumber() angle_deg?: number;
  @ApiPropertyOptional({ description: 'Angular velocity [rad/s]' })
  @IsOptional() @IsNumber() omega?: number;
  @ApiPropertyOptional({ description: 'Pipe/coil diameter (helical coil) [m]' })
  @IsOptional() @IsNumber() D?: number;
  @ApiPropertyOptional({ description: 'Coil diameter (helical coil) [m]' })
  @IsOptional() @IsNumber() D_c?: number;
  @ApiPropertyOptional({ description: 'Rib height (ribbed channel)' })
  @IsOptional() @IsNumber() e?: number;
  @ApiPropertyOptional({ description: 'Rib pitch (ribbed channel)' })
  @IsOptional() @IsNumber() p?: number;
  @ApiPropertyOptional({ description: 'Jet-to-surface spacing (impinging jet) [m]' })
  @IsOptional() @IsNumber() H?: number;
  @ApiPropertyOptional({ description: 'Radial distance from jet axis (impinging jet) [m]' })
  @IsOptional() @IsNumber() r?: number;
  @ApiPropertyOptional({ description: 'Nozzle diameter (impinging jet) [m]' })
  @IsOptional() @IsNumber() d_jet?: number;
  @ApiPropertyOptional({ description: 'Jet area fraction (impinging jet array)' })
  @IsOptional() @IsNumber() f_jet?: number;
}


export class DimensionlessInputDto {
  @ApiProperty({ enum: FlowGeometry })
  @IsEnum(FlowGeometry)
  geometry: FlowGeometry;

  // ── Mode A: raw fluid properties ──────────────────────────────────────
  @ApiPropertyOptional() @IsOptional() @IsNumber() rho_kg_m3?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() mu_Pa_s?: number;
  @ApiPropertyOptional({ description: 'Viscosity at wall temperature [Pa·s]' })
  @IsOptional() @IsNumber() mu_s_Pa_s?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() Cp_J_kgK?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() lambda_W_mK?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() w_m_s?: number;

  // ── Mode B: fluid by name + conditions ────────────────────────────────
  @ApiPropertyOptional() @IsOptional() @IsString() fluid?: KnownFluid;
  @ApiPropertyOptional() @IsOptional() @IsObject() composition?: Record<string, number>;
  @ApiPropertyOptional() @IsOptional() @IsNumber() T_fluid_K?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() T_surface_K?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() P_Pa?: number;

  // ── Geometry ──────────────────────────────────────────────────────────
  @ApiPropertyOptional({ type: GeometryDimsDto })
  @IsOptional() @ValidateNested() @Type(() => GeometryDimsDto)
  dims?: GeometryDimsDto;

  // ── Pre-computed dimensionless numbers ────────────────────────────────
  @ApiPropertyOptional() @IsOptional() @IsNumber() Re?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() Pr?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() Gr?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() Ra?: number;

  // ── Control ───────────────────────────────────────────────────────────
  @ApiPropertyOptional({ enum: FlowRegime, description: 'Force a specific flow regime (overrides auto-detection)' })
  @IsOptional() @IsEnum(FlowRegime) forceRegime?: FlowRegime;
  @ApiPropertyOptional() @IsOptional() @IsString() preferredCorrelation?: CorrelationName;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() compareAll?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isDiffusion?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isHeating?: boolean;
}

export class DimensionlessResultDto {
  @ApiProperty() Re?: number;
  @ApiProperty() Pr?: number;
  @ApiProperty() Gr?: number;
  @ApiProperty() Ra?: number;
  @ApiProperty() Nu: number;
  @ApiPropertyOptional() h_W_m2K?: number;
  @ApiProperty() correlation: CorrelationName;
  @ApiProperty({ enum: FlowRegime }) regime: FlowRegime;
  @ApiProperty() isNatural: boolean;
  @ApiPropertyOptional() preferredRequested?: CorrelationName;
  @ApiProperty() preferredUsed: boolean;
  @ApiPropertyOptional() preferredRejectedReason?: string;
  @ApiPropertyOptional() warning?: string;
  @ApiProperty() rangeValid: boolean;
  @ApiPropertyOptional() allCorrelations?: Record<string, { Nu: number; rangeValid: boolean; warning?: string }>;
}

export class BodyGeometryInputDto {
  @ApiProperty({ enum: BodyGeometry })
  @IsEnum(BodyGeometry)
  geometry: BodyGeometry;

  @ApiPropertyOptional({ description: 'Insulation thickness [m]' })
  @IsOptional() @IsNumber() h?: number;

  @ApiProperty({ type: GeometryDimsDto })
  @ValidateNested() @Type(() => GeometryDimsDto)
  dims: GeometryDimsDto;
}

export class BodyGeometryResultDto {
  @ApiProperty() surface: number;
  @ApiProperty() volume: number;
  @ApiProperty() meanBeamLength: number;
  @ApiProperty() characteristicLength: number;
}

