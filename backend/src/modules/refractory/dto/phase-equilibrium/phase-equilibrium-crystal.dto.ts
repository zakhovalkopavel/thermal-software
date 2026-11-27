import { ApiProperty } from '@nestjs/swagger';
import { PhaseEquilibriumCrystalOriginDto } from './phase-equilibrium-crystal-origin.dto';

export class PhaseEquilibriumCrystalDto {
  @ApiProperty({ example: 'corundum' })
  phaseId: string;

  @ApiProperty()
  phase: string;

  @ApiProperty()
  formula: string;

  @ApiProperty({ description: '% of the fired body' })
  percent: number;

  @ApiProperty({ description: 'kg' })
  mass: number;

  @ApiProperty({ type: PhaseEquilibriumCrystalOriginDto })
  origin: PhaseEquilibriumCrystalOriginDto;
}
