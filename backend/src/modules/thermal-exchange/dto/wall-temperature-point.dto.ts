import { ApiProperty } from '@nestjs/swagger';

export class WallTemperaturePointDto {
  @ApiProperty({ description: 'Distance from the inner surface [mm]' })
  x_mm: number;

  @ApiProperty({ description: 'Local temperature [°C]' })
  tCelsius: number;
}
