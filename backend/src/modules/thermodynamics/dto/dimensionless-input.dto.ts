import {
  IsEnum, IsNumber, IsObject, IsOptional, IsBoolean, IsString, ValidateNested,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { FlowGeometry } from '../enums/flow-geometry.enum';
import { FlowRegime } from '../types/flow-regime.type';
import { CorrelationName } from '../types/correlation-name.type';
import { KnownFluid } from '../types/known-fluid.type';
import { GeometryDimsDto } from './geometry-dims.dto';
import {Common} from "../../../common/thermal";

/** Standard temperature [K] — used as default bulk temperature when none supplied. */
const T_DEFAULT = Common.Tstandart;
const P_DEFAULT = Common.pAtm;

/**
 * Input for the full dimensionless-number + Nusselt correlation endpoint.
 *
 * Defaults:
 *   T_fluid_K = 293.15 K  (standard temperature, ISO 1)
 *   w_m_s     = 0         (natural convection mode — Re = 0, regime resolved as NATURAL)
 */
export class DimensionlessInputDto {
  @ApiProperty({ enum: FlowGeometry })
  @IsEnum(FlowGeometry)
  geometry: FlowGeometry;

  // ── Fluid by name + conditions ────────────────────────────────
  @ApiPropertyOptional({ description: 'Named fluid or species' })
  @IsOptional() @IsString() fluid?: KnownFluid;

  @ApiPropertyOptional({ description: 'Mole fractions by species (required when fluid = gas_mix)' })
  @IsOptional() @IsObject() composition?: Record<string, number>;

  @ApiPropertyOptional({
    description: `Fluid bulk temperature [K]. Default: ${T_DEFAULT} K (standard temperature).`,
    default: T_DEFAULT,
  })
  @IsOptional() @IsNumber()
  @Transform(({ value }) => value ?? T_DEFAULT)
  T_fluid_K?: number = T_DEFAULT;

  @ApiPropertyOptional({ description: 'Surface/wall temperature [K] — required for Gr/Ra' })
  @IsOptional() @IsNumber() T_surface_K?: number;

  @ApiPropertyOptional({ description: `Pressure [Pa], default ${P_DEFAULT}` })
  @Transform(({ value }) => value ?? P_DEFAULT)
  @IsOptional() @IsNumber() P_Pa?: number;

  @ApiPropertyOptional({
    description: 'Flow velocity [m/s]. Default: 0 → natural convection regime.',
    default: 0,
  })
  @IsOptional() @IsNumber()
  @Transform(({ value }) => value ?? 0)
  w_m_s?: number = 0;

  // ── Geometry ──────────────────────────────────────────────────────────
  @ApiPropertyOptional({ type: GeometryDimsDto })
  @IsOptional() @ValidateNested() @Type(() => GeometryDimsDto)
  dims?: GeometryDimsDto;

  // ── Control ───────────────────────────────────────────────────────────
  @ApiPropertyOptional({ enum: FlowRegime, description: 'Force a specific flow regime (overrides auto-detection)' })
  @IsOptional() @IsEnum(FlowRegime) forceRegime?: FlowRegime;

  @ApiPropertyOptional({ description: 'Preferred Nusselt correlation name' })
  @IsOptional() @IsString() preferredCorrelation?: CorrelationName;

  @ApiPropertyOptional({ description: 'Return results from all applicable correlations' })
  @IsOptional() @IsBoolean() compareAll?: boolean;

  @ApiPropertyOptional({ description: 'Use diffusion-based correlation (Sc replaces Pr)' })
  @IsOptional() @IsBoolean() isDiffusion?: boolean;

  @ApiPropertyOptional({ description: 'True = heating (fluid heated by surface), affects wall-correction' })
  @IsOptional() @IsBoolean() isHeating?: boolean;
}

