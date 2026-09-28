import { ApiProperty } from '@nestjs/swagger';
import { ThermalCriteriaDto } from './thermal-criteria.dto';

export class TemperatureAtDepthResultDto {
  @ApiProperty({ description: 'Temperature T(x,τ) (°C)' })    temperature: number;
  @ApiProperty({ type: ThermalCriteriaDto })                   criteria: ThermalCriteriaDto;
}
