import { ApiProperty } from '@nestjs/swagger';
import { ShrinkageResultDto } from '../shrinkage/shrinkage-result.dto';
import { WaterDemandRangeResultDto } from '../water-demand/water-demand-range-result.dto';

export class BlendOptimizationResultDto {
  @ApiProperty({ example: 'Andreasen' })
  method: string;

  @ApiProperty({ description: 'Distribution modulus' })
  q: number;

  @ApiProperty({ example: 'Self-compacting' })
  scenario: string;

  @ApiProperty({ example: 'CPM' })
  packingModel: string;

  @ApiProperty({ type: [Number] })
  massFractions: number[];

  @ApiProperty({ type: [Number] })
  massFractionsRoundedPercent: number[];

  @ApiProperty({ description: 'Skeletal (particle) density [g/mL]' })
  rhoSkeletal_gml: number;

  @ApiProperty({ description: 'Green bulk density [g/mL]' })
  rhoBulk_gml_green: number;

  @ApiProperty({ description: 'Packing efficiency (0–1)' })
  packingEfficiency: number;

  @ApiProperty()
  porosity_percent_green: number;

  @ApiProperty({ description: 'Water demand for standard workability [%]' })
  waterDemand_percent: number;

  @ApiProperty({ type: WaterDemandRangeResultDto })
  waterDemandRange: WaterDemandRangeResultDto;

  @ApiProperty({ type: ShrinkageResultDto })
  shrinkage: ShrinkageResultDto;

  @ApiProperty({ required: false, description: 'Higher is better' })
  optimizationScore?: number;

  @ApiProperty({ required: false, description: '1 = best' })
  rank?: number;
}
