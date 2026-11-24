import { ApiProperty } from '@nestjs/swagger';
import { EquationValidityDto } from './equation-validity.dto';

export class MixtureValidityDto {
  @ApiProperty({ description: 'True when every component is inRange and not rangeUnknown' })
  allInRange: boolean;

  @ApiProperty({
    type: 'object',
    additionalProperties: { $ref: '#/components/schemas/EquationValidityDto' },
    description: 'Per-component validity keyed by species',
  })
  components: Record<string, EquationValidityDto>;
}
