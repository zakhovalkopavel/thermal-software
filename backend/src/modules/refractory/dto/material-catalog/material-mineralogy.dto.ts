import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MineralogyPhaseDto } from './mineralogy-phase.dto';

export class MaterialMineralogyDto {
  @ApiProperty({ type: [MineralogyPhaseDto] })
  phases: MineralogyPhaseDto[];

  @ApiProperty({ description: 'Citation or short source note for the phase amounts' })
  source: string;

  @ApiPropertyOptional({
    description: 'Amorphous remainder [wt% of material]; computed when not stored',
  })
  amorphous_wt?: number;
}
