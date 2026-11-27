import { ApiProperty } from '@nestjs/swagger';
import { PhaseEquilibriumMethod } from '../../enums/phase-equilibrium-method.enum';
import { PhaseEquilibriumMatrixAfterCoolingDto } from './phase-equilibrium-matrix-after-cooling.dto';
import { PhaseEquilibriumMatrixAtTemperatureDto } from './phase-equilibrium-matrix-at-temperature.dto';

export class PhaseEquilibriumMatrixDto {
  @ApiProperty({ description: 'Reacted matrix [% of the fired body]' })
  percent: number;

  @ApiProperty({
    type: 'object',
    additionalProperties: { type: 'number' },
    description: 'Matrix composition [wt%]',
  })
  composition: Record<string, number>;

  @ApiProperty({ example: 'Al2O3-CaO-SiO2' })
  system: string;

  @ApiProperty({ enum: PhaseEquilibriumMethod })
  method: PhaseEquilibriumMethod;

  @ApiProperty({ description: '[°C]' })
  solidus_C: number;

  @ApiProperty({ description: '[°C]' })
  liquidus_C: number;

  @ApiProperty({ type: PhaseEquilibriumMatrixAtTemperatureDto })
  atTemperature: PhaseEquilibriumMatrixAtTemperatureDto;

  @ApiProperty({ type: PhaseEquilibriumMatrixAfterCoolingDto })
  afterCooling: PhaseEquilibriumMatrixAfterCoolingDto;
}
