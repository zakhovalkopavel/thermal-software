import { ApiProperty } from '@nestjs/swagger';

export class TemperatureRangeDto {
  @ApiProperty({ description: 'Lower bound [K]', example: 600 })
  min: number;

  @ApiProperty({ description: 'Upper bound [K]', example: 1400 })
  max: number;
}
