import { ApiProperty } from '@nestjs/swagger';

export class PceModifiedResultDto {
  @ApiProperty()
  coneNumber: number;

  @ApiProperty()
  deformationTemperature_C: number;

  @ApiProperty()
  description: string;
}
