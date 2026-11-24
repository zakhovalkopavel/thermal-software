import { ApiProperty } from '@nestjs/swagger';
import { ParticleSizeRangeDto } from './particle-size-range.dto';

const SIZE_TABLE_SCHEMA = {
  type: 'object',
  additionalProperties: { $ref: '#/components/schemas/ParticleSizeRangeDto' },
} as const;

export class ParticleSizesDto {
  @ApiProperty({ ...SIZE_TABLE_SCHEMA, description: 'Standard size fractions keyed by size code' })
  standard: Record<string, ParticleSizeRangeDto>;

  @ApiProperty({ ...SIZE_TABLE_SCHEMA, description: 'Coarse → ultra-fine classifications' })
  classifications: Record<string, ParticleSizeRangeDto>;

  @ApiProperty({ ...SIZE_TABLE_SCHEMA, description: 'Cement grades' })
  cement: Record<string, ParticleSizeRangeDto>;

  @ApiProperty({ ...SIZE_TABLE_SCHEMA, description: 'Mesh sizes' })
  mesh: Record<string, ParticleSizeRangeDto>;

  @ApiProperty({ ...SIZE_TABLE_SCHEMA, description: 'FEPA F (macro) grits' })
  fepaF: Record<string, ParticleSizeRangeDto>;

  @ApiProperty({ ...SIZE_TABLE_SCHEMA, description: 'FEPA P (coated abrasive) grits' })
  fepaP: Record<string, ParticleSizeRangeDto>;
}
