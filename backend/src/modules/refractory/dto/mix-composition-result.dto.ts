import { ApiProperty } from '@nestjs/swagger';
import { CompositionBasis } from '../enums/composition-basis.enum';
import { OxideCompositionDto } from './common.dto';
import { NonOxideComponentsDto } from './non-oxide-components.dto';

export class MixCompositionResultDto {
  @ApiProperty({ enum: CompositionBasis, description: 'All *_wt values except lossOnIgnition_wt are % of fired mass' })
  basis: CompositionBasis;

  @ApiProperty({ description: 'Loss on ignition (H2O, CO2, OH, Organic) [wt% of raw mix]' })
  lossOnIgnition_wt: number;

  @ApiProperty({ type: OxideCompositionDto, description: 'The 8 accepted oxides [wt% of fired mass]' })
  acceptedOxides_wt: OxideCompositionDto;

  @ApiProperty({
    type: OxideCompositionDto,
    description: 'Accepted oxides rescaled to Σ = 100; input for phase-equilibrium, mineral-phases, refractoriness, thermal-conductivity. Empty when no accepted oxide is present.',
  })
  acceptedOxides_normalized: OxideCompositionDto;

  @ApiProperty({
    type: 'object',
    additionalProperties: { type: 'number' },
    description: 'Oxides not accepted by the chemical endpoints [wt% of fired mass]',
    example: { B2O3: 0.3 },
  })
  otherOxides_wt: Record<string, number>;

  @ApiProperty({ type: NonOxideComponentsDto })
  nonOxideComponents_wt: NonOxideComponentsDto;

  @ApiProperty({ description: 'Metal impurities below 1 wt% of their material, dropped [% of fired mass]' })
  droppedMetals_wt: number;

  @ApiProperty({ description: 'True density of the fired mix [kg/m³]' })
  trueDensity_kgm3: number;

  @ApiProperty({ type: [String] })
  warnings: string[];
}
