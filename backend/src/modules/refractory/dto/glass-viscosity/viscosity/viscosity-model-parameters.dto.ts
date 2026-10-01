import { ApiProperty } from '@nestjs/swagger';
import { ViscosityTemperatureRangeDto } from './viscosity-temperature-range.dto';

export class ViscosityModelParametersDto {
  @ApiProperty({ description: 'Pre-exponential constant' })
  A: number;

  @ApiProperty({ description: 'Activation energy parameter [K]' })
  B: number;

  @ApiProperty({ required: false, description: 'VFT temperature [K]; absent for Arrhenius' })
  T0?: number;

  @ApiProperty({ type: ViscosityTemperatureRangeDto })
  temperatureRange: ViscosityTemperatureRangeDto;
}
