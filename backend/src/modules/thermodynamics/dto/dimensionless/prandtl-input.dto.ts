import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsNumber, IsObject, IsOptional, IsString, Min } from 'class-validator';
import { Transform } from 'class-transformer';
import { KnownFluid } from '../../types/known-fluid.type';
import { KnownFluids } from '../../utils/known-fluids';
import { STANDARD_CONDITIONS } from '../../../../common/thermal';

const P_DEFAULT = STANDARD_CONDITIONS.PRESSURE_PA;

/**
 * Input for Pr = μ·Cp / λ.
 *
 * Prandtl number is a pure thermophysical property of the fluid — it does not
 * depend on geometry or flow velocity.
 *
 * Fluid identification — choose one:
 *   (A) Set `fluid` to a FLUID_REGISTRY key (e.g. "air", "CO2").
 *   (B) Set `fluid = "gas_mix"` and provide `composition` (mole fractions).
 */
export class PrandtlInputDto {
  @ApiPropertyOptional({
    description:
      `FLUID_REGISTRY key or "gas_mix": ${KnownFluids.description()}. ` +
      'Required when `composition` / `compoundId` is absent.',
    example: 'CO2',
  })
  @IsOptional() @IsString()
  @IsIn(KnownFluids.allowedNames())
  fluid?: KnownFluid;

  @ApiPropertyOptional({
    description:
      'Catalogue compoundId from search (name with spaces as `_`; `_1`/`_2`/… on collisions). '
      + 'Alternative to `fluid`.',
    example: 'carbon_dioxide',
  })
  @IsOptional() @IsString() compoundId?: string;

  @ApiPropertyOptional({
    description: 'Mole fractions by species key — required when `fluid = "gas_mix"` or fluid is absent.',
    example: { N2: 0.79, O2: 0.21 },
  })
  @IsOptional() @IsObject() composition?: Record<string, number>;

  @ApiProperty({
    description: 'Fluid temperature [K] at which Pr is evaluated. Must be > 0.',
    minimum: 1,
    example: 800,
  })
  @IsNumber() @Min(1) T_fluid_K: number;

  @ApiPropertyOptional({
    description: `Absolute pressure [Pa]. Default: ${P_DEFAULT} Pa (standard atmospheric). Affects density-dependent properties.`,
    default: P_DEFAULT,
    minimum: 1,
    example: 101325,
  })
  @Transform(({ value }) => value ?? P_DEFAULT)
  @IsOptional() @IsNumber() P_Pa?: number;
}
