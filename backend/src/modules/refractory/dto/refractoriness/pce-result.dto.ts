import { ApiProperty } from '@nestjs/swagger';

export class PceResultDto {
  @ApiProperty()
  coneNumber: number;

  @ApiProperty()
  equivalentTemperature_C: number;

  @ApiProperty()
  description: string;
}
