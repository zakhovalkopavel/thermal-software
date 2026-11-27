import { ApiProperty } from '@nestjs/swagger';
import { PhaseEquilibriumPartDto } from './phase-equilibrium-part.dto';

export class PhaseEquilibriumBlockDto {
  @ApiProperty({ description: '% of the fired body' })
  percent: number;

  @ApiProperty({ description: 'kg' })
  mass: number;

  @ApiProperty({
    type: 'object',
    additionalProperties: { type: 'number' },
    description: 'Bulk composition [wt%]',
  })
  composition: Record<string, number>;

  @ApiProperty({ type: [PhaseEquilibriumPartDto] })
  parts: PhaseEquilibriumPartDto[];
}
