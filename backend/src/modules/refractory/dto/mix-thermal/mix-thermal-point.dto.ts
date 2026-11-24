import { ApiProperty } from '@nestjs/swagger';

export class MixThermalPointDto {
  @ApiProperty()
  temperature_C: number;

  @ApiProperty({ description: 'Dense solid conductivity [W/(m·K)]' })
  lambdaSolid_WmK: number;

  @ApiProperty({ description: 'Effective conductivity at the requested porosity [W/(m·K)]' })
  lambdaEffective_WmK: number;

  @ApiProperty({ description: 'Specific heat of the fired solid [J/(kg·K)]' })
  specificHeat_JkgK: number;

  @ApiProperty({ description: 'λ_eff / (ρ_bulk · Cp) [m²/s]' })
  thermalDiffusivity_m2s: number;
}
