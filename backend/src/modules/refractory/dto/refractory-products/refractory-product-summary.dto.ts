import { ApiProperty } from '@nestjs/swagger';
import { TemperatureRangeDto } from '../../../../common/thermal/dto/temperature-range.dto';
import { RefractoryThermalMaterial } from '../../enums/refractory-thermal-material.enum';

export class RefractoryProductSummaryDto {
  @ApiProperty({ enum: RefractoryThermalMaterial, example: RefractoryThermalMaterial.CHAMOTTE_1000 })
  materialId: RefractoryThermalMaterial;

  @ApiProperty()
  name: string;

  @ApiProperty()
  description: string;

  @ApiProperty({ type: TemperatureRangeDto, description: 'Emissivity validity range [K]; ε is clamped outside it' })
  emissivityRange_K: TemperatureRangeDto;
}
