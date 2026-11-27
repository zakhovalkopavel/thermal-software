import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UnreactedPhaseState } from '../../enums/unreacted-phase-state.enum';
import { PhaseEquilibriumGlassPointsDto } from './phase-equilibrium-glass-points.dto';
import { PhaseEquilibriumViscosityDto } from './phase-equilibrium-viscosity.dto';

export class PhaseEquilibriumUnreactedDto {
  @ApiProperty()
  materialId: string;

  @ApiProperty()
  phaseId: string;

  @ApiProperty()
  phase: string;

  @ApiProperty()
  formula: string;

  @ApiProperty({ description: 'Original amount [% of the fired body]' })
  originalPercent: number;

  @ApiProperty()
  originalMass: number;

  @ApiProperty({ description: 'Unreacted amount [% of the fired body]' })
  unreactedPercent: number;

  @ApiProperty()
  unreactedMass: number;

  @ApiProperty({ description: 'Unreacted share of the original amount [%]' })
  unreactedShare: number;

  @ApiProperty({ enum: UnreactedPhaseState })
  state: UnreactedPhaseState;

  @ApiPropertyOptional({
    type: 'object',
    additionalProperties: { type: 'number' },
    description: 'Composition [wt%]; glass remainders only',
  })
  composition?: Record<string, number>;

  @ApiPropertyOptional({ type: PhaseEquilibriumViscosityDto, nullable: true })
  viscosity?: PhaseEquilibriumViscosityDto | null;

  @ApiPropertyOptional({ type: PhaseEquilibriumGlassPointsDto, nullable: true })
  glassPoints?: PhaseEquilibriumGlassPointsDto | null;
}
