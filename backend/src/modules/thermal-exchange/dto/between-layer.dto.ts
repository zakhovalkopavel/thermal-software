import { ApiProperty } from '@nestjs/swagger';

export class BetweenLayerDto {
  @ApiProperty()
  name:     string;
  @ApiProperty()
  tCelsius: number;
}
