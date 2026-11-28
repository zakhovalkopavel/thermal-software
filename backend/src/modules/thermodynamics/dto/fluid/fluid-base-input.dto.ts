import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEnum, IsIn, IsNumber, IsObject, IsOptional, IsString, Min } from 'class-validator';
import { STANDARD_CONDITIONS } from '../../../../common/thermal';
import { FluidPhase } from '../../enums/fluid-phase.enum';
import { KnownFluid, KnownFluids } from '../../types';

/**
 * Shared base for all single-fluid property requests.
 *
 * Resolution rules (same for every endpoint):
 *   - Provide `fluid` as a `FLUID_REGISTRY` key (real compound) or `gas_mix`.
 *   - Provide `composition` (mole fractions by Species key) when `fluid = 'gas_mix'`
 *     or when no `fluid` is given.
 *   - `phase: 'liquid'` + `compoundId` (or water/`H2O`) uses liquid transport equations.
 *   - `T_fluid_K` is always required (validated at service level so the error
 *     message is uniform across endpoints).
 *   - `P_Pa` defaults to atmospheric pressure (101 325 Pa).
 */
export class FluidBaseInputDto {
  @ApiPropertyOptional({
    description:
      `Named fluid: a key of FLUID_REGISTRY (common/thermal/compound/gas) or "gas_mix". `
      + `One of: ${KnownFluids.description()}.`,
    example: 'air',
  })
  @IsOptional() @IsString()
  @Transform(({ value }) => KnownFluids.normalize(value))
  @IsIn(KnownFluids.allowedNames())
  fluid?: KnownFluid;

  @ApiPropertyOptional({
    description:
      'Catalogue compoundId from GET /compounds/search (name with spaces as `_`; `_1`/`_2`/… on collisions). '
      + 'Alternative to `fluid`. Required for most liquids (`phase: liquid`).',
    example: 'carbon_dioxide',
  })
  @IsOptional() @IsString()
  compoundId?: string;

  @ApiPropertyOptional({
    description: 'Mole fractions by species key (required when fluid = gas_mix or absent). Values must sum to 1.',
    example: { N2: 0.79, O2: 0.21 },
  })
  @IsOptional() @IsObject()
  composition?: Record<string, number>;

  @ApiPropertyOptional({ description: 'Fluid bulk temperature [K]', minimum: 1, example: STANDARD_CONDITIONS.TEMPERATURE_K })
  @IsOptional() @IsNumber() @Min(1)
  T_fluid_K?: number;

  @ApiPropertyOptional({ description: `Pressure [Pa], default ${STANDARD_CONDITIONS.PRESSURE_PA}` })
  @IsOptional() @IsNumber()
  P_Pa?: number;

  @ApiPropertyOptional({
    enum: FluidPhase,
    description:
      'Fluid phase. Default gas. Liquid uses catalogue liquid μ, λ, ρ, Cp '
      + '(compoundId, or water/H2O). Mixtures are not supported for liquid.',
    default: FluidPhase.Gas,
  })
  @IsOptional() @IsEnum(FluidPhase)
  phase?: FluidPhase;

  @ApiPropertyOptional({ enum: ['mole', 'mass'], description: 'Fraction type, default mole' })
  @IsOptional() @IsString()
  fractionType?: 'mole' | 'mass';
}

