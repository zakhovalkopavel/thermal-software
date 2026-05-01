import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNumber, IsObject, IsOptional, IsString, Min, ValidateNested } from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { FlowGeometry } from '../enums/flow-geometry.enum';
import { GeometryDimsDto } from './geometry-dims.dto';
import { KnownFluid, KNOWN_FLUID_DESCRIPTION } from '../types/known-fluid.type';
import { Common } from '../../../common/thermal';

const P_DEFAULT = Common.pAtm;
const G_DEFAULT = Common.g;

/**
 * Input for Gr = g·β·ΔT·L³ / ν²  (β = 2/(T_hot + T_cold) for ideal gas).
 *
 * Fluid bulk temperature defaults to `T_cold_K` when `T_fluid_K` is absent.
 *
 * Fluid identification — choose one:
 *   (A) Set `fluid` to a named species/alias (e.g. "air", "N2").
 *   (B) Set `fluid = "gas_mix"` and provide `composition` (mole fractions).
 */
export class GrashofInputDto {
  @ApiProperty({
    description: 'Hot-side (surface) temperature [K]. Must be > 0.',
    minimum: 1,
    example: 600,
  })
  @IsNumber() @Min(1) T_hot_K: number;

  @ApiProperty({
    description: 'Cold-side (fluid bulk) temperature [K]. Must be > 0.',
    minimum: 1,
    example: 300,
  })
  @IsNumber() @Min(1) T_cold_K: number;

  @ApiProperty({
    enum: FlowGeometry,
    description:
      'Flow/body geometry — determines the characteristic length L. ' +
      'See GET /thermodynamics/geometry/list.',
    example: FlowGeometry.VERTICAL_PLATE,
  })
  @IsEnum(FlowGeometry)
  geometry: FlowGeometry;

  @ApiProperty({
    type: GeometryDimsDto,
    description:
      'Geometry dimensions. For vertical_plate → {b: height [m]}; ' +
      'horizontal_cylinder → {a: diameter [m]}; sphere_natural → {a: diameter [m]}.',
    example: { b: 0.4 },
  })
  @ValidateNested() @Type(() => GeometryDimsDto)
  dimensions: GeometryDimsDto;

  // ── Fluid (option A: named species) ──────────────────────────────────
  @ApiPropertyOptional({
    description:
      `Named fluid or species: ${KNOWN_FLUID_DESCRIPTION}. ` +
      'Required when `composition` is absent.',
    example: 'air',
  })
  @IsOptional() @IsString() fluid?: KnownFluid;

  // ── Fluid (option B: custom mixture) ─────────────────────────────────
  @ApiPropertyOptional({
    description: 'Mole fractions by species key — required when `fluid = "gas_mix"` or fluid is absent.',
    example: { N2: 0.79, O2: 0.21 },
  })
  @IsOptional() @IsObject() composition?: Record<string, number>;

  @ApiPropertyOptional({
    description:
      'Fluid bulk temperature [K] for property evaluation. ' +
      'Defaults to `T_cold_K` when absent. Must be > 0.',
    minimum: 1,
    example: 350,
  })
  @IsOptional() @IsNumber() @Min(1) T_fluid_K?: number;

  @ApiPropertyOptional({
    description: `Absolute pressure [Pa]. Default: ${P_DEFAULT} Pa (standard atmospheric).`,
    default: P_DEFAULT,
    minimum: 1,
    example: P_DEFAULT,
  })
  @Transform(({ value }) => value ?? P_DEFAULT)
  @IsOptional() @IsNumber() P_Pa?: number;

  @ApiPropertyOptional({
    description:
      `Gravitational acceleration [m/s²]. Default: ${G_DEFAULT} (standard Earth gravity). ` +
      'Override for non-standard conditions.',
    default: G_DEFAULT,
    minimum: 0,
    example: G_DEFAULT,
  })
  @IsOptional() @IsNumber() g_m_s2?: number;
}
