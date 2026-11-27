import { ApiProperty } from '@nestjs/swagger';
import { PhaseEquilibriumAfterCoolingDto } from './phase-equilibrium-after-cooling.dto';
import { PhaseEquilibriumAtTemperatureDto } from './phase-equilibrium-at-temperature.dto';
import { PhaseEquilibriumFractionResultDto } from './phase-equilibrium-fraction-result.dto';
import { PhaseEquilibriumMatrixDto } from './phase-equilibrium-matrix.dto';
import { PhaseEquilibriumRunMetadataDto } from './phase-equilibrium-run-metadata.dto';
import { PhaseEquilibriumUnreactedDto } from './phase-equilibrium-unreacted.dto';

/** Response of `POST /refractory/phase-equilibrium`. */
export class PhaseEquilibriumResultDto {
  @ApiProperty({ type: PhaseEquilibriumAtTemperatureDto })
  atTemperature: PhaseEquilibriumAtTemperatureDto;

  @ApiProperty({ type: PhaseEquilibriumAfterCoolingDto })
  afterCooling: PhaseEquilibriumAfterCoolingDto;

  @ApiProperty({ type: [PhaseEquilibriumUnreactedDto] })
  unreactedOriginalPhases: PhaseEquilibriumUnreactedDto[];

  @ApiProperty({ type: [PhaseEquilibriumFractionResultDto] })
  fractions: PhaseEquilibriumFractionResultDto[];

  @ApiProperty({ type: PhaseEquilibriumMatrixDto })
  matrix: PhaseEquilibriumMatrixDto;

  @ApiProperty({ type: PhaseEquilibriumRunMetadataDto })
  metadata: PhaseEquilibriumRunMetadataDto;

  @ApiProperty({ type: [String] })
  warnings: string[];
}
