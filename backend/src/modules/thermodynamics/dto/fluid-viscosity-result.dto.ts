import { ApiProperty } from '@nestjs/swagger';

export class FluidViscosityResultDto {
  @ApiProperty({ description: 'Dynamic viscosity μ [Pa·s]' })
  mu_Pa_s: number;

  @ApiProperty({ description: 'Kinematic viscosity ν = μ/ρ [m²/s]' })
  nu_m2s: number;

  @ApiProperty({ description: 'Density used for ν [kg/m³]' })
  rho_kg_m3: number;

  @ApiProperty({ description: 'Temperature at which properties were evaluated [K]' })
  T_K: number;
}

