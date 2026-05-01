import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsObject, IsOptional, IsString, Min } from 'class-validator';
import { Transform } from 'class-transformer';
import { KnownFluid, KNOWN_FLUID_DESCRIPTION } from '../types/known-fluid.type';
import { Common } from '../../../common/thermal';

const P_DEFAULT = Common.pAtm;

/**
 * Input for Pr = μ·Cp / λ.
 *
 * Prandtl number is a pure thermophysical property of the fluid — it does not
 * depend on geometry or flow velocity.
 *
 * Fluid identification — choose one:
 *   (A) Set `fluid` to a named species/alias (e.g. "air", "CO2").
 *   (B) Set `fluid = "gas_mix"` and provide `composition` (mole fractions).
 */
export class PrandtlInputDto {
  @ApiPropertyOptional({
    description:
      `Named fluid or species: ${KNOWN_FLUID_DESCRIPTION}. ` +
      'Required when `composition` is absent.',
    example: 'CO2',
  })
  @IsOptional() @IsString() fluid?: KnownFluid;

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
