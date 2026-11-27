import { ApiProperty } from '@nestjs/swagger';
import { PhaseEquilibriumBlockDto } from './phase-equilibrium-block.dto';
import { PhaseEquilibriumCrystalDto } from './phase-equilibrium-crystal.dto';

export class PhaseEquilibriumMatrixAtTemperatureDto {
  @ApiProperty({ type: PhaseEquilibriumBlockDto })
  liquid: PhaseEquilibriumBlockDto;

  @ApiProperty({ type: [PhaseEquilibriumCrystalDto] })
  crystals: PhaseEquilibriumCrystalDto[];
}
