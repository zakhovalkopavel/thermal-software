import { ApiProperty } from '@nestjs/swagger';

export class FluidDensityResultDto {
  @ApiProperty({ description: 'Ideal-gas density ρ = P·M / (R·T) [kg/m³]' })
  rho_kg_m3: number;

  @ApiProperty({ description: 'Mixture molar mass [kg/mol]' })
  molecularWeight_kg_mol: number;

  @ApiProperty({ description: 'Temperature at which density was evaluated [K]' })
  T_K: number;

  @ApiProperty({ description: 'Pressure used [Pa]' })
  P_Pa: number;
}

