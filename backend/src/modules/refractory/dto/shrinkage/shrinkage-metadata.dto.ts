import { ApiProperty } from '@nestjs/swagger';
import { ShrinkageParametersDto } from './shrinkage-parameters.dto';

const SHRINKAGE_METHODS = ['master-sintering-curve', 'chemical-based'];

export class ShrinkageMetadataDto {
  @ApiProperty({ type: String, format: 'date-time' })
  calculatedAt: Date;

  @ApiProperty()
  mixDensity_kgm3: number;

  @ApiProperty()
  theoreticalDensity_kgm3: number;

  @ApiProperty()
  greenPorosity_percent: number;

  @ApiProperty()
  finalPorosity_percent: number;

  @ApiProperty()
  maxShrinkage_volumetric_percent: number;

  @ApiProperty()
  tempAtMaxShrinkage_C: number;

  @ApiProperty({ enum: SHRINKAGE_METHODS })
  method: string;

  @ApiProperty({ type: ShrinkageParametersDto })
  parameters: ShrinkageParametersDto;
}
