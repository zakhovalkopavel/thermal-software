import { ApiProperty } from '@nestjs/swagger';
import { SLAG_THERMAL_STATES } from '../../../constants/slag-thermal-states.constants';

export class ViscosityProfilePointDto {
  @ApiProperty()
  temperature_C: number;

  @ApiProperty({ nullable: true, description: 'log₁₀(η / Pa·s); null below liquidus for slag models' })
  logViscosity: number | null;

  @ApiProperty({ nullable: true, description: 'null below liquidus for slag models' })
  viscosity_Pas: number | null;

  @ApiProperty({ enum: SLAG_THERMAL_STATES, required: false, description: 'Slag models only' })
  thermalState?: string;
}
