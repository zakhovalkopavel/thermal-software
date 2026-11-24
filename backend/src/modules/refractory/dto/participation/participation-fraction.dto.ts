import { IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ParticipationFractionDto {
  @ApiProperty({ example: 1.0, description: 'Lower sieve size in mm' })
  @IsNumber()
  dMin_mm: number;

  @ApiProperty({ example: 5.0, description: 'Upper sieve size in mm' })
  @IsNumber()
  dMax_mm: number;

  @ApiProperty({ example: 0.28, description: 'Mass fraction of this size class (0–1)' })
  @IsNumber()
  massFraction: number;
}
