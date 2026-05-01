import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNumber, IsObject, IsOptional, IsString, Min, ValidateNested } from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { FlowGeometry } from '../enums/flow-geometry.enum';
import { GeometryDimsDto } from './geometry-dims.dto';
import { KnownFluid, KNOWN_FLUID_DESCRIPTION } from '../types/known-fluid.type';
import { Common } from '../../../common/thermal';

const P_DEFAULT = Common.pAtm;

/**
 * Input for Re = ρ·w·L / μ.
 *
 * Fluid identification — choose one:
 *   (A) Set `fluid` to a named species/alias (e.g. "N2", "air").
 *   (B) Set `fluid = "gas_mix"` and provide `composition` (mole fractions).
 */
export class ReynoldsInputDto {
  @ApiProperty({
    enum: FlowGeometry,
    description:
      'Flow geometry key — determines the characteristic length L. ' +
      'See GET /thermodynamics/geometry/list.',
    example: FlowGeometry.PIPE_CIRCULAR,
  })
  @IsEnum(FlowGeometry)
  geometry: FlowGeometry;

  @ApiProperty({
    type: GeometryDimsDto,
    description:
      'Geometry dimensions. Required fields depend on `geometry`. ' +
      'pipe_circular → {a: D [m]}; sphere_forced → {a: D_sphere [m]}; ' +
      'flat_plate → {c: L_plate [m]}; duct_rectangular → {a: width, b: height}.',
    example: { a: 0.05 },
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
    description: 'Fluid bulk temperature [K]. Must be > 0.',
    minimum: 1,
    example: 500,
  })
  @IsOptional() @IsNumber() @Min(1) T_fluid_K?: number;

  @ApiPropertyOptional({
    description: `Absolute pressure [Pa]. Default: ${P_DEFAULT} Pa (standard atmospheric).`,
    default: P_DEFAULT,
    minimum: 1,
    example: 101325,
  })
  @Transform(({ value }) => value ?? P_DEFAULT)
  @IsOptional() @IsNumber() P_Pa?: number;

  @ApiProperty({
    description: 'Flow velocity [m/s]. Must be > 0 for Re calculation.',
    minimum: 0,
    exclusiveMinimum: true,
    example: 10,
  })
  @IsNumber() @Min(0) w_m_s: number;
}
