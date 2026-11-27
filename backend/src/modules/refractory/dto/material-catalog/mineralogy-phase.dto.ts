import { ApiProperty } from '@nestjs/swagger';

export class MineralogyPhaseDto {
  @ApiProperty({ example: 'mullite' })
  phaseId: string;

  @ApiProperty({ description: 'Amount of the phase in the as-delivered material [wt%]' })
  wt: number;
}
