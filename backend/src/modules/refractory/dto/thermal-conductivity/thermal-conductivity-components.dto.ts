import { ApiProperty } from '@nestjs/swagger';

const COMPONENT_MAP = { type: 'object', additionalProperties: { type: 'number' } } as const;

export class ThermalConductivityComponentsDto {
  @ApiProperty(COMPONENT_MAP)
  oxideFormers: Record<string, number>;

  @ApiProperty(COMPONENT_MAP)
  oxideModifiers: Record<string, number>;

  @ApiProperty(COMPONENT_MAP)
  fluorides: Record<string, number>;

  @ApiProperty(COMPONENT_MAP)
  chlorides: Record<string, number>;
}
