import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { LegacyVariant } from '../../enums/legacy-variant.enum';

export class PhaseEquilibriumComparisonDto {
  @ApiProperty({ description: 'CALPHAD liquid [% of matrix]' })
  calphadLiquidPercent: number;

  @ApiPropertyOptional({ nullable: true, description: 'Legacy liquid [% of matrix]; null when unavailable' })
  legacyLiquidPercent: number | null;

  @ApiProperty({ enum: LegacyVariant })
  legacyVariant: LegacyVariant;

  @ApiPropertyOptional({ nullable: true, description: 'Legacy − CALPHAD liquid [percentage points]' })
  liquidPercentDelta: number | null;

  @ApiPropertyOptional({ description: 'Why the legacy engine was skipped' })
  legacyUnavailableReason?: string;
}
