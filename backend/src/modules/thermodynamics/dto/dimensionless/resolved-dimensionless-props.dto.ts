import { ApiProperty } from '@nestjs/swagger';
import { IsNumber } from 'class-validator';

/**
 * Resolved dimensionless properties — output of DimensionlessCalculationService.resolveDimensionlessProperties().
 *
 * All fields are mandatory: the service always computes every value from Mode B
 * (fluid species / composition + temperature).  Callers must not receive undefined.
 *
 * Units:
 *   Re     — dimensionless
 *   Pr     — dimensionless
 *   Gr     — dimensionless
 *   Ra     — dimensionless (= Gr · Pr)
 *   lambda — W/(m·K)   thermal conductivity
 *   mu_f   — Pa·s      dynamic viscosity at bulk temperature
 *   nu_f   — m²/s      kinematic viscosity = mu_f / rho (required by rotating-surface correlations)
 */
export class ResolvedDimensionlessPropsDto {
  @ApiProperty({ description: 'Reynolds number — 0 when w_m_s = 0 (natural convection)' })
  @IsNumber() Re: number;

  @ApiProperty({ description: 'Prandtl number' })
  @IsNumber() Pr: number;

  @ApiProperty({ description: 'Grashof number — 0 when T_surface_K is not supplied' })
  @IsNumber() Gr: number;

  @ApiProperty({ description: 'Rayleigh number = Gr · Pr' })
  @IsNumber() Ra: number;

  @ApiProperty({ description: 'Thermal conductivity λ [W/(m·K)]' })
  @IsNumber() lambda: number;

  @ApiProperty({ description: 'Dynamic viscosity μ at bulk temperature [Pa·s]' })
  @IsNumber() mu_f: number;

  @ApiProperty({ description: 'Kinematic viscosity ν = μ/ρ at bulk temperature [m²/s]' })
  @IsNumber() nu_f: number;
}
