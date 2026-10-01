import { ApiProperty } from '@nestjs/swagger';
import { NormalizedParticipationFactorDto } from './normalized-participation-factor.dto';
import { ParticipationFactorDto } from './participation-factor.dto';

export class ParticipationResultDto {
  @ApiProperty({ type: [ParticipationFactorDto] })
  participationFactors: ParticipationFactorDto[];

  @ApiProperty()
  totalParticipation: number;

  @ApiProperty({ type: [NormalizedParticipationFactorDto] })
  normalizedParticipation: NormalizedParticipationFactorDto[];
}
