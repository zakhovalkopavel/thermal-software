import { ApiProperty } from '@nestjs/swagger';
import { LiquidPhaseResultDto } from './liquid-phase-result.dto';
import { SolidPhaseResultDto } from './solid-phase-result.dto';
import { PhaseEquilibriumMetadataDto } from './phase-equilibrium-metadata.dto';

export class PhaseCalculationResponseDto {
  @ApiProperty({ type: LiquidPhaseResultDto })
  liquid: {
    percent: number;
    mass: number;
    composition: Record<string, number>;
  };
  @ApiProperty({ type: SolidPhaseResultDto })
  solid: {
    percent: number;
    mass: number;
    composition: Record<string, number>;
    mineralPhases: string[];
  };
  @ApiProperty({ type: PhaseEquilibriumMetadataDto })
  metadata: {
    temperature: number;
    totalMass: number;
    eutecticTemperature: number;
    estimatedLiquidus: number;
    calculatedAt: Date;
  };
  @ApiProperty({ type: [String] })
  warnings: string[];
}
