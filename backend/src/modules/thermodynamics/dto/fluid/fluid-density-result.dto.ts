import { ApiProperty } from '@nestjs/swagger';

export class FluidDensityResultDto {
  @ApiProperty({
    description:
      'Mass density [kg/m³]: Helmholtz EOS when CoolProp keys are linked for all species; else ideal gas ρ = P·M/(R·T)',
  })
  rho_kg_m3: number;

  @ApiProperty({ description: 'Mixture molar mass [kg/mol]' })
  molecularWeight_kg_mol: number;

  @ApiProperty({ description: 'Temperature at which density was evaluated [K]' })
  T_K: number;

  @ApiProperty({ description: 'Pressure used [Pa]' })
  P_Pa: number;
}

