import { ApiProperty } from '@nestjs/swagger';

export class PhaseEquilibriumCrystalOriginDto {
  @ApiProperty({ description: '% of the fired body from the matrix equilibrium' })
  matrix: number;

  @ApiProperty({ description: '% of the fired body from unreacted unchanged cores' })
  unreactedUnchanged: number;

  @ApiProperty({ description: '% of the fired body from unreacted transformed cores' })
  unreactedTransformed: number;
}
