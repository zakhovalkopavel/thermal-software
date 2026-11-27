import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PhasePartSource } from '../../enums/phase-part-source.enum';
import { UnreactedPhaseState } from '../../enums/unreacted-phase-state.enum';
import { PhaseEquilibriumGlassPointsDto } from './phase-equilibrium-glass-points.dto';
import { PhaseEquilibriumViscosityDto } from './phase-equilibrium-viscosity.dto';

export class PhaseEquilibriumPartDto {
  @ApiProperty({ enum: PhasePartSource })
  source: PhasePartSource;

  @ApiProperty()
  name: string;

  @ApiProperty({ description: '% of the fired body' })
  percent: number;

  @ApiProperty({ description: 'kg' })
  mass: number;

  @ApiProperty({
    type: 'object',
    additionalProperties: { type: 'number' },
    description: 'Composition [wt%]',
  })
  composition: Record<string, number>;

  @ApiPropertyOptional()
  materialId?: string;

  @ApiPropertyOptional()
  phaseId?: string;

  @ApiPropertyOptional({ enum: UnreactedPhaseState })
  state?: UnreactedPhaseState;

  @ApiPropertyOptional({
    type: PhaseEquilibriumViscosityDto,
    nullable: true,
    description: 'η at T; null when no model applies',
  })
  viscosity?: PhaseEquilibriumViscosityDto | null;

  @ApiPropertyOptional({
    type: PhaseEquilibriumGlassPointsDto,
    nullable: true,
    description: 'Glass points; null for slag models or liquid at T',
  })
  glassPoints?: PhaseEquilibriumGlassPointsDto | null;
}
