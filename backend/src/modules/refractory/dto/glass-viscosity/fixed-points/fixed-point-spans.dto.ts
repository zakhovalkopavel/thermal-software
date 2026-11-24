import { ApiProperty } from '@nestjs/swagger';

export class FixedPointSpansDto {
  @ApiProperty()
  meltingToStrain_C: number;

  @ApiProperty()
  workingToSoftening_C: number;

  @ApiProperty()
  softeningToAnnealing_C: number;

  @ApiProperty()
  annealingToStrain_C: number;
}
