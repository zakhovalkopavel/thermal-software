import { ApiProperty } from '@nestjs/swagger';

export class CompositionValidRangeDto {
  @ApiProperty()
  min: number;

  @ApiProperty()
  max: number;
}
