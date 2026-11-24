import { ApiProperty } from '@nestjs/swagger';

export class VtfParametersDto {
  @ApiProperty()
  A: number;

  @ApiProperty({ description: '[K]' })
  B: number;

  @ApiProperty({ description: '[K]' })
  T0: number;
}
