import { ApiProperty } from '@nestjs/swagger';
import { ConversionDirectionDto } from './glass-viscosity.dto';

const COMPOSITION_MAP = { type: 'object', additionalProperties: { type: 'number' } } as const;

export class CompositionConversionResultDto {
  @ApiProperty({ ...COMPOSITION_MAP, description: 'Normalized input composition' })
  input: Record<string, number>;

  @ApiProperty(COMPOSITION_MAP)
  output: Record<string, number>;

  @ApiProperty({ enum: ConversionDirectionDto })
  direction: ConversionDirectionDto;
}
