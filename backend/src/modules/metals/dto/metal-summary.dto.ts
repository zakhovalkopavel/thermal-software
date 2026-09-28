import { ApiProperty } from '@nestjs/swagger';
import { TemperatureRangeDto } from '../../../common/thermal/dto/temperature-range.dto';
import { MetalMaterial } from '../enums/metal-material.enum';

export class MetalSummaryDto {
  @ApiProperty({ enum: MetalMaterial, example: MetalMaterial.AISI_304 })
  materialId: MetalMaterial;

  @ApiProperty({ example: 'AISI 304 stainless steel' })
  name: string;

  @ApiProperty()
  description: string;

  @ApiProperty({ type: TemperatureRangeDto, description: 'Emissivity validity range [K]; ε is clamped outside it' })
  emissivityRange_K: TemperatureRangeDto;
}
