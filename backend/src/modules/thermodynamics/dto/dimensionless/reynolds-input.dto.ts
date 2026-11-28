import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsIn, IsNumber, IsObject, IsOptional, IsString, Min, ValidateNested } from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { FlowGeometry } from '../../enums/flow-geometry.enum';
import { FluidPhase } from '../../enums/fluid-phase.enum';
import { GeometryDimsDto } from '../geometry/geometry-dims.dto';
import { KnownFluid } from '../../types/known-fluid.type';
import { KnownFluids } from '../../utils/known-fluids';
import { STANDARD_CONDITIONS } from '../../../../common/thermal';

const P_DEFAULT = STANDARD_CONDITIONS.PRESSURE_PA;

/**
 * Input for Re = ρ·w·L / μ.
 *
 * Fluid identification — choose one:
 *   (A) Set `compoundId` to a catalogue id from GET /compounds/search (name slug).
 *   (B) Set `fluid` to a FLUID_REGISTRY key (e.g. "N2", "air").
 *   (C) Set `fluid = "gas_mix"` and provide `composition` (mole fractions).
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

  @ApiPropertyOptional({
    description:
      'Catalogue compoundId from search (name with spaces as `_`; `_1`/`_2`/… on collisions). '
      + 'Alternative to `fluid`.',
    example: 'nitrogen',
  })
  @IsOptional() @IsString()
  compoundId?: string;

  // ── Fluid (option B: named species) ──────────────────────────────────
  @ApiPropertyOptional({
    description:
      `FLUID_REGISTRY key or "gas_mix": ${KnownFluids.description()}. ` +
      'Required when `composition` / `compoundId` is absent.',
    example: 'air',
  })
  @IsOptional() @IsString()
  @IsIn(KnownFluids.allowedNames())
  fluid?: KnownFluid;

  // ── Fluid (option C: custom mixture) ─────────────────────────────────
  @ApiPropertyOptional({
    description: 'Mole fractions by species key — required when `fluid = "gas_mix"` or fluid is absent.',
    example: { N2: 0.79, O2: 0.21 },
  })
  @IsOptional() @IsObject() composition?: Record<string, number>;

  @ApiPropertyOptional({
    enum: FluidPhase,
    description:
      'Fluid phase. Default gas. Liquid uses catalogue liquid μ, λ, ρ, Cp '
      + '(compoundId, or water/H2O).',
    default: FluidPhase.Gas,
  })
  @IsOptional() @IsEnum(FluidPhase)
  phase?: FluidPhase;

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
