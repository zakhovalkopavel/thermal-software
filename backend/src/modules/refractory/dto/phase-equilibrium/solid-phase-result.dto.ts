import { ApiProperty } from '@nestjs/swagger';

const COMPOSITION_MAP = { type: 'object', additionalProperties: { type: 'number' } } as const;

export class SolidPhaseResultDto {
  @ApiProperty({ description: 'Solid share [%]' })
  percent: number;

  @ApiProperty({ description: 'Solid mass in units of totalMass' })
  mass: number;

  @ApiProperty(COMPOSITION_MAP)
  composition: Record<string, number>;

  @ApiProperty({ type: [String] })
  mineralPhases: string[];

  @ApiProperty({ ...COMPOSITION_MAP, description: 'Components above 0.01 %' })
  components: Record<string, number>;
}
