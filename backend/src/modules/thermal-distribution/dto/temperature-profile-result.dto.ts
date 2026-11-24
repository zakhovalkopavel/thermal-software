import { ApiProperty } from '@nestjs/swagger';
import { ThermalCriteriaDto } from './thermal-criteria.dto';

export class TemperatureProfileResultDto {
  @ApiProperty({ description: 'Temperatures at requested depths (°C)', type: [Number] })
  temperatures: number[];
  @ApiProperty({ type: ThermalCriteriaDto }) criteria: ThermalCriteriaDto;
}
