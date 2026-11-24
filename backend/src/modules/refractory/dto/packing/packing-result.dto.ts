import { ApiProperty } from '@nestjs/swagger';

const PACKING_MODELS = ['CPM', 'Furnas'];

export class PackingResultDto {
  @ApiProperty({ enum: PACKING_MODELS })
  model: string;

  @ApiProperty({ description: 'Packing fraction φ (0–1)' })
  packingFraction_phi: number;

  @ApiProperty({ description: 'Initial porosity (0–1)' })
  porosity_initial: number;

  @ApiProperty()
  effectivePackingDensity: number;
}
