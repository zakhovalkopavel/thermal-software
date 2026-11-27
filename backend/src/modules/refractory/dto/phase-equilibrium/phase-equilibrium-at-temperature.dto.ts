import { ApiProperty } from '@nestjs/swagger';
import { PhaseEquilibriumBlockDto } from './phase-equilibrium-block.dto';
import { PhaseEquilibriumCrystalDto } from './phase-equilibrium-crystal.dto';

export class PhaseEquilibriumAtTemperatureDto {
  @ApiProperty({ type: PhaseEquilibriumBlockDto })
  liquid: PhaseEquilibriumBlockDto;

  @ApiProperty({ type: PhaseEquilibriumBlockDto })
  glass: PhaseEquilibriumBlockDto;

  @ApiProperty({ type: [PhaseEquilibriumCrystalDto] })
  crystals: PhaseEquilibriumCrystalDto[];
}
