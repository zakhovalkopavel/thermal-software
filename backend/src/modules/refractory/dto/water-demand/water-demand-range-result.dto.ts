import { ApiProperty } from '@nestjs/swagger';

export class WaterDemandRangeResultDto {
  @ApiProperty({ description: 'FIRM workability [% by mass]' })
  min: number;

  @ApiProperty({ description: 'STANDARD workability [% by mass]' })
  typical: number;

  @ApiProperty({ description: 'FLOWABLE workability [% by mass]' })
  max: number;
}
