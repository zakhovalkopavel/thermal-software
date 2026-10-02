import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { FuelPhase } from '../../enums/fuel-phase.enum';

export class FuelSummaryDto {
  @ApiProperty() id: string;
  @ApiProperty() name: string;
  @ApiProperty({ enum: FuelPhase }) phase: FuelPhase;
  @ApiProperty({ description: 'Lower heating value [J/kg]' }) lhv_Jkg: number;
  @ApiProperty({ description: 'Formation enthalpy of the fuel at 298.15 K [J/kg]' })
  heatOfFormation_Jkg: number;
  @ApiPropertyOptional({
    type: 'object', additionalProperties: { type: 'number' },
    description: 'Gaseous fuel mole fractions (gas presets only)',
  })
  moleFractions?: Record<string, number>;
  @ApiProperty({ description: 'Stoichiometric dry air per kg fuel [kg/kg]' }) stoichAir_kgkg: number;
}
