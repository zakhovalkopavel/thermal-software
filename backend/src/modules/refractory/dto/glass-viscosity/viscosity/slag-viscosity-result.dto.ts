import { ApiProperty } from '@nestjs/swagger';
import { SLAG_THERMAL_STATES } from '../../../constants/slag-thermal-states.constants';
import { ViscosityModel } from '../../../enums/viscosity-model.enum';

const SLAG_MODELS = [ViscosityModel.IIDA, ViscosityModel.NAKAMOTO_2007];

export class SlagViscosityResultDto {
  @ApiProperty({ nullable: true, description: 'null below liquidus' })
  viscosity_Pas: number | null;

  @ApiProperty({ nullable: true, description: 'log₁₀(η / Pa·s); null below liquidus' })
  logViscosity_Pas: number | null;

  @ApiProperty()
  temperature_C: number;

  @ApiProperty()
  liquidusTemperature_C: number;

  @ApiProperty({ enum: SLAG_THERMAL_STATES })
  thermalState: string;

  @ApiProperty({ enum: SLAG_MODELS })
  model: ViscosityModel;

  @ApiProperty({ type: [String] })
  warnings: string[];

  @ApiProperty({ required: false, description: 'Iida only' })
  B_i_simple?: number;

  @ApiProperty({ required: false, description: 'Iida only' })
  B_i_star?: number;

  @ApiProperty({ required: false, description: 'Iida only' })
  alpha_Al2O3?: number;

  @ApiProperty({ required: false, description: 'Iida only' })
  E_activation?: number;

  @ApiProperty({ required: false, description: 'Nakamoto only' })
  E_total_J_mol?: number;

  @ApiProperty({ required: false, description: 'Nakamoto only' })
  lnA?: number;

  @ApiProperty({ required: false, description: 'Nakamoto only' })
  M_avg?: number;

  @ApiProperty({ type: 'object', additionalProperties: { type: 'number' }, description: 'Normalized composition used for the calculation' })
  composition: Record<string, number>;

  @ApiProperty({ enum: ViscosityModel, required: false })
  secondaryModel?: ViscosityModel;
}
