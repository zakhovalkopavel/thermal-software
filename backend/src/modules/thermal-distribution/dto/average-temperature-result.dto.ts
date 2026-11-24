import { ApiProperty } from '@nestjs/swagger';
import { ThermalCriteriaDto } from './thermal-criteria.dto';

export class AverageTemperatureResultDto {
  @ApiProperty({ description: 'Volume-average temperature T̄(τ) (°C)' }) temperature: number;
  @ApiProperty({ type: ThermalCriteriaDto })                             criteria: ThermalCriteriaDto;
}
