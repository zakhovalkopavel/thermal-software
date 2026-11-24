import { ApiProperty } from '@nestjs/swagger';

export class ViscosityTemperatureRangeDto {
  @ApiProperty()
  min_C: number;

  @ApiProperty()
  max_C: number;
}
