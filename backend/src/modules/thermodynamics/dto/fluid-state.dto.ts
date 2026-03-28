import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNumber, IsOptional, Min } from 'class-validator';
import { Species } from '../enums/species.enum';

/**
 * Fluid state for scalar dimensionless-number calculations.
 * Mode B only: provide a named species + temperature (+ optional pressure).
 * Fluid properties (ρ, μ, Cp, λ) are resolved automatically from the registry.
 */
export class FluidStateDto {
  @ApiPropertyOptional({ enum: Species, description: 'Named species — auto-resolves ρ, μ, Cp, λ' })
  @IsOptional() @IsEnum(Species) species?: Species;

  @ApiPropertyOptional({ description: 'Fluid temperature [K]' })
  @IsOptional() @IsNumber() @Min(1) T_K?: number;

  @ApiPropertyOptional({ description: 'Pressure [Pa], default 101325' })
  @IsOptional() @IsNumber() P_Pa?: number;

  @ApiPropertyOptional({ description: 'Flow velocity [m/s] — required for Re' })
  @IsOptional() @IsNumber() w_m_s?: number;
}

