import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AlgorithmMode } from '../../enums/algorithm-mode.enum';
import { ConfidenceLevel } from '../../enums/confidence-level.enum';
import { PhaseEquilibriumMethod } from '../../enums/phase-equilibrium-method.enum';
import { PhaseEquilibriumComparisonDto } from './phase-equilibrium-comparison.dto';

export class PhaseEquilibriumRunMetadataDto {
  @ApiProperty({ enum: AlgorithmMode })
  engine: AlgorithmMode;

  @ApiProperty({ enum: PhaseEquilibriumMethod })
  method: PhaseEquilibriumMethod;

  @ApiProperty({ enum: ConfidenceLevel })
  confidence: ConfidenceLevel;

  @ApiProperty({ description: 'Firing temperature [°C]' })
  temperature: number;

  @ApiProperty({ description: 'Hold time [h]' })
  holdTime_hours: number;

  @ApiProperty({ description: 'Fired mass of the body [kg]' })
  totalMass: number;

  @ApiProperty({ description: 'Reacted matrix [% of the fired body]' })
  reactedPercent: number;

  @ApiProperty({ type: String, format: 'date-time' })
  calculatedAt: Date;

  @ApiPropertyOptional({ type: PhaseEquilibriumComparisonDto })
  comparison?: PhaseEquilibriumComparisonDto;
}
