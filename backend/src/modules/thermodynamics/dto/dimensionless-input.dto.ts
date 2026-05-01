import {
  IsEnum, IsNumber, IsObject, IsOptional, IsBoolean, IsString, ValidateNested,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { FlowGeometry } from '../enums/flow-geometry.enum';
import { FlowRegime } from '../types/flow-regime.type';
import { CorrelationName } from '../types/correlation-name.type';
import { KnownFluid, KNOWN_FLUID_DESCRIPTION } from '../types/known-fluid.type';
import { GeometryDimsDto } from './geometry-dims.dto';
import {Common} from "../../../common/thermal";

/** Standard temperature [K] — used as default bulk temperature when none supplied. */
const T_DEFAULT = Common.Tstandart;
const P_DEFAULT = Common.pAtm;

/**
 * Input for the full dimensionless-number + Nusselt correlation endpoint.
 *
 * Fluid identification — choose one:
 *   (A) Set `fluid` to a named species/alias (e.g. "N2", "air", "CO2").
 *   (B) Set `fluid = "gas_mix"` and provide a `composition` map of mole fractions.
 *
 * Defaults:
 *   T_fluid_K = 293.15 K  (standard temperature, ISO 1)
 *   w_m_s     = 0         (natural convection mode — Re = 0, regime resolved as NATURAL)
 *   P_Pa      = 101325 Pa (standard atmospheric pressure)
 *   g_m_s2    = 9.80665   (standard gravity)
 */
export class DimensionlessInputDto {
  @ApiProperty({
    enum: FlowGeometry,
    description:
      'Flow/body geometry key. Determines which dimension fields (a, b, c …) are required ' +
      'in `dimensions` and which Nusselt correlations are available. ' +
      'See GET /thermodynamics/geometry/list for the full list with required dimensions.',
    example: FlowGeometry.PIPE_CIRCULAR,
  })
  @IsEnum(FlowGeometry)
  geometry: FlowGeometry;

  // ── Fluid by name + conditions ────────────────────────────────
  @ApiPropertyOptional({
    description:
      `Named fluid or species. One of: ${KNOWN_FLUID_DESCRIPTION}. ` +
      'Required when `composition` is absent.',
    example: 'N2',
  })
  @IsOptional() @IsString() fluid?: KnownFluid;

  @ApiPropertyOptional({
    description:
      'Mole fractions by species key — required when `fluid = "gas_mix"` or when `fluid` is absent. ' +
      'Values must sum to 1.',
    example: { N2: 0.79, O2: 0.21 },
  })
  @IsOptional() @IsObject() composition?: Record<string, number>;

  @ApiPropertyOptional({
    description: `Fluid bulk temperature [K]. Default: ${T_DEFAULT} K (ISO 1 standard temperature). Must be > 0.`,
    default: T_DEFAULT,
    minimum: 1,
    example: 600,
  })
  @IsOptional() @IsNumber()
  @Transform(({ value }) => value ?? T_DEFAULT)
  T_fluid_K?: number = T_DEFAULT;

  @ApiPropertyOptional({
    description:
      'Surface / wall temperature [K]. Required for Gr and Ra calculations ' +
      '(natural/mixed convection). Must be > 0.',
    minimum: 1,
    example: 800,
  })
  @IsOptional() @IsNumber() T_surface_K?: number;

  @ApiPropertyOptional({
    description: `Absolute pressure [Pa]. Default: ${P_DEFAULT} Pa (standard atmospheric).`,
    default: P_DEFAULT,
    minimum: 1,
    example: 101325,
  })
  @Transform(({ value }) => value ?? P_DEFAULT)
  @IsOptional() @IsNumber() P_Pa?: number;

  @ApiPropertyOptional({
    description:
      'Flow velocity [m/s]. Default: 0 → natural convection regime (Re = 0). ' +
      'Set to a positive value for forced or mixed convection.',
    default: 0,
    minimum: 0,
    example: 5,
  })
  @IsOptional() @IsNumber()
  @Transform(({ value }) => value ?? 0)
  w_m_s?: number = 0;

  // ── Geometry ──────────────────────────────────────────────────────────
  @ApiPropertyOptional({
    type: GeometryDimsDto,
    description:
      'Geometry dimensions object. Required fields depend on `geometry` — ' +
      'see GET /thermodynamics/geometry/list. ' +
      'Example for pipe_circular: {"a": 0.05}; for sphere_forced: {"a": 0.03}; ' +
      'for vertical_plate: {"b": 0.4}.',
  })
  @IsOptional() @ValidateNested() @Type(() => GeometryDimsDto)
  dimensions?: GeometryDimsDto;

  // ── Gravity ───────────────────────────────────────────────────────────
  @ApiPropertyOptional({
    description:
      'Gravitational acceleration [m/s²]. Default: 9.80665 (standard Earth gravity). ' +
      'Override for non-standard conditions (e.g. elevated platform or simulation).',
    default: 9.80665,
    minimum: 0,
    example: 9.80665,
  })
  @IsOptional() @IsNumber() g_m_s2?: number;

  // ── Control ───────────────────────────────────────────────────────────
  @ApiPropertyOptional({
    enum: FlowRegime,
    description:
      'Force a specific flow regime instead of auto-detection from Re/Ra values. ' +
      'Useful when you know the regime a priori.',
  })
  @IsOptional() @IsEnum(FlowRegime) forceRegime?: FlowRegime;

  @ApiPropertyOptional({
    description:
      'Preferred Nusselt correlation name. The system will attempt to use this correlation; ' +
      'if it is out of validity range the best-available correlation is used instead ' +
      '(see `preferredRejectedReason` in response).',
  })
  @IsOptional() @IsString() preferredCorrelation?: CorrelationName;

  @ApiPropertyOptional({
    description: 'When true, the response includes Nu from all applicable correlations in `allCorrelations`.',
    default: false,
  })
  @IsOptional() @IsBoolean() compareAll?: boolean;

  @ApiPropertyOptional({
    description: 'When true, uses mass-diffusion-based correlation (Schmidt number replaces Prandtl).',
    default: false,
  })
  @IsOptional() @IsBoolean() isDiffusion?: boolean;

  @ApiPropertyOptional({
    description: 'True = fluid is being heated by the surface; affects wall-correction factor. Default: false.',
    default: false,
  })
  @IsOptional() @IsBoolean() isHeating?: boolean;
}
