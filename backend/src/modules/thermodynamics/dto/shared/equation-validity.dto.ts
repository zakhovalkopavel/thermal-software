import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Additive boundary metadata for thermophysical equation evaluations.
 * Numeric property fields stay unchanged; callers may ignore this object.
 */
export class EquationValidityDto {
  @ApiProperty({ description: 'Temperature requested by the caller [K]' })
  requestedT: number;

  @ApiProperty({
    description:
      'Temperature used by the base correlation [K]. For clamp: the clamped T. ' +
      'For NASA H/S/G extrapolation: the boundary T at which Cp was taken.',
  })
  effectiveT: number;

  @ApiPropertyOptional({
    nullable: true,
    description: 'Correlation lower T bound [K]; null when the source range is unknown',
    type: Number,
  })
  min: number | null;

  @ApiPropertyOptional({
    nullable: true,
    description: 'Correlation upper T bound [K]; null when the source range is unknown',
    type: Number,
  })
  max: number | null;

  @ApiProperty({ description: 'True when requestedT lies inside a known [min, max]' })
  inRange: boolean;

  @ApiProperty({ description: 'True when the source did not publish a temperature range' })
  rangeUnknown: boolean;

  @ApiProperty({
    enum: ['none', 'clamped', 'extrapolated'],
    description: 'none = in range; clamped = warn-and-clamp; extrapolated = NASA boundary-Cp extension',
  })
  action: 'none' | 'clamped' | 'extrapolated';

  @ApiPropertyOptional({ description: 'Human-readable boundary note' })
  message?: string;

  @ApiPropertyOptional({ description: 'Second requested endpoint for averages [K]' })
  requestedT2?: number;

  @ApiPropertyOptional({ description: 'Second effective endpoint for averages [K]' })
  effectiveT2?: number;

  @ApiPropertyOptional({ description: 'Requested pressure [Pa] when pressure limits apply' })
  requestedP?: number;

  @ApiPropertyOptional({ description: 'Effective pressure [Pa] when pressure limits apply' })
  effectiveP?: number;

  @ApiPropertyOptional({ nullable: true, type: Number, description: 'Lower pressure bound [Pa]' })
  minP?: number | null;

  @ApiPropertyOptional({ nullable: true, type: Number, description: 'Upper pressure bound [Pa]' })
  maxP?: number | null;
}

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
