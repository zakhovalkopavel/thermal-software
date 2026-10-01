import { ApiProperty } from '@nestjs/swagger';

const COMPONENT_MAP = { type: 'object', additionalProperties: { type: 'number' } } as const;

export class RefractorinessComponentsDto {
  @ApiProperty(COMPONENT_MAP)
  oxides: Record<string, number>;

  @ApiProperty(COMPONENT_MAP)
  fluorides: Record<string, number>;

  @ApiProperty(COMPONENT_MAP)
  chlorides: Record<string, number>;
}
