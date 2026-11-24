import { ApiProperty } from '@nestjs/swagger';

export class ParticipationFactorDto {
  @ApiProperty()
  fractionIndex: number;

  @ApiProperty()
  dMin_mm: number;

  @ApiProperty()
  dMax_mm: number;

  @ApiProperty()
  dMean_mm: number;

  @ApiProperty()
  massFraction: number;

  @ApiProperty({ description: '1/√dMean' })
  participationFactor: number;

  @ApiProperty({ description: 'participationFactor × massFraction' })
  effectiveParticipation: number;
}
