import { ApiProperty } from '@nestjs/swagger';
import { ParticipationFactorDto } from './participation-factor.dto';

export class NormalizedParticipationFactorDto extends ParticipationFactorDto {
  @ApiProperty()
  normalizedParticipation: number;
}
