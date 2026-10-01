import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { ApiPropertyOptions } from '@nestjs/swagger';
import { CorrelationName } from '../../enums/correlation-name.enum';
import { FlowGeometry } from '../../enums/flow-geometry.enum';

const VALIDITY_RANGE: ApiPropertyOptions = {
  type: 'array',
  minItems: 2,
  maxItems: 2,
  items: { oneOf: [{ type: 'number' }, { type: 'string', enum: ['Infinity'] }] },
};

export class CorrelationListEntryDto {
  @ApiProperty({ enum: CorrelationName, description: 'Correlation key' }) name: CorrelationName;
  @ApiProperty({ enum: FlowGeometry, isArray: true, description: 'Geometries the correlation applies to' }) geometry: FlowGeometry[];
  @ApiPropertyOptional({ ...VALIDITY_RANGE, description: 'Validity range [Re_min, Re_max]; Re_max is "Infinity" without upper bound' }) Re?: [number, number | string];
  @ApiPropertyOptional({ ...VALIDITY_RANGE, description: 'Validity range [Pr_min, Pr_max]; Pr_max is "Infinity" without upper bound' }) Pr?: [number, number | string];
  @ApiPropertyOptional({ ...VALIDITY_RANGE, description: 'Validity range [Ra_min, Ra_max]; Ra_max is "Infinity" without upper bound' }) Ra?: [number, number | string];
}
