import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsObject, IsOptional, IsString, Min } from 'class-validator';
import { KnownFluid } from '../types';
import { Common } from '../../../common/thermal';

/**
 * Shared base for all single-fluid property requests.
 *
 * Resolution rules (same for every endpoint):
 *   - Provide `fluid` (a named species or 'air') to look up a known compound.
 *   - Provide `composition` (mole fractions by Species key) when `fluid = 'gas_mix'`
 *     or when no `fluid` is given.
 *   - `T_fluid_K` is always required (validated at service level so the error
 *     message is uniform across endpoints).
 *   - `P_Pa` defaults to atmospheric pressure (101 325 Pa).
 */
export class FluidBaseInputDto {
  @ApiPropertyOptional({ description: 'Named fluid or species (required if composition is absent)' })
  @IsOptional() @IsString()
  fluid?: KnownFluid;

  @ApiPropertyOptional({ description: 'Mole fractions by species key (required when fluid = gas_mix or absent)' })
  @IsOptional() @IsObject()
  composition?: Record<string, number>;

  @ApiPropertyOptional({ description: 'Fluid bulk temperature [K]', minimum: 1 })
  @IsOptional() @IsNumber() @Min(1)
  T_fluid_K?: number;

  @ApiPropertyOptional({ description: `Pressure [Pa], default ${Common.pAtm}` })
  @IsOptional() @IsNumber()
  P_Pa?: number;

  @ApiPropertyOptional({ enum: ['mole', 'mass'], description: 'Fraction type, default mole' })
  @IsOptional() @IsString()
  fractionType?: 'mole' | 'mass';
}

