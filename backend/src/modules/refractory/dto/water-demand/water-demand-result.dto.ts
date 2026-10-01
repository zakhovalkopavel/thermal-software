import { ApiProperty } from '@nestjs/swagger';

export class WaterDemandResultDto {
  @ApiProperty({ description: 'Water demand [% by mass]' })
  waterDemand_pct: number;
}
