import { ApiProperty } from '@nestjs/swagger';

export class ShrinkageStageDto {
  @ApiProperty({ example: 'total' })
  name: string;

  @ApiProperty({ type: [Number] })
  temperatures_C: number[];

  @ApiProperty({ type: [Number] })
  shrinkage_volumetric_percent: number[];

  @ApiProperty({ type: [Number] })
  shrinkage_linear_percent: number[];

  @ApiProperty({ type: [Number], description: 'Relative density at each temperature (0–1)' })
  relativeDensity: number[];

  @ApiProperty()
  description: string;
}
